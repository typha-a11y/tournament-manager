import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Match, Team } from '../types/tournament';

export const DEFAULT_SUPABASE_URL = 'https://yxzdukkwztpcrmwpznry.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4emR1a2t3enRwY3Jtd3B6bnJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNTczNDYsImV4cCI6MjEwNTczMzM0Nn0.mOinLYgFzGb9tdZ9aoCMDjIL-cuURYxWQdE19-2S4yU';

const LOCAL_STORAGE_URL_KEY = 'efootball_supabase_url';
const LOCAL_STORAGE_ANON_KEY = 'efootball_supabase_anon_key';

export function getStoredCredentials(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

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
    const { data: teamsData, error: tErr } = await client
      .from('teams')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('group_id', { ascending: true })
      .order('name', { ascending: true });

    if (tErr) {
      return { success: false, message: tErr.message };
    }

    const { data: matchesData, error: mErr } = await client
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: true });

    if (mErr) {
      return { success: false, message: mErr.message };
    }

    const parsedTeams: Team[] = (teamsData || []).map((t) => ({
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

    const parsedMatches: Match[] = (matchesData || []).map((m) => ({
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

    return { success: true, teams: parsedTeams, matches: parsedMatches };
  } catch (err: unknown) {
    return { success: false, message: err instanceof Error ? err.message : 'Fetch failed' };
  }
}

// Update single match score in Supabase bound to tournament
export async function saveTournamentMatchScoreToSupabase(
  match: Match,
  tournamentId?: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, message: 'Supabase client is not configured' };

  try {
    const payload = {
      home_score: match.home_score,
      away_score: match.away_score,
      is_played: match.is_played,
      home_penalties: match.home_penalties,
      away_penalties: match.away_penalties,
    };

    let query = client.from('matches').update(payload);

    if (match.id && !match.id.startsWith('match-') && !match.id.startsWith('temp-')) {
      query = query.eq('id', match.id);
      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
    } else {
      query = query
        .eq('home_team_id', match.home_team_id)
        .eq('away_team_id', match.away_team_id)
        .eq('match_type', match.match_type)
        .eq('leg', match.leg || 1);

      if (tournamentId) {
        query = query.eq('tournament_id', tournamentId);
      }
    }

    const { error } = await query;
    if (error) {
      return { success: false, message: error.message };
    }

    // Touch last_saved_at on tournament
    if (tournamentId) {
      await client
        .from('tournaments')
        .update({ last_saved_at: new Date().toISOString() })
        .eq('id', tournamentId);
    }

    return { success: true, message: 'Match score saved successfully' };
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
  leg2: Match,
  tournamentId: string
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
    const p1 = saveTournamentMatchScoreToSupabase(leg1, tournamentId);
    // 2. Update Leg 2
    const p2 = saveTournamentMatchScoreToSupabase(leg2, tournamentId);

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
      .order('group_id', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, message: 'No teams found for this tournament profile in Supabase' };
    }

    const parsedTeams: Team[] = data.map((t) => ({
      id: t.id,
      tournament_id: t.tournament_id,
      name: t.name,
      logo_url: t.logo_url,
      group_id: t.group_id,
      club_crest_name: t.club_name || t.club_crest_name,
      pot: t.pot || 1,
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
    // 1. Prepare teams payloads
    const teamsPayload = teams.map((t) => ({
      name: t.name,
      logo_url: t.logo_url,
      group_id: t.group_id,
      club_crest_name: t.club_crest_name || null,
      tournament_id: tournamentId || t.tournament_id,
      pot: t.pot || 1,
    }));

    const { data: upsertedTeams, error: teamsError } = await client
      .from('teams')
      .upsert(teamsPayload, { onConflict: 'name,tournament_id' })
      .select('id, name');

    if (teamsError) {
      // Fallback simple upsert if constraint differs
      const { data: fallbackUpsert, error: fbErr } = await client
        .from('teams')
        .upsert(teamsPayload)
        .select('id, name');
      if (fbErr) {
        return { success: false, message: `Teams sync failed: ${fbErr.message}` };
      }
    }

    // Build map of team name -> DB UUID
    const teamNameToId = new Map<string, string>();
    if (upsertedTeams) {
      upsertedTeams.forEach((t) => teamNameToId.set(t.name, t.id));
    }

    // 2. Prepare matches payload with real DB team UUIDs
    const matchesPayload = matches
      .map((m) => {
        const homeTeamObj = teams.find((t) => t.id === m.home_team_id);
        const awayTeamObj = teams.find((t) => t.id === m.away_team_id);

        const homeDbId = homeTeamObj ? teamNameToId.get(homeTeamObj.name) || homeTeamObj.id : m.home_team_id;
        const awayDbId = awayTeamObj ? teamNameToId.get(awayTeamObj.name) || awayTeamObj.id : m.away_team_id;

        // Skip if either team couldn't be resolved or are identical
        if (!homeDbId || !awayDbId || homeDbId === awayDbId) {
          return null;
        }

        return {
          tournament_id: tournamentId || m.tournament_id,
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

    if (matchesPayload.length > 0) {
      if (tournamentId) {
        await client.from('matches').delete().eq('tournament_id', tournamentId);
      }
      const { error: matchesError } = await client.from('matches').insert(matchesPayload);

      if (matchesError) {
        return {
          success: true,
          message: `Teams synced successfully! However, matches had a notice: ${matchesError.message}`,
        };
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

