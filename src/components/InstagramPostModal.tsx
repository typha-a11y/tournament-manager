/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { Match, Team } from '../types/tournament';
import { ClubCrest } from './ClubCrest';
import {
  Download,
  Copy,
  Check,
  X,
  Instagram,
  Crown,
  Sparkles,
  Flame,
  ShieldCheck,
  Trophy,
  Share2,
  Zap,
} from 'lucide-react';

interface InstagramPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  tournamentName?: string;
  recordTitle?: string;
}

type AspectRatio = '1:1' | '4:5' | '9:16';

export const InstagramPostModal: React.FC<InstagramPostModalProps> = ({
  isOpen,
  onClose,
  match,
  homeTeam,
  awayTeam,
  tournamentName = 'eFootball Championship',
  recordTitle = 'BIGGEST WIN OF THE MATCHDAY',
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const postRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !match || !homeTeam || !awayTeam) return null;

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const totalGoals = homeScore + awayScore;
  const margin = Math.abs(homeScore - awayScore);
  const isDraw = homeScore === awayScore;
  const isHomeWinner = homeScore > awayScore;
  const isAwayWinner = awayScore > homeScore;
  const winner = isHomeWinner ? homeTeam : isAwayWinner ? awayTeam : null;
  const loser = isHomeWinner ? awayTeam : isAwayWinner ? homeTeam : null;
  const winnerScore = isHomeWinner ? homeScore : awayScore;
  const loserScore = isHomeWinner ? awayScore : homeScore;
  const isCleanSheet = !isDraw && (homeScore === 0 || awayScore === 0);

  const stageLabel =
    match.match_type === 'Group'
      ? `GROUP ${match.group_id || 'A'} · MATCHDAY ${match.round_number || 1}`
      : match.match_type.toUpperCase();

  // Generate Instagram Caption
  const generateCaption = () => {
    if (isDraw) {
      return `🔥 INTENSE DRAW in the ${tournamentName}!\n\n⚽ ${homeTeam.name} (${homeTeam.club_crest_name}) ${homeScore} - ${awayScore} ${awayTeam.name} (${awayTeam.club_crest_name})\n📌 Stage: ${stageLabel}\n⚡ Total Goals: ${totalGoals}\n\n#eFootball #Tournament #PES #Matchday #eSports #Gaming`;
    }
    return `🏆 RECORD RESULT | ${recordTitle}!\n\n🔥 ${winner?.name} delivers a statement ${winnerScore}-${loserScore} victory against ${loser?.name}!\n\n📊 Match Breakdown:\n⭐ Victor: ${winner?.name} (${winner?.club_crest_name})\n🛡️ Opponent: ${loser?.name} (${loser?.club_crest_name})\n⚽ Scoreline: ${winnerScore} - ${loserScore} (+${margin} Margin)\n${isCleanSheet ? '🧤 Clean Sheet: YES\n' : ''}🏟️ Stage: ${stageLabel}\n\n#eFootball #eFootball2025 #PES #Tournament #eSports #GamingCommunity #BiggestWin #Matchday`;
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(generateCaption());
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleDownloadImage = async () => {
    if (!postRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(postRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High-DPI crystal clear Instagram export
        quality: 1.0,
      });

      const link = document.createElement('a');
      link.download = `efootball-${homeTeam.name.toLowerCase().replace(/\s+/g, '-')}-vs-${awayTeam.name.toLowerCase().replace(/\s+/g, '-')}-${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export Instagram image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Dimensions based on ratio
  const getContainerStyles = () => {
    switch (aspectRatio) {
      case '1:1':
        return 'w-[480px] h-[480px] max-w-full';
      case '4:5':
        return 'w-[440px] h-[550px] max-w-full';
      case '9:16':
        return 'w-[360px] h-[640px] max-w-full';
      default:
        return 'w-[480px] h-[480px] max-w-full';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-auto flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Instagram className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                Instagram & Social Post Ready Card
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Light Themed
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pixel-perfect sized cards designed for Instagram Feed, Carousel, or Stories.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Interactive Preview */}
        <div className="p-5 flex flex-col md:flex-row items-center gap-6 bg-slate-100/60">
          {/* Card Preview Viewport */}
          <div className="flex-1 flex items-center justify-center p-2">
            <div
              ref={postRef}
              className={`relative bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between p-6 sm:p-7 select-none transition-all ${getContainerStyles()}`}
            >
              {/* Subtle Sporty Watermark & Decorative Lighting (Always Light Themed) */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

              {/* 1. Header: Tournament & Stage Branding */}
              <div className="relative z-10 flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                    ⚽
                  </div>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                      {tournamentName}
                    </div>
                    <div className="text-[9px] font-bold text-blue-700 font-mono">
                      OFFICIAL eFOOTBALL LEAGUE
                    </div>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-900 text-white shadow-2xs">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{stageLabel}</span>
                </div>
              </div>

              {/* 2. Headline Pill: Biggest Win / Result Title */}
              <div className="relative z-10 text-center my-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black tracking-widest uppercase shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                  {recordTitle}
                </span>
              </div>

              {/* 3. Central Arena: Large Logos & Massive Score Display */}
              <div className="relative z-10 bg-white/95 rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-md">
                <div className="grid grid-cols-12 items-center gap-2">
                  {/* Home Team */}
                  <div className="col-span-5 flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <ClubCrest
                        logoUrl={homeTeam.logo_url}
                        clubName={homeTeam.club_crest_name}
                        teamName={homeTeam.name}
                        size="2xl"
                        className={isHomeWinner ? 'ring-3 ring-emerald-500 bg-white shadow-md' : 'bg-white shadow-xs opacity-90'}
                      />
                      {isHomeWinner && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 p-1 rounded-full shadow-md">
                          <Crown className="w-3.5 h-3.5 fill-slate-950" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-full">
                      {homeTeam.name}
                    </h4>
                    <div className="text-[10px] text-slate-500 font-bold truncate max-w-full">
                      {homeTeam.club_crest_name}
                    </div>
                    {(homeTeam.whatsapp || homeTeam.phone) && (
                      <div className="text-[9px] text-emerald-600 font-mono mt-0.5">
                        @{homeTeam.whatsapp || homeTeam.phone}
                      </div>
                    )}
                  </div>

                  {/* Scoreline Center */}
                  <div className="col-span-2 flex flex-col items-center justify-center text-center">
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-white shadow-md flex items-center gap-1 font-mono font-black">
                      <span className={`text-xl sm:text-2xl ${isHomeWinner ? 'text-emerald-400' : 'text-white'}`}>
                        {homeScore}
                      </span>
                      <span className="text-slate-400 text-sm">-</span>
                      <span className={`text-xl sm:text-2xl ${isAwayWinner ? 'text-emerald-400' : 'text-white'}`}>
                        {awayScore}
                      </span>
                    </div>
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider mt-1">
                      FULL TIME
                    </span>
                  </div>

                  {/* Away Team */}
                  <div className="col-span-5 flex flex-col items-center text-center">
                    <div className="relative mb-2">
                      <ClubCrest
                        logoUrl={awayTeam.logo_url}
                        clubName={awayTeam.club_crest_name}
                        teamName={awayTeam.name}
                        size="2xl"
                        className={isAwayWinner ? 'ring-3 ring-emerald-500 bg-white shadow-md' : 'bg-white shadow-xs opacity-90'}
                      />
                      {isAwayWinner && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 p-1 rounded-full shadow-md">
                          <Crown className="w-3.5 h-3.5 fill-slate-950" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate max-w-full">
                      {awayTeam.name}
                    </h4>
                    <div className="text-[10px] text-slate-500 font-bold truncate max-w-full">
                      {awayTeam.club_crest_name}
                    </div>
                    {(awayTeam.whatsapp || awayTeam.phone) && (
                      <div className="text-[9px] text-emerald-600 font-mono mt-0.5">
                        @{awayTeam.whatsapp || awayTeam.phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Match Highlights Strip */}
              <div className="relative z-10 grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/90 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs">
                  <div className="text-[8px] font-extrabold text-slate-400 uppercase">Margin</div>
                  <div className="text-xs font-black text-blue-700 font-mono">+{margin} Goals</div>
                </div>
                <div className="bg-white/90 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs">
                  <div className="text-[8px] font-extrabold text-slate-400 uppercase">Total Goals</div>
                  <div className="text-xs font-black text-slate-900 font-mono">{totalGoals} Scored</div>
                </div>
                <div className="bg-white/90 border border-slate-200/90 rounded-xl p-1.5 shadow-2xs">
                  <div className="text-[8px] font-extrabold text-slate-400 uppercase">Shutout</div>
                  <div className="text-xs font-black text-emerald-700 font-mono">{isCleanSheet ? 'CLEAN SHEET' : 'BOTH SCORED'}</div>
                </div>
              </div>

              {/* 5. Footer Watermark */}
              <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-200/80 text-[9px] text-slate-500 font-bold">
                <span className="flex items-center gap-1 text-slate-700">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  eFootball 24-Team Tournament
                </span>
                <span className="font-mono text-slate-400">#eFootball #Matchday</span>
              </div>
            </div>
          </div>

          {/* Right Side Settings & Actions */}
          <div className="w-full md:w-64 space-y-4">
            {/* Aspect Ratio Selector */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <label className="text-xs font-extrabold text-slate-900 block mb-2">
                Instagram Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: '1:1', label: '1:1 Square', desc: 'Feed Post' },
                    { id: '4:5', label: '4:5 Portrait', desc: 'Vertical Feed' },
                    { id: '9:16', label: '9:16 Story', desc: 'Story' },
                  ] as const
                ).map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id)}
                    className={`p-2 rounded-lg text-center transition-all border ${
                      aspectRatio === ratio.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-black shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <div className="text-xs">{ratio.id}</div>
                    <div className="text-[9px] text-slate-500">{ratio.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5">
              <button
                onClick={handleDownloadImage}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating High-Res PNG...' : 'Download Instagram Post (PNG)'}</span>
              </button>

              <button
                onClick={handleCopyCaption}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs transition-colors shadow-2xs"
              >
                {copiedCaption ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Caption Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Copy Instagram Caption</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
              💡 <strong>Instagram Ready:</strong> Downloaded PNG has crystal-clear double resolution (2x Retina) formatted for crisp social sharing without compression blur.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
