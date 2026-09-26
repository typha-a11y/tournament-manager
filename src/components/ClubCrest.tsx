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
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-14 h-14',
  '2xl': 'w-20 h-20 sm:w-24 sm:h-24',
  '3xl': 'w-28 h-28 sm:w-32 sm:h-32',
};

const iconSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3.5 h-3.5',
  md: 'w-4.5 h-4.5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12',
  '3xl': 'w-16 h-16',
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
    // 1. Prioritize explicit club crest name
    if (clubName) {
      const fromClub = getReliableClubLogo(clubName);
      if (fromClub) return fromClub;
    }

    // 2. Check team/player name
    if (teamName) {
      const fromTeam = getReliableClubLogo(teamName);
      if (fromTeam) return fromTeam;
    }

    // 3. Check generic name
    if (name) {
      const fromName = getReliableClubLogo(name);
      if (fromName) return fromName;
    }

    // 4. Check fallback logoUrl
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
    if (!triedSecondary) {
      setTriedSecondary(true);
      const secondary =
        (clubName && getSecondaryFallbackLogo(clubName)) ||
        (teamName && getSecondaryFallbackLogo(teamName)) ||
        (name && getSecondaryFallbackLogo(name)) ||
        getSecondaryFallbackLogo(displayName);

      if (secondary && secondary !== currentSrc) {
        setCurrentSrc(secondary);
        return;
      }
    }
    setHasError(true);
  };

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
