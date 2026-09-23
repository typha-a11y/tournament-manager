import React from 'react';
import { KnockoutTie, Match, Team } from '../types/tournament';
import { Award, CheckCircle, ChevronRight, Edit3, Shield, Trophy } from 'lucide-react';
import { ClubCrest } from './ClubCrest';

interface KnockoutTreeBracketProps {
  ro16Ties: KnockoutTie[];
  qfTies: KnockoutTie[];
  sfTies: KnockoutTie[];
  finalTies: KnockoutTie[];
  onOpenMatchScore: (match: Match) => void;
  onSeedRo16: () => void;
  championTeam: Team | null;
}

export const KnockoutTreeBracket: React.FC<KnockoutTreeBracketProps> = ({
  ro16Ties,
  qfTies,
  sfTies,
  finalTies,
  onOpenMatchScore,
  onSeedRo16,
  championTeam,
}) => {
  // Render a single tie card in the visual bracket
  const renderTieNode = (tie: KnockoutTie | undefined, tieLabel: string, isFinal = false) => {
    if (!tie || !tie.homeTeam || !tie.awayTeam) {
      return (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-3 text-center text-xs text-slate-400 min-h-[110px] flex flex-col items-center justify-center">
          <Shield className="w-5 h-5 text-slate-300 mb-1" />
          <span className="font-semibold text-slate-500">{tieLabel}</span>
          <span className="text-[11px]">Awaiting preceding winners</span>
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
    } = tie;

    const homeIsWinner = winnerTeamId === homeTeam.id;
    const awayIsWinner = winnerTeamId === awayTeam.id;

    return (
      <div
        className={`bg-white rounded-xl border transition-all shadow-xs hover:shadow-md overflow-hidden ${
          isFinal
            ? 'border-amber-300 ring-2 ring-amber-100'
            : isCompleted
            ? 'border-slate-300'
            : 'border-blue-200'
        }`}
      >
        {/* Match Header */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 font-semibold">
          <span>{tieLabel}</span>
          <div className="flex items-center gap-1.5">
            {leg2 ? <span>2 Legs (Agg)</span> : <span>Single Match</span>}
            {isCompleted ? (
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                Final
              </span>
            ) : (
              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded">
                In Play
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
                ? 'bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950'
                : awayIsWinner
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <ClubCrest
                logoUrl={homeTeam.logo_url}
                name={homeTeam.club_crest_name || homeTeam.name}
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
                ? 'bg-emerald-50/70 border-emerald-300 font-bold text-emerald-950'
                : homeIsWinner
                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <ClubCrest
                logoUrl={awayTeam.logo_url}
                name={awayTeam.club_crest_name || awayTeam.name}
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
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {leg1 && (
                <span title="Leg 1 Score">
                  L1:{' '}
                  <b className="text-slate-800">
                    {leg1.is_played ? `${leg1.home_score}-${leg1.away_score}` : '-'}
                  </b>
                </span>
              )}
              {leg2 && (
                <span title="Leg 2 Score">
                  L2:{' '}
                  <b className="text-slate-800">
                    {leg2.is_played ? `${leg2.home_score}-${leg2.away_score}` : '-'}
                  </b>
                </span>
              )}
              {leg2?.home_penalties !== null && leg2?.home_penalties !== undefined && (
                <span className="text-blue-600 font-bold">
                  (P: {leg2.home_penalties}-{leg2.away_penalties})
                </span>
              )}
            </div>

            {/* Score Edit Button */}
            <button
              onClick={() => onOpenMatchScore(leg1 || leg2!)}
              className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-800 font-bold p-0.5 rounded hover:bg-blue-50"
              title="Input or edit match scores"
            >
              <Edit3 className="w-3 h-3" />
              <span>Score</span>
            </button>
          </div>

          {needsPenalties && (
            <div className="text-[10px] font-bold text-amber-700 bg-amber-50 p-1 rounded text-center border border-amber-200">
              Level on Agg! Penalties required
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
        <div className="min-w-[1080px]">
          {/* Round Header Labels */}
          <div className="grid grid-cols-4 gap-6 mb-6 text-center">
            <div className="bg-slate-100 py-2 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                16 Bora
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Round of 16 (8 Ties)
              </span>
            </div>

            <div className="bg-slate-100 py-2 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Robo Fainali
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Quarter Finals (4 Ties)
              </span>
            </div>

            <div className="bg-slate-100 py-2 px-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Nusu Fainali
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Semi Finals (2 Ties)
              </span>
            </div>

            <div className="bg-amber-100/70 py-2 px-3 rounded-lg border border-amber-300">
              <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block flex items-center justify-center gap-1.5">
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
                <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-6 text-center">
                  <p className="text-xs text-slate-600 mb-3">
                    Round of 16 pairings not generated yet.
                  </p>
                  <button
                    onClick={onSeedRo16}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                  >
                    Seed 16 Bora
                  </button>
                </div>
              ) : (
                ro16Ties.map((tie, idx) => (
                  <div key={tie.tieId || idx} className="relative">
                    {renderTieNode(tie, `Ro16 Match #${idx + 1}`)}
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
                <div className="bg-gradient-to-b from-amber-100 to-amber-50 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-md animate-in fade-in">
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
