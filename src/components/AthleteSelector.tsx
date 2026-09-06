'use client';

import React, { useState } from 'react';
import { Athlete } from '@/lib/types';
import { INITIAL_ATHLETES } from '@/lib/data';
import { Search, UserCheck, Shield, ChevronRight, User } from 'lucide-react';

interface AthleteSelectorProps {
  activeAthlete: Athlete | null;
  onSelectAthlete: (athlete: Athlete) => void;
}

export const AthleteSelector: React.FC<AthleteSelectorProps> = ({
  activeAthlete,
  onSelectAthlete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAthletes = INITIAL_ATHLETES.filter((ath) =>
    ath.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAthleteClick = (athlete: Athlete) => {
    onSelectAthlete(athlete);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Pesquisar jogadora..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-dark-border bg-dark-card py-3 pl-10 pr-4 text-sm font-medium text-slate-100 placeholder-slate-500 focus:border-brand-lime focus:outline-none focus:ring-1 focus:ring-brand-lime"
        />
      </div>

      {/* Grid of Athletes */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {filteredAthletes.map((athlete) => {
          const isActive = activeAthlete?.id === athlete.id;

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
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-lime text-slate-950 shadow-md shadow-brand-lime/40'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <span
                  className={`block truncate text-xs font-bold ${
                    isActive ? 'text-brand-lime' : 'text-slate-200'
                  }`}
                >
                  {athlete.name}
                </span>
                <span className="text-[10px] text-slate-400">
                  {isActive ? 'Atleta Ativa' : 'Selecionar'}
                </span>
              </div>
              {isActive && <UserCheck className="h-4 w-4 shrink-0 text-brand-lime" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
