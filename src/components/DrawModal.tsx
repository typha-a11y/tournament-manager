import React, { useState } from 'react';
import { GroupLetter, Match, Team } from '../types/tournament';
import { conductOfficialDraw, generateGroupMatches, GROUPS } from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { Dices, RefreshCw, Sparkles, Trophy, X } from 'lucide-react';

interface DrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onApplyDraw: (newTeams: Team[], newMatches: Match[]) => void;
}

export const DrawModal: React.FC<DrawModalProps> = ({
  isOpen,
  onClose,
  teams,
  onApplyDraw,
}) => {
  const [isDrawing, setIsDrawing] = useState(false);

  if (!isOpen) return null;

  const handleConductDraw = () => {
    setIsDrawing(true);
    setTimeout(() => {
      const drawnTeams = conductOfficialDraw(teams);
      const groupMatches = generateGroupMatches(drawnTeams);
      onApplyDraw(drawnTeams, groupMatches);
      setIsDrawing(false);
      onClose();
    }, 400);
  };

  const handleSimulateFullTournament = () => {
    setIsDrawing(true);
    setTimeout(() => {
      const drawnTeams = conductOfficialDraw(teams);
      const groupMatches = generateGroupMatches(drawnTeams);

      // Populate realistic scores for group stage matches
      const simulatedMatches: Match[] = groupMatches.map((m) => {
        // Weighted scores (0-4 goals typical in eFootball)
        const homeScore = Math.floor(Math.random() * 4);
        const awayScore = Math.floor(Math.random() * 3);
        return {
          ...m,
          home_score: homeScore,
          away_score: awayScore,
          is_played: true,
        };
      });

      onApplyDraw(drawnTeams, simulatedMatches);
      setIsDrawing(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Tournament Draw
              </h3>
              <p className="text-xs text-slate-500">
                Randomize 24 teams into Groups A through F (4 teams each)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GROUPS.map((letter) => {
              const groupMembers = teams.filter((t) => t.group_id === letter);
              return (
                <div
                  key={letter}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-2">
                    Group {letter}
                  </span>
                  <div className="space-y-1.5">
                    {groupMembers.map((tm) => (
                      <div key={tm.id} className="flex items-center gap-1.5 text-xs">
                        <ClubCrest
                          logoUrl={tm.logo_url}
                          name={tm.club_crest_name || tm.name}
                          size="xs"
                        />
                        <span className="font-semibold text-slate-800 truncate text-[11px]">
                          {tm.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900">
            <strong>Draw Protocol:</strong> Executing the draw will reshuffle all 24 players evenly into the 6 groups and regenerate 72 Home & Away group fixtures (each team plays 6 group matches).
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleSimulateFullTournament}
            disabled={isDrawing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
            title="Randomly generates scores for the group stage to test standings and knockouts immediately"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Draw & Auto-Simulate Group Stage</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConductDraw}
              disabled={isDrawing}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isDrawing ? 'animate-spin' : ''}`} />
              <span>Conduct Official Draw</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
