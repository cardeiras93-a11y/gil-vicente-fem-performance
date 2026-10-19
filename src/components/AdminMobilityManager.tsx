'use client';

import React, { useState, useEffect } from 'react';
import { MobilityPlan, Athlete, AthletePlanAssignment } from '@/lib/types';
import {
  getStoredMobilityPlans,
  saveMobilityPlan,
  getStoredAthletePlanAssignments,
  toggleAthletePlanAssignment,
  togglePositionPlanAssignment,
} from '@/lib/mobilityPlans';
import { getDynamicAthletes } from '@/lib/storage';
import { MobilityPlanModal } from './MobilityPlanModal';
import { isGoalkeeper } from '@/lib/data';
import {
  Dumbbell,
  CheckCircle2,
  Users,
  Eye,
  ShieldCheck,
  Clock,
  Sparkles,
  Zap,
  Flame,
  Search,
  Check,
  RefreshCw,
} from 'lucide-react';

export const AdminMobilityManager: React.FC = () => {
  const [plans, setPlans] = useState<MobilityPlan[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AthletePlanAssignment>>({});
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedPlanForPreview, setSelectedPlanForPreview] = useState<MobilityPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = () => {
    setPlans(getStoredMobilityPlans());
    setAssignments(getStoredAthletePlanAssignments());
    setAthletes(getDynamicAthletes());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('femperf_mobility_plans_updated', loadData);
    window.addEventListener('femperf_credentials_updated', loadData);
    return () => {
      window.removeEventListener('femperf_mobility_plans_updated', loadData);
      window.removeEventListener('femperf_credentials_updated', loadData);
    };
  }, []);

  const activePlan = plans[0] || null;

  if (!activePlan) {
    return <div className="p-4 text-center text-slate-400">Nenhum plano disponível.</div>;
  }

  // Position assignments status
  const isGkPositionAssigned = Boolean(assignments[`pos_GR_${activePlan.id}`]?.active);
  const isFieldPositionAssigned = Boolean(assignments[`pos_Campo_${activePlan.id}`]?.active);

  const handleTogglePosition = (pos: 'GR' | 'Campo') => {
    const newState = togglePositionPlanAssignment(pos, activePlan.id);
    setAssignments(getStoredAthletePlanAssignments());
    setFeedback(
      newState
        ? `✓ Plano associado a todas as ${pos === 'GR' ? 'Guarda-Redes (GR)' : 'Jogadoras de Campo'}!`
        : `Plano desassociado de ${pos === 'GR' ? 'Guarda-Redes' : 'Jogadoras de Campo'}.`
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleAthlete = (ath: Athlete) => {
    const newState = toggleAthletePlanAssignment(ath.id, ath.name, activePlan.id);
    setAssignments(getStoredAthletePlanAssignments());
    setFeedback(
      newState
        ? `✓ Plano associado especificamente à jogadora ${ath.name}!`
        : `Plano desassociado da jogadora ${ath.name}.`
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const isAthleteAssigned = (ath: Athlete): boolean => {
    const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);
    if (isGk && (isGkPositionAssigned || activePlan.id === 'mobility-gk-pre-training')) return true;
    if (!isGk && isFieldPositionAssigned) return true;
    return Boolean(assignments[`athlete_${ath.id}_${activePlan.id}`]?.active);
  };

  const filteredAthletes = athletes.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalAssignedCount = athletes.filter((a) => isAthleteAssigned(a)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold animate-fade-in flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-red-950/40 via-dark-card to-dark-surface p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                Biblioteca de Planos de Mobilidade & Atribuição
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Associa planos visuais interativos com desenhos dinâmicos ao perfil das jogadoras. As alterações atualizam automaticamente na app de cada jogadora em tempo real (PT e EN).
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPlanForPreview(activePlan)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black transition-all shadow-lg shadow-red-600/30 active:scale-95"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Plano Como a Jogadora Vê</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Card Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Active Plan Card Details */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {activePlan.categoryPt}
              </span>
              <span className="text-xs font-black text-brand-lime flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activePlan.durationMinutes} Min</span>
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-100 uppercase leading-snug">
              {activePlan.titlePt}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed italic">
              "{activePlan.titleEn}"
            </p>

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center space-x-2 text-[11px]">
                <Zap className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <span className="line-clamp-2">
                  <strong className="text-white">Aquecimento:</strong> {activePlan.warmupPt}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <Flame className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                <span className="line-clamp-2">
                  <strong className="text-white">Finisher:</strong> {activePlan.finisherPt}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 mb-1.5">Blocos do Plano ({activePlan.blocks.length}):</div>
              <div className="space-y-1.5">
                {activePlan.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px]"
                  >
                    <span className="font-bold text-slate-200 truncate pr-2">
                      {b.number}. {b.titlePt}
                    </span>
                    <span className="text-cyan-400 font-extrabold text-[10px] shrink-0">
                      {b.exercises.length} ex.
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedPlanForPreview(activePlan)}
              className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black transition-all flex items-center justify-center space-x-2"
            >
              <Eye className="h-4 w-4 text-cyan-400" />
              <span>Abrir Modo Interativo Completo</span>
            </button>
          </div>
        </div>

        {/* Right: Assignment Controls */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
                <Users className="h-4 w-4 text-red-400" />
                <span>Atribuição às Jogadoras da Equipa</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {totalAssignedCount} de {athletes.length} jogadoras com este plano ativo na sua app.
              </p>
            </div>

            {/* Quick Bulk Toggle for Goalkeepers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleTogglePosition('GR')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                  isGkPositionAssigned
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Todas as Guarda-Redes (GR)</span>
                {isGkPositionAssigned && <Check className="h-3.5 w-3.5 ml-1 text-teal-400" />}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar jogadora por nome..."
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
            />
          </div>

          {/* Athletes Assignment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
            {filteredAthletes.map((ath) => {
              const assigned = isAthleteAssigned(ath);
              const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);

              return (
                <div
                  key={ath.id}
                  onClick={() => handleToggleAthlete(ath)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                    assigned
                      ? 'border-red-500/50 bg-red-950/20 hover:bg-red-950/30 shadow-sm'
                      : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {ath.avatarUrl ? (
                      <img
                        src={ath.avatarUrl}
                        alt={ath.name}
                        className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                        {ath.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-200 truncate leading-tight">
                        {ath.name}
                      </div>
                      <span className={`text-[10px] font-bold uppercase ${isGk ? 'text-amber-400' : 'text-slate-400'}`}>
                        {isGk ? 'Guarda-Redes (GR)' : ath.position || 'Campo'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-5 w-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                      assigned
                        ? 'bg-red-600 border-red-500 text-white shadow-sm'
                        : 'border-slate-700 bg-slate-800 text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Modal Preview */}
      {selectedPlanForPreview && (
        <MobilityPlanModal
          plan={selectedPlanForPreview}
          athlete={null}
          isOpen={Boolean(selectedPlanForPreview)}
          onClose={() => setSelectedPlanForPreview(null)}
        />
      )}
    </div>
  );
};
