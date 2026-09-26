/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Match, Team, TournamentProfile } from './types/tournament';
import { INITIAL_TEAMS } from './lib/constants';
import { Navbar, TabType } from './components/Navbar';
import { GroupStandingsView } from './components/GroupStandingsView';
import { ThirdPlaceMiniLeague } from './components/ThirdPlaceMiniLeague';
import { FixturesAndResultsView } from './components/FixturesAndResultsView';
import { KnockoutBracketView } from './components/KnockoutBracketView';
import { StatsAndTrendsDashboard } from './components/StatsAndTrendsDashboard';
import { TournamentWallOfFame } from './components/TournamentWallOfFame';
import { TeamsListView } from './components/TeamsListView';
import { SupabaseSettingsView } from './components/SupabaseSettingsView';
import { MatchScoreModal } from './components/MatchScoreModal';
import { DrawModal } from './components/DrawModal';
import { GroupAssignmentSetupWizard } from './components/GroupAssignmentSetupWizard';
import { ProfileSelectionModal } from './components/ProfileSelectionModal';
import { NewTournamentOnboardingWizard } from './components/NewTournamentOnboardingWizard';

function TournamentAppInner() {
  const {
    activeTournamentId,
    activeProfile,
    profiles,
    teams,
    matches,
    syncStatus,
    isSupabaseConnected,
    finalIsTwoLegs,
    refreshData,
    setActiveTournamentId,
    saveMatchScore,
    deleteProfile,
    createTournament,
    updateTeams,
    setTeams,
    setMatches,
    setFinalIsTwoLegs,
  } = useTournament();

  const [currentTab, setCurrentTab] = useState<TabType>('groups');
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<Match | null>(null);
  const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNewTournamentWizardOpen, setIsNewTournamentWizardOpen] = useState(false);

  const handleOpenScoreModal = () => {
    const firstUnplayed = matches.find((m) => !m.is_played) || matches[0];
    if (firstUnplayed) {
      setSelectedMatchForModal(firstUnplayed);
    }
  };

  const playedMatchesCount = matches.filter((m) => m.is_played).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Navigation conforming to Top Bar Contract */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isSupabaseConnected={isSupabaseConnected}
        syncStatus={syncStatus}
        activeProfile={activeProfile}
        onOpenProfileSelector={() => setIsProfileModalOpen(true)}
        onOpenScoreModal={handleOpenScoreModal}
        onOpenSetupWizard={() => setIsNewTournamentWizardOpen(true)}
        matchesPlayedCount={playedMatchesCount}
        totalMatchesCount={matches.length}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 w-full max-w-[1800px] 2xl:max-w-[2200px] mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 sm:py-6">
        {currentTab === 'groups' && (
          <GroupStandingsView
            teams={teams}
            matches={matches}
            onOpenMatchScore={(m) => setSelectedMatchForModal(m)}
            onNavigateToThirdPlace={() => setCurrentTab('third_place')}
            onOpenSetupWizard={() => setIsNewTournamentWizardOpen(true)}
          />
        )}

        {currentTab === 'third_place' && (
          <ThirdPlaceMiniLeague
            teams={teams}
            matches={matches}
            onNavigateToKnockout={() => setCurrentTab('knockout')}
          />
        )}

        {currentTab === 'fixtures' && (
          <FixturesAndResultsView
            teams={teams}
            matches={matches}
            onSaveMatchScore={saveMatchScore}
            onRefreshMatches={refreshData}
          />
        )}

        {currentTab === 'knockout' && (
          <KnockoutBracketView
            teams={teams}
            matches={matches}
            onOpenMatchScore={(m) => setSelectedMatchForModal(m)}
            onUpdateMatches={setMatches}
            finalIsTwoLegs={finalIsTwoLegs}
            onToggleFinalLegs={setFinalIsTwoLegs}
          />
        )}

        {currentTab === 'stats' && (
          <StatsAndTrendsDashboard
            teams={teams}
            matches={matches}
            onOpenScoreModal={(m) => setSelectedMatchForModal(m)}
          />
        )}

        {currentTab === 'wall_of_fame' && (
          <TournamentWallOfFame
            teams={teams}
            matches={matches}
          />
        )}

        {currentTab === 'teams' && (
          <TeamsListView
            teams={teams}
            onUpdateTeams={updateTeams}
            onConductDraw={() => setIsNewTournamentWizardOpen(true)}
          />
        )}

        {currentTab === 'supabase_guide' && (
          <SupabaseSettingsView
            teams={teams}
            matches={matches}
            isSupabaseConnected={isSupabaseConnected}
            onConnectionChange={() => refreshData()}
            onDataLoaded={(newTeams, newMatches) => {
              setTeams(newTeams);
              setMatches(newMatches);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-[1800px] 2xl:max-w-[2200px] mx-auto px-3 sm:px-5 md:px-6 lg:px-8 xl:px-10 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">
              eFootball Tournament Manager
            </span>{' '}
            · Active: <strong className="text-slate-900">{activeProfile.name}</strong> · Profile ID: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-mono text-slate-700">{activeTournamentId}</code>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              Switch Savefile
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setCurrentTab('supabase_guide')}
              className="hover:text-slate-900 transition-colors"
            >
              Supabase SQL Schema
            </button>
            <span aria-hidden="true">·</span>
            <span>Intra-Group Double Round-Robin</span>
          </div>
        </div>
      </footer>

      {/* Match Score Modal */}
      <MatchScoreModal
        isOpen={!!selectedMatchForModal}
        onClose={() => setSelectedMatchForModal(null)}
        match={selectedMatchForModal}
        teams={teams}
        allMatches={matches}
        onSaveScore={saveMatchScore}
      />

      {/* Official Draw Modal */}
      <DrawModal
        isOpen={isDrawModalOpen}
        onClose={() => setIsDrawModalOpen(false)}
        teams={teams}
        onApplyDraw={(newTeams, newMatches) => {
          setTeams(newTeams);
          setMatches(newMatches);
        }}
      />

      {/* Step-by-Step Group Assignment Wizard */}
      <GroupAssignmentSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        teams={teams}
        onCompleteSetup={(newTeams, newMatches) => {
          setTeams(newTeams);
          setMatches(newMatches);
        }}
      />

      {/* Netflix-Style Profile Selection Screen */}
      <ProfileSelectionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeTournamentId}
        onSelectProfile={async (id) => {
          await setActiveTournamentId(id);
          setIsProfileModalOpen(false);
        }}
        onOpenNewTournamentWizard={() => {
          setIsProfileModalOpen(false);
          setIsNewTournamentWizardOpen(true);
        }}
        onDeleteProfile={deleteProfile}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* 6-Step New Tournament Onboarding Wizard */}
      <NewTournamentOnboardingWizard
        isOpen={isNewTournamentWizardOpen}
        onClose={() => setIsNewTournamentWizardOpen(false)}
        baseTeams={INITIAL_TEAMS}
        onCompleteNewTournament={async (newProfile, assignedTeams, fixtures) => {
          await createTournament(newProfile, assignedTeams, fixtures);
          setCurrentTab('groups');
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <TournamentAppInner />
    </TournamentProvider>
  );
}
