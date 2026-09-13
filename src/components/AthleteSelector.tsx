'use client';

import React, { useState, useEffect } from 'react';
import { Athlete } from '@/lib/types';
import { INITIAL_ATHLETES } from '@/lib/data';
import { PinModal } from '@/components/PinModal';
import { useLanguage } from '@/context/LanguageContext';
import { Search, UserCheck, Lock } from 'lucide-react';

import { getAthleteAvatar, getDynamicAthletes } from '@/lib/storage';

interface AthleteSelectorProps {
  activeAthlete: Athlete | null;
  onSelectAthlete: (athlete: Athlete) => void;
}

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
  activeAthlete,
  onSelectAthlete,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingAthleteForPin, setPendingAthleteForPin] = useState<Athlete | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>(() => getDynamicAthletes());

  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    handleUpdate();
    window.addEventListener('femperf_credentials_updated', handleUpdate);
    return () => window.removeEventListener('femperf_credentials_updated', handleUpdate);
  }, []);

  const filteredAthletes = athletes.filter((ath) =>
    ath.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAthleteClick = (athlete: Athlete) => {
    // Open PIN verification modal before selecting profile
    setPendingAthleteForPin(athlete);
  };

  const handlePinSuccess = () => {
    if (pendingAthleteForPin) {
      onSelectAthlete(pendingAthleteForPin);
      setPendingAthleteForPin(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t.athleteSelector.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime"
        />
      </div>

      {/* Grid of Athletes */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filteredAthletes.map((athlete) => {
          const isActive = activeAthlete?.id === athlete.id;
          const customAvatar = getAthleteAvatar(athlete.id) || athlete.avatarUrl;

          // Initials for avatar
          const initials = athlete.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .substring(0, 2);

          return (
            <button
              key={athlete.id}
              type="button"
              onClick={() => handleAthleteClick(athlete)}
              className={`flex items-center space-x-3 rounded-xl border p-3 text-left transition-all ${
                isActive
                  ? 'border-brand-lime bg-brand-lime/10 shadow-lg shadow-brand-lime/10 ring-1 ring-brand-lime'
                  : 'border-slate-800 bg-dark-card hover:border-slate-700 hover:bg-dark-surface/60'
              }`}
            >
              {customAvatar ? (
                <img
                  src={customAvatar}
                  alt={athlete.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover border border-red-500/50 shadow"
                />
              ) : (
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-lime text-slate-950 shadow-md shadow-brand-lime/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1">
                  <span
                    className={`block truncate text-xs font-bold ${
                      isActive ? 'text-brand-lime' : 'text-slate-200'
                    }`}
                  >
                    {athlete.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                    <Lock className="h-2.5 w-2.5 text-amber-400" />
                    <span>{isActive ? 'Ativa' : 'PIN'}</span>
                  </span>
                </div>
              </div>
              {isActive && <UserCheck className="h-4 w-4 shrink-0 text-brand-lime" />}
            </button>
          );
        })}
      </div>

      {/* Mandatory PIN Access Verification Modal */}
      {pendingAthleteForPin && (
        <PinModal
          athleteId={pendingAthleteForPin.id}
          athleteName={pendingAthleteForPin.name}
          isOpen={!!pendingAthleteForPin}
          onClose={() => setPendingAthleteForPin(null)}
          onSuccess={handlePinSuccess}
        />
      )}
    </div>
  );
};
