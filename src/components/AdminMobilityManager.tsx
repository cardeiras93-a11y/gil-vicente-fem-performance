'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MobilityPlan, Athlete, AthletePlanAssignment } from '@/lib/types';
import {
  getStoredMobilityPlans,
  getStoredAthletePlanAssignments,
  toggleAthletePlanAssignment,
  togglePositionPlanAssignment,
  toggleAllSquadPlanAssignment,
  assignPlanToTarget,
  unassignPlan,
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
  Filter,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const AdminMobilityManager: React.FC = () => {
  const [plans, setPlans] = useState<MobilityPlan[]>([]);
  const [assignments, setAssignments] = useState<Record<string, AthletePlanAssignment>>({});
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'superiores' | 'inferiores'>('all');
  const [selectedPlanForPreview, setSelectedPlanForPreview] = useState<MobilityPlan | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = () => {
    const loadedPlans = getStoredMobilityPlans();
    setPlans(loadedPlans);
    setAssignments(getStoredAthletePlanAssignments());
    setAthletes(getDynamicAthletes());
    if (loadedPlans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(loadedPlans[0].id);
    }
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

  const filteredPlans = useMemo(() => {
    if (groupFilter === 'all') return plans;
    return plans.filter((p) => p.group === groupFilter);
  }, [plans, groupFilter]);

  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || filteredPlans[0] || plans[0] || null;
  }, [plans, selectedPlanId, filteredPlans]);

  // Ensure selectedPlanId matches filter
  useEffect(() => {
    if (filteredPlans.length > 0 && !filteredPlans.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(filteredPlans[0].id);
    }
  }, [groupFilter, filteredPlans, selectedPlanId]);

  if (!activePlan) {
    return <div className="p-4 text-center text-slate-400">Nenhum plano disponível na biblioteca.</div>;
  }

  // Counts for filter pills
  const allCount = plans.length;
  const supCount = plans.filter((p) => p.group === 'superiores').length;
  const infCount = plans.filter((p) => p.group === 'inferiores').length;

  // Position & Squad assignments status for active plan
  const isAllSquadAssigned = Boolean(assignments[`all_all_${activePlan.id}`]?.active);
  const isGkPositionAssigned = Boolean(assignments[`pos_GR_${activePlan.id}`]?.active);
  const isFieldPositionAssigned = Boolean(assignments[`pos_Campo_${activePlan.id}`]?.active);

  const isAthleteAssigned = (ath: Athlete): boolean => {
    // 1. Direct athlete override takes absolute precedence!
    const directAsgn = assignments[`athlete_${ath.id}_${activePlan.id}`];
    if (directAsgn !== undefined) {
      return Boolean(directAsgn.active);
    }
    // 2. Position assignment
    const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);
    if (isGk && isGkPositionAssigned) return true;
    if (!isGk && isFieldPositionAssigned) return true;
    // 3. All squad assignment
    if (isAllSquadAssigned) return true;
    return false;
  };

  const handleToggleAllSquad = () => {
    const nextActive = !isAllSquadAssigned;
    toggleAllSquadPlanAssignment(activePlan.id, athletes, nextActive);
    setAssignments(getStoredAthletePlanAssignments());
    setFeedback(
      nextActive
        ? '✓ Plano associado a TODO o plantel!'
        : 'Plano removido de todo o plantel.'
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTogglePosition = (pos: 'GR' | 'Campo') => {
    const isCurrentlyActive = pos === 'GR' ? isGkPositionAssigned : isFieldPositionAssigned;
    const nextActive = !isCurrentlyActive;
    togglePositionPlanAssignment(pos, activePlan.id, athletes, nextActive);
    setAssignments(getStoredAthletePlanAssignments());
    setFeedback(
      nextActive
        ? `✓ Plano associado a todas as ${pos === 'GR' ? 'Guarda-Redes (GR)' : 'Jogadoras de Campo'}!`
        : `Plano desassociado de todas as ${pos === 'GR' ? 'Guarda-Redes' : 'Jogadoras de Campo'}.`
    );
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleToggleAthlete = (ath: Athlete) => {
    const currentlyAssigned = isAthleteAssigned(ath);
    const nextState = !currentlyAssigned;
    toggleAthletePlanAssignment(ath.id, ath.name, activePlan.id, nextState);
    setAssignments(getStoredAthletePlanAssignments());
    setFeedback(
      nextState
        ? `✓ Plano associado à jogadora ${ath.name}!`
        : `Plano removido da jogadora ${ath.name}.`
    );
    setTimeout(() => setFeedback(null), 3500);
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
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-dark-card to-dark-surface p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-100 uppercase tracking-tight">
                  Biblioteca de Planos de Ginásio & Mobilidade ({plans.length} Planos)
                </h2>
                <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wide">
                  Gil Vicente FC • Versão Bilingue (PT / ENG) com Desenhos Vetoriais
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Gere os planos de força, potência e mobilidade. Associa qualquer plano ao perfil das atletas, posições ou a todo o plantel. As atualizações sincronizam instantaneamente na aplicação de cada jogadora.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPlanForPreview(activePlan)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-all shadow-lg shadow-blue-600/30 active:scale-95"
            >
              <Eye className="h-4 w-4" />
              <span>Ver Plano Completo (Como a Jogadora Vê)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan Filter & Selector Controls */}
      <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Group Filter */}
          <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-bold shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setGroupFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer ${
                groupFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todos ({allCount})
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter('superiores')}
              className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer flex items-center space-x-1 ${
                groupFilter === 'superiores'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🏋️ Superiores</span>
              <span>({supCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setGroupFilter('inferiores')}
              className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer flex items-center space-x-1 ${
                groupFilter === 'inferiores'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🦵 Inferiores</span>
              <span>({infCount})</span>
            </button>
          </div>

          {/* Plan Selector Dropdown */}
          <div className="flex items-center space-x-2 flex-1 max-w-lg">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 shrink-0">
              Plano Ativo:
            </span>
            <div className="relative flex-1">
              <select
                value={activePlan.id}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3.5 py-2 text-xs font-black text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer pr-8 truncate shadow-sm"
              >
                {filteredPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titlePt} ({p.durationTextPt || `${p.durationMinutes} Min`})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Horizontal Quick Switcher Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {filteredPlans.map((p) => {
            const isSelected = p.id === activePlan.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlanId(p.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all border shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {p.titlePt.replace('Plano de ', '').replace('Rotina de ', '')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Plan Details & Assignment Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Active Plan Card Details */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {activePlan.categoryPt}
              </span>
              <span className="text-xs font-black text-brand-lime flex items-center space-x-1">
                <Clock className="h-3.5 w-3.5" />
                <span>{activePlan.durationTextPt || `${activePlan.durationMinutes} Min`}</span>
              </span>
            </div>

            <h3 className="text-sm font-black text-slate-100 uppercase leading-snug">
              {activePlan.titlePt}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed italic">
              "{activePlan.titleEn}"
            </p>

            {activePlan.groupBadgePt && (
              <div className="inline-block px-2 py-0.5 rounded-md bg-blue-900/40 text-blue-300 text-[10px] font-black border border-blue-700/50">
                {activePlan.groupBadgePt}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-start space-x-2 text-[11px]">
                <Zap className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  <strong className="text-white">Aquecimento:</strong> {activePlan.warmupPt}
                </span>
              </div>
              <div className="flex items-start space-x-2 text-[11px]">
                <Flame className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">
                  <strong className="text-white">Finisher:</strong> {activePlan.finisherPt}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Blocos do Plano ({activePlan.blocks.length}):</span>
                <span className="text-cyan-400 font-black text-[10px]">
                  {activePlan.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} Exercícios
                </span>
              </div>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                {activePlan.blocks.map((b) => (
                  <div
                    key={b.id}
                    className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-200 truncate pr-2">
                        {b.number}. {b.titlePt}
                      </span>
                      <span className="text-cyan-400 font-extrabold text-[10px] shrink-0">
                        {b.durationTextPt || `${b.durationMinutes} Min`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {b.exercises.map((e) => e.namePt).join(' • ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedPlanForPreview(activePlan)}
              className="w-full py-2.5 rounded-xl border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600 text-blue-200 hover:text-white text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
            >
              <Eye className="h-4 w-4" />
              <span>Abrir Modo Interativo & Desenhos</span>
            </button>
          </div>
        </div>

        {/* Right: Assignment Controls */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span>Atribuição às Jogadoras da Equipa</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                <strong className="text-white">{totalAssignedCount}</strong> de {athletes.length} jogadoras com este plano ativo na sua aplicação.
              </p>
            </div>

            {/* Quick Bulk Toggles */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleAllSquad}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
                  isAllSquadAssigned
                    ? 'bg-blue-600 text-white border border-blue-500 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-white'
                }`}
                title="Atribuir ou desassociar este plano para todo o plantel"
              >
                <span>Todo o Plantel</span>
                {isAllSquadAssigned && <Check className="h-3 w-3 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleTogglePosition('GR')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
                  isGkPositionAssigned
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
                title="Atribuir ou desassociar para todas as Guarda-Redes"
              >
                <ShieldCheck className="h-3 w-3" />
                <span>Guarda-Redes (GR)</span>
                {isGkPositionAssigned && <Check className="h-3 w-3 ml-0.5 text-teal-400" />}
              </button>

              <button
                type="button"
                onClick={() => handleTogglePosition('Campo')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all flex items-center space-x-1 cursor-pointer ${
                  isFieldPositionAssigned
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                }`}
                title="Atribuir ou desassociar para todas as Jogadoras de Campo"
              >
                <span>Campo</span>
                {isFieldPositionAssigned && <Check className="h-3 w-3 ml-0.5 text-purple-400" />}
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
              className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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
                      ? 'border-blue-500/50 bg-blue-950/20 hover:bg-blue-950/30 shadow-sm'
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
                        ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
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
