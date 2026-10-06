'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, X, ShieldCheck, Share, PlusSquare, Smartphone, Send, ExternalLink, HelpCircle } from 'lucide-react';
import { checkPushSubscriptionStatus, registerPushSubscription, isIosDevice, isPwaStandalone } from '@/lib/pushSubscription';
import { secureFetch } from '@/lib/authGuard';

interface PushNotificationBannerProps {
  athleteId?: string;
}

export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({ athleteId }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<string>('default');
  const [loading, setLoading] = useState<boolean>(false);
  const [testingPush, setTestingPush] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const checkStatus = async () => {
    const ios = isIosDevice();
    const standalone = isPwaStandalone();
    setIsIOS(ios);
    setIsStandalone(standalone);

    const status = await checkPushSubscriptionStatus();
    setPermissionState(status.permission);
    setIsSubscribed(status.isSubscribed);

    const isDismissed = sessionStorage.getItem('femperf_push_banner_dismissed') === 'true';
    if (isDismissed && status.isSubscribed) {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [athleteId]);

  const handleEnablePush = async () => {
    setLoading(true);
    setFeedback(null);

    // If on iOS and not in standalone PWA, show step-by-step modal guide
    if (isIOS && !isStandalone) {
      setLoading(false);
      setShowIOSModal(true);
      return;
    }

    const result = await registerPushSubscription(athleteId);
    setLoading(false);

    if (result.success) {
      setIsSubscribed(true);
      setFeedback({
        type: 'success',
        message: '✅ Alertas em 2º plano ativados com sucesso! O teu telemóvel já vai receber os avisos mesmo com a app fechada.',
      });
      // Automatically send a quick test push so the player sees it immediately
      handleTestPush();
    } else {
      setFeedback({ type: 'error', message: result.message || 'Não foi possível ativar as notificações.' });
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await secureFetch('/api/notifications/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId }),
      });
      const data = await res.json();
      if (data.sent > 0) {
        setFeedback({
          type: 'success',
          message: '📲 Notificação de teste enviada! Verifica o teu ecrã de bloqueio.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Não foi possível entregar o teste. Confirma que tens as notificações permitidas no telemóvel.',
        });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Erro de comunicação ao enviar teste.' });
    } finally {
      setTestingPush(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('femperf_push_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="w-full max-w-4xl mx-auto mb-4 rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/60 via-dark-card to-dark-card p-4 shadow-xl text-slate-100 animate-fade-in relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isSubscribed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'} shadow-inner mt-0.5`}>
              {isSubscribed ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <Bell className="h-5 w-5 animate-pulse text-red-400" />}
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-black uppercase tracking-wide text-slate-100 flex items-center gap-1.5 flex-wrap">
                <span>Alertas em 2º Plano (App Fechada)</span>
                {isSubscribed ? (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 border border-emerald-500/30">
                    Ativo neste Telemóvel
                  </span>
                ) : (
                  <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 border border-red-500/30">
                    Não Ativado
                  </span>
                )}
              </h4>

              {isSubscribed ? (
                <p className="text-xs text-emerald-300/90 mt-0.5 max-w-xl leading-relaxed">
                  O teu telemóvel está <strong>pronto para receber notificações</strong> mesmo com a aplicação fechada nos horários de <strong>Wellness, Pesagens e PSE</strong>.
                </p>
              ) : isIOS && !isStandalone ? (
                <div className="text-xs text-slate-200 space-y-1.5 pt-1">
                  <p className="font-bold text-amber-300">
                    📱 Tens iPhone? A Apple exige 2 passos simples para receberes notificações com a app fechada:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    1. Toca no ícone de <strong>Partilhar</strong> <Share className="h-3 w-3 inline text-amber-300" /> no fundo do Safari e escolhe <strong>&quot;Adicionar ao Ecrã Principal&quot;</strong> <PlusSquare className="h-3 w-3 inline text-amber-300" />.
                    <br />
                    2. Abre a app pelo ícone no teu ecrã e clica em <strong>Ativar Notificações</strong>.
                  </p>
                </div>
              ) : permissionState === 'denied' ? (
                <div className="text-xs text-amber-300 pt-1">
                  <p className="font-bold">⚠️ As notificações estão bloqueadas no teu telemóvel/navegador.</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Acede a Definições do Telemóvel ➔ Safari / Chrome ➔ Notificações e seleciona <strong>Permitir</strong>.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl leading-relaxed">
                  Recebe alertas automáticos no teu ecrã de bloqueio <strong className="text-amber-400 font-bold">mesmo com a aplicação fechada</strong> às horas do
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

        {/* Action Buttons */}
        <div className="mt-3 flex items-center justify-end space-x-2">
          {isSubscribed ? (
            <button
              type="button"
              onClick={handleTestPush}
              disabled={testingPush}
              className="w-full sm:w-auto rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 px-4 py-2 text-xs font-black uppercase text-emerald-300 shadow-sm active:scale-98 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 text-emerald-400" />
              <span>{testingPush ? 'A enviar teste...' : 'Testar Notificação no meu Telemóvel'}</span>
            </button>
          ) : isIOS && !isStandalone ? (
            <button
              type="button"
              onClick={() => setShowIOSModal(true)}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-orange-950/40 hover:from-amber-500 hover:to-orange-500 active:scale-98 transition-all flex items-center justify-center space-x-2 border border-amber-400/40"
            >
              <Smartphone className="h-4 w-4 text-white" />
              <span>Ver Passo a Passo para iPhone</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-5 py-2.5 text-xs font-black uppercase text-white shadow-lg shadow-red-900/40 hover:from-red-500 hover:to-red-600 active:scale-98 transition-all flex items-center justify-center space-x-2 border border-red-400/30 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4 text-white" />
              <span>{loading ? 'A registar no servidor...' : '🔔 Ativar Notificações no meu Telemóvel'}</span>
            </button>
          )}
        </div>

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

      {/* Modal Guia Passo a Passo iPhone */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900 p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <Smartphone className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase">Ativar Alertas no iPhone (iOS)</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              No iPhone (Apple), as notificações em segundo plano só funcionam quando a aplicação está instalada no teu ecrã:
            </p>

            <div className="space-y-3 text-xs">
              <div className="flex items-start space-x-3 bg-dark-bg/80 p-3 rounded-xl border border-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-black text-xs">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-100">Clica em Partilhar</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No Safari (ao fundo do ecrã do teu iPhone), clica no quadrado com uma seta a apontar para cima (<Share className="h-3 w-3 inline text-amber-300" />).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-dark-bg/80 p-3 rounded-xl border border-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-black text-xs">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-100">Adicionar ao Ecrã Principal</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Desce nas opções e escolhe <strong className="text-amber-300">&quot;Adicionar ao Ecrã Principal&quot;</strong> (<PlusSquare className="h-3 w-3 inline text-amber-300" />) e confirma no canto superior direito.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-dark-bg/80 p-3 rounded-xl border border-slate-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white font-black text-xs">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-100">Abre a App pelo Ecrã e Ativa</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Fecha o Safari, toca no novo ícone <strong>FemPerf</strong> que surgiu no teu telemóvel e clica no botão <strong>Ativar Notificações</strong>!
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs uppercase tracking-wider hover:from-red-500 hover:to-red-600 active:scale-98 transition-all"
            >
              Entendido! Vou fazer agora
            </button>
          </div>
        </div>
      )}
    </>
  );
};

