/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Match, Team, GroupLetter } from '../types/tournament';
import { GROUPS } from '../lib/tournamentEngine';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Layers,
  Shield,
  Target,
  Zap,
  Filter,
} from 'lucide-react';

interface AdvancedAnalyticsGraphsProps {
  teams: Team[];
  matches: Match[];
}

export const AdvancedAnalyticsGraphs: React.FC<AdvancedAnalyticsGraphsProps> = ({
  teams,
  matches,
}) => {
  const [chartCategory, setChartCategory] = useState<'all' | 'progression' | 'attack_defense' | 'outcomes' | 'margins'>('all');

  // Filter played matches
  const playedMatches = useMemo(() => {
    return matches.filter(
      (m) => m.is_played && m.home_score !== null && m.away_score !== null
    );
  }, [matches]);

  // 1. Progression by Matchday / Round (AreaChart)
  const progressionData = useMemo(() => {
    const roundsMap = new Map<string, { round: string; goals: number; matchesCount: number }>();

    // Seed group matchdays 1 through 6
    for (let i = 1; i <= 6; i++) {
      roundsMap.set(`GW ${i}`, { round: `GW ${i}`, goals: 0, matchesCount: 0 });
    }

    playedMatches.forEach((m) => {
      let key = 'Other';
      if (m.match_type === 'Group' && m.round_number) {
        key = `GW ${m.round_number}`;
      } else if (m.match_type === 'Ro16') {
        key = 'Ro16';
      } else if (m.match_type === 'QF') {
        key = 'QF';
      } else if (m.match_type === 'SF') {
        key = 'SF';
      } else if (m.match_type === 'Final') {
        key = 'Final';
      }

      const existing = roundsMap.get(key) || { round: key, goals: 0, matchesCount: 0 };
      existing.goals += (m.home_score || 0) + (m.away_score || 0);
      existing.matchesCount += 1;
      roundsMap.set(key, existing);
    });

    return Array.from(roundsMap.values()).map((r) => ({
      ...r,
      avgGoals: r.matchesCount > 0 ? Number((r.goals / r.matchesCount).toFixed(2)) : 0,
    }));
  }, [playedMatches]);

  // 2. Attack vs Defense Bar Chart (Top 12 Active Teams)
  const attackDefenseData = useMemo(() => {
    const teamStats = teams.map((team) => {
      const teamMatches = playedMatches.filter(
        (m) => m.home_team_id === team.id || m.away_team_id === team.id
      );

      let gf = 0;
      let ga = 0;
      let cleanSheets = 0;

      teamMatches.forEach((m) => {
        if (m.home_team_id === team.id) {
          gf += m.home_score || 0;
          ga += m.away_score || 0;
          if (m.away_score === 0) cleanSheets += 1;
        } else {
          gf += m.away_score || 0;
          ga += m.home_score || 0;
          if (m.home_score === 0) cleanSheets += 1;
        }
      });

      return {
        name: team.name,
        club: team.club_crest_name || 'Club',
        group: team.group_id ? `Grp ${team.group_id}` : '',
        goalsFor: gf,
        goalsAgainst: ga,
        goalDiff: gf - ga,
        cleanSheets,
        played: teamMatches.length,
      };
    });

    return teamStats
      .filter((t) => t.played > 0)
      .sort((a, b) => b.goalsFor - a.goalsFor)
      .slice(0, 12);
  }, [teams, playedMatches]);

  // 3. Match Outcomes Distribution (Donut / PieChart)
  const outcomesData = useMemo(() => {
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;

    playedMatches.forEach((m) => {
      const h = m.home_score ?? 0;
      const a = m.away_score ?? 0;
      if (h > a) homeWins++;
      else if (a > h) awayWins++;
      else draws++;
    });

    return [
      { name: 'Home Victories', value: homeWins, color: '#3b82f6' },
      { name: 'Away Victories', value: awayWins, color: '#10b981' },
      { name: 'Draws', value: draws, color: '#f59e0b' },
    ];
  }, [playedMatches]);

  // 4. Goal Margin Frequency Distribution (BarChart)
  const marginDistribution = useMemo(() => {
    const counts = {
      'Draw (0)': 0,
      '1 Goal Margin': 0,
      '2 Goals Margin': 0,
      '3 Goals Margin': 0,
      '4+ Blowout': 0,
    };

    playedMatches.forEach((m) => {
      const diff = Math.abs((m.home_score ?? 0) - (m.away_score ?? 0));
      if (diff === 0) counts['Draw (0)']++;
      else if (diff === 1) counts['1 Goal Margin']++;
      else if (diff === 2) counts['2 Goals Margin']++;
      else if (diff === 3) counts['3 Goals Margin']++;
      else counts['4+ Blowout']++;
    });

    return Object.entries(counts).map(([range, count]) => ({
      marginRange: range,
      count,
    }));
  }, [playedMatches]);

  // 5. Group Goals Comparison
  const groupStats = useMemo(() => {
    return GROUPS.map((g) => {
      const gMatches = playedMatches.filter((m) => m.group_id === g);
      const goals = gMatches.reduce(
        (sum, m) => sum + (m.home_score || 0) + (m.away_score || 0),
        0
      );
      return {
        group: `Group ${g}`,
        goals,
        matches: gMatches.length,
        avgPerMatch: gMatches.length > 0 ? Number((goals / gMatches.length).toFixed(2)) : 0,
      };
    });
  }, [playedMatches]);

  return (
    <div className="space-y-6">
      {/* Category Navigation Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Visual Performance & Tactical Charts
          </h3>
          <p className="text-xs text-slate-500">
            Interactive multi-dimensional graphs covering goal momentum, margin splits, and team balance.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
          <button
            onClick={() => setChartCategory('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              chartCategory === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Visuals
          </button>
          <button
            onClick={() => setChartCategory('progression')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              chartCategory === 'progression'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matchday Trajectory
          </button>
          <button
            onClick={() => setChartCategory('attack_defense')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              chartCategory === 'attack_defense'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Attack vs Defense
          </button>
          <button
            onClick={() => setChartCategory('outcomes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              chartCategory === 'outcomes'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Outcome Splits
          </button>
          <button
            onClick={() => setChartCategory('margins')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
              chartCategory === 'margins'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Margin Frequency
          </button>
        </div>
      </div>

      {/* Grid of Visual Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Matchweek Goal Progression AreaChart */}
        {(chartCategory === 'all' || chartCategory === 'progression') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Goalscoring Momentum Across Matchdays
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Goals per Gameweek</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressionData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goalArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="round" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [
                      `${val} ${name === 'goals' ? 'Total Goals' : 'Avg / Game'}`,
                      name === 'goals' ? 'Total Goals' : 'Avg / Game',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="goals"
                    name="goals"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#goalArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center">
              Total Goals scored during each round of tournament play
            </div>
          </div>
        )}

        {/* Graph 2: Attack vs Defense Multi-Bar Chart */}
        {(chartCategory === 'all' || chartCategory === 'attack_defense') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Attack (GF) vs Defense (GA) - Top Teams
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Scored vs Conceded</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackDefenseData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="goalsFor" name="Goals Scored (GF)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="goalsAgainst" name="Goals Conceded (GA)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center">
              Compares firepower against defensive solidity across tournament leaders
            </div>
          </div>
        )}

        {/* Graph 3: Match Outcomes Pie / Donut Chart */}
        {(chartCategory === 'all' || chartCategory === 'outcomes') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  Match Outcome Splits (Home vs Away vs Draws)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Results Distribution</span>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomesData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {outcomesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any) => [`${val} matches`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center">
              Total {playedMatches.length} completed matches analyzed
            </div>
          </div>
        )}

        {/* Graph 4: Goal Margin Distribution */}
        {(chartCategory === 'all' || chartCategory === 'margins') && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900">
                  Victory Margin Frequency Distribution
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Closeness Spectrum</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginDistribution} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="marginRange" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${val} fixtures`, 'Frequency']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Matches" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-[11px] text-slate-500 text-center">
              Tracks whether tournament fixtures are tight battles or one-sided blowouts
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
