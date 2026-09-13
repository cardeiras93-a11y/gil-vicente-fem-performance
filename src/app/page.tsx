'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Athlete } from '@/lib/types';
import { getStoredActiveAthlete, setStoredActiveAthleteId, setAthleteSession, getAthleteSessionId, clearAthleteSession, isClubAccessGranted, syncAllDataFromCloud } from '@/lib/storage';
import { Header } from '@/components/Header';
import { AthleteSelector } from '@/components/AthleteSelector';
import { WellnessForm } from '@/components/WellnessForm';
import { RPEForm } from '@/components/RPEForm';
import { HydrationDashboard } from '@/components/HydrationDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PhysioDashboard } from '@/components/PhysioDashboard';
import { AthleteProfileModal } from '@/components/AthleteProfileModal';
import { AppAccessGate } from '@/components/AppAccessGate';
import { PushNotificationBanner } from '@/components/PushNotificationBanner';
import { ReminderBanner } from '@/components/ReminderBanner';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { startGlobalAutomaticReminderScheduler } from '@/lib/reminderUtils';
import { registerPushSubscription, syncPushSubscriptionIfGranted } from '@/lib/pushSubscription';
import { MatchDashboard } from '@/components/MatchDashboard';
import { isGoalkeeper } from '@/lib/data';
import { HeartPulse, Dumbbell, Droplet, User, Smartphone, Shield, Stethoscope, AlertTriangle, Bell, Trash2, CheckCircle2, AlertCircle, Zap } from 'lucide-react';

const VIEW_MODE_KEY = 'femperf_active_view_mode';

function MainAppContent() {
  const { t } = useLanguage();

  const [hasClubAccess, setHasClubAccess] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return isClubAccessGranted();
    }
    return false;
  });

  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(() => {
    if (typeof window !== 'undefined') {
      return getStoredActiveAthlete();
    }
    return null;
  });

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(VIEW_MODE_KEY) === 'admin';
    }
    return false;
  });

  const [isPhysioOpen, setIsPhysioOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(VIEW_MODE_KEY) === 'physio';
    }
    return false;
  });

  const [isChangingAthlete, setIsChangingAthlete] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const mode = localStorage.getItem(VIEW_MODE_KEY);
      if (mode === 'admin' || mode === 'physio') return false;
      const stored = getStoredActiveAthlete();
      return !stored;
    }
    return true;
  });

  const [activeTab, setActiveTabState] = useState<'wellness' | 'rpe' | 'hydration' | 'matchday'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('femperf_athlete_active_tab') as any;
      if (stored === 'wellness' || stored === 'rpe' || stored === 'hydration' || stored === 'matchday') return stored;
    }
    return 'wellness';
  });

  const setActiveTab = (tab: 'wellness' | 'rpe' | 'hydration' | 'matchday') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_athlete_active_tab', tab);
    }
  };

  // Goalkeepers (GR) do not use GPS and do not have access to match GPS reports
  const isAthleteGoalkeeper = useMemo(() => {
    if (!activeAthlete) return false;
    return activeAthlete.position === 'GR' || isGoalkeeper(activeAthlete.name);
  }, [activeAthlete]);

  // If a goalkeeper had matchday selected previously, redirect her to wellness
  useEffect(() => {
    if (isAthleteGoalkeeper && activeTab === 'matchday') {
      setActiveTab('wellness');
    }
  }, [isAthleteGoalkeeper, activeTab]);

  // Silently auto-sync Web Push subscription in background whenever app opens or active athlete changes
  useEffect(() => {
    syncPushSubscriptionIfGranted(activeAthlete?.id);
  }, [activeAthlete?.id]);

  const [globalFeedback, setGlobalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleQuickEnableNotifications = async () => {
    setGlobalFeedback(null);
    const res = await registerPushSubscription(activeAthlete?.id);
    if (res.success) {
      setGlobalFeedback({ type: 'success', message: res.message || 'Notificações em 2º plano (App Fechada) ativadas com sucesso!' });
      setTimeout(() => setGlobalFeedback(null), 5000);
    } else {
      setGlobalFeedback({ type: 'error', message: res.message || 'Erro ao ativar notificações.' });
      setTimeout(() => setGlobalFeedback(null), 6000);
    }
  };

  const handleQuickClearCache = async () => {
    setGlobalFeedback(null);
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      syncAllDataFromCloud();

      setGlobalFeedback({ type: 'success', message: 'Cache limpa com sucesso! A recarregar a aplicação...' });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      setGlobalFeedback({ type: 'error', message: `Erro ao limpar cache: ${e?.message || 'Falha desconhecida.'}` });
      setTimeout(() => setGlobalFeedback(null), 5000);
    }
  };

  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    setIsLoaded(true);

    // Sync all cloud data (PINs, training calendar, wellness, RPE, hydration) permanently
    syncAllDataFromCloud();

    // Periodic cloud sync every 15 seconds
    const intervalId = setInterval(() => {
      syncAllDataFromCloud();
    }, 15000);

    // Sync on tab focus / visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncAllDataFromCloud();
        const ath = getStoredActiveAthlete();
        if (ath) {
          syncPushSubscriptionIfGranted(ath.id);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check if session athlete is stored
    const sessionId = getAthleteSessionId();
    if (sessionId) {
      const athleteObj = getStoredActiveAthlete();
      if (athleteObj) {
        setActiveAthlete(athleteObj);
        setIsChangingAthlete(false);
        syncPushSubscriptionIfGranted(athleteObj.id);
      }
    }

    // Start global automatic scheduled reminders (works even when no athlete profile is selected yet)
    const cleanupReminders = startGlobalAutomaticReminderScheduler();

    // Online / Offline listener
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        syncAllDataFromCloud();
      }
    };
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Refresh active athlete state on credentials update
    const handleCredentialsUpdate = () => {
      const athleteObj = getStoredActiveAthlete();
      if (athleteObj) {
        setActiveAthlete(athleteObj);
        syncPushSubscriptionIfGranted(athleteObj.id);
      }
    };
    window.addEventListener('femperf_credentials_updated', handleCredentialsUpdate);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('femperf_credentials_updated', handleCredentialsUpdate);
      cleanupReminders();
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleSelectAthlete = (athlete: Athlete) => {
    setActiveAthlete(athlete);
    setAthleteSession(athlete.id);
    setIsChangingAthlete(false);
    syncPushSubscriptionIfGranted(athlete.id);
  };

  const handleOpenAdmin = () => {
    setIsAdminOpen(true);
    setIsPhysioOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VIEW_MODE_KEY, 'admin');
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(VIEW_MODE_KEY);
    }
  };

  const handleOpenPhysio = () => {
    setIsPhysioOpen(true);
    setIsAdminOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(VIEW_MODE_KEY, 'physio');
    }
  };

  const handleClosePhysio = () => {
    setIsPhysioOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(VIEW_MODE_KEY);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-bg text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-brand-lime" />
          <span className="text-xs font-semibold uppercase tracking-wider">A carregar FemPerf...</span>
        </div>
      </div>
    );
  }

  if (!hasClubAccess) {
    return <AppAccessGate onAccessGranted={() => setHasClubAccess(true)} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg text-slate-100 selection:bg-brand-lime selection:text-slate-950">
      {/* App Header */}
      <Header
        activeAthlete={activeAthlete}
        onChangeAthlete={() => {
          clearAthleteSession();
          setActiveAthlete(null);
          setIsChangingAthlete(true);
          if (typeof window !== 'undefined') {
            localStorage.removeItem(VIEW_MODE_KEY);
          }
        }}
        onOpenAdmin={handleOpenAdmin}
        onOpenPhysio={handleOpenPhysio}
        onOpenProfile={() => setIsProfileOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className={`flex-1 px-3 sm:px-4 py-4 ${!isAthleteGoalkeeper && activeTab === 'matchday' ? 'max-w-5xl' : 'max-w-lg md:max-w-xl lg:max-w-2xl'} mx-auto w-full space-y-4`}>
        {/* Web Push Notification Consent Banner (Visible to all users until subscribed) */}
        <PushNotificationBanner athleteId={activeAthlete?.id} />

        {/* Home Screen Quick Actions Bar: Ativar Notificações & Limpar Cache */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleQuickEnableNotifications}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-red-500/40 bg-gradient-to-r from-red-600 to-red-700 py-2.5 px-3 text-xs font-black uppercase text-white shadow-md hover:from-red-500 hover:to-red-600 active:scale-98 transition-all"
          >
            <Bell className="h-4 w-4 text-amber-300 shrink-0" />
            <span className="truncate">Ativar Alertas 2º Plano</span>
          </button>

          <button
            type="button"
            onClick={handleQuickClearCache}
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-amber-500/40 bg-dark-card py-2.5 px-3 text-xs font-black uppercase text-amber-300 hover:bg-slate-800 hover:text-amber-200 active:scale-98 transition-all shadow-md"
          >
            <Trash2 className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="truncate">Limpar Cache</span>
          </button>
        </div>

        {globalFeedback && (
          <div
            className={`flex items-center space-x-2 rounded-xl p-3 text-xs font-extrabold animate-fade-in ${
              globalFeedback.type === 'success'
                ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                : 'border border-red-500/40 bg-red-500/10 text-red-300'
            }`}
          >
            {globalFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{globalFeedback.message}</span>
          </div>
        )}

        {isChangingAthlete || !activeAthlete ? (
          <div className="space-y-4 animate-fade-in">
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-dark-card to-dark-surface p-5 text-center shadow-xl">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-lime/20 text-brand-lime mb-3">
                <User className="h-6 w-6" />
              </div>
              <h2 className="text-base font-extrabold text-slate-100">{t.athleteSelector.title}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {t.athleteSelector.subtitle}
              </p>
            </div>

            <AthleteSelector
              activeAthlete={activeAthlete}
              onSelectAthlete={handleSelectAthlete}
            />

            {activeAthlete && activeAthlete.isActive !== false && (
              <button
                type="button"
                onClick={() => setIsChangingAthlete(false)}
                className="w-full rounded-xl border border-slate-800 bg-dark-card py-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                {t.header.changeAthlete} ({activeAthlete.name})
              </button>
            )}
          </div>
        ) : activeAthlete.isActive === false ? (
          <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/40 via-dark-card to-dark-surface p-6 text-center shadow-2xl space-y-4 animate-fade-in my-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-100 uppercase tracking-wide">
                Perfil Não Ativo para a Sessão de Hoje
              </h3>
              <p className="text-xs text-amber-200/90 font-medium max-w-sm mx-auto leading-relaxed">
                O teu perfil (<strong className="text-white font-extrabold">{activeAthlete.name}</strong>) não está ativo para a sessão de hoje. Se fores treinar, solicita a ativação à equipa técnica.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                clearAthleteSession();
                setActiveAthlete(null);
                setIsChangingAthlete(true);
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-all shadow-md active:scale-95"
            >
              Desvincular Dispositivo / Escolher Outra Jogadora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Daily Questionnaire Reminder Banner */}
            <ReminderBanner
              activeAthlete={activeAthlete}
              onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* Top Navigation Tabs */}
            <div className={`grid ${isAthleteGoalkeeper ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-1.5 rounded-2xl bg-dark-card p-1.5 border border-slate-800 shadow-md`}>
              <button
                type="button"
                onClick={() => setActiveTab('wellness')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all space-y-1 ${
                  activeTab === 'wellness'
                    ? 'bg-brand-lime text-slate-950 shadow-md shadow-brand-lime/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartPulse className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black leading-none text-center">
                  1. Wellness <span className="hidden sm:inline">Pré</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rpe')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all space-y-1 ${
                  activeTab === 'rpe'
                    ? 'bg-brand-cyan text-slate-950 shadow-md shadow-brand-cyan/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dumbbell className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black leading-none text-center">
                  2. PSE <span className="text-[9px] font-bold sm:text-[10px]">(RPE)</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hydration')}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-extrabold transition-all space-y-1 ${
                  activeTab === 'hydration'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplet className="h-4 w-4 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-black leading-none text-center">
                  3. Pesagem
                </span>
              </button>

              {!isAthleteGoalkeeper && (
                <button
                  type="button"
                  onClick={() => setActiveTab('matchday')}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-extrabold transition-all space-y-1 ${
                    activeTab === 'matchday'
                      ? 'bg-gradient-to-r from-sky-400 to-indigo-400 text-slate-950 shadow-md shadow-sky-400/20 scale-102'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="h-4 w-4 shrink-0 text-amber-300" />
                  <span className="text-[10px] sm:text-[11px] font-black leading-none text-center">
                    4. ⚽ Dados Jogo
                  </span>
                </button>
              )}
            </div>

            {/* Active Tab Content */}
            <div className="mt-2 animate-fade-in">
              {activeTab === 'wellness' && (
                <WellnessForm
                  activeAthlete={activeAthlete}
                  onSubmitSuccess={() => setActiveTab('rpe')}
                />
              )}

              {activeTab === 'rpe' && (
                <RPEForm
                  activeAthlete={activeAthlete}
                  onSubmitSuccess={() => setActiveTab('hydration')}
                />
              )}

              {activeTab === 'hydration' && (
                <HydrationDashboard activeAthlete={activeAthlete} />
              )}

              {!isAthleteGoalkeeper && activeTab === 'matchday' && (
                <div className="w-full pt-1 animate-fade-in">
                  <MatchDashboard
                    userRole="athlete"
                    athleteName={activeAthlete.name}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={handleCloseAdmin}
        onOpenAthleteSelector={() => {
          handleCloseAdmin();
          setIsChangingAthlete(true);
        }}
      />

      {/* Physiotherapist Dashboard Modal */}
      <PhysioDashboard
        isOpen={isPhysioOpen}
        onClose={handleClosePhysio}
      />

      {/* Athlete Profile & PIN Modal */}
      <AthleteProfileModal
        athlete={activeAthlete}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onProfileUpdated={() => {
          setActiveAthlete(getStoredActiveAthlete());
        }}
      />

      {/* Footer PWA Hint */}
      <footer className="border-t border-slate-800/80 bg-dark-bg/80 px-4 py-3 text-center text-[10px] text-slate-500">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="h-3.5 w-3.5 text-brand-lime" />
            <span>Adiciona ao Ecrã Principal do smartphone.</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleOpenPhysio}
              className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 font-bold"
            >
              <Stethoscope className="h-3 w-3" />
              <span>Gabinete Médico</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdmin}
              className="flex items-center space-x-1 text-slate-400 hover:text-brand-lime font-bold"
            >
              <Shield className="h-3 w-3" />
              <span>{t.header.adminArea}</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}
