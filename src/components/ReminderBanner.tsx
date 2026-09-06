'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry } from '@/lib/types';
import {
  getPendingQuestionnairesStatus,
  getNotificationPermission,
  requestNotificationPermission,
  sendMobileNotification,
  checkAndSendPendingReminder,
  startAutomaticReminderScheduler
} from '@/lib/reminderUtils';
import { Smartphone } from 'lucide-react';

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
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  const todayStr = new Date().toISOString().split('T')[0];

  const status = getPendingQuestionnairesStatus(
    activeAthlete.id,
    todayStr,
    wellnessList,
    rpeList,
    hydrationList
  );

  useEffect(() => {
    setPermission(getNotificationPermission());

    if (getNotificationPermission() === 'granted' && !status.isComplete) {
      checkAndSendPendingReminder(
        activeAthlete.id,
        activeAthlete.name,
        todayStr,
        wellnessList,
        rpeList,
        hydrationList
      );
    }

    const cleanup = startAutomaticReminderScheduler(
      activeAthlete.id,
      activeAthlete.name,
      wellnessList,
      rpeList,
      hydrationList
    );

    return () => cleanup();
  }, [activeAthlete.id, activeAthlete.name, status.isComplete]);

  const handleEnableMobileNotifications = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);

    if (res === 'granted') {
      sendMobileNotification(
        '⚽ Gil Vicente FC',
        `Lembretes no telemóvel ativados para ${activeAthlete.name.split(' ')[0]}.`
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-card p-3 space-y-2 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px]">
        <span className="font-extrabold uppercase text-slate-300">
          Estado dos Questionários de Hoje ({todayStr})
        </span>

        {permission !== 'granted' && permission !== 'unsupported' && (
          <button
            type="button"
            onClick={handleEnableMobileNotifications}
            className="flex items-center space-x-1 font-extrabold text-amber-400 hover:text-amber-300 transition-all"
          >
            <Smartphone className="h-3 w-3" />
            <span>Ativar Alertas</span>
          </button>
        )}
      </div>

      {/* 3 Simple Status Pills */}
      <div className="grid grid-cols-3 gap-2">
        {/* Wellness Status */}
        <button
          type="button"
          onClick={() => onSelectTab('wellness')}
          className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl border text-center transition-all ${
            status.hasWellness
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">1. Wellness</span>
          <span className="text-xs font-black sm:ml-1.5">
            {status.hasWellness ? '✅ Preenchido' : '❌ Pendente'}
          </span>
        </button>

        {/* RPE Status */}
        <button
          type="button"
          onClick={() => onSelectTab('rpe')}
          className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl border text-center transition-all ${
            status.hasRPE
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">2. PSE (RPE)</span>
          <span className="text-xs font-black sm:ml-1.5">
            {status.hasRPE ? '✅ Preenchido' : '❌ Pendente'}
          </span>
        </button>

        {/* Hydration Status */}
        <button
          type="button"
          onClick={() => onSelectTab('hydration')}
          className={`flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl border text-center transition-all ${
            status.hasHydration
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">3. Pesagem</span>
          <span className="text-xs font-black sm:ml-1.5">
            {status.hasHydration ? '✅ Preenchido' : '❌ Pendente'}
          </span>
        </button>
      </div>
    </div>
  );
};
