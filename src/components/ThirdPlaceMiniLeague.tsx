import React from 'react';
import { Match, Team, ThirdPlaceStanding } from '../types/tournament';
import { calculateThirdPlaceMiniLeague } from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { Award, CheckCircle, HelpCircle, ShieldAlert, ArrowRight } from 'lucide-react';

interface ThirdPlaceMiniLeagueProps {
  teams: Team[];
  matches: Match[];
  onNavigateToKnockout: () => void;
}

export const ThirdPlaceMiniLeague: React.FC<ThirdPlaceMiniLeagueProps> = ({
  teams,
  matches,
  onNavigateToKnockout,
}) => {
  const thirdPlaceRankings = calculateThirdPlaceMiniLeague(teams, matches);

  const qualifiedCount = thirdPlaceRankings.filter((t) => t.isQualified).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Phase 1 Cut Line</span>
              <span aria-hidden="true">·</span>
              <span>6 Groups</span>
              <span aria-hidden="true">·</span>
              <span>Top 4 Advance</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-500" />
              3rd Place Mini-League Ranking
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Under the tournament format, the 6 teams that finish in 3rd place in Groups A through F are ranked in this comparative table. Only the top 4 teams qualify for the 16 Bora (Round of 16).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToKnockout}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              <span>View 16 Bora Bracket</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Ranking Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900">Comparative Cut Standings</h2>
            <p className="text-xs text-slate-500">
              Sorted by Points $\rightarrow$ Goal Difference $\rightarrow$ Goals For
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Top 4 Advance ({qualifiedCount}/4)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              Bottom 2 Eliminated
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-3 text-center w-20">Group</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-3 text-center" title="Matches Played">
                  P
                </th>
                <th className="py-3 px-3 text-center" title="Won">
                  W
                </th>
                <th className="py-3 px-3 text-center" title="Drawn">
                  D
                </th>
                <th className="py-3 px-3 text-center" title="Lost">
                  L
                </th>
                <th className="py-3 px-3 text-center" title="Goals For">
                  GF
                </th>
                <th className="py-3 px-3 text-center" title="Goals Against">
                  GA
                </th>
                <th className="py-3 px-3 text-center" title="Goal Difference">
                  GD
                </th>
                <th className="py-3 px-4 text-center font-bold text-slate-900">PTS</th>
                <th className="py-3 px-4 text-right">Cut Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {thirdPlaceRankings.map((row, idx) => {
                const isCutLine = idx === 3; // The cutoff line after rank 4

                return (
                  <React.Fragment key={row.team.id}>
                    <tr
                      className={`transition-colors ${
                        row.isQualified
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                          : 'bg-rose-50/20 hover:bg-rose-50/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-mono font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                            row.isQualified
                              ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                          Grp {row.originalGroup}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <ClubCrest
                            logoUrl={row.team.logo_url}
                            clubName={row.team.club_crest_name}
                            teamName={row.team.name}
                            size="md"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-sm leading-tight">
                              {row.team.name}
                            </span>
                            <span className="text-xs text-slate-500 leading-none">
                              {row.team.club_crest_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.played}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.won}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.drawn}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.lost}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.goalsFor}
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono tabular-nums text-slate-600">
                        {row.goalsAgainst}
                      </td>
                      <td
                        className={`py-3.5 px-3 text-center font-mono tabular-nums font-semibold ${
                          row.goalDifference > 0
                            ? 'text-emerald-600'
                            : row.goalDifference < 0
                            ? 'text-rose-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums font-black text-slate-900 text-sm">
                        {row.points}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {row.isQualified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Advance to 16 Bora
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-semibold">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Eliminated
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* Cutoff visual line between 4th and 5th */}
                    {isCutLine && (
                      <tr className="bg-slate-200">
                        <td
                          colSpan={12}
                          className="py-1 px-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-100 border-y border-dashed border-slate-300"
                        >
                          Cutoff Threshold (Top 4 Advance, Bottom 2 Eliminated)
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rules Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            Tie-Breaking Rules for 3rd-Placed Teams
          </h3>
          <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside leading-relaxed">
            <li>
              <strong>Total Points:</strong> Higher points earned in their 6 group stage matches.
            </li>
            <li>
              <strong>Goal Difference (GD):</strong> Superior goal difference across all 6 matches.
            </li>
            <li>
              <strong>Goals For (GF):</strong> Higher total goals scored across all 6 matches.
            </li>
            <li>
              <strong>Alphabetical Order:</strong> Automated seed draw resolution.
            </li>
          </ol>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-600" />
            Knockout Seeding (16 Bora)
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            The 4 qualifying third-placed teams are cross-paired against Group Winners in the 16 Bora (Round of 16). The tournament algorithm prevents teams from meeting opponents from their original group in the first knockout stage.
          </p>
        </div>
      </div>
    </div>
  );
};
