import React, { useState } from 'react';
import { TournamentProfile } from '../types/tournament';
import {
  Calendar,
  Clock,
  Dices,
  Flame,
  Plus,
  Trash2,
  Trophy,
  Users,
  X,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  Sparkles,
  Layers,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';

interface ProfileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: TournamentProfile[];
  activeProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onOpenNewTournamentWizard: () => void;
  onDeleteProfile: (profileId: string) => Promise<void> | void;
  isSupabaseConnected: boolean;
}

export const AVATAR_OPTIONS = [
  { id: 'trophy-gold', icon: Trophy, label: 'Champions Cup', bg: 'bg-amber-500' },
  { id: 'shield-blue', icon: Shield, label: 'Super League', bg: 'bg-blue-600' },
  { id: 'flame-orange', icon: Flame, label: 'Masters Derby', bg: 'bg-orange-500' },
  { id: 'dices-purple', icon: Dices, label: 'Chaos Arena', bg: 'bg-purple-600' },
  { id: 'sparkles-emerald', icon: Sparkles, label: 'Elite Series', bg: 'bg-emerald-600' },
  { id: 'activity-indigo', icon: Activity, label: 'Pro Circuit', bg: 'bg-indigo-600' },
];

export const ProfileSelectionModal: React.FC<ProfileSelectionModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onOpenNewTournamentWizard,
  onDeleteProfile,
  isSupabaseConnected,
}) => {
  const [profileToDelete, setProfileToDelete] = useState<TournamentProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    try {
      await onDeleteProfile(profileToDelete.id);
      setProfileToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Netflix-style Title Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 border-b border-slate-800 text-center relative">
          {activeProfileId && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Profile Selector"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider mb-2">
            <Layers className="w-3.5 h-3.5" />
            Multi-Profile Savefile Management
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Who is managing the tournament?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto">
            Select an existing savefile to continue your campaign, or create a brand new tournament with fresh group assignments and fixtures.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isSupabaseConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {isSupabaseConnected ? 'Supabase Cloud Connected' : 'Local Storage Mode (Offline)'}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {profiles.length} Active {profiles.length === 1 ? 'Savefile' : 'Savefiles'}
            </span>
          </div>
        </div>

        {/* Profiles Grid Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* New Tournament Creation Card */}
            <div
              onClick={() => {
                onOpenNewTournamentWizard();
              }}
              className="group border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 min-h-[260px] shadow-xs hover:shadow-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-xs mb-4">
                <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                New Tournament
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                Start a fresh season with custom groups or automatic Fisher-Yates draw
              </p>
              <span className="mt-4 px-3 py-1 bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-700 rounded-lg text-xs font-bold transition-colors">
                Launch Wizard
              </span>
            </div>

            {/* Profile Cards */}
            {profiles.map((profile) => {
              const isActive = profile.id === activeProfileId;
              const avatarMeta =
                AVATAR_OPTIONS.find((a) => a.id === profile.avatar_id) || AVATAR_OPTIONS[0];
              const IconComponent = avatarMeta.icon;

              const createdDateStr = new Date(profile.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const lastSavedStr = new Date(profile.last_saved_at).toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={profile.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                    isActive
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="p-5">
                    {/* Header with Avatar & Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                          style={{ backgroundColor: profile.avatar_color || '#2563eb' }}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                              {profile.name}
                            </h3>
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Saved {lastSavedStr}
                          </span>
                        </div>
                      </div>

                      {isActive ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileToDelete(profile);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete tournament savefile"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Progress & Metadata */}
                    <div className="space-y-2.5 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-500 font-medium">Phase:</span>
                        <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">
                          {profile.current_phase || 'Group Stage - Round 1/6'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-500 font-medium">Format:</span>
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {profile.group_mode === 'manual' ? 'Custom Manual Draw' : 'Auto Fisher-Yates'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-500 font-medium">Created:</span>
                        <span className="text-slate-500 text-[11px]">{createdDateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button Footer */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isActive ? (
                      <button
                        onClick={onClose}
                        className="w-full py-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Resume Active Session</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectProfile(profile.id)}
                        className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>Load Savefile</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Multi-profile system allows running multiple leagues simultaneously.</span>
          </div>

          {activeProfileId && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-700 transition-colors"
            >
              Continue with Current Profile
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Submodal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-left">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Delete Savefile: {profileToDelete.name}?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This action will permanently delete this tournament savefile, along with all 24 team assignments and all 72 match fixtures from both Supabase and local storage. This cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProfileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Savefile'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
