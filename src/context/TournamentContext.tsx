/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GroupLetter, Match, Team, TournamentProfile } from '../types/tournament';
import { INITIAL_TEAMS, OFFICIAL_TEAM_DATA_LIST } from '../lib/constants';
import {
  generateGroupMatches,
  generateRoundOf16Matches,
  GROUPS,
  sanitizeAndDeduplicateMatches,
  synchronizeKnockoutProgression,
} from '../lib/tournamentEngine';
import { getReliableClubLogo } from '../lib/logoDictionary';
import {
  createTournamentInSupabase,
  deleteTournamentFromSupabase,
  fetchTournamentDataFromSupabase,
  fetchTournamentsFromSupabase,
  getStoredCredentials,
  pushDataToSupabase,
  saveTournamentMatchScoreToSupabase,
  saveTournamentTieScoresToSupabase,
  testSupabaseConnection,
  updateTournamentTeamsInSupabase,
} from '../lib/supabaseClient';

// Helper to reliably update or insert match scores into matches array
function applyMatchToMatchesList(
  currentList: Match[],
  incomingMatch: Match,
  teamsList: Team[]
): Match[] {
  const list = [...currentList];

  const getTeamName = (teamId: string) => {
    const t = teamsList.find(
      (tm) => tm.id === teamId || (tm.name && tm.name.toLowerCase().trim() === teamId.toLowerCase().trim())
    );
    return t ? t.name.toLowerCase().trim() : (teamId || '').toLowerCase().trim();
  };

  const incomingHomeName = getTeamName(incomingMatch.home_team_id);
  const incomingAwayName = getTeamName(incomingMatch.away_team_id);
  const incomingLeg = incomingMatch.leg || 1;
  const incomingType = incomingMatch.match_type || 'Group';

  let foundIndex = -1;

  // 1. Exact ID match (if not a synthesized tie ID)
  if (incomingMatch.id && !incomingMatch.id.startsWith('tie-')) {
    foundIndex = list.findIndex((m) => m.id === incomingMatch.id);
  }

  // 2. Match by exact team IDs and leg
  if (foundIndex === -1) {
    foundIndex = list.findIndex(
      (m) =>
        m.home_team_id === incomingMatch.home_team_id &&
        m.away_team_id === incomingMatch.away_team_id &&
        (m.leg || 1) === incomingLeg &&
        (m.match_type || 'Group') === incomingType
    );
  }

  // 3. Match by resolved team names and leg (handles UUID vs team-X format)
  if (foundIndex === -1 && incomingHomeName && incomingAwayName) {
    foundIndex = list.findIndex(
      (m) =>
        getTeamName(m.home_team_id) === incomingHomeName &&
        getTeamName(m.away_team_id) === incomingAwayName &&
        (m.leg || 1) === incomingLeg &&
        (m.match_type || 'Group') === incomingType
    );
  }

  // 4. Match by reverse pairing if leg matches
  if (foundIndex === -1 && incomingHomeName && incomingAwayName) {
    foundIndex = list.findIndex(
      (m) =>
        ((getTeamName(m.home_team_id) === incomingHomeName && getTeamName(m.away_team_id) === incomingAwayName) ||
          (getTeamName(m.home_team_id) === incomingAwayName && getTeamName(m.away_team_id) === incomingHomeName)) &&
        (m.leg || 1) === incomingLeg &&
        (m.match_type || 'Group') === incomingType
    );
  }

  if (foundIndex !== -1) {
    list[foundIndex] = {
      ...list[foundIndex],
      ...incomingMatch,
      id: list[foundIndex].id, // Keep the stable established ID
      home_score: incomingMatch.home_score,
      away_score: incomingMatch.away_score,
      is_played: incomingMatch.is_played ?? (incomingMatch.home_score !== null && incomingMatch.away_score !== null),
      home_penalties: incomingMatch.home_penalties,
      away_penalties: incomingMatch.away_penalties,
    };
  } else {
    list.push(incomingMatch);
  }

  return list;
}

const STORAGE_PROFILES_KEY = 'efootball_tournament_profiles_v3';
const STORAGE_ACTIVE_PROFILE_KEY = 'efootball_active_profile_id_v3';
const STORAGE_FINAL_LEGS_KEY = 'efootball_final_legs_v3';

export const DEFAULT_STARTER_PROFILE: TournamentProfile = {
  id: '68ec4678-f63d-402f-845d-91761f80f5e2',
  name: 'Season 1 - E-Championship',
  created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
  last_saved_at: new Date().toISOString(),
  current_phase: 'Group Stage - Round 1/6',
  group_mode: 'auto',
  avatar_id: 'trophy-gold',
  avatar_color: '#2563eb',
};

const INITIAL_PROFILES_PRESET: TournamentProfile[] = [
  DEFAULT_STARTER_PROFILE,
  {
    id: 'tourney-masters-cup-2',
    name: 'Premier eLeague Masters',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    last_saved_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    current_phase: 'Group Stage - Round 3/6',
    group_mode: 'auto',
    avatar_id: 'shield-blue',
    avatar_color: '#0284c7',
  },
  {
    id: 'tourney-champions-arena-3',
    name: 'Champions Clash 2026',
    created_at: new Date(Date.now() - 3600000 * 24 * 12).toISOString(),
    last_saved_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    current_phase: 'Knockout - 16 Bora',
    group_mode: 'manual',
    avatar_id: 'flame-orange',
    avatar_color: '#ea580c',
  },
];

// Helper to sanitize, deduplicate, and heal team rosters (guaranteeing exactly 24 unique teams across Groups A-F)
export function sanitizeAndDeduplicateTeams(rawTeams: Team[]): Team[] {
  if (!rawTeams || !Array.isArray(rawTeams) || rawTeams.length === 0) {
    return INITIAL_TEAMS;
  }

  // 1. Check for duplicates in rawTeams (by name or id)
  const seenNames = new Set<string>();
  const uniqueTeams: Team[] = [];

  rawTeams.forEach((t) => {
    const rawName = (t.name || '').trim();
    const lowerName = rawName.toLowerCase();
    if (lowerName && !seenNames.has(lowerName)) {
      seenNames.add(lowerName);
      uniqueTeams.push(t);
    }
  });

  // 2. Check if uniqueTeams is healthy (e.g., at least 20 unique teams with valid names)
  const isHealthyRoster =
    uniqueTeams.length >= 20 &&
    OFFICIAL_TEAM_DATA_LIST.filter((o) =>
      uniqueTeams.some((u) => u.name.toLowerCase().trim() === o.name.toLowerCase().trim())
    ).length >= 16;

  // 3. If the roster was heavily corrupted (e.g. all set to Christian or < 16 recognized teams), rebuild from official list
  if (!isHealthyRoster || uniqueTeams.length !== 24) {
    // Reconstruct clean 24 teams preserving any legitimate custom WhatsApp contacts or edits if matched
    return OFFICIAL_TEAM_DATA_LIST.map((official, idx) => {
      const existingUserEdit = uniqueTeams.find(
        (u) => u.name.toLowerCase().trim() === official.name.toLowerCase().trim()
      );

      const reliableLogo = getReliableClubLogo(
        official.clubName,
        existingUserEdit?.logo_url || official.logoUrl
      );

      return {
        id: existingUserEdit?.id && !existingUserEdit.id.startsWith('team-')
          ? existingUserEdit.id
          : `team-${idx + 1}`,
        name: official.name,
        club_crest_name: official.clubName,
        logo_url: reliableLogo,
        group_id: official.groupId as GroupLetter,
        pot: official.pot,
        whatsapp: existingUserEdit?.whatsapp || existingUserEdit?.phone || official.whatsapp || '',
        phone: existingUserEdit?.phone || existingUserEdit?.whatsapp || official.phone || '',
      };
    });
  }

  // 4. If uniqueTeams has 24 unique teams, ensure each group A-F has 4 teams, and clean logos
  const groupCounts: Record<GroupLetter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  let needsGroupRebalance = false;

  uniqueTeams.forEach((t) => {
    if (t.group_id && groupCounts[t.group_id] !== undefined) {
      groupCounts[t.group_id]++;
    } else {
      needsGroupRebalance = true;
    }
  });

  // If any group has != 4 teams, rebalance by matching with official group IDs or distributing
  if (needsGroupRebalance || Object.values(groupCounts).some((c) => c !== 4)) {
    return uniqueTeams.map((t, idx) => {
      const lowerName = (t.name || '').toLowerCase().trim();
      const official = OFFICIAL_TEAM_DATA_LIST.find(
        (o) => o.name.toLowerCase().trim() === lowerName
      ) || OFFICIAL_TEAM_DATA_LIST[idx];

      const clubName = t.club_crest_name || official?.clubName || 'Club';
      const reliableLogo = getReliableClubLogo(clubName, t.logo_url || official?.logoUrl);

      return {
        ...t,
        id: t.id || `team-${idx + 1}`,
        name: t.name || official?.name || `Team ${idx + 1}`,
        club_crest_name: clubName,
        logo_url: reliableLogo,
        group_id: (official?.groupId || GROUPS[Math.floor(idx / 4)] || 'A') as GroupLetter,
        pot: official?.pot || ((idx % 4) + 1),
        whatsapp: t.whatsapp || t.phone || official?.whatsapp || '',
        phone: t.phone || t.whatsapp || official?.phone || '',
      };
    });
  }

  // Standard enrichment for healthy 24-team list
  return uniqueTeams.map((t, idx) => {
    const lowerName = (t.name || '').toLowerCase().trim();
    const official = OFFICIAL_TEAM_DATA_LIST.find(
      (o) => o.name.toLowerCase().trim() === lowerName
    );

    const clubCrestName = t.club_crest_name || official?.clubName || 'Club';
    const reliableLogo = getReliableClubLogo(clubCrestName, t.logo_url || official?.logoUrl);

    return {
      ...t,
      id: t.id || `team-${idx + 1}`,
      name: t.name || official?.name || `Team ${idx + 1}`,
      club_crest_name: clubCrestName,
      logo_url: reliableLogo,
      group_id: (t.group_id || official?.groupId || 'A') as GroupLetter,
      pot: t.pot || official?.pot || 1,
      whatsapp: t.whatsapp ?? t.phone ?? official?.whatsapp ?? '',
      phone: t.phone ?? t.whatsapp ?? official?.phone ?? '',
    };
  });
}

// Backward-compatible alias
export const syncTeamsWithOfficialData = sanitizeAndDeduplicateTeams;

interface TournamentContextType {
  activeTournamentId: string;
  activeProfile: TournamentProfile;
  profiles: TournamentProfile[];
  teams: Team[];
  matches: Match[];
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  isSupabaseConnected: boolean;
  finalIsTwoLegs: boolean;
  refreshData: () => Promise<void>;
  setActiveTournamentId: (id: string) => Promise<void>;
  saveMatchScore: (updatedMatch: Match) => Promise<boolean>;
  saveTieScores: (leg1: Match, leg2: Match) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<void>;
  createTournament: (
    profile: TournamentProfile,
    newTeams: Team[],
    newMatches: Match[]
  ) => Promise<void>;
  updateTeams: (newTeams: Team[]) => Promise<void>;
  updateTeamsAndMatches: (newTeams: Team[], newMatches: Match[]) => Promise<void>;
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  setProfiles: React.Dispatch<React.SetStateAction<TournamentProfile[]>>;
  setFinalIsTwoLegs: (val: boolean) => void;
  checkSupabaseConnection: () => Promise<void>;
  resetToOfficialRoster: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'offline' | 'error'>('synced');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // 1. Profiles State
  const [profiles, setProfiles] = useState<TournamentProfile[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_PROFILES_PRESET;
  });

  // 2. Active Tournament ID
  const [activeTournamentId, setActiveTournamentIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_PROFILE_KEY);
      if (savedId) {
        if (savedId === 'tourney-season-1-default') {
          // Transparent migration to official Supabase profile
          const oldTeams = localStorage.getItem('efootball_teams_tourney-season-1-default');
          const oldMatches = localStorage.getItem('efootball_matches_tourney-season-1-default');
          if (oldTeams && !localStorage.getItem('efootball_teams_68ec4678-f63d-402f-845d-91761f80f5e2')) {
            localStorage.setItem('efootball_teams_68ec4678-f63d-402f-845d-91761f80f5e2', oldTeams);
          }
          if (oldMatches && !localStorage.getItem('efootball_matches_68ec4678-f63d-402f-845d-91761f80f5e2')) {
            localStorage.setItem('efootball_matches_68ec4678-f63d-402f-845d-91761f80f5e2', oldMatches);
          }
          localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, DEFAULT_STARTER_PROFILE.id);
          return DEFAULT_STARTER_PROFILE.id;
        }
        return savedId;
      }
    }
    return DEFAULT_STARTER_PROFILE.id;
  });

  const activeProfile = useMemo(() => {
    return (
      profiles.find((p) => p.id === activeTournamentId) ||
      profiles[0] ||
      DEFAULT_STARTER_PROFILE
    );
  }, [profiles, activeTournamentId]);

  // 3. Teams State strictly isolated to activeTournamentId
  const [teams, setTeams] = useState<Team[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`efootball_teams_${activeTournamentId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length === 24) {
            return syncTeamsWithOfficialData(parsed);
          }
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: activeTournamentId }));
  });

  // 4. Matches State strictly isolated to activeTournamentId
  const [matches, setMatches] = useState<Match[]>(() => {
    let effectiveTeams: Team[] = INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: activeTournamentId }));
    if (typeof window !== 'undefined') {
      const savedTeams = localStorage.getItem(`efootball_teams_${activeTournamentId}`);
      if (savedTeams) {
        try {
          const pt = JSON.parse(savedTeams);
          if (Array.isArray(pt) && pt.length === 24) {
            effectiveTeams = syncTeamsWithOfficialData(pt);
          }
        } catch {}
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`efootball_matches_${activeTournamentId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sanitizeAndDeduplicateMatches(parsed, effectiveTeams);
          }
        } catch {
          // fallback
        }
      }
    }
    const groupMatches = generateGroupMatches(effectiveTeams);
    const initialRo16 = generateRoundOf16Matches(effectiveTeams, groupMatches);
    return [...groupMatches, ...initialRo16].map((m) => ({
      ...m,
      tournament_id: activeTournamentId,
    }));
  });

  const [finalIsTwoLegs, setFinalIsTwoLegs] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_FINAL_LEGS_KEY) === 'true';
    }
    return false;
  });

  // Check Supabase connection and pull tournaments & active tournament data
  const checkSupabaseConnection = useCallback(async () => {
    const creds = getStoredCredentials();
    if (creds.url && creds.anonKey) {
      const res = await testSupabaseConnection(creds.url, creds.anonKey);
      setIsSupabaseConnected(res.success);
      if (res.success) {
        setSyncStatus('synced');
        const remoteTourneys = await fetchTournamentsFromSupabase();
        if (remoteTourneys.success && remoteTourneys.data && remoteTourneys.data.length > 0) {
          const remoteList: TournamentProfile[] = remoteTourneys.data.map((rt) => ({
            id: rt.id,
            name: rt.name,
            created_at: rt.created_at,
            last_saved_at: rt.last_saved_at || rt.created_at,
            current_phase: rt.current_phase || 'Group Stage - Round 1/6',
            group_mode: rt.group_mode || 'auto',
            avatar_id: rt.avatar_id || 'trophy-gold',
            avatar_color: rt.avatar_color || '#2563eb',
          }));

          setProfiles((prev) => {
            const map = new Map<string, TournamentProfile>();
            prev.forEach((p) => map.set(p.id, p));
            remoteList.forEach((rp) => map.set(rp.id, rp));
            const merged = Array.from(map.values());
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(merged));
            }
            return merged;
          });

          // Determine target profile to display
          const savedActiveId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACTIVE_PROFILE_KEY) : null;
          const normalizedActiveId = savedActiveId === 'tourney-season-1-default' ? DEFAULT_STARTER_PROFILE.id : savedActiveId;

          let targetProfileId = normalizedActiveId && remoteList.some((p) => p.id === normalizedActiveId)
            ? normalizedActiveId
            : (normalizedActiveId || DEFAULT_STARTER_PROFILE.id);

          setActiveTournamentIdState(targetProfileId);
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, targetProfileId);
          }

          // 1. Read local storage teams & matches for this profile FIRST
          let localTeams: Team[] = [];
          let localMatches: Match[] = [];

          if (typeof window !== 'undefined') {
            const savedT = localStorage.getItem(`efootball_teams_${targetProfileId}`);
            if (savedT) {
              try {
                const pt = JSON.parse(savedT);
                if (Array.isArray(pt) && pt.length === 24) {
                  localTeams = syncTeamsWithOfficialData(pt);
                }
              } catch {}
            }

            const savedM = localStorage.getItem(`efootball_matches_${targetProfileId}`);
            if (savedM) {
              try {
                const pm = JSON.parse(savedM);
                if (Array.isArray(pm) && pm.length > 0) {
                  localMatches = pm;
                }
              } catch {}
            }
          }

          // 2. Fetch remote data from Supabase
          const remoteData = await fetchTournamentDataFromSupabase(targetProfileId);
          if (remoteData.success) {
            let effectiveTeams: Team[] = localTeams.length === 24 ? localTeams : [];
            if (effectiveTeams.length !== 24 && remoteData.teams && remoteData.teams.length > 0) {
              effectiveTeams = syncTeamsWithOfficialData(remoteData.teams);
            }
            if (effectiveTeams.length !== 24) {
              effectiveTeams = INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: targetProfileId }));
            }

            // Combine remote matches with local matches (local played matches take priority)
            const remoteMatches = remoteData.matches || [];
            const mergedSource = [
              ...localMatches.filter((lm) => lm.is_played),
              ...remoteMatches,
            ];

            const cleanMatches = sanitizeAndDeduplicateMatches(
              mergedSource.length > 0 ? mergedSource : localMatches,
              effectiveTeams
            );

            setTeams(effectiveTeams);
            setMatches(cleanMatches);

            if (typeof window !== 'undefined') {
              localStorage.setItem(`efootball_teams_${targetProfileId}`, JSON.stringify(effectiveTeams));
              localStorage.setItem(`efootball_matches_${targetProfileId}`, JSON.stringify(cleanMatches));
            }

            // Async push merged state to Supabase so remote database is updated
            pushDataToSupabase(effectiveTeams, cleanMatches, targetProfileId);
          } else {
            // Fetch failed, keep local data and attempt background push
            if (localTeams.length === 24) setTeams(localTeams);
            if (localMatches.length > 0) setMatches(sanitizeAndDeduplicateMatches(localMatches, localTeams));

            if (localTeams.length === 24 && localMatches.length > 0) {
              pushDataToSupabase(localTeams, localMatches, targetProfileId);
            }
          }
        }
      } else {
        setSyncStatus('offline');
      }
    } else {
      setSyncStatus('offline');
    }
  }, []);

  useEffect(() => {
    checkSupabaseConnection();
  }, [checkSupabaseConnection]);

  // Persist profiles to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
      localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, activeTournamentId);
    }
  }, [profiles, activeTournamentId]);

  // Persist teams for active profile
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTournamentId && teams && teams.length > 0) {
      localStorage.setItem(`efootball_teams_${activeTournamentId}`, JSON.stringify(teams));
    }
  }, [teams, activeTournamentId]);

  // Persist matches for active profile directly
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTournamentId && matches && matches.length > 0) {
      localStorage.setItem(`efootball_matches_${activeTournamentId}`, JSON.stringify(matches));
    }
  }, [matches, activeTournamentId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_FINAL_LEGS_KEY, String(finalIsTwoLegs));
    }
  }, [finalIsTwoLegs]);

  // Strict Supabase Data Re-Fetch strictly isolated by activeTournamentId
  const refreshData = useCallback(async () => {
    if (!activeTournamentId) return;

    if (isSupabaseConnected) {
      setSyncStatus('saving');
      const remote = await fetchTournamentDataFromSupabase(activeTournamentId);
      if (remote.success) {
        let currentEffectiveTeams = teams;
        if (remote.teams && remote.teams.length > 0) {
          currentEffectiveTeams = syncTeamsWithOfficialData(remote.teams);
          setTeams(currentEffectiveTeams);
        }
        if (remote.matches && remote.matches.length > 0) {
          // Merge remote and current local played matches
          const mergedSource = [
            ...remote.matches,
            ...matches.filter((m) => m.is_played),
          ];
          const clean = sanitizeAndDeduplicateMatches(mergedSource, currentEffectiveTeams);
          setMatches(clean);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`efootball_matches_${activeTournamentId}`, JSON.stringify(clean));
          }
        }
      }
      setSyncStatus('synced');
    } else {
      // Offline fallback: load from local storage
      const localTeams = localStorage.getItem(`efootball_teams_${activeTournamentId}`);
      let effTeams = teams;
      if (localTeams) {
        try {
          effTeams = syncTeamsWithOfficialData(JSON.parse(localTeams));
          setTeams(effTeams);
        } catch {
          // ignore
        }
      }
      const localMatches = localStorage.getItem(`efootball_matches_${activeTournamentId}`);
      if (localMatches) {
        try {
          const parsed = JSON.parse(localMatches);
          setMatches(sanitizeAndDeduplicateMatches(parsed, effTeams));
        } catch {
          // ignore
        }
      }
    }
  }, [activeTournamentId, isSupabaseConnected, teams, matches]);

  // Switch Active Profile (Load Savefile)
  const setActiveTournamentId = useCallback(
    async (profileId: string) => {
      setActiveTournamentIdState(profileId);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, profileId);
      }

      let loadedTeams: Team[] | null = null;
      let loadedMatches: Match[] | null = null;

      // 1. Try local storage cache
      if (typeof window !== 'undefined') {
        const localTeamsStr = localStorage.getItem(`efootball_teams_${profileId}`);
        if (localTeamsStr) {
          try {
            loadedTeams = syncTeamsWithOfficialData(JSON.parse(localTeamsStr));
          } catch {
            // ignore
          }
        }
        const localMatchesStr = localStorage.getItem(`efootball_matches_${profileId}`);
        if (localMatchesStr) {
          try {
            loadedMatches = JSON.parse(localMatchesStr);
          } catch {
            // ignore
          }
        }
      }

      // 2. Fetch from Supabase strictly with tournament_id
      if (isSupabaseConnected) {
        setSyncStatus('saving');
        const remote = await fetchTournamentDataFromSupabase(profileId);
        if (remote.success && remote.teams && remote.teams.length > 0) {
          loadedTeams = syncTeamsWithOfficialData(remote.teams);
          if (remote.matches && remote.matches.length > 0) {
            loadedMatches = sanitizeAndDeduplicateMatches(remote.matches, loadedTeams);
          }
        }
        setSyncStatus('synced');
      }

      // 3. Set loaded or fallback
      if (loadedTeams && loadedTeams.length > 0) {
        setTeams(loadedTeams);
      } else {
        const freshTeams = INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: profileId }));
        setTeams(freshTeams);
        loadedTeams = freshTeams;
      }

      if (loadedMatches && loadedMatches.length > 0) {
        setMatches(sanitizeAndDeduplicateMatches(loadedMatches, loadedTeams));
      } else {
        const groupMatches = generateGroupMatches(loadedTeams);
        const initialRo16 = generateRoundOf16Matches(loadedTeams, groupMatches);
        setMatches(
          [...groupMatches, ...initialRo16].map((m) => ({
            ...m,
            tournament_id: profileId,
          }))
        );
      }
    },
    [isSupabaseConnected]
  );

  // Save single match score and sync
  const saveMatchScore = useCallback(
    async (updatedMatch: Match): Promise<boolean> => {
      setSyncStatus('saving');
      const enrichedMatch: Match = {
        ...updatedMatch,
        tournament_id: activeTournamentId,
      };

      // 1. Optimistic local update + knockout bracket synchronization
      let nextMatchesState: Match[] = [];
      setMatches((prev) => {
        const nextList = applyMatchToMatchesList(prev, enrichedMatch, teams);
        const sync = synchronizeKnockoutProgression(nextList, teams, finalIsTwoLegs);
        nextMatchesState = sync.updatedMatches;
        return nextMatchesState;
      });

      // 2. Persist to localStorage immediately
      if (typeof window !== 'undefined' && activeTournamentId) {
        localStorage.setItem(
          `efootball_matches_${activeTournamentId}`,
          JSON.stringify(nextMatchesState)
        );
      }

      // 3. Update profile timestamp
      const now = new Date().toISOString();
      setProfiles((prev) => {
        const updated = prev.map((p) =>
          p.id === activeTournamentId ? { ...p, last_saved_at: now } : p
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
        }
        return updated;
      });

      // 4. Supabase update with tournament_id & team mapping
      let success = true;
      if (isSupabaseConnected) {
        const res = await saveTournamentMatchScoreToSupabase(
          enrichedMatch,
          activeTournamentId,
          teams
        );
        success = res.success;
      }

      setSyncStatus(isSupabaseConnected ? (success ? 'synced' : 'error') : 'offline');
      return success;
    },
    [activeTournamentId, isSupabaseConnected, teams, finalIsTwoLegs]
  );

  // Save double-leg tie scores and sync
  const saveTieScores = useCallback(
    async (leg1: Match, leg2?: Match): Promise<boolean> => {
      setSyncStatus('saving');
      const enrichedLeg1: Match = {
        ...leg1,
        tournament_id: activeTournamentId,
      };
      const enrichedLeg2: Match | undefined = leg2
        ? {
            ...leg2,
            tournament_id: activeTournamentId,
          }
        : undefined;

      // 1. Optimistic update + knockout progression using robust updater
      let nextMatchesState: Match[] = [];
      setMatches((prev) => {
        let nextList = applyMatchToMatchesList(prev, enrichedLeg1, teams);
        if (enrichedLeg2) {
          nextList = applyMatchToMatchesList(nextList, enrichedLeg2, teams);
        }
        const sync = synchronizeKnockoutProgression(nextList, teams, finalIsTwoLegs);
        nextMatchesState = sync.updatedMatches;
        return nextMatchesState;
      });

      // 2. Persist to localStorage immediately
      if (typeof window !== 'undefined' && activeTournamentId) {
        localStorage.setItem(
          `efootball_matches_${activeTournamentId}`,
          JSON.stringify(nextMatchesState)
        );
      }

      // 3. Update profile timestamp
      const now = new Date().toISOString();
      setProfiles((prev) => {
        const updated = prev.map((p) =>
          p.id === activeTournamentId ? { ...p, last_saved_at: now } : p
        );
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
        }
        return updated;
      });

      // 4. Supabase update
      let success = true;
      if (isSupabaseConnected) {
        const res = await saveTournamentTieScoresToSupabase(
          enrichedLeg1,
          enrichedLeg2,
          activeTournamentId,
          teams
        );
        success = res.success;
      }

      setSyncStatus(isSupabaseConnected ? (success ? 'synced' : 'error') : 'offline');
      return success;
    },
    [activeTournamentId, isSupabaseConnected, teams, finalIsTwoLegs]
  );

  // Delete profile
  const deleteProfile = useCallback(
    async (idToDelete: string) => {
      if (profiles.length <= 1) return;

      if (typeof window !== 'undefined') {
        localStorage.removeItem(`efootball_teams_${idToDelete}`);
        localStorage.removeItem(`efootball_matches_${idToDelete}`);
      }

      if (isSupabaseConnected) {
        await deleteTournamentFromSupabase(idToDelete);
      }

      const remaining = profiles.filter((p) => p.id !== idToDelete);
      setProfiles(remaining);

      if (activeTournamentId === idToDelete) {
        const nextId = remaining[0]?.id || DEFAULT_STARTER_PROFILE.id;
        await setActiveTournamentId(nextId);
      }
    },
    [profiles, isSupabaseConnected, activeTournamentId, setActiveTournamentId]
  );

  // Create new tournament
  const createTournament = useCallback(
    async (
      profile: TournamentProfile,
      newTeams: Team[],
      newMatches: Match[]
    ) => {
      const boundTeams = newTeams.map((t) => ({ ...t, tournament_id: profile.id }));
      const boundMatches = newMatches.map((m) => ({ ...m, tournament_id: profile.id }));

      setProfiles((prev) => [profile, ...prev.filter((p) => p.id !== profile.id)]);
      setActiveTournamentIdState(profile.id);
      setTeams(boundTeams);
      setMatches(boundMatches);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`efootball_teams_${profile.id}`, JSON.stringify(boundTeams));
        localStorage.setItem(`efootball_matches_${profile.id}`, JSON.stringify(boundMatches));
      }

      if (isSupabaseConnected) {
        setSyncStatus('saving');
        await createTournamentInSupabase(
          {
            id: profile.id,
            name: profile.name,
            current_phase: profile.current_phase,
            group_mode: profile.group_mode,
            avatar_id: profile.avatar_id,
            avatar_color: profile.avatar_color,
          },
          boundTeams,
          boundMatches
        );
        setSyncStatus('synced');
      }
    },
    [isSupabaseConnected]
  );

  // Update teams and matches simultaneously with direct Supabase synchronization
  const updateTeamsAndMatches = useCallback(
    async (newTeams: Team[], newMatches: Match[]) => {
      const synced = syncTeamsWithOfficialData(newTeams);
      const cleanMatches = sanitizeAndDeduplicateMatches(newMatches, synced);

      setTeams(synced);
      setMatches(cleanMatches);

      if (typeof window !== 'undefined' && activeTournamentId) {
        localStorage.setItem(`efootball_teams_${activeTournamentId}`, JSON.stringify(synced));
        localStorage.setItem(`efootball_matches_${activeTournamentId}`, JSON.stringify(cleanMatches));
      }

      if (isSupabaseConnected && activeTournamentId) {
        setSyncStatus('saving');
        await pushDataToSupabase(synced, cleanMatches, activeTournamentId);
        setSyncStatus('synced');
      }
    },
    [activeTournamentId, isSupabaseConnected]
  );

  // Update teams with direct Supabase synchronization
  const updateTeams = useCallback(
    async (newTeams: Team[]) => {
      const synced = syncTeamsWithOfficialData(newTeams);
      setTeams(synced);

      if (typeof window !== 'undefined' && activeTournamentId) {
        localStorage.setItem(`efootball_teams_${activeTournamentId}`, JSON.stringify(synced));
      }

      if (isSupabaseConnected && activeTournamentId) {
        setSyncStatus('saving');
        await updateTournamentTeamsInSupabase(synced, activeTournamentId);
        setSyncStatus('synced');
      }
    },
    [activeTournamentId, isSupabaseConnected]
  );

  // Reset to pristine official 24-team roster and generate 72 group fixtures
  const resetToOfficialRoster = useCallback(async () => {
    setSyncStatus('saving');
    const freshTeams: Team[] = OFFICIAL_TEAM_DATA_LIST.map((item, idx) => ({
      id: `team-${idx + 1}`,
      tournament_id: activeTournamentId,
      name: item.name,
      club_crest_name: item.clubName,
      logo_url: item.logoUrl,
      group_id: item.groupId as GroupLetter,
      pot: item.pot,
      whatsapp: item.whatsapp || '',
      phone: item.phone || '',
    }));

    const groupMatches = generateGroupMatches(freshTeams);
    const initialRo16 = generateRoundOf16Matches(freshTeams, groupMatches);
    const freshMatches = [...groupMatches, ...initialRo16].map((m) => ({
      ...m,
      tournament_id: activeTournamentId,
    }));

    setTeams(freshTeams);
    setMatches(freshMatches);

    if (typeof window !== 'undefined') {
      localStorage.setItem(`efootball_teams_${activeTournamentId}`, JSON.stringify(freshTeams));
      localStorage.setItem(`efootball_matches_${activeTournamentId}`, JSON.stringify(freshMatches));
    }

    if (isSupabaseConnected && activeTournamentId) {
      await updateTournamentTeamsInSupabase(freshTeams, activeTournamentId);
      await pushDataToSupabase(freshTeams, freshMatches, activeTournamentId);
    }

    setSyncStatus('synced');
  }, [activeTournamentId, isSupabaseConnected]);

  return (
    <TournamentContext.Provider
      value={{
        activeTournamentId,
        activeProfile,
        profiles,
        teams,
        matches,
        syncStatus,
        isSupabaseConnected,
        finalIsTwoLegs,
        refreshData,
        setActiveTournamentId,
        saveMatchScore,
        saveTieScores,
        deleteProfile,
        createTournament,
        updateTeams,
        updateTeamsAndMatches,
        setTeams,
        setMatches,
        setProfiles,
        setFinalIsTwoLegs,
        checkSupabaseConnection,
        resetToOfficialRoster,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = (): TournamentContextType => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
