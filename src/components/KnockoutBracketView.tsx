import React, { useState } from 'react';
import { KnockoutTie, Match, MatchStage, Team } from '../types/tournament';
import { computeKnockoutTies, generateNextKnockoutStage, generateRoundOf16Matches } from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { KnockoutTreeBracket } from './KnockoutTreeBracket';
import { Award, ChevronRight, Edit3, GitMerge, LayoutGrid, Network, RefreshCw, Trophy } from 'lucide-react';

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

  const ro16Ties = computeKnockoutTies('Ro16', matches, teams);
  const qfTies = computeKnockoutTies('QF', matches, teams);
  const sfTies = computeKnockoutTies('SF', matches, teams);
  const finalTies = computeKnockoutTies('Final', matches, teams);

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

  // Handler to generate or refresh 16 Bora from group standings
  const handleGenerateRo16 = () => {
    const newRo16 = generateRoundOf16Matches(teams, matches, { regenerate: true });
    // Remove old knockout matches and set new Ro16
    const groupMatches = matches.filter((m) => m.match_type === 'Group');
    onUpdateMatches([...groupMatches, ...newRo16]);
  };

  // Advance winners to the next stage
  const handleAdvanceStage = (stage: 'Ro16' | 'QF' | 'SF') => {
    const nextMatches = generateNextKnockoutStage(stage, matches, teams, finalIsTwoLegs);
    if (nextMatches.length === 0) return;

    const nextStageName = stage === 'Ro16' ? 'QF' : stage === 'QF' ? 'SF' : 'Final';
    // Remove existing matches of next stage and append newly generated
    const otherMatches = matches.filter((m) => m.match_type !== nextStageName);
    onUpdateMatches([...otherMatches, ...nextMatches]);
    setActiveStage(nextStageName);
  };

  // Check tournament champion
  const championTie = finalTies[0];
  const championTeam = championTie?.winnerTeamId
    ? teams.find((t) => t.id === championTie.winnerTeamId)
    : null;

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

            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
              <span>Final:</span>
              <button
                onClick={() => onToggleFinalLegs(false)}
                className={`px-2 py-0.5 rounded ${
                  !finalIsTwoLegs ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                1 Match
              </button>
              <button
                onClick={() => onToggleFinalLegs(true)}
                className={`px-2 py-0.5 rounded ${
                  finalIsTwoLegs ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500'
                }`}
              >
                2 Legs
              </button>
            </div>

            <button
              onClick={handleGenerateRo16}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Seed 16 Bora</span>
            </button>
          </div>
        </div>

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
              name={championTeam.club_crest_name || championTeam.name}
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
          onSeedRo16={handleGenerateRo16}
          championTeam={championTeam || null}
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
              onClick={handleGenerateRo16}
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
            const { homeTeam, awayTeam, leg1, leg2, aggregateHomeScore, aggregateAwayScore, winnerTeamId, isCompleted, needsPenalties } = tie;
            if (!homeTeam || !awayTeam) return null;

            const homeIsWinner = winnerTeamId === homeTeam.id;
            const awayIsWinner = winnerTeamId === awayTeam.id;

            return (
              <div
                key={tie.tieId}
                className={`bg-white rounded-xl border transition-shadow overflow-hidden ${
                  isCompleted
                    ? 'border-slate-300 shadow-xs'
                    : 'border-blue-200 ring-1 ring-blue-50'
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
                      {leg2 ? '2 Legs' : 'Single Match'}
                    </span>
                  </div>
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded text-[11px]">
                      Completed
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px] font-medium">In Progress</span>
                  )}
                </div>

                {/* Team Rows */}
                <div className="p-4 space-y-3">
                  {/* Home / Higher Seed Team */}
                  <div
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                      homeIsWinner
                        ? 'bg-emerald-50/70 border-emerald-300'
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
                        ? 'bg-emerald-50/70 border-emerald-300'
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
                      <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Leg 1
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {leg1.is_played
                              ? `${leg1.home_score} - ${leg1.away_score}`
                              : 'Pending'}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenMatchScore(leg1)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Score Leg 1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {leg2 && (
                      <div className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-700 block text-[11px]">
                            Leg 2
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {leg2.is_played
                              ? `${leg2.home_score} - ${leg2.away_score}`
                              : 'Pending'}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenMatchScore(leg2)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Score Leg 2"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Alert if penalties required */}
                  {needsPenalties && (
                    <div className="mt-1 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center justify-between">
                      <span>Tie is level on aggregate! Penalty shootout needed.</span>
                      <button
                        onClick={() => onOpenMatchScore(leg2 || leg1!)}
                        className="font-bold underline ml-2"
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
    </div>
  );
};
