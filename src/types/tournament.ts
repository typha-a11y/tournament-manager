export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export type MatchStage = 'Group' | 'Ro16' | 'QF' | 'SF' | 'Final';

export interface ClubLogoOption {
  name: string;
  shortName: string;
  logoUrl: string;
  primaryColor: string;
}

export interface TournamentProfile {
  id: string;
  name: string;
  created_at: string;
  last_saved_at: string;
  current_phase: string;
  group_mode: 'auto' | 'manual';
  avatar_id: string;
  avatar_color: string;
  notes?: string;
}

export interface Team {
  id: string;
  tournament_id?: string;
  name: string;
  logo_url: string;
  group_id: GroupLetter | null;
  club_crest_name?: string;
  pot?: number;
  whatsapp?: string;
  phone?: string;
}

export interface Match {
  id: string;
  tournament_id?: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_type: MatchStage;
  is_played: boolean;
  group_id?: GroupLetter | null;
  leg?: 1 | 2;
  tie_id?: string; // Links Leg 1 and Leg 2 of a knockout tie
  home_penalties?: number | null;
  away_penalties?: number | null;
  scheduled_date?: string;
  round_number?: number;
}

export interface TeamStanding {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  rank: number;
  status?: 'qualified' | 'contender' | 'eliminated';
}

export interface ThirdPlaceStanding extends TeamStanding {
  originalGroup: GroupLetter;
  isQualified: boolean;
}

export interface KnockoutTie {
  tieId: string;
  stage: MatchStage;
  matchNumber: number;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homePlaceholder?: string;
  awayPlaceholder?: string;
  leg1: Match | null;
  leg2: Match | null;
  aggregateHomeScore: number;
  aggregateAwayScore: number;
  winnerTeamId: string | null;
  isCompleted: boolean;
  needsPenalties: boolean;
  penaltyWinnerId?: string | null;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
}
