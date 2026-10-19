'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, MobilityPlan } from '@/lib/types';
import { getPlansForAthlete, isMobilityCompletedToday } from '@/lib/mobilityPlans';
import { MobilityPlanModal } from './MobilityPlanModal';
import { useLanguage } from '@/context/LanguageContext';
import { Dumbbell, Clock, Sparkles, CheckCircle2, ChevronRight, Eye, ShieldCheck, Zap, Layers } from 'lucide-react';

interface AthleteMobilityPlanCardProps {
  athlete: Athlete | null;
}

export const AthleteMobilityPlanCard: React.FC<AthleteMobilityPlanCardProps> = ({ athlete }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [plans, setPlans] = useState<MobilityPlan[]>([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<MobilityPlan | null>(null);
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({});

  const updatePlans = () => {
    if (!athlete) {
      setPlans([]);
      return;
    }
    const athletePlans = getPlansForAthlete(athlete);
    setPlans(athletePlans);

    const map: Record<string, boolean> = {};
    athletePlans.forEach((p) => {
      map[p.id] = isMobilityCompletedToday(athlete.id, p.id);
    });
    setCompletedMap(map);
  };

  useEffect(() => {
    updatePlans();

    const handleUpdate = () => {
      updatePlans();
    };

    window.addEventListener('femperf_mobility_plans_updated', handleUpdate);
    window.addEventListener('femperf_mobility_completed', handleUpdate);
    window.addEventListener('femperf_credentials_updated', handleUpdate);

    return () => {
      window.removeEventListener('femperf_mobility_plans_updated', handleUpdate);
      window.removeEventListener('femperf_mobility_completed', handleUpdate);
      window.removeEventListener('femperf_credentials_updated', handleUpdate);
    };
  }, [athlete]);

  if (!athlete || plans.length === 0) return null;

  const currentPlan = plans[selectedPlanIndex] || plans[0];
  const isCompleted = completedMap[currentPlan.id];

  return (
    <>
      <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-950/40 via-dark-card to-dark-surface p-4 shadow-xl relative overflow-hidden animate-fade-in space-y-3.5">
        {/* Subtle glowing background aura */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

        {/* If multiple plans assigned, show tabs */}
        {plans.length > 1 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700 relative z-10 border-b border-slate-800 pb-2">
            <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 mr-1 flex items-center space-x-1">
              <Layers className="h-3 w-3 text-blue-400" />
              <span>{isEn ? 'Your Plans:' : 'Os Teus Planos:'}</span>
            </span>
            {plans.map((p, idx) => {
              const active = idx === selectedPlanIndex;
              const done = completedMap[p.id];
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black whitespace-nowrap transition-all border shrink-0 cursor-pointer flex items-center space-x-1 ${
                    active
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <span>{p.titlePt.replace('Plano de ', '').replace('Rotina de ', '')}</span>
                  {done && <CheckCircle2 className="h-2.5 w-2.5 text-emerald-300 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-600/30 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  {currentPlan.groupBadgePt || (isEn ? 'TRAINING PLAN' : 'PLANO DE TREINO')}
                </span>
                <span className="text-[10px] font-extrabold text-brand-lime bg-lime-500/10 border border-lime-500/30 px-2 py-0.5 rounded-md">
                  {currentPlan.durationTextPt || `${currentPlan.durationMinutes} Min`}
                </span>
                {isCompleted && (
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{isEn ? 'Completed Today' : 'Feito Hoje'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight mt-1">
                {isEn ? currentPlan.titleEn : currentPlan.titlePt}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300 bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/80 gap-2">
          <div className="flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-white">{currentPlan.blocks.length} {isEn ? 'Blocks' : 'Blocos'}</strong> • {currentPlan.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} {isEn ? 'Exercises w/ Drawings' : 'Exercícios c/ Desenhos'}
            </span>
          </div>

          <div className="text-[10px] font-extrabold text-slate-400">
            {isEn ? '🇬🇧 English & 🇵🇹 Portuguese' : '🇵🇹 Português & 🇬🇧 Inglês'}
          </div>
        </div>

        {/* Main CTA button */}
        <button
          type="button"
          onClick={() => setSelectedPlanForModal(currentPlan)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-600/30 active:scale-98 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          <span>{isEn ? 'Open Interactive Plan & Drawings (PT / EN)' : 'Ver Plano & Desenhos Dinâmicos (PT / EN)'}</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </button>
      </div>

      {/* Modal viewer */}
      {selectedPlanForModal && (
        <MobilityPlanModal
          plan={selectedPlanForModal}
          athlete={athlete}
          isOpen={Boolean(selectedPlanForModal)}
          onClose={() => setSelectedPlanForModal(null)}
        />
      )}
    </>
  );
};
