'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry } from '@/lib/types';
import {
  getPendingQuestionnairesStatus,
  getNotificationPermission,
  sendMobileNotification,
  startAutomaticReminderScheduler,
  getTodayLocalDateStr,
} from '@/lib/reminderUtils';
import {
  registerPushSubscription,
  syncPushSubscriptionIfGranted,
  checkPushSubscriptionStatus,
  PushStatusResult,
  isIosDevice,
  isPwaStandalone,
} from '@/lib/pushSubscription';
import { secureFetch } from '@/lib/authGuard';
import { isSubmissionPastDeadline } from '@/lib/storage';
import { Smartphone, CheckCircle2, Bell, ChevronDown, ChevronUp, Lock, Clock } from 'lucide-react';

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
  const [pushStatus, setPushStatus] = useState<PushStatusResult | null>(null);
  const [isEnablingPush, setIsEnablingPush] = useState<boolean>(false);
  const [showIosHelp, setShowIosHelp] = useState<boolean>(false);
  const [testFeedback, setTestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const wellnessDeadline = isSubmissionPastDeadline(todayStr, 'wellness', activeAthlete.id);
  const rpeDeadline = isSubmissionPastDeadline(todayStr, 'rpe', activeAthlete.id);

  const refreshPushStatus = useCallback(async () => {
    try {
      const currentPerm = getNotificationPermission();
      setPermission(currentPerm);
      let statusRes = await checkPushSubscriptionStatus();

      // Silently auto-sync Web Push subscription with server whenever permission is granted
      if (currentPerm === 'granted' && statusRes.supported) {
        await syncPushSubscriptionIfGranted(activeAthlete.id);
      }

      setPushStatus(statusRes);
    } catch (e) {
      console.warn('Erro ao verificar status push:', e);
    }
  }, [activeAthlete.id]);

  useEffect(() => {
    refreshPushStatus();

    const cleanup = startAutomaticReminderScheduler(
      activeAthlete.id,
      activeAthlete.name,
      wellnessList,
      rpeList,
      hydrationList
    );

    return () => cleanup();
  }, [activeAthlete.id, activeAthlete.name, refreshPushStatus, status.isComplete, todayStr, refreshCounter]);

  const handleEnableMobileNotifications = async () => {
    setTestFeedback(null);
    setIsEnablingPush(true);
    try {
      const result = await registerPushSubscription(activeAthlete.id);
      await refreshPushStatus();

      if (result.success) {
        sendMobileNotification(
          '⚽ Gil Vicente FC (Futebol Feminino)',
          'Notificações em 2º Plano Ativadas! Vais receber avisos mesmo com a app fechada.',
          'gvfc-welcome',
          true
        );
        setTestFeedback({
          type: 'success',
          message: '🔔 Notificações em 2º plano (App Fechada) ativadas com sucesso neste telemóvel!',
        });
      } else {
        setTestFeedback({
          type: 'error',
          message: result.message || 'Permissão não concedida. No iPhone, adiciona a app ao Ecrã Principal.',
        });
        if (isIosDevice() && !isPwaStandalone()) {
          setShowIosHelp(true);
        }
      }
    } finally {
      setIsEnablingPush(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestFeedback(null);

    // 1. Ensure device is properly registered in server database
    await syncPushSubscriptionIfGranted(activeAthlete.id);

    // 2. Immediate local feedback (forced test)
    sendMobileNotification(
      '⚽ Gil Vicente FC (Futebol Feminino)',
      'Notificação de Teste: Tudo a postos para os teus questionários diários!',
      'test-local',
      true
    );

    // 3. Trigger server-side push test to verify true background delivery
    try {
      let res = await secureFetch('/api/notifications/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: activeAthlete.id }),
      });
      let data = await res.json();

      // If server had 0 devices recorded, force renewal and retry
      if (data.success && data.sent === 0) {
        await registerPushSubscription(activeAthlete.id, true);
        res = await secureFetch('/api/notifications/test-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId: activeAthlete.id }),
        });
        data = await res.json();
      }

      if (data.success && data.sent > 0) {
        setTestFeedback({
          type: 'success',
          message: `🔔 Notificação enviada pelo servidor para o teu telemóvel (${data.sent} dispositivo(s))! Fecha a aplicação para confirmares a receção com a app fechada.`,
        });
      } else {
        setTestFeedback({
          type: 'success',
          message: '🔔 Notificação emitida no teu ecrã com sucesso!',
        });
      }
    } catch {
      setTestFeedback({
        type: 'success',
        message: '🔔 Notificação emitida no teu ecrã com sucesso!',
      });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-card p-3 space-y-2 shadow-md">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px] gap-2">
        <span className="font-extrabold uppercase text-slate-300 truncate">
          Estado dos Questionários de Hoje ({todayStr})
        </span>

        {pushStatus?.isSubscribed ? (
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30 shadow-sm">
              <CheckCircle2 className="h-3 w-3" />
              <span>2º Plano Ativo</span>
            </span>
            <button
              type="button"
              onClick={handleSendTestNotification}
              title="Enviar notificação de teste para este telemóvel"
              className="flex items-center space-x-1 font-extrabold text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px]"
            >
              <Smartphone className="h-3 w-3" />
              <span>Testar</span>
            </button>
          </div>
        ) : pushStatus?.reason === 'ios_safari_needs_pwa' ? (
          <button
            type="button"
            onClick={() => setShowIosHelp((prev) => !prev)}
            className="flex items-center space-x-1 font-extrabold text-indigo-300 hover:text-indigo-200 transition-all active:scale-95 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-500/40 shadow-sm shrink-0 text-[10px]"
          >
            <Smartphone className="h-3 w-3 text-indigo-400" />
            <span>Instalar no iPhone</span>
            {showIosHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        ) : pushStatus?.permission === 'denied' ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-500/30">
            <span>Alertas Bloqueados</span>
          </span>
        ) : pushStatus?.supported ? (
          <button
            type="button"
            onClick={handleEnableMobileNotifications}
            disabled={isEnablingPush}
            className="flex items-center space-x-1 font-extrabold text-amber-300 hover:text-amber-200 transition-all active:scale-95 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40 shadow-sm shrink-0 text-[10px]"
          >
            <Bell className="h-3 w-3 animate-pulse text-amber-300" />
            <span>{isEnablingPush ? 'A Ativar...' : 'Ativar Alertas (2º Plano)'}</span>
          </button>
        ) : null}
      </div>

      {/* iOS Safari PWA Installation Instructions Banner */}
      {(pushStatus?.reason === 'ios_safari_needs_pwa' || showIosHelp) && (
        <div className="p-3 bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 rounded-xl text-xs space-y-2 animate-fade-in shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-indigo-300 text-xs">
              <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Como ativar notificações com a app fechada no iPhone / iPad</span>
            </div>
            {pushStatus?.reason !== 'ios_safari_needs_pwa' && (
              <button
                type="button"
                onClick={() => setShowIosHelp(false)}
                className="text-slate-400 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            No sistema iOS da Apple, as notificações com a <strong>aplicação fechada</strong> (Push em 2º plano) exigem que a app esteja adicionada ao Ecrã Principal:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-indigo-500/30">
              <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">1</span>
              <span className="text-slate-200 leading-snug">No Safari, toca no botão <strong>Partilhar</strong> (quadrado com seta ⎋)</span>
            </div>
            <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-indigo-500/30">
              <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">2</span>
              <span className="text-slate-200 leading-snug">Desce e escolhe <strong>Adicionar ao Ecrã Principal</strong></span>
            </div>
            <div className="flex items-start gap-2 bg-slate-900/90 p-2 rounded-lg border border-indigo-500/30">
              <span className="w-5 h-5 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold shrink-0 text-[10px] mt-0.5">3</span>
              <span className="text-slate-200 leading-snug">Abre a app pelo ícone no teu ecrã e clica em <strong>Ativar Alertas</strong>!</span>
            </div>
          </div>
        </div>
      )}

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
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
            status.hasWellness
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : wellnessDeadline.hasDeadline && wellnessDeadline.isPast && wellnessDeadline.strictBlock
              ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">1. Wellness</span>
          <span className="text-xs font-black">
            {status.hasWellness
              ? '✅ Preenchido'
              : wellnessDeadline.hasDeadline && wellnessDeadline.isPast && wellnessDeadline.strictBlock
              ? '🔒 Fechado'
              : wellnessDeadline.isAuthorizedLate
              ? '🔓 Autorizada'
              : '❌ Pendente'}
          </span>
          {!status.hasWellness && wellnessDeadline.hasDeadline && (
            <span className={`text-[9px] font-semibold mt-0.5 ${
              wellnessDeadline.isAuthorizedLate
                ? 'text-emerald-400'
                : wellnessDeadline.isPast
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}>
              {wellnessDeadline.isAuthorizedLate
                ? 'Pós-prazo permitido'
                : wellnessDeadline.isPast
                ? `Expirou (${wellnessDeadline.deadlineTime})`
                : `Até às ${wellnessDeadline.deadlineTime}`}
            </span>
          )}
        </button>

        {/* RPE Status */}
        <button
          type="button"
          onClick={() => onSelectTab('rpe')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
            status.hasRPE
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : rpeDeadline.hasDeadline && rpeDeadline.isPast && rpeDeadline.strictBlock
              ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
              : rpeDeadline.isAuthorizedLate
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
              : 'border-amber-500/40 bg-amber-950/20 text-amber-300 font-extrabold'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400">2. PSE (RPE)</span>
          <span className="text-xs font-black">
            {status.hasRPE
              ? '✅ Preenchido'
              : rpeDeadline.hasDeadline && rpeDeadline.isPast && rpeDeadline.strictBlock
              ? '🔒 Fechado'
              : rpeDeadline.isAuthorizedLate
              ? '🔓 Autorizada'
              : '❌ Pendente'}
          </span>
          {!status.hasRPE && rpeDeadline.hasDeadline && (
            <span className={`text-[9px] font-semibold mt-0.5 ${
              rpeDeadline.isAuthorizedLate
                ? 'text-emerald-400'
                : rpeDeadline.isPast
                ? 'text-rose-400'
                : 'text-emerald-400'
            }`}>
              {rpeDeadline.isAuthorizedLate
                ? 'Pós-prazo permitido'
                : rpeDeadline.isPast
                ? `Expirou (${rpeDeadline.deadlineTime})`
                : `Até às ${rpeDeadline.deadlineTime}`}
            </span>
          )}
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
          <span className="text-[10px] font-bold text-slate-400">3. Peso</span>
          <span className="text-xs font-black sm:ml-1.5">
            {status.hasPreHydration && status.hasPostHydration
              ? '✅ Pré + Pós'
              : status.hasPreHydration
              ? '✅ Matinal/Pré'
              : status.hasPostHydration
              ? '🟡 Pós OK'
              : '❌ Pendente'}
          </span>
        </button>
      </div>
    </div>
  );
};
