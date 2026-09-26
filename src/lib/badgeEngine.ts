/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Match, Team, TeamAchievement, MedalTier } from '../types/tournament';
import { calculateStandings, calculateGroupStandings, GROUPS } from './tournamentEngine';

export interface BadgeDefinition {
  key: string;
  title: string;
  description: string;
  tier: MedalTier;
  icon: string;
  category: 'championship' | 'attack' | 'defense' | 'streak' | 'special';
  points: number;
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  champion: {
    key: 'champion',
    title: 'Tournament Champion',
    description: 'Crowned Supreme Champion of the eFootball Tournament.',
    tier: 'mythic',
    icon: '👑',
    category: 'championship',
    points: 1000,
  },
  runner_up: {
    key: 'runner_up',
    title: 'Grand Finalist',
    description: 'Reached the Championship Final as Silver Medalist.',
    tier: 'diamond',
    icon: '🥈',
    category: 'championship',
    points: 600,
  },
  third_place: {
    key: 'third_place',
    title: 'Bronze Laurels',
    description: 'Secured 3rd place podium finish in the tournament.',
    tier: 'gold',
    icon: '🥉',
    category: 'championship',
    points: 400,
  },
  invincible: {
    key: 'invincible',
    title: 'The Invincibles',
    description: 'Maintained an undefeated record (0 losses) with 4+ matches played.',
    tier: 'mythic',
    icon: '⚡',
    category: 'streak',
    points: 750,
  },
  group_winner: {
    key: 'group_winner',
    title: 'Group Stage Conqueror',
    description: 'Finished 1st place in their respective Group Stage group.',
    tier: 'gold',
    icon: '🌟',
    category: 'championship',
    points: 300,
  },
  golden_boot: {
    key: 'golden_boot',
    title: 'Golden Boot Firepower',
    description: 'Scored 10 or more total goals in the tournament.',
    tier: 'gold',
    icon: '🚀',
    category: 'attack',
    points: 350,
  },
  supreme_firepower: {
    key: 'supreme_firepower',
    title: 'Avalanche of Goals',
    description: 'Scored 18 or more goals across all tournament stages.',
    tier: 'diamond',
    icon: '🔥',
    category: 'attack',
    points: 600,
  },
  iron_wall: {
    key: 'iron_wall',
    title: 'Iron Wall Defense',
    description: 'Recorded 3 or more clean sheet shutouts.',
    tier: 'gold',
    icon: '🛡️',
    category: 'defense',
    points: 350,
  },
  unbreachable_fortress: {
    key: 'unbreachable_fortress',
    title: 'Unbreachable Fortress',
    description: 'Conceded 3 or fewer goals with at least 4 matches played.',
    tier: 'diamond',
    icon: '🏰',
    category: 'defense',
    points: 500,
  },
  blowout_master: {
    key: 'blowout_master',
    title: 'Demolition Derby',
    description: 'Won a single match by a margin of 4 or more goals.',
    tier: 'gold',
    icon: '💥',
    category: 'special',
    points: 300,
  },
  goal_fest_hero: {
    key: 'goal_fest_hero',
    title: 'Thriller Winner',
    description: 'Triumphed in an epic match with 6 or more total combined goals.',
    tier: 'silver',
    icon: '🎯',
    category: 'special',
    points: 250,
  },
  clutch_warrior: {
    key: 'clutch_warrior',
    title: 'Penalty Shootout Victor',
    description: 'Won a knockout penalty shootout under immense pressure.',
    tier: 'gold',
    icon: '🧤',
    category: 'streak',
    points: 400,
  },
  five_streak: {
    key: 'five_streak',
    title: 'Unstoppable Momentum',
    description: 'Achieved 4 consecutive match victories.',
    tier: 'diamond',
    icon: '☄️',
    category: 'streak',
    points: 500,
  },
  sharp_shooter: {
    key: 'sharp_shooter',
    title: 'Clinical Strike Rate',
    description: 'Averaged 2.5 or more goals per match with 3+ matches played.',
    tier: 'silver',
    icon: '🏹',
    category: 'attack',
    points: 250,
  },
  knockout_qualifier: {
    key: 'knockout_qualifier',
    title: '16 Bora Qualifier',
    description: 'Secured qualification into the Round of 16 Knockout Phase.',
    tier: 'bronze',
    icon: '🎫',
    category: 'championship',
    points: 150,
  },
};

export const computeTeamAchievements = (
  teams: Team[],
  matches: Match[],
  tournamentId?: string
): TeamAchievement[] => {
  const achievements: TeamAchievement[] = [];
  const playedMatches = matches.filter(
    (m) => m.is_played && m.home_score !== null && m.away_score !== null
  );

  const standingsObj = calculateStandings(teams, matches);
  const allStandings = Object.values(standingsObj.groups).flat();

  // Group standings lookup
  const group1stPlaceTeamIds = new Set<string>();
  GROUPS.forEach((g) => {
    const gStandings = calculateGroupStandings(g, teams, matches);
    if (gStandings.length > 0 && gStandings[0].played > 0) {
      group1stPlaceTeamIds.add(gStandings[0].team.id);
    }
  });

  // Check Final match for Champion and Runner-up
  const finalMatch = matches.find((m) => m.match_type === 'Final' && m.is_played);
  let championTeamId: string | null = null;
  let runnerUpTeamId: string | null = null;

  if (finalMatch && finalMatch.home_score !== null && finalMatch.away_score !== null) {
    const homeWin =
      finalMatch.home_score > finalMatch.away_score ||
      (finalMatch.home_score === finalMatch.away_score && (finalMatch.home_penalties ?? 0) > (finalMatch.away_penalties ?? 0));
    
    if (homeWin) {
      championTeamId = finalMatch.home_team_id;
      runnerUpTeamId = finalMatch.away_team_id;
    } else {
      championTeamId = finalMatch.away_team_id;
      runnerUpTeamId = finalMatch.home_team_id;
    }
  }

  teams.forEach((team) => {
    const teamMatches = playedMatches.filter(
      (m) => m.home_team_id === team.id || m.away_team_id === team.id
    );

    const teamStanding = allStandings.find((s) => s.team.id === team.id);
    const playedCount = teamMatches.length;
    if (playedCount === 0) return;

    let wonCount = 0;
    let lostCount = 0;
    let goalsScored = 0;
    let goalsConceded = 0;
    let cleanSheets = 0;
    let maxMargin = 0;
    let hasHighScoringWin = false;
    let wonPenaltyShootout = false;
    let consecutiveWins = 0;
    let maxConsecutiveWins = 0;

    teamMatches.forEach((m) => {
      const isHome = m.home_team_id === team.id;
      const scored = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
      const conceded = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);
      const myPens = isHome ? (m.home_penalties ?? null) : (m.away_penalties ?? null);
      const oppPens = isHome ? (m.away_penalties ?? null) : (m.home_penalties ?? null);

      goalsScored += scored;
      goalsConceded += conceded;

      if (conceded === 0) cleanSheets++;

      const isRegWin = scored > conceded;
      const isPenWin = scored === conceded && myPens !== null && oppPens !== null && myPens > oppPens;

      if (isRegWin || isPenWin) {
        wonCount++;
        consecutiveWins++;
        if (consecutiveWins > maxConsecutiveWins) maxConsecutiveWins = consecutiveWins;

        const margin = scored - conceded;
        if (margin > maxMargin) maxMargin = margin;

        if (scored + conceded >= 6) hasHighScoringWin = true;
        if (isPenWin) wonPenaltyShootout = true;
      } else if (scored < conceded || (scored === conceded && myPens !== null && oppPens !== null && myPens < oppPens)) {
        lostCount++;
        consecutiveWins = 0;
      } else {
        consecutiveWins = 0;
      }
    });

    const addBadge = (defKey: string, metadata?: Record<string, any>) => {
      const def = BADGE_DEFINITIONS[defKey];
      if (!def) return;
      achievements.push({
        id: `${tournamentId || 'tour'}_${team.id}_${defKey}`,
        tournament_id: tournamentId,
        team_id: team.id,
        badge_key: def.key,
        title: def.title,
        description: def.description,
        tier: def.tier,
        icon: def.icon,
        category: def.category,
        metadata: metadata || {},
      });
    };

    // 1. Champion & Runner-Up
    if (championTeamId === team.id) {
      addBadge('champion');
    }
    if (runnerUpTeamId === team.id) {
      addBadge('runner_up');
    }

    // 2. Invincible (Undefeated)
    if (playedCount >= 4 && lostCount === 0) {
      addBadge('invincible', { played: playedCount, won: wonCount });
    }

    // 3. Group Winner
    if (group1stPlaceTeamIds.has(team.id)) {
      addBadge('group_winner', { group: team.group_id });
    }

    // 4. Knockout Qualifier (reached knockout or finished in top 2/top 3)
    if (teamStanding && (teamStanding.rank <= 16 || group1stPlaceTeamIds.has(team.id))) {
      addBadge('knockout_qualifier');
    }

    // 5. Firepower / Golden Boot
    if (goalsScored >= 18) {
      addBadge('supreme_firepower', { goals: goalsScored });
    } else if (goalsScored >= 10) {
      addBadge('golden_boot', { goals: goalsScored });
    }

    // 6. Sharp Shooter (High avg)
    if (playedCount >= 3 && goalsScored / playedCount >= 2.5) {
      addBadge('sharp_shooter', { avg: (goalsScored / playedCount).toFixed(2) });
    }

    // 7. Iron Wall & Fortress
    if (cleanSheets >= 3) {
      addBadge('iron_wall', { cleanSheets });
    }
    if (playedCount >= 4 && goalsConceded <= 3) {
      addBadge('unbreachable_fortress', { goalsConceded });
    }

    // 8. Blowout Master (4+ margin)
    if (maxMargin >= 4) {
      addBadge('blowout_master', { maxMargin });
    }

    // 9. Goal Fest Thriller Hero
    if (hasHighScoringWin) {
      addBadge('goal_fest_hero');
    }

    // 10. Penalty Clutch Warrior
    if (wonPenaltyShootout) {
      addBadge('clutch_warrior');
    }

    // 11. 4+ Win Streak
    if (maxConsecutiveWins >= 4) {
      addBadge('five_streak', { streak: maxConsecutiveWins });
    }
  });

  return achievements;
};

export const TIER_CONFIG: Record<
  MedalTier,
  {
    label: string;
    border: string;
    bg: string;
    badgeBg: string;
    textColor: string;
    glow: string;
    iconRing: string;
  }
> = {
  mythic: {
    label: 'Mythic Crown',
    border: 'border-amber-400',
    bg: 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/70',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
    textColor: 'text-amber-950',
    glow: 'shadow-amber-200/50',
    iconRing: 'ring-4 ring-amber-400/80 bg-amber-50',
  },
  diamond: {
    label: 'Diamond Elite',
    border: 'border-cyan-400',
    bg: 'bg-gradient-to-br from-cyan-50/80 via-white to-blue-50/70',
    badgeBg: 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white',
    textColor: 'text-cyan-950',
    glow: 'shadow-cyan-200/50',
    iconRing: 'ring-4 ring-cyan-400/80 bg-cyan-50',
  },
  gold: {
    label: 'Gold Medal',
    border: 'border-amber-300',
    bg: 'bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/60',
    badgeBg: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black',
    textColor: 'text-amber-900',
    glow: 'shadow-amber-100',
    iconRing: 'ring-3 ring-amber-300 bg-amber-50',
  },
  silver: {
    label: 'Silver Laurels',
    border: 'border-slate-300',
    bg: 'bg-gradient-to-br from-slate-50 via-white to-slate-100',
    badgeBg: 'bg-slate-700 text-white',
    textColor: 'text-slate-800',
    glow: 'shadow-slate-100',
    iconRing: 'ring-3 ring-slate-300 bg-slate-100',
  },
  bronze: {
    label: 'Bronze Ribbon',
    border: 'border-amber-700/30',
    bg: 'bg-gradient-to-br from-orange-50/40 via-white to-amber-50/40',
    badgeBg: 'bg-amber-800 text-white',
    textColor: 'text-amber-900',
    glow: 'shadow-orange-100',
    iconRing: 'ring-2 ring-amber-700/40 bg-orange-50',
  },
};
