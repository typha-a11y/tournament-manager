/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Match, Team } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import { InstagramPostModal } from './InstagramPostModal';
import {
  Trophy,
  Flame,
  Zap,
  Sparkles,
  ShieldCheck,
  Award,
  Crown,
  ChevronRight,
  TrendingUp,
  Target,
  Swords,
  Layers,
  Instagram,
  Share2,
  Download,
  Grid,
  Square,
} from 'lucide-react';

interface BiggestWinsShowcaseProps {
  matches: Match[];
  teams: Team[];
  onOpenScoreModal?: (match: Match) => void;
  tournamentName?: string;
}

type WinCategory = 'biggest_margin' | 'high_scoring' | 'clean_sheets' | 'knockout_thrillers';
type ViewDisplayMode = 'grid' | 'instagram_sized';

export const BiggestWinsShowcase: React.FC<BiggestWinsShowcaseProps> = ({
  matches,
  teams,
  onOpenScoreModal,
  tournamentName = 'eFootball Tournament',
}) => {
  const [activeCategory, setActiveCategory] = useState<WinCategory>('biggest_margin');
  const [displayMode, setDisplayMode] = useState<ViewDisplayMode>('grid');
  const [selectedMatchForInstagram, setSelectedMatchForInstagram] = useState<{
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    recordTitle: string;
  } | null>(null);

  const teamMap = useMemo(() => {
    const map = new Map<string, Team>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  const getTeam = (id: string): Team => {
    return (
      teamMap.get(id) || {
        id,
        name: 'Team',
        logo_url: '',
        group_id: null,
      }
    );
  };

  // Played matches with valid scores
  const playedMatches = useMemo(() => {
    return matches.filter(
      (m) => m.is_played && m.home_score !== null && m.away_score !== null
    );
  }, [matches]);

  // Process and enrich all decisive matches
  const matchRecords = useMemo(() => {
    return playedMatches.map((m) => {
      const homeScore = m.home_score ?? 0;
      const awayScore = m.away_score ?? 0;
      const totalGoals = homeScore + awayScore;
      const margin = Math.abs(homeScore - awayScore);
      const isDraw = homeScore === awayScore;
      const homeWon = homeScore > awayScore;
      const winner = isDraw ? null : homeWon ? getTeam(m.home_team_id) : getTeam(m.away_team_id);
      const loser = isDraw ? null : homeWon ? getTeam(m.away_team_id) : getTeam(m.home_team_id);
      const winnerScore = homeWon ? homeScore : awayScore;
      const loserScore = homeWon ? awayScore : homeScore;
      const isCleanSheet = !isDraw && loserScore === 0;

      const homeTeam = getTeam(m.home_team_id);
      const awayTeam = getTeam(m.away_team_id);

      return {
        match: m,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        totalGoals,
        margin,
        isDraw,
        winner,
        loser,
        winnerScore,
        loserScore,
        isCleanSheet,
      };
    });
  }, [playedMatches, teamMap]);

  // 1. Top Biggest Margin Wins (Blowouts / Demolitions)
  const biggestMarginWins = useMemo(() => {
    return [...matchRecords]
      .filter((r) => !r.isDraw && r.margin > 0)
      .sort((a, b) => {
        if (b.margin !== a.margin) return b.margin - a.margin;
        return b.winnerScore - a.winnerScore;
      });
  }, [matchRecords]);

  // 2. Highest Scoring Matches (Goal Fests / Thrillers)
  const highestScoringMatches = useMemo(() => {
    return [...matchRecords].sort((a, b) => {
      if (b.totalGoals !== a.totalGoals) return b.totalGoals - a.totalGoals;
      return a.margin - b.margin;
    });
  }, [matchRecords]);

  // 3. Clean Sheet Masterclasses
  const cleanSheetWins = useMemo(() => {
    return [...matchRecords]
      .filter((r) => r.isCleanSheet && r.winnerScore > 0)
      .sort((a, b) => b.winnerScore - a.winnerScore);
  }, [matchRecords]);

  // 4. Knockout Stage Thrillers
  const knockoutWins = useMemo(() => {
    return [...matchRecords]
      .filter((r) => r.match.match_type !== 'Group')
      .sort((a, b) => b.margin - a.margin);
  }, [matchRecords]);

  // Spotlight Champion Match (The #1 biggest win in tournament history)
  const grandSpotlight = biggestMarginWins[0] || highestScoringMatches[0] || null;

  // Selected list according to active category
  const currentList = useMemo(() => {
    switch (activeCategory) {
      case 'biggest_margin':
        return biggestMarginWins;
      case 'high_scoring':
        return highestScoringMatches;
      case 'clean_sheets':
        return cleanSheetWins;
      case 'knockout_thrillers':
        return knockoutWins;
      default:
        return biggestMarginWins;
    }
  }, [activeCategory, biggestMarginWins, highestScoringMatches, cleanSheetWins, knockoutWins]);

  const getCategoryTitle = (cat: WinCategory) => {
    switch (cat) {
      case 'biggest_margin':
        return 'BIGGEST VICTORY MARGIN';
      case 'high_scoring':
        return 'HIGH-SCORING GOAL FEST';
      case 'clean_sheets':
        return 'CLEAN SHEET MASTERCLASS';
      case 'knockout_thrillers':
        return 'KNOCKOUT SHOWDOWN';
      default:
        return 'MATCH HIGHLIGHT';
    }
  };

  if (playedMatches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Match Results Recorded Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Once group stage or knockout fixtures are played, the biggest landslide victories, high-scoring goal fests, and clean-sheet masterclasses will be formatted as Instagram-ready cards with full club crests and statistical breakdowns.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Grand Record Spotlight Hero Banner (ALWAYS LIGHT THEMED) */}
      {grandSpotlight && grandSpotlight.winner && grandSpotlight.loser && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-blue-50/60 p-6 sm:p-8 shadow-md border-2 border-amber-300/80">
          {/* Subtle Ambient Watermark & Lighting */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Badge & Header */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black tracking-wider uppercase shadow-2xs">
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Tournament Record Landslide
              </span>
              <span className="text-xs font-bold text-slate-600">
                {grandSpotlight.match.match_type === 'Group'
                  ? `Group ${grandSpotlight.match.group_id} · Matchday ${grandSpotlight.match.round_number}`
                  : grandSpotlight.match.match_type}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>+{grandSpotlight.margin} Goal Difference Record</span>
              </div>

              {/* Instagram Share Button */}
              <button
                onClick={() =>
                  setSelectedMatchForInstagram({
                    match: grandSpotlight.match,
                    homeTeam: grandSpotlight.homeTeam,
                    awayTeam: grandSpotlight.awayTeam,
                    recordTitle: 'ALL-TIME TOURNAMENT RECORD WIN',
                  })
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition-all"
                title="Create Instagram 1:1 post"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span>Instagram Post Ready (1:1)</span>
              </button>
            </div>
          </div>

          {/* Epic VS Duel Showcase with Large Logos (Light Themed) */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6 py-2">
            {/* Winner Column (Gold Highlighted) */}
            <div className="lg:col-span-5 flex items-center gap-4 sm:gap-6 bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm">
              <div className="relative shrink-0">
                <ClubCrest
                  logoUrl={grandSpotlight.winner.logo_url}
                  clubName={grandSpotlight.winner.club_crest_name}
                  teamName={grandSpotlight.winner.name}
                  size="2xl"
                  className="relative ring-4 ring-amber-400/80 bg-white p-1 shadow-md"
                />
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 p-1.5 rounded-full shadow-md font-black">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Victor
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    Group {grandSpotlight.winner.group_id || '-'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 truncate mt-1">
                  {grandSpotlight.winner.name}
                </h2>
                <div className="text-xs text-slate-600 font-bold truncate">
                  {grandSpotlight.winner.club_crest_name}
                </div>
                {(grandSpotlight.winner.whatsapp || grandSpotlight.winner.phone) && (
                  <div className="text-[11px] text-emerald-700 font-mono font-bold mt-0.5">
                    @{grandSpotlight.winner.whatsapp || grandSpotlight.winner.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Middle Scoreboard Badge */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center text-center py-2">
              <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1">
                Final Score
              </div>
              <div className="inline-flex items-center justify-center gap-3 px-6 py-2.5 rounded-2xl bg-slate-900 text-white shadow-xl">
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                  {grandSpotlight.winnerScore}
                </span>
                <span className="text-2xl font-bold text-slate-500">-</span>
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-200">
                  {grandSpotlight.loserScore}
                </span>
              </div>
              <div className="mt-2 text-xs font-black text-amber-800 flex items-center gap-1 justify-center">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {grandSpotlight.isCleanSheet ? 'Clean Sheet Demolition' : `${grandSpotlight.totalGoals} Total Goals`}
              </div>
            </div>

            {/* Defeated Opponent Column */}
            <div className="lg:col-span-5 flex items-center gap-4 sm:gap-6 bg-white/90 p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="min-w-0 flex-1 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-xs text-slate-500 font-mono font-bold">
                    Group {grandSpotlight.loser.group_id || '-'}
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Opponent
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 truncate mt-1">
                  {grandSpotlight.loser.name}
                </h2>
                <div className="text-xs text-slate-500 font-bold truncate">
                  {grandSpotlight.loser.club_crest_name}
                </div>
                {(grandSpotlight.loser.whatsapp || grandSpotlight.loser.phone) && (
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    @{grandSpotlight.loser.whatsapp || grandSpotlight.loser.phone}
                  </div>
                )}
              </div>

              <ClubCrest
                logoUrl={grandSpotlight.loser.logo_url}
                clubName={grandSpotlight.loser.club_crest_name}
                teamName={grandSpotlight.loser.name}
                size="2xl"
                className="shrink-0 ring-2 ring-slate-200 bg-white p-1 opacity-80"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Category Selector & View Switcher Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Tournament Records & Match Hall of Fame
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Browse biggest margin blowouts, epic high-scoring thrillers, and shutout victories.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher (Grid vs Instagram Post Sized) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  displayMode === 'grid'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Standard Grid</span>
              </button>

              <button
                onClick={() => setDisplayMode('instagram_sized')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  displayMode === 'instagram_sized'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-indigo-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Instagram className="w-3.5 h-3.5 text-rose-500" />
                <span>Instagram Post Ready (1:1)</span>
              </button>
            </div>

            {/* Tab Category Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 overflow-x-auto">
              <button
                onClick={() => setActiveCategory('biggest_margin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'biggest_margin'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-600" />
                <span>Biggest Margins ({biggestMarginWins.length})</span>
              </button>

              <button
                onClick={() => setActiveCategory('high_scoring')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'high_scoring'
                    ? 'bg-white text-amber-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Goal Fests ({highestScoringMatches.length})</span>
              </button>

              <button
                onClick={() => setActiveCategory('clean_sheets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                  activeCategory === 'clean_sheets'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Shutouts ({cleanSheetWins.length})</span>
              </button>

              {knockoutWins.length > 0 && (
                <button
                  onClick={() => setActiveCategory('knockout_thrillers')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 ${
                    activeCategory === 'knockout_thrillers'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Swords className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Knockout Drama ({knockoutWins.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Cards Viewport (Standard Grid OR Instagram-Sized 1:1 Cards) */}
      {displayMode === 'instagram_sized' ? (
        /* INSTAGRAM 1:1 POST SIZED CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center">
          {currentList.slice(0, 9).map((record, index) => {
            const isHomeWinner = record.homeScore > record.awayScore;
            const isAwayWinner = record.awayScore > record.homeScore;
            const winner = isHomeWinner ? record.homeTeam : isAwayWinner ? record.awayTeam : null;

            return (
              <div
                key={record.match.id || index}
                className="w-full max-w-[420px] aspect-square bg-gradient-to-br from-white via-slate-50 to-blue-50/50 rounded-3xl border-2 border-slate-200 p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Background Sport Watermark (Always Light) */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* Top Instagram Card Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-[11px] font-black text-slate-900 tracking-wider">
                        {tournamentName}
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">
                        {record.match.match_type === 'Group'
                          ? `GROUP ${record.match.group_id} · ROUND ${record.match.round_number}`
                          : record.match.match_type}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-900 text-white">
                    +{record.margin} MARGIN
                  </span>
                </div>

                {/* Center Match Duel with Large Logos */}
                <div className="bg-white/95 rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="grid grid-cols-12 items-center gap-2">
                    {/* Home Team */}
                    <div className="col-span-5 flex flex-col items-center text-center">
                      <div className="relative mb-1.5">
                        <ClubCrest
                          logoUrl={record.homeTeam.logo_url}
                          clubName={record.homeTeam.club_crest_name}
                          teamName={record.homeTeam.name}
                          size="xl"
                          className={isHomeWinner ? 'ring-3 ring-emerald-500 bg-white shadow-sm' : 'bg-white opacity-85'}
                        />
                        {isHomeWinner && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow">
                            <Crown className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-full">
                        {record.homeTeam.name}
                      </h4>
                      <div className="text-[10px] text-slate-500 font-bold truncate max-w-full">
                        {record.homeTeam.club_crest_name}
                      </div>
                    </div>

                    {/* Score Center */}
                    <div className="col-span-2 flex flex-col items-center justify-center text-center">
                      <div className="px-2 py-1 rounded-lg bg-slate-900 text-white shadow-sm font-mono font-black text-lg">
                        <span>{record.homeScore}</span>
                        <span className="text-slate-400 text-xs mx-1">-</span>
                        <span>{record.awayScore}</span>
                      </div>
                      <span className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase">FT</span>
                    </div>

                    {/* Away Team */}
                    <div className="col-span-5 flex flex-col items-center text-center">
                      <div className="relative mb-1.5">
                        <ClubCrest
                          logoUrl={record.awayTeam.logo_url}
                          clubName={record.awayTeam.club_crest_name}
                          teamName={record.awayTeam.name}
                          size="xl"
                          className={isAwayWinner ? 'ring-3 ring-emerald-500 bg-white shadow-sm' : 'bg-white opacity-85'}
                        />
                        {isAwayWinner && (
                          <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white p-0.5 rounded-full shadow">
                            <Crown className="w-3 h-3 fill-white" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-black text-slate-900 truncate max-w-full">
                        {record.awayTeam.name}
                      </h4>
                      <div className="text-[10px] text-slate-500 font-bold truncate max-w-full">
                        {record.awayTeam.club_crest_name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Strip with 1-Click Instagram Post Generation */}
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <Target className="w-3 h-3 text-blue-600" />
                    <span>{record.totalGoals} Goals</span>
                    {record.isCleanSheet && <span className="text-emerald-700 font-black">· Clean Sheet</span>}
                  </div>

                  <button
                    onClick={() =>
                      setSelectedMatchForInstagram({
                        match: record.match,
                        homeTeam: record.homeTeam,
                        awayTeam: record.awayTeam,
                        recordTitle: `${getCategoryTitle(activeCategory)} #${index + 1}`,
                      })
                    }
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition-opacity"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Export 1:1</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* STANDARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {currentList.slice(0, 9).map((record, index) => {
            const isHomeWinner = record.homeScore > record.awayScore;
            const isAwayWinner = record.awayScore > record.homeScore;

            return (
              <div
                key={record.match.id || index}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group"
              >
                {/* Background Glow Accent (Always Light) */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none opacity-20 ${
                    record.margin >= 3 ? 'bg-amber-400' : 'bg-blue-400'
                  }`}
                />

                {/* Card Header Info */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {record.match.match_type === 'Group'
                          ? `Group ${record.match.group_id} · Round ${record.match.round_number}`
                          : record.match.match_type}
                      </span>
                    </div>

                    {/* Badge */}
                    {record.margin > 0 ? (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          record.margin >= 4
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : record.margin >= 3
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-blue-800 border-blue-200'
                        }`}
                      >
                        <Zap className="w-3 h-3" />
                        +{record.margin} Margin
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Draw ({record.totalGoals} Goals)
                      </span>
                    )}
                  </div>

                  {/* Score & Large Crests Arena */}
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                    <div className="grid grid-cols-12 items-center gap-3">
                      {/* Home Team Side */}
                      <div className="col-span-5 flex flex-col items-center text-center">
                        <div className="relative mb-2">
                          <ClubCrest
                            logoUrl={record.homeTeam.logo_url}
                            clubName={record.homeTeam.club_crest_name}
                            teamName={record.homeTeam.name}
                            size="xl"
                            className={isHomeWinner ? 'ring-2 ring-emerald-500 bg-white shadow-sm' : 'bg-white opacity-85'}
                          />
                          {isHomeWinner && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full shadow">
                              <Crown className="w-3 h-3 fill-white" />
                            </div>
                          )}
                        </div>
                        <h4
                          className={`text-xs sm:text-sm font-black truncate max-w-full ${
                            isHomeWinner ? 'text-slate-900' : 'text-slate-600'
                          }`}
                          title={record.homeTeam.name}
                        >
                          {record.homeTeam.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate max-w-full">
                          {record.homeTeam.club_crest_name}
                        </div>
                      </div>

                      {/* Center Scoreline Display */}
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs flex items-center gap-1.5 font-mono font-black">
                          <span
                            className={`text-xl ${
                              isHomeWinner ? 'text-emerald-600 font-extrabold' : 'text-slate-800'
                            }`}
                          >
                            {record.homeScore}
                          </span>
                          <span className="text-slate-400 text-sm">:</span>
                          <span
                            className={`text-xl ${
                              isAwayWinner ? 'text-emerald-600 font-extrabold' : 'text-slate-800'
                            }`}
                          >
                            {record.awayScore}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                          FT
                        </span>
                      </div>

                      {/* Away Team Side */}
                      <div className="col-span-5 flex flex-col items-center text-center">
                        <div className="relative mb-2">
                          <ClubCrest
                            logoUrl={record.awayTeam.logo_url}
                            clubName={record.awayTeam.club_crest_name}
                            teamName={record.awayTeam.name}
                            size="xl"
                            className={isAwayWinner ? 'ring-2 ring-emerald-500 bg-white shadow-sm' : 'bg-white opacity-85'}
                          />
                          {isAwayWinner && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white p-0.5 rounded-full shadow">
                              <Crown className="w-3 h-3 fill-white" />
                            </div>
                          )}
                        </div>
                        <h4
                          className={`text-xs sm:text-sm font-black truncate max-w-full ${
                            isAwayWinner ? 'text-slate-900' : 'text-slate-600'
                          }`}
                          title={record.awayTeam.name}
                        >
                          {record.awayTeam.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 truncate max-w-full">
                          {record.awayTeam.club_crest_name}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key Match Insights */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Target className="w-3.5 h-3.5 text-blue-600" />
                      <span>Total Goals: <strong className="text-slate-900 font-mono">{record.totalGoals}</strong></span>
                    </div>

                    {record.isCleanSheet && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        Clean Sheet
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions (Instagram Ready Button + Score Editor) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      setSelectedMatchForInstagram({
                        match: record.match,
                        homeTeam: record.homeTeam,
                        awayTeam: record.awayTeam,
                        recordTitle: `${getCategoryTitle(activeCategory)} #${index + 1}`,
                      })
                    }
                    className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5 text-rose-500" />
                    <span>Instagram Post</span>
                  </button>

                  {onOpenScoreModal && (
                    <button
                      onClick={() => onOpenScoreModal(record.match)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      <span>Inspect Match</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instagram Post Modal */}
      <InstagramPostModal
        isOpen={!!selectedMatchForInstagram}
        onClose={() => setSelectedMatchForInstagram(null)}
        match={selectedMatchForInstagram?.match || null}
        homeTeam={selectedMatchForInstagram?.homeTeam || null}
        awayTeam={selectedMatchForInstagram?.awayTeam || null}
        tournamentName={tournamentName}
        recordTitle={selectedMatchForInstagram?.recordTitle}
      />
    </div>
  );
};
