/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Robust Logo Dictionary for eFootball Tournament
 * Maps exact club names, player aliases, and acronyms to reliable sports CDN / Wikimedia crests.
 * Specifically guarantees high-reliability PNGs/SVGs for:
 * - Aston Villa (Budo)
 * - RB Leipzig (YoungKing)
 * - Brighton (Drexypal64)
 * - LOSC Lille (Ivory Coast)
 * - Juventus (Mshana Ai)
 */

export interface ClubLogoEntry {
  clubName: string;
  shortCode: string;
  primaryLogoUrl: string;
  fallbackLogoUrl?: string;
  playerAliases: string[];
}

export const CLUB_LOGO_REGISTRY: Record<string, ClubLogoEntry> = {
  'aston villa': {
    clubName: 'Aston Villa',
    shortCode: 'AVL',
    primaryLogoUrl: 'https://crests.football-data.org/58.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg',
    playerAliases: ['budo', 'avl', 'aston villa fc', 'aston villa'],
  },
  'rb leipzig': {
    clubName: 'RB Leipzig',
    shortCode: 'RBL',
    primaryLogoUrl: 'https://crests.football-data.org/721.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2020_logo.svg',
    playerAliases: ['youngking', 'rbl', 'leipzig', 'rasenballsport leipzig'],
  },
  'brighton & hove albion': {
    clubName: 'Brighton & Hove Albion',
    shortCode: 'BHA',
    primaryLogoUrl: 'https://crests.football-data.org/397.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/fd/Brighton_%26_Hove_Albion_logo.svg',
    playerAliases: ['drexypal64', 'brighton', 'bha', 'brighton and hove albion'],
  },
  'losc lille': {
    clubName: 'LOSC Lille',
    shortCode: 'LIL',
    primaryLogoUrl: 'https://crests.football-data.org/521.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/6/6f/LOSC_Lille_logo.svg',
    playerAliases: ['ivory coast', 'lille', 'lil', 'losc'],
  },
  'juventus': {
    clubName: 'Juventus',
    shortCode: 'JUV',
    primaryLogoUrl: 'https://crests.football-data.org/109.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    playerAliases: ['mshana ai', 'juve', 'juv', 'juventus fc'],
  },
  'manchester united': {
    clubName: 'Manchester United',
    shortCode: 'MUN',
    primaryLogoUrl: 'https://crests.football-data.org/66.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg',
    playerAliases: ['huncho', 'man utd', 'mufc', 'mun'],
  },
  'arsenal': {
    clubName: 'Arsenal',
    shortCode: 'ARS',
    primaryLogoUrl: 'https://crests.football-data.org/57.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    playerAliases: ['christian', 'gunners', 'ars'],
  },
  'fc barcelona': {
    clubName: 'FC Barcelona',
    shortCode: 'BAR',
    primaryLogoUrl: 'https://crests.football-data.org/81.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    playerAliases: ['she cheated me', 'barca', 'barcelona', 'bar', 'fcb'],
  },
  'liverpool fc': {
    clubName: 'Liverpool FC',
    shortCode: 'LIV',
    primaryLogoUrl: 'https://crests.football-data.org/64.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    playerAliases: ['elly hunter', 'liverpool', 'liv', 'lfc'],
  },
  'inter miami': {
    clubName: 'Inter Miami',
    shortCode: 'MIA',
    primaryLogoUrl: 'https://images.fotmob.com/image_resources/logo/teamlogo/1126742.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5c/Inter_Miami_CF_logo.svg',
    playerAliases: ['ice_emaestro', 'miami', 'mia', 'inter miami cf'],
  },
  'bayern munich': {
    clubName: 'Bayern Munich',
    shortCode: 'BAY',
    primaryLogoUrl: 'https://crests.football-data.org/5.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    playerAliases: ['benin', 'bayern', 'bay', 'fc bayern munich'],
  },
  'real madrid': {
    clubName: 'Real Madrid',
    shortCode: 'RMA',
    primaryLogoUrl: 'https://crests.football-data.org/86.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    playerAliases: ['g.o.a.t', 'real', 'rma', 'real madrid cf'],
  },
  'corinthians': {
    clubName: 'Corinthians',
    shortCode: 'COR',
    primaryLogoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/874.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/5/5a/Sport_Club_Corinthians_Paulista_crest.svg',
    playerAliases: ['jazzynorman', 'jazzy norman', 'jazzy', 'norman', 'corinthians', 'cor', 'sport club corinthians paulista', 's.c. corinthians paulista'],
  },
  'paris saint-germain': {
    clubName: 'Paris Saint-Germain',
    shortCode: 'PSG',
    primaryLogoUrl: 'https://crests.football-data.org/524.png',
    fallbackLogoUrl: 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/160.png',
    playerAliases: ['roger muncaster', 'roger', 'muncaster', 'psg', 'paris saint-germain', 'paris sg', 'paris saint germain', 'paris'],
  },
  'olympique de marseille': {
    clubName: 'Olympique de Marseille',
    shortCode: 'OM',
    primaryLogoUrl: 'https://crests.football-data.org/516.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Olympique_Marseille_logo.svg',
    playerAliases: ['nenga', 'marseille', 'om'],
  },
  'afc ajax': {
    clubName: 'AFC Ajax',
    shortCode: 'AJX',
    primaryLogoUrl: 'https://crests.football-data.org/678.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg',
    playerAliases: ['kj warriors', 'ajax', 'ajx'],
  },
  'borussia dortmund': {
    clubName: 'Borussia Dortmund',
    shortCode: 'BVB',
    primaryLogoUrl: 'https://crests.football-data.org/4.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    playerAliases: ['wise meek', 'dortmund', 'bvb'],
  },
  'inter milan': {
    clubName: 'Inter Milan',
    shortCode: 'INT',
    primaryLogoUrl: 'https://crests.football-data.org/108.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    playerAliases: ['dedgurury', 'inter', 'internazionale', 'int'],
  },
  'atlético madrid': {
    clubName: 'Atlético Madrid',
    shortCode: 'ATM',
    primaryLogoUrl: 'https://crests.football-data.org/78.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    playerAliases: ['betwery', 'atletico', 'atleti', 'atm', 'atletico madrid'],
  },
  'ssc napoli': {
    clubName: 'SSC Napoli',
    shortCode: 'NAP',
    primaryLogoUrl: 'https://crests.football-data.org/113.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/00/SSC_Napoli_2024_%28deep_blue_navy%29.svg',
    playerAliases: ['muhyuzoh', 'napoli', 'nap'],
  },
  'nottingham forest': {
    clubName: 'Nottingham Forest',
    shortCode: 'NFO',
    primaryLogoUrl: 'https://crests.football-data.org/351.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/e/e5/Nottingham_Forest_F.C._logo.svg',
    playerAliases: ['45balo', 'nottingham', 'forest', 'nfo'],
  },
  'tottenham hotspur': {
    clubName: 'Tottenham Hotspur',
    shortCode: 'TOT',
    primaryLogoUrl: 'https://crests.football-data.org/73.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
    playerAliases: ['kachuma', 'spurs', 'tottenham', 'tot'],
  },
  'brentford': {
    clubName: 'Brentford',
    shortCode: 'BRE',
    primaryLogoUrl: 'https://crests.football-data.org/402.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/2a/Brentford_FC_crest.svg',
    playerAliases: ['man of people', 'brentford fc', 'bre'],
  },
  'everton': {
    clubName: 'Everton',
    shortCode: 'EVE',
    primaryLogoUrl: 'https://crests.football-data.org/62.png',
    fallbackLogoUrl: 'https://upload.wikimedia.org/wikipedia/en/7/7c/Everton_FC_logo.svg',
    playerAliases: ['moyo', 'everton fc', 'eve', 'toffees'],
  },
};

/**
 * Normalizes input string to find matched registry key
 */
function cleanKey(val: string): string {
  return val
    .toLowerCase()
    .replace(/[^\w\s&]/g, '')
    .trim();
}

/**
 * Retrieves the reliable, high-quality crest URL for any given club name, player name, or existing URL.
 * Special priority is guaranteed for:
 * - Aston Villa (Budo)
 * - RB Leipzig (YoungKing)
 * - Brighton (Drexypal64)
 * - LOSC Lille (Ivory Coast)
 * - Juventus (Mshana Ai)
 */
export function getReliableClubLogo(
  identifier?: string | null,
  fallbackUrl?: string | null
): string {
  if (!identifier) {
    return fallbackUrl || '';
  }

  const normalized = cleanKey(identifier);

  // 1. Direct key match in registry
  if (CLUB_LOGO_REGISTRY[normalized]) {
    return CLUB_LOGO_REGISTRY[normalized].primaryLogoUrl;
  }

  // 2. Check player aliases and partial matches
  for (const entry of Object.values(CLUB_LOGO_REGISTRY)) {
    const isPlayerMatch = entry.playerAliases.some(
      (alias) => alias === normalized || normalized.includes(alias) || alias.includes(normalized)
    );
    const isClubMatch =
      cleanKey(entry.clubName) === normalized ||
      cleanKey(entry.clubName).includes(normalized) ||
      normalized.includes(cleanKey(entry.clubName));

    if (isPlayerMatch || isClubMatch) {
      return entry.primaryLogoUrl;
    }
  }

  // 3. If provided URL already looks valid and is not a broken URL
  if (fallbackUrl && fallbackUrl.startsWith('http')) {
    return fallbackUrl;
  }

  return '';
}

/**
 * Secondary fallback URL if primary fails to load
 */
export function getSecondaryFallbackLogo(identifier?: string | null): string {
  if (!identifier) return '';
  const normalized = cleanKey(identifier);

  for (const entry of Object.values(CLUB_LOGO_REGISTRY)) {
    const isPlayerMatch = entry.playerAliases.some(
      (alias) => alias === normalized || normalized.includes(alias) || alias.includes(normalized)
    );
    const isClubMatch =
      cleanKey(entry.clubName) === normalized ||
      cleanKey(entry.clubName).includes(normalized) ||
      normalized.includes(cleanKey(entry.clubName));

    if ((isPlayerMatch || isClubMatch) && entry.fallbackLogoUrl) {
      return entry.fallbackLogoUrl;
    }
  }

  return '';
}
