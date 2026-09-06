'use client';

import React, { useState, useEffect } from 'react';
import { Athlete } from '@/lib/types';
import { getStoredActiveAthlete, setStoredActiveAthleteId } from '@/lib/storage';
import { Header } from '@/components/Header';
import { AthleteSelector } from '@/components/AthleteSelector';
import { WellnessForm } from '@/components/WellnessForm';
import { RPEForm } from '@/components/RPEForm';
import { HydrationDashboard } from '@/components/HydrationDashboard';
import { AdminDashboard } from '@/components/AdminDashboard';
import { PhysioDashboard } from '@/components/PhysioDashboard';
import { ReminderBanner } from '@/components/ReminderBanner';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { HeartPulse, Dumbbell, Droplet, User, Smartphone, Shield, Stethoscope } from 'lucide-react';

function MainAppContent() {
  const { t } = useLanguage();
  const [activeAthlete, setActiveAthlete] = useState<Athlete | null>(null);
  const [isChangingAthlete, setIsChangingAthlete] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isPhysioOpen, setIsPhysioOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'wellness' | 'rpe' | 'hydration'>('wellness');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Load persisted athlete
    const stored = getStoredActiveAthlete();
    if (stored) {
      setActiveAthlete(stored);
    } else {
      setIsChangingAthlete(true);
    }
    setIsLoaded(true);

    // Online / Offline listener
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleSelectAthlete = (athlete: Athlete) => {
    setActiveAthlete(athlete);
    setStoredActiveAthleteId(athlete.id);
    setIsChangingAthlete(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg text-slate-100 selection:bg-brand-lime selection:text-slate-950">
      {/* App Header */}
      <Header
        activeAthlete={activeAthlete}
        onChangeAthlete={() => setIsChangingAthlete(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPhysio={() => setIsPhysioOpen(true)}
        isOnline={isOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 max-w-lg mx-auto w-full">
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

            {activeAthlete && (
              <button
                type="button"
                onClick={() => setIsChangingAthlete(false)}
                className="w-full rounded-xl border border-slate-800 bg-dark-card py-3 text-xs font-bold text-slate-300 hover:bg-slate-800"
              >
                {t.header.changeAthlete} ({activeAthlete.name})
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Daily Questionnaire Reminder Banner */}
            <ReminderBanner
              activeAthlete={activeAthlete}
              onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* Top Navigation Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-dark-card p-1.5 border border-slate-800 shadow-md">
              <button
                type="button"
                onClick={() => setActiveTab('wellness')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'wellness'
                    ? 'bg-brand-lime text-slate-950 shadow-md shadow-brand-lime/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <HeartPulse className="h-4 w-4 mb-1" />
                <span className="text-[11px] truncate">1. {t.tabs.wellness}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rpe')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'rpe'
                    ? 'bg-brand-cyan text-slate-950 shadow-md shadow-brand-cyan/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dumbbell className="h-4 w-4 mb-1" />
                <span className="text-[11px] truncate">2. {t.tabs.rpe}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('hydration')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'hydration'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplet className="h-4 w-4 mb-1" />
                <span className="text-[11px] truncate">3. {t.tabs.hydration}</span>
              </button>
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
            </div>
          </div>
        )}
      </main>

      {/* Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      {/* Physiotherapist Dashboard Modal */}
      <PhysioDashboard
        isOpen={isPhysioOpen}
        onClose={() => setIsPhysioOpen(false)}
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
              onClick={() => setIsPhysioOpen(true)}
              className="flex items-center space-x-1 text-teal-400 hover:text-teal-300 font-bold"
            >
              <Stethoscope className="h-3 w-3" />
              <span>Gabinete Médico</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
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
