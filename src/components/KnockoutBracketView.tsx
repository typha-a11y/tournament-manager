/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KnockoutTie, Match, MatchStage, Team } from '../types/tournament';
import {
  computeFullBracketTree,
  computeKnockoutTies,
  generateNextKnockoutStage,
  generateRoundOf16Matches,
  simulateRemainingGroupMatches,
} from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { KnockoutTreeBracket } from './KnockoutTreeBracket';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  ChevronRight,
  Edit3,
  GitMerge,
  HelpCircle,
  Info,
  LayoutGrid,
  Lock,
  Network,
  Play,
  RefreshCw,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface KnockoutBracketViewProps {
  teams: Team[];
  matches: Match[];
  onOpenMatchScore: (match: Match) => void;
  onUpdateMatches: (matches: Match[]) => void;
  finalIsTwoLegs: boolean;
  onToggleFinalLegs: (val: boolean) => void;
}

export const KnockoutBracketView: React.FC<KnockoutBracketViewProps> = ({
  teams,
  matches,
  onOpenMatchScore,
  onUpdateMatches,
  finalIsTwoLegs,
  onToggleFinalLegs,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'stage_cards'>('tree');
  const [activeStage, setActiveStage] = useState<MatchStage>('Ro16');
  const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

  // Group stage metrics
  const groupMatches = matches.filter((m) => m.match_type === 'Group');
  const totalGroupMatches = groupMatches.length || 72;
  const groupPlayedCount = groupMatches.filter((m) => m.is_played && m.home_score !== null).length;
  const isGroupStageComplete = totalGroupMatches > 0 && groupPlayedCount >= totalGroupMatches;

  // Full Bracket Tree Data with Waiting / Partial progression support
  const bracketTree = computeFullBracketTree(matches, teams, finalIsTwoLegs);
  const { ro16Ties, qfTies, sfTies, finalTies, championTeam } = bracketTree;

  const stageTitles: Record<MatchStage, { swahili: string; english: string; count: number }> = {
    Group: { swahili: 'Hatua ya Makundi', english: 'Group Stage', count: 24 },
    Ro16: { swahili: '16 Bora', english: 'Round of 16', count: 8 },
    QF: { swahili: 'Robo Fainali', english: 'Quarter Finals', count: 4 },
    SF: { swahili: 'Nusu Fainali', english: 'Semi Finals', count: 2 },
    Final: { swahili: 'Fainali', english: 'Grand Final', count: 1 },
  };

  const getTiesForStage = (stage: MatchStage) => {
    switch (stage) {
      case 'Ro16':
        return ro16Ties;
      case 'QF':
        return qfTies;
      case 'SF':
        return sfTies;
      case 'Final':
        return finalTies;
      default:
        return [];
    }
  };

  const currentTies = getTiesForStage(activeStage);

  // Intelligent Seeding for 16 Bora
  const handleSeedRo16Click = () => {
    if (!isGroupStageComplete) {
      setShowIncompleteDialog(true);
      return;
    }
    executeSeedRo16(matches);
  };

  const executeSeedRo16 = (currentMatchesList: Match[]) => {
    const newRo16 = generateRoundOf16Matches(teams, currentMatchesList, { regenerate: true });
    const gMatches = currentMatchesList.filter((m) => m.match_type === 'Group');
    onUpdateMatches([...gMatches, ...newRo16]);
    setShowIncompleteDialog(false);
  };

  // Simulate remaining group matches and immediately seed 16 Bora
  const handleSimulateGroupMatchesAndSeed = () => {
    const simulatedMatches = simulateRemainingGroupMatches(teams, matches);
    executeSeedRo16(simulatedMatches);
  };

  // Advance stage
  const handleAdvanceStage = (stage: 'Ro16' | 'QF' | 'SF') => {
    const nextMatches = generateNextKnockoutStage(stage, matches, teams, finalIsTwoLegs);
    if (nextMatches.length === 0) return;

    const nextStageName = stage === 'Ro16' ? 'QF' : stage === 'QF' ? 'SF' : 'Final';
    onUpdateMatches(nextMatches);
    setActiveStage(nextStageName);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Phase 2</span>
              <span aria-hidden="true">·</span>
              <span>Home & Away Aggregate</span>
              <span aria-hidden="true">·</span>
              <span>16 Bora to Fainali</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <GitMerge className="w-6 h-6 text-blue-600" />
              Knockout Stage (Hatua ya Mtoano)
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Two-legged ties with aggregate scoring. The winner on aggregate progresses to the next round.
            </p>
          </div>

          {/* Actions & Settings */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'tree'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5 text-blue-600" />
                <span>Tournament Bracket Tree</span>
              </button>
              <button
                onClick={() => setViewMode('stage_cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  viewMode === 'stage_cards'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <span>Stage Cards & Ties</span>
              </button>
            </div>

            {/* Final Format Toggle */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
              <span>Final:</span>
              <button
                onClick={() => onToggleFinalLegs(false)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  !finalIsTwoLegs ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                1 Match
              </button>
              <button
                onClick={() => onToggleFinalLegs(true)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  finalIsTwoLegs ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                2 Legs
              </button>
            </div>

            {/* Seed 16 Bora Button */}
            <button
              onClick={handleSeedRo16Click}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${
                isGroupStageComplete
                  ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                  : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
              }`}
              title={
                isGroupStageComplete
                  ? 'Intelligently seed 16 Bora avoiding same-group encounters'
                  : `Group stage in progress (${groupPlayedCount}/${totalGroupMatches} played). Click for details.`
              }
            >
              {isGroupStageComplete ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Seed 16 Bora</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Seed 16 Bora ({groupPlayedCount}/{totalGroupMatches})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Group Stage Status Notice if incomplete */}
        {!isGroupStageComplete && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50/80 border border-blue-200 flex items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Hatua ya Makundi inaendelea:</strong> {groupPlayedCount} kati ya {totalGroupMatches} mechi zimechezwa ({Math.round((groupPlayedCount / totalGroupMatches) * 100)}%).
                Mechi zote za makundi lazima zikamilike ili kuamua washindi 16 watakaocheza 16 Bora bila kukutana na timu ya kundi lao.
              </span>
            </div>
            <button
              onClick={handleSimulateGroupMatchesAndSeed}
              className="shrink-0 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold shadow-2xs flex items-center gap-1 transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Simulate & Seed</span>
            </button>
          </div>
        )}

        {/* Champion Showcase Banner (if crowned) */}
        {championTeam && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-black shadow-md">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase tracking-widest">
                  Tournament Champion!
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {championTeam.name}
                </h3>
                <span className="text-xs text-slate-600">{championTeam.club_crest_name}</span>
              </div>
            </div>
            <ClubCrest
              logoUrl={championTeam.logo_url}
              clubName={championTeam.club_crest_name}
              teamName={championTeam.name}
              size="xl"
            />
          </div>
        )}

        {/* Stage Navigation Tabs (Active only in Stage Cards mode) */}
        {viewMode === 'stage_cards' && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto pb-1 sm:pb-0">
            {(['Ro16', 'QF', 'SF', 'Final'] as MatchStage[]).map((stage) => {
              const info = stageTitles[stage];
              const ties = getTiesForStage(stage);
              const completedCount = ties.filter((t) => t.isCompleted).length;

              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`flex-1 min-w-[130px] p-3 rounded-lg border text-left transition-all ${
                    activeStage === stage
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">{info.swahili}</span>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500">
                      {completedCount}/{ties.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{info.english}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Viewport: Full Visual Tree Bracket OR Stage Cards */}
      {viewMode === 'tree' ? (
        <KnockoutTreeBracket
          ro16Ties={ro16Ties}
          qfTies={qfTies}
          sfTies={sfTies}
          finalTies={finalTies}
          onOpenMatchScore={onOpenMatchScore}
          onSeedRo16={handleSeedRo16Click}
          onSimulateGroupStage={handleSimulateGroupMatchesAndSeed}
          championTeam={championTeam || null}
          groupPlayedCount={groupPlayedCount}
          totalGroupMatches={totalGroupMatches}
        />
      ) : (
        <>
          {/* Stage Action Prompt (Advance to next stage button if all ties finished) */}
          {activeStage === 'Ro16' && ro16Ties.length > 0 && ro16Ties.every((t) => t.isCompleted) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  All 8 Ties in 16 Bora Completed!
                </h3>
                <p className="text-xs text-emerald-800">
                  Generate the Quarter Finals (Robo Fainali) bracket with the 8 winners.
                </p>
              </div>
              <button
                onClick={() => handleAdvanceStage('Ro16')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <span>Proceed to Robo Fainali</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeStage === 'QF' && qfTies.length > 0 && qfTies.every((t) => t.isCompleted) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  Robo Fainali Completed!
                </h3>
                <p className="text-xs text-emerald-800">
                  Generate the Semi Finals (Nusu Fainali) bracket with the 4 semi-finalists.
                </p>
              </div>
              <button
                onClick={() => handleAdvanceStage('QF')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <span>Proceed to Nusu Fainali</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeStage === 'SF' && sfTies.length > 0 && sfTies.every((t) => t.isCompleted) && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  Nusu Fainali Completed!
                </h3>
                <p className="text-xs text-emerald-800">
                  Generate the Grand Final (Fainali) matchup with the 2 finalists.
                </p>
              </div>
              <button
                onClick={() => handleAdvanceStage('SF')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <span>Proceed to Fainali</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Ties List */}
          {currentTies.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <GitMerge className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">
                No Matchups Seeded in {stageTitles[activeStage].swahili} Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                {activeStage === 'Ro16'
                  ? 'Click "Seed 16 Bora" above to automatically pair Group Winners with qualified runners-up and 3rd placed teams.'
                  : 'Complete all ties from the preceding round to advance into this stage.'}
              </p>
              {activeStage === 'Ro16' && (
                <button
                  onClick={handleSeedRo16Click}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Seed 16 Bora Now</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {currentTies.map((tie) => {
                const {
                  homeTeam,
                  awayTeam,
                  leg1,
                  leg2,
                  aggregateHomeScore,
                  aggregateAwayScore,
                  winnerTeamId,
                  isCompleted,
                  needsPenalties,
                  homePlaceholder,
                  awayPlaceholder,
                } = tie;

                // Case: Waiting for opponent
                if (!homeTeam || !awayTeam) {
                  const waitingTeam = homeTeam || awayTeam;
                  const placeholder = homeTeam ? awayPlaceholder : homePlaceholder;

                  return (
                    <div
                      key={tie.tieId}
                      className="bg-white rounded-xl border border-dashed border-slate-300 p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                        <span className="font-bold font-mono">Tie #{tie.matchNumber}</span>
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                          Waiting for Opponent
                        </span>
                      </div>

                      {waitingTeam ? (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ClubCrest
                              logoUrl={waitingTeam.logo_url}
                              clubName={waitingTeam.club_crest_name}
                              teamName={waitingTeam.name}
                              size="md"
                            />
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">
                                {waitingTeam.name}
                              </span>
                              <span className="text-xs text-emerald-700 font-semibold">
                                Qualified & Waiting
                              </span>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      ) : null}

                      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs italic text-center">
                        {placeholder || 'Awaiting preceding winner'}
                      </div>
                    </div>
                  );
                }

                const homeIsWinner = winnerTeamId === homeTeam.id;
                const awayIsWinner = winnerTeamId === awayTeam.id;

                return (
                  <div
                    key={tie.tieId}
                    className={`bg-white rounded-xl border transition-shadow overflow-hidden ${
                      isCompleted
                        ? 'border-slate-300 shadow-xs'
                        : 'border-blue-300 ring-1 ring-blue-50'
                    }`}
                  >
                    {/* Tie Card Header */}
                    <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 font-mono">
                          Tie #{tie.matchNumber}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500 font-medium">
                          {leg2 ? '2 Legs (Home & Away)' : 'Single Match'}
                        </span>
                      </div>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                          Completed
                        </span>
                      ) : (
                        <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200 animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Team Rows */}
                    <div className="p-4 space-y-3">
                      {/* Home Team */}
                      <div
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          homeIsWinner
                            ? 'bg-emerald-50/80 border-emerald-300'
                            : awayIsWinner
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ClubCrest
                            logoUrl={homeTeam.logo_url}
                            clubName={homeTeam.club_crest_name}
                            teamName={homeTeam.name}
                            size="md"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-sm block leading-tight">
                              {homeTeam.name}
                            </span>
                            <span className="text-xs text-slate-500 leading-none">
                              {homeTeam.club_crest_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          {homeIsWinner && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <Award className="w-4 h-4" /> Winner
                            </span>
                          )}
                          <span className="text-lg font-black font-mono tabular-nums text-slate-900 w-8 text-center">
                            {aggregateHomeScore}
                          </span>
                        </div>
                      </div>

                      {/* Away Team */}
                      <div
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                          awayIsWinner
                            ? 'bg-emerald-50/80 border-emerald-300'
                            : homeIsWinner
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ClubCrest
                            logoUrl={awayTeam.logo_url}
                            clubName={awayTeam.club_crest_name}
                            teamName={awayTeam.name}
                            size="md"
                          />
                          <div>
                            <span className="font-bold text-slate-900 text-sm block leading-tight">
                              {awayTeam.name}
                            </span>
                            <span className="text-xs text-slate-500 leading-none">
                              {awayTeam.club_crest_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          {awayIsWinner && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <Award className="w-4 h-4" /> Winner
                            </span>
                          )}
                          <span className="text-lg font-black font-mono tabular-nums text-slate-900 w-8 text-center">
                            {aggregateAwayScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Aggregate Summary & Legs Controls */}
                    <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                          Aggregate:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                          {aggregateHomeScore} - {aggregateAwayScore}
                          {leg2?.home_penalties !== null && leg2?.home_penalties !== undefined && (
                            <span className="text-xs text-blue-600 ml-1.5 font-normal">
                              (P: {leg2.home_penalties} - {leg2.away_penalties})
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Leg 1 and Leg 2 details */}
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {leg1 && (
                          <div
                            onClick={() => onOpenMatchScore(leg1)}
                            className="p-2 rounded bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-700 block text-[11px]">
                                Leg 1
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">
                                {leg1.is_played
                                  ? `${leg1.home_score} - ${leg1.away_score}`
                                  : 'Click to Score'}
                              </span>
                            </div>
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        )}

                        {leg2 && (
                          <div
                            onClick={() => onOpenMatchScore(leg2)}
                            className="p-2 rounded bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition-all flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-700 block text-[11px]">
                                Leg 2
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono font-bold">
                                {leg2.is_played
                                  ? `${leg2.home_score} - ${leg2.away_score}`
                                  : 'Click to Score'}
                              </span>
                            </div>
                            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Alert if penalties required */}
                      {needsPenalties && (
                        <div className="mt-1 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                          <span>Tie is level on aggregate! Penalty shootout needed.</span>
                          <button
                            onClick={() => onOpenMatchScore(leg2 || leg1!)}
                            className="font-bold underline ml-2 cursor-pointer"
                          >
                            Enter Penalties
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Incomplete Group Stage Modal Dialog */}
      {showIncompleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Group Stage Incomplete
                </h3>
              </div>
              <button
                onClick={() => setShowIncompleteDialog(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                <strong>{groupPlayedCount}</strong> of <strong>{totalGroupMatches}</strong> group matches have been played so far.
              </p>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-semibold text-slate-900">Why are all matches required?</div>
                <p className="text-[11px] text-slate-500">
                  The intelligent seeding algorithm strictly pairs the 6 Group Winners against qualified 2nd and 3rd placed teams while guaranteeing that <strong>no two teams from the same group encounter each other in the Round of 16</strong>.
                </p>
              </div>
              <p className="text-xs text-slate-600">
                You can play all remaining matches in <strong>Fixtures & Results</strong>, or click below to simulate the remaining results instantly.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={handleSimulateGroupMatchesAndSeed}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Simulate & Seed 16 Bora</span>
              </button>
              <button
                onClick={() => setShowIncompleteDialog(false)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
