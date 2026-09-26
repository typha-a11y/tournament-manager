/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Match, Team } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import {
  X,
  Instagram,
  Download,
  Copy,
  Check,
  Share2,
  Sparkles,
  Trophy,
  Flame,
  Crown,
  Calendar,
  Layers,
  Palette,
  Smartphone,
  Square,
} from 'lucide-react';

export interface InstagramPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  homeTeam?: Team | null;
  awayTeam?: Team | null;
  tournamentName?: string;
}

type AspectRatio = '1:1' | '9:16';
type CardTheme = 'midnight' | 'stadium' | 'gold' | 'cyber';

export const InstagramPostModal: React.FC<InstagramPostModalProps> = ({
  isOpen,
  onClose,
  match,
  homeTeam,
  awayTeam,
  tournamentName = 'eFootball Champions Cup',
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [cardTheme, setCardTheme] = useState<CardTheme>('midnight');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !match) return null;

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const isHomeWinner = homeScore > awayScore;
  const isAwayWinner = awayScore > homeScore;
  const isDraw = homeScore === awayScore;
  const totalGoals = homeScore + awayScore;
  const isCleanSheet = (isHomeWinner && awayScore === 0) || (isAwayWinner && homeScore === 0);

  const homeName = homeTeam?.name || 'Home Team';
  const awayName = awayTeam?.name || 'Away Team';
  const homeCrest = homeTeam?.club_crest_name || 'Club';
  const awayCrest = awayTeam?.club_crest_name || 'Club';

  const stageLabel =
    match.match_type === 'Group'
      ? `Group ${match.group_id || 'Stage'} · Round ${match.round_number || 1}`
      : `${match.match_type} Stage${match.leg ? ` · Leg ${match.leg}` : ''}`;

  const generatedCaption = `⚽ ${tournamentName} MATCH RESULT ⚽
🏆 ${stageLabel}

⚔️ ${homeName} (${homeCrest}) ${homeScore} - ${awayScore} ${awayName} (${awayCrest})

${
  isHomeWinner
    ? `🔥 Victory for ${homeName} with a clinical performance!`
    : isAwayWinner
    ? `🔥 Massive away victory for ${awayName}!`
    : `🤝 High-octane clash ends in a thrilling draw!`
}

${isCleanSheet ? '🧤 Clean sheet secured!' : `💥 ${totalGoals} total goals scored!`}

#eFootball #eFootball2026 #GamingCommunity #Tournament #Matchday #PlayStation #Xbox #MobileGaming`;

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(generatedCaption);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch (err) {
      console.error('Failed to copy caption:', err);
    }
  };

  const handleDownloadCard = () => {
    // Basic screenshot/window print helper or fallback
    setCopiedImage(true);
    setTimeout(() => setCopiedImage(false), 2000);
    window.print();
  };

  const getThemeStyles = () => {
    switch (cardTheme) {
      case 'stadium':
        return 'bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white border-emerald-500/30';
      case 'gold':
        return 'bg-gradient-to-br from-amber-950 via-stone-900 to-yellow-950 text-white border-amber-500/40';
      case 'cyber':
        return 'bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white border-purple-500/30';
      case 'midnight':
      default:
        return 'bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-950 text-white border-indigo-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
              <Instagram className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Instagram Match Card Creator
              </h2>
              <p className="text-xs text-slate-500">
                Generate high-res shareable social graphics & caption
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Aspect Ratio Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Format / Aspect Ratio
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAspectRatio('1:1')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      aspectRatio === '1:1'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                    <span>Square Post (1:1)</span>
                  </button>
                  <button
                    onClick={() => setAspectRatio('9:16')}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      aspectRatio === '9:16'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Story Reel (9:16)</span>
                  </button>
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Visual Palette
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCardTheme('midnight')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      cardTheme === 'midnight'
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/50 text-indigo-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-900 shrink-0" />
                    <span>Midnight Navy</span>
                  </button>

                  <button
                    onClick={() => setCardTheme('stadium')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      cardTheme === 'stadium'
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50 text-emerald-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-900 shrink-0" />
                    <span>Pitch Green</span>
                  </button>

                  <button
                    onClick={() => setCardTheme('gold')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      cardTheme === 'gold'
                        ? 'border-amber-600 ring-2 ring-amber-500/20 bg-amber-50/50 text-amber-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-600 shrink-0" />
                    <span>Gold Trophy</span>
                  </button>

                  <button
                    onClick={() => setCardTheme('cyber')}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all ${
                      cardTheme === 'cyber'
                        ? 'border-purple-600 ring-2 ring-purple-500/20 bg-purple-50/50 text-purple-900'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-900 shrink-0" />
                    <span>Cyber Neon</span>
                  </button>
                </div>
              </div>

              {/* Caption Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Instagram Post Caption
                  </label>
                  <button
                    onClick={handleCopyCaption}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    {copiedCaption ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Caption</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={generatedCaption}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-700 focus:outline-none select-all resize-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={handleCopyCaption}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedCaption ? 'Caption Copied' : 'Copy Caption'}</span>
              </button>
              <button
                onClick={handleDownloadCard}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>{copiedImage ? 'Saved Card' : 'Save Graphic'}</span>
              </button>
            </div>
          </div>

          {/* Graphic Preview Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100/70 p-4 sm:p-6 rounded-2xl border border-slate-200">
            <div
              ref={cardRef}
              className={`w-full transition-all duration-300 relative overflow-hidden rounded-2xl border shadow-xl flex flex-col justify-between p-6 ${getThemeStyles()} ${
                aspectRatio === '9:16' ? 'max-w-[320px] aspect-[9/16]' : 'max-w-[420px] aspect-square'
              }`}
            >
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Banner */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">
                    {tournamentName}
                  </span>
                </div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-xs text-slate-300 border border-white/10">
                  {stageLabel}
                </div>
              </div>

              {/* Main Score Centerpiece */}
              <div className="relative z-10 my-auto py-4">
                <div className="flex items-center justify-around gap-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <div className="relative mb-2">
                      <ClubCrest
                        logoUrl={homeTeam?.logo_url || ''}
                        clubName={homeCrest}
                        teamName={homeName}
                        size={aspectRatio === '9:16' ? 'lg' : 'xl'}
                        className={`bg-white p-1 rounded-full ${
                          isHomeWinner ? 'ring-4 ring-amber-400 shadow-lg' : 'opacity-90'
                        }`}
                      />
                      {isHomeWinner && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full">
                          <Crown className="w-3 h-3 fill-slate-950" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {homeName}
                    </h3>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {homeCrest}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <div className="text-[9px] font-black tracking-widest uppercase text-slate-400 mb-1">
                      Full Time
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 px-3.5 py-1.5 rounded-xl border border-white/15 backdrop-blur-md">
                      <span
                        className={`text-2xl sm:text-3xl font-mono font-black ${
                          isHomeWinner ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {homeScore}
                      </span>
                      <span className="text-slate-500 font-bold">:</span>
                      <span
                        className={`text-2xl sm:text-3xl font-mono font-black ${
                          isAwayWinner ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        {awayScore}
                      </span>
                    </div>
                    {isCleanSheet && (
                      <span className="mt-1.5 text-[9px] font-extrabold text-emerald-400 tracking-wider uppercase">
                        Clean Sheet
                      </span>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center text-center flex-1 min-w-0">
                    <div className="relative mb-2">
                      <ClubCrest
                        logoUrl={awayTeam?.logo_url || ''}
                        clubName={awayCrest}
                        teamName={awayName}
                        size={aspectRatio === '9:16' ? 'lg' : 'xl'}
                        className={`bg-white p-1 rounded-full ${
                          isAwayWinner ? 'ring-4 ring-amber-400 shadow-lg' : 'opacity-90'
                        }`}
                      />
                      {isAwayWinner && (
                        <div className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 p-1 rounded-full">
                          <Crown className="w-3 h-3 fill-slate-950" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs sm:text-sm font-black text-white truncate max-w-full">
                      {awayName}
                    </h3>
                    <span className="text-[10px] text-slate-400 truncate max-w-full">
                      {awayCrest}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Official Match Record</span>
                </div>
                <div className="font-mono text-slate-300">#eFootball2026</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramPostModal;
