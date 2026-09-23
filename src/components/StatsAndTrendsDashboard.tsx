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
} from 'recharts';
import { Match, Team, GroupLetter } from '../types/tournament';
import { calculateGroupStandings, GROUPS } from '../lib/tournamentEngine';
import { useTournament } from '../context/TournamentContext';
import { ClubCrest } from './ClubCrest';
import {
  Activity,
  Award,
  ChevronRight,
  Database,
  Flame,
  Info,
  Layers,
  PieChart as PieChartIcon,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';

interface StatsAndTrendsDashboardProps {
  teams?: Team[];
  matches?: Match[];
  onOpenScoreModal?: (match: Match) => void;
}

export const StatsAndTrendsDashboard: React.FC<StatsAndTrendsDashboardProps> = ({
  teams: propTeams,
  matches: propMatches,
  onOpenScoreModal,
}) => {
  // Extract activeTournamentId and state directly from TournamentContext
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

  // Source matches & teams: prefer props if supplied, otherwise fallback to context
  const sourceMatches = propMatches && propMatches.length > 0 ? propMatches : contextMatches;
  const sourceTeams = propTeams && propTeams.length > 0 ? propTeams : contextTeams;

  // Explicitly filter the fetched matches list using activeTournamentId from useTournament context
  const currentTournamentMatches = useMemo(() => {
    if (!sourceMatches || sourceMatches.length === 0) return [];
    if (!activeTournamentId) return sourceMatches;

    return sourceMatches.filter((m) => {
      if (m.tournament_id) {
        return m.tournament_id === activeTournamentId;
      }
      // If matches do not carry a tournament_id tag (e.g. freshly generated),
      // associate them with the current active tournament
      return true;
    });
  }, [sourceMatches, activeTournamentId]);

  // Explicitly filter teams by activeTournamentId
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

  // Selected team state for Goals Scored Over Time
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    return currentTournamentTeams[0]?.id || '';
  });

  const [chartMetric, setChartMetric] = useState<'cumulative' | 'per_match'>('cumulative');

  // Synchronize selected team when tournament or teams list changes
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

  // Helper to look up team strictly within active tournament
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

  // Group standings map: calculated exclusively from current tournament matches and teams
  const groupStandingsMap = useMemo(() => {
    const map: Record<GroupLetter, ReturnType<typeof calculateGroupStandings>> = {
      A: calculateGroupStandings('A', currentTournamentTeams, currentTournamentMatches),
      B: calculateGroupStandings('B', currentTournamentTeams, currentTournamentMatches),
      C: calculateGroupStandings('C', currentTournamentTeams, currentTournamentMatches),
      D: calculateGroupStandings('D', currentTournamentTeams, currentTournamentMatches),
      E: calculateGroupStandings('E', currentTournamentTeams, currentTournamentMatches),
      F: calculateGroupStandings('F', currentTournamentTeams, currentTournamentMatches),
    };
    return map;
  }, [currentTournamentTeams, currentTournamentMatches]);

  // Helper: get team rank in their group (1-indexed)
  const getTeamRank = (teamId: string): number => {
    const t = currentTournamentTeams.find((team) => team.id === teamId);
    if (!t || !t.group_id) return 99;
    const standings = groupStandingsMap[t.group_id] || [];
    const index = standings.findIndex((s) => s.team.id === teamId);
    return index !== -1 ? index + 1 : 99;
  };

  // Helper: calculate goals scored in the last 2 played matches by a team in the current tournament
  const getGoalsInLast2Matches = (teamId: string): number => {
    const playedMatches = currentTournamentMatches
      .filter(
        (m) =>
          m.is_played &&
          (m.home_team_id === teamId || m.away_team_id === teamId) &&
          m.home_score !== null &&
          m.away_score !== null
      )
      .sort((a, b) => (a.round_number || 0) - (b.round_number || 0))
      .slice(-2);

    return playedMatches.reduce((sum, m) => {
      const goals = m.home_team_id === teamId ? (m.home_score || 0) : (m.away_score || 0);
      return sum + goals;
    }, 0);
  };

  // Hot Matches / Derbies: Calculated dynamically from active tournament's live state
  // Flags unplayed matches as 'Hot' if:
  // 1. Both teams are currently in the top 2 of their group
  // 2. OR both teams have scored > 5 goals in their last 2 matches
  // 3. OR classic high-stakes rivalry clash
  const hotMatches = useMemo(() => {
    const unplayed = currentTournamentMatches.filter((m) => !m.is_played);

    return unplayed
      .map((match) => {
        const homeTeam = getTeam(match.home_team_id);
        const awayTeam = getTeam(match.away_team_id);

        const homeRank = getTeamRank(match.home_team_id);
        const awayRank = getTeamRank(match.away_team_id);

        const homeGoalsLast2 = getGoalsInLast2Matches(match.home_team_id);
        const awayGoalsLast2 = getGoalsInLast2Matches(match.away_team_id);

        const isBothTop2 = homeRank <= 2 && awayRank <= 2;
        const isBothHighScoring = homeGoalsLast2 > 5 && awayGoalsLast2 > 5;

        // Check traditional club rivalries if clubs assigned
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
        if (isBothHighScoring) reasons.push('High Firepower (>5 goals in last 2 games)');
        if (isClassicDerby) reasons.push('Classic Football Derby');

        return {
          match,
          homeTeam,
          awayTeam,
          homeRank,
          awayRank,
          homeGoalsLast2,
          awayGoalsLast2,
          isHot,
          reasons,
        };
      })
      .filter((item) => item.isHot);
  }, [currentTournamentMatches, currentTournamentTeams, groupStandingsMap]);

  // Goals Scored Over Time: calculated from active tournament's live Supabase matches
  const goalsOverTimeData = useMemo(() => {
    if (!selectedTeam) return [];

    const teamMatches = currentTournamentMatches
      .filter(
        (m) => m.home_team_id === selectedTeam.id || m.away_team_id === selectedTeam.id
      )
      .sort((a, b) => {
        const rA = a.round_number ?? 99;
        const rB = b.round_number ?? 99;
        return rA - rB;
      });

    let cumulativeScored = 0;
    let cumulativeConceded = 0;

    return teamMatches.map((m, idx) => {
      const isHome = m.home_team_id === selectedTeam.id;
      const opponent = getTeam(isHome ? m.away_team_id : m.home_team_id);
      const scored = m.is_played
        ? isHome
          ? (m.home_score ?? 0)
          : (m.away_score ?? 0)
        : 0;
      const conceded = m.is_played
        ? isHome
          ? (m.away_score ?? 0)
          : (m.home_score ?? 0)
        : 0;

      cumulativeScored += scored;
      cumulativeConceded += conceded;

      const label = m.match_type === 'Group' ? `GW ${m.round_number || idx + 1}` : m.match_type;

      return {
        matchIndex: idx + 1,
        matchLabel: label,
        opponent: opponent.name,
        scored,
        conceded,
        cumulativeScored,
        cumulativeConceded,
        isPlayed: m.is_played,
      };
    });
  }, [selectedTeam, currentTournamentMatches, currentTournamentTeams]);

  const selectedTeamPlayedMatchesCount = useMemo(() => {
    return goalsOverTimeData.filter((d) => d.isPlayed).length;
  }, [goalsOverTimeData]);

  // Overall Tournament Statistics calculated strictly from currentTournamentMatches
  const tournamentStats = useMemo(() => {
    const playedMatches = currentTournamentMatches.filter((m) => m.is_played);
    const totalGoals = playedMatches.reduce(
      (sum, m) => sum + (m.home_score || 0) + (m.away_score || 0),
      0
    );
    const avgGoalsPerMatch =
      playedMatches.length > 0 ? (totalGoals / playedMatches.length).toFixed(2) : '0.00';

    // Top scoring teams & clean sheets
    const teamGoalsMap = new Map<string, { team: Team; goals: number; cleanSheets: number }>();
    currentTournamentTeams.forEach((t) => teamGoalsMap.set(t.id, { team: t, goals: 0, cleanSheets: 0 }));

    playedMatches.forEach((m) => {
      const hStats = teamGoalsMap.get(m.home_team_id);
      const aStats = teamGoalsMap.get(m.away_team_id);
      if (hStats && m.home_score !== null) {
        hStats.goals += m.home_score;
        if (m.away_score === 0) hStats.cleanSheets += 1;
      }
      if (aStats && m.away_score !== null) {
        aStats.goals += m.away_score;
        if (m.home_score === 0) aStats.cleanSheets += 1;
      }
    });

    const sortedByGoals = Array.from(teamGoalsMap.values()).sort((a, b) => b.goals - a.goals);
    const topScorer = sortedByGoals[0]?.goals > 0 ? sortedByGoals[0] : null;

    const sortedByCleanSheets = Array.from(teamGoalsMap.values()).sort(
      (a, b) => b.cleanSheets - a.cleanSheets
    );
    const bestDefense = sortedByCleanSheets[0]?.cleanSheets > 0 ? sortedByCleanSheets[0] : null;

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
      topScorer,
      bestDefense,
      groupGoalsData,
    };
  }, [currentTournamentMatches, currentTournamentTeams]);

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
      {/* Top Banner with Active Tournament Context & Supabase Live Status */}
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
                {isSupabaseConnected ? 'Live Supabase State' : 'Local Storage Cache'}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-mono text-[11px] lowercase">
                id: {activeTournamentId}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              Stats, Trends & Hot Derbies
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Real-time analytics computed strictly from the active tournament ({activeProfile?.name}).
              Filtered across {currentTournamentMatches.length} matches and {currentTournamentTeams.length} registered teams.
            </p>
          </div>

          {/* Quick Metrics Bar & Refresh Button */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-1 sm:flex-initial">
              <div className="bg-blue-50/80 border border-blue-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-blue-600 font-semibold uppercase">Total Goals</div>
                <div className="text-lg sm:text-xl font-extrabold text-blue-950 font-mono mt-0.5">
                  {tournamentStats.totalGoals}
                </div>
              </div>
              <div className="bg-emerald-50/80 border border-emerald-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-emerald-600 font-semibold uppercase">Goals/Game</div>
                <div className="text-lg sm:text-xl font-extrabold text-emerald-950 font-mono mt-0.5">
                  {tournamentStats.avgGoalsPerMatch}
                </div>
              </div>
              <div className="bg-amber-50/80 border border-amber-100 rounded-lg px-3.5 py-2">
                <div className="text-[10px] text-amber-700 font-semibold uppercase">Hot Derbies</div>
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
              title="Refresh live data from Supabase"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty State if No Matches Exist for this Profile */}
      {currentTournamentMatches.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center shadow-xs">
          <Zap className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">
            No Matches Found for Profile: {activeProfile?.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            This tournament does not have match records saved under tournament ID{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">{activeTournamentId}</code>.
            Generate fixtures or load a saved tournament from the menu to populate statistics.
          </p>
        </div>
      ) : (
        <>
          {/* Section 1: Hot Matches & Derby Rivalries (Filtered strictly by active tournament) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 px-6 py-4 border-b border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Flame className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    Hot Matches & Derby Rivalries
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {hotMatches.length} Upcoming
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600">
                    Dynamically flagged based on live standings (Top 2 Clash), recent scoring form (&gt;5 goals in last 2 matches), or classic football rivalries.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {hotMatches.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Zap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <div className="text-sm font-bold text-slate-800">No Hot Matches Flagged Yet</div>
                  <div className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                    All matches reflect the current live state of {activeProfile?.name}. As group standings develop and high-scoring streaks emerge, qualifying fixtures will appear here automatically.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hotMatches.map((item) => (
                    <div
                      key={item.match.id}
                      className="bg-gradient-to-br from-white to-amber-50/30 border border-amber-200 rounded-xl p-4.5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden"
                    >
                      {/* Fire badge indicator */}
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

                      {/* Teams Matchup Header */}
                      <div className="flex items-center justify-between gap-4 py-2 border-y border-slate-100">
                        {/* Home Team */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <ClubCrest
                            logoUrl={item.homeTeam.logo_url}
                            clubName={item.homeTeam.club_crest_name}
                            teamName={item.homeTeam.name}
                            size="md"
                            className="shrink-0"
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

                        {/* Away Team */}
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
                            className="shrink-0"
                          />
                        </div>
                      </div>

                      {/* Bottom Stats & Action */}
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                        <div className="text-slate-500 text-[11px]">
                          <span>Recent goals: </span>
                          <span className="font-semibold text-slate-700">
                            {item.homeGoalsLast2}
                          </span>{' '}
                          vs{' '}
                          <span className="font-semibold text-slate-700">
                            {item.awayGoalsLast2}
                          </span>
                        </div>

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

          {/* Section 2: Goals Scored Over Time Line Chart (Filtered strictly by active tournament) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Goals Scored Over Time
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select any team to visualize their live goal scoring trajectory in tournament{' '}
                  <strong className="text-slate-700">{activeProfile?.name}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Team Dropdown */}
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {currentTournamentTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Group {t.group_id || '-'}
                      {t.club_crest_name ? ` · ${t.club_crest_name}` : ''})
                    </option>
                  ))}
                </select>

                {/* Metric Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setChartMetric('cumulative')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      chartMetric === 'cumulative'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cumulative
                  </button>
                  <button
                    onClick={() => setChartMetric('per_match')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      chartMetric === 'per_match'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Per Match
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Team Profile Preview */}
            {selectedTeam && (
              <div className="flex items-center justify-between flex-wrap gap-3 p-3 mb-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <ClubCrest
                    logoUrl={selectedTeam.logo_url}
                    clubName={selectedTeam.club_crest_name}
                    teamName={selectedTeam.name}
                    size="lg"
                    className="shrink-0"
                  />
                  <div>
                    <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{selectedTeam.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        Group {selectedTeam.group_id || 'N/A'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Representing Club:{' '}
                      <span className="font-semibold text-slate-700">
                        {selectedTeam.club_crest_name || 'Assigned Club'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div>
                    Matches Played:{' '}
                    <strong className="font-mono text-slate-900">
                      {selectedTeamPlayedMatchesCount}
                    </strong>
                    <span className="text-slate-400 font-mono"> / {goalsOverTimeData.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty or Unplayed Notice */}
            {selectedTeamPlayedMatchesCount === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-amber-50/80 border border-amber-200 text-amber-800 rounded-lg text-xs">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  No matches completed yet for {selectedTeam?.name || 'this team'}. All plotted values reflect live matchweek fixtures with 0 goals recorded to date.
                </span>
              </div>
            )}

            {/* Recharts Line Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={goalsOverTimeData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="matchLabel"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      val,
                      name === 'scored'
                        ? 'Goals Scored'
                        : name === 'conceded'
                        ? 'Goals Conceded'
                        : name === 'cumulativeScored'
                        ? 'Cumulative Scored'
                        : 'Cumulative Conceded',
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      const status = item?.isPlayed ? 'Played' : 'Scheduled';
                      return item ? `${label} vs ${item.opponent} (${status})` : label;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                    formatter={(val) =>
                      val === 'scored'
                        ? 'Goals Scored (Match)'
                        : val === 'conceded'
                        ? 'Goals Conceded (Match)'
                        : val === 'cumulativeScored'
                        ? 'Cumulative Goals Scored'
                        : 'Cumulative Goals Conceded'
                    }
                  />
                  {chartMetric === 'cumulative' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="cumulativeScored"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulativeConceded"
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
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conceded"
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

          {/* Section 3: Group Goals Distribution Bar Chart (Filtered strictly by active tournament) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Group Stage Goals Distribution
                  </h2>
                  <p className="text-xs text-slate-500">
                    Total goals scored across each of the 6 groups in {activeProfile?.name}.
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Matches completed:{' '}
                <strong className="text-slate-800 font-mono">
                  {tournamentStats.playedCount}
                </strong>
                <span className="font-mono"> / {tournamentStats.totalCount}</span>
              </div>
            </div>

            {tournamentStats.playedCount === 0 && (
              <div className="flex items-center gap-2 px-3 py-2 mb-4 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs">
                <Info className="w-4 h-4 shrink-0 text-slate-500" />
                <span>
                  No matches completed yet in this tournament. Bars will reflect live goal distributions as match scores are saved in Supabase.
                </span>
              </div>
            )}

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tournamentStats.groupGoalsData}
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
        </>
      )}
    </div>
  );
};
