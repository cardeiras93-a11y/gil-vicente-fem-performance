'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, X, ShieldCheck, Share, PlusSquare, Smartphone } from 'lucide-react';
import { checkPushSubscriptionStatus, registerPushSubscription } from '@/lib/pushSubscription';

interface PushNotificationBannerProps {
  athleteId?: string;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({ athleteId }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isIOSBrowser, setIsIOSBrowser] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;

    // Detect iOS (iPhone / iPad) running in standard Safari tab vs standalone PWA
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = typeof window !== 'undefined' && ('standalone' in window.navigator && (window.navigator as any).standalone);

    if (isIOS && !isStandalone) {
      setIsIOSBrowser(true);
    }

    checkPushSubscriptionStatus().then((status) => {
      if (!mounted) return;
      setPermissionState(status.permission);
      setIsSubscribed(status.isSubscribed);

      const isDismissed = sessionStorage.getItem('femperf_push_banner_dismissed') === 'true';

      // Show banner if not subscribed AND not dismissed for session (or if iOS Safari needs Home Screen install)
      if (!status.isSubscribed && !isDismissed) {
        setIsVisible(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [athleteId]);

  const handleEnablePush = async () => {
    setLoading(true);
    setFeedback(null);

    const result = await registerPushSubscription(athleteId);
    setLoading(false);

    if (result.success) {
      setIsSubscribed(true);
      setFeedback({ type: 'success', message: result.message || 'Notificações Push ativadas com sucesso neste dispositivo!' });
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    } else {
      setFeedback({ type: 'error', message: result.message || 'Não foi possível ativar as notificações.' });
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('femperf_push_banner_dismissed', 'true');
  };

  if (!isVisible || isSubscribed) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-4 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/50 via-dark-card to-dark-card p-4 shadow-xl text-slate-100 animate-fade-in relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shadow-inner mt-0.5">
            <Bell className="h-5 w-5 animate-pulse text-red-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black uppercase tracking-wide text-slate-100 flex items-center gap-1.5 flex-wrap">
              <span>Lembretes de Treino & Saúde</span>
              <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/30">
                Web Push
              </span>
            </h4>

            {isIOSBrowser ? (
              <div className="text-xs text-slate-200 space-y-1.5 pt-1">
                <p className="font-semibold text-amber-300">
                  📱 <strong>Para receberes notificações com a app fechada no teu iPhone/iPad:</strong>
                </p>
                <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-1 bg-dark-bg/60 p-2.5 rounded-xl border border-slate-800">
                  <li>
                    Clica no botão <strong className="text-amber-300 inline-flex items-center gap-1">Partilhar <Share className="h-3 w-3 inline text-amber-300" /></strong> na barra inferior do Safari.
                  </li>
                  <li>
                    Seleciona <strong className="text-amber-300 inline-flex items-center gap-1">Adicionar ao Ecrã Principal <PlusSquare className="h-3 w-3 inline text-amber-300" /></strong>.
                  </li>
                  <li>Abre a aplicação pelo novo ícone no teu telemóvel para ativares as notificações em 2º plano!</li>
                </ol>
              </div>
            ) : permissionState === 'denied' ? (
              <div className="text-xs text-amber-300 pt-1">
                <p className="font-bold">⚠️ As notificações estão bloqueadas no teu navegador.</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Acede a Definições do Navegador ➔ Definições do Site ➔ Notificações e seleciona <strong>Permitir</strong> para o site.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                Recebe alertas automáticos no ecrã de bloqueio <strong className="text-amber-400 font-bold">mesmo com a aplicação fechada</strong> nos horários de preenchimento de
                <strong className="text-amber-400 font-bold"> Wellness, Pesagens e PSE</strong>.
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-xl border border-slate-700 bg-slate-800/80 p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all shrink-0"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!isIOSBrowser && permissionState !== 'denied' && (
        <div className="mt-3 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={handleEnablePush}
            disabled={loading}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-red-600 active:scale-98 transition-all flex items-center justify-center space-x-2 border border-red-400/30 disabled:opacity-50"
          >
            <ShieldCheck className="h-4 w-4 text-white" />
            <span>{loading ? 'A registar no servidor...' : 'Ativar Alertas em 2º Plano (App Fechada)'}</span>
          </button>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-3 flex items-center space-x-2 rounded-xl p-2.5 text-xs font-bold ${
            feedback.type === 'success'
              ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
