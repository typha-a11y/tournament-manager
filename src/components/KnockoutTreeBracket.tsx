/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KnockoutTie, Match, Team } from '../types/tournament';
import { Award, CheckCircle2, ChevronRight, Edit3, Lock, Play, Shield, Sparkles, Trophy } from 'lucide-react';
import { ClubCrest } from './ClubCrest';

interface KnockoutTreeBracketProps {
  ro16Ties: KnockoutTie[];
  qfTies: KnockoutTie[];
  sfTies: KnockoutTie[];
  finalTies: KnockoutTie[];
  onOpenMatchScore: (match: Match) => void;
  onSeedRo16: () => void;
  onSimulateGroupStage?: () => void;
  championTeam: Team | null;
  groupPlayedCount: number;
  totalGroupMatches: number;
}

export const KnockoutTreeBracket: React.FC<KnockoutTreeBracketProps> = ({
  ro16Ties,
  qfTies,
  sfTies,
  finalTies,
  onOpenMatchScore,
  onSeedRo16,
  onSimulateGroupStage,
  championTeam,
  groupPlayedCount,
  totalGroupMatches,
}) => {
  const isGroupStageComplete = groupPlayedCount >= totalGroupMatches && totalGroupMatches > 0;

  // Render a single tie card in the visual bracket
  const renderTieNode = (tie: KnockoutTie | undefined, tieLabel: string, isFinal = false) => {
    // 1. Case: Neither team determined yet
    if (!tie || (!tie.homeTeam && !tie.awayTeam)) {
      return (
        <div className="bg-slate-50/80 border border-dashed border-slate-300 rounded-xl p-3 text-center text-xs text-slate-400 min-h-[110px] flex flex-col items-center justify-center">
          <Shield className="w-5 h-5 text-slate-300 mb-1" />
          <span className="font-semibold text-slate-600">{tieLabel}</span>
          <span className="text-[11px] text-slate-400">Awaiting preceding winners</span>
        </div>
      );
    }

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

    // 2. Case: Only ONE team is determined (waiting for upcoming opponent)
    if (!homeTeam || !awayTeam) {
      const waitingTeam = homeTeam || awayTeam;
      const isHomeReady = !!homeTeam;
      const placeholderText = isHomeReady
        ? awayPlaceholder || 'Awaiting Opponent'
        : homePlaceholder || 'Awaiting Opponent';

      return (
        <div className="bg-white rounded-xl border border-blue-200 shadow-2xs overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/70 border-b border-blue-100 text-[10px] font-semibold">
            <span className="text-blue-900">{tieLabel}</span>
            <span className="text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-bold">
              Waiting for Opponent
            </span>
          </div>

          <div className="p-2.5 space-y-2">
            {/* Slot 1: Qualified Team */}
            <div className="flex items-center justify-between p-1.5 rounded-lg border border-emerald-300 bg-emerald-50/60">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <ClubCrest
                  logoUrl={waitingTeam!.logo_url}
                  clubName={waitingTeam!.club_crest_name}
                  teamName={waitingTeam!.name}
                  size="sm"
                />
                <div className="min-w-0">
                  <span className="text-xs truncate font-bold text-slate-900 block">
                    {waitingTeam!.name}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-semibold block leading-none">
                    Proceeded (Ready)
                  </span>
                </div>
              </div>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            {/* Slot 2: Awaiting opponent */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
              <Shield className="w-4 h-4 text-slate-300 shrink-0" />
              <span className="text-[11px] font-medium truncate italic">
                {placeholderText}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 3. Case: BOTH teams are determined and ready to play!
    const homeIsWinner = winnerTeamId === homeTeam.id;
    const awayIsWinner = winnerTeamId === awayTeam.id;
    const activeMatch = leg1 || leg2;

    return (
      <div
        className={`bg-white rounded-xl border transition-all shadow-xs hover:shadow-md overflow-hidden ${
          isFinal
            ? 'border-amber-400 ring-2 ring-amber-100'
            : isCompleted
            ? 'border-slate-300'
            : 'border-blue-300 ring-1 ring-blue-100'
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-semibold">
          <span className="font-bold text-slate-700">{tieLabel}</span>
          <div className="flex items-center gap-1.5">
            {leg2 ? <span>2 Legs (Agg)</span> : <span>Single Match</span>}
            {isCompleted ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                Completed
              </span>
            ) : (
              <span className="text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 animate-pulse">
                Ready to Play
              </span>
            )}
          </div>
        </div>

        {/* Teams List */}
        <div className="p-2.5 space-y-2">
          {/* Home Team */}
          <div
            className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors ${
              homeIsWinner
                ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950'
                : awayIsWinner
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <ClubCrest
                logoUrl={homeTeam.logo_url}
                clubName={homeTeam.club_crest_name}
                teamName={homeTeam.name}
                size="sm"
              />
              <span className="text-xs truncate font-bold">{homeTeam.name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {homeIsWinner && <Award className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="text-sm font-black font-mono w-5 text-center">
                {aggregateHomeScore}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div
            className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors ${
              awayIsWinner
                ? 'bg-emerald-50/80 border-emerald-300 font-bold text-emerald-950'
                : homeIsWinner
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <ClubCrest
                logoUrl={awayTeam.logo_url}
                clubName={awayTeam.club_crest_name}
                teamName={awayTeam.name}
                size="sm"
              />
              <span className="text-xs truncate font-bold">{awayTeam.name}</span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {awayIsWinner && <Award className="w-3.5 h-3.5 text-emerald-600" />}
              <span className="text-sm font-black font-mono w-5 text-center">
                {aggregateAwayScore}
              </span>
            </div>
          </div>

          {/* Legs breakdown & Quick Actions */}
          <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              {leg1 && (
                <button
                  onClick={() => onOpenMatchScore(leg1)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    leg1.is_played
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold'
                  }`}
                  title="Click to enter or edit Leg 1 score"
                >
                  L1: {leg1.is_played ? `${leg1.home_score}-${leg1.away_score}` : 'Score'}
                </button>
              )}
              {leg2 && (
                <button
                  onClick={() => onOpenMatchScore(leg2)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                    leg2.is_played
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold'
                  }`}
                  title="Click to enter or edit Leg 2 score"
                >
                  L2: {leg2.is_played ? `${leg2.home_score}-${leg2.away_score}` : 'Score'}
                </button>
              )}
              {leg2?.home_penalties !== null && leg2?.home_penalties !== undefined && (
                <span className="text-blue-600 font-bold">
                  (P: {leg2.home_penalties}-{leg2.away_penalties})
                </span>
              )}
            </div>

            {/* Score Edit Button */}
            {activeMatch && (
              <button
                onClick={() => onOpenMatchScore(activeMatch)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-2xs transition-colors"
                title="Enter match score"
              >
                <Edit3 className="w-3 h-3" />
                <span>Score</span>
              </button>
            )}
          </div>

          {needsPenalties && (
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 p-1 rounded text-center border border-amber-200">
              Level on Agg! Penalties required on Leg 2
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Visual Bracket Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs overflow-x-auto">
        <div className="min-w-[1100px]">
          {/* Round Header Labels */}
          <div className="grid grid-cols-4 gap-6 mb-6 text-center">
            <div className="bg-slate-100 py-2.5 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                16 Bora
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Round of 16 (8 Ties · Agg)
              </span>
            </div>

            <div className="bg-slate-100 py-2.5 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Robo Fainali
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Quarter Finals (4 Ties · Agg)
              </span>
            </div>

            <div className="bg-slate-100 py-2.5 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                Nusu Fainali
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Semi Finals (2 Ties · Agg)
              </span>
            </div>

            <div className="bg-amber-100/80 py-2.5 px-3 rounded-lg border border-amber-300">
              <span className="text-xs font-black text-amber-950 uppercase tracking-wider block flex items-center justify-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                Fainali
              </span>
              <span className="text-[11px] text-amber-800 font-medium">Grand Final & Trophy</span>
            </div>
          </div>

          {/* 4-Column Bracket Tree Grid */}
          <div className="grid grid-cols-4 gap-6 items-center">
            {/* Column 1: Round of 16 (8 ties) */}
            <div className="space-y-4">
              {ro16Ties.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                    {isGroupStageComplete ? (
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">
                    {isGroupStageComplete
                      ? 'Group Stage Completed!'
                      : 'Group Stage in Progress'}
                  </h4>
                  <p className="text-[11px] text-slate-500 mb-3">
                    {groupPlayedCount}/{totalGroupMatches} matches played.
                    {isGroupStageComplete
                      ? ' All 16 qualifying teams determined!'
                      : ' Complete all 72 group matches to seed 16 Bora.'}
                  </p>

                  <div className="space-y-2">
                    <button
                      onClick={onSeedRo16}
                      disabled={!isGroupStageComplete}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                        isGroupStageComplete
                          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isGroupStageComplete ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Seed 16 Bora Now</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Seed 16 Bora (Locked)</span>
                        </>
                      )}
                    </button>

                    {!isGroupStageComplete && onSimulateGroupStage && (
                      <button
                        onClick={onSimulateGroupStage}
                        className="w-full px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3 text-slate-600" />
                        <span>Simulate Remaining ({totalGroupMatches - groupPlayedCount}) Matches</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                ro16Ties.map((tie, idx) => (
                  <div key={tie.tieId || idx} className="relative">
                    {renderTieNode(tie, `16 Bora #${idx + 1}`)}
                  </div>
                ))
              )}
            </div>

            {/* Column 2: Quarter Finals (4 ties, spaced evenly) */}
            <div className="flex flex-col justify-around h-full space-y-12">
              {[0, 1, 2, 3].map((idx) => {
                const tie = qfTies[idx];
                return (
                  <div key={idx} className="relative">
                    {renderTieNode(tie, `Robo Fainali #${idx + 1}`)}
                  </div>
                );
              })}
            </div>

            {/* Column 3: Semi Finals (2 ties, spaced evenly) */}
            <div className="flex flex-col justify-around h-full space-y-36">
              {[0, 1].map((idx) => {
                const tie = sfTies[idx];
                return (
                  <div key={idx} className="relative">
                    {renderTieNode(tie, `Nusu Fainali #${idx + 1}`)}
                  </div>
                );
              })}
            </div>

            {/* Column 4: Final & Champion Showcase */}
            <div className="flex flex-col justify-center h-full space-y-6">
              {renderTieNode(finalTies[0], 'Fainali (Grand Final)', true)}

              {/* Champion Podium Display */}
              {championTeam ? (
                <div className="bg-gradient-to-b from-amber-100 via-amber-50 to-white border-2 border-amber-400 rounded-2xl p-4 text-center shadow-md animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto mb-2 shadow-sm">
                    <Trophy className="w-6 h-6 fill-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-800 block">
                    eFootball Champion
                  </span>
                  <h4 className="text-base font-black text-slate-900 mt-0.5">
                    {championTeam.name}
                  </h4>
                  <div className="text-xs text-slate-600 font-medium">
                    {championTeam.club_crest_name}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
                  <Trophy className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                  <span className="font-semibold text-slate-500">Championship Trophy</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Complete all knockout rounds to crown the champion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
