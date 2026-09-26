/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Match, Team, GroupLetter, TeamStanding } from '../types/tournament';
import {
  calculateGroupStandings,
  calculateStandings,
  calculateThirdPlaceMiniLeague,
  GROUPS,
} from '../lib/tournamentEngine';
import { useTournament } from '../context/TournamentContext';
import { ClubCrest } from './ClubCrest';
import { BiggestWinsShowcase } from './BiggestWinsShowcase';
import { AdvancedAnalyticsGraphs } from './AdvancedAnalyticsGraphs';
import {
  Activity,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Database,
  Eye,
  Filter,
  Flame,
  Globe2,
  Info,
  Layers,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Swords,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';

interface StatsAndTrendsDashboardProps {
  teams?: Team[];
  matches?: Match[];
  onOpenScoreModal?: (match: Match) => void;
}

type ViewScope = 'all_teams' | 'biggest_wins' | 'analytics_graphs' | 'leaders' | 'individual' | 'derbies';
type SortField = 'points' | 'goalsScored' | 'goalsConceded' | 'goalDifference' | 'won' | 'cleanSheets' | 'formPoints';
type SortDirection = 'asc' | 'desc';

export const StatsAndTrendsDashboard: React.FC<StatsAndTrendsDashboardProps> = ({
  teams: propTeams,
  matches: propMatches,
  onOpenScoreModal,
}) => {
  const {
    activeTournamentId,
    activeProfile,
    teams: contextTeams,
    matches: contextMatches,
    isSupabaseConnected,
    syncStatus,
    refreshData,
  } = useTournament();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewScope, setViewScope] = useState<ViewScope>('all_teams');
  const [groupFilter, setGroupFilter] = useState<'ALL' | GroupLetter>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'qualified' | 'contender' | 'eliminated'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Source matches & teams
  const sourceMatches = propMatches && propMatches.length > 0 ? propMatches : contextMatches;
  const sourceTeams = propTeams && propTeams.length > 0 ? propTeams : contextTeams;

  // Filter matches by active tournament
  const currentTournamentMatches = useMemo(() => {
    if (!sourceMatches || sourceMatches.length === 0) return [];
    if (!activeTournamentId) return sourceMatches;

    return sourceMatches.filter((m) => {
      if (m.tournament_id) {
        return m.tournament_id === activeTournamentId;
      }
      return true;
    });
  }, [sourceMatches, activeTournamentId]);

  // Filter teams by active tournament
  const currentTournamentTeams = useMemo(() => {
    if (!sourceTeams || sourceTeams.length === 0) return [];
    if (!activeTournamentId) return sourceTeams;

    return sourceTeams.filter((t) => {
      if (t.tournament_id) {
        return t.tournament_id === activeTournamentId;
      }
      return true;
    });
  }, [sourceTeams, activeTournamentId]);

  // Selected team state for Individual Focus
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    return currentTournamentTeams[0]?.id || '';
  });
  const [chartMetric, setChartMetric] = useState<'cumulative' | 'per_match'>('cumulative');

  useEffect(() => {
    if (currentTournamentTeams.length > 0) {
      const exists = currentTournamentTeams.some((t) => t.id === selectedTeamId);
      if (!exists) {
        setSelectedTeamId(currentTournamentTeams[0].id);
      }
    }
  }, [currentTournamentTeams, selectedTeamId]);

  const selectedTeam = useMemo(() => {
    return (
      currentTournamentTeams.find((t) => t.id === selectedTeamId) ||
      currentTournamentTeams[0] ||
      null
    );
  }, [currentTournamentTeams, selectedTeamId]);

  // Team lookup helper
  const getTeam = (id: string): Team => {
    return (
      currentTournamentTeams.find((t) => t.id === id) || {
        id,
        name: 'Team',
        logo_url: '',
        group_id: null,
      }
    );
  };

  // Group standings map
  const groupStandingsMap = useMemo(() => {
    const map: Record<GroupLetter, TeamStanding[]> = {
      A: calculateGroupStandings('A', currentTournamentTeams, currentTournamentMatches),
      B: calculateGroupStandings('B', currentTournamentTeams, currentTournamentMatches),
      C: calculateGroupStandings('C', currentTournamentTeams, currentTournamentMatches),
      D: calculateGroupStandings('D', currentTournamentTeams, currentTournamentMatches),
      E: calculateGroupStandings('E', currentTournamentTeams, currentTournamentMatches),
      F: calculateGroupStandings('F', currentTournamentTeams, currentTournamentMatches),
    };
    return map;
  }, [currentTournamentTeams, currentTournamentMatches]);

  // Global Overall Standings (all 24 teams combined)
  const globalStandings = useMemo(() => {
    return calculateStandings(currentTournamentTeams, currentTournamentMatches);
  }, [currentTournamentTeams, currentTournamentMatches]);

  // Third Place Mini-League for qualification determination
  const thirdPlaceLeague = useMemo(() => {
    return calculateThirdPlaceMiniLeague(currentTournamentTeams, currentTournamentMatches);
  }, [currentTournamentTeams, currentTournamentMatches]);

  // Group metrics & progress
  const groupMatches = useMemo(() => {
    return currentTournamentMatches.filter((m) => m.match_type === 'Group');
  }, [currentTournamentMatches]);

  const totalGroupMatches = groupMatches.length || 72;
  const playedGroupMatchesCount = useMemo(() => {
    return groupMatches.filter((m) => m.is_played && m.home_score !== null).length;
  }, [groupMatches]);

  const isGroupStageComplete = totalGroupMatches > 0 && playedGroupMatchesCount >= totalGroupMatches;

  // Qualification status mapper for every team
  const teamQualificationStatusMap = useMemo(() => {
    const map = new Map<
      string,
      {
        status: 'qualified' | 'contender' | 'eliminated';
        badgeLabel: string;
        rankInGroup: number;
        reason: string;
      }
    >();

    // 1. Group 1st and 2nd places
    GROUPS.forEach((g) => {
      const gStandings = groupStandingsMap[g] || [];
      gStandings.forEach((st, idx) => {
        const rank = idx + 1;
        const played = st.played;
        const isFinished = played >= 6;

        if (rank === 1) {
          map.set(st.team.id, {
            status: isGroupStageComplete || played >= 4 ? 'qualified' : 'contender',
            badgeLabel: isGroupStageComplete ? 'Group Winner (1st)' : 'Top Seed (1st)',
            rankInGroup: 1,
            reason: `1st in Group ${g} (${st.points} pts, GD ${st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference})`,
          });
        } else if (rank === 2) {
          map.set(st.team.id, {
            status: isGroupStageComplete || played >= 4 ? 'qualified' : 'contender',
            badgeLabel: isGroupStageComplete ? 'Runner-Up (2nd)' : 'Second (2nd)',
            rankInGroup: 2,
            reason: `2nd in Group ${g} (${st.points} pts, GD ${st.goalDifference > 0 ? `+${st.goalDifference}` : st.goalDifference})`,
          });
        } else if (rank === 3) {
          // Check mini-league standing
          const thirdStanding = thirdPlaceLeague.find((t) => t.team.id === st.team.id);
          const isTop4Third = thirdStanding ? thirdStanding.isQualified : false;

          map.set(st.team.id, {
            status: isTop4Third && isGroupStageComplete ? 'qualified' : 'contender',
            badgeLabel: isTop4Third
              ? isGroupStageComplete
                ? 'Best 3rd (Qualified)'
                : 'Top 3rd Seed'
              : '3rd Place',
            rankInGroup: 3,
            reason: `3rd in Group ${g} · Mini-League Rank #${thirdStanding?.rank || 3} (${st.points} pts)`,
          });
        } else {
          map.set(st.team.id, {
            status: isGroupStageComplete ? 'eliminated' : 'contender',
            badgeLabel: isGroupStageComplete ? 'Eliminated (4th)' : '4th Place',
            rankInGroup: 4,
            reason: `4th in Group ${g} (${st.points} pts)`,
          });
        }
      });
    });

    return map;
  }, [groupStandingsMap, thirdPlaceLeague, isGroupStageComplete]);

  // Flat list of all standings across all 6 groups
  const allGroupStandings = useMemo(() => {
    return Object.values(groupStandingsMap).flat();
  }, [groupStandingsMap]);

  // Clean sheets map & Team detailed stats
  const teamDetailedStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        cleanSheets: number;
        goalsConceded: number;
        goalsScored: number;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        points: number;
        form: ('W' | 'D' | 'L')[];
        formPoints: number;
        avgGoalsScored: number;
        avgGoalsConceded: number;
        winRate: number;
      }
    >();

    currentTournamentTeams.forEach((t) => {
      const standing = allGroupStandings.find((s) => s.team.id === t.id);
      const teamMatches = currentTournamentMatches.filter(
        (m) => m.is_played && (m.home_team_id === t.id || m.away_team_id === t.id)
      );

      let cleanSheets = 0;
      teamMatches.forEach((m) => {
        if (m.home_team_id === t.id && m.away_score === 0) cleanSheets++;
        if (m.away_team_id === t.id && m.home_score === 0) cleanSheets++;
      });

      const played = standing?.played || 0;
      const won = standing?.won || 0;
      const drawn = standing?.drawn || 0;
      const lost = standing?.lost || 0;
      const goalsScored = standing?.goalsFor || 0;
      const goalsConceded = standing?.goalsAgainst || 0;
      const points = standing?.points || 0;
      const form = standing?.form || [];

      // Calculate form points: W=3, D=1, L=0
      const formPoints = form.reduce((sum: number, res: 'W' | 'D' | 'L') => sum + (res === 'W' ? 3 : res === 'D' ? 1 : 0), 0);
      const avgGoalsScored = played > 0 ? Number((goalsScored / played).toFixed(2)) : 0;
      const avgGoalsConceded = played > 0 ? Number((goalsConceded / played).toFixed(2)) : 0;
      const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

      map.set(t.id, {
        cleanSheets,
        goalsConceded,
        goalsScored,
        played,
        won,
        drawn,
        lost,
        points,
        form,
        formPoints,
        avgGoalsScored,
        avgGoalsConceded,
        winRate,
      });
    });

    return map;
  }, [currentTournamentTeams, currentTournamentMatches, allGroupStandings]);

  // Enriched Team Rows for the All Teams Table & Filtered Views
  const enrichedTeamList = useMemo(() => {
    return currentTournamentTeams.map((team) => {
      const stats = teamDetailedStatsMap.get(team.id) || {
        cleanSheets: 0,
        goalsConceded: 0,
        goalsScored: 0,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        points: 0,
        form: [],
        formPoints: 0,
        avgGoalsScored: 0,
        avgGoalsConceded: 0,
        winRate: 0,
      };

      const standing = allGroupStandings.find((s) => s.team.id === team.id);
      const goalDifference = standing?.goalDifference || stats.goalsScored - stats.goalsConceded;
      const qualInfo = teamQualificationStatusMap.get(team.id) || {
        status: 'contender' as const,
        badgeLabel: 'In Contention',
        rankInGroup: 4,
        reason: '',
      };

      return {
        team,
        ...stats,
        goalDifference,
        qualification: qualInfo,
      };
    });
  }, [currentTournamentTeams, teamDetailedStatsMap, allGroupStandings, teamQualificationStatusMap]);

  // Filter & Sort All Teams
  const filteredAndSortedTeams = useMemo(() => {
    return enrichedTeamList
      .filter((item) => {
        // Group filter
        if (groupFilter !== 'ALL' && item.team.group_id !== groupFilter) {
          return false;
        }
        // Status filter
        if (statusFilter !== 'ALL' && item.qualification.status !== statusFilter) {
          return false;
        }
        // Search query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = item.team.name.toLowerCase().includes(q);
          const matchClub = (item.team.club_crest_name || '').toLowerCase().includes(q);
          const matchGroup = (item.team.group_id || '').toLowerCase().includes(q);
          return matchName || matchClub || matchGroup;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = Number(a[sortField] ?? 0);
        const valB = Number(b[sortField] ?? 0);

        if (sortField === 'points' && valA === valB) {
          // Tie-breakers: Goal difference then Goals Scored
          if (a.goalDifference !== b.goalDifference) {
            return sortDirection === 'desc'
              ? b.goalDifference - a.goalDifference
              : a.goalDifference - b.goalDifference;
          }
          return sortDirection === 'desc'
            ? b.goalsScored - a.goalsScored
            : a.goalsScored - b.goalsScored;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [enrichedTeamList, groupFilter, statusFilter, searchQuery, sortField, sortDirection]);

  // Tournament Superlatives & Honor Roll Leaders
  const tournamentSuperlatives = useMemo(() => {
    const list = [...enrichedTeamList];

    // 1. Top Scorers / Best Attack
    const topScorers = [...list].sort((a, b) => {
      if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored;
      return b.avgGoalsScored - a.avgGoalsScored;
    }).slice(0, 5);

    // 2. Best Defense / Fewest Goals Conceded (minimum 1 match played)
    const bestDefense = [...list]
      .filter((t) => t.played > 0)
      .sort((a, b) => {
        if (a.goalsConceded !== b.goalsConceded) return a.goalsConceded - b.goalsConceded;
        return b.cleanSheets - a.cleanSheets;
      })
      .slice(0, 5);

    // 3. Best Form (Highest formPoints or current win rate)
    const bestForm = [...list].sort((a, b) => {
      if (b.formPoints !== a.formPoints) return b.formPoints - a.formPoints;
      return b.winRate - a.winRate;
    }).slice(0, 5);

    // 4. Most Clean Sheets
    const cleanSheetKings = [...list]
      .filter((t) => t.cleanSheets > 0)
      .sort((a, b) => b.cleanSheets - a.cleanSheets)
      .slice(0, 5);

    // 5. Qualified Count
    const qualifiedCount = list.filter((t) => t.qualification.status === 'qualified').length;

    return {
      topScorers,
      bestDefense,
      bestForm,
      cleanSheetKings,
      qualifiedCount,
    };
  }, [enrichedTeamList]);

  // Overall Tournament Core Stats
  const tournamentOverview = useMemo(() => {
    const playedMatches = currentTournamentMatches.filter((m) => m.is_played);
    const totalGoals = playedMatches.reduce(
      (sum, m) => sum + (m.home_score || 0) + (m.away_score || 0),
      0
    );
    const avgGoalsPerMatch =
      playedMatches.length > 0 ? (totalGoals / playedMatches.length).toFixed(2) : '0.00';

    // Group goals distribution
    const groupGoalsData = GROUPS.map((g) => {
      const gMatches = playedMatches.filter((m) => m.group_id === g);
      const gGoals = gMatches.reduce(
        (sum, m) => sum + (m.home_score || 0) + (m.away_score || 0),
        0
      );
      return {
        group: `Group ${g}`,
        goals: gGoals,
        matchesPlayed: gMatches.length,
      };
    });

    return {
      totalGoals,
      playedCount: playedMatches.length,
      totalCount: currentTournamentMatches.length,
      avgGoalsPerMatch,
      groupGoalsData,
    };
  }, [currentTournamentMatches]);

  // Top 3 biggest wins for preview showcase banner
  const biggestWinsPreview = useMemo(() => {
    const played = currentTournamentMatches.filter(
      (m) => m.is_played && m.home_score !== null && m.away_score !== null
    );

    return played
      .map((m) => {
        const homeScore = m.home_score ?? 0;
        const awayScore = m.away_score ?? 0;
        const margin = Math.abs(homeScore - awayScore);
        const homeWon = homeScore > awayScore;
        const winner = homeWon ? getTeam(m.home_team_id) : getTeam(m.away_team_id);
        const loser = homeWon ? getTeam(m.away_team_id) : getTeam(m.home_team_id);
        const winnerScore = homeWon ? homeScore : awayScore;
        const loserScore = homeWon ? awayScore : homeScore;

        return {
          match: m,
          winner,
          loser,
          winnerScore,
          loserScore,
          margin,
          isDraw: homeScore === awayScore,
        };
      })
      .filter((m) => !m.isDraw && m.margin > 0)
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        return b.winnerScore - a.winnerScore;
      })
      .slice(0, 3);
  }, [currentTournamentMatches, currentTournamentTeams]);

  // Hot Matches / Derby Rivalries
  const hotMatches = useMemo(() => {
    const unplayed = currentTournamentMatches.filter((m) => !m.is_played);

    return unplayed
      .map((match) => {
        const homeTeam = getTeam(match.home_team_id);
        const awayTeam = getTeam(match.away_team_id);

        const homeStats = teamDetailedStatsMap.get(match.home_team_id);
        const awayStats = teamDetailedStatsMap.get(match.away_team_id);

        const homeQual = teamQualificationStatusMap.get(match.home_team_id);
        const awayQual = teamQualificationStatusMap.get(match.away_team_id);

        const isBothTop2 = (homeQual?.rankInGroup || 4) <= 2 && (awayQual?.rankInGroup || 4) <= 2;
        const isBothHighScoring =
          (homeStats?.goalsScored || 0) >= 6 && (awayStats?.goalsScored || 0) >= 6;

        // Check traditional club rivalries
        const homeCrest = (homeTeam.club_crest_name || homeTeam.name || '').toLowerCase();
        const awayCrest = (awayTeam.club_crest_name || awayTeam.name || '').toLowerCase();
        const isClassicDerby =
          (homeCrest.includes('madrid') && awayCrest.includes('barcelona')) ||
          (homeCrest.includes('barcelona') && awayCrest.includes('madrid')) ||
          (homeCrest.includes('city') && awayCrest.includes('liverpool')) ||
          (homeCrest.includes('liverpool') && awayCrest.includes('city')) ||
          (homeCrest.includes('arsenal') && awayCrest.includes('chelsea')) ||
          (homeCrest.includes('chelsea') && awayCrest.includes('arsenal')) ||
          (homeCrest.includes('inter') && awayCrest.includes('milan')) ||
          (homeCrest.includes('milan') && awayCrest.includes('inter')) ||
          (homeCrest.includes('bayern') && awayCrest.includes('dortmund')) ||
          (homeCrest.includes('dortmund') && awayCrest.includes('bayern')) ||
          (homeCrest.includes('corinthians') && awayCrest.includes('palmeiras')) ||
          (homeCrest.includes('palmeiras') && awayCrest.includes('corinthians'));

        const isHot = isBothTop2 || isBothHighScoring || isClassicDerby;

        const reasons: string[] = [];
        if (isBothTop2) reasons.push('Top 2 Group Clash');
        if (isBothHighScoring) reasons.push('High Firepower Encounter');
        if (isClassicDerby) reasons.push('Classic Football Derby');

        return {
          match,
          homeTeam,
          awayTeam,
          homeRank: homeQual?.rankInGroup || 4,
          awayRank: awayQual?.rankInGroup || 4,
          isHot,
          reasons,
        };
      })
      .filter((item) => item.isHot);
  }, [currentTournamentMatches, teamDetailedStatsMap, teamQualificationStatusMap, currentTournamentTeams]);

  // Selected Team Individual Match Log & Goals Over Time
  const selectedTeamData = useMemo(() => {
    if (!selectedTeam) return { matchLog: [], goalsChart: [], stats: null, qual: null };

    const teamMatches = currentTournamentMatches
      .filter((m) => m.home_team_id === selectedTeam.id || m.away_team_id === selectedTeam.id)
      .sort((a, b) => (a.round_number || 0) - (b.round_number || 0));

    let cumulativeScored = 0;
    let cumulativeConceded = 0;

    const goalsChart = teamMatches.map((m, idx) => {
      const isHome = m.home_team_id === selectedTeam.id;
      const opponent = getTeam(isHome ? m.away_team_id : m.home_team_id);
      const scored = m.is_played
        ? isHome
          ? m.home_score ?? 0
          : m.away_score ?? 0
        : 0;
      const conceded = m.is_played
        ? isHome
          ? m.away_score ?? 0
          : m.home_score ?? 0
        : 0;

      cumulativeScored += scored;
      cumulativeConceded += conceded;

      const label = m.match_type === 'Group' ? `GW ${m.round_number || idx + 1}` : m.match_type;

      return {
        matchIndex: idx + 1,
        matchLabel: label,
        opponent: opponent.name,
        opponentClub: opponent.club_crest_name,
        scored,
        conceded,
        cumulativeScored,
        cumulativeConceded,
        isPlayed: m.is_played,
        result: !m.is_played ? 'Scheduled' : scored > conceded ? 'W' : scored === conceded ? 'D' : 'L',
      };
    });

    const stats = teamDetailedStatsMap.get(selectedTeam.id) || null;
    const qual = teamQualificationStatusMap.get(selectedTeam.id) || null;

    return {
      matchLog: teamMatches,
      goalsChart,
      stats,
      qual,
    };
  }, [selectedTeam, currentTournamentMatches, teamDetailedStatsMap, teamQualificationStatusMap, currentTournamentTeams]);

  // Handler for column sort toggle
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Global KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <Database className="w-3 h-3 text-blue-600" />
                Tournament: {activeProfile?.name || 'Active Tournament'}
              </span>
              <span className="text-slate-300">·</span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isSupabaseConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                {isSupabaseConnected ? 'Live Database State' : 'Local Storage Cache'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Tournament Analytics, Form & Superlatives
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Live statistics computed across all 24 registered teams, 6 groups, and {currentTournamentMatches.length} matches.
              Toggle between league-wide tables, top leaderboards, individual team deep-dives, and derby clashes.
            </p>
          </div>

          {/* Quick Metrics Bar & Refresh Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-1 sm:flex-initial">
              <div className="bg-blue-50/80 border border-blue-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-blue-600 font-bold uppercase">Total Goals</div>
                <div className="text-lg sm:text-xl font-extrabold text-blue-950 font-mono mt-0.5">
                  {tournamentOverview.totalGoals}
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-emerald-600 font-bold uppercase">Goals / Match</div>
                <div className="text-lg sm:text-xl font-extrabold text-emerald-950 font-mono mt-0.5">
                  {tournamentOverview.avgGoalsPerMatch}
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-amber-700 font-bold uppercase">Hot Derbies</div>
                <div className="text-lg sm:text-xl font-extrabold text-amber-950 font-mono mt-0.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>{hotMatches.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing || syncStatus === 'saving'}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh live data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* 2. Main View Mode Scope Switcher (All Teams vs Biggest Wins vs Analytics Graphs vs Leaderboards vs Individual Team vs Derbies) */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto max-w-full">
            <button
              onClick={() => setViewScope('all_teams')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'all_teams'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-blue-600" />
              <span>All Teams ({currentTournamentTeams.length})</span>
            </button>

            <button
              onClick={() => setViewScope('biggest_wins')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'biggest_wins'
                  ? 'bg-white text-amber-700 shadow-xs ring-1 ring-amber-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Biggest Wins & Records</span>
            </button>

            <button
              onClick={() => setViewScope('analytics_graphs')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'analytics_graphs'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Analytics & Graphs</span>
            </button>

            <button
              onClick={() => setViewScope('leaders')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'leaders'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>Leaderboards</span>
            </button>

            <button
              onClick={() => setViewScope('individual')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'individual'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Team Deep-Dive</span>
            </button>

            <button
              onClick={() => setViewScope('derbies')}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-all shrink-0 ${
                viewScope === 'derbies'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Hot Derbies ({hotMatches.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Group Stage: {playedGroupMatchesCount}/{totalGroupMatches} Played
            </span>
          </div>
        </div>
      </div>

      {/* 3. Section: Superlatives Quick Cards Summary (Always visible or in Leaders view) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Top Scorer / Attack Leader */}
        <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              Top Attack
            </span>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded">
              {tournamentSuperlatives.topScorers[0]?.goalsScored || 0} Goals
            </span>
          </div>
          {tournamentSuperlatives.topScorers[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <ClubCrest
                logoUrl={tournamentSuperlatives.topScorers[0].team.logo_url}
                clubName={tournamentSuperlatives.topScorers[0].team.club_crest_name}
                teamName={tournamentSuperlatives.topScorers[0].team.name}
                size="md"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {tournamentSuperlatives.topScorers[0].team.name}
                </h4>
                <div className="text-[11px] text-slate-500">
                  {tournamentSuperlatives.topScorers[0].avgGoalsScored} goals/game · Group {tournamentSuperlatives.topScorers[0].team.group_id}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No matches played</div>
          )}
        </div>

        {/* Card 2: Best Defense */}
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Best Defense
            </span>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded">
              {tournamentSuperlatives.bestDefense[0]?.goalsConceded ?? 0} Conceded
            </span>
          </div>
          {tournamentSuperlatives.bestDefense[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <ClubCrest
                logoUrl={tournamentSuperlatives.bestDefense[0].team.logo_url}
                clubName={tournamentSuperlatives.bestDefense[0].team.club_crest_name}
                teamName={tournamentSuperlatives.bestDefense[0].team.name}
                size="md"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {tournamentSuperlatives.bestDefense[0].team.name}
                </h4>
                <div className="text-[11px] text-slate-500">
                  {tournamentSuperlatives.bestDefense[0].cleanSheets} Clean Sheets · Group {tournamentSuperlatives.bestDefense[0].team.group_id}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No matches played</div>
          )}
        </div>

        {/* Card 3: Best Form */}
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Best Form
            </span>
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
              {tournamentSuperlatives.bestForm[0]?.winRate || 0}% Win Rate
            </span>
          </div>
          {tournamentSuperlatives.bestForm[0] ? (
            <div className="flex items-center gap-3 mt-1">
              <ClubCrest
                logoUrl={tournamentSuperlatives.bestForm[0].team.logo_url}
                clubName={tournamentSuperlatives.bestForm[0].team.club_crest_name}
                teamName={tournamentSuperlatives.bestForm[0].team.name}
                size="md"
              />
              <div className="min-w-0">
                <h4 className="text-sm font-extrabold text-slate-900 truncate">
                  {tournamentSuperlatives.bestForm[0].team.name}
                </h4>
                <div className="flex items-center gap-1 mt-0.5">
                  {tournamentSuperlatives.bestForm[0].form.slice(-4).map((f, i) => (
                    <span
                      key={i}
                      className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center text-white ${
                        f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 italic">No matches played</div>
          )}
        </div>

        {/* Card 4: Qualification Status */}
        <div className="bg-white rounded-xl border border-indigo-200 p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-indigo-600" />
              16 Bora Status
            </span>
            <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded">
              {isGroupStageComplete ? '16/16 Locked' : `${tournamentSuperlatives.qualifiedCount}/16 Confirmed`}
            </span>
          </div>
          <div className="mt-1">
            <h4 className="text-sm font-extrabold text-slate-900">
              {isGroupStageComplete ? 'Group Stage Complete' : 'In Progress (Active)'}
            </h4>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {isGroupStageComplete
                ? 'All 16 qualifiers ready for knockout seeding'
                : `${totalGroupMatches - playedGroupMatchesCount} group fixtures remaining`}
            </div>
          </div>
        </div>
      </div>

      {/* 4. VIEW SCOPE 1: ALL TEAMS COMPREHENSIVE STANDINGS & FORM TABLE */}
      {viewScope === 'all_teams' && (
        <div className="space-y-6">
          {/* Biggest Wins Quick Spotlight Banner */}
          {biggestWinsPreview.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/5 to-blue-500/10 rounded-2xl border border-amber-200/80 p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Crown className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      Tournament Biggest Wins Spotlight
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-black px-2 py-0.5 rounded-full uppercase">
                        Record Margins
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Top landslide victories with largest goal differences across all groups.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setViewScope('biggest_wins')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0 shadow-2xs"
                >
                  <span>Explore All Record Matches</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Large Logo Match Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {biggestWinsPreview.map((win, idx) => (
                  <div
                    key={win.match.id || idx}
                    className="bg-white/90 backdrop-blur-xs rounded-xl p-3.5 border border-amber-200/60 shadow-2xs hover:shadow-xs transition-shadow flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <ClubCrest
                          logoUrl={win.winner.logo_url}
                          clubName={win.winner.club_crest_name}
                          teamName={win.winner.name}
                          size="lg"
                          className="ring-2 ring-emerald-500 bg-white"
                        />
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full">
                          <Crown className="w-2.5 h-2.5 fill-white" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">
                          {win.winner.name}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {win.winner.club_crest_name}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center shrink-0 px-2 py-1 bg-slate-900 text-white rounded-lg font-mono font-black text-xs shadow-2xs">
                      <span>{win.winnerScore} - {win.loserScore}</span>
                      <span className="text-[9px] text-amber-300 font-bold">+{win.margin} GD</span>
                    </div>

                    <div className="flex items-center gap-2.5 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-700 truncate">
                          {win.loser.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {win.loser.club_crest_name}
                        </div>
                      </div>
                      <ClubCrest
                        logoUrl={win.loser.logo_url}
                        clubName={win.loser.club_crest_name}
                        teamName={win.loser.name}
                        size="md"
                        className="opacity-80 bg-white shrink-0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Controls & Filters Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  All Teams Performance Matrix ({filteredAndSortedTeams.length} Teams)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full tournament statistics, goal tallies, form guides, and knockout qualification status.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search team or club..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60">
              {/* Group Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Group:
                </span>
                {(['ALL', 'A', 'B', 'C', 'D', 'E', 'F'] as const).map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setGroupFilter(grp)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      groupFilter === grp
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {grp === 'ALL' ? 'All Groups' : `Group ${grp}`}
                  </button>
                ))}
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
                {(
                  [
                    { id: 'ALL', label: 'All' },
                    { id: 'qualified', label: 'Qualified' },
                    { id: 'contender', label: 'In Contention' },
                    { id: 'eliminated', label: 'Eliminated' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setStatusFilter(st.id)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      statusFilter === st.id
                        ? 'bg-slate-800 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Viewport */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/90 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 select-none">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-4">Team & Club</th>
                  <th className="py-3 px-2 text-center">Grp</th>
                  <th className="py-3 px-3">Status</th>
                  <th
                    onClick={() => handleSortToggle('points')}
                    className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                    title="Click to sort by Points"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>PTS</span>
                      {sortField === 'points' && (
                        <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-2 text-center">P</th>
                  <th
                    onClick={() => handleSortToggle('won')}
                    className="py-3 px-2 text-center cursor-pointer hover:bg-slate-200/60"
                  >
                    W
                  </th>
                  <th className="py-3 px-2 text-center">D</th>
                  <th className="py-3 px-2 text-center">L</th>
                  <th
                    onClick={() => handleSortToggle('goalsScored')}
                    className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60"
                    title="Goals Scored"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>GF</span>
                      {sortField === 'goalsScored' && (
                        <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('goalsConceded')}
                    className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60"
                    title="Goals Conceded"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>GA</span>
                      {sortField === 'goalsConceded' && (
                        <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('goalDifference')}
                    className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60"
                    title="Goal Difference"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>GD</span>
                      {sortField === 'goalDifference' && (
                        <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('cleanSheets')}
                    className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60"
                    title="Clean Sheets"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>CS</span>
                      {sortField === 'cleanSheets' && (
                        <ArrowUpDown className="w-3 h-3 text-blue-600" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center">Form (Last 5)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAndSortedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400">
                      No teams match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTeams.map((row, idx) => {
                    const isSelected = row.team.id === selectedTeamId;
                    const qual = row.qualification;

                    return (
                      <tr
                        key={row.team.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>

                        {/* Team Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ClubCrest
                              logoUrl={row.team.logo_url}
                              clubName={row.team.club_crest_name}
                              teamName={row.team.name}
                              size="sm"
                              className="shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 block truncate text-xs">
                                {row.team.name}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {row.team.club_crest_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Group */}
                        <td className="py-3 px-2 text-center">
                          <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {row.team.group_id || '-'}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              qual.status === 'qualified'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : qual.status === 'eliminated'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                            title={qual.reason}
                          >
                            {qual.status === 'qualified' && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            )}
                            {qual.badgeLabel}
                          </span>
                        </td>

                        {/* Points */}
                        <td className="py-3 px-2.5 text-center font-mono font-black text-slate-900 text-sm">
                          {row.points}
                        </td>

                        {/* P / W / D / L */}
                        <td className="py-3 px-2 text-center font-mono text-slate-600">{row.played}</td>
                        <td className="py-3 px-2 text-center font-mono text-emerald-700 font-bold">
                          {row.won}
                        </td>
                        <td className="py-3 px-2 text-center font-mono text-slate-600">{row.drawn}</td>
                        <td className="py-3 px-2 text-center font-mono text-rose-700">{row.lost}</td>

                        {/* Goals For / Against / Diff */}
                        <td className="py-3 px-2.5 text-center font-mono font-bold text-blue-900">
                          {row.goalsScored}
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono text-rose-800">
                          {row.goalsConceded}
                        </td>
                        <td className="py-3 px-2.5 text-center font-mono font-bold">
                          <span
                            className={
                              row.goalDifference > 0
                                ? 'text-emerald-700'
                                : row.goalDifference < 0
                                ? 'text-rose-700'
                                : 'text-slate-600'
                            }
                          >
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </span>
                        </td>

                        {/* Clean Sheets */}
                        <td className="py-3 px-2.5 text-center font-mono font-bold text-slate-800">
                          {row.cleanSheets}
                        </td>

                        {/* Form Guide */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {row.form.length === 0 ? (
                              <span className="text-[10px] text-slate-400 font-mono">-</span>
                            ) : (
                              row.form.slice(-5).map((f, i) => (
                                <span
                                  key={i}
                                  className={`w-4 h-4 rounded text-[9px] font-black flex items-center justify-center text-white ${
                                    f === 'W'
                                      ? 'bg-emerald-500'
                                      : f === 'D'
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  title={`Result: ${f}`}
                                >
                                  {f}
                                </span>
                              ))
                            )}
                          </div>
                        </td>

                        {/* Quick View Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              setSelectedTeamId(row.team.id);
                              setViewScope('individual');
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-100/50 px-2 py-1 rounded transition-colors"
                            title="Inspect team deep dive"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* VIEW SCOPE: BIGGEST WINS & RECORDS (CREATIVE SHOWCASE WITH LARGE LOGOS) */}
      {viewScope === 'biggest_wins' && (
        <BiggestWinsShowcase
          matches={currentTournamentMatches}
          teams={currentTournamentTeams}
          onOpenScoreModal={onOpenScoreModal}
        />
      )}

      {/* VIEW SCOPE: ADVANCED ANALYTICS & MULTI-DIMENSIONAL GRAPHS */}
      {viewScope === 'analytics_graphs' && (
        <AdvancedAnalyticsGraphs
          matches={currentTournamentMatches}
          teams={currentTournamentTeams}
        />
      )}

      {/* 5. VIEW SCOPE 2: LEADERBOARDS & SUPERLATIVES (Top Scorers, Best Defense, Best Form) */}
      {viewScope === 'leaders' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Leaderboard 1: Top Attackers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Top 5 Scoring Teams</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Goals Scored</span>
            </div>

            <div className="space-y-3">
              {tournamentSuperlatives.topScorers.map((row, idx) => (
                <div
                  key={row.team.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 font-mono font-bold text-xs text-slate-400 text-center">
                      #{idx + 1}
                    </span>
                    <ClubCrest
                      logoUrl={row.team.logo_url}
                      clubName={row.team.club_crest_name}
                      teamName={row.team.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {row.team.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {row.avgGoalsScored} goals/match
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-black text-blue-600 shrink-0 ml-2">
                    {row.goalsScored} GF
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard 2: Best Defensive Records */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Best Defensive Walls</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Fewest Conceded</span>
            </div>

            <div className="space-y-3">
              {tournamentSuperlatives.bestDefense.map((row, idx) => (
                <div
                  key={row.team.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 font-mono font-bold text-xs text-slate-400 text-center">
                      #{idx + 1}
                    </span>
                    <ClubCrest
                      logoUrl={row.team.logo_url}
                      clubName={row.team.club_crest_name}
                      teamName={row.team.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {row.team.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        {row.cleanSheets} Clean Sheets
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-black text-emerald-600 shrink-0 ml-2">
                    {row.goalsConceded} GA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard 3: Form Kings */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Top Form & Streaks</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Form Momentum</span>
            </div>

            <div className="space-y-3">
              {tournamentSuperlatives.bestForm.map((row, idx) => (
                <div
                  key={row.team.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-5 font-mono font-bold text-xs text-slate-400 text-center">
                      #{idx + 1}
                    </span>
                    <ClubCrest
                      logoUrl={row.team.logo_url}
                      clubName={row.team.club_crest_name}
                      teamName={row.team.name}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {row.team.name}
                      </span>
                      <div className="flex items-center gap-1 mt-0.5">
                        {row.form.slice(-3).map((f, i) => (
                          <span
                            key={i}
                            className={`w-3.5 h-3.5 rounded text-[8px] font-black flex items-center justify-center text-white ${
                              f === 'W' ? 'bg-emerald-500' : f === 'D' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-black text-amber-600 shrink-0 ml-2">
                    {row.winRate}% W
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. VIEW SCOPE 3: INDIVIDUAL TEAM DEEP-DIVE (Interactive charts & match logs) */}
      {viewScope === 'individual' && (
        <div className="space-y-6">
          {/* Team Selector & Header Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  Individual Team Analytical Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect goal trajectory, form sequence, defense rating, and fixtures for any team.
                </p>
              </div>

              {/* Team Dropdown Selector */}
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                className="px-3.5 py-2 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {currentTournamentTeams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Group {t.group_id || '-'} · {t.club_crest_name || 'Club'})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Team Profile Card */}
            {selectedTeam && (
              <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ClubCrest
                    logoUrl={selectedTeam.logo_url}
                    clubName={selectedTeam.club_crest_name}
                    teamName={selectedTeam.name}
                    size="xl"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-slate-900">{selectedTeam.name}</h2>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        Group {selectedTeam.group_id}
                      </span>
                      {selectedTeamData.qual && (
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                            selectedTeamData.qual.status === 'qualified'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}
                        >
                          {selectedTeamData.qual.badgeLabel}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Assigned Club:{' '}
                      <strong className="text-slate-800">{selectedTeam.club_crest_name}</strong> ·{' '}
                      {selectedTeamData.qual?.reason}
                    </div>
                  </div>
                </div>

                {/* Stat Badges */}
                <div className="flex items-center gap-3">
                  <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Goals Scored</div>
                    <div className="text-base font-black font-mono text-blue-600">
                      {selectedTeamData.stats?.goalsScored || 0}
                    </div>
                  </div>
                  <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Conceded</div>
                    <div className="text-base font-black font-mono text-rose-600">
                      {selectedTeamData.stats?.goalsConceded || 0}
                    </div>
                  </div>
                  <div className="text-center px-3 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Clean Sheets</div>
                    <div className="text-base font-black font-mono text-emerald-600">
                      {selectedTeamData.stats?.cleanSheets || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goals Scored Over Time Chart */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Goal Trajectory Over Matchweeks
                </h4>
                <p className="text-xs text-slate-500">
                  Plotting scoring trend against each opponent in {activeProfile?.name}.
                </p>
              </div>

              {/* Metric Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setChartMetric('cumulative')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartMetric === 'cumulative'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cumulative
                </button>
                <button
                  onClick={() => setChartMetric('per_match')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    chartMetric === 'per_match'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Match
                </button>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={selectedTeamData.goalsChart}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="matchLabel" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {chartMetric === 'cumulative' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="cumulativeScored"
                        name="Cumulative Goals Scored"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeConceded"
                        name="Cumulative Goals Conceded"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ fill: '#f43f5e', strokeWidth: 1, r: 3 }}
                      />
                    </>
                  ) : (
                    <>
                      <Line
                        type="monotone"
                        dataKey="scored"
                        name="Goals Scored (Match)"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conceded"
                        name="Goals Conceded (Match)"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', strokeWidth: 1, r: 3 }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW SCOPE 4: HOT DERBIES & RIVALRIES */}
      {viewScope === 'derbies' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 px-6 py-4 border-b border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Hot Matches & Derby Rivalries
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    {hotMatches.length} Upcoming
                  </span>
                </h3>
                <p className="text-xs text-slate-600">
                  Dynamically flagged based on live group positions (Top 2 Clash), scoring momentum, or traditional football rivalries.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {hotMatches.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-800">No Hot Derbies Flagged</div>
                <div className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                  As group standings evolve and qualifying encounters appear, high stakes clashes will be spotlighted here.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hotMatches.map((item) => (
                  <div
                    key={item.match.id}
                    className="bg-gradient-to-br from-white to-amber-50/30 border border-amber-200 rounded-xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.reasons.map((r, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200"
                          >
                            <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                            {r}
                          </span>
                        ))}
                      </div>

                      <span className="text-[11px] font-bold text-slate-500">
                        {item.match.group_id
                          ? `Group ${item.match.group_id} · Round ${item.match.round_number}`
                          : item.match.match_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 py-2 border-y border-slate-100">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <ClubCrest
                          logoUrl={item.homeTeam.logo_url}
                          clubName={item.homeTeam.club_crest_name}
                          teamName={item.homeTeam.name}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {item.homeTeam.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Rank #{item.homeRank}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs font-black text-amber-600 bg-amber-100/70 px-2.5 py-1 rounded-md">
                        VS
                      </div>

                      <div className="flex items-center gap-2.5 flex-1 min-w-0 justify-end text-right">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {item.awayTeam.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            Rank #{item.awayRank}
                          </div>
                        </div>
                        <ClubCrest
                          logoUrl={item.awayTeam.logo_url}
                          clubName={item.awayTeam.club_crest_name}
                          teamName={item.awayTeam.name}
                          size="md"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end">
                      {onOpenScoreModal && (
                        <button
                          onClick={() => onOpenScoreModal(item.match)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                        >
                          <span>Input Score</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. Group Goals Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Group Stage Goals Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Total goals scored across each of the 6 groups in {activeProfile?.name}.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Matches completed:{' '}
            <strong className="text-slate-800 font-mono">
              {tournamentOverview.playedCount}
            </strong>
            <span className="font-mono"> / {tournamentOverview.totalCount}</span>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={tournamentOverview.groupGoalsData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="group" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
                formatter={(val: any, _name: any, item: any) => [
                  `${val} goals (${item?.payload?.matchesPlayed || 0} matches played)`,
                  'Total Goals',
                ]}
              />
              <Bar dataKey="goals" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Goals Scored" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
