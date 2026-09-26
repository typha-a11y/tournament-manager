/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Team, Match, TeamAchievement, MedalTier } from '../types/tournament';
import { computeTeamAchievements, TIER_CONFIG, BADGE_DEFINITIONS } from '../lib/badgeEngine';
import { ClubCrest } from './ClubCrest';
import { useTournament } from '../context/TournamentContext';
import {
  Trophy,
  Award,
  Crown,
  Medal,
  Sparkles,
  Shield,
  Zap,
  Target,
  Flame,
  Star,
  Share2,
  Download,
  Check,
  Instagram,
  Eye,
  Filter,
  Users,
  Search,
  ChevronRight,
  Info,
  X,
} from 'lucide-react';

interface TournamentWallOfFameProps {
  teams?: Team[];
  matches?: Match[];
}

export const TournamentWallOfFame: React.FC<TournamentWallOfFameProps> = ({
  teams: propTeams,
  matches: propMatches,
}) => {
  const {
    teams: contextTeams,
    matches: contextMatches,
    activeProfile,
    activeTournamentId,
  } = useTournament();

  const sourceTeams = propTeams && propTeams.length > 0 ? propTeams : contextTeams;
  const sourceMatches = propMatches && propMatches.length > 0 ? propMatches : contextMatches;

  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamForBrag, setSelectedTeamForBrag] = useState<string>(
    sourceTeams[0]?.id || ''
  );
  const [inspectingBadge, setInspectingBadge] = useState<TeamAchievement | null>(null);
  const [isExportingBrag, setIsExportingBrag] = useState(false);
  const [copiedBragCaption, setCopiedBragCaption] = useState(false);

  const bragCardRef = useRef<HTMLDivElement>(null);

  // Compute all live achievements
  const allAchievements = useMemo(() => {
    return computeTeamAchievements(sourceTeams, sourceMatches, activeTournamentId);
  }, [sourceTeams, sourceMatches, activeTournamentId]);

  // Team achievements map & Trophy points calculation
  const teamAchievementsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        team: Team;
        badges: TeamAchievement[];
        mythicCount: number;
        diamondCount: number;
        goldCount: number;
        silverCount: number;
        bronzeCount: number;
        trophyPoints: number;
      }
    >();

    sourceTeams.forEach((team) => {
      const teamBadges = allAchievements.filter((a) => a.team_id === team.id);
      let mythicCount = 0;
      let diamondCount = 0;
      let goldCount = 0;
      let silverCount = 0;
      let bronzeCount = 0;
      let trophyPoints = 0;

      teamBadges.forEach((b) => {
        const def = BADGE_DEFINITIONS[b.badge_key];
        const pts = def?.points || 100;
        trophyPoints += pts;

        if (b.tier === 'mythic') mythicCount++;
        else if (b.tier === 'diamond') diamondCount++;
        else if (b.tier === 'gold') goldCount++;
        else if (b.tier === 'silver') silverCount++;
        else if (b.tier === 'bronze') bronzeCount++;
      });

      map.set(team.id, {
        team,
        badges: teamBadges,
        mythicCount,
        diamondCount,
        goldCount,
        silverCount,
        bronzeCount,
        trophyPoints,
      });
    });

    return map;
  }, [sourceTeams, allAchievements]);

  // Leaderboard of teams ranked by Trophy Score & Medals
  const rankedTeams = useMemo(() => {
    return Array.from(teamAchievementsMap.values()).sort((a, b) => {
      if (b.trophyPoints !== a.trophyPoints) return b.trophyPoints - a.trophyPoints;
      if (b.mythicCount !== a.mythicCount) return b.mythicCount - a.mythicCount;
      if (b.diamondCount !== a.diamondCount) return b.diamondCount - a.diamondCount;
      return b.goldCount - a.goldCount;
    });
  }, [teamAchievementsMap]);

  // Active team for Show-Off Brag Card
  const activeBragTeam = useMemo(() => {
    return (
      teamAchievementsMap.get(selectedTeamForBrag) ||
      rankedTeams[0] || {
        team: sourceTeams[0],
        badges: [],
        mythicCount: 0,
        diamondCount: 0,
        goldCount: 0,
        silverCount: 0,
        bronzeCount: 0,
        trophyPoints: 0,
      }
    );
  }, [teamAchievementsMap, selectedTeamForBrag, rankedTeams, sourceTeams]);

  // Filtered achievements feed
  const filteredAchievements = useMemo(() => {
    return allAchievements.filter((ach) => {
      const team = sourceTeams.find((t) => t.id === ach.team_id);
      if (!team) return false;

      // Tier filter
      if (selectedTier !== 'all' && ach.tier !== selectedTier) return false;

      // Category filter
      if (selectedCategory !== 'all' && ach.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTitle = ach.title.toLowerCase().includes(q);
        const matchDesc = ach.description.toLowerCase().includes(q);
        const matchTeam = team.name.toLowerCase().includes(q);
        const matchClub = (team.club_crest_name || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchTeam || matchClub;
      }

      return true;
    });
  }, [allAchievements, sourceTeams, selectedTier, selectedCategory, searchQuery]);

  // Download 1:1 Instagram Bragging Card
  const handleDownloadBragCard = async () => {
    if (!bragCardRef.current) return;
    setIsExportingBrag(true);

    try {
      const dataUrl = await toPng(bragCardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x Retina high quality
        quality: 1.0,
      });

      const link = document.createElement('a');
      link.download = `${activeBragTeam.team.name.toLowerCase().replace(/\s+/g, '-')}-trophy-wall-of-fame.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export Brag card:', err);
    } finally {
      setIsExportingBrag(false);
    }
  };

  const handleCopyBragCaption = async () => {
    const medalTitles = activeBragTeam.badges.map((b) => `${b.icon} ${b.title}`).join('\n');
    const text = `🏆 OFFICIAL WALL OF FAME SHOWCASE!\n\n👑 Player: ${activeBragTeam.team.name}\n⚽ Club: ${activeBragTeam.team.club_crest_name || 'Pro Club'}\n⭐ Tournament: ${activeProfile?.name || 'eFootball Championship'}\n🏅 Total Trophy Points: ${activeBragTeam.trophyPoints} PTS\n\n🎖️ Unlocked Medals & Achievements:\n${medalTitles}\n\n#eFootball #WallOfFame #eSports #GamingBrag #TrophyCabinet #PES2025 #Champion`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedBragCaption(true);
      setTimeout(() => setCopiedBragCaption(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                Tournament Wall of Fame & Trophy Cabinet
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 font-bold">{allAchievements.length} Total Medals Earned</span>
            </div>

            <h1 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Medals, Honors & Show-Off System
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl">
              Real-time automated achievement engine tracking champions, undefeated runs, firepower records, clean sheet walls, and penalty heroes with Instagram-ready brag cards.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-4 py-3 shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
              🎖️
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-800">Honor Roll Leader</div>
              <div className="text-sm font-black text-slate-900 truncate">
                {rankedTeams[0]?.team.name || 'Tournament Leader'} ({rankedTeams[0]?.trophyPoints || 0} pts)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Show-Off & Bragging Card Generator (ALWAYS LIGHT THEMED) */}
      <div className="bg-gradient-to-br from-amber-500/10 via-white to-blue-50/50 rounded-3xl border-2 border-amber-200/90 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                Team Show-Off & Trophy Showcase Card
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Instagram 1:1 Ready
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Generate high-resolution social sharing cards for any player to brag about medals and glory.
              </p>
            </div>
          </div>

          {/* Team Dropdown Selector */}
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <span className="text-xs font-bold text-slate-600 shrink-0">Select Team:</span>
            <select
              value={selectedTeamForBrag}
              onChange={(e) => setSelectedTeamForBrag(e.target.value)}
              className="flex-1 lg:w-64 px-3 py-2 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-2xs"
            >
              {sourceTeams.map((t) => {
                const count = teamAchievementsMap.get(t.id)?.badges.length || 0;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({count} Medals · {t.club_crest_name || 'Club'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Brag Card Preview & Actions Side-by-Side */}
        <div className="flex flex-col xl:flex-row items-center justify-center gap-8 py-2">
          {/* 1:1 Square Brag Card (Always Light Themed, Instagram Ready) */}
          <div
            ref={bragCardRef}
            className="w-full max-w-[440px] aspect-square bg-gradient-to-br from-white via-slate-50 to-amber-50/40 rounded-3xl border-2 border-amber-300 shadow-xl p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden select-none"
          >
            {/* Ambient Lighting & Sport Watermark */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Top Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-2xs">
                  👑
                </div>
                <div>
                  <div className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                    {activeProfile?.name || 'eFootball Championship'}
                  </div>
                  <div className="text-[9px] font-bold text-amber-700 font-mono">
                    OFFICIAL WALL OF FAME
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white font-mono font-black text-xs shadow-xs">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{activeBragTeam.trophyPoints} PTS</span>
              </div>
            </div>

            {/* Center Profile Banner */}
            <div className="relative z-10 bg-white/95 rounded-2xl border border-amber-200/90 p-4 shadow-sm flex items-center gap-4">
              <div className="relative shrink-0">
                <ClubCrest
                  logoUrl={activeBragTeam.team.logo_url}
                  clubName={activeBragTeam.team.club_crest_name}
                  teamName={activeBragTeam.team.name}
                  size="2xl"
                  className="ring-3 ring-amber-400 bg-white p-1 shadow-md"
                />
                <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 p-1 rounded-full shadow font-black">
                  <Crown className="w-3.5 h-3.5 fill-slate-950" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                    Pro Player
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Group {activeBragTeam.team.group_id || 'A'}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 truncate mt-0.5">
                  {activeBragTeam.team.name}
                </h3>
                <div className="text-xs text-slate-600 font-bold truncate">
                  {activeBragTeam.team.club_crest_name}
                </div>
                {(activeBragTeam.team.whatsapp || activeBragTeam.team.phone) && (
                  <div className="text-[10px] text-emerald-700 font-mono font-bold">
                    @{activeBragTeam.team.whatsapp || activeBragTeam.team.phone}
                  </div>
                )}
              </div>
            </div>

            {/* Medal Cabinet Grid */}
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center justify-between">
                <span>Earned Medals & Badges ({activeBragTeam.badges.length})</span>
                <span className="text-amber-800 font-mono">
                  {activeBragTeam.mythicCount > 0 ? `${activeBragTeam.mythicCount} Mythic · ` : ''}
                  {activeBragTeam.goldCount} Gold
                </span>
              </div>

              {activeBragTeam.badges.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  Play tournament fixtures to unlock prestigious medals!
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {activeBragTeam.badges.slice(0, 4).map((badge) => {
                    const cfg = TIER_CONFIG[badge.tier];
                    return (
                      <div
                        key={badge.id}
                        className={`rounded-xl p-2 text-center border ${cfg.border} ${cfg.bg} shadow-2xs flex flex-col items-center justify-center`}
                      >
                        <span className="text-xl mb-0.5">{badge.icon}</span>
                        <div className="text-[9px] font-black text-slate-900 truncate w-full">
                          {badge.title}
                        </div>
                        <span className="text-[8px] uppercase font-extrabold text-slate-500">
                          {badge.tier}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Watermark */}
            <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-200 text-[9px] font-bold text-slate-500">
              <span className="flex items-center gap-1 text-slate-700">
                <Trophy className="w-3 h-3 text-amber-500" />
                eFootball Wall of Fame
              </span>
              <span className="font-mono text-slate-400">#eFootball #TrophyCabinet</span>
            </div>
          </div>

          {/* Action Side Panel */}
          <div className="w-full max-w-sm space-y-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-black text-slate-900 mb-1">
                Share to Instagram & WhatsApp
              </h4>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Export a clean, light-themed 1080×1080 1:1 square graphic to celebrate this player's accomplishments.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleDownloadBragCard}
                  disabled={isExportingBrag}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 font-black text-xs shadow-md hover:opacity-95 transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExportingBrag ? 'Generating Image...' : 'Download Instagram Post (1:1 PNG)'}</span>
                </button>

                <button
                  onClick={handleCopyBragCaption}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs transition-colors shadow-2xs"
                >
                  {copiedBragCaption ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Caption Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-slate-600" />
                      <span>Copy Brag Post Caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              💡 <strong>Automatic Calculation:</strong> Badges are dynamically granted when match scores and group standings update.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Medal Honor Roll Leaderboard & Filterable Badge Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Team Medal Standings (Rankings) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm">Medal Honor Standings</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">Trophy Score</span>
            </div>

            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {rankedTeams.map((row, idx) => (
                <div
                  key={row.team.id}
                  onClick={() => setSelectedTeamForBrag(row.team.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    selectedTeamForBrag === row.team.id
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs'
                      : 'bg-slate-50/70 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <ClubCrest
                      logoUrl={row.team.logo_url}
                      clubName={row.team.club_crest_name}
                      teamName={row.team.name}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">
                        {row.team.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span>{row.badges.length} Medals</span>
                        {row.mythicCount > 0 && (
                          <span className="text-amber-600 font-bold">· 👑 {row.mythicCount}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-slate-900">
                      {row.trophyPoints}
                    </div>
                    <div className="text-[9px] uppercase font-bold text-slate-400">PTS</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: All Unlocked Medals Matrix & Filters */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          {/* Controls & Search Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Medal className="w-4 h-4 text-blue-600" />
                Tournament Medal Archive ({filteredAchievements.length})
              </h3>
              <p className="text-xs text-slate-500">
                Click any badge to inspect requirements and historical context.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search medal or team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Tier Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'mythic', 'diamond', 'gold', 'silver', 'bronze'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all capitalize ${
                    selectedTier === tier
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tier === 'all' ? 'All Tiers' : tier}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {(['all', 'championship', 'attack', 'defense', 'streak', 'special'] as const).map(
                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all capitalize ${
                      selectedCategory === cat
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Medal Grid */}
          {filteredAchievements.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Award className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">No Medals Match Filter</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Try switching the tier or search keyword.
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredAchievements.map((ach) => {
                const team = sourceTeams.find((t) => t.id === ach.team_id);
                const cfg = TIER_CONFIG[ach.tier];

                return (
                  <div
                    key={ach.id}
                    onClick={() => setInspectingBadge(ach)}
                    className={`p-3 rounded-xl border ${cfg.border} ${cfg.bg} hover:shadow-md transition-all cursor-pointer flex items-start gap-3 group relative overflow-hidden`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${cfg.iconRing} flex items-center justify-center text-xl shrink-0 shadow-2xs`}>
                      {ach.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${cfg.badgeBg}`}>
                          {ach.tier}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          +{BADGE_DEFINITIONS[ach.badge_key]?.points || 100} PTS
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 truncate mt-1">
                        {ach.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                        {ach.description}
                      </p>

                      {team && (
                        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-200/60">
                          <ClubCrest
                            logoUrl={team.logo_url}
                            clubName={team.club_crest_name}
                            teamName={team.name}
                            size="xs"
                          />
                          <span className="text-[10px] font-extrabold text-slate-800 truncate">
                            {team.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. Inspect Medal Modal */}
      {inspectingBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  {inspectingBadge.icon}
                </span>
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                    {inspectingBadge.tier} Tier
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-1">
                    {inspectingBadge.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectingBadge(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
              {inspectingBadge.description}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
              <span>Category: <strong className="capitalize text-slate-800">{inspectingBadge.category}</strong></span>
              <span>Trophy Points: <strong className="text-amber-800 font-mono">+{BADGE_DEFINITIONS[inspectingBadge.badge_key]?.points || 100} PTS</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
