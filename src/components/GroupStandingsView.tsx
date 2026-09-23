/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GroupLetter, Match, Team } from '../types/tournament';
import { calculateGroupStandings, GROUPS } from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import {
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Dices,
  Edit3,
  Flame,
  Layers,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface GroupStandingsViewProps {
  teams: Team[];
  matches: Match[];
  onOpenMatchScore: (match: Match) => void;
  onNavigateToThirdPlace: () => void;
  onOpenSetupWizard?: () => void;
}

export const GroupStandingsView: React.FC<GroupStandingsViewProps> = ({
  teams,
  matches,
  onOpenMatchScore,
  onNavigateToThirdPlace,
  onOpenSetupWizard,
}) => {
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<GroupLetter | 'ALL'>('ALL');
  const [matchViewMode, setMatchViewMode] = useState<'standings' | 'fixtures'>('standings');

  // Summary Metrics
  const groupMatches = matches.filter((m) => m.match_type === 'Group');
  const playedMatches = groupMatches.filter((m) => m.is_played);
  const totalGoals = playedMatches.reduce(
    (acc, m) => acc + (m.home_score || 0) + (m.away_score || 0),
    0
  );
  const goalsPerMatch = playedMatches.length > 0 ? (totalGoals / playedMatches.length).toFixed(1) : '0.0';
  const completionPct =
    groupMatches.length > 0 ? Math.round((playedMatches.length / groupMatches.length) * 100) : 0;

  const displayedGroups = selectedGroupFilter === 'ALL' ? GROUPS : [selectedGroupFilter];

  return (
    <div className="space-y-6">
      {/* Top Tournament Command Center Banner - Optimized for PC & All Screens */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle decorative accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50/60 via-indigo-50/20 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Main Title & Description */}
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Phase 1: Group Stage
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">Intra-Group Double Round-Robin</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-medium">24 Teams / 6 Groups</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Group Standings & Match Center
            </h1>

            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Top 2 teams from each group qualify automatically to the Round of 16 (12 teams). The 4 best 3rd-placed teams advance via the{' '}
              <button
                onClick={onNavigateToThirdPlace}
                className="text-blue-600 font-semibold hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 transition-colors"
              >
                3rd Place Mini-League <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </p>
          </div>

          {/* Quick Metrics Bar - PC Expanded View */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50/90 p-3 sm:p-4 rounded-xl border border-slate-200/80 shrink-0">
            {/* Matches Progress */}
            <div className="px-3 min-w-[110px]">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Matches Played
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900 font-mono">
                  {playedMatches.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">/ {groupMatches.length}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-10 bg-slate-200" />

            {/* Total Goals */}
            <div className="px-3 min-w-[90px]">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Goals
              </span>
              <span className="text-xl font-extrabold text-blue-600 font-mono mt-0.5 block">
                {totalGoals}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                {goalsPerMatch} / match
              </span>
            </div>

            <div className="hidden sm:block w-px h-10 bg-slate-200" />

            {/* Completion */}
            <div className="px-3 min-w-[90px]">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Progress
              </span>
              <span className="text-xl font-extrabold text-emerald-600 font-mono mt-0.5 block">
                {completionPct}%
              </span>
              <span className="text-[10px] text-emerald-700 font-medium block">
                {completionPct === 100 ? 'Stage Complete' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 pt-5 border-t border-slate-100">
          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Filter:
            </span>
            <button
              onClick={() => setSelectedGroupFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                selectedGroupFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              All 6 Groups
            </button>
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroupFilter(g)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  selectedGroupFilter === g
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                Group {g}
              </button>
            ))}
          </div>

          {/* Controls: Setup Wizard & View Switcher */}
          <div className="flex items-center gap-2.5 shrink-0">
            {onOpenSetupWizard && (
              <button
                type="button"
                onClick={onOpenSetupWizard}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs"
                title="Open Group Assignment & Draw Wizard"
              >
                <Dices className="w-3.5 h-3.5 text-blue-600" />
                <span>Draw / Group Setup</span>
              </button>
            )}

            {/* View Switcher Pill */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setMatchViewMode('standings')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  matchViewMode === 'standings'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Standings Table
              </button>
              <button
                onClick={() => setMatchViewMode('fixtures')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  matchViewMode === 'fixtures'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fixtures & Scores
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Qualification Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500 inline-block" />
            <span className="font-semibold text-slate-800">Rank 1–2:</span>
            <span className="text-slate-500">Direct Qualification (Round of 16)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500/20 border border-amber-500 inline-block" />
            <span className="font-semibold text-slate-800">Rank 3:</span>
            <span className="text-slate-500">3rd Place Mini-League Playoff</span>
          </div>
        </div>

        <button
          onClick={onNavigateToThirdPlace}
          className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 transition-colors ml-auto text-xs"
        >
          <span>View 3rd Place Table</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Groups Grid - Engineered for PC 3-column / 2-column widescreen display */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {displayedGroups.map((groupLetter) => {
          const standings = calculateGroupStandings(groupLetter, teams, matches);
          const currentGroupMatches = groupMatches.filter((m) => m.group_id === groupLetter);
          const groupPlayedCount = currentGroupMatches.filter((m) => m.is_played).length;
          const groupGoals = currentGroupMatches
            .filter((m) => m.is_played)
            .reduce((acc, m) => acc + (m.home_score || 0) + (m.away_score || 0), 0);

          return (
            <div
              key={groupLetter}
              className="bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Group Card Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 via-slate-50/90 to-white border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    {groupLetter}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm leading-tight">
                      Group {groupLetter}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-medium block">
                      Double Round-Robin
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                    {groupPlayedCount}/12 Matches
                  </span>
                  {groupPlayedCount === 12 && (
                    <span title="All group matches completed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </span>
                  )}
                </div>
              </div>

              {matchViewMode === 'standings' ? (
                /* Standings Table View */
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Team & Club</th>
                        <th className="py-2.5 px-1.5 text-center font-bold" title="Matches Played">
                          P
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Won">
                          W
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Drawn">
                          D
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Lost">
                          L
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Goals For">
                          GF
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Goals Against">
                          GA
                        </th>
                        <th className="py-2.5 px-1.5 text-center" title="Goal Difference">
                          GD
                        </th>
                        <th className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                          PTS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {standings.map((row, index) => {
                        const isDirectQualifier = index < 2;
                        const isThirdPlace = index === 2;

                        const rowBgClass = isDirectQualifier
                          ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                          : isThirdPlace
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/70';

                        return (
                          <tr
                            key={row.team.id}
                            className={`transition-colors relative ${rowBgClass}`}
                          >
                            {/* Rank Column */}
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold ${
                                  isDirectQualifier
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : isThirdPlace
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'text-slate-400 font-medium'
                                }`}
                              >
                                {row.rank}
                              </span>
                            </td>

                            {/* Team with Reliable Club Crest */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5 min-w-[130px]">
                                <ClubCrest
                                  logoUrl={row.team.logo_url}
                                  clubName={row.team.club_crest_name}
                                  teamName={row.team.name}
                                  size="sm"
                                  className="shrink-0"
                                />
                                <div className="truncate">
                                  <span className="font-bold text-slate-900 block truncate leading-tight">
                                    {row.team.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium truncate block leading-none mt-0.5">
                                    {row.team.club_crest_name || 'Club'}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Played */}
                            <td className="py-2.5 px-1.5 text-center font-mono font-semibold tabular-nums text-slate-700">
                              {row.played}
                            </td>

                            {/* Won */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums text-slate-600">
                              {row.won}
                            </td>

                            {/* Drawn */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums text-slate-600">
                              {row.drawn}
                            </td>

                            {/* Lost */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums text-slate-600">
                              {row.lost}
                            </td>

                            {/* Goals For */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums text-slate-600">
                              {row.goalsFor}
                            </td>

                            {/* Goals Against */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums text-slate-600">
                              {row.goalsAgainst}
                            </td>

                            {/* Goal Difference */}
                            <td className="py-2.5 px-1.5 text-center font-mono tabular-nums font-semibold">
                              <span
                                className={`text-[11px] ${
                                  row.goalDifference > 0
                                    ? 'text-emerald-700'
                                    : row.goalDifference < 0
                                    ? 'text-rose-700'
                                    : 'text-slate-400'
                                }`}
                              >
                                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                              </span>
                            </td>

                            {/* Points */}
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-black text-slate-900 text-sm">
                              {row.points}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Group Fixtures & Scores View */
                <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto flex-1">
                  {currentGroupMatches.map((match) => {
                    const homeTeam = teams.find((t) => t.id === match.home_team_id);
                    const awayTeam = teams.find((t) => t.id === match.away_team_id);
                    if (!homeTeam || !awayTeam) return null;

                    return (
                      <div
                        key={match.id}
                        className="flex items-center justify-between p-3 hover:bg-slate-50/90 transition-colors"
                      >
                        {/* Leg & Round Tag */}
                        <div className="flex flex-col items-start w-12 shrink-0">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                            Leg {match.leg}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5">
                            R{match.round_number || (match.leg === 1 ? 1 : 4)}
                          </span>
                        </div>

                        {/* Matchup row */}
                        <div className="flex-1 flex items-center justify-between gap-2 px-2">
                          {/* Home */}
                          <div className="flex items-center gap-2 justify-end w-[40%] text-right">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {homeTeam.name}
                            </span>
                            <ClubCrest
                              logoUrl={homeTeam.logo_url}
                              clubName={homeTeam.club_crest_name}
                              teamName={homeTeam.name}
                              size="xs"
                              className="shrink-0"
                            />
                          </div>

                          {/* Score Center Button */}
                          <div className="shrink-0 flex items-center justify-center min-w-16">
                            {match.is_played ? (
                              <button
                                onClick={() => onOpenMatchScore(match)}
                                className="px-2.5 py-0.5 rounded-md bg-slate-900 hover:bg-blue-600 text-white font-mono font-bold text-xs tracking-wider transition-colors shadow-2xs"
                                title="Click to edit match score"
                              >
                                {match.home_score} - {match.away_score}
                              </button>
                            ) : (
                              <button
                                onClick={() => onOpenMatchScore(match)}
                                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                                title="Click to enter match score"
                              >
                                vs
                              </button>
                            )}
                          </div>

                          {/* Away */}
                          <div className="flex items-center gap-2 justify-start w-[40%] text-left">
                            <ClubCrest
                              logoUrl={awayTeam.logo_url}
                              clubName={awayTeam.club_crest_name}
                              teamName={awayTeam.name}
                              size="xs"
                              className="shrink-0"
                            />
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {awayTeam.name}
                            </span>
                          </div>
                        </div>

                        {/* Quick Edit Icon */}
                        <button
                          onClick={() => onOpenMatchScore(match)}
                          className="shrink-0 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Enter or update match score"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Group Card Footer */}
              <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-200/70 flex items-center justify-between text-xs text-slate-500 mt-auto">
                <span className="text-[11px] font-medium">
                  Goals in group: <strong className="text-slate-800 font-mono">{groupGoals}</strong>
                </span>

                <button
                  onClick={() => {
                    const unplayed = currentGroupMatches.find((m) => !m.is_played) || currentGroupMatches[0];
                    if (unplayed) onOpenMatchScore(unplayed);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                >
                  <span>Score Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
