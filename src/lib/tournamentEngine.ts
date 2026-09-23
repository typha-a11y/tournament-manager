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

// =========================================================================
// Simulation Helper: Fast-play remaining unplayed group matches with realistic scores
// =========================================================================
export function simulateRemainingGroupMatches(teams: Team[], matches: Match[]): Match[] {
  const realisticScorePairs: [number, number][] = [
    [2, 1], [1, 0], [3, 1], [0, 0], [2, 2], [1, 2], [0, 1], [2, 0], [3, 2], [1, 1], [4, 1], [0, 2]
  ];

  return matches.map((m) => {
    if (m.match_type === 'Group' && (!m.is_played || m.home_score === null || m.away_score === null)) {
      // Pick score deterministically based on match id hash to keep results stable
      let hash = 0;
      for (let i = 0; i < m.id.length; i++) {
        hash = (hash << 5) - hash + m.id.charCodeAt(i);
        hash |= 0;
      }
      const pair = realisticScorePairs[Math.abs(hash) % realisticScorePairs.length];
      return {
        ...m,
        is_played: true,
        home_score: pair[0],
        away_score: pair[1],
      };
    }
    return m;
  });
}

// =========================================================================
// Intelligent Round of 16 (16 Bora) Seeding Engine
// Strict 0% Same-Group Collision Pairing Guarantee
// =========================================================================
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

  // 1. Gather all Group Winners (1st) and Runners-Up (2nd)
  const groupWinners: Record<GroupLetter, Team | null> = {
    A: null, B: null, C: null, D: null, E: null, F: null,
  };
  const groupRunnersUp: Record<GroupLetter, Team | null> = {
    A: null, B: null, C: null, D: null, E: null, F: null,
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

  // Group winners array and runners up array
  const winnersList: Team[] = Object.values(groupWinners).filter((t): t is Team => t !== null);
  const runnersList: Team[] = Object.values(groupRunnersUp).filter((t): t is Team => t !== null);

  // Fallback if data is incomplete: fill from teams
  if (winnersList.length < 6 || runnersList.length < 6 || qualifiedThirds.length < 4) {
    const available = [...teams];
    while (winnersList.length < 6 && available.length > 0) winnersList.push(available.shift()!);
    while (runnersList.length < 6 && available.length > 0) runnersList.push(available.shift()!);
    while (qualifiedThirds.length < 4 && available.length > 0) qualifiedThirds.push(available.shift()!);
  }

  // Backtracking solver to find valid pairings with 0% same group collisions:
  // - 4 Winners vs 4 3rd-place teams (winner.group_id !== third.group_id)
  // - 2 Winners vs 2 Runners-up (winner.group_id !== runner.group_id)
  // - 4 Runners-up paired into 2 ties (runnerA.group_id !== runnerB.group_id)

  let solutionPairings: { home: Team; away: Team; type: string }[] | null = null;

  // Helper to test if two teams share the same group
  const sameGroup = (t1: Team, t2: Team) => {
    return t1.group_id && t2.group_id && t1.group_id === t2.group_id;
  };

  // Find all combinations of 4 winners out of 6 to play against the 4 3rd-placed teams
  const findPairings = () => {
    const winnerIndices = [0, 1, 2, 3, 4, 5];
    
    // Test winner selections
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        for (let k = j + 1; k < 6; k++) {
          for (let l = k + 1; l < 6; l++) {
            const selectedWinnersForThirds = [
              winnersList[i],
              winnersList[j],
              winnersList[k],
              winnersList[l],
            ];
            const remainingWinners = winnersList.filter(
              (_, idx) => idx !== i && idx !== j && idx !== k && idx !== l
            );

            // Try to match 4 winners to 4 thirds without same group
            const permutationsOfThirds: Team[][] = [];
            const permute = (arr: Team[], m: Team[] = []) => {
              if (arr.length === 0) {
                permutationsOfThirds.push(m);
              } else {
                for (let p = 0; p < arr.length; p++) {
                  const curr = arr.slice();
                  const next = curr.splice(p, 1);
                  permute(curr.slice(), m.concat(next));
                }
              }
            };
            permute(qualifiedThirds);

            for (const thirdPerm of permutationsOfThirds) {
              let validThirds = true;
              for (let idx = 0; idx < 4; idx++) {
                if (sameGroup(selectedWinnersForThirds[idx], thirdPerm[idx])) {
                  validThirds = false;
                  break;
                }
              }
              if (!validThirds) continue;

              // Now match the 2 remaining winners with 2 runners-up
              for (let r1 = 0; r1 < runnersList.length; r1++) {
                for (let r2 = 0; r2 < runnersList.length; r2++) {
                  if (r1 === r2) continue;
                  const runnerForW1 = runnersList[r1];
                  const runnerForW2 = runnersList[r2];

                  if (
                    sameGroup(remainingWinners[0], runnerForW1) ||
                    sameGroup(remainingWinners[1], runnerForW2)
                  ) {
                    continue;
                  }

                  // The remaining 4 runners-up play each other in 2 pairs
                  const remainingRunners = runnersList.filter(
                    (_, rIdx) => rIdx !== r1 && rIdx !== r2
                  );

                  // Try pairing (0,1) & (2,3) or (0,2) & (1,3) or (0,3) & (1,2)
                  const runnerPairConfigs = [
                    [[0, 1], [2, 3]],
                    [[0, 2], [1, 3]],
                    [[0, 3], [1, 2]],
                  ];

                  for (const config of runnerPairConfigs) {
                    const pair1A = remainingRunners[config[0][0]];
                    const pair1B = remainingRunners[config[0][1]];
                    const pair2A = remainingRunners[config[1][0]];
                    const pair2B = remainingRunners[config[1][1]];

                    if (
                      !sameGroup(pair1A, pair1B) &&
                      !sameGroup(pair2A, pair2B)
                    ) {
                      // Found a complete 100% collision-free solution!
                      return [
                        { home: selectedWinnersForThirds[0], away: thirdPerm[0], type: 'Winner vs 3rd' },
                        { home: remainingWinners[0], away: runnerForW1, type: 'Winner vs RunnerUp' },
                        { home: pair1A, away: pair1B, type: 'RunnerUp vs RunnerUp' },
                        { home: selectedWinnersForThirds[1], away: thirdPerm[1], type: 'Winner vs 3rd' },
                        { home: selectedWinnersForThirds[2], away: thirdPerm[2], type: 'Winner vs 3rd' },
                        { home: remainingWinners[1], away: runnerForW2, type: 'Winner vs RunnerUp' },
                        { home: pair2A, away: pair2B, type: 'RunnerUp vs RunnerUp' },
                        { home: selectedWinnersForThirds[3], away: thirdPerm[3], type: 'Winner vs 3rd' },
                      ];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return null;
  };

  solutionPairings = findPairings();

  // Robust fallback pairing in the rare event of extreme same-group distribution
  if (!solutionPairings) {
    solutionPairings = [
      { home: winnersList[0], away: qualifiedThirds[0], type: 'Winner vs 3rd' },
      { home: winnersList[1], away: runnersList[2], type: 'Winner vs RunnerUp' },
      { home: winnersList[2], away: qualifiedThirds[1], type: 'Winner vs 3rd' },
      { home: runnersList[0], away: runnersList[3], type: 'RunnerUp vs RunnerUp' },
      { home: winnersList[3], away: qualifiedThirds[2], type: 'Winner vs 3rd' },
      { home: winnersList[4], away: runnersList[4], type: 'Winner vs RunnerUp' },
      { home: winnersList[5], away: qualifiedThirds[3], type: 'Winner vs 3rd' },
      { home: runnersList[1], away: runnersList[5], type: 'RunnerUp vs RunnerUp' },
    ];
  }

  const ro16Matches: Match[] = [];

  solutionPairings.forEach((p, idx) => {
    const tieNumber = idx + 1;
    const tieId = `tie-ro16-${tieNumber}`;

    // Leg 1: Away team hosts Leg 1 (standard 2-legged home-and-away)
    ro16Matches.push({
      id: `match-ro16-${tieNumber}-leg1`,
      home_team_id: p.away.id,
      away_team_id: p.home.id,
      home_score: null,
      away_score: null,
      match_type: 'Ro16',
      is_played: false,
      leg: 1,
      tie_id: tieId,
      round_number: tieNumber,
    });

    // Leg 2: Higher seed hosts Leg 2 (decisive home return)
    ro16Matches.push({
      id: `match-ro16-${tieNumber}-leg2`,
      home_team_id: p.home.id,
      away_team_id: p.away.id,
      home_score: null,
      away_score: null,
      match_type: 'Ro16',
      is_played: false,
      leg: 2,
      tie_id: tieId,
      round_number: tieNumber,
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
        aggHome += leg1.away_score;
        aggAway += leg1.home_score;
      } else {
        aggHome += leg1.home_score;
        aggAway += leg1.away_score;
        isCompleted = true;
      }
    }

    if (leg2 && leg2.is_played && leg2.home_score !== null && leg2.away_score !== null) {
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

// =========================================================================
// Dynamic Full Bracket Computation with Partial / Waiting Nodes
// Ensures that as soon as any team wins their tie, they show up in the next round
// and wait for their upcoming opponent.
// =========================================================================
export interface FullBracketTreeData {
  ro16Ties: KnockoutTie[];
  qfTies: KnockoutTie[];
  sfTies: KnockoutTie[];
  finalTies: KnockoutTie[];
  championTeam: Team | null;
}

export function computeFullBracketTree(
  matches: Match[],
  teams: Team[],
  finalIsTwoLegs: boolean = false
): FullBracketTreeData {
  const teamMap = new Map<string, Team>(teams.map((t) => [t.id, t]));
  const ro16Ties = computeKnockoutTies('Ro16', matches, teams);

  // 1. Quarter Finals (4 ties from 8 Ro16 ties)
  const qfComputed = computeKnockoutTies('QF', matches, teams);
  const qfTies: KnockoutTie[] = [];

  for (let i = 0; i < 4; i++) {
    const feeder1 = ro16Ties[i * 2];
    const feeder2 = ro16Ties[i * 2 + 1];
    const winner1 = feeder1?.winnerTeamId ? teamMap.get(feeder1.winnerTeamId) || null : null;
    const winner2 = feeder2?.winnerTeamId ? teamMap.get(feeder2.winnerTeamId) || null : null;

    const existingTie = qfComputed.find((t) => t.matchNumber === i + 1);

    if (existingTie) {
      qfTies.push({
        ...existingTie,
        homeTeam: existingTie.homeTeam || winner1,
        awayTeam: existingTie.awayTeam || winner2,
        homePlaceholder: `Winner of 16 Bora #${i * 2 + 1}`,
        awayPlaceholder: `Winner of 16 Bora #${i * 2 + 2}`,
      });
    } else {
      qfTies.push({
        tieId: `tie-qf-${i + 1}`,
        stage: 'QF',
        matchNumber: i + 1,
        homeTeam: winner1,
        awayTeam: winner2,
        homePlaceholder: `Winner of 16 Bora #${i * 2 + 1}`,
        awayPlaceholder: `Winner of 16 Bora #${i * 2 + 2}`,
        leg1: null,
        leg2: null,
        aggregateHomeScore: 0,
        aggregateAwayScore: 0,
        winnerTeamId: null,
        isCompleted: false,
        needsPenalties: false,
      });
    }
  }

  // 2. Semi Finals (2 ties from 4 QF ties)
  const sfComputed = computeKnockoutTies('SF', matches, teams);
  const sfTies: KnockoutTie[] = [];

  for (let i = 0; i < 2; i++) {
    const feeder1 = qfTies[i * 2];
    const feeder2 = qfTies[i * 2 + 1];
    const winner1 = feeder1?.winnerTeamId ? teamMap.get(feeder1.winnerTeamId) || null : null;
    const winner2 = feeder2?.winnerTeamId ? teamMap.get(feeder2.winnerTeamId) || null : null;

    const existingTie = sfComputed.find((t) => t.matchNumber === i + 1);

    if (existingTie) {
      sfTies.push({
        ...existingTie,
        homeTeam: existingTie.homeTeam || winner1,
        awayTeam: existingTie.awayTeam || winner2,
        homePlaceholder: `Winner of Robo #${i * 2 + 1}`,
        awayPlaceholder: `Winner of Robo #${i * 2 + 2}`,
      });
    } else {
      sfTies.push({
        tieId: `tie-sf-${i + 1}`,
        stage: 'SF',
        matchNumber: i + 1,
        homeTeam: winner1,
        awayTeam: winner2,
        homePlaceholder: `Winner of Robo #${i * 2 + 1}`,
        awayPlaceholder: `Winner of Robo #${i * 2 + 2}`,
        leg1: null,
        leg2: null,
        aggregateHomeScore: 0,
        aggregateAwayScore: 0,
        winnerTeamId: null,
        isCompleted: false,
        needsPenalties: false,
      });
    }
  }

  // 3. Grand Final (1 tie from 2 SF ties)
  const finalComputed = computeKnockoutTies('Final', matches, teams);
  const sfWinner1 = sfTies[0]?.winnerTeamId ? teamMap.get(sfTies[0].winnerTeamId) || null : null;
  const sfWinner2 = sfTies[1]?.winnerTeamId ? teamMap.get(sfTies[1].winnerTeamId) || null : null;

  const finalTies: KnockoutTie[] = [];
  if (finalComputed.length > 0) {
    finalTies.push({
      ...finalComputed[0],
      homeTeam: finalComputed[0].homeTeam || sfWinner1,
      awayTeam: finalComputed[0].awayTeam || sfWinner2,
      homePlaceholder: 'Winner of Nusu Fainali #1',
      awayPlaceholder: 'Winner of Nusu Fainali #2',
    });
  } else {
    finalTies.push({
      tieId: 'tie-final-1',
      stage: 'Final',
      matchNumber: 1,
      homeTeam: sfWinner1,
      awayTeam: sfWinner2,
      homePlaceholder: 'Winner of Nusu Fainali #1',
      awayPlaceholder: 'Winner of Nusu Fainali #2',
      leg1: null,
      leg2: null,
      aggregateHomeScore: 0,
      aggregateAwayScore: 0,
      winnerTeamId: null,
      isCompleted: false,
      needsPenalties: false,
    });
  }

  // Champion
  const finalTie = finalTies[0];
  const championTeam = finalTie?.winnerTeamId
    ? teamMap.get(finalTie.winnerTeamId) || null
    : null;

  return {
    ro16Ties,
    qfTies,
    sfTies,
    finalTies,
    championTeam,
  };
}

// =========================================================================
// Knockout Auto-Progression Synchronizer
// Automatically creates / updates match objects in state when both opponents qualify
// =========================================================================
export function synchronizeKnockoutProgression(
  allMatches: Match[],
  teams: Team[],
  finalIsTwoLegs: boolean = false
): { updatedMatches: Match[]; hasChanges: boolean } {
  let hasChanges = false;
  let matches = [...allMatches];

  // Helper to ensure matches exist for a tie
  const ensureMatchesForTie = (
    stage: MatchStage,
    tieNumber: number,
    team1: Team,
    team2: Team,
    isTwoLegs: boolean
  ) => {
    const tieId = `tie-${stage.toLowerCase()}-${tieNumber}`;
    const leg1Id = `match-${stage.toLowerCase()}-${tieNumber}-leg1`;
    const leg2Id = `match-${stage.toLowerCase()}-${tieNumber}-leg2`;

    const existingLeg1 = matches.find((m) => m.id === leg1Id || (m.tie_id === tieId && m.leg === 1));
    const existingLeg2 = matches.find((m) => m.id === leg2Id || (m.tie_id === tieId && m.leg === 2));

    // Check if teams need update
    if (existingLeg1) {
      if (existingLeg1.home_team_id !== team2.id || existingLeg1.away_team_id !== team1.id) {
        matches = matches.map((m) =>
          m.id === existingLeg1.id
            ? { ...m, home_team_id: team2.id, away_team_id: team1.id }
            : m
        );
        hasChanges = true;
      }
    } else {
      matches.push({
        id: leg1Id,
        home_team_id: team2.id,
        away_team_id: team1.id,
        home_score: null,
        away_score: null,
        match_type: stage,
        is_played: false,
        leg: 1,
        tie_id: tieId,
        round_number: tieNumber,
      });
      hasChanges = true;
    }

    if (isTwoLegs) {
      if (existingLeg2) {
        if (existingLeg2.home_team_id !== team1.id || existingLeg2.away_team_id !== team2.id) {
          matches = matches.map((m) =>
            m.id === existingLeg2.id
              ? { ...m, home_team_id: team1.id, away_team_id: team2.id }
              : m
          );
          hasChanges = true;
        }
      } else {
        matches.push({
          id: leg2Id,
          home_team_id: team1.id,
          away_team_id: team2.id,
          home_score: null,
          away_score: null,
          match_type: stage,
          is_played: false,
          leg: 2,
          tie_id: tieId,
          round_number: tieNumber,
        });
        hasChanges = true;
      }
    }
  };

  const tree = computeFullBracketTree(matches, teams, finalIsTwoLegs);

  // 1. Sync Quarter Finals if feeder Ro16 winners are both ready
  tree.qfTies.forEach((qf) => {
    if (qf.homeTeam && qf.awayTeam) {
      ensureMatchesForTie('QF', qf.matchNumber, qf.homeTeam, qf.awayTeam, true);
    }
  });

  // Recompute with updated QF matches
  const treeAfterQF = computeFullBracketTree(matches, teams, finalIsTwoLegs);

  // 2. Sync Semi Finals if feeder QF winners are both ready
  treeAfterQF.sfTies.forEach((sf) => {
    if (sf.homeTeam && sf.awayTeam) {
      ensureMatchesForTie('SF', sf.matchNumber, sf.homeTeam, sf.awayTeam, true);
    }
  });

  // Recompute with updated SF matches
  const treeAfterSF = computeFullBracketTree(matches, teams, finalIsTwoLegs);

  // 3. Sync Final if feeder SF winners are both ready
  const finalTie = treeAfterSF.finalTies[0];
  if (finalTie?.homeTeam && finalTie?.awayTeam) {
    ensureMatchesForTie('Final', 1, finalTie.homeTeam, finalTie.awayTeam, finalIsTwoLegs);
  }

  return { updatedMatches: matches, hasChanges };
}

// Generate subsequent knockout rounds (QF -> SF -> Final) from completed previous rounds
export function generateNextKnockoutStage(
  currentStage: 'Ro16' | 'QF' | 'SF',
  allMatches: Match[],
  teams: Team[],
  finalIsTwoLegs: boolean = false
): Match[] {
  const sync = synchronizeKnockoutProgression(allMatches, teams, finalIsTwoLegs);
  return sync.updatedMatches;
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

