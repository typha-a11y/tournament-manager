import React, { useState, useEffect } from 'react';
import { CombinedTieMatchup } from '../lib/tournamentEngine';
import { Match, Team } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import {
  Check,
  ChevronRight,
  Flame,
  Layers,
  Save,
  Shield,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

interface DoubleEntryScoreModalProps {
  tie: CombinedTieMatchup | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBothLegs: (leg1Updated: Match, leg2Updated?: Match) => Promise<void>;
  onSaveSingleLeg: (match: Match) => Promise<void>;
}

export const DoubleEntryScoreModal: React.FC<DoubleEntryScoreModalProps> = ({
  tie,
  isOpen,
  onClose,
  onSaveBothLegs,
  onSaveSingleLeg,
}) => {
  if (!isOpen || !tie) return null;

  const { teamA, teamB, leg1, leg2, roundInfo, stage, groupId } = tie;

  // Leg 1 score inputs
  const [leg1HomeScore, setLeg1HomeScore] = useState<string>(
    leg1.home_score !== null ? String(leg1.home_score) : ''
  );
  const [leg1AwayScore, setLeg1AwayScore] = useState<string>(
    leg1.away_score !== null ? String(leg1.away_score) : ''
  );

  // Leg 2 score inputs
  const [leg2HomeScore, setLeg2HomeScore] = useState<string>(
    leg2 && leg2.home_score !== null ? String(leg2.home_score) : ''
  );
  const [leg2AwayScore, setLeg2AwayScore] = useState<string>(
    leg2 && leg2.away_score !== null ? String(leg2.away_score) : ''
  );

  // Penalties (for knockouts)
  const [homePenalties, setHomePenalties] = useState<string>(
    leg2?.home_penalties !== null && leg2?.home_penalties !== undefined
      ? String(leg2.home_penalties)
      : leg1.home_penalties !== null && leg1.home_penalties !== undefined
      ? String(leg1.home_penalties)
      : ''
  );
  const [awayPenalties, setAwayPenalties] = useState<string>(
    leg2?.away_penalties !== null && leg2?.away_penalties !== undefined
      ? String(leg2.away_penalties)
      : leg1.away_penalties !== null && leg1.away_penalties !== undefined
      ? String(leg1.away_penalties)
      : ''
  );

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever selected tie changes
  useEffect(() => {
    setLeg1HomeScore(leg1.home_score !== null ? String(leg1.home_score) : '');
    setLeg1AwayScore(leg1.away_score !== null ? String(leg1.away_score) : '');
    setLeg2HomeScore(leg2 && leg2.home_score !== null ? String(leg2.home_score) : '');
    setLeg2AwayScore(leg2 && leg2.away_score !== null ? String(leg2.away_score) : '');
    setHomePenalties(
      leg2?.home_penalties !== null && leg2?.home_penalties !== undefined
        ? String(leg2.home_penalties)
        : leg1.home_penalties !== null && leg1.home_penalties !== undefined
        ? String(leg1.home_penalties)
        : ''
    );
    setAwayPenalties(
      leg2?.away_penalties !== null && leg2?.away_penalties !== undefined
        ? String(leg2.away_penalties)
        : leg1.away_penalties !== null && leg1.away_penalties !== undefined
        ? String(leg1.away_penalties)
        : ''
    );
    setSavedSuccess(false);
    setErrorMessage(null);
  }, [tie]);

  // Live aggregate calculation
  const l1H = leg1HomeScore !== '' ? parseInt(leg1HomeScore, 10) : null;
  const l1A = leg1AwayScore !== '' ? parseInt(leg1AwayScore, 10) : null;
  const l2H = leg2HomeScore !== '' ? parseInt(leg2HomeScore, 10) : null;
  const l2A = leg2AwayScore !== '' ? parseInt(leg2AwayScore, 10) : null;

  // Identify who is teamA in leg 1 (leg1.home_team_id === teamA.id)
  let liveTeamATotal = 0;
  let liveTeamBTotal = 0;
  let hasAnyScores = false;

  if (l1H !== null && !isNaN(l1H) && l1A !== null && !isNaN(l1A)) {
    hasAnyScores = true;
    if (leg1.home_team_id === teamA.id) {
      liveTeamATotal += l1H;
      liveTeamBTotal += l1A;
    } else {
      liveTeamBTotal += l1H;
      liveTeamATotal += l1A;
    }
  }

  if (leg2 && l2H !== null && !isNaN(l2H) && l2A !== null && !isNaN(l2A)) {
    hasAnyScores = true;
    if (leg2.home_team_id === teamA.id) {
      liveTeamATotal += l2H;
      liveTeamBTotal += l2A;
    } else {
      liveTeamBTotal += l2H;
      liveTeamATotal += l2A;
    }
  }

  const isTiedAggregate = hasAnyScores && liveTeamATotal === liveTeamBTotal;
  const isKnockout = stage !== 'Group';
  const showPenalties = isKnockout && isTiedAggregate && leg2 !== null && l2H !== null;

  const handleSaveBoth = async () => {
    setErrorMessage(null);

    // Validate Leg 1
    const h1 = leg1HomeScore === '' ? null : parseInt(leg1HomeScore, 10);
    const a1 = leg1AwayScore === '' ? null : parseInt(leg1AwayScore, 10);

    if ((h1 !== null && a1 === null) || (h1 === null && a1 !== null)) {
      setErrorMessage('Please enter both scores for Leg 1 or leave both blank.');
      return;
    }

    // Validate Leg 2
    let h2: number | null = null;
    let a2: number | null = null;
    if (leg2) {
      h2 = leg2HomeScore === '' ? null : parseInt(leg2HomeScore, 10);
      a2 = leg2AwayScore === '' ? null : parseInt(leg2AwayScore, 10);

      if ((h2 !== null && a2 === null) || (h2 === null && a2 !== null)) {
        setErrorMessage('Please enter both scores for Leg 2 or leave both blank.');
        return;
      }
    }

    if (h1 === null && a1 === null && h2 === null && a2 === null) {
      setErrorMessage('Please enter at least one leg score before saving.');
      return;
    }

    const penH = homePenalties !== '' ? parseInt(homePenalties, 10) : undefined;
    const penA = awayPenalties !== '' ? parseInt(awayPenalties, 10) : undefined;

    setSaving(true);
    try {
      const updatedLeg1: Match = {
        ...leg1,
        home_score: h1,
        away_score: a1,
        is_played: h1 !== null && a1 !== null,
        home_penalties: !leg2 ? penH : undefined,
        away_penalties: !leg2 ? penA : undefined,
      };

      let updatedLeg2: Match | undefined = undefined;
      if (leg2) {
        updatedLeg2 = {
          ...leg2,
          home_score: h2,
          away_score: a2,
          is_played: h2 !== null && a2 !== null,
          home_penalties: penH,
          away_penalties: penA,
        };
      }

      await onSaveBothLegs(updatedLeg1, updatedLeg2);
      setSavedSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving match results.');
    } finally {
      setSaving(false);
    }
  };

  const handleStepper = (
    setter: React.Dispatch<React.SetStateAction<string>>,
    current: string,
    delta: number
  ) => {
    const val = current === '' ? 0 : parseInt(current, 10);
    const next = Math.max(0, (isNaN(val) ? 0 : val) + delta);
    setter(String(next));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-200 border border-blue-400/30">
                {stage === 'Group' ? `Group ${groupId}` : stage}
              </span>
              <span className="text-xs text-slate-300 font-medium">{roundInfo}</span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teams Title Banner */}
          <div className="grid grid-cols-5 items-center gap-2 mt-4 pt-2">
            {/* Team A */}
            <div className="col-span-2 flex flex-col items-center text-center">
              <div className="p-1.5 bg-white/10 rounded-full mb-1.5 border border-white/20">
                <ClubCrest logoUrl={teamA.logo_url} name={teamA.club_crest_name || teamA.name} size="lg" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate max-w-full">
                {teamA.name}
              </h3>
              <p className="text-[11px] text-blue-200 truncate">{teamA.club_crest_name}</p>
            </div>

            {/* Aggregate Score Display */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">
                AGGREGATE
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white mt-0.5">
                {liveTeamATotal} - {liveTeamBTotal}
              </div>
              {hasAnyScores && (
                <span className="text-[10px] font-bold text-emerald-400 mt-0.5">
                  {liveTeamATotal > liveTeamBTotal
                    ? `${teamA.name} leads`
                    : liveTeamBTotal > liveTeamATotal
                    ? `${teamB.name} leads`
                    : 'Level on aggregate'}
                </span>
              )}
            </div>

            {/* Team B */}
            <div className="col-span-2 flex flex-col items-center text-center">
              <div className="p-1.5 bg-white/10 rounded-full mb-1.5 border border-white/20">
                <ClubCrest logoUrl={teamB.logo_url} name={teamB.club_crest_name || teamB.name} size="lg" />
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight truncate max-w-full">
                {teamB.name}
              </h3>
              <p className="text-[11px] text-blue-200 truncate">{teamB.club_crest_name}</p>
            </div>
          </div>
        </div>

        {/* Content Body with Double Entry Fields */}
        <div className="p-6 overflow-y-auto space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Double Entry Results Saved Successfully! Standings recalculated.</span>
            </div>
          )}

          {/* ================= LEG 1 BOX ================= */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-md">
                  LEG 1
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {stage === 'Group'
                    ? `Matchweek ${leg1.round_number || 1}`
                    : `${stage} Leg 1`}
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  leg1.is_played
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {leg1.is_played ? 'Completed' : 'Pending Result'}
              </span>
            </div>

            {/* Leg 1 Steppers & Score Inputs */}
            <div className="grid grid-cols-7 items-center gap-3">
              {/* Home Team (Team A) */}
              <div className="col-span-3 flex items-center justify-end gap-2.5 text-right">
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {teamA.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {teamA.club_crest_name} <span className="text-blue-600 font-bold">(Home)</span>
                  </div>
                </div>
                <ClubCrest logoUrl={teamA.logo_url} name={teamA.club_crest_name || teamA.name} size="sm" />
              </div>

              {/* Score inputs with +/- steppers */}
              <div className="col-span-1 flex items-center justify-center gap-1.5">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepper(setLeg1HomeScore, leg1HomeScore, -1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={leg1HomeScore}
                      onChange={(e) => setLeg1HomeScore(e.target.value)}
                      placeholder="0"
                      className="w-10 h-10 text-center font-bold font-mono text-base bg-white border-2 border-blue-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepper(setLeg1HomeScore, leg1HomeScore, 1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-slate-400 font-bold text-sm">:</span>

                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepper(setLeg1AwayScore, leg1AwayScore, -1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={leg1AwayScore}
                      onChange={(e) => setLeg1AwayScore(e.target.value)}
                      placeholder="0"
                      className="w-10 h-10 text-center font-bold font-mono text-base bg-white border-2 border-blue-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => handleStepper(setLeg1AwayScore, leg1AwayScore, 1)}
                      className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Away Team (Team B) */}
              <div className="col-span-3 flex items-center gap-2.5 text-left">
                <ClubCrest logoUrl={teamB.logo_url} name={teamB.club_crest_name || teamB.name} size="sm" />
                <div>
                  <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                    {teamB.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {teamB.club_crest_name} <span className="text-slate-400">(Away)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= LEG 2 BOX (REVERSE FIXTURE) ================= */}
          {leg2 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-md">
                    LEG 2
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    {stage === 'Group'
                      ? `Matchweek ${leg2.round_number || 4}`
                      : `${stage} Leg 2 (Decider)`}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    leg2.is_played
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {leg2.is_played ? 'Completed' : 'Pending Result'}
                </span>
              </div>

              {/* Leg 2 Steppers & Score Inputs (Team B at home, Team A away) */}
              <div className="grid grid-cols-7 items-center gap-3">
                {/* Home Team (Team B in reverse leg) */}
                <div className="col-span-3 flex items-center justify-end gap-2.5 text-right">
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      {teamB.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {teamB.club_crest_name} <span className="text-indigo-600 font-bold">(Home)</span>
                    </div>
                  </div>
                  <ClubCrest logoUrl={teamB.logo_url} name={teamB.club_crest_name || teamB.name} size="sm" />
                </div>

                {/* Score inputs */}
                <div className="col-span-1 flex items-center justify-center gap-1.5">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStepper(setLeg2HomeScore, leg2HomeScore, -1)}
                        className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={leg2HomeScore}
                        onChange={(e) => setLeg2HomeScore(e.target.value)}
                        placeholder="0"
                        className="w-10 h-10 text-center font-bold font-mono text-base bg-white border-2 border-indigo-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepper(setLeg2HomeScore, leg2HomeScore, 1)}
                        className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <span className="text-slate-400 font-bold text-sm">:</span>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStepper(setLeg2AwayScore, leg2AwayScore, -1)}
                        className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={leg2AwayScore}
                        onChange={(e) => setLeg2AwayScore(e.target.value)}
                        placeholder="0"
                        className="w-10 h-10 text-center font-bold font-mono text-base bg-white border-2 border-indigo-400 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleStepper(setLeg2AwayScore, leg2AwayScore, 1)}
                        className="w-5 h-5 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Away Team (Team A in reverse leg) */}
                <div className="col-span-3 flex items-center gap-2.5 text-left">
                  <ClubCrest logoUrl={teamA.logo_url} name={teamA.club_crest_name || teamA.name} size="sm" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                      {teamA.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {teamA.club_crest_name} <span className="text-slate-400">(Away)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-100 rounded-xl text-center text-xs text-slate-500 font-medium">
              Single-match format configured for this stage.
            </div>
          )}

          {/* Knockout Penalty Shootouts if Level on Aggregate */}
          {showPenalties && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>Penalty Shootout (Decider)</span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Aggregate is tied {liveTeamATotal} - {liveTeamBTotal}. Enter penalty shootout kicks
                to decide which team qualifies:
              </p>
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{teamB.name}:</span>
                  <input
                    type="number"
                    min="0"
                    value={homePenalties}
                    onChange={(e) => setHomePenalties(e.target.value)}
                    placeholder="5"
                    className="w-12 h-9 text-center font-bold bg-white border border-amber-300 rounded-lg"
                  />
                </div>
                <span className="font-bold text-slate-400">-</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={awayPenalties}
                    onChange={(e) => setAwayPenalties(e.target.value)}
                    placeholder="4"
                    className="w-12 h-9 text-center font-bold bg-white border border-amber-300 rounded-lg"
                  />
                  <span className="text-xs font-bold text-slate-800">{teamA.name}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Double Entry updates both legs and syncs standings immediately.
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBoth}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Tie Results...' : 'Save Both Legs'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
