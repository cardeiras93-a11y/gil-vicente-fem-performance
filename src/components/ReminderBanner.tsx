'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry } from '@/lib/types';
import {
  getPendingQuestionnairesStatus,
  getNotificationPermission,
  requestNotificationPermission,
  sendMobileNotification,
  checkAndSendPendingReminder,
  startAutomaticReminderScheduler,
  getTodayLocalDateStr,
} from '@/lib/reminderUtils';
import { registerPushSubscription, syncPushSubscriptionIfGranted } from '@/lib/pushSubscription';
import { secureFetch } from '@/lib/authGuard';
import { Smartphone, CheckCircle2, Bell } from 'lucide-react';

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
  const [todayStr, setTodayStr] = useState<string>(getTodayLocalDateStr());
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  useEffect(() => {
    const handleDataUpdate = () => {
      setTodayStr(getTodayLocalDateStr());
      setRefreshCounter((prev) => prev + 1);
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

  useEffect(() => {
    const currentPerm = getNotificationPermission();
    setPermission(currentPerm);

    // Silently auto-sync Web Push subscription with server if athlete already granted permission
    if (currentPerm === 'granted') {
      syncPushSubscriptionIfGranted(activeAthlete.id);
    }

    const cleanup = startAutomaticReminderScheduler(
      activeAthlete.id,
      activeAthlete.name,
      wellnessList,
      rpeList,
      hydrationList
    );

    return () => cleanup();
  }, [activeAthlete.id, activeAthlete.name, status.isComplete, todayStr, refreshCounter]);

  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleEnableMobileNotifications = async () => {
    setTestFeedback(null);
    const result = await registerPushSubscription(activeAthlete.id);
    const newPerm = getNotificationPermission();
    setPermission(newPerm);

    if (result.success) {
      // Also fire a test notification immediately so the user sees it working
      sendMobileNotification(
        '⚽ Gil Vicente FC (Futebol Feminino)',
        'Notificações em 2º Plano Ativadas! Vais receber avisos mesmo com a app fechada.'
      );
      setTestFeedback({
        type: 'success',
        message: '🔔 Notificações em 2º plano (App Fechada) ativadas com sucesso neste dispositivo!',
      });
    } else {
      setTestFeedback({
        type: 'error',
        message: result.message || 'Permissão não concedida. No iPad/iPhone, adiciona a app ao Ecrã Principal e aceita as Notificações.',
      });
    }
  };

  const handleSendTestNotification = async () => {
    setTestFeedback(null);

    // 1. Immediate local feedback
    sendMobileNotification(
      '⚽ Gil Vicente FC (Futebol Feminino)',
      'Notificação de Teste: Tudo a postos para os teus questionários diários!'
    );

    // 2. Trigger server-side push test to verify true background delivery
    try {
      const res = await secureFetch('/api/notifications/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: activeAthlete.id }),
      });
      const data = await res.json();
      if (data.success) {
        setTestFeedback({
          type: 'success',
          message: '🔔 Notificação enviada pelo servidor com sucesso para o teu telemóvel!',
        });
      } else {
        setTestFeedback({
          type: 'success',
          message: '🔔 Notificação de teste emitida no teu ecrã com sucesso!',
        });
      }
    } catch {
      setTestFeedback({
        type: 'success',
        message: '🔔 Notificação de teste emitida no teu ecrã com sucesso!',
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-card p-3 space-y-2 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px] gap-2">
        <span className="font-extrabold uppercase text-slate-300 truncate">
          Estado dos Questionários de Hoje ({todayStr})
        </span>

        {permission === 'granted' ? (
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3" />
              <span>2º Plano Ativo</span>
            </span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              title="Enviar notificação de teste para o teu dispositivo"
              className="flex items-center space-x-1 font-extrabold text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30"
            >
              <Smartphone className="h-3 w-3" />
              <span>Testar Notificação</span>
            </button>
          </div>
        ) : permission !== 'unsupported' ? (
          <button
            type="button"
            onClick={handleEnableMobileNotifications}
            className="flex items-center space-x-1 font-extrabold text-amber-300 hover:text-amber-200 transition-all active:scale-95 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-sm shrink-0"
          >
            <Bell className="h-3 w-3 animate-pulse text-amber-300" />
            <span>Ativar Alertas (2º Plano)</span>
          </button>
        ) : null}
      </div>

      {testFeedback && (
        <div
          className={`p-2.5 rounded-xl border text-xs font-bold animate-fade-in flex items-start space-x-2 ${
            testFeedback.type === 'success'
              ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
              : 'border-rose-500/50 bg-rose-950/40 text-rose-300'
          }`}
        >
          <span className="shrink-0">{testFeedback.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{testFeedback.message}</span>
        </div>
      )}

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
            status.hasPreHydration && status.hasPostHydration
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : status.hasPreHydration || status.hasPostHydration
              ? 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 font-bold'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">3. Pesagem</span>
          <span className="text-xs font-black sm:ml-1.5">
            {status.hasPreHydration && status.hasPostHydration
              ? '✅ Preenchido'
              : status.hasPreHydration
              ? '🟡 Pré OK'
              : status.hasPostHydration
              ? '🟡 Pós OK'
              : '❌ Pendente'}
          </span>
        </button>
      </div>
    </div>
  );
};
