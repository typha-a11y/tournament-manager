import React, { useState } from 'react';
import { Team } from '../types/tournament';
import { REAL_FOOTBALL_CLUBS } from '../lib/constants';
import { ClubCrest } from './ClubCrest';
import { Search, Shield, Shuffle } from 'lucide-react';

interface TeamsListViewProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  onConductDraw: () => void;
}

export const TeamsListView: React.FC<TeamsListViewProps> = ({
  teams,
  onUpdateTeams,
  onConductDraw,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.club_crest_name && t.club_crest_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.group_id && t.group_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssignClub = (teamId: string, clubName: string) => {
    const club = REAL_FOOTBALL_CLUBS.find((c) => c.name === clubName);
    if (!club) return;

    const updated = teams.map((t) => {
      if (t.id === teamId) {
        return {
          ...t,
          club_crest_name: club.name,
          logo_url: club.logoUrl,
        };
      }
      return t;
    });

    onUpdateTeams(updated);
    setEditingTeamId(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Tournament Roster</span>
              <span aria-hidden="true">·</span>
              <span>24 Official Participants</span>
              <span aria-hidden="true">·</span>
              <span>Real Club Crests</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Tournament Teams & Real Football Crests
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              All 24 players are mapped to premier club crests (Real Madrid, Man City, Arsenal, Barcelona, Bayern, etc.). You can customize any team's assigned club crest below.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onConductDraw}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle & Draw Groups</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or club crest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredTeams.length} of {teams.length} Teams
          </span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team, idx) => {
          const isEditing = editingTeamId === team.id;

          return (
            <div
              key={team.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    {team.group_id ? (
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200">
                        Group {team.group_id}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[11px]">
                        Unassigned
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setEditingTeamId(isEditing ? null : team.id)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {isEditing ? 'Done' : 'Change Club'}
                  </button>
                </div>

                {/* Team Info */}
                <div className="flex items-center gap-3">
                  <ClubCrest
                    logoUrl={team.logo_url}
                    clubName={team.club_crest_name}
                    teamName={team.name}
                    size="lg"
                  />
                  <div className="truncate">
                    <h3 className="font-bold text-slate-900 text-sm truncate leading-tight">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate leading-none mt-1">
                      {team.club_crest_name || 'No Club Selected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Club Selector Dropdown */}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Assign Real Crest:
                  </label>
                  <select
                    value={team.club_crest_name || ''}
                    onChange={(e) => handleAssignClub(team.id, e.target.value)}
                    className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {REAL_FOOTBALL_CLUBS.map((club) => (
                      <option key={club.name} value={club.name}>
                        {club.name} ({club.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
