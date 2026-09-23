import React, { useEffect, useState } from 'react';
import { Match, Team } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import { Minus, Plus, Trophy, X } from 'lucide-react';

interface MatchScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  teams: Team[];
  allMatches: Match[];
  onSaveScore: (updatedMatch: Match) => void;
}

export const MatchScoreModal: React.FC<MatchScoreModalProps> = ({
  isOpen,
  onClose,
  match,
  teams,
  allMatches,
  onSaveScore,
}) => {
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [isPlayed, setIsPlayed] = useState<boolean>(true);
  const [homePenalties, setHomePenalties] = useState<number>(0);
  const [awayPenalties, setAwayPenalties] = useState<number>(0);
  const [hasPenalties, setHasPenalties] = useState<boolean>(false);

  useEffect(() => {
    if (match) {
      setHomeScore(match.home_score ?? 0);
      setAwayScore(match.away_score ?? 0);
      setIsPlayed(match.is_played);
      setHomePenalties(match.home_penalties ?? 0);
      setAwayPenalties(match.away_penalties ?? 0);
      setHasPenalties(match.home_penalties !== null && match.home_penalties !== undefined);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);

  if (!homeTeam || !awayTeam) return null;

  // Check aggregate score if this is a knockout leg 2
  let leg1Match: Match | undefined;
  if (match.match_type !== 'Group' && match.leg === 2 && match.tie_id) {
    leg1Match = allMatches.find(
      (m) => m.tie_id === match.tie_id && m.leg === 1
    );
  }

  // Aggregate calculation
  const leg1HomeGoals = leg1Match?.is_played ? leg1Match.away_score || 0 : 0; // In leg 1, current home team was away
  const leg1AwayGoals = leg1Match?.is_played ? leg1Match.home_score || 0 : 0;

  const totalAggHome = isPlayed ? leg1HomeGoals + homeScore : leg1HomeGoals;
  const totalAggAway = isPlayed ? leg1AwayGoals + awayScore : leg1AwayGoals;

  const isTiedOnAggregate =
    match.match_type !== 'Group' &&
    match.leg === 2 &&
    isPlayed &&
    totalAggHome === totalAggAway;

  const handleSave = () => {
    const updated: Match = {
      ...match,
      home_score: isPlayed ? homeScore : null,
      away_score: isPlayed ? awayScore : null,
      is_played: isPlayed,
      home_penalties: isTiedOnAggregate && hasPenalties ? homePenalties : null,
      away_penalties: isTiedOnAggregate && hasPenalties ? awayPenalties : null,
    };
    onSaveScore(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
              {match.match_type === 'Group'
                ? `Group ${match.group_id} · Leg ${match.leg}`
                : `${match.match_type} · Leg ${match.leg || 1}`}
            </span>
            <h3 className="text-base font-bold text-slate-900">Record Match Score</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Match Status</span>
              <span className="text-[11px] text-slate-500">
                {isPlayed ? 'Result recorded and included in standings' : 'Unplayed / Scheduled'}
              </span>
            </div>
            <button
              onClick={() => setIsPlayed(!isPlayed)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                isPlayed
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isPlayed ? 'Played' : 'Unplayed'}
            </button>
          </div>

          {/* Teams and Score Steppers */}
          {isPlayed && (
            <div className="flex items-center justify-between gap-4">
              {/* Home Team */}
              <div className="flex-1 flex flex-col items-center text-center">
                <ClubCrest
                  logoUrl={homeTeam.logo_url}
                  clubName={homeTeam.club_crest_name}
                  teamName={homeTeam.name}
                  size="xl"
                />
                <span className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                  {homeTeam.name}
                </span>
                <span className="text-[11px] text-slate-500 mb-3">Home</span>

                {/* Score Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-2xl font-black font-mono tabular-nums text-slate-900 text-center">
                    {homeScore}
                  </span>
                  <button
                    onClick={() => setHomeScore(homeScore + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xl font-bold text-slate-300 font-mono">VS</div>

              {/* Away Team */}
              <div className="flex-1 flex flex-col items-center text-center">
                <ClubCrest
                  logoUrl={awayTeam.logo_url}
                  clubName={awayTeam.club_crest_name}
                  teamName={awayTeam.name}
                  size="xl"
                />
                <span className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                  {awayTeam.name}
                </span>
                <span className="text-[11px] text-slate-500 mb-3">Away</span>

                {/* Score Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-2xl font-black font-mono tabular-nums text-slate-900 text-center">
                    {awayScore}
                  </span>
                  <button
                    onClick={() => setAwayScore(awayScore + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Aggregate Notice for Leg 2 Knockout */}
          {match.match_type !== 'Group' && match.leg === 2 && isPlayed && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
              <div className="flex items-center justify-between font-bold text-blue-900">
                <span>Aggregate Score:</span>
                <span className="font-mono text-sm">
                  {homeTeam.name} {totalAggHome} - {totalAggAway} {awayTeam.name}
                </span>
              </div>
              <p className="text-[11px] text-blue-700 mt-1">
                Leg 1 Result: {leg1Match?.is_played ? `${leg1Match.home_score} - ${leg1Match.away_score}` : 'Not recorded'}
              </p>
            </div>
          )}

          {/* Penalty Shootout section if aggregate is tied */}
          {isTiedOnAggregate && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">Penalty Shootout</span>
                <button
                  onClick={() => setHasPenalties(!hasPenalties)}
                  className="text-xs text-amber-700 underline font-medium"
                >
                  {hasPenalties ? 'Disable' : 'Enable Shootout'}
                </button>
              </div>

              {hasPenalties && (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{homeTeam.name}:</span>
                    <input
                      type="number"
                      min={0}
                      value={homePenalties}
                      onChange={(e) => setHomePenalties(parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">{awayTeam.name}:</span>
                    <input
                      type="number"
                      min={0}
                      value={awayPenalties}
                      onChange={(e) => setAwayPenalties(parseInt(e.target.value) || 0)}
                      className="w-14 px-2 py-1 text-center font-mono font-bold bg-white border border-slate-300 rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => {
              setHomeScore(0);
              setAwayScore(0);
              setIsPlayed(false);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Reset Match
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
            >
              Save Result
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
