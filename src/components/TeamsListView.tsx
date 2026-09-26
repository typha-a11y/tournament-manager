/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { GroupLetter, Team } from '../types/tournament';
import { REAL_FOOTBALL_CLUBS } from '../lib/constants';
import { ClubCrest } from './ClubCrest';
import { getReliableClubLogo } from '../lib/logoDictionary';
import { useTournament } from '../context/TournamentContext';
import { computeTeamAchievements, TIER_CONFIG } from '../lib/badgeEngine';
import {
  Award,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Edit3,
  ExternalLink,
  Filter,
  Medal,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Shuffle,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';

interface TeamsListViewProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
  onConductDraw: () => void;
  onNavigateToWallOfFame?: () => void;
}

export const TeamsListView: React.FC<TeamsListViewProps> = ({
  teams,
  onUpdateTeams,
  onConductDraw,
  onNavigateToWallOfFame,
}) => {
  const { matches, activeTournamentId } = useTournament();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | GroupLetter>('ALL');
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Compute live achievements
  const allAchievements = computeTeamAchievements(teams, matches, activeTournamentId);

  // Form states for modal
  const [editName, setEditName] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editClubName, setEditClubName] = useState('');
  const [copiedContact, setCopiedContact] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Filtered teams list
  const filteredTeams = teams.filter((t) => {
    // Group filter
    if (selectedGroupFilter !== 'ALL' && t.group_id !== selectedGroupFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = t.name.toLowerCase().includes(q);
      const matchClub = (t.club_crest_name || '').toLowerCase().includes(q);
      const matchPhone = (t.whatsapp || t.phone || '').toLowerCase().includes(q);
      const matchGroup = (t.group_id || '').toLowerCase().includes(q);
      return matchName || matchClub || matchPhone || matchGroup;
    }

    return true;
  });

  // Open Edit Modal
  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditWhatsapp(team.whatsapp || team.phone || '');
    setEditClubName(team.club_crest_name || 'Manchester United');
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingTeam(null);
  };

  // Save changes to team
  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const trimmedName = editName.trim() || editingTeam.name;
    const trimmedWhatsapp = editWhatsapp.trim();
    const clubObj = REAL_FOOTBALL_CLUBS.find((c) => c.name === editClubName);
    const newLogoUrl = clubObj
      ? clubObj.logoUrl
      : getReliableClubLogo(editClubName, editingTeam.logo_url);

    const updatedList = teams.map((t) => {
      if (t.id === editingTeam.id) {
        return {
          ...t,
          name: trimmedName,
          whatsapp: trimmedWhatsapp,
          phone: trimmedWhatsapp,
          club_crest_name: editClubName,
          logo_url: newLogoUrl,
        };
      }
      return t;
    });

    onUpdateTeams(updatedList);
    setEditingTeam(null);
  };

  // Copy single contact
  const handleCopySingle = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedContact(text);
    setTimeout(() => setCopiedContact(null), 2000);
  };

  // Copy all contacts as list
  const handleCopyAllContacts = () => {
    const list = teams
      .map((t, idx) => `${idx + 1}. ${t.name} ${t.whatsapp || t.phone || '(No number)'}`)
      .join('\n');
    navigator.clipboard.writeText(list);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Format clean whatsapp link
  const getWhatsAppLink = (rawNumber: string, teamName: string) => {
    if (!rawNumber) return '#';
    const digitsOnly = rawNumber.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${teamName}! This is regarding our eFootball Tournament match fixture.`
    );
    return `https://wa.me/${digitsOnly}?text=${message}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>Tournament Directory</span>
              <span aria-hidden="true">·</span>
              <span>24 Official Participants</span>
              <span aria-hidden="true">·</span>
              <span>WhatsApp Direct Contacts</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Tournament Teams & Real Football Crests
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Click any team card below to edit player names, WhatsApp phone numbers, or assigned football club crests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyAllContacts}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors shadow-2xs"
              title="Copy all 24 player numbers for WhatsApp group invites"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Contacts Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy All WhatsApp Contacts</span>
                </>
              )}
            </button>

            <button
              onClick={onConductDraw}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle & Draw Groups</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by gamer name, club crest, or WhatsApp number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Group Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Group:
            </span>
            {(['ALL', 'A', 'B', 'C', 'D', 'E', 'F'] as const).map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedGroupFilter(grp)}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedGroupFilter === grp
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {grp === 'ALL' ? 'All (24)' : `Group ${grp}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Teams Grid - Clickable Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map((team, idx) => {
          const rawContact = team.whatsapp || team.phone || '';
          const hasPhone = Boolean(rawContact.trim());

          return (
            <div
              key={team.id}
              onClick={() => handleOpenEdit(team)}
              className="group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-4.5 flex flex-col justify-between cursor-pointer relative overflow-hidden ring-0 hover:ring-2 hover:ring-blue-100 select-none"
            >
              {/* Header Badges */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-extrabold text-slate-400">
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
                    {team.pot && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                        Pot {team.pot}
                      </span>
                    )}
                  </div>

                  {/* Edit button */}
                  <div className="opacity-70 group-hover:opacity-100 flex items-center gap-1 text-[11px] text-blue-600 font-semibold transition-opacity bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-100">
                    <Edit3 className="w-3 h-3 text-blue-600" />
                    <span>Edit</span>
                  </div>
                </div>

                {/* Team Info & Club Crest */}
                <div className="flex items-center gap-3.5 my-1">
                  <ClubCrest
                    logoUrl={team.logo_url}
                    clubName={team.club_crest_name}
                    teamName={team.name}
                    size="lg"
                    className="shrink-0 group-hover:scale-105 transition-transform"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-slate-900 text-sm truncate leading-tight group-hover:text-blue-700 transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-xs text-slate-500 truncate leading-none mt-1 font-medium">
                      {team.club_crest_name || 'No Club Selected'}
                    </p>
                  </div>
                </div>

                {/* Earned Medals Preview */}
                {(() => {
                  const teamBadges = allAchievements.filter((a) => a.team_id === team.id);
                  if (teamBadges.length === 0) return null;
                  return (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1 overflow-hidden">
                        {teamBadges.slice(0, 3).map((b) => (
                          <span
                            key={b.id}
                            title={`${b.title} (${b.tier})`}
                            className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-amber-50 border border-amber-200 text-xs shadow-2xs"
                          >
                            {b.icon}
                          </span>
                        ))}
                        {teamBadges.length > 3 && (
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100/70 px-1 py-0.5 rounded">
                            +{teamBadges.length - 3}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-black font-mono text-slate-500">
                        {teamBadges.length} Medal{teamBadges.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* WhatsApp Contact Section */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {hasPhone ? (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-white" />
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 truncate">
                      {rawContact}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                    <Phone className="w-3.5 h-3.5" />
                    <span>No WhatsApp added</span>
                  </div>
                )}

                {/* WhatsApp Chat & Copy Actions */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {hasPhone && (
                    <>
                      <button
                        onClick={(e) => handleCopySingle(rawContact, e)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Copy phone number"
                      >
                        {copiedContact === rawContact ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <a
                        href={getWhatsAppLink(rawContact, team.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold shadow-2xs transition-colors"
                        title="Open WhatsApp Chat"
                      >
                        <MessageCircle className="w-3 h-3 fill-white" />
                        <span>Chat</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <ClubCrest
                  logoUrl={
                    REAL_FOOTBALL_CLUBS.find((c) => c.name === editClubName)?.logoUrl ||
                    editingTeam.logo_url
                  }
                  clubName={editClubName}
                  teamName={editName}
                  size="md"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Edit Team & Contact Information
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update participant name, WhatsApp phone number, and club crest
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseEdit}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveTeam} className="py-5 space-y-4">
              {/* Participant Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Participant / Gamer Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="e.g. Huncho, Christian, etc."
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 font-semibold"
                  />
                </div>
              </div>

              {/* WhatsApp Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>WhatsApp Number</span>
                  <span className="text-[11px] text-emerald-600 font-normal">
                    Format: +255 XXX XXX XXX
                  </span>
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value)}
                    placeholder="+255 749 541 001"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Real Football Club Crest Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Football Club Crest
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                  {REAL_FOOTBALL_CLUBS.map((club) => {
                    const isSelected = editClubName === club.name;
                    return (
                      <button
                        type="button"
                        key={club.name}
                        onClick={() => setEditClubName(club.name)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <ClubCrest
                          logoUrl={club.logoUrl}
                          clubName={club.name}
                          size="sm"
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold block truncate">{club.name}</span>
                          <span className="text-[10px] text-slate-400 block">{club.shortName}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Group & Pot Info (Read-only context) */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">Current Assignment: </span>
                  <span className="font-bold text-slate-800">
                    {editingTeam.group_id ? `Group ${editingTeam.group_id}` : 'Unassigned'}
                  </span>
                  {editingTeam.pot && (
                    <span className="ml-2 font-mono text-slate-500">
                      (Pot {editingTeam.pot})
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 italic">
                  Groups are managed via Draw
                </span>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Team Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
