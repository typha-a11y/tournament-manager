import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Match, Team } from '../types/tournament';

export const DEFAULT_SUPABASE_URL = 'https://yxzdukkwztpcrmwpznry.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emR1a2t3enRwY3Jtd3B6bnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTczNDYsImV4cCI6MjEwNTczMzM0Nn0.mOinLYgFzGb9tdZ9aoCMDjIL-cuURYxWQdE19-2S4yU';

const LOCAL_STORAGE_URL_KEY = 'efootball_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'efootball_supabase_anon_key';

export function getStoredCredentials(): { url: string; anonKey: string } {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL as string) || '';
  const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_ANON_KEY) || '' : '';

  return {
    url: storedUrl || envUrl || DEFAULT_SUPABASE_URL,
    anonKey: storedKey || envKey || DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function saveStoredCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem(LOCAL_STORAGE_URL_KEY, url.trim());
    else localStorage.removeItem(LOCAL_STORAGE_URL_KEY);

    if (anonKey) localStorage.setItem(LOCAL_STORAGE_ANON_KEY, anonKey.trim());
    else localStorage.removeItem(LOCAL_STORAGE_ANON_KEY);
  }
  resetSupabaseClientInstance();
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredCredentials();
  if (!url || !anonKey) {
    return null;
  }

  try {
    if (!activeClient) {
      activeClient = createClient(url, anonKey);
    }
    return activeClient;
  } catch (err) {
    console.error('Failed to create Supabase client', err);
    return null;
  }
}

export function resetSupabaseClientInstance(): void {
  activeClient = null;
}

export interface SupabaseHealth {
  connected: boolean;
  teamsTableExists: boolean;
  matchesTableExists: boolean;
  teamsCount: number;
  matchesCount: number;
  message: string;
}

export async function testSupabaseConnection(
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string; details?: SupabaseHealth }> {
  try {
    if (!url.startsWith('https://')) {
      return { success: false, message: 'Supabase URL must start with https://' };
    }
    if (!anonKey || anonKey.length < 15) {
      return { success: false, message: 'Invalid Supabase anon public key length.' };
    }

    const client = createClient(url, anonKey);

    let teamsTableExists = false;
    let matchesTableExists = false;
    let teamsCount = 0;
    let matchesCount = 0;

    // Check teams table
    const { data: teamsData, error: teamsError, count: tCount } = await client
      .from('teams')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    if (!teamsError) {
      teamsTableExists = true;
      teamsCount = tCount || (teamsData ? teamsData.length : 0);
    }

    // Check matches table
    const { data: matchesData, error: matchesError, count: mCount } = await client
      .from('matches')
      .select('id', { count: 'exact', head: false })
      .limit(1);

    if (!matchesError) {
      matchesTableExists = true;
      matchesCount = mCount || (matchesData ? matchesData.length : 0);
    }

    if (!teamsTableExists && teamsError?.code === '42P01') {
      return {
        success: true,
        message: 'Connected to Supabase project! Database tables (`teams` and `matches`) are not created yet. Please copy and run the SQL Schema script below in your Supabase SQL Editor.',
        details: {
          connected: true,
          teamsTableExists: false,
          matchesTableExists: false,
          teamsCount: 0,
          matchesCount: 0,
          message: 'Tables need initialization via SQL Editor.',
        },
      };
    }

    if (teamsError && teamsError.code !== '42P01') {
      return { success: false, message: teamsError.message };
    }

    return {
      success: true,
      message: `Successfully connected to Supabase project! (${teamsCount} teams, ${matchesCount} matches stored).`,
      details: {
        connected: true,
        teamsTableExists,
        matchesTableExists,
        teamsCount,
        matchesCount,
        message: 'All systems operational.',
      },
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown connection error';
    return { success: false, message: errorMsg };
  }
}

// =========================================================================
// MULTI-PROFILE (SAVEFILE) SUPABASE METHODS
// =========================================================================

// Fetch all tournaments (profiles) from Supabase
export async function fetchTournamentsFromSupabase(): Promise<{
  success: boolean;
  data?: any[];
  message?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured' };
  }

  try {
    const { data, error } = await client
      .from('tournaments')
      .select('*')
      .order('last_saved_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to fetch tournaments',
    };
  }
}

// Create a new tournament savefile in Supabase with its teams & initial matches
export async function createTournamentInSupabase(
  tournament: {
    id: string;
    name: string;
    current_phase: string;
    group_mode: 'auto' | 'manual';
    avatar_id: string;
    avatar_color: string;
  },
  teams: Team[],
  matches: Match[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase not connected. Saved to local storage.' };
  }

  try {
    // 1. Insert tournament record
    const { error: tErr } = await client.from('tournaments').upsert({
      id: tournament.id,
      name: tournament.name,
      current_phase: tournament.current_phase,
      group_mode: tournament.group_mode,
      avatar_id: tournament.avatar_id,
      avatar_color: tournament.avatar_color,
      last_saved_at: new Date().toISOString(),
    });

    if (tErr) {
      console.warn('Tournament creation warning:', tErr.message);
    }

    // 2. Insert/Upsert teams with tournament_id
    const teamsPayload = teams.map((t) => ({
      id: t.id.startsWith('team-') ? undefined : t.id,
      tournament_id: tournament.id,
      name: t.name,
      club_name: t.club_crest_name || t.name,
      club_crest_name: t.club_crest_name || t.name,
      logo_url: t.logo_url,
      group_id: t.group_id,
      pot: t.pot || 1,
      phone: t.whatsapp || t.phone || '',
      whatsapp: t.whatsapp || t.phone || '',
    }));

    const { data: insertedTeams, error: teamsError } = await client
      .from('teams')
      .upsert(teamsPayload)
      .select('id, name');

    // Create lookup map if new IDs generated
    const nameToId = new Map<string, string>();
    if (insertedTeams) {
      insertedTeams.forEach((t) => nameToId.set(t.name, t.id));
    }

    // 3. Insert matches with tournament_id
    const matchesPayload = matches.map((m) => {
      const homeTeamObj = teams.find((t) => t.id === m.home_team_id);
      const awayTeamObj = teams.find((t) => t.id === m.away_team_id);
      const homeId = homeTeamObj ? nameToId.get(homeTeamObj.name) || m.home_team_id : m.home_team_id;
      const awayId = awayTeamObj ? nameToId.get(awayTeamObj.name) || m.away_team_id : m.away_team_id;

      return {
        tournament_id: tournament.id,
        home_team_id: homeId,
        away_team_id: awayId,
        home_score: m.home_score,
        away_score: m.away_score,
        match_type: m.match_type,
        is_played: m.is_played,
        group_id: m.group_id || null,
        leg: m.leg || 1,
        tie_id: m.tie_id || null,
        round_number: m.round_number || 1,
        home_penalties: m.home_penalties || null,
        away_penalties: m.away_penalties || null,
      };
    });

    if (matchesPayload.length > 0) {
      await client.from('matches').delete().eq('tournament_id', tournament.id);
      await client.from('matches').insert(matchesPayload);
    }

    return { success: true, message: 'Tournament profile synced to Supabase!' };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to create tournament in Supabase',
    };
  }
}

// Delete tournament and all cascading records
export async function deleteTournamentFromSupabase(tournamentId: string): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: true, message: 'Deleted locally.' };
  }

  try {
    await client.from('matches').delete().eq('tournament_id', tournamentId);
    await client.from('teams').delete().eq('tournament_id', tournamentId);
    const { error } = await client.from('tournaments').delete().eq('id', tournamentId);
    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Tournament deleted cleanly from Supabase.' };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Delete failed' };
  }
}

export const OFFICIAL_TEAM_NAME_TO_DB_UUID: Record<string, string> = {
  'huncho': 'd130d67d-26cb-4c72-bd99-b9cf46eb2872',
  'she cheated me': '3f3b6fdd-e05f-41ce-8a78-d00b1863f0fc',
  'elly hunter': '197ed132-1db7-483a-968e-490411b9e297',
  'christian': '2b3b00e0-c671-411b-8c60-4a54b978739b',
  'g.o.a.t': 'd9cb1e1a-cf30-4c17-babf-762afa424a35',
  'ice_emaestro': 'a640a683-3fcf-44e5-b6ea-ddfddaf10d8b',
  'benin': '06ede237-2635-4497-b41b-56ed39db969d',
  'jazzynorman': '173ac006-550b-4af3-8456-7e7d3ba573db',
  'kj warriors': '86cd0421-f7e9-497c-aaa6-bd948317c9cc',
  'nenga': '39c75728-bb04-4cbd-a37c-55b0e0a746f9',
  'roger muncaster': 'e9731f0f-17cf-40df-a9bf-e29e89f28870',
  'mshana ai': '4f88e038-3f9d-4cef-83a6-c94df120c4a7',
  'betwery': '7efc15bc-4c40-4883-b1a5-b89a494a6c81',
  'youngking': '95e955a4-0adc-4022-9041-781791986b07',
  'dedgurury': '86a36097-348b-4cea-9dce-538e66f966c5',
  'wise meek': 'dea79436-afc4-44e9-a712-2c1a0a30601a',
  'budo': '2cc4e45d-c12e-4337-bb65-24fcd835bc8c',
  'ivory coast': '236787b7-3462-40c4-8637-e34b1cc153c2',
  'muhyuzoh': 'df3c8a11-ef25-4631-a136-7504a9c75c96',
  '45balo': '0be7dbf5-2c27-47f9-8545-8f921129a8dd',
  'man of people': '56e53b60-94c9-4c6e-8f5a-c504bbdba159',
  'kachuma': '21ca7d72-5caf-4314-8c66-2622fe69d822',
  'drexypal64': 'c9eb9f44-f398-42dc-aa5c-aa3ce0116a75',
  'moyo': '8129a317-e09c-41f0-bdc8-7d4884cc7d34',
};

export const KNOWN_DB_UUID_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(OFFICIAL_TEAM_NAME_TO_DB_UUID).map(([name, uuid]) => [uuid, name])
);

// Fetch teams and matches for a specific tournament ID
export async function fetchTournamentDataFromSupabase(tournamentId: string): Promise<{
  success: boolean;
  teams?: Team[];
  matches?: Match[];
  message?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured' };
  }

  try {
    // 1. Fetch latest teams for this tournament
    const { data: teamsData, error: tErr } = await client
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (tErr) {
      return { success: false, message: tErr.message };
    }

    let finalTeamsData = teamsData || [];

    // Deduplicate teams strictly by name to prevent multiple duplicate rows
    const uniqueTeamMap = new Map<string, any>();
    const dbIdToName = new Map<string, string>();

    // Seed dbIdToName with known official UUIDs
    Object.entries(KNOWN_DB_UUID_TO_NAME).forEach(([uuid, name]) => {
      dbIdToName.set(uuid, name);
    });

    finalTeamsData.forEach((t) => {
      const cleanName = (t.name || '').trim().toLowerCase();
      if (t.id && cleanName) {
        dbIdToName.set(t.id, cleanName);
      }
      if (cleanName && !uniqueTeamMap.has(cleanName)) {
        uniqueTeamMap.set(cleanName, t);
      }
    });

    const deduplicatedTeams = Array.from(uniqueTeamMap.values());

    // 2. Fetch matches strictly scoped to this tournament
    const { data: matchesData, error: mErr } = await client
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (mErr) {
      return { success: false, message: mErr.message };
    }

    const finalMatchesData = matchesData || [];

    const parsedTeams: Team[] = deduplicatedTeams.map((t, idx) => ({
      id: t.id || `team-${idx + 1}`,
      tournament_id: t.tournament_id || tournamentId,
      name: t.name,
      logo_url: t.logo_url,
      group_id: t.group_id,
      club_crest_name: t.club_name || t.club_crest_name,
      pot: t.pot || 1,
      whatsapp: t.whatsapp || t.phone || '',
      phone: t.phone || t.whatsapp || '',
    }));

    // Map canonical team name -> canonical team ID
    const nameToCanonicalId = new Map<string, string>();
    parsedTeams.forEach((t) => {
      nameToCanonicalId.set(t.name.trim().toLowerCase(), t.id);
    });

    const parsedMatches: Match[] = finalMatchesData.map((m) => {
      // Resolve home_team_id and away_team_id:
      // If the match stored an old DB team UUID, resolve to its team name, then to the canonical team ID
      const homeName = dbIdToName.get(m.home_team_id);
      const awayName = dbIdToName.get(m.away_team_id);

      const resolvedHomeId = homeName
        ? nameToCanonicalId.get(homeName) || m.home_team_id
        : m.home_team_id;
      const resolvedAwayId = awayName
        ? nameToCanonicalId.get(awayName) || m.away_team_id
        : m.away_team_id;

      return {
        id: m.id,
        tournament_id: m.tournament_id || tournamentId,
        home_team_id: resolvedHomeId,
        away_team_id: resolvedAwayId,
        home_score: m.home_score,
        away_score: m.away_score,
        match_type: m.match_type,
        is_played: m.is_played,
        group_id: m.group_id,
        leg: m.leg || 1,
        tie_id: m.tie_id,
        home_penalties: m.home_penalties,
        away_penalties: m.away_penalties,
        round_number: m.round_number,
      };
    });

    return { success: true, teams: parsedTeams, matches: parsedMatches };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

// Update multiple teams in Supabase (names, clubs, WhatsApp contacts, logos)
export async function updateTournamentTeamsInSupabase(
  teams: Team[],
  tournamentId?: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase client is not configured' };

  try {
    const tourneyId = tournamentId || teams[0]?.tournament_id;

    // Check existing teams in DB to preserve UUIDs and prevent duplicate row explosion
    const { data: existing } = await client
      .from('teams')
      .select('id, name')
      .eq('tournament_id', tourneyId)
      .order('created_at', { ascending: false });

    const nameToExistingId = new Map<string, string>();
    existing?.forEach((t) => {
      const n = (t.name || '').trim().toLowerCase();
      if (!nameToExistingId.has(n)) nameToExistingId.set(n, t.id);
    });

    const teamsPayload = teams.map((t) => {
      const norm = (t.name || '').trim().toLowerCase();
      const existingId =
        nameToExistingId.get(norm) || (t.id && !t.id.startsWith('team-') ? t.id : undefined);

      return {
        id: existingId,
        tournament_id: tourneyId || t.tournament_id,
        name: t.name,
        club_name: t.club_crest_name || t.name,
        club_crest_name: t.club_crest_name || t.name,
        logo_url: t.logo_url,
        group_id: t.group_id,
        pot: t.pot || 1,
        phone: t.whatsapp || t.phone || '',
        whatsapp: t.whatsapp || t.phone || '',
      };
    });

    const { error } = await client.from('teams').upsert(teamsPayload);
    if (error) {
      return { success: false, message: error.message };
    }

    if (tourneyId) {
      await client
        .from('tournaments')
        .update({ last_saved_at: new Date().toISOString() })
        .eq('id', tourneyId);
    }

    return { success: true, message: 'Teams updated and synced successfully' };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update teams in Supabase',
    };
  }
}

// Helper to resolve client team IDs to Supabase team UUIDs
async function resolveSupabaseTeamMap(
  client: any,
  tournamentId: string,
  clientTeams?: Team[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const { data: dbTeams } = await client
      .from('teams')
      .select('id, name')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (dbTeams && dbTeams.length > 0) {
      // Map name -> dbId
      const nameToDbId = new Map<string, string>();
      dbTeams.forEach((dt: any) => {
        const norm = (dt.name || '').toLowerCase().trim();
        if (norm && !nameToDbId.has(norm)) {
          nameToDbId.set(norm, dt.id);
        }
        map.set(dt.id, dt.id);
      });

      // If clientTeams provided, map clientTeam.id -> dbId
      if (clientTeams) {
        clientTeams.forEach((ct) => {
          const matchedDbId = nameToDbId.get((ct.name || '').toLowerCase().trim());
          if (matchedDbId) {
            map.set(ct.id, matchedDbId);
          }
        });
      }
    }
  } catch (err) {
    console.warn('Could not build team map from Supabase:', err);
  }
  return map;
}

// Update single match score in Supabase bound to tournament
export async function saveTournamentMatchScoreToSupabase(
  match: Match,
  tournamentId?: string,
  clientTeams?: Team[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase client is not configured' };

  try {
    const tourneyId = tournamentId || match.tournament_id;
    let dbHomeId = match.home_team_id;
    let dbAwayId = match.away_team_id;

    if (tourneyId) {
      const teamMap = await resolveSupabaseTeamMap(client, tourneyId, clientTeams);
      if (teamMap.has(match.home_team_id)) {
        dbHomeId = teamMap.get(match.home_team_id)!;
      }
      if (teamMap.has(match.away_team_id)) {
        dbAwayId = teamMap.get(match.away_team_id)!;
      }

      // Fallback: If not UUID, resolve using clientTeams names and official dictionary
      const isUuidFormat = (str: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      if (!isUuidFormat(dbHomeId)) {
        const teamObj = clientTeams?.find((t) => t.id === match.home_team_id);
        const nameNorm = (teamObj ? teamObj.name : dbHomeId).toLowerCase().trim();
        if (OFFICIAL_TEAM_NAME_TO_DB_UUID[nameNorm]) {
          dbHomeId = OFFICIAL_TEAM_NAME_TO_DB_UUID[nameNorm];
        }
      }

      if (!isUuidFormat(dbAwayId)) {
        const teamObj = clientTeams?.find((t) => t.id === match.away_team_id);
        const nameNorm = (teamObj ? teamObj.name : dbAwayId).toLowerCase().trim();
        if (OFFICIAL_TEAM_NAME_TO_DB_UUID[nameNorm]) {
          dbAwayId = OFFICIAL_TEAM_NAME_TO_DB_UUID[nameNorm];
        }
      }
    }

    let payload = {
      home_score: match.home_score,
      away_score: match.away_score,
      is_played: match.is_played,
      home_penalties: match.home_penalties ?? null,
      away_penalties: match.away_penalties ?? null,
    };

    let existingMatchId: string | null = null;
    let isReversedInDb = false;
    const isUuid =
      match.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(match.id);

    // 1. Look up existing match row by tournament and team IDs + leg (direct pairing)
    if (tourneyId && dbHomeId && dbAwayId) {
      const { data: found } = await client
        .from('matches')
        .select('id, home_team_id, away_team_id')
        .eq('tournament_id', tourneyId)
        .eq('home_team_id', dbHomeId)
        .eq('away_team_id', dbAwayId)
        .eq('leg', match.leg || 1)
        .limit(1);

      if (found && found.length > 0) {
        existingMatchId = found[0].id;
      } else {
        // Reverse pairing check
        const { data: foundReverse } = await client
          .from('matches')
          .select('id, home_team_id, away_team_id')
          .eq('tournament_id', tourneyId)
          .eq('home_team_id', dbAwayId)
          .eq('away_team_id', dbHomeId)
          .eq('leg', match.leg || 1)
          .limit(1);

        if (foundReverse && foundReverse.length > 0) {
          existingMatchId = foundReverse[0].id;
          isReversedInDb = true;
        } else if (match.tie_id) {
          // Check by tie_id and leg
          const { data: foundTie } = await client
            .from('matches')
            .select('id, home_team_id, away_team_id')
            .eq('tournament_id', tourneyId)
            .eq('tie_id', match.tie_id)
            .eq('leg', match.leg || 1)
            .limit(1);

          if (foundTie && foundTie.length > 0) {
            existingMatchId = foundTie[0].id;
            if (foundTie[0].home_team_id === dbAwayId) {
              isReversedInDb = true;
            }
          }
        }
      }
    }

    // 2. If not found by team IDs, check by exact ID if UUID
    if (!existingMatchId && isUuid) {
      const { data: foundById } = await client
        .from('matches')
        .select('id')
        .eq('id', match.id)
        .limit(1);
      if (foundById && foundById.length > 0) {
        existingMatchId = foundById[0].id;
      }
    }

    if (existingMatchId) {
      const effectivePayload = isReversedInDb
        ? {
            ...payload,
            home_score: match.away_score,
            away_score: match.home_score,
            home_penalties: match.away_penalties ?? null,
            away_penalties: match.home_penalties ?? null,
          }
        : payload;

      const { error: updateErr } = await client
        .from('matches')
        .update(effectivePayload)
        .eq('id', existingMatchId);

      if (updateErr) {
        return { success: false, message: updateErr.message };
      }
    } else if (tourneyId) {
      // Insert match row if not found
      const { error: insertErr } = await client.from('matches').insert({
        tournament_id: tourneyId,
        home_team_id: dbHomeId,
        away_team_id: dbAwayId,
        home_score: match.home_score,
        away_score: match.away_score,
        match_type: match.match_type || 'Group',
        is_played: match.is_played,
        group_id: match.group_id || null,
        leg: match.leg || 1,
        tie_id: match.tie_id || null,
        round_number: match.round_number || 1,
        home_penalties: match.home_penalties ?? null,
        away_penalties: match.away_penalties ?? null,
      });

      if (insertErr) {
        return { success: false, message: insertErr.message };
      }
    }

    // Touch last_saved_at on tournament
    if (tourneyId) {
      await client
        .from('tournaments')
        .update({ last_saved_at: new Date().toISOString() })
        .eq('id', tourneyId);
    }

    return { success: true, message: 'Match score saved successfully in Supabase' };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save match score',
    };
  }
}

// Update both legs of a tie in Supabase strictly bound to active tournament_id
export async function saveTournamentTieScoresToSupabase(
  leg1: Match,
  leg2: Match | undefined,
  tournamentId: string,
  clientTeams?: Team[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client not configured' };
  }

  if (!tournamentId) {
    return { success: false, message: 'Active tournament ID is required' };
  }

  try {
    // 1. Update Leg 1
    const p1 = saveTournamentMatchScoreToSupabase(leg1, tournamentId, clientTeams);
    // 2. Update Leg 2 (if present)
    const p2 = leg2
      ? saveTournamentMatchScoreToSupabase(leg2, tournamentId, clientTeams)
      : Promise.resolve({ success: true, message: '' });

    const [r1, r2] = await Promise.all([p1, p2]);

    if (!r1.success || !r2.success) {
      return {
        success: false,
        message: r1.message || r2.message || 'One or both legs failed to save in Supabase',
      };
    }

    // Touch tournament timestamp
    await client
      .from('tournaments')
      .update({ last_saved_at: new Date().toISOString() })
      .eq('id', tournamentId);

    return { success: true, message: 'Tie scores saved & synced with Supabase' };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to save tie in Supabase',
    };
  }
}

// Fetch teams from Supabase strictly filtered by tournament_id
export async function fetchTeamsFromSupabase(
  tournamentId: string
): Promise<{ success: boolean; data?: Team[]; message?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured' };
  }

  if (!tournamentId) {
    return { success: false, message: 'tournament_id is required' };
  }

  try {
    const { data, error } = await client
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'No teams found for this tournament profile in Supabase' };
    }

    const uniqueMap = new Map<string, any>();
    data.forEach((t) => {
      const n = (t.name || '').trim().toLowerCase();
      if (n && !uniqueMap.has(n)) uniqueMap.set(n, t);
    });

    const parsedTeams: Team[] = Array.from(uniqueMap.values()).map((t) => ({
      id: t.id,
      tournament_id: t.tournament_id,
      name: t.name,
      logo_url: t.logo_url,
      group_id: t.group_id,
      club_crest_name: t.club_name || t.club_crest_name,
      pot: t.pot || 1,
      whatsapp: t.whatsapp || t.phone || '',
      phone: t.phone || t.whatsapp || '',
    }));

    return { success: true, data: parsedTeams };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to fetch teams' };
  }
}

// Fetch matches from Supabase strictly filtered by tournament_id
export async function fetchMatchesFromSupabase(
  tournamentId: string
): Promise<{ success: boolean; data?: Match[]; message?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase client is not configured' };
  }

  if (!tournamentId) {
    return { success: false, message: 'tournament_id is required' };
  }

  try {
    const { data, error } = await client
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'No matches found for this tournament profile in Supabase' };
    }

    const parsedMatches: Match[] = data.map((m) => ({
      id: m.id,
      tournament_id: m.tournament_id,
      home_team_id: m.home_team_id,
      away_team_id: m.away_team_id,
      home_score: m.home_score,
      away_score: m.away_score,
      match_type: m.match_type,
      is_played: m.is_played,
      group_id: m.group_id,
      leg: m.leg || 1,
      tie_id: m.tie_id,
      home_penalties: m.home_penalties,
      away_penalties: m.away_penalties,
      round_number: m.round_number,
    }));

    return { success: true, data: parsedMatches };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to fetch matches' };
  }
}

// Push/Sync all teams and matches to Supabase strictly scoped to tournament_id
export async function pushDataToSupabase(
  teams: Team[],
  matches: Match[],
  tournamentId?: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase is not configured. Enter your project URL and Anon key first.' };
  }

  try {
    const tourneyId = tournamentId || teams[0]?.tournament_id;

    // Check existing teams in DB for this tournament to preserve UUIDs
    const { data: existing } = await client
      .from('teams')
      .select('id, name')
      .eq('tournament_id', tourneyId)
      .order('created_at', { ascending: false });

    const nameToExistingId = new Map<string, string>();
    existing?.forEach((t) => {
      const n = (t.name || '').trim().toLowerCase();
      if (!nameToExistingId.has(n)) nameToExistingId.set(n, t.id);
    });

    // 1. Prepare teams payloads
    const teamsPayload = teams.map((t) => {
      const norm = (t.name || '').trim().toLowerCase();
      const existingId =
        nameToExistingId.get(norm) || (t.id && !t.id.startsWith('team-') ? t.id : undefined);

      return {
        id: existingId,
        name: t.name,
        club_name: t.club_crest_name || t.name,
        club_crest_name: t.club_crest_name || t.name,
        logo_url: t.logo_url,
        group_id: t.group_id,
        tournament_id: tourneyId,
        pot: t.pot || 1,
        phone: t.whatsapp || t.phone || '',
        whatsapp: t.whatsapp || t.phone || '',
      };
    });

    const { data: upsertedTeams, error: teamsError } = await client
      .from('teams')
      .upsert(teamsPayload)
      .select('id, name');

    if (teamsError) {
      console.warn('Teams upsert warning:', teamsError.message);
    }

    // Build map of team name -> DB UUID
    const teamNameToId = new Map<string, string>();
    // First from pre-existing
    nameToExistingId.forEach((id, name) => teamNameToId.set(name, id));
    // Then overlay newly upserted
    if (upsertedTeams) {
      upsertedTeams.forEach((t) => teamNameToId.set((t.name || '').trim().toLowerCase(), t.id));
    }

    // 2. Prepare matches payload with real DB team UUIDs
    const matchesPayload = matches
      .map((m) => {
        const homeTeamObj = teams.find((t) => t.id === m.home_team_id);
        const awayTeamObj = teams.find((t) => t.id === m.away_team_id);

        const homeName = (homeTeamObj ? homeTeamObj.name : m.home_team_id || '').trim().toLowerCase();
        const awayName = (awayTeamObj ? awayTeamObj.name : m.away_team_id || '').trim().toLowerCase();

        const homeDbId = teamNameToId.get(homeName) || m.home_team_id;
        const awayDbId = teamNameToId.get(awayName) || m.away_team_id;

        // Skip if either team couldn't be resolved or are identical
        if (!homeDbId || !awayDbId || homeDbId === awayDbId) {
          return null;
        }

        return {
          tournament_id: tourneyId || m.tournament_id,
          home_team_id: homeDbId,
          away_team_id: awayDbId,
          home_score: m.home_score,
          away_score: m.away_score,
          match_type: m.match_type,
          is_played: m.is_played,
          group_id: m.group_id || null,
          leg: m.leg || 1,
          tie_id: m.tie_id || null,
          home_penalties: m.home_penalties || null,
          away_penalties: m.away_penalties || null,
          round_number: m.round_number || 1,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);

    if (matchesPayload.length > 0 && tourneyId) {
      // Upsert or insert matches
      const { error: matchesError } = await client.from('matches').upsert(matchesPayload);

      if (matchesError) {
        // Fallback: delete unplayed and insert
        await client.from('matches').delete().eq('tournament_id', tourneyId).eq('is_played', false);
        await client.from('matches').insert(matchesPayload.filter((m) => !m.is_played));
      }
    }

    return {
      success: true,
      message: `Successfully synced ${teams.length} teams and ${matchesPayload.length} matches to Supabase!`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Sync failed';
    return { success: false, message: msg };
  }
}

// Save single match score to Supabase in real-time
export async function saveSingleMatchScoreToSupabase(match: Match): Promise<void> {
  await saveTournamentMatchScoreToSupabase(match, match.tournament_id);
}

