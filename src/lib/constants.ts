import { ClubLogoOption, Team } from '../types/tournament';

export const OFFICIAL_TEAM_DATA_LIST: {
  name: string;
  clubName: string;
  clubShort: string;
  logoUrl: string;
  groupId: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  pot: number;
  whatsapp?: string;
  phone?: string;
}[] = [
  {
    name: 'Huncho',
    clubName: 'Manchester United',
    clubShort: 'MUN',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    groupId: 'A',
    pot: 1,
    whatsapp: '+255 749 541 001',
    phone: '+255 749 541 001',
  },
  {
    name: 'Christian',
    clubName: 'Arsenal',
    clubShort: 'ARS',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    groupId: 'A',
    pot: 2,
    whatsapp: '+255 762 530 394',
    phone: '+255 762 530 394',
  },
  {
    name: 'She Cheated me',
    clubName: 'FC Barcelona',
    clubShort: 'BAR',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    groupId: 'A',
    pot: 3,
    whatsapp: '+255 769 798 269',
    phone: '+255 769 798 269',
  },
  {
    name: 'Elly Hunter',
    clubName: 'Liverpool FC',
    clubShort: 'LIV',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    groupId: 'A',
    pot: 4,
    whatsapp: '+255 766 692 031',
    phone: '+255 766 692 031',
  },
  {
    name: 'ICE_EMAESTRO',
    clubName: 'Inter Miami',
    clubShort: 'MIA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg',
    groupId: 'B',
    pot: 1,
    whatsapp: '+255 755 679 819',
    phone: '+255 755 679 819',
  },
  {
    name: 'Benin',
    clubName: 'Bayern Munich',
    clubShort: 'BAY',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    groupId: 'B',
    pot: 2,
    whatsapp: '+255 712 551 567',
    phone: '+255 712 551 567',
  },
  {
    name: 'G.O.A.T',
    clubName: 'Real Madrid',
    clubShort: 'RMA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    groupId: 'B',
    pot: 3,
    whatsapp: '+255 678 958 677',
    phone: '+255 678 958 677',
  },
  {
    name: 'Jazzynorman',
    clubName: 'Corinthians',
    clubShort: 'COR',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/874.png',
    groupId: 'B',
    pot: 4,
    whatsapp: '+255 679 799 706',
    phone: '+255 679 799 706',
  },
  {
    name: 'Roger Muncaster',
    clubName: 'Paris Saint-Germain',
    clubShort: 'PSG',
    logoUrl: 'https://crests.football-data.org/524.png',
    groupId: 'C',
    pot: 1,
    whatsapp: '+255 745 630 931',
    phone: '+255 745 630 931',
  },
  {
    name: 'Nenga',
    clubName: 'Olympique de Marseille',
    clubShort: 'OM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    groupId: 'C',
    pot: 2,
    whatsapp: '+255 759 465 474',
    phone: '+255 759 465 474',
  },
  {
    name: 'KJ Warriors',
    clubName: 'AFC Ajax',
    clubShort: 'AJX',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
    groupId: 'C',
    pot: 3,
    whatsapp: '+255 616 520 947',
    phone: '+255 616 520 947',
  },
  {
    name: 'Mshana Ai',
    clubName: 'Juventus',
    clubShort: 'JUV',
    logoUrl: 'https://crests.football-data.org/109.png',
    groupId: 'C',
    pot: 4,
    whatsapp: '',
    phone: '',
  },
  {
    name: 'Wise Meek',
    clubName: 'Borussia Dortmund',
    clubShort: 'BVB',
    logoUrl: 'https://crests.football-data.org/4.png',
    groupId: 'D',
    pot: 1,
    whatsapp: '+255 763 580 120',
    phone: '+255 763 580 120',
  },
  {
    name: 'Dedgurury',
    clubName: 'Inter Milan',
    clubShort: 'INT',
    logoUrl: 'https://crests.football-data.org/108.png',
    groupId: 'D',
    pot: 2,
    whatsapp: '+255 744 433 597',
    phone: '+255 744 433 597',
  },
  {
    name: 'Betwery',
    clubName: 'Atlético Madrid',
    clubShort: 'ATM',
    logoUrl: 'https://crests.football-data.org/78.png',
    groupId: 'D',
    pot: 3,
    whatsapp: '',
    phone: '',
  },
  {
    name: 'YoungKing',
    clubName: 'RB Leipzig',
    clubShort: 'RBL',
    logoUrl: 'https://crests.football-data.org/721.png',
    groupId: 'D',
    pot: 4,
    whatsapp: '+255 773 586 266',
    phone: '+255 773 586 266',
  },
  {
    name: 'Muhyuzoh',
    clubName: 'SSC Napoli',
    clubShort: 'NAP',
    logoUrl: 'https://crests.football-data.org/113.png',
    groupId: 'E',
    pot: 1,
    whatsapp: '+255 717 921 961',
    phone: '+255 717 921 961',
  },
  {
    name: 'Ivory Coast',
    clubName: 'LOSC Lille',
    clubShort: 'LIL',
    logoUrl: 'https://crests.football-data.org/521.png',
    groupId: 'E',
    pot: 2,
    whatsapp: '+255 748 528 591',
    phone: '+255 748 528 591',
  },
  {
    name: 'Budo',
    clubName: 'Aston Villa',
    clubShort: 'AVL',
    logoUrl: 'https://crests.football-data.org/58.png',
    groupId: 'E',
    pot: 3,
    whatsapp: '+255 690 913 729',
    phone: '+255 690 913 729',
  },
  {
    name: '45balo',
    clubName: 'Nottingham Forest',
    clubShort: 'NFO',
    logoUrl: 'https://crests.football-data.org/351.png',
    groupId: 'E',
    pot: 4,
    whatsapp: '+255 615 364 284',
    phone: '+255 615 364 284',
  },
  {
    name: 'Kachuma',
    clubName: 'Tottenham Hotspur',
    clubShort: 'TOT',
    logoUrl: 'https://crests.football-data.org/73.png',
    groupId: 'F',
    pot: 1,
    whatsapp: '+255 712 735 545',
    phone: '+255 712 735 545',
  },
  {
    name: 'Drexypal64',
    clubName: 'Brighton & Hove Albion',
    clubShort: 'BHA',
    logoUrl: 'https://crests.football-data.org/397.png',
    groupId: 'F',
    pot: 2,
    whatsapp: '+255 629 126 164',
    phone: '+255 629 126 164',
  },
  {
    name: 'Man of people',
    clubName: 'Brentford',
    clubShort: 'BRE',
    logoUrl: 'https://crests.football-data.org/402.png',
    groupId: 'F',
    pot: 3,
    whatsapp: '+255 761 783 018',
    phone: '+255 761 783 018',
  },
  {
    name: 'Moyo',
    clubName: 'Everton',
    clubShort: 'EVE',
    logoUrl: 'https://crests.football-data.org/62.png',
    groupId: 'F',
    pot: 4,
    whatsapp: '+255 764 037 716',
    phone: '+255 764 037 716',
  },
];

export const OFFICIAL_TEAM_NAMES: string[] = OFFICIAL_TEAM_DATA_LIST.map((t) => t.name);

export const REAL_FOOTBALL_CLUBS: ClubLogoOption[] = [
  {
    name: 'Manchester United',
    shortName: 'MUN',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    primaryColor: '#DA291C',
  },
  {
    name: 'Arsenal',
    shortName: 'ARS',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    primaryColor: '#EF0107',
  },
  {
    name: 'FC Barcelona',
    shortName: 'BAR',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    primaryColor: '#004D98',
  },
  {
    name: 'Liverpool FC',
    shortName: 'LIV',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    primaryColor: '#C8102E',
  },
  {
    name: 'Inter Miami',
    shortName: 'MIA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg',
    primaryColor: '#F7B5CD',
  },
  {
    name: 'Bayern Munich',
    shortName: 'BAY',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    primaryColor: '#DC052D',
  },
  {
    name: 'Real Madrid',
    shortName: 'RMA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    primaryColor: '#00529F',
  },
  {
    name: 'Corinthians',
    shortName: 'COR',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/874.png',
    primaryColor: '#000000',
  },
  {
    name: 'Paris Saint-Germain',
    shortName: 'PSG',
    logoUrl: 'https://crests.football-data.org/524.png',
    primaryColor: '#004170',
  },
  {
    name: 'Olympique de Marseille',
    shortName: 'OM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    primaryColor: '#00A3E0',
  },
  {
    name: 'AFC Ajax',
    shortName: 'AJX',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
    primaryColor: '#D2122E',
  },
  {
    name: 'Juventus',
    shortName: 'JUV',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    primaryColor: '#000000',
  },
  {
    name: 'Borussia Dortmund',
    shortName: 'BVB',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    primaryColor: '#FDE100',
  },
  {
    name: 'Inter Milan',
    shortName: 'INT',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    primaryColor: '#010E80',
  },
  {
    name: 'Atlético Madrid',
    shortName: 'ATM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    primaryColor: '#CB3524',
  },
  {
    name: 'RB Leipzig',
    shortName: 'RBL',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2020_logo.svg',
    primaryColor: '#DD0741',
  },
  {
    name: 'SSC Napoli',
    shortName: 'NAP',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
    primaryColor: '#003B70',
  },
  {
    name: 'LOSC Lille',
    shortName: 'LIL',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg',
    primaryColor: '#D21E2C',
  },
  {
    name: 'Aston Villa',
    shortName: 'AVL',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg',
    primaryColor: '#670E36',
  },
  {
    name: 'Nottingham Forest',
    shortName: 'NFO',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
    primaryColor: '#DD0000',
  },
  {
    name: 'Tottenham Hotspur',
    shortName: 'TOT',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    primaryColor: '#132257',
  },
  {
    name: 'Brighton & Hove Albion',
    shortName: 'BHA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
    primaryColor: '#0057B8',
  },
  {
    name: 'Brentford',
    shortName: 'BRE',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
    primaryColor: '#D20000',
  },
  {
    name: 'Everton',
    shortName: 'EVE',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
    primaryColor: '#003399',
  },
  {
    name: 'Manchester City',
    shortName: 'MCI',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    primaryColor: '#6CABDD',
  },
  {
    name: 'Chelsea FC',
    shortName: 'CHE',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
    primaryColor: '#034694',
  },
  {
    name: 'AC Milan',
    shortName: 'MIL',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    primaryColor: '#FB090B',
  },
];

export const INITIAL_TEAMS: Team[] = OFFICIAL_TEAM_DATA_LIST.map((item, index) => {
  return {
    id: `team-${index + 1}`,
    name: item.name,
    logo_url: item.logoUrl,
    group_id: item.groupId,
    club_crest_name: item.clubName,
    pot: item.pot,
    whatsapp: item.whatsapp || '',
    phone: item.phone || '',
  };
});

export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- eFootball Tournament Management - Complete Master Database SQL Schema
-- 100% Idempotent: Safe to run multiple times without duplicate errors
-- Supports: Vercel Deployments, Live Sync, WhatsApp Contacts, Real Club Crests
-- =========================================================================

-- Enable UUID Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CREATE TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_phase TEXT NOT NULL DEFAULT 'Group Stage - Round 1/6',
    group_mode TEXT NOT NULL DEFAULT 'auto' CHECK (group_mode IN ('auto', 'manual')),
    avatar_id TEXT DEFAULT 'trophy-gold',
    avatar_color TEXT DEFAULT '#2563eb'
);

-- Ensure all columns exist if table was previously created
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'Group Stage - Round 1/6';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS group_mode TEXT DEFAULT 'auto';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'trophy-gold';
ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#2563eb';

-- 2. CREATE TEAMS TABLE
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    club_name TEXT,
    club_crest_name TEXT,
    logo_url TEXT NOT NULL,
    group_id TEXT CHECK (group_id IN ('A', 'B', 'C', 'D', 'E', 'F') OR group_id IS NULL),
    pot INTEGER DEFAULT 1 CHECK (pot BETWEEN 1 AND 4),
    phone TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure WhatsApp and phone columns exist if table was previously created
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS club_name TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS club_crest_name TEXT;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS pot INTEGER DEFAULT 1;
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '';
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '';

-- Drop legacy conflicting unique constraints if present from previous schemas
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_name_key;
ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_tournament_id_name_key;

-- 3. CREATE MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    home_score INTEGER,
    away_score INTEGER,
    match_type TEXT NOT NULL CHECK (match_type IN ('Group', 'Ro16', 'QF', 'SF', 'Final')),
    is_played BOOLEAN DEFAULT FALSE NOT NULL,
    group_id TEXT CHECK (group_id IN ('A', 'B', 'C', 'D', 'E', 'F') OR group_id IS NULL),
    leg INTEGER DEFAULT 1 CHECK (leg IN (1, 2)),
    tie_id TEXT,
    home_penalties INTEGER,
    away_penalties INTEGER,
    round_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_different_teams CHECK (home_team_id <> away_team_id)
);

-- Ensure all match columns exist if table was previously created
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_penalties INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_penalties INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS tie_id TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS leg INTEGER DEFAULT 1;

-- 4. CREATE TEAM ACHIEVEMENTS & MEDALS WALL TABLE
CREATE TABLE IF NOT EXISTS public.team_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    badge_key TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'diamond', 'mythic')),
    icon TEXT NOT NULL,
    category TEXT DEFAULT 'special',
    metadata JSONB DEFAULT '{}'::jsonb,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_tournament_team_badge UNIQUE (tournament_id, team_id, badge_key)
);

-- Ensure team_achievements columns exist if table was previously created
ALTER TABLE public.team_achievements ADD COLUMN IF NOT EXISTS tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE;
ALTER TABLE public.team_achievements ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'special';
ALTER TABLE public.team_achievements ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 5. CREATE HIGH-PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams (tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_group ON public.teams (group_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches (home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches (away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_type_played ON public.matches (match_type, is_played);
CREATE INDEX IF NOT EXISTS idx_matches_tie ON public.matches (tie_id);
CREATE INDEX IF NOT EXISTS idx_achievements_tournament ON public.team_achievements (tournament_id);
CREATE INDEX IF NOT EXISTS idx_achievements_team ON public.team_achievements (team_id);
CREATE INDEX IF NOT EXISTS idx_achievements_tier ON public.team_achievements (tier);

-- 6. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_achievements ENABLE ROW LEVEL SECURITY;

-- 7. DROP EXISTING POLICIES TO PREVENT 'ERROR 42710: POLICY ALREADY EXISTS'
DROP POLICY IF EXISTS "Allow public read access on tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow public insert/update/delete on tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow public read tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow public write tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Allow public all tournaments" ON public.tournaments;

DROP POLICY IF EXISTS "Allow public read access on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public insert/update/delete on teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public read teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public write teams" ON public.teams;
DROP POLICY IF EXISTS "Allow public all teams" ON public.teams;

DROP POLICY IF EXISTS "Allow public read access on matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public insert/update/delete on matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public read matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public write matches" ON public.matches;
DROP POLICY IF EXISTS "Allow public all matches" ON public.matches;

DROP POLICY IF EXISTS "Allow public all achievements" ON public.team_achievements;

-- 8. RE-CREATE CLEAN & UNRESTRICTED ACCESS POLICIES (FOR VERCEL, APPS & CLIENTS)
CREATE POLICY "Allow public all tournaments" ON public.tournaments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all teams" ON public.teams FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all matches" ON public.matches FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all achievements" ON public.team_achievements FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant schema table permissions to anon & authenticated users
GRANT ALL ON TABLE public.tournaments TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.matches TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.team_achievements TO anon, authenticated, service_role;

-- 8. INITIALIZE STARTER TOURNAMENT & ALL 24 PLAYERS WITH OFFICIAL WHATSAPP CONTACTS
DO $$
DECLARE
    v_tournament_id UUID;
    t_huncho UUID; t_christian UUID; t_shecheated UUID; t_elly UUID;
    t_ice UUID; t_benin UUID; t_goat UUID; t_jazzy UUID;
    t_roger UUID; t_nenga UUID; t_kj UUID; t_mshana UUID;
    t_wise UUID; t_dedgurury UUID; t_betwery UUID; t_youngking UUID;
    t_muhyuzoh UUID; t_ivory UUID; t_budo UUID; t_45balo UUID;
    t_kachuma UUID; t_drexypal UUID; t_manofpeople UUID; t_moyo UUID;
BEGIN
    -- 1. Create or fetch active tournament
    IF NOT EXISTS (SELECT 1 FROM public.tournaments LIMIT 1) THEN
        INSERT INTO public.tournaments (name, current_phase, group_mode, avatar_id, avatar_color)
        VALUES ('Season 1 - E-Championship', 'Group Stage - Round 1/6', 'auto', 'trophy-gold', '#2563eb')
        RETURNING id INTO v_tournament_id;
    ELSE
        SELECT id INTO v_tournament_id FROM public.tournaments ORDER BY created_at ASC LIMIT 1;
    END IF;

    -- 2. Populate 24 Teams if none exist for this tournament
    IF NOT EXISTS (SELECT 1 FROM public.teams WHERE tournament_id = v_tournament_id LIMIT 1) THEN
        -- GROUP A
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Huncho', 'Manchester United', 'Manchester United', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg', 'A', 1, '+255 749 541 001', '+255 749 541 001')
        RETURNING id INTO t_huncho;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Christian', 'Arsenal', 'Arsenal', 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 'A', 2, '+255 762 530 394', '+255 762 530 394')
        RETURNING id INTO t_christian;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'She Cheated me', 'FC Barcelona', 'FC Barcelona', 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 'A', 3, '+255 769 798 269', '+255 769 798 269')
        RETURNING id INTO t_shecheated;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Elly Hunter', 'Liverpool FC', 'Liverpool FC', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', 'A', 4, '+255 766 692 031', '+255 766 692 031')
        RETURNING id INTO t_elly;

        -- GROUP B
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'ICE_EMAESTRO', 'Inter Miami', 'Inter Miami', 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg', 'B', 1, '+255 755 679 819', '+255 755 679 819')
        RETURNING id INTO t_ice;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Benin', 'Bayern Munich', 'Bayern Munich', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 'B', 2, '+255 712 551 567', '+255 712 551 567')
        RETURNING id INTO t_benin;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'G.O.A.T', 'Real Madrid', 'Real Madrid', 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 'B', 3, '+255 678 958 677', '+255 678 958 677')
        RETURNING id INTO t_goat;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Jazzynorman', 'Corinthians', 'Corinthians', 'https://upload.wikimedia.org/wikipedia/en/5/5a/Sport_Club_Corinthians_Paulista_crest.svg', 'B', 4, '+255 679 799 706', '+255 679 799 706')
        RETURNING id INTO t_jazzy;

        -- GROUP C
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Roger Muncaster', 'Paris Saint-Germain', 'Paris Saint-Germain', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 'C', 1, '+255 745 630 931', '+255 745 630 931')
        RETURNING id INTO t_roger;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Nenga', 'Olympique de Marseille', 'Olympique de Marseille', 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg', 'C', 2, '+255 759 465 474', '+255 759 465 474')
        RETURNING id INTO t_nenga;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'KJ Warriors', 'AFC Ajax', 'AFC Ajax', 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg', 'C', 3, '+255 616 520 947', '+255 616 520 947')
        RETURNING id INTO t_kj;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Mshana Ai', 'Juventus', 'Juventus', 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg', 'C', 4, '', '')
        RETURNING id INTO t_mshana;

        -- GROUP D
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Wise Meek', 'Borussia Dortmund', 'Borussia Dortmund', 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg', 'D', 1, '+255 763 580 120', '+255 763 580 120')
        RETURNING id INTO t_wise;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Dedgurury', 'Inter Milan', 'Inter Milan', 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg', 'D', 2, '+255 744 433 597', '+255 744 433 597')
        RETURNING id INTO t_dedgurury;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Betwery', 'Atlético Madrid', 'Atlético Madrid', 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg', 'D', 3, '', '')
        RETURNING id INTO t_betwery;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'YoungKing', 'RB Leipzig', 'RB Leipzig', 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2020_logo.svg', 'D', 4, '+255 773 586 266', '+255 773 586 266')
        RETURNING id INTO t_youngking;

        -- GROUP E
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Muhyuzoh', 'SSC Napoli', 'SSC Napoli', 'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg', 'E', 1, '+255 717 921 961', '+255 717 921 961')
        RETURNING id INTO t_muhyuzoh;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Ivory Coast', 'LOSC Lille', 'LOSC Lille', 'https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg', 'E', 2, '+255 748 528 591', '+255 748 528 591')
        RETURNING id INTO t_ivory;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Budo', 'Aston Villa', 'Aston Villa', 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg', 'E', 3, '+255 690 913 729', '+255 690 913 729')
        RETURNING id INTO t_budo;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, '45balo', 'Nottingham Forest', 'Nottingham Forest', 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg', 'E', 4, '+255 615 364 284', '+255 615 364 284')
        RETURNING id INTO t_45balo;

        -- GROUP F
        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Kachuma', 'Tottenham Hotspur', 'Tottenham Hotspur', 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg', 'F', 1, '+255 712 735 545', '+255 712 735 545')
        RETURNING id INTO t_kachuma;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Drexypal64', 'Brighton & Hove Albion', 'Brighton & Hove Albion', 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg', 'F', 2, '+255 629 126 164', '+255 629 126 164')
        RETURNING id INTO t_drexypal;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Man of people', 'Brentford', 'Brentford', 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg', 'F', 3, '+255 761 783 018', '+255 761 783 018')
        RETURNING id INTO t_manofpeople;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot, phone, whatsapp)
        VALUES (v_tournament_id, 'Moyo', 'Everton', 'Everton', 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg', 'F', 4, '+255 764 037 716', '+255 764 037 716')
        RETURNING id INTO t_moyo;

        -- 3. Pre-seed Group Fixtures for all groups (Double Round Robin: Rounds 1 to 6)
        -- Group A
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_huncho, t_christian, 'Group', false, 'A', 1),
        (v_tournament_id, t_shecheated, t_elly, 'Group', false, 'A', 1),
        (v_tournament_id, t_huncho, t_shecheated, 'Group', false, 'A', 2),
        (v_tournament_id, t_christian, t_elly, 'Group', false, 'A', 2),
        (v_tournament_id, t_elly, t_huncho, 'Group', false, 'A', 3),
        (v_tournament_id, t_christian, t_shecheated, 'Group', false, 'A', 3),
        (v_tournament_id, t_christian, t_huncho, 'Group', false, 'A', 4),
        (v_tournament_id, t_elly, t_shecheated, 'Group', false, 'A', 4),
        (v_tournament_id, t_shecheated, t_huncho, 'Group', false, 'A', 5),
        (v_tournament_id, t_elly, t_christian, 'Group', false, 'A', 5),
        (v_tournament_id, t_huncho, t_elly, 'Group', false, 'A', 6),
        (v_tournament_id, t_shecheated, t_christian, 'Group', false, 'A', 6);

        -- Group B
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_ice, t_benin, 'Group', false, 'B', 1),
        (v_tournament_id, t_goat, t_jazzy, 'Group', false, 'B', 1),
        (v_tournament_id, t_ice, t_goat, 'Group', false, 'B', 2),
        (v_tournament_id, t_benin, t_jazzy, 'Group', false, 'B', 2),
        (v_tournament_id, t_jazzy, t_ice, 'Group', false, 'B', 3),
        (v_tournament_id, t_benin, t_goat, 'Group', false, 'B', 3),
        (v_tournament_id, t_benin, t_ice, 'Group', false, 'B', 4),
        (v_tournament_id, t_jazzy, t_goat, 'Group', false, 'B', 4),
        (v_tournament_id, t_goat, t_ice, 'Group', false, 'B', 5),
        (v_tournament_id, t_jazzy, t_benin, 'Group', false, 'B', 5),
        (v_tournament_id, t_ice, t_jazzy, 'Group', false, 'B', 6),
        (v_tournament_id, t_goat, t_benin, 'Group', false, 'B', 6);

        -- Group C
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_roger, t_nenga, 'Group', false, 'C', 1),
        (v_tournament_id, t_kj, t_mshana, 'Group', false, 'C', 1),
        (v_tournament_id, t_roger, t_kj, 'Group', false, 'C', 2),
        (v_tournament_id, t_nenga, t_mshana, 'Group', false, 'C', 2),
        (v_tournament_id, t_mshana, t_roger, 'Group', false, 'C', 3),
        (v_tournament_id, t_nenga, t_kj, 'Group', false, 'C', 3),
        (v_tournament_id, t_nenga, t_roger, 'Group', false, 'C', 4),
        (v_tournament_id, t_mshana, t_kj, 'Group', false, 'C', 4),
        (v_tournament_id, t_kj, t_roger, 'Group', false, 'C', 5),
        (v_tournament_id, t_mshana, t_nenga, 'Group', false, 'C', 5),
        (v_tournament_id, t_roger, t_mshana, 'Group', false, 'C', 6),
        (v_tournament_id, t_kj, t_nenga, 'Group', false, 'C', 6);

        -- Group D
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_wise, t_dedgurury, 'Group', false, 'D', 1),
        (v_tournament_id, t_betwery, t_youngking, 'Group', false, 'D', 1),
        (v_tournament_id, t_wise, t_betwery, 'Group', false, 'D', 2),
        (v_tournament_id, t_dedgurury, t_youngking, 'Group', false, 'D', 2),
        (v_tournament_id, t_youngking, t_wise, 'Group', false, 'D', 3),
        (v_tournament_id, t_dedgurury, t_betwery, 'Group', false, 'D', 3),
        (v_tournament_id, t_dedgurury, t_wise, 'Group', false, 'D', 4),
        (v_tournament_id, t_youngking, t_betwery, 'Group', false, 'D', 4),
        (v_tournament_id, t_betwery, t_wise, 'Group', false, 'D', 5),
        (v_tournament_id, t_youngking, t_dedgurury, 'Group', false, 'D', 5),
        (v_tournament_id, t_wise, t_youngking, 'Group', false, 'D', 6),
        (v_tournament_id, t_betwery, t_dedgurury, 'Group', false, 'D', 6);

        -- Group E
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_muhyuzoh, t_ivory, 'Group', false, 'E', 1),
        (v_tournament_id, t_budo, t_45balo, 'Group', false, 'E', 1),
        (v_tournament_id, t_muhyuzoh, t_budo, 'Group', false, 'E', 2),
        (v_tournament_id, t_ivory, t_45balo, 'Group', false, 'E', 2),
        (v_tournament_id, t_45balo, t_muhyuzoh, 'Group', false, 'E', 3),
        (v_tournament_id, t_ivory, t_budo, 'Group', false, 'E', 3),
        (v_tournament_id, t_ivory, t_muhyuzoh, 'Group', false, 'E', 4),
        (v_tournament_id, t_45balo, t_budo, 'Group', false, 'E', 4),
        (v_tournament_id, t_budo, t_muhyuzoh, 'Group', false, 'E', 5),
        (v_tournament_id, t_45balo, t_ivory, 'Group', false, 'E', 5),
        (v_tournament_id, t_muhyuzoh, t_45balo, 'Group', false, 'E', 6),
        (v_tournament_id, t_budo, t_ivory, 'Group', false, 'E', 6);

        -- Group F
        INSERT INTO public.matches (tournament_id, home_team_id, away_team_id, match_type, is_played, group_id, round_number) VALUES
        (v_tournament_id, t_kachuma, t_drexypal, 'Group', false, 'F', 1),
        (v_tournament_id, t_manofpeople, t_moyo, 'Group', false, 'F', 1),
        (v_tournament_id, t_kachuma, t_manofpeople, 'Group', false, 'F', 2),
        (v_tournament_id, t_drexypal, t_moyo, 'Group', false, 'F', 2),
        (v_tournament_id, t_moyo, t_kachuma, 'Group', false, 'F', 3),
        (v_tournament_id, t_drexypal, t_manofpeople, 'Group', false, 'F', 3),
        (v_tournament_id, t_drexypal, t_kachuma, 'Group', false, 'F', 4),
        (v_tournament_id, t_moyo, t_manofpeople, 'Group', false, 'F', 4),
        (v_tournament_id, t_manofpeople, t_kachuma, 'Group', false, 'F', 5),
        (v_tournament_id, t_moyo, t_drexypal, 'Group', false, 'F', 5),
        (v_tournament_id, t_kachuma, t_moyo, 'Group', false, 'F', 6),
        (v_tournament_id, t_manofpeople, t_drexypal, 'Group', false, 'F', 6);
    END IF;
END $$;
`;

export const NEXTJS_SETUP_GUIDE = `# Step 1: Create a Next.js Project with Tailwind CSS
npx create-next-app@latest efootball-tournament \\
  --typescript \\
  --tailwind \\
  --eslint \\
  --app \\
  --src-dir \\
  --import-alias "@/*"

cd efootball-tournament

# Step 2: Install Supabase Client and UI Icons
npm install @supabase/supabase-js lucide-react

# Step 3: Configure Environment Variables
# Create a file named .env.local in your root directory:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
`;

export const SUPABASE_CLIENT_JS_CODE = `// lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
`;

export const SUPABASE_CLIENT_TS_CODE = `// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are defined.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
