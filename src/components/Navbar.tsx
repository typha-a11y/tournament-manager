import React from 'react';
import {
  Calendar,
  ChevronDown,
  Database,
  GitMerge,
  Layers,
  ListOrdered,
  Plus,
  RefreshCw,
  Shield,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import { TournamentProfile } from '../types/tournament';
import { AVATAR_OPTIONS } from './ProfileSelectionModal';

export type TabType =
  | 'groups'
  | 'third_place'
  | 'fixtures'
  | 'knockout'
  | 'stats'
  | 'teams'
  | 'supabase_guide';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isSupabaseConnected: boolean;
  syncStatus: 'synced' | 'saving' | 'offline' | 'error';
  activeProfile: TournamentProfile | null;
  onOpenProfileSelector: () => void;
  onOpenScoreModal: () => void;
  onOpenSetupWizard?: () => void;
  matchesPlayedCount: number;
  totalMatchesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  isSupabaseConnected,
  syncStatus,
  activeProfile,
  onOpenProfileSelector,
  onOpenScoreModal,
  onOpenSetupWizard,
  matchesPlayedCount,
  totalMatchesCount,
}) => {
  const avatarMeta =
    AVATAR_OPTIONS.find((a) => a.id === activeProfile?.avatar_id) || AVATAR_OPTIONS[0];
  const AvatarIcon = avatarMeta.icon;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
      {/* Top micro-bar: Profile Switcher & Real-time Supabase Sync Status */}
      <div className="bg-slate-900 text-white text-xs px-4 sm:px-6 lg:px-8 py-1.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Active Savefile Profile Pill with Switcher */}
          <button
            onClick={onOpenProfileSelector}
            className="flex items-center gap-2 hover:bg-slate-800/80 px-2 py-1 rounded-md transition-colors text-left"
            title="Click to switch profile or create new tournament"
          >
            <div
              className="w-4 h-4 rounded-sm flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: activeProfile?.avatar_color || '#2563eb' }}
            >
              <AvatarIcon className="w-2.5 h-2.5" />
            </div>
            <span className="font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-xs">
              {activeProfile ? activeProfile.name : 'Loading Tournament...'}
            </span>
            <span className="text-[10px] text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800 font-semibold uppercase tracking-wider flex items-center gap-0.5">
              <span>Switch Profile</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </span>
          </button>

          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-[11px] text-slate-400">
            Phase: <strong className="text-slate-200">{activeProfile?.current_phase || 'Group Stage'}</strong>
          </span>
        </div>

        {/* Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {syncStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-amber-300 text-[11px] font-medium">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>Saving to Supabase...</span>
            </span>
          )}

          {syncStatus === 'synced' && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Synced with Supabase</span>
            </span>
          )}

          {syncStatus === 'offline' && (
            <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium bg-slate-800 px-2 py-0.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Local Storage Mode</span>
            </span>
          )}

          <span className="hidden sm:inline text-slate-400 text-[11px] ml-2">
            {matchesPlayedCount}/{totalMatchesCount} Played
          </span>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-15">
          {/* Brand Zone */}
          <button
            onClick={() => onSelectTab('groups')}
            className="flex items-center gap-2.5 text-left group transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black tracking-wider text-sm shadow-2xs group-hover:bg-blue-700 transition-colors">
              <Trophy className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 block leading-tight">
                eFootball Tourney
              </span>
              <span className="text-[11px] text-slate-500 font-normal block leading-none">
                24 Teams · 6 Groups · Real Logos
              </span>
            </div>
          </button>

          {/* Clean text navigation tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('groups')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'groups'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Groups & Standings</span>
            </button>

            <button
              onClick={() => onSelectTab('third_place')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'third_place'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>3rd Place Cut</span>
            </button>

            <button
              onClick={() => onSelectTab('fixtures')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'fixtures'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Fixtures & Results</span>
            </button>

            <button
              onClick={() => onSelectTab('knockout')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'knockout'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Knockout Bracket</span>
            </button>

            <button
              onClick={() => onSelectTab('stats')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'stats'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Stats & Derbies</span>
            </button>

            <button
              onClick={() => onSelectTab('teams')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'teams'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>24 Teams</span>
            </button>

            <button
              onClick={() => onSelectTab('supabase_guide')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                currentTab === 'supabase_guide'
                  ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase & SQL</span>
              {isSupabaseConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              )}
            </button>
          </nav>

          {/* Primary actions */}
          <div className="flex items-center gap-2">
            {onOpenSetupWizard && (
              <button
                onClick={onOpenSetupWizard}
                title="Group creation wizard & draw"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Setup & Draw</span>
              </button>
            )}

            <button
              onClick={onOpenScoreModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Score</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => onSelectTab('groups')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'groups' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Groups
          </button>
          <button
            onClick={() => onSelectTab('third_place')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'third_place' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            3rd Place Cut
          </button>
          <button
            onClick={() => onSelectTab('fixtures')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'fixtures' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fixtures
          </button>
          <button
            onClick={() => onSelectTab('knockout')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'knockout' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            16 Bora Bracket
          </button>
          <button
            onClick={() => onSelectTab('stats')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'stats' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Stats & Derbies
          </button>
          <button
            onClick={() => onSelectTab('teams')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'teams' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            24 Teams
          </button>
          <button
            onClick={() => onSelectTab('supabase_guide')}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTab === 'supabase_guide' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Supabase SQL
          </button>
        </div>
      </div>
    </header>
  );
};
