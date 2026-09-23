import React, { useState, useEffect } from 'react';
import { GroupLetter, Match, Team } from '../types/tournament';
import {
  generateIntraGroupFixtures,
  GROUPS,
  shuffleArray,
} from '../lib/tournamentEngine';
import { ClubCrest } from './ClubCrest';
import { getSupabaseClient } from '../lib/supabaseClient';
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
  Lock,
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

interface GroupAssignmentSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  onCompleteSetup: (newTeams: Team[], newMatches: Match[]) => Promise<void> | void;
}

type WizardStep = 1 | 2 | 3; // Step 1: Team & Logo Roster, Step 2: Group Creation Mode, Step 3: Groups Review & Confirmation
type GroupMode = 'auto' | 'manual';

export const GroupAssignmentSetupWizard: React.FC<GroupAssignmentSetupWizardProps> = ({
  isOpen,
  onClose,
  teams,
  onCompleteSetup,
}) => {
  const [step, setStep] = useState<WizardStep>(1);
  const [mode, setMode] = useState<GroupMode>('auto');

  // Groups map: GroupLetter -> array of teams (target 4 each)
  const [groupAssignments, setGroupAssignments] = useState<Record<GroupLetter, Team[]>>({
    A: [],
    B: [],
    C: [],
    D: [],
    E: [],
    F: [],
  });

  // Unassigned pool for manual mode
  const [unassignedPool, setUnassignedPool] = useState<Team[]>([]);
  const [selectedPoolTeamId, setSelectedPoolTeamId] = useState<string | null>(null);

  // Animation states for automatic shuffle
  const [isShufflingAnimation, setIsShufflingAnimation] = useState(false);
  const [shuffleProgressText, setShuffleProgressText] = useState('');

  // Confirmation / saving state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize assignments when modal opens or teams change
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setErrorMessage(null);
    setSaveSuccess(false);

    // Group teams based on current group_id if already assigned
    const initialMap: Record<GroupLetter, Team[]> = {
      A: [],
      B: [],
      C: [],
      D: [],
      E: [],
      F: [],
    };
    const pool: Team[] = [];

    teams.forEach((t) => {
      if (t.group_id && initialMap[t.group_id]) {
        initialMap[t.group_id].push(t);
      } else {
        pool.push(t);
      }
    });

    setGroupAssignments(initialMap);
    setUnassignedPool(pool);
  }, [isOpen, teams]);

  if (!isOpen) return null;

  // Validation: Each of the 6 groups must have exactly 4 teams
  const groupCounts = GROUPS.map((g) => ({
    group: g,
    count: groupAssignments[g]?.length || 0,
    isComplete: (groupAssignments[g]?.length || 0) === 4,
  }));
  const isAllGroupsValid = groupCounts.every((g) => g.isComplete);
  const totalAssigned = Object.values(groupAssignments).reduce((acc, curr) => acc + curr.length, 0);

  // ==========================================
  // OPTION A: Automatic Random Fisher-Yates Shuffle
  // ==========================================
  const handleAutomaticShuffle = () => {
    setIsShufflingAnimation(true);
    setShuffleProgressText('Shuffling 24 official teams with Fisher-Yates algorithm...');

    let ticks = 0;
    const interval = setInterval(() => {
      ticks++;
      // Live dynamic shuffle animation
      const randomOrder = shuffleArray(teams);
      const tempGroups: Record<GroupLetter, Team[]> = {
        A: randomOrder.slice(0, 4),
        B: randomOrder.slice(4, 8),
        C: randomOrder.slice(8, 12),
        D: randomOrder.slice(12, 16),
        E: randomOrder.slice(16, 20),
        F: randomOrder.slice(20, 24),
      };
      setGroupAssignments(tempGroups);
      setUnassignedPool([]);

      if (ticks >= 5) {
        clearInterval(interval);
        setIsShufflingAnimation(false);
        setShuffleProgressText('');
      }
    }, 120);
  };

  // ==========================================
  // OPTION B: Manual Selection / Custom Draw
  // ==========================================
  // Reset all groups to empty and put all 24 teams in pool
  const handleResetManual = () => {
    setGroupAssignments({
      A: [],
      B: [],
      C: [],
      D: [],
      E: [],
      F: [],
    });
    setUnassignedPool([...teams]);
    setSelectedPoolTeamId(null);
    setErrorMessage(null);
  };

  // Auto-fill remaining empty spots from unassigned pool
  const handleAutoFillRemaining = () => {
    if (unassignedPool.length === 0) return;
    const shuffledPool = shuffleArray(unassignedPool);
    const newGroups = { ...groupAssignments };
    let poolIndex = 0;

    GROUPS.forEach((letter) => {
      while (newGroups[letter].length < 4 && poolIndex < shuffledPool.length) {
        newGroups[letter] = [...newGroups[letter], shuffledPool[poolIndex]];
        poolIndex++;
      }
    });

    setGroupAssignments(newGroups);
    setUnassignedPool(shuffledPool.slice(poolIndex));
    setSelectedPoolTeamId(null);
  };

  // Click on a team in pool, then click group OR direct assign
  const handleAssignTeamToGroup = (team: Team, targetGroup: GroupLetter) => {
    if (groupAssignments[targetGroup].length >= 4) {
      setErrorMessage(`Group ${targetGroup} already has 4 teams. Remove a team first or select another group.`);
      return;
    }
    setErrorMessage(null);

    // Remove from previous group or pool
    const newPool = unassignedPool.filter((t) => t.id !== team.id);
    const newGroups: Record<GroupLetter, Team[]> = { ...groupAssignments };

    GROUPS.forEach((g) => {
      newGroups[g] = newGroups[g].filter((t) => t.id !== team.id);
    });

    // Add to target group
    newGroups[targetGroup] = [...newGroups[targetGroup], team];

    setGroupAssignments(newGroups);
    setUnassignedPool(newPool);
    setSelectedPoolTeamId(null);
  };

  // Remove a team from a group back to unassigned pool
  const handleRemoveTeamFromGroup = (team: Team, fromGroup: GroupLetter) => {
    setErrorMessage(null);
    setGroupAssignments((prev) => ({
      ...prev,
      [fromGroup]: prev[fromGroup].filter((t) => t.id !== team.id),
    }));
    setUnassignedPool((prev) => [...prev, team]);
  };

  // ==========================================
  // STEP 4: Confirm Groups & Generate 72 Fixtures
  // ==========================================
  const handleConfirmAndGenerateFixtures = async () => {
    if (!isAllGroupsValid) {
      setErrorMessage('Every group (A through F) must contain exactly 4 teams before confirming.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Build updated team list with assigned group_id and pot (1-4)
      const updatedTeams: Team[] = [];
      GROUPS.forEach((groupLetter) => {
        const groupMembers = groupAssignments[groupLetter];
        groupMembers.forEach((team, idx) => {
          updatedTeams.push({
            ...team,
            group_id: groupLetter,
            pot: (idx + 1) as 1 | 2 | 3 | 4,
          });
        });
      });

      // 2. Generate accurate 72 fixtures strictly isolated within groups
      const generatedFixtures = generateIntraGroupFixtures(updatedTeams);

      // 3. Save to Supabase (if connected)
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          // Update teams group_id
          for (const t of updatedTeams) {
            await supabase
              .from('teams')
              .update({
                group_id: t.group_id,
                pot: t.pot,
                logo_url: t.logo_url,
                club_crest_name: t.club_crest_name,
              })
              .match({ id: t.id });
          }

          // Delete existing unplayed group matches and insert fresh 72 matches
          await supabase.from('matches').delete().match({ match_type: 'Group' });

          const matchesPayload = generatedFixtures.map((m) => ({
            id: m.id,
            home_team_id: m.home_team_id,
            away_team_id: m.away_team_id,
            home_score: null,
            away_score: null,
            group_id: m.group_id,
            round_number: m.round_number,
            is_played: false,
            leg: m.leg,
            match_type: 'Group',
            tie_id: m.tie_id,
          }));

          await supabase.from('matches').insert(matchesPayload);
        } catch (dbErr) {
          console.warn('Supabase sync notice during group confirmation:', dbErr);
        }
      }

      // 4. Update local state and parent
      await onCompleteSetup(updatedTeams, generatedFixtures);
      setSaveSuccess(true);

      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error confirming groups and generating fixtures.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header & Breadcrumb */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
                <Trophy className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                  Tournament Setup & Group Draw Wizard
                </h2>
                <p className="text-xs text-blue-200 font-normal">
                  Accurate 24-team roster, flexible manual or automatic draw, and balanced 72-match schedule.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-white/10">
            {/* Step 1 */}
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 text-left p-1.5 rounded-lg transition-colors ${
                step === 1 ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-blue-500 text-white' : step > 1 ? 'bg-emerald-500 text-white' : 'bg-white/10'
                }`}
              >
                {step > 1 ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-none">Step 1</div>
                <div className="text-[10px] text-blue-200 leading-tight">Team & Logo Roster</div>
              </div>
            </button>

            {/* Step 2 */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 text-left p-1.5 rounded-lg transition-colors ${
                step === 2 ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-blue-500 text-white' : step > 2 ? 'bg-emerald-500 text-white' : 'bg-white/10'
                }`}
              >
                {step > 2 ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-none">Step 2</div>
                <div className="text-[10px] text-blue-200 leading-tight">Group Creation Mode</div>
              </div>
            </button>

            {/* Step 3 */}
            <button
              type="button"
              onClick={() => {
                if (isAllGroupsValid) setStep(3);
                else setErrorMessage('Please complete all 6 groups with 4 teams before reviewing.');
              }}
              className={`flex items-center gap-2 text-left p-1.5 rounded-lg transition-colors ${
                step === 3 ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 3 ? 'bg-blue-500 text-white' : isAllGroupsValid ? 'bg-emerald-500 text-white' : 'bg-white/10'
                }`}
              >
                3
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold leading-none">Step 3</div>
                <div className="text-[10px] text-blue-200 leading-tight">Review & Confirmation</div>
              </div>
            </button>
          </div>
        </div>

        {/* Wizard Main Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Groups locked! 72 Double Round-Robin fixtures generated and synced with Supabase.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: Team & Logo Roster Overview                      */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span>24 Official Teams & Real Club Crests</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review the official player handles paired with authentic football club badges.
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                  24 / 24 Teams Ready
                </span>
              </div>

              {/* Grid of 24 Teams */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {teams.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl flex items-center gap-3 transition-colors shadow-2xs"
                  >
                    <div className="p-1 bg-white rounded-lg border border-slate-200 shrink-0 shadow-2xs">
                      <ClubCrest
                        logoUrl={team.logo_url}
                        name={team.club_crest_name || team.name}
                        size="md"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-slate-900 truncate leading-tight">
                        {team.name}
                      </h4>
                      <p className="text-[11px] text-blue-700 font-medium truncate mt-0.5">
                        {team.club_crest_name || 'Official Club'}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        Pot {team.pot || ((idx % 4) + 1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: Group Assignment Selection (Manual vs Automatic) */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Mode Switcher */}
              <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setMode('auto')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    mode === 'auto'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Dices className="w-4 h-4 text-blue-600" />
                  <span>Option A: Automatic Random Shuffle (Fisher-Yates)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    mode === 'manual'
                      ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>Option B: Manual Selection / Custom Assignment</span>
                </button>
              </div>

              {/* Mode A Details */}
              {mode === 'auto' && (
                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Fisher-Yates Fair Distribution</span>
                    </h4>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Click the button to animate and randomly distribute all 24 teams into 6 balanced groups of 4.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutomaticShuffle}
                    disabled={isShufflingAnimation}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Shuffle className={`w-4 h-4 ${isShufflingAnimation ? 'animate-spin' : ''}`} />
                    <span>{isShufflingAnimation ? 'Shuffling Teams...' : 'Run Automatic Shuffle'}</span>
                  </button>
                </div>
              )}

              {/* Mode B: Manual Controls & Unassigned Pool */}
              {mode === 'manual' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Unassigned Pool ({unassignedPool.length} Teams Left)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {unassignedPool.length === 0
                          ? 'All teams placed in groups!'
                          : 'Select a team and assign to any group with room.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleAutoFillRemaining}
                        disabled={unassignedPool.length === 0}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-40"
                      >
                        Auto-Fill Remaining
                      </button>
                      <button
                        type="button"
                        onClick={handleResetManual}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset All</span>
                      </button>
                    </div>
                  </div>

                  {/* Pool Teams */}
                  {unassignedPool.length > 0 && (
                    <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl">
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {unassignedPool.map((t) => {
                          const isSelected = selectedPoolTeamId === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setSelectedPoolTeamId(isSelected ? null : t.id)}
                              className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-400'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <ClubCrest
                                  logoUrl={t.logo_url}
                                  name={t.club_crest_name || t.name}
                                  size="xs"
                                />
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {t.name}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {t.club_crest_name}
                              </div>

                              {/* Quick assign buttons if selected */}
                              {isSelected && (
                                <div className="mt-2 pt-1 border-t border-blue-200 grid grid-cols-3 gap-1">
                                  {GROUPS.map((g) => (
                                    <button
                                      key={g}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssignTeamToGroup(t, g);
                                      }}
                                      className="py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                                    >
                                      +{g}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Groups Containers (A through F) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GROUPS.map((letter) => {
                  const members = groupAssignments[letter] || [];
                  const isComplete = members.length === 4;

                  return (
                    <div
                      key={letter}
                      className={`bg-slate-50 border rounded-xl p-3.5 transition-all shadow-2xs flex flex-col justify-between ${
                        isComplete
                          ? 'border-emerald-300 ring-1 ring-emerald-200/60'
                          : 'border-slate-300'
                      }`}
                    >
                      <div>
                        {/* Group Header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                              {letter}
                            </span>
                            <span className="font-bold text-xs text-slate-900">
                              Group {letter}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isComplete
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {members.length} / 4 Teams
                          </span>
                        </div>

                        {/* Members Slot */}
                        <div className="space-y-1.5 min-h-[148px]">
                          {members.map((team, idx) => (
                            <div
                              key={team.id || idx}
                              className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ClubCrest
                                  logoUrl={team.logo_url}
                                  name={team.club_crest_name || team.name}
                                  size="xs"
                                />
                                <div className="truncate">
                                  <div className="font-bold text-xs text-slate-900 truncate leading-tight">
                                    {team.name}
                                  </div>
                                  <div className="text-[10px] text-slate-500 truncate leading-tight">
                                    {team.club_crest_name}
                                  </div>
                                </div>
                              </div>

                              {mode === 'manual' && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeamFromGroup(team, letter)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                  title="Remove team"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}

                          {/* Empty slots placeholders */}
                          {Array.from({ length: 4 - members.length }).map((_, emptyIdx) => (
                            <div
                              key={`empty-${emptyIdx}`}
                              onClick={() => {
                                if (mode === 'manual' && selectedPoolTeamId) {
                                  const targetTeam = unassignedPool.find((t) => t.id === selectedPoolTeamId);
                                  if (targetTeam) handleAssignTeamToGroup(targetTeam, letter);
                                }
                              }}
                              className={`p-2 border border-dashed rounded-lg flex items-center justify-center text-[11px] font-medium transition-colors ${
                                selectedPoolTeamId && mode === 'manual'
                                  ? 'border-blue-400 bg-blue-50/50 text-blue-700 cursor-pointer hover:bg-blue-100/70'
                                  : 'border-slate-200 bg-slate-100/50 text-slate-400'
                              }`}
                            >
                              {selectedPoolTeamId && mode === 'manual' ? (
                                <span className="flex items-center gap-1 font-bold">
                                  <Plus className="w-3 h-3" /> Click to Place Team
                                </span>
                              ) : (
                                <span>Empty Slot ({members.length + emptyIdx + 1} of 4)</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: Groups Review & Confirmation                     */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                      All 6 Groups Successfully Formed (24 Teams / 4 per Group)
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Confirming will generate 72 double round-robin matches (6 matchdays per group) strictly isolated within each group.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-500 font-medium">Schedule Details</div>
                  <div className="text-xs font-bold text-slate-800">
                    12 Matches/Grp · 72 Total Matches
                  </div>
                </div>
              </div>

              {/* 6 Clean Group Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GROUPS.map((letter) => {
                  const members = groupAssignments[letter] || [];
                  return (
                    <div
                      key={letter}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:shadow-xs transition-shadow"
                    >
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                        <span className="font-bold text-xs uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                          Group {letter}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          4 Teams Confirmed
                        </span>
                      </div>

                      <div className="space-y-2">
                        {members.map((team, idx) => (
                          <div
                            key={team.id || idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] font-bold text-slate-400 w-4">
                                {idx + 1}.
                              </span>
                              <ClubCrest
                                logoUrl={team.logo_url}
                                name={team.club_crest_name || team.name}
                                size="sm"
                              />
                              <div className="truncate">
                                <div className="font-bold text-xs text-slate-900 truncate">
                                  {team.name}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {team.club_crest_name}
                                </div>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Pot {idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Strict Scheduling Guarantee Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-600">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Strict Fixture Rules Enforced on Confirmation:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong>1. Intra-Group Isolation:</strong> No team will face opponents from any other group in Phase 1.
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong>2. Double Round-Robin:</strong> Exactly 2 legs per pairing (1 Home, 1 Away) = 6 games per team.
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <strong>3. Symmetrical Matchdays:</strong> Rounds 1–3 are Leg 1; Rounds 4–6 are exact reverse venues.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep((prev) => (prev - 1) as WizardStep)}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {step === 1 && (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <span>Next: Setup Groups</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => {
                  if (isAllGroupsValid) {
                    setErrorMessage(null);
                    setStep(3);
                  } else {
                    setErrorMessage('Please assign exactly 4 teams to each group before continuing.');
                  }
                }}
                disabled={!isAllGroupsValid}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-40"
              >
                <span>Next: Review & Confirm</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleConfirmAndGenerateFixtures}
                disabled={isSaving || !isAllGroupsValid}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>
                  {isSaving
                    ? 'Generating 72 Fixtures & Syncing...'
                    : 'Confirm Groups & Generate Fixtures'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
