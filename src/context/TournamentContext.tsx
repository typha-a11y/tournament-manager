/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { GroupLetter, Match, Team, TournamentProfile } from '../types/tournament';
import { INITIAL_TEAMS, OFFICIAL_TEAM_DATA_LIST } from '../lib/constants';
import { generateGroupMatches, generateRoundOf16Matches, synchronizeKnockoutProgression } from '../lib/tournamentEngine';
import { getReliableClubLogo } from '../lib/logoDictionary';
import {
  createTournamentInSupabase,
  deleteTournamentFromSupabase,
  fetchTournamentDataFromSupabase,
  fetchTournamentsFromSupabase,
  getStoredCredentials,
  saveTournamentMatchScoreToSupabase,
  saveTournamentTieScoresToSupabase,
  testSupabaseConnection,
} from '../lib/supabaseClient';

const STORAGE_PROFILES_KEY = 'efootball_tournament_profiles_v3';
const STORAGE_ACTIVE_PROFILE_KEY = 'efootball_active_profile_id_v3';
const STORAGE_FINAL_LEGS_KEY = 'efootball_final_legs_v3';

export const DEFAULT_STARTER_PROFILE: TournamentProfile = {
  id: 'tourney-season-1-default',
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

// Helper to ensure official team logos & club mappings while preserving user edits
export function syncTeamsWithOfficialData(rawTeams: Team[]): Team[] {
  if (!rawTeams || rawTeams.length === 0) return INITIAL_TEAMS;
  return rawTeams.map((t, idx) => {
    const lowerName = (t.name || '').toLowerCase().trim();
    const isRogerMuncaster = lowerName.includes('roger') || lowerName.includes('muncaster');
    const isJazzynorman = lowerName.includes('jazzy') || lowerName.includes('norman');

    const official =
      OFFICIAL_TEAM_DATA_LIST.find(
        (o) => o.name.toLowerCase().trim() === lowerName
      ) || OFFICIAL_TEAM_DATA_LIST[idx];

    const clubCrestName = t.club_crest_name || (isRogerMuncaster
      ? 'Paris Saint-Germain'
      : isJazzynorman
      ? 'Corinthians'
      : official?.clubName);

    const reliableLogo = getReliableClubLogo(
      clubCrestName || t.name,
      t.logo_url || official?.logoUrl
    );

    const whatsapp = t.whatsapp ?? t.phone ?? official?.whatsapp ?? '';
    const phone = t.phone ?? t.whatsapp ?? official?.phone ?? '';

    return {
      ...t,
      name: t.name || official?.name || `Team ${idx + 1}`,
      whatsapp,
      phone,
      logo_url: reliableLogo,
      club_crest_name: clubCrestName,
      group_id: (t.group_id ?? official?.groupId ?? null) as GroupLetter | null,
      pot: t.pot ?? official?.pot ?? 1,
    };
  });
}

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
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  setProfiles: React.Dispatch<React.SetStateAction<TournamentProfile[]>>;
  setFinalIsTwoLegs: (val: boolean) => void;
  checkSupabaseConnection: () => Promise<void>;
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
      if (savedId) return savedId;
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
          return syncTeamsWithOfficialData(JSON.parse(saved));
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: activeTournamentId }));
  });

  // 4. Matches State strictly isolated to activeTournamentId
  const [matches, setMatches] = useState<Match[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`efootball_matches_${activeTournamentId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    const currentTeams = INITIAL_TEAMS.map((t) => ({ ...t, tournament_id: activeTournamentId }));
    const groupMatches = generateGroupMatches(currentTeams);
    const initialRo16 = generateRoundOf16Matches(currentTeams, groupMatches);
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

  // Check Supabase connection and pull tournaments
  const checkSupabaseConnection = useCallback(async () => {
    const creds = getStoredCredentials();
    if (creds.url && creds.anonKey) {
      const res = await testSupabaseConnection(creds.url, creds.anonKey);
      setIsSupabaseConnected(res.success);
      if (res.success) {
        setSyncStatus('synced');
        const remoteTourneys = await fetchTournamentsFromSupabase();
        if (remoteTourneys.success && remoteTourneys.data && remoteTourneys.data.length > 0) {
          setProfiles((prev) => {
            const mergedMap = new Map<string, TournamentProfile>();
            prev.forEach((p) => mergedMap.set(p.id, p));
            remoteTourneys.data?.forEach((rt) => {
              mergedMap.set(rt.id, {
                id: rt.id,
                name: rt.name,
                created_at: rt.created_at,
                last_saved_at: rt.last_saved_at || rt.created_at,
                current_phase: rt.current_phase || 'Group Stage',
                group_mode: rt.group_mode || 'auto',
                avatar_id: rt.avatar_id || 'trophy-gold',
                avatar_color: rt.avatar_color || '#2563eb',
              });
            });
            return Array.from(mergedMap.values());
          });
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
    if (typeof window !== 'undefined' && activeTournamentId) {
      localStorage.setItem(`efootball_teams_${activeTournamentId}`, JSON.stringify(teams));
    }
  }, [teams, activeTournamentId]);

  // Persist matches for active profile
  useEffect(() => {
    if (typeof window !== 'undefined' && activeTournamentId) {
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
        if (remote.teams && remote.teams.length > 0) {
          const synced = syncTeamsWithOfficialData(remote.teams);
          setTeams(synced);
        }
        if (remote.matches && remote.matches.length > 0) {
          setMatches(remote.matches);
        }
      }
      setSyncStatus('synced');
    } else {
      // Offline fallback: load from local storage
      const localTeams = localStorage.getItem(`efootball_teams_${activeTournamentId}`);
      if (localTeams) {
        try {
          setTeams(syncTeamsWithOfficialData(JSON.parse(localTeams)));
        } catch {
          // ignore
        }
      }
      const localMatches = localStorage.getItem(`efootball_matches_${activeTournamentId}`);
      if (localMatches) {
        try {
          setMatches(JSON.parse(localMatches));
        } catch {
          // ignore
        }
      }
    }
  }, [activeTournamentId, isSupabaseConnected]);

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
            loadedMatches = remote.matches;
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
        setMatches(loadedMatches);
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

      // 1. Optimistic local update
      setMatches((prev) => {
        const nextList = prev.map((m) => (m.id === enrichedMatch.id ? enrichedMatch : m));
        const sync = synchronizeKnockoutProgression(nextList, teams, finalIsTwoLegs);
        return sync.updatedMatches;
      });

      // 2. Update profile timestamp
      const now = new Date().toISOString();
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeTournamentId ? { ...p, last_saved_at: now } : p))
      );

      // 3. Supabase update with tournament_id
      let success = true;
      if (isSupabaseConnected) {
        const res = await saveTournamentMatchScoreToSupabase(enrichedMatch, activeTournamentId);
        success = res.success;
      }

      setSyncStatus('synced');
      return success;
    },
    [activeTournamentId, isSupabaseConnected]
  );

  // Save double-leg tie scores and sync
  const saveTieScores = useCallback(
    async (leg1: Match, leg2: Match): Promise<boolean> => {
      setSyncStatus('saving');
      const enrichedLeg1: Match = {
        ...leg1,
        tournament_id: activeTournamentId,
      };
      const enrichedLeg2: Match = {
        ...leg2,
        tournament_id: activeTournamentId,
      };

      // 1. Optimistic update
      setMatches((prev) => {
        const nextList = prev.map((m) => {
          if (m.id === enrichedLeg1.id) return enrichedLeg1;
          if (m.id === enrichedLeg2.id) return enrichedLeg2;
          return m;
        });
        const sync = synchronizeKnockoutProgression(nextList, teams, finalIsTwoLegs);
        return sync.updatedMatches;
      });

      // 2. Update profile timestamp
      const now = new Date().toISOString();
      setProfiles((prev) =>
        prev.map((p) => (p.id === activeTournamentId ? { ...p, last_saved_at: now } : p))
      );

      // 3. Supabase update
      let success = true;
      if (isSupabaseConnected) {
        const res = await saveTournamentTieScoresToSupabase(
          enrichedLeg1,
          enrichedLeg2,
          activeTournamentId
        );
        success = res.success;
      }

      // 4. Trigger global re-fetch to ensure tables and analytics update
      await refreshData();
      setSyncStatus('synced');
      return success;
    },
    [activeTournamentId, isSupabaseConnected, refreshData]
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
        setTeams,
        setMatches,
        setProfiles,
        setFinalIsTwoLegs,
        checkSupabaseConnection,
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
