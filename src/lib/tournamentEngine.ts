import { GroupLetter, KnockoutTie, Match, MatchStage, Team, TeamStanding, ThirdPlaceStanding } from '../types/tournament';

export const GROUPS: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

// Shuffle array
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Conduct official random draw into 6 groups of 4
export function conductOfficialDraw(teams: Team[]): Team[] {
  const shuffled = shuffleArray(teams);
  return shuffled.map((team, idx) => {
    const groupIdx = Math.floor(idx / 4);
    const groupLetter = GROUPS[groupIdx] || 'F';
    return {
      ...team,
      group_id: groupLetter,
      pot: (idx % 4) + 1,
    };
  });
}

// =========================================================================
// Prompt 2: Accurate Group Fixture Generator Logic
// =========================================================================
// Takes 6 groups of 4 teams each (either as Team[] with group_id, or Record<GroupLetter, Team[]>)
// Strict Rules:
// 1. Intra-Group Isolation: Teams must ONLY play other teams within their same group.
// 2. Double Round-Robin (Home & Away): 6 matches per team, 12 per group, 72 total matches.
// 3. Balanced Round Scheduling (1 through 6): No team plays twice in the same round.
//    - Round 1 (Leg 1): Team 1 vs Team 2 | Team 3 vs Team 4
//    - Round 2 (Leg 1): Team 1 vs Team 3 | Team 2 vs Team 4
//    - Round 3 (Leg 1): Team 1 vs Team 4 | Team 2 vs Team 3
//    - Rounds 4–6 (Leg 2): Exact reverse venues of Rounds 1–3
// Returns an array of match objects formatted for insertion into the Supabase matches table.
export function generateIntraGroupFixtures(
  groupsInput: Team[] | Record<GroupLetter, Team[]>
): Match[] {
  const matches: Match[] = [];

  GROUPS.forEach((groupLetter) => {
    let groupTeams: Team[];
    if (Array.isArray(groupsInput)) {
      groupTeams = groupsInput.filter((t) => t.group_id === groupLetter);
    } else {
      groupTeams = groupsInput[groupLetter] || [];
    }

    if (groupTeams.length < 4) return;

    const [t1, t2, t3, t4] = groupTeams;

    // Strict 6-round schedule:
    // Round 1 (Leg 1): Team 1 vs Team 2 | Team 3 vs Team 4
    // Round 2 (Leg 1): Team 1 vs Team 3 | Team 2 vs Team 4
    // Round 3 (Leg 1): Team 1 vs Team 4 | Team 2 vs Team 3
    // Round 4 (Leg 2): Team 2 vs Team 1 | Team 4 vs Team 3 (Reverse of R1)
    // Round 5 (Leg 2): Team 3 vs Team 1 | Team 4 vs Team 2 (Reverse of R2)
    // Round 6 (Leg 2): Team 4 vs Team 1 | Team 3 vs Team 2 (Reverse of R3)
    const schedule: Array<{
      home: Team;
      away: Team;
      round: number;
      leg: 1 | 2;
      pairKey: string;
    }> = [
      // Leg 1
      { home: t1, away: t2, round: 1, leg: 1, pairKey: `${groupLetter}-1-2` },
      { home: t3, away: t4, round: 1, leg: 1, pairKey: `${groupLetter}-3-4` },
      { home: t1, away: t3, round: 2, leg: 1, pairKey: `${groupLetter}-1-3` },
      { home: t2, away: t4, round: 2, leg: 1, pairKey: `${groupLetter}-2-4` },
      { home: t1, away: t4, round: 3, leg: 1, pairKey: `${groupLetter}-1-4` },
      { home: t2, away: t3, round: 3, leg: 1, pairKey: `${groupLetter}-2-3` },
      // Leg 2 (Exact reverse venues)
      { home: t2, away: t1, round: 4, leg: 2, pairKey: `${groupLetter}-1-2` },
      { home: t4, away: t3, round: 4, leg: 2, pairKey: `${groupLetter}-3-4` },
      { home: t3, away: t1, round: 5, leg: 2, pairKey: `${groupLetter}-1-3` },
      { home: t4, away: t2, round: 5, leg: 2, pairKey: `${groupLetter}-2-4` },
      { home: t4, away: t1, round: 6, leg: 2, pairKey: `${groupLetter}-1-4` },
      { home: t3, away: t2, round: 6, leg: 2, pairKey: `${groupLetter}-2-3` },
    ];

    schedule.forEach((item, idx) => {
      matches.push({
        id: `match-grp-${groupLetter}-r${item.round}-${idx + 1}`,
        home_team_id: item.home.id,
        away_team_id: item.away.id,
        home_score: null,
        away_score: null,
        match_type: 'Group',
        is_played: false,
        group_id: groupLetter,
        leg: item.leg,
        round_number: item.round,
        tie_id: `tie-${item.pairKey}`,
      });
    });
  });

  return matches;
}

// Backward-compatible aliases
export const generateGroupFixtures = generateIntraGroupFixtures;
export const generateGroupMatches = generateIntraGroupFixtures;

// Calculate Head-to-Head points between two tied teams
function calculateHeadToHeadPoints(teamAId: string, teamBId: string, groupMatches: Match[]): number {
  let aPoints = 0;
  let bPoints = 0;

  groupMatches.forEach((m) => {
    if (!m.is_played || m.home_score === null || m.away_score === null) return;
    if (m.home_team_id === teamAId && m.away_team_id === teamBId) {
      if (m.home_score > m.away_score) aPoints += 3;
      else if (m.home_score < m.away_score) bPoints += 3;
      else {
        aPoints += 1;
        bPoints += 1;
      }
    } else if (m.home_team_id === teamBId && m.away_team_id === teamAId) {
      if (m.home_score > m.away_score) bPoints += 3;
      else if (m.home_score < m.away_score) aPoints += 3;
      else {
        aPoints += 1;
        bPoints += 1;
      }
    }
  });

  return aPoints - bPoints;
}

// Calculate group standings for one group
export function calculateGroupStandings(
  groupLetter: GroupLetter,
  teams: Team[],
  matches: Match[]
): TeamStanding[] {
  const groupTeams = teams.filter((t) => t.group_id === groupLetter);
  const groupMatches = matches.filter((m) => m.group_id === groupLetter && m.match_type === 'Group');

  const statsMap: Record<string, TeamStanding> = {};

  groupTeams.forEach((team) => {
    statsMap[team.id] = {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      rank: 1,
    };
  });

  groupMatches.forEach((m) => {
    if (!m.is_played || m.home_score === null || m.away_score === null) return;

    const home = statsMap[m.home_team_id];
    const away = statsMap[m.away_team_id];

    if (!home || !away) return;

    home.played += 1;
    away.played += 1;

    home.goalsFor += m.home_score;
    home.goalsAgainst += m.away_score;
    home.goalDifference = home.goalsFor - home.goalsAgainst;

    away.goalsFor += m.away_score;
    away.goalsAgainst += m.home_score;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (m.home_score > m.away_score) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
      home.form.push('W');
      away.form.push('L');
    } else if (m.home_score < m.away_score) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
      home.form.push('L');
      away.form.push('W');
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
      home.form.push('D');
      away.form.push('D');
    }
  });

  // Sort by Points -> GD -> GF -> H2H -> Name
  const standings = Object.values(statsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

    const h2h = calculateHeadToHeadPoints(a.team.id, b.team.id, groupMatches);
    if (h2h !== 0) return -h2h;

    return a.team.name.localeCompare(b.team.name);
  });

  standings.forEach((s, idx) => {
    s.rank = idx + 1;
    if (idx < 2) {
      s.status = 'qualified';
    } else if (idx === 2) {
      s.status = 'contender';
    } else {
      s.status = 'eliminated';
    }
  });

  return standings;
}

// Calculate the 3rd-Place Mini-League ranking across all 6 groups
export function calculateThirdPlaceMiniLeague(teams: Team[], matches: Match[]): ThirdPlaceStanding[] {
  const thirdPlaceList: ThirdPlaceStanding[] = [];

  GROUPS.forEach((g) => {
    const groupStanding = calculateGroupStandings(g, teams, matches);
    if (groupStanding.length >= 3) {
      const third = groupStanding[2];
      thirdPlaceList.push({
        ...third,
        originalGroup: g,
        isQualified: false,
      });
    }
  });

  // Sort 3rd place teams: Points -> Goal Difference -> Goals For -> Team Name
  thirdPlaceList.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });

  // Top 4 qualify!
  thirdPlaceList.forEach((teamStanding, idx) => {
    teamStanding.rank = idx + 1;
    teamStanding.isQualified = idx < 4;
    teamStanding.status = idx < 4 ? 'qualified' : 'eliminated';
  });

  return thirdPlaceList;
}

// Prompt 3: The Standings Engine (Groups & 3rd Place)
// Returns six arrays representing standings for Groups A through F,
// plus one array ranking the six 3rd-placed teams against each other to find the top 4.
export interface TournamentStandings {
  groups: Record<GroupLetter, TeamStanding[]>;
  groupA: TeamStanding[];
  groupB: TeamStanding[];
  groupC: TeamStanding[];
  groupD: TeamStanding[];
  groupE: TeamStanding[];
  groupF: TeamStanding[];
  thirdPlaceStandings: ThirdPlaceStanding[];
  top4ThirdPlaced: ThirdPlaceStanding[];
}

export function calculateStandings(teams: Team[], matches: Match[]): TournamentStandings {
  const groups: Record<GroupLetter, TeamStanding[]> = {
    A: calculateGroupStandings('A', teams, matches),
    B: calculateGroupStandings('B', teams, matches),
    C: calculateGroupStandings('C', teams, matches),
    D: calculateGroupStandings('D', teams, matches),
    E: calculateGroupStandings('E', teams, matches),
    F: calculateGroupStandings('F', teams, matches),
  };

  const thirdPlaceStandings = calculateThirdPlaceMiniLeague(teams, matches);
  const top4ThirdPlaced = thirdPlaceStandings.filter((t) => t.isQualified);

  return {
    groups,
    groupA: groups.A,
    groupB: groups.B,
    groupC: groups.C,
    groupD: groups.D,
    groupE: groups.E,
    groupF: groups.F,
    thirdPlaceStandings,
    top4ThirdPlaced,
  };
}

// Custom React hook version of calculateStandings
export function useTournamentStandings(teams: Team[], matches: Match[]): TournamentStandings {
  return calculateStandings(teams, matches);
}

// Generate the 16 Bora (Round of 16) pairings
// Standard cross-pairing avoiding same-group encounters
export function generateRoundOf16Matches(
  teams: Team[],
  matches: Match[],
  options?: { regenerate?: boolean }
): Match[] {
  // Check if Ro16 already has matches and not regenerating
  const existingRo16 = matches.filter((m) => m.match_type === 'Ro16');
  if (existingRo16.length > 0 && !options?.regenerate) {
    return existingRo16;
  }

  // 1. Gather all 1st and 2nd place teams
  const groupWinners: Record<GroupLetter, Team | null> = {
    A: null,
    B: null,
    C: null,
    D: null,
    E: null,
    F: null,
  };
  const groupRunnersUp: Record<GroupLetter, Team | null> = {
    A: null,
    B: null,
    C: null,
    D: null,
    E: null,
    F: null,
  };

  GROUPS.forEach((g) => {
    const standings = calculateGroupStandings(g, teams, matches);
    if (standings.length >= 2) {
      groupWinners[g] = standings[0].team;
      groupRunnersUp[g] = standings[1].team;
    }
  });

  // 2. Gather top 4 third-place qualifiers
  const thirdPlaceLeague = calculateThirdPlaceMiniLeague(teams, matches);
  const qualifiedThirds = thirdPlaceLeague.filter((t) => t.isQualified).map((t) => t.team);

  // Cross-pairing matrix to strictly avoid same-group matchups
  // Tie 1: Winner B vs 3rd Place (prefer not from B)
  // Tie 2: Winner A vs Runner-up C
  // Tie 3: Winner F vs Runner-up E
  // Tie 4: Runner-up B vs Runner-up D
  // Tie 5: Winner E vs 3rd Place (prefer not from E)
  // Tie 6: Winner D vs 3rd Place (prefer not from D)
  // Tie 7: Winner C vs 3rd Place (prefer not from C)
  // Tie 8: Runner-up A vs Runner-up F

  const usedThirds = new Set<string>();

  function pickThirdPlace(avoidGroup: GroupLetter): Team | null {
    const available = qualifiedThirds.filter(
      (t) => !usedThirds.has(t.id) && t.group_id !== avoidGroup
    );
    if (available.length > 0) {
      const selected = available[0];
      usedThirds.add(selected.id);
      return selected;
    }
    // Fallback if strict group avoidance exhausted
    const fallback = qualifiedThirds.find((t) => !usedThirds.has(t.id));
    if (fallback) {
      usedThirds.add(fallback.id);
      return fallback;
    }
    return null;
  }

  const pairings: { home: Team | null; away: Team | null; tieNumber: number }[] = [
    { home: groupWinners.B, away: pickThirdPlace('B'), tieNumber: 1 },
    { home: groupWinners.A, away: groupRunnersUp.C, tieNumber: 2 },
    { home: groupWinners.F, away: groupRunnersUp.E, tieNumber: 3 },
    { home: groupRunnersUp.B, away: groupRunnersUp.D, tieNumber: 4 },
    { home: groupWinners.E, away: pickThirdPlace('E'), tieNumber: 5 },
    { home: groupWinners.D, away: pickThirdPlace('D'), tieNumber: 6 },
    { home: groupWinners.C, away: pickThirdPlace('C'), tieNumber: 7 },
    { home: groupRunnersUp.A, away: groupRunnersUp.F, tieNumber: 8 },
  ];

  const ro16Matches: Match[] = [];

  pairings.forEach((p) => {
    if (!p.home || !p.away) return;
    const tieId = `tie-ro16-${p.tieNumber}`;

    // Leg 1: Away team hosts Leg 1 (standard European format where group winner visits in Leg 1)
    ro16Matches.push({
      id: `match-ro16-${p.tieNumber}-leg1`,
      home_team_id: p.away.id,
      away_team_id: p.home.id,
      home_score: null,
      away_score: null,
      match_type: 'Ro16',
      is_played: false,
      leg: 1,
      tie_id: tieId,
      round_number: p.tieNumber,
    });

    // Leg 2: Higher seed hosts Leg 2
    ro16Matches.push({
      id: `match-ro16-${p.tieNumber}-leg2`,
      home_team_id: p.home.id,
      away_team_id: p.away.id,
      home_score: null,
      away_score: null,
      match_type: 'Ro16',
      is_played: false,
      leg: 2,
      tie_id: tieId,
      round_number: p.tieNumber,
    });
  });

  return ro16Matches;
}

// Compute Knockout Ties with aggregate scores and penalty shootouts
export function computeKnockoutTies(
  stage: MatchStage,
  matches: Match[],
  teams: Team[]
): KnockoutTie[] {
  const stageMatches = matches.filter((m) => m.match_type === stage);
  const tieMap = new Map<string, { leg1: Match | null; leg2: Match | null; number: number }>();

  stageMatches.forEach((m) => {
    const tieId = m.tie_id || `tie-${m.id}`;
    if (!tieMap.has(tieId)) {
      tieMap.set(tieId, { leg1: null, leg2: null, number: m.round_number || 1 });
    }
    const entry = tieMap.get(tieId)!;
    if (m.leg === 2) {
      entry.leg2 = m;
    } else {
      entry.leg1 = m;
    }
  });

  const ties: KnockoutTie[] = [];
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));

  tieMap.forEach((entry, tieId) => {
    const { leg1, leg2, number } = entry;
    // Identify teams:
    // In our setup, leg2 home team is team A, away team is team B. In leg1, team B is home and team A is away.
    // If only leg1 exists (or single match final), home is leg1.home_team_id
    let homeTeam: Team | null = null;
    let awayTeam: Team | null = null;

    if (leg2) {
      homeTeam = teamMap.get(leg2.home_team_id) || null;
      awayTeam = teamMap.get(leg2.away_team_id) || null;
    } else if (leg1) {
      homeTeam = teamMap.get(leg1.home_team_id) || null;
      awayTeam = teamMap.get(leg1.away_team_id) || null;
    }

    if (!homeTeam || !awayTeam) return;

    let aggHome = 0;
    let aggAway = 0;
    let isCompleted = false;

    if (leg1 && leg1.is_played && leg1.home_score !== null && leg1.away_score !== null) {
      if (leg2) {
        // Leg 1: awayTeam was home, homeTeam was away
        aggHome += leg1.away_score;
        aggAway += leg1.home_score;
      } else {
        // Single match tie
        aggHome += leg1.home_score;
        aggAway += leg1.away_score;
        isCompleted = true;
      }
    }

    if (leg2 && leg2.is_played && leg2.home_score !== null && leg2.away_score !== null) {
      // Leg 2: homeTeam is home, awayTeam is away
      aggHome += leg2.home_score;
      aggAway += leg2.away_score;
      if (leg1?.is_played) {
        isCompleted = true;
      }
    }

    let winnerTeamId: string | null = null;
    let needsPenalties = false;

    if (isCompleted) {
      if (aggHome > aggAway) {
        winnerTeamId = homeTeam.id;
      } else if (aggAway > aggHome) {
        winnerTeamId = awayTeam.id;
      } else {
        // Aggregate is tied! Check penalty score on leg2 (or leg1 if single)
        const decidingMatch = leg2 || leg1;
        if (
          decidingMatch?.home_penalties !== null &&
          decidingMatch?.away_penalties !== null &&
          decidingMatch?.home_penalties !== undefined &&
          decidingMatch?.away_penalties !== undefined
        ) {
          if (decidingMatch.home_penalties > decidingMatch.away_penalties) {
            winnerTeamId = decidingMatch.home_team_id;
          } else if (decidingMatch.away_penalties > decidingMatch.home_penalties) {
            winnerTeamId = decidingMatch.away_team_id;
          }
        } else {
          needsPenalties = true;
        }
      }
    }

    ties.push({
      tieId,
      stage,
      matchNumber: number,
      homeTeam,
      awayTeam,
      leg1,
      leg2,
      aggregateHomeScore: aggHome,
      aggregateAwayScore: aggAway,
      winnerTeamId,
      isCompleted,
      needsPenalties,
    });
  });

  return ties.sort((a, b) => a.matchNumber - b.matchNumber);
}

// Generate subsequent knockout rounds (QF -> SF -> Final) from completed previous rounds
export function generateNextKnockoutStage(
  currentStage: 'Ro16' | 'QF' | 'SF',
  allMatches: Match[],
  teams: Team[],
  finalIsTwoLegs: boolean = false
): Match[] {
  const nextStage: MatchStage =
    currentStage === 'Ro16' ? 'QF' : currentStage === 'QF' ? 'SF' : 'Final';

  const currentTies = computeKnockoutTies(currentStage, allMatches, teams);

  // We need pairs of winners to advance
  const winners: Team[] = [];
  currentTies.forEach((tie) => {
    if (tie.winnerTeamId) {
      const winner = teams.find((t) => t.id === tie.winnerTeamId);
      if (winner) winners.push(winner);
    }
  });

  const nextMatches: Match[] = [];
  const expectedTies = currentTies.length / 2;

  for (let i = 0; i < expectedTies; i++) {
    const team1 = winners[i * 2] || null;
    const team2 = winners[i * 2 + 1] || null;

    if (team1 && team2) {
      const tieId = `tie-${nextStage.toLowerCase()}-${i + 1}`;
      const isTwoLegs = nextStage === 'Final' ? finalIsTwoLegs : true;

      // Leg 1
      nextMatches.push({
        id: `match-${nextStage.toLowerCase()}-${i + 1}-leg1`,
        home_team_id: team2.id,
        away_team_id: team1.id,
        home_score: null,
        away_score: null,
        match_type: nextStage,
        is_played: false,
        leg: 1,
        tie_id: tieId,
        round_number: i + 1,
      });

      if (isTwoLegs) {
        // Leg 2
        nextMatches.push({
          id: `match-${nextStage.toLowerCase()}-${i + 1}-leg2`,
          home_team_id: team1.id,
          away_team_id: team2.id,
          home_score: null,
          away_score: null,
          match_type: nextStage,
          is_played: false,
          leg: 2,
          tie_id: tieId,
          round_number: i + 1,
        });
      }
    }
  }

  return nextMatches;
}

// =========================================================================
// Combined Double-Entry Ties Engine (H2H 2-Leg Pairings for Group & Knockouts)
// =========================================================================
export interface CombinedTieMatchup {
  tieId: string;
  stage: MatchStage;
  groupId?: GroupLetter;
  roundInfo: string;
  teamA: Team;
  teamB: Team;
  leg1: Match;
  leg2: Match | null;
  leg1HomeTeam: Team;
  leg1AwayTeam: Team;
  leg2HomeTeam: Team | null;
  leg2AwayTeam: Team | null;
  teamATotalGoals: number;
  teamBTotalGoals: number;
  isLeg1Played: boolean;
  isLeg2Played: boolean;
  isFullyCompleted: boolean;
  winnerTeamId: string | null;
  isLevel: boolean;
}

export function computeAllCombinedTies(
  matches: Match[],
  teams: Team[]
): CombinedTieMatchup[] {
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const getTeam = (id: string): Team => {
    return (
      teamMap.get(id) || {
        id,
        name: 'Unknown',
        logo_url: '',
        group_id: 'A',
      }
    );
  };

  const results: CombinedTieMatchup[] = [];

  // 1. Group Stage Combined Ties
  const groupMatches = matches.filter((m) => m.match_type === 'Group');
  // Group by group_id and sorted pair key
  const groupPairsMap = new Map<string, Match[]>();

  groupMatches.forEach((m) => {
    const pair = [m.home_team_id, m.away_team_id].sort().join('___');
    const key = `group_${m.group_id || 'A'}_${pair}`;
    if (!groupPairsMap.has(key)) {
      groupPairsMap.set(key, []);
    }
    groupPairsMap.get(key)!.push(m);
  });

  groupPairsMap.forEach((matchList, key) => {
    if (matchList.length === 0) return;
    // Sort matches: lower round number / leg 1 first
    matchList.sort((a, b) => {
      const rA = a.round_number || (a.leg === 2 ? 4 : 1);
      const rB = b.round_number || (b.leg === 2 ? 4 : 1);
      return rA - rB;
    });

    const leg1 = matchList[0];
    const leg2 = matchList[1] || null;

    const teamA = getTeam(leg1.home_team_id);
    const teamB = getTeam(leg1.away_team_id);

    const isLeg1Played = Boolean(leg1.is_played && leg1.home_score !== null && leg1.away_score !== null);
    const isLeg2Played = Boolean(leg2 && leg2.is_played && leg2.home_score !== null && leg2.away_score !== null);
    const isFullyCompleted = isLeg1Played && (leg2 ? isLeg2Played : true);

    let teamATotal = 0;
    let teamBTotal = 0;

    if (isLeg1Played && leg1.home_score !== null && leg1.away_score !== null) {
      teamATotal += leg1.home_score;
      teamBTotal += leg1.away_score;
    }

    let leg2HomeTeam: Team | null = null;
    let leg2AwayTeam: Team | null = null;

    if (leg2) {
      leg2HomeTeam = getTeam(leg2.home_team_id);
      leg2AwayTeam = getTeam(leg2.away_team_id);

      if (isLeg2Played && leg2.home_score !== null && leg2.away_score !== null) {
        if (leg2.home_team_id === teamA.id) {
          teamATotal += leg2.home_score;
          teamBTotal += leg2.away_score;
        } else {
          teamBTotal += leg2.home_score;
          teamATotal += leg2.away_score;
        }
      }
    }

    const isLevel = teamATotal === teamBTotal;
    let winnerTeamId: string | null = null;
    if (isFullyCompleted && !isLevel) {
      winnerTeamId = teamATotal > teamBTotal ? teamA.id : teamB.id;
    }

    const roundInfo = leg2
      ? `Matchweeks ${leg1.round_number || 1} & ${leg2.round_number || 4}`
      : `Matchweek ${leg1.round_number || 1}`;

    results.push({
      tieId: key,
      stage: 'Group',
      groupId: leg1.group_id ?? undefined,
      roundInfo,
      teamA,
      teamB,
      leg1,
      leg2,
      leg1HomeTeam: teamA,
      leg1AwayTeam: teamB,
      leg2HomeTeam,
      leg2AwayTeam,
      teamATotalGoals: teamATotal,
      teamBTotalGoals: teamBTotal,
      isLeg1Played,
      isLeg2Played,
      isFullyCompleted,
      winnerTeamId,
      isLevel,
    });
  });

  // 2. Knockout Stages (Ro16, QF, SF, Final)
  const knockoutStages: MatchStage[] = ['Ro16', 'QF', 'SF', 'Final'];

  knockoutStages.forEach((stage) => {
    const stageMatches = matches.filter((m) => m.match_type === stage);
    const tieMap = new Map<string, { leg1: Match | null; leg2: Match | null; order: number }>();

    stageMatches.forEach((m) => {
      const tieId = m.tie_id || `${stage}-${m.round_number || 1}`;
      if (!tieMap.has(tieId)) {
        tieMap.set(tieId, { leg1: null, leg2: null, order: m.round_number || 1 });
      }
      const entry = tieMap.get(tieId)!;
      if (m.leg === 2) {
        entry.leg2 = m;
      } else {
        entry.leg1 = m;
      }
    });

    tieMap.forEach((entry, tieId) => {
      const { leg1, leg2, order } = entry;
      if (!leg1 && !leg2) return;

      const primaryMatch = leg1 || leg2!;
      const teamA = getTeam(primaryMatch.home_team_id);
      const teamB = getTeam(primaryMatch.away_team_id);

      const isLeg1Played = Boolean(leg1 && leg1.is_played && leg1.home_score !== null && leg1.away_score !== null);
      const isLeg2Played = Boolean(leg2 && leg2.is_played && leg2.home_score !== null && leg2.away_score !== null);
      const isFullyCompleted = (leg1 ? isLeg1Played : true) && (leg2 ? isLeg2Played : true);

      let teamATotal = 0;
      let teamBTotal = 0;

      if (leg1 && isLeg1Played && leg1.home_score !== null && leg1.away_score !== null) {
        if (leg1.home_team_id === teamA.id) {
          teamATotal += leg1.home_score;
          teamBTotal += leg1.away_score;
        } else {
          teamBTotal += leg1.home_score;
          teamATotal += leg1.away_score;
        }
      }

      if (leg2 && isLeg2Played && leg2.home_score !== null && leg2.away_score !== null) {
        if (leg2.home_team_id === teamA.id) {
          teamATotal += leg2.home_score;
          teamBTotal += leg2.away_score;
        } else {
          teamBTotal += leg2.home_score;
          teamATotal += leg2.away_score;
        }
      }

      const isLevel = teamATotal === teamBTotal;
      let winnerTeamId: string | null = null;

      if (isFullyCompleted) {
        if (!isLevel) {
          winnerTeamId = teamATotal > teamBTotal ? teamA.id : teamB.id;
        } else {
          // Penalties
          const penMatch = leg2 || leg1;
          if (
            penMatch &&
            penMatch.home_penalties !== null &&
            penMatch.home_penalties !== undefined &&
            penMatch.away_penalties !== null &&
            penMatch.away_penalties !== undefined
          ) {
            if (penMatch.home_penalties > penMatch.away_penalties) {
              winnerTeamId = penMatch.home_team_id;
            } else if (penMatch.away_penalties > penMatch.home_penalties) {
              winnerTeamId = penMatch.away_team_id;
            }
          }
        }
      }

      const stageLabels: Record<string, string> = {
        Ro16: '16 Bora (Round of 16)',
        QF: 'Robo Fainali (Quarter Final)',
        SF: 'Nusu Fainali (Semi Final)',
        Final: 'Fainali (Grand Final)',
      };

      const roundInfo = `${stageLabels[stage] || stage} · Tie #${order}`;

      results.push({
        tieId,
        stage,
        roundInfo,
        teamA,
        teamB,
        leg1: leg1 || primaryMatch,
        leg2: leg2 || null,
        leg1HomeTeam: leg1 ? getTeam(leg1.home_team_id) : teamA,
        leg1AwayTeam: leg1 ? getTeam(leg1.away_team_id) : teamB,
        leg2HomeTeam: leg2 ? getTeam(leg2.home_team_id) : null,
        leg2AwayTeam: leg2 ? getTeam(leg2.away_team_id) : null,
        teamATotalGoals: teamATotal,
        teamBTotalGoals: teamBTotal,
        isLeg1Played,
        isLeg2Played,
        isFullyCompleted,
        winnerTeamId,
        isLevel,
      });
    });
  });

  return results;
}

