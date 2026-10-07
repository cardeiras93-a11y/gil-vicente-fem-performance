'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry } from '@/lib/types';
import { getPendingQuestionnairesStatus, getTodayLocalDateStr } from '@/lib/reminderUtils';

interface ReminderBannerProps {
  activeAthlete: Athlete;
  onSelectTab: (tab: 'wellness' | 'rpe' | 'hydration') => void;
  wellnessList?: WellnessEntry[];
  rpeList?: RPEEntry[];
  hydrationList?: HydrationEntry[];
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  activeAthlete,
  onSelectTab,
  wellnessList,
  rpeList,
  hydrationList,
}) => {
  const [todayStr, setTodayStr] = useState<string>(getTodayLocalDateStr());

  useEffect(() => {
    const handleDataUpdate = () => {
      setTodayStr(getTodayLocalDateStr());
    };

    window.addEventListener('femperf_data_updated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      window.removeEventListener('femperf_data_updated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  const status = getPendingQuestionnairesStatus(
    activeAthlete.id,
    todayStr,
    wellnessList,
    rpeList,
    hydrationList
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-card p-3 space-y-2.5 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px]">
        <span className="font-extrabold uppercase text-slate-300">
          Estado dos Questionários de Hoje ({todayStr})
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          Toca para preencher ou consultar
        </span>
      </div>

      {/* 3 Simple Status Pills */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wellness Status */}
        <button
          type="button"
          onClick={() => onSelectTab('wellness')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
            status.hasWellness
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold hover:border-amber-400'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">1. Wellness</span>
          <span className="text-xs font-black">
            {status.hasWellness ? '✅ Preenchido' : '❌ Pendente'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
            Sem limite horário
          </span>
        </button>

        {/* RPE Status */}
        <button
          type="button"
          onClick={() => onSelectTab('rpe')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
            status.hasRPE
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold hover:border-amber-400'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">2. PSE (RPE)</span>
          <span className="text-xs font-black">
            {status.hasRPE ? '✅ Preenchido' : '❌ Pendente'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
            Sem limite horário
          </span>
        </button>

        {/* Hydration Status */}
        <button
          type="button"
          onClick={() => onSelectTab('hydration')}
          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
            status.hasPreHydration && status.hasPostHydration
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : status.hasPreHydration || status.hasPostHydration
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 font-bold'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold hover:border-amber-400'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">3. Pesagem (Pré/Pós)</span>
          <span className="text-xs font-black">
            {status.hasPreHydration && status.hasPostHydration
              ? '✅ Pré + Pós'
              : status.hasPreHydration
              ? '✅ Matinal/Pré'
              : status.hasPostHydration
              ? '🟡 Pós OK'
              : '❌ Pendente'}
          </span>
          <span className="text-[9px] font-bold text-slate-400 mt-0.5">
            Sem limite horário
          </span>
        </button>
      </div>
    </div>
  );
};
