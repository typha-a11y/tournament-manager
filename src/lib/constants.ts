import { ClubLogoOption, Team } from '../types/tournament';

export const OFFICIAL_TEAM_DATA_LIST: {
  name: string;
  clubName: string;
  clubShort: string;
  logoUrl: string;
  groupId: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  pot: number;
}[] = [
  {
    name: 'Huncho',
    clubName: 'Manchester United',
    clubShort: 'MUN',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    groupId: 'A',
    pot: 1,
  },
  {
    name: 'Christian',
    clubName: 'Arsenal',
    clubShort: 'ARS',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    groupId: 'A',
    pot: 2,
  },
  {
    name: 'She Cheated me',
    clubName: 'FC Barcelona',
    clubShort: 'BAR',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    groupId: 'A',
    pot: 3,
  },
  {
    name: 'Elly Hunter',
    clubName: 'Liverpool FC',
    clubShort: 'LIV',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    groupId: 'A',
    pot: 4,
  },
  {
    name: 'ICE_EMAESTRO',
    clubName: 'Inter Miami',
    clubShort: 'MIA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg',
    groupId: 'B',
    pot: 1,
  },
  {
    name: 'Benin',
    clubName: 'Bayern Munich',
    clubShort: 'BAY',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    groupId: 'B',
    pot: 2,
  },
  {
    name: 'G.O.A.T',
    clubName: 'Real Madrid',
    clubShort: 'RMA',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    groupId: 'B',
    pot: 3,
  },
  {
    name: 'Jazzynorman',
    clubName: 'Corinthians',
    clubShort: 'COR',
    logoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/874.png',
    groupId: 'B',
    pot: 4,
  },
  {
    name: 'Roger Muncaster',
    clubName: 'Paris Saint-Germain',
    clubShort: 'PSG',
    logoUrl: 'https://crests.football-data.org/524.png',
    groupId: 'C',
    pot: 1,
  },
  {
    name: 'Nenga',
    clubName: 'Olympique de Marseille',
    clubShort: 'OM',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    groupId: 'C',
    pot: 2,
  },
  {
    name: 'KJ Warriors',
    clubName: 'AFC Ajax',
    clubShort: 'AJX',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
    groupId: 'C',
    pot: 3,
  },
  {
    name: 'Mshana Ai',
    clubName: 'Juventus',
    clubShort: 'JUV',
    logoUrl: 'https://crests.football-data.org/109.png',
    groupId: 'C',
    pot: 4,
  },
  {
    name: 'Wise Meek',
    clubName: 'Borussia Dortmund',
    clubShort: 'BVB',
    logoUrl: 'https://crests.football-data.org/4.png',
    groupId: 'D',
    pot: 1,
  },
  {
    name: 'Dedgurury',
    clubName: 'Inter Milan',
    clubShort: 'INT',
    logoUrl: 'https://crests.football-data.org/108.png',
    groupId: 'D',
    pot: 2,
  },
  {
    name: 'Betwery',
    clubName: 'Atlético Madrid',
    clubShort: 'ATM',
    logoUrl: 'https://crests.football-data.org/78.png',
    groupId: 'D',
    pot: 3,
  },
  {
    name: 'YoungKing',
    clubName: 'RB Leipzig',
    clubShort: 'RBL',
    logoUrl: 'https://crests.football-data.org/721.png',
    groupId: 'D',
    pot: 4,
  },
  {
    name: 'Muhyuzoh',
    clubName: 'SSC Napoli',
    clubShort: 'NAP',
    logoUrl: 'https://crests.football-data.org/113.png',
    groupId: 'E',
    pot: 1,
  },
  {
    name: 'Ivory Coast',
    clubName: 'LOSC Lille',
    clubShort: 'LIL',
    logoUrl: 'https://crests.football-data.org/521.png',
    groupId: 'E',
    pot: 2,
  },
  {
    name: 'Budo',
    clubName: 'Aston Villa',
    clubShort: 'AVL',
    logoUrl: 'https://crests.football-data.org/58.png',
    groupId: 'E',
    pot: 3,
  },
  {
    name: '45balo',
    clubName: 'Nottingham Forest',
    clubShort: 'NFO',
    logoUrl: 'https://crests.football-data.org/351.png',
    groupId: 'E',
    pot: 4,
  },
  {
    name: 'Kachuma',
    clubName: 'Tottenham Hotspur',
    clubShort: 'TOT',
    logoUrl: 'https://crests.football-data.org/73.png',
    groupId: 'F',
    pot: 1,
  },
  {
    name: 'Drexypal64',
    clubName: 'Brighton & Hove Albion',
    clubShort: 'BHA',
    logoUrl: 'https://crests.football-data.org/397.png',
    groupId: 'F',
    pot: 2,
  },
  {
    name: 'Man of people',
    clubName: 'Brentford',
    clubShort: 'BRE',
    logoUrl: 'https://crests.football-data.org/402.png',
    groupId: 'F',
    pot: 3,
  },
  {
    name: 'Moyo',
    clubName: 'Everton',
    clubShort: 'EVE',
    logoUrl: 'https://crests.football-data.org/62.png',
    groupId: 'F',
    pot: 4,
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
  };
});

export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR MULTI-PROFILE eFOOTBALL TOURNAMENT PLATFORM
-- Execute this entire script inside the Supabase SQL Editor.
-- =========================================================================

-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create TOURNAMENTS Table (Multi-profile savefile system)
CREATE TABLE IF NOT EXISTS public.tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_phase TEXT NOT NULL DEFAULT 'Group Stage - Round 1/6',
    group_mode TEXT NOT NULL DEFAULT 'auto' CHECK (group_mode IN ('auto', 'manual')),
    avatar_id TEXT DEFAULT 'trophy-gold',
    avatar_color TEXT DEFAULT '#2563eb'
);

-- 2. Create TEAMS Table (bound to tournament_id)
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    club_name TEXT,
    club_crest_name TEXT,
    logo_url TEXT NOT NULL,
    group_id TEXT CHECK (group_id IN ('A', 'B', 'C', 'D', 'E', 'F') OR group_id IS NULL),
    pot INTEGER DEFAULT 1 CHECK (pot BETWEEN 1 AND 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create MATCHES Table (bound to tournament_id and teams)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 4. High-Performance Indexes for Queries & Real-Time Sync
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON public.teams (tournament_id);
CREATE INDEX IF NOT EXISTS idx_teams_group ON public.teams (group_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON public.matches (tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_team ON public.matches (home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_team ON public.matches (away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_type_played ON public.matches (match_type, is_played);
CREATE INDEX IF NOT EXISTS idx_matches_tie ON public.matches (tie_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- 6. Standard Public Read/Write Policies (Permissive for tournament admins/players)
CREATE POLICY "Allow public read access on tournaments" ON public.tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete on tournaments" ON public.tournaments FOR ALL USING (true);

CREATE POLICY "Allow public read access on teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete on teams" ON public.teams FOR ALL USING (true);

CREATE POLICY "Allow public read access on matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update/delete on matches" ON public.matches FOR ALL USING (true);

-- 7. Insert Default Starter Tournament & Pre-seed the 24 Official Teams
DO $$
DECLARE
    starter_tourney_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.tournaments LIMIT 1) THEN
        INSERT INTO public.tournaments (name, current_phase, group_mode, avatar_id, avatar_color)
        VALUES ('Season 1 - E-Championship', 'Group Stage - Round 1/6', 'auto', 'trophy-gold', '#2563eb')
        RETURNING id INTO starter_tourney_id;

        INSERT INTO public.teams (tournament_id, name, club_name, club_crest_name, logo_url, group_id, pot)
        VALUES
          (starter_tourney_id, 'Huncho', 'Manchester United', 'Manchester United', 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg', 'A', 1),
          (starter_tourney_id, 'Christian', 'Arsenal', 'Arsenal', 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg', 'A', 2),
          (starter_tourney_id, 'She Cheated me', 'FC Barcelona', 'FC Barcelona', 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg', 'A', 3),
          (starter_tourney_id, 'Elly Hunter', 'Liverpool FC', 'Liverpool FC', 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg', 'A', 4),

          (starter_tourney_id, 'ICE_EMAESTRO', 'Inter Miami', 'Inter Miami', 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg', 'B', 1),
          (starter_tourney_id, 'Benin', 'Bayern Munich', 'Bayern Munich', 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg', 'B', 2),
          (starter_tourney_id, 'G.O.A.T', 'Real Madrid', 'Real Madrid', 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', 'B', 3),
          (starter_tourney_id, 'Jazzynorman', 'Corinthians', 'Corinthians', 'https://upload.wikimedia.org/wikipedia/en/5/5a/Sport_Club_Corinthians_Paulista_crest.svg', 'B', 4),

          (starter_tourney_id, 'Roger Muncaster', 'Paris Saint-Germain', 'Paris Saint-Germain', 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg', 'C', 1),
          (starter_tourney_id, 'Nenga', 'Olympique de Marseille', 'Olympique de Marseille', 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg', 'C', 2),
          (starter_tourney_id, 'KJ Warriors', 'AFC Ajax', 'AFC Ajax', 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg', 'C', 3),
          (starter_tourney_id, 'Mshana Ai', 'Juventus', 'Juventus', 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg', 'C', 4),

          (starter_tourney_id, 'Wise Meek', 'Borussia Dortmund', 'Borussia Dortmund', 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg', 'D', 1),
          (starter_tourney_id, 'Dedgurury', 'Inter Milan', 'Inter Milan', 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg', 'D', 2),
          (starter_tourney_id, 'Betwery', 'Atlético Madrid', 'Atlético Madrid', 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg', 'D', 3),
          (starter_tourney_id, 'YoungKing', 'RB Leipzig', 'RB Leipzig', 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2020_logo.svg', 'D', 4),

          (starter_tourney_id, 'Muhyuzoh', 'SSC Napoli', 'SSC Napoli', 'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg', 'E', 1),
          (starter_tourney_id, 'Ivory Coast', 'LOSC Lille', 'LOSC Lille', 'https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg', 'E', 2),
          (starter_tourney_id, 'Budo', 'Aston Villa', 'Aston Villa', 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg', 'E', 3),
          (starter_tourney_id, '45balo', 'Nottingham Forest', 'Nottingham Forest', 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg', 'E', 4),

          (starter_tourney_id, 'Kachuma', 'Tottenham Hotspur', 'Tottenham Hotspur', 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg', 'F', 1),
          (starter_tourney_id, 'Drexypal64', 'Brighton & Hove Albion', 'Brighton & Hove Albion', 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg', 'F', 2),
          (starter_tourney_id, 'Man of people', 'Brentford', 'Brentford', 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg', 'F', 3),
          (starter_tourney_id, 'Moyo', 'Everton', 'Everton', 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg', 'F', 4);
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
