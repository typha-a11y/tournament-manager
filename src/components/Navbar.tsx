/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Calendar,
  ChevronDown,
  Database,
  GitMerge,
  Layers,
  ListOrdered,
  Medal,
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
  | 'wall_of_fame'
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

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }>; badge?: string }[] = [
    { id: 'groups', label: 'Groups & Standings', icon: ListOrdered },
    { id: 'third_place', label: '3rd Place Cut', icon: Shield },
    { id: 'fixtures', label: 'Fixtures & Results', icon: Calendar },
    { id: 'knockout', label: '16 Bora Bracket', icon: GitMerge },
    { id: 'stats', label: 'Stats & Records', icon: TrendingUp },
    { id: 'wall_of_fame', label: 'Wall of Fame 🎖️', icon: Medal },
    { id: 'teams', label: '24 Teams', icon: Users },
    { id: 'supabase_guide', label: 'Supabase & SQL', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      {/* Top micro-bar: Profile Switcher & Real-time Supabase Sync Status */}
      <div className="bg-slate-900 text-white text-xs px-3 sm:px-6 lg:px-8 xl:px-10 py-1.5 border-b border-slate-800">
        <div className="max-w-[1800px] 2xl:max-w-[2200px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Active Savefile Profile Pill with Switcher */}
            <button
              onClick={onOpenProfileSelector}
              className="flex items-center gap-1.5 sm:gap-2 hover:bg-slate-800 px-2 py-1 rounded-md transition-colors text-left group"
              title="Click to switch profile or create new tournament"
            >
              <div
                className="w-4 h-4 rounded-sm flex items-center justify-center text-white shrink-0 shadow-2xs"
                style={{ backgroundColor: activeProfile?.avatar_color || '#2563eb' }}
              >
                <AvatarIcon className="w-2.5 h-2.5" />
              </div>
              <span className="font-semibold text-slate-200 truncate max-w-[120px] sm:max-w-[200px] md:max-w-xs group-hover:text-white transition-colors">
                {activeProfile ? activeProfile.name : 'Loading Tournament...'}
              </span>
              <span className="text-[10px] text-blue-400 bg-blue-950/90 px-1.5 py-0.5 rounded border border-blue-800/80 font-semibold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <span>Switch</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </span>
            </button>

            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:inline text-[11px] text-slate-400 truncate">
              Phase: <strong className="text-slate-200">{activeProfile?.current_phase || 'Group Stage'}</strong>
            </span>
          </div>

          {/* Sync Status Indicator & Progress */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {syncStatus === 'saving' && (
              <span className="flex items-center gap-1.5 text-amber-300 text-[11px] font-medium bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-800/60">
                <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                <span className="hidden xs:inline">Saving to Supabase...</span>
                <span className="xs:hidden">Saving...</span>
              </span>
            )}

            {syncStatus === 'synced' && (
              <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Live</span>
              </span>
            )}

            {syncStatus === 'offline' && (
              <span className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Local Cache</span>
              </span>
            )}

            <span className="text-slate-400 text-[11px] font-mono font-medium">
              {matchesPlayedCount}/{totalMatchesCount} Played
            </span>
          </div>
        </div>
      </div>

      {/* Main Bar with Brand, Navigation Tabs, and Quick Actions */}
      <div className="max-w-[1800px] 2xl:max-w-[2200px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between h-14 sm:h-15 gap-3">
          {/* Brand Zone */}
          <button
            onClick={() => onSelectTab('groups')}
            className="flex items-center gap-2.5 text-left group transition-all shrink-0"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black tracking-wider text-sm shadow-xs group-hover:bg-blue-700 group-hover:scale-105 transition-all">
              <Trophy className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 block leading-tight truncate">
                eFootball Tourney
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block leading-none truncate">
                24 Teams · 6 Groups · Real Logos
              </span>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = currentTab === tab.id;
              const isSupabase = tab.id === 'supabase_guide';

              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-2.5 xl:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? isSupabase
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-300 shadow-2xs font-bold'
                        : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-2xs font-bold'
                      : isSupabase
                      ? 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/60'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <TabIcon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? isSupabase
                          ? 'text-emerald-600'
                          : 'text-blue-600'
                        : 'text-slate-500'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {isSupabase && isSupabaseConnected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenSetupWizard && (
              <button
                onClick={onOpenSetupWizard}
                title="Group creation wizard & draw"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50/90 hover:bg-blue-100 border border-blue-200/80 rounded-lg transition-all shadow-2xs whitespace-nowrap active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Setup & Draw</span>
              </button>
            )}

            <button
              onClick={onOpenScoreModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs whitespace-nowrap active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Enter Score</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Horizontal Scroll Tab Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1.5 border-t border-slate-100 scrollbar-none -mx-3 px-3 sm:-mx-6 sm:px-6">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = currentTab === tab.id;
            const isSupabase = tab.id === 'supabase_guide';

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                  isActive
                    ? isSupabase
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/70'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
