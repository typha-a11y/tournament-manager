/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import { getReliableClubLogo, getSecondaryFallbackLogo } from '../lib/logoDictionary';

interface ClubCrestProps {
  logoUrl?: string;
  name?: string;
  teamName?: string;
  clubName?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
};

const iconSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export const ClubCrest: React.FC<ClubCrestProps> = ({
  logoUrl,
  name,
  teamName,
  clubName,
  className = '',
  size = 'md',
}) => {
  const displayName = clubName || teamName || name || 'Club';

  const resolveInitialUrl = () => {
    // Check specific club name first, then team/player name, then general
    const fromClub = clubName ? getReliableClubLogo(clubName) : '';
    if (fromClub) return fromClub;

    const fromTeam = teamName ? getReliableClubLogo(teamName) : '';
    if (fromTeam) return fromTeam;

    const fromName = name ? getReliableClubLogo(name) : '';
    if (fromName) return fromName;

    return getReliableClubLogo(displayName, logoUrl) || logoUrl || '';
  };

  const [currentSrc, setCurrentSrc] = useState<string>(resolveInitialUrl);
  const [hasError, setHasError] = useState(false);
  const [triedSecondary, setTriedSecondary] = useState(false);

  useEffect(() => {
    const nextUrl = resolveInitialUrl();
    setCurrentSrc(nextUrl);
    setHasError(false);
    setTriedSecondary(false);
  }, [logoUrl, clubName, teamName, name]);

  const handleImageError = () => {
    // Try secondary fallback URL before falling back to Lucide crest
    if (!triedSecondary) {
      setTriedSecondary(true);
      const secondary =
        (clubName && getSecondaryFallbackLogo(clubName)) ||
        (teamName && getSecondaryFallbackLogo(teamName)) ||
        getSecondaryFallbackLogo(displayName);
      if (secondary && secondary !== currentSrc) {
        setCurrentSrc(secondary);
        return;
      }
    }
    setHasError(true);
  };

  // Fallback UI: sleek, generic crest icon from Lucide React, NOT raw text
  if (!currentSrc || hasError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/80 text-slate-500 shadow-2xs ${sizeClasses[size]} ${className}`}
        title={displayName}
      >
        <Shield className={`${iconSizes[size]} text-slate-600 stroke-[2]`} />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-white p-0.5 border border-slate-200/90 shadow-2xs ${sizeClasses[size]} ${className}`}
      title={displayName}
    >
      <img
        src={currentSrc}
        alt={`${displayName} crest`}
        className="w-full h-full object-contain filter drop-shadow-2xs"
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={handleImageError}
      />
    </div>
  );
};
