/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Match, Team, GroupLetter } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import { useTournament } from '../context/TournamentContext';
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Search,
} from 'lucide-react';

export interface DoubleLegTieMatchup {
  tieId: string;
  groupId: string;
  roundLeg1: number;
  roundLeg2: number;
  teamA: Team;
  teamB: Team;
  leg1: Match;
  leg2: Match;
  aggScoreA: number;
  aggScoreB: number;
  isLeg1Played: boolean;
  isLeg2Played: boolean;
  isCompleted: boolean;
}

interface FixturesAndResultsViewProps {
  teams?: Team[];
  matches?: Match[];
  onSaveMatchScore?: (updatedMatch: Match) => void;
  onRefreshMatches?: () => Promise<void>;
}

export const FixturesAndResultsView: React.FC<FixturesAndResultsViewProps> = ({
  teams: propTeams,
  matches: propMatches,
  onRefreshMatches: propRefresh,
}) => {
  const tournament = useTournament();

  const teams = propTeams || tournament.teams;
  const matches = propMatches || tournament.matches;
  const refreshData = propRefresh || tournament.refreshData;

  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unplayed' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set of open/expanded tie IDs
  const [expandedTieIds, setExpandedTieIds] = useState<Set<string>>(new Set());

  // Local draft inputs for ties: tieId -> { leg1Home: string; leg1Away: string; leg2Home: string; leg2Away: string; isSaving: boolean; justSaved: boolean; error?: string }
  const [tieDrafts, setTieDrafts] = useState<
    Record<
      string,
      {
        leg1Home: string;
        leg1Away: string;
        leg2Home: string;
        leg2Away: string;
        isSaving: boolean;
        justSaved: boolean;
        error?: string;
      }
    >
  >({});

  // Compute all double-leg group ties
  const allTies = useMemo<DoubleLegTieMatchup[]>(() => {
    const ties: DoubleLegTieMatchup[] = [];
    const groupLetters: GroupLetter[] = ['A', 'B', 'C', 'D', 'E', 'F'];

    groupLetters.forEach((grp) => {
      const grpTeams = teams.filter((t) => t.group_id === grp);
      const grpMatches = matches.filter((m) => m.match_type === 'Group' && m.group_id === grp);

      for (let i = 0; i < grpTeams.length; i++) {
        for (let j = i + 1; j < grpTeams.length; j++) {
          const teamA = grpTeams[i];
          const teamB = grpTeams[j];

          const pairMatches = grpMatches.filter(
            (m) =>
              (m.home_team_id === teamA.id && m.away_team_id === teamB.id) ||
              (m.home_team_id === teamB.id && m.away_team_id === teamA.id)
          );

          let leg1 = pairMatches.find((m) => m.leg === 1);
          let leg2 = pairMatches.find((m) => m.leg === 2);

          if (!leg1 && pairMatches.length > 0) {
            leg1 = pairMatches[0];
          }
          if (!leg2 && pairMatches.length > 1) {
            leg2 = pairMatches[1];
          }

          const defaultLeg1: Match = leg1 || {
            id: `tie-${grp}-${teamA.id}-${teamB.id}-l1`,
            tournament_id: tournament.activeTournamentId,
            home_team_id: teamA.id,
            away_team_id: teamB.id,
            home_score: null,
            away_score: null,
            match_type: 'Group',
            is_played: false,
            group_id: grp,
            leg: 1,
            round_number: 1,
          };

          const defaultLeg2: Match = leg2 || {
            id: `tie-${grp}-${teamA.id}-${teamB.id}-l2`,
            tournament_id: tournament.activeTournamentId,
            home_team_id: teamB.id,
            away_team_id: teamA.id,
            home_score: null,
            away_score: null,
            match_type: 'Group',
            is_played: false,
            group_id: grp,
            leg: 2,
            round_number: 4,
          };

          const isLeg1Played =
            defaultLeg1.is_played &&
            defaultLeg1.home_score !== null &&
            defaultLeg1.away_score !== null;
          const isLeg2Played =
            defaultLeg2.is_played &&
            defaultLeg2.home_score !== null &&
            defaultLeg2.away_score !== null;
          const isCompleted = isLeg1Played && isLeg2Played;

          let aggScoreA = 0;
          let aggScoreB = 0;

          if (isLeg1Played) {
            if (defaultLeg1.home_team_id === teamA.id) {
              aggScoreA += defaultLeg1.home_score || 0;
              aggScoreB += defaultLeg1.away_score || 0;
            } else {
              aggScoreB += defaultLeg1.home_score || 0;
              aggScoreA += defaultLeg1.away_score || 0;
            }
          }

          if (isLeg2Played) {
            if (defaultLeg2.home_team_id === teamA.id) {
              aggScoreA += defaultLeg2.home_score || 0;
              aggScoreB += defaultLeg2.away_score || 0;
            } else {
              aggScoreB += defaultLeg2.home_score || 0;
              aggScoreA += defaultLeg2.away_score || 0;
            }
          }

          ties.push({
            tieId: `tie-${grp}-${teamA.id}-${teamB.id}`,
            groupId: grp,
            roundLeg1: defaultLeg1.round_number || 1,
            roundLeg2: defaultLeg2.round_number || 4,
            teamA,
            teamB,
            leg1: defaultLeg1,
            leg2: defaultLeg2,
            aggScoreA,
            aggScoreB,
            isLeg1Played,
            isLeg2Played,
            isCompleted,
          });
        }
      }
    });

    return ties;
  }, [teams, matches, tournament.activeTournamentId]);

  // Filtered ties
  const filteredTies = useMemo(() => {
    return allTies.filter((tie) => {
      if (selectedGroup !== 'all' && tie.groupId !== selectedGroup) {
        return false;
      }

      if (statusFilter === 'completed' && !tie.isCompleted) {
        return false;
      }
      if (statusFilter === 'unplayed' && tie.isCompleted) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const teamAName = tie.teamA.name.toLowerCase();
        const teamBName = tie.teamB.name.toLowerCase();
        const clubA = (tie.teamA.club_crest_name || '').toLowerCase();
        const clubB = (tie.teamB.club_crest_name || '').toLowerCase();

        return (
          teamAName.includes(query) ||
          teamBName.includes(query) ||
          clubA.includes(query) ||
          clubB.includes(query)
        );
      }

      return true;
    });
  }, [allTies, selectedGroup, statusFilter, searchQuery]);

  // Summary counts
  const totalTiesCount = allTies.length;
  const completedTiesCount = allTies.filter((t) => t.isCompleted).length;
  const pendingTiesCount = totalTiesCount - completedTiesCount;

  // Toggle accordion card
  const toggleTie = (tieId: string) => {
    setExpandedTieIds((prev) => {
      const next = new Set(prev);
      if (next.has(tieId)) {
        next.delete(tieId);
      } else {
        next.add(tieId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedTieIds(new Set(filteredTies.map((t) => t.tieId)));
  };

  const collapseAll = () => {
    setExpandedTieIds(new Set());
  };

  // Get or initialize draft state for a tie
  const getTieDraft = (tie: DoubleLegTieMatchup) => {
    const existing = tieDrafts[tie.tieId];
    if (existing) return existing;

    return {
      leg1Home: tie.leg1.home_score !== null ? String(tie.leg1.home_score) : '',
      leg1Away: tie.leg1.away_score !== null ? String(tie.leg1.away_score) : '',
      leg2Home: tie.leg2.home_score !== null ? String(tie.leg2.home_score) : '',
      leg2Away: tie.leg2.away_score !== null ? String(tie.leg2.away_score) : '',
      isSaving: false,
      justSaved: false,
      error: undefined,
    };
  };

  const updateTieDraftField = (
    tieId: string,
    tie: DoubleLegTieMatchup,
    field: 'leg1Home' | 'leg1Away' | 'leg2Home' | 'leg2Away',
    value: string
  ) => {
    const current = getTieDraft(tie);
    setTieDrafts((prev) => ({
      ...prev,
      [tieId]: {
        ...current,
        [field]: value,
        justSaved: false,
        error: undefined,
      },
    }));
  };

  const stepTieValue = (
    tieId: string,
    tie: DoubleLegTieMatchup,
    field: 'leg1Home' | 'leg1Away' | 'leg2Home' | 'leg2Away',
    delta: number
  ) => {
    const draft = getTieDraft(tie);
    const currVal = draft[field] === '' ? 0 : parseInt(draft[field], 10);
    const nextVal = Math.max(0, (isNaN(currVal) ? 0 : currVal) + delta);
    updateTieDraftField(tieId, tie, field, String(nextVal));
  };

  // Handle Save Tie (Updates Leg 1 and Leg 2, syncs with Supabase, re-fetches data)
  const handleSaveTie = async (tie: DoubleLegTieMatchup) => {
    const draft = getTieDraft(tie);

    const l1H = draft.leg1Home.trim() === '' ? null : parseInt(draft.leg1Home, 10);
    const l1A = draft.leg1Away.trim() === '' ? null : parseInt(draft.leg1Away, 10);
    const l2H = draft.leg2Home.trim() === '' ? null : parseInt(draft.leg2Home, 10);
    const l2A = draft.leg2Away.trim() === '' ? null : parseInt(draft.leg2Away, 10);

    // Validation
    if (l1H === null || isNaN(l1H) || l1A === null || isNaN(l1A)) {
      setTieDrafts((prev) => ({
        ...prev,
        [tie.tieId]: {
          ...draft,
          error: 'Please enter valid scores for Leg 1 (e.g. 0, 1, 2...).',
        },
      }));
      return;
    }

    if (l2H === null || isNaN(l2H) || l2A === null || isNaN(l2A)) {
      setTieDrafts((prev) => ({
        ...prev,
        [tie.tieId]: {
          ...draft,
          error: 'Please enter valid scores for Leg 2 (e.g. 0, 1, 2...).',
        },
      }));
      return;
    }

    if (l1H < 0 || l1A < 0 || l2H < 0 || l2A < 0) {
      setTieDrafts((prev) => ({
        ...prev,
        [tie.tieId]: {
          ...draft,
          error: 'Scores cannot be negative numbers.',
        },
      }));
      return;
    }

    // Set saving state
    setTieDrafts((prev) => ({
      ...prev,
      [tie.tieId]: {
        ...draft,
        isSaving: true,
        error: undefined,
      },
    }));

    const updatedLeg1: Match = {
      ...tie.leg1,
      home_score: l1H,
      away_score: l1A,
      is_played: true,
      tournament_id: tournament.activeTournamentId,
    };

    const updatedLeg2: Match = {
      ...tie.leg2,
      home_score: l2H,
      away_score: l2A,
      is_played: true,
      tournament_id: tournament.activeTournamentId,
    };

    try {
      // Use global tournament saveTieScores which updates Supabase and triggers refreshData()
      await tournament.saveTieScores(updatedLeg1, updatedLeg2);

      // Transition to visually confirmed saved state
      setTieDrafts((prev) => ({
        ...prev,
        [tie.tieId]: {
          leg1Home: String(l1H),
          leg1Away: String(l1A),
          leg2Home: String(l2H),
          leg2Away: String(l2A),
          isSaving: false,
          justSaved: true,
          error: undefined,
        },
      }));

      // Reset 'justSaved' banner after 4 seconds
      setTimeout(() => {
        setTieDrafts((prev) => {
          if (!prev[tie.tieId]) return prev;
          return {
            ...prev,
            [tie.tieId]: {
              ...prev[tie.tieId],
              justSaved: false,
            },
          };
        });
      }, 4000);
    } catch (err: unknown) {
      setTieDrafts((prev) => ({
        ...prev,
        [tie.tieId]: {
          ...draft,
          isSaving: false,
          error: err instanceof Error ? err.message : 'Failed to save tie. Please retry.',
        },
      }));
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
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <span>eFootball Match Center</span>
              <span aria-hidden="true">·</span>
              <span>Double-Leg Ties</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Fixtures & Results
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Collapsible double-leg fixtures with live two-way Supabase syncing, aggregate tracking, and instant standings updates.
            </p>
          </div>

          {/* Quick Stats & Refresh Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs">
              <span className="text-slate-500 font-medium">Ties Played:</span>
              <span className="font-extrabold text-emerald-700">
                {completedTiesCount}/{totalTiesCount}
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-medium">Pending:</span>
              <span className="font-extrabold text-amber-700">{pendingTiesCount}</span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
              title="Refresh matches from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Toolbar */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Group Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedGroup('all')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedGroup === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Groups
              </button>
              {(['A', 'B', 'C', 'D', 'E', 'F'] as GroupLetter[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                    selectedGroup === g
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Gr. {g}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Ties
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setStatusFilter('unplayed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === 'unplayed'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Search Input & Expand/Collapse Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search player or club..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Accordion / Collapsible Double-Leg Ties List */}
      <div className="space-y-3">
        {filteredTies.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-base font-bold text-slate-800">No Fixtures Found</div>
            <div className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No ties match the selected filter criteria. Try selecting "All Groups" or clearing your search term.
            </div>
          </div>
        ) : (
          filteredTies.map((tie) => {
            const isExpanded = expandedTieIds.has(tie.tieId);
            const draft = getTieDraft(tie);
            const isCompleted = tie.isCompleted;

            const cardBorderClass = draft.justSaved
              ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : isCompleted
              ? 'border-emerald-400/90 hover:border-emerald-500'
              : 'border-slate-200 hover:border-slate-300';

            const cardBgClass = draft.justSaved
              ? 'bg-emerald-50/70 transition-colors duration-500'
              : isExpanded
              ? 'bg-slate-50/50'
              : 'bg-white';

            // Home / Away team for Leg 1
            const leg1Home = tie.leg1.home_team_id === tie.teamA.id ? tie.teamA : tie.teamB;
            const leg1Away = tie.leg1.away_team_id === tie.teamB.id ? tie.teamB : tie.teamA;

            // Home / Away team for Leg 2 (Reverse)
            const leg2Home = tie.leg2.home_team_id === tie.teamB.id ? tie.teamB : tie.teamA;
            const leg2Away = tie.leg2.away_team_id === tie.teamA.id ? tie.teamA : tie.teamB;

            return (
              <div
                key={tie.tieId}
                className={`rounded-xl border transition-all duration-200 shadow-2xs overflow-hidden ${cardBorderClass} ${cardBgClass}`}
              >
                {/* Collapsed State Header / Trigger */}
                <div
                  onClick={() => toggleTie(tie.tieId)}
                  className="px-5 py-4 cursor-pointer select-none flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  {/* Left: Group badge & Round information */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      Group {tie.groupId}
                    </span>
                  </div>

                  {/* Center Matchup: Team A vs Team B */}
                  <div className="flex items-center justify-center gap-3 sm:gap-6 flex-1 min-w-0">
                    {/* Team A */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0 text-right">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {tie.teamA.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-medium">
                          {tie.teamA.club_crest_name || 'Club'}
                        </div>
                      </div>
                      <ClubCrest
                        logoUrl={tie.teamA.logo_url}
                        clubName={tie.teamA.club_crest_name}
                        teamName={tie.teamA.name}
                        size="md"
                        className="shrink-0"
                      />
                    </div>

                    {/* Middle Score / Status Pill */}
                    <div className="shrink-0 flex flex-col items-center justify-center px-2">
                      {isCompleted ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100/90 text-emerald-900 border border-emerald-300 font-extrabold text-sm shadow-2xs">
                            <span>{tie.aggScoreA}</span>
                            <span className="text-emerald-500 font-semibold">:</span>
                            <span>{tie.aggScoreB}</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 mt-0.5 uppercase tracking-wide">
                            Aggregate Final
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Pending
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                            Double-Leg Tie
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <ClubCrest
                        logoUrl={tie.teamB.logo_url}
                        clubName={tie.teamB.club_crest_name}
                        teamName={tie.teamB.name}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {tie.teamB.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate font-medium">
                          {tie.teamB.club_crest_name || 'Club'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Expand Chevron Icon */}
                  <div className="flex items-center gap-2 shrink-0">
                    {draft.justSaved && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Check className="w-3 h-3" /> Synced
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={isExpanded ? 'Collapse tie' : 'Expand tie'}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-700" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded State (Revealed smoothly on click) */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-200/80 bg-white/95">
                    {/* Error Banner if any */}
                    {draft.error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
                        <span>{draft.error}</span>
                      </div>
                    )}

                    {/* Success Confirmation Toast */}
                    {draft.justSaved && (
                      <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Tie saved & synced with Supabase! Standings and stats updated live.</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium">Auto-Refreshed</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Row 1: Leg 1 (Home vs Away) */}
                      <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-black">
                            Leg 1
                          </span>
                          <span>(Home vs Away) · Round {tie.roundLeg1}</span>
                        </div>

                        {/* Leg 1 inputs */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                          {/* Home */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">
                              {leg1Home.name}
                            </span>
                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg1Home', -1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={draft.leg1Home}
                                onChange={(e) =>
                                  updateTieDraftField(tie.tieId, tie, 'leg1Home', e.target.value)
                                }
                                placeholder="-"
                                className="w-10 h-8 text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:bg-blue-50"
                              />
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg1Home', 1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <span className="text-xs font-black text-slate-400">:</span>

                          {/* Away */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg1Away', -1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={draft.leg1Away}
                                onChange={(e) =>
                                  updateTieDraftField(tie.tieId, tie, 'leg1Away', e.target.value)
                                }
                                placeholder="-"
                                className="w-10 h-8 text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:bg-blue-50"
                              />
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg1Away', 1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">
                              {leg1Away.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Leg 2 (Away vs Home / Reverse Venue) */}
                      <div className="bg-slate-50/90 rounded-xl border border-slate-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-black">
                            Leg 2
                          </span>
                          <span>(Away vs Home / Reverse) · Round {tie.roundLeg2}</span>
                        </div>

                        {/* Leg 2 inputs */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-1">
                          {/* Home in Leg 2 */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">
                              {leg2Home.name}
                            </span>
                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg2Home', -1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={draft.leg2Home}
                                onChange={(e) =>
                                  updateTieDraftField(tie.tieId, tie, 'leg2Home', e.target.value)
                                }
                                placeholder="-"
                                className="w-10 h-8 text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:bg-blue-50"
                              />
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg2Home', 1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <span className="text-xs font-black text-slate-400">:</span>

                          {/* Away in Leg 2 */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg2Away', -1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                value={draft.leg2Away}
                                onChange={(e) =>
                                  updateTieDraftField(tie.tieId, tie, 'leg2Away', e.target.value)
                                }
                                placeholder="-"
                                className="w-10 h-8 text-center font-extrabold text-sm text-slate-900 focus:outline-none focus:bg-blue-50"
                              />
                              <button
                                type="button"
                                onClick={() => stepTieValue(tie.tieId, tie, 'leg2Away', 1)}
                                className="w-7 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="text-xs font-bold text-slate-800 hidden sm:inline truncate max-w-[120px]">
                              {leg2Away.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Save Tie Action Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-500">
                        <span>Save will update both legs, compute aggregate score, and sync with Supabase.</span>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => toggleTie(tie.tieId)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          disabled={draft.isSaving}
                          onClick={() => handleSaveTie(tie)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-2xs disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{draft.isSaving ? 'Saving & Syncing...' : 'Save Tie'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
