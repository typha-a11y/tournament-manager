import React, { useState } from 'react';
import { GroupLetter, Match, Team, TournamentProfile } from '../types/tournament';
import {
  GROUPS,
  generateIntraGroupFixtures,
  shuffleArray,
} from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { AVATAR_OPTIONS } from './ProfileSelectionModal';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Dices,
  Flame,
  Layers,
  PlayCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';

interface NewTournamentOnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  baseTeams: Team[];
  onCompleteNewTournament: (
    profile: TournamentProfile,
    assignedTeams: Team[],
    fixtures: Match[]
  ) => Promise<void> | void;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export const NewTournamentOnboardingWizard: React.FC<NewTournamentOnboardingWizardProps> = ({
  isOpen,
  onClose,
  baseTeams,
  onCompleteNewTournament,
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  // Step 1: Name & Avatar
  const [tournamentName, setTournamentName] = useState('Season 1 - E-Championship');
  const [selectedAvatarId, setSelectedAvatarId] = useState('trophy-gold');
  const [selectedColor, setSelectedColor] = useState('#2563eb');

  // Step 3: Group Mode
  const [groupMode, setGroupMode] = useState<'auto' | 'manual'>('auto');

  // Group assignments state (A to F)
  const [groupAssignments, setGroupAssignments] = useState<Record<GroupLetter, Team[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
    F: [],
  });

  // Manual pool
  const [unassignedPool, setUnassignedPool] = useState<Team[]>([]);
  const [selectedPoolTeamId, setSelectedPoolTeamId] = useState<string | null>(null);

  // Animations & Saving
  const [isShufflingAnimation, setIsShufflingAnimation] = useState(false);
  const [shuffleText, setShuffleText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedMatchesPreview, setGeneratedMatchesPreview] = useState<Match[]>([]);

  // Initialize roster when opening
  React.useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      // Pre-populate with default groups if already assigned in baseTeams
      const initialMap: Record<GroupLetter, Team[]> = {
        A: [],
        B: [],
        C: [],
        D: [],
        E: [],
        F: [],
      };
      const pool: Team[] = [];

      baseTeams.forEach((t) => {
        if (t.group_id && initialMap[t.group_id]) {
          initialMap[t.group_id].push(t);
        } else {
          pool.push(t);
        }
      });

      // If already perfectly 4 per group, keep them; otherwise reset
      const allFour = GROUPS.every((g) => initialMap[g].length === 4);
      if (allFour) {
        setGroupAssignments(initialMap);
        setUnassignedPool([]);
      } else {
        // default auto shuffle
        performAutoShuffle([...baseTeams]);
      }
    }
  }, [isOpen, baseTeams]);

  // Fisher-Yates Auto Shuffle
  const performAutoShuffle = (roster: Team[] = baseTeams) => {
    setIsShufflingAnimation(true);
    setShuffleText('Shuffling 24 clubs into Pots 1-4...');

    setTimeout(() => {
      setShuffleText('Distributing into Groups A to F...');
    }, 450);

    setTimeout(() => {
      const shuffled = shuffleArray([...roster]);
      const newMap: Record<GroupLetter, Team[]> = {
        A: [],
        B: [],
        C: [],
        D: [],
        E: [],
        F: [],
      };

      for (let i = 0; i < shuffled.length; i++) {
        const groupIndex = i % 6;
        const groupLetter = GROUPS[groupIndex];
        const assignedTeam: Team = {
          ...shuffled[i],
          group_id: groupLetter,
          pot: Math.floor(i / 6) + 1,
        };
        newMap[groupLetter].push(assignedTeam);
      }

      setGroupAssignments(newMap);
      setUnassignedPool([]);
      setIsShufflingAnimation(false);
    }, 900);
  };

  if (!isOpen) return null;

  // Validation
  const isAllGroupsValid = GROUPS.every((g) => groupAssignments[g].length === 4);
  const totalAssigned = GROUPS.reduce((sum, g) => sum + groupAssignments[g].length, 0);

  // Manual assignment handlers
  const handleAssignToGroup = (targetGroup: GroupLetter) => {
    if (!selectedPoolTeamId) return;
    if (groupAssignments[targetGroup].length >= 4) return;

    const teamToAssign = unassignedPool.find((t) => t.id === selectedPoolTeamId);
    if (!teamToAssign) return;

    const updatedTeam: Team = {
      ...teamToAssign,
      group_id: targetGroup,
      pot: groupAssignments[targetGroup].length + 1,
    };

    setGroupAssignments((prev) => ({
      ...prev,
      [targetGroup]: [...prev[targetGroup], updatedTeam],
    }));

    setUnassignedPool((prev) => prev.filter((t) => t.id !== selectedPoolTeamId));
    setSelectedPoolTeamId(null);
  };

  const handleRemoveFromGroup = (group: GroupLetter, teamId: string) => {
    const teamToRemove = groupAssignments[group].find((t) => t.id === teamId);
    if (!teamToRemove) return;

    const unassignedTeam: Team = {
      ...teamToRemove,
      group_id: null,
      pot: undefined,
    };

    setGroupAssignments((prev) => ({
      ...prev,
      [group]: prev[group].filter((t) => t.id !== teamId),
    }));

    setUnassignedPool((prev) => [...prev, unassignedTeam]);
  };

  const handleAutoFillRemaining = () => {
    if (unassignedPool.length === 0) return;
    const shuffledPool = shuffleArray([...unassignedPool]);
    const updatedAssignments = { ...groupAssignments };
    const remainingToPlace: Team[] = [];

    shuffledPool.forEach((team) => {
      const openGroup = GROUPS.find((g) => updatedAssignments[g].length < 4);
      if (openGroup) {
        updatedAssignments[openGroup] = [
          ...updatedAssignments[openGroup],
          { ...team, group_id: openGroup, pot: updatedAssignments[openGroup].length + 1 },
        ];
      } else {
        remainingToPlace.push(team);
      }
    });

    setGroupAssignments(updatedAssignments);
    setUnassignedPool(remainingToPlace);
  };

  // Step 4 -> 5: Generate fixtures preview
  const handleProceedToFixtures = () => {
    const fixtures = generateIntraGroupFixtures(groupAssignments);
    setGeneratedMatchesPreview(fixtures);
    setCurrentStep(5);
  };

  // Step 5 -> 6 / Complete setup
  const handleFinalSubmit = async () => {
    setIsCreating(true);
    try {
      const profileId = `tourney-${Date.now()}`;
      const newProfile: TournamentProfile = {
        id: profileId,
        name: tournamentName.trim() || 'New eFootball Tournament',
        created_at: new Date().toISOString(),
        last_saved_at: new Date().toISOString(),
        current_phase: 'Group Stage - Round 1/6',
        group_mode: groupMode,
        avatar_id: selectedAvatarId,
        avatar_color: selectedColor,
      };

      const finalTeams: Team[] = [];
      GROUPS.forEach((g) => {
        groupAssignments[g].forEach((t) => {
          finalTeams.push({
            ...t,
            tournament_id: profileId,
            group_id: g,
          });
        });
      });

      const finalMatches: Match[] = generatedMatchesPreview.map((m) => ({
        ...m,
        tournament_id: profileId,
      }));

      await onCompleteNewTournament(newProfile, finalTeams, finalMatches);
      setCurrentStep(6);
      setTimeout(() => {
        onClose();
      }, 1200);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Progress & Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  New Tournament Onboarding Wizard
                </h2>
                <p className="text-xs text-slate-400">
                  Step {currentStep} of 6 — Complete Season Setup
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Dots / Bars */}
          <div className="grid grid-cols-6 gap-2">
            {[
              { num: 1, label: 'Identity' },
              { num: 2, label: 'Roster' },
              { num: 3, label: 'Draw Mode' },
              { num: 4, label: 'Group Review' },
              { num: 5, label: 'Fixtures' },
              { num: 6, label: 'Launch' },
            ].map((s) => (
              <div key={s.num} className="flex flex-col gap-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    currentStep >= s.num ? 'bg-blue-500' : 'bg-slate-800'
                  }`}
                />
                <span className="hidden sm:block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/50">
          {/* ================= STEP 1: IDENTITY & AVATAR ================= */}
          {currentStep === 1 && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Name Your Tournament</h3>
                <p className="text-xs text-slate-500">
                  Give your savefile a title and select a profile icon to recognize it in the switcher.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    placeholder="e.g. Season 1 - E-Championship"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Profile Avatar Badge
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {AVATAR_OPTIONS.map((avatar) => {
                      const Icon = avatar.icon;
                      const isSelected = selectedAvatarId === avatar.id;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setSelectedAvatarId(avatar.id)}
                          className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 border transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${avatar.bg}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-semibold text-center leading-tight">
                            {avatar.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Theme Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    {[
                      { name: 'Royal Blue', hex: '#2563eb' },
                      { name: 'Emerald', hex: '#059669' },
                      { name: 'Amber Gold', hex: '#d97706' },
                      { name: 'Crimson', hex: '#dc2626' },
                      { name: 'Violet', hex: '#7c3aed' },
                      { name: 'Midnight', hex: '#0f172a' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setSelectedColor(c.hex)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          selectedColor === c.hex
                            ? 'scale-110 border-slate-900 shadow-xs'
                            : 'border-white opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: ROSTER & LOGOS REVIEW (4x6 GRID) ================= */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Tournament Roster & Authentic Club Crests (24 Teams)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verify all 24 registered player-club pairings participating in this season.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold shrink-0">
                  24 Clubs Registered
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {baseTeams.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col items-center text-center shadow-2xs hover:shadow-xs transition-shadow"
                  >
                    <div className="relative mb-2">
                      <ClubCrest
                        logoUrl={team.logo_url}
                        clubName={team.club_crest_name}
                        teamName={team.name}
                        size="md"
                        className="p-1.5"
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 line-clamp-1">{team.name}</div>
                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {team.club_crest_name || 'Club'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 3: GROUP ASSIGNMENT MODE TOGGLE ================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Group Creation Mode</h3>
                  <p className="text-xs text-slate-500">
                    Choose between automated Fisher-Yates draw or custom manual group drafting.
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-slate-200/80 p-1">
                  <button
                    onClick={() => {
                      setGroupMode('auto');
                      performAutoShuffle();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      groupMode === 'auto'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Mode A: Auto Shuffle</span>
                  </button>
                  <button
                    onClick={() => setGroupMode('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      groupMode === 'manual'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Mode B: Manual Draft</span>
                  </button>
                </div>
              </div>

              {/* Mode A: Automatic Shuffle */}
              {groupMode === 'auto' && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                    <Shuffle className={`w-8 h-8 ${isShufflingAnimation ? 'animate-spin' : ''}`} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">
                      Automated Fisher-Yates Group Draw
                    </h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                      Randomly shuffles all 24 teams through Pots 1 to 4 and balances them cleanly into 6 equal groups (Groups A to F, 4 teams each).
                    </p>
                  </div>

                  {isShufflingAnimation ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{shuffleText}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => performAutoShuffle()}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs"
                    >
                      <Dices className="w-4 h-4" />
                      <span>Re-Shuffle Groups</span>
                    </button>
                  )}
                </div>
              )}

              {/* Mode B: Manual Drafting & Groups */}
              {groupMode === 'manual' && (
                <div className="space-y-4">
                  {/* Unassigned Pool Bar */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        Unassigned Teams Pool ({unassignedPool.length} Remaining)
                      </span>
                      {unassignedPool.length > 0 && (
                        <button
                          onClick={handleAutoFillRemaining}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Auto-Fill Remaining</span>
                        </button>
                      )}
                    </div>

                    {unassignedPool.length === 0 ? (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>All 24 clubs have been assigned to groups!</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
                        {unassignedPool.map((team) => (
                          <button
                            key={team.id}
                            onClick={() =>
                              setSelectedPoolTeamId(
                                selectedPoolTeamId === team.id ? null : team.id
                              )
                            }
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                              selectedPoolTeamId === team.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <ClubCrest
                              logoUrl={team.logo_url}
                              clubName={team.club_crest_name}
                              teamName={team.name}
                              size="xs"
                            />
                            <span>{team.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 6 Group Slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GROUPS.map((letter) => {
                      const teamsInGroup = groupAssignments[letter];
                      const isFull = teamsInGroup.length >= 4;

                      return (
                        <div
                          key={letter}
                          className={`bg-white rounded-xl border p-4 shadow-xs transition-colors ${
                            isFull ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-800">
                              Group {letter} ({teamsInGroup.length}/4)
                            </span>
                            {!isFull && selectedPoolTeamId && (
                              <button
                                onClick={() => handleAssignToGroup(letter)}
                                className="px-2 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700"
                              >
                                + Add Selected
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5 min-h-[140px]">
                            {teamsInGroup.map((t) => (
                              <div
                                key={t.id}
                                className="flex items-center justify-between px-2 py-1.5 bg-slate-50 rounded-lg text-xs"
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <ClubCrest
                                    logoUrl={t.logo_url}
                                    clubName={t.club_crest_name}
                                    teamName={t.name}
                                    size="xs"
                                  />
                                  <span className="font-bold text-slate-900 truncate">
                                    {t.name}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromGroup(letter, t.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            {Array.from({ length: 4 - teamsInGroup.length }).map((_, i) => (
                              <div
                                key={i}
                                className="border border-dashed border-slate-200 rounded-lg h-8 flex items-center justify-center text-[11px] text-slate-400"
                              >
                                Empty Slot
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 4: GROUP REVIEW (6 CARDS A to F) ================= */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Group Review & Draw Confirmation
                  </h3>
                  <p className="text-xs text-slate-500">
                    Review the 6 groups of 4 teams each before generating fixtures.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  All 6 Groups Full & Valid
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GROUPS.map((letter) => (
                  <div
                    key={letter}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs"
                  >
                    <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs font-bold">
                      <span>GROUP {letter}</span>
                      <span className="text-[10px] text-blue-400">4 TEAMS</span>
                    </div>
                    <div className="divide-y divide-slate-100 p-2">
                      {groupAssignments[letter].map((t, idx) => (
                        <div key={t.id} className="flex items-center gap-3 p-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                            P{t.pot || idx + 1}
                          </span>
                          <ClubCrest
                            logoUrl={t.logo_url}
                            clubName={t.club_crest_name}
                            teamName={t.name}
                            size="sm"
                          />
                          <div className="truncate">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {t.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {t.club_crest_name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= STEP 5: AUTOMATED FIXTURE GENERATOR ================= */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Automated Fixture Generator (72 Group Matches)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Strict Intra-Group Double Round-Robin algorithm generated 6 rounds per group (3 home, 3 away per team).
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold">
                    6 Rounds · 72 Ties Total
                  </span>
                </div>
              </div>

              {/* Sample Preview of Generated Matches */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-4 py-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Match Schedule Preview (First 8 of 72 Fixtures)</span>
                  <span className="text-blue-600 font-semibold">Home vs Away Balanced</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {generatedMatchesPreview.slice(0, 8).map((m, idx) => {
                    const homeTeam = baseTeams.find((t) => t.id === m.home_team_id);
                    const awayTeam = baseTeams.find((t) => t.id === m.away_team_id);

                    return (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 w-28 text-slate-500 font-semibold text-[11px]">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            Gr {m.group_id}
                          </span>
                          <span>Round {m.round_number}</span>
                        </div>

                        <div className="flex items-center justify-center gap-3 flex-1">
                          <div className="flex items-center gap-2 justify-end w-36 font-bold text-slate-900 truncate">
                            <span className="truncate">{homeTeam?.name || 'Home Team'}</span>
                            {homeTeam && (
                              <ClubCrest
                                logoUrl={homeTeam.logo_url}
                                clubName={homeTeam.club_crest_name}
                                teamName={homeTeam.name}
                                size="xs"
                              />
                            )}
                          </div>

                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
                            VS
                          </span>

                          <div className="flex items-center gap-2 justify-start w-36 font-bold text-slate-900 truncate">
                            {awayTeam && (
                              <ClubCrest
                                logoUrl={awayTeam.logo_url}
                                clubName={awayTeam.club_crest_name}
                                teamName={awayTeam.name}
                                size="xs"
                              />
                            )}
                            <span className="truncate">{awayTeam?.name || 'Away Team'}</span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-400 font-medium">Leg {m.leg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 6: LAUNCH / SUCCESS ================= */}
          {currentStep === 6 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Tournament Created Successfully!
              </h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                All 24 clubs have been assigned to Groups A–F, 72 group fixtures are generated, and the savefile has been initialized. Redirecting to your dashboard...
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        {currentStep < 6 && (
          <div className="p-4 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as WizardStep)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  disabled={!tournamentName.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>Next: Review Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Next: Choose Draw Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 3 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  disabled={!isAllGroupsValid}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <span>Next: Review Groups</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 4 && (
                <button
                  type="button"
                  onClick={handleProceedToFixtures}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Generate 72 Fixtures</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {currentStep === 5 && (
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isCreating}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {isCreating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlayCircle className="w-4 h-4" />
                  )}
                  <span>{isCreating ? 'Initializing Savefile...' : 'Launch Tournament'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
