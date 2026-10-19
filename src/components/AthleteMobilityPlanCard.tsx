'use client';

import React, { useState, useEffect } from 'react';
import { Athlete, MobilityPlan } from '@/lib/types';
import { getPlansForAthlete, isMobilityCompletedToday } from '@/lib/mobilityPlans';
import { MobilityPlanModal } from './MobilityPlanModal';
import { useLanguage } from '@/context/LanguageContext';
import { Dumbbell, Clock, Sparkles, CheckCircle2, ChevronRight, Eye, ShieldCheck, Zap } from 'lucide-react';

interface AthleteMobilityPlanCardProps {
  athlete: Athlete | null;
}

export const AthleteMobilityPlanCard: React.FC<AthleteMobilityPlanCardProps> = ({ athlete }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const [plans, setPlans] = useState<MobilityPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<MobilityPlan | null>(null);
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

  const plan = plans[0]; // Primary assigned plan
  const isCompleted = completedMap[plan.id];

  return (
    <>
      <div className="rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-950/40 via-dark-card to-dark-surface p-4 shadow-xl relative overflow-hidden animate-fade-in space-y-3">
        {/* Subtle glowing background aura */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30 shrink-0">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  ⚡ {isEn ? 'PRE-TRAINING' : 'PRÉ-TREINO'}
                </span>
                <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {plan.durationMinutes} Min
                </span>
                {isCompleted && (
                  <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{isEn ? 'Completed' : 'Feito Hoje'}</span>
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-tight mt-1">
                {isEn ? plan.titleEn : plan.titlePt}
              </h3>
            </div>
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-300 bg-slate-950/50 rounded-xl p-2.5 border border-slate-800/80 gap-2">
          <div className="flex items-center space-x-1.5">
            <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong className="text-white">4 {isEn ? 'Blocks' : 'Blocos'}</strong> • 8 {isEn ? 'Guided Exercises with Drawings' : 'Exercícios com Desenhos'}
            </span>
          </div>

          <div className="text-[10px] font-extrabold text-slate-400">
            {isEn ? '🇬🇧 English & 🇵🇹 Portuguese' : '🇵🇹 Português & 🇬🇧 Inglês'}
          </div>
        </div>

        {/* Main CTA button */}
        <button
          type="button"
          onClick={() => setSelectedPlan(plan)}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black transition-all shadow-lg shadow-red-600/30 active:scale-98 cursor-pointer"
        >
          <Eye className="h-4 w-4" />
          <span>{isEn ? 'Open Interactive Mobility Plan (PT / EN)' : 'Ver Plano & Desenhos Dinâmicos (PT / EN)'}</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </button>
      </div>

      {/* Modal viewer */}
      {selectedPlan && (
        <MobilityPlanModal
          plan={selectedPlan}
          athlete={athlete}
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
};
