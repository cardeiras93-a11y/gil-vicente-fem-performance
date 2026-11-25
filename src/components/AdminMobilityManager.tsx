'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MobilityPlan, Athlete, AthletePlanAssignment } from '@/lib/types';
import {
  getStoredMobilityPlans,
  getStoredAthletePlanAssignments,
  toggleAthletePlanAssignment,
  togglePositionPlanAssignment,
  toggleAllSquadPlanAssignment,
  getPlansForAthlete,
  syncMobilityLibraryWithCloud,
} from '@/lib/mobilityPlans';
import { getDynamicAthletes } from '@/lib/storage';
import { MobilityPlanModal } from './MobilityPlanModal';
import { isGoalkeeper } from '@/lib/data';
import {
  Dumbbell,
  CheckCircle2,
  Users,
  User,
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
  ExternalLink,
  Plus,
  Trash2,
  Tag,
  AlertCircle,
  FolderPlus,
  BookmarkCheck,
  Cloud,
  RefreshCw,
  BookOpen,
} from 'lucide-react';

export const AdminMobilityManager: React.FC = () => {
  const [plans, setPlans] = useState<MobilityPlan[]>(() => getStoredMobilityPlans());
  const [assignments, setAssignments] = useState<Record<string, AthletePlanAssignment>>(() => getStoredAthletePlanAssignments());
  const [athletes, setAthletes] = useState<Athlete[]>(() => getDynamicAthletes());

  // Navigation mode: 'byAthlete' (Athlete-centric) or 'byPlan' (Plan-centric)
  const [managementMode, setManagementMode] = useState<'byAthlete' | 'byPlan'>('byAthlete');

  // --- Athlete Mode State ---
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(() => {
    const list = getDynamicAthletes();
    return list[0]?.id || '';
  });
  const [athleteSearchQuery, setAthleteSearchQuery] = useState<string>('');
  const [athletePosFilter, setAthletePosFilter] = useState<string>('ALL');
  const [assignSearchQuery, setAssignSearchQuery] = useState<string>('');
  const [assignGroupFilter, setAssignGroupFilter] = useState<'all' | 'anamnese' | 'ginasio' | 'rolo'>('all');

  // --- Plan Mode State ---
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    const loaded = getStoredMobilityPlans();
    return loaded[0]?.id || '';
  });
  const [groupFilter, setGroupFilter] = useState<'all' | 'anamnese' | 'ginasio' | 'rolo' | 'superiores' | 'inferiores'>('anamnese');
  const [planSearchQuery, setPlanSearchQuery] = useState<string>('');

  // Shared preview & feedback
  const [selectedPlanForPreview, setSelectedPlanForPreview] = useState<MobilityPlan | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  // Auto-sync library with cloud on mount
  useEffect(() => {
    syncMobilityLibraryWithCloud(false).catch(() => {});
  }, []);

  const handleManualSyncCloud = async () => {
    setIsSyncingCloud(true);
    try {
      const res = await syncMobilityLibraryWithCloud(true);
      setPlans(getStoredMobilityPlans());
      setAssignments(getStoredAthletePlanAssignments());
      setAthletes(getDynamicAthletes());
      setFeedback(
        res.success
          ? `✓ Biblioteca sincronizada com sucesso! (${res.plansCount} planos e ${res.assignmentsCount} atribuições ativas)`
          : 'Aviso: Nuvem temporariamente inacessível, dados locais preservados.'
      );
    } catch {
      setFeedback('Erro ao sincronizar com a nuvem.');
    } finally {
      setIsSyncingCloud(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  useEffect(() => {
    const refreshData = () => {
      setPlans(getStoredMobilityPlans());
      setAssignments(getStoredAthletePlanAssignments());
      setAthletes(getDynamicAthletes());
    };

    window.addEventListener('femperf_mobility_plans_updated', refreshData);
    window.addEventListener('femperf_credentials_updated', refreshData);
    return () => {
      window.removeEventListener('femperf_mobility_plans_updated', refreshData);
      window.removeEventListener('femperf_credentials_updated', refreshData);
    };
  }, []);

  // Ensure selectedPlanId is valid if plans list updates
  useEffect(() => {
    if (plans.length > 0 && (!selectedPlanId || !plans.some((p) => p.id === selectedPlanId))) {
      const initialSubset = plans.filter((p) => p.id.startsWith('prev_'));
      setSelectedPlanId(initialSubset.length > 0 ? initialSubset[0].id : plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Ensure selectedAthleteId is valid
  useEffect(() => {
    if (athletes.length > 0 && (!selectedAthleteId || !athletes.some((a) => a.id === selectedAthleteId))) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  // Selected athlete object
  const selectedAthlete = useMemo(() => {
    return athletes.find((a) => a.id === selectedAthleteId) || athletes[0] || null;
  }, [athletes, selectedAthleteId]);

  // Plans assigned to the selected athlete
  const assignedPlansForSelectedAthlete = useMemo(() => {
    if (!selectedAthlete) return [];
    return getPlansForAthlete(selectedAthlete);
  }, [selectedAthlete, plans, assignments]);

  // Helper to determine the origin of a plan assignment for an athlete
  const getAssignmentOrigin = (plan: MobilityPlan, ath: Athlete) => {
    const direct = assignments[`athlete_${ath.id}_${plan.id}`];
    if (direct !== undefined && direct.active) {
      return {
        type: 'individual',
        label: 'Individual (Atribuição Direta)',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    }

    const cleanName = (ath.name || '').trim().toUpperCase();
    if (cleanName.includes('IZZY') || ath.id === 'ath-28' || ath.id === 'ath-custom-1790842877064') {
      const alt1 = assignments[`athlete_ath-28_${plan.id}`];
      if (alt1?.active) return { type: 'individual', label: 'Individual (Específico da Jogadora)', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      const alt2 = assignments[`athlete_ath-custom-1790842877064_${plan.id}`];
      if (alt2?.active) return { type: 'individual', label: 'Individual (Específico da Jogadora)', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }

    const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);
    const pos = isGk ? 'GR' : 'Campo';
    const posAsgn = assignments[`pos_${pos}_${plan.id}`];
    if (posAsgn?.active) {
      return {
        type: 'position',
        label: `Por Posição (${pos})`,
        badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      };
    }

    const allAsgn = assignments[`all_all_${plan.id}`];
    if (allAsgn?.active) {
      return {
        type: 'squad',
        label: 'Todo o Plantel',
        badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      };
    }

    return {
      type: 'individual',
      label: 'Atribuído',
      badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  };

  // Assign plan directly to selected athlete
  const handleAssignPlanToSelectedAthlete = (plan: MobilityPlan) => {
    if (!selectedAthlete) return;
    const updated = toggleAthletePlanAssignment(selectedAthlete.id, selectedAthlete.name, plan.id, true);

    const cleanName = (selectedAthlete.name || '').trim().toUpperCase();
    if (cleanName.includes('IZZY') || selectedAthlete.id === 'ath-28' || selectedAthlete.id === 'ath-custom-1790842877064') {
      const altId = selectedAthlete.id === 'ath-28' ? 'ath-custom-1790842877064' : 'ath-28';
      toggleAthletePlanAssignment(altId, selectedAthlete.name, plan.id, true);
    }

    setAssignments({ ...updated });
    setFeedback(`✓ Plano "${plan.titlePt}" atribuído com sucesso a ${selectedAthlete.name}!`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Remove plan specifically from selected athlete
  const handleRemovePlanFromSelectedAthlete = (plan: MobilityPlan) => {
    if (!selectedAthlete) return;
    const updated = toggleAthletePlanAssignment(selectedAthlete.id, selectedAthlete.name, plan.id, false);

    const cleanName = (selectedAthlete.name || '').trim().toUpperCase();
    if (cleanName.includes('IZZY') || selectedAthlete.id === 'ath-28' || selectedAthlete.id === 'ath-custom-1790842877064') {
      const altId = selectedAthlete.id === 'ath-28' ? 'ath-custom-1790842877064' : 'ath-28';
      toggleAthletePlanAssignment(altId, selectedAthlete.name, plan.id, false);
    }

    setAssignments({ ...updated });
    setFeedback(`Plano "${plan.titlePt}" removido de ${selectedAthlete.name}.`);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter athletes for the selector bar
  const filteredAthletesList = useMemo(() => {
    return athletes.filter((a) => {
      const matchesSearch = !athleteSearchQuery.trim() || a.name.toLowerCase().includes(athleteSearchQuery.toLowerCase());
      const isGk = a.position === 'GR' || isGoalkeeper(a.name);
      let matchesPos = true;
      if (athletePosFilter === 'GR') matchesPos = isGk;
      else if (athletePosFilter === 'Campo') matchesPos = !isGk;
      else if (athletePosFilter !== 'ALL') matchesPos = a.position === athletePosFilter;
      return matchesSearch && matchesPos;
    });
  }, [athletes, athleteSearchQuery, athletePosFilter]);

  // Available plans to assign in Athlete mode
  const availableLibraryPlans = useMemo(() => {
    const assignedIds = new Set(assignedPlansForSelectedAthlete.map((p) => p.id));

    return plans.filter((p) => {
      let matchesCat = true;
      if (assignGroupFilter === 'anamnese') matchesCat = p.id.startsWith('prev_') || p.id.startsWith('plan_indiv_');
      else if (assignGroupFilter === 'ginasio') matchesCat = !p.id.startsWith('prev_') && !p.id.startsWith('plan_indiv_');
      else if (assignGroupFilter === 'rolo') matchesCat = p.id === 'libertacao_miofascial_rolo' || p.titlePt.toLowerCase().includes('rolo');

      const matchesSearch = !assignSearchQuery.trim() ||
        p.titlePt.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
        p.titleEn.toLowerCase().includes(assignSearchQuery.toLowerCase()) ||
        p.categoryPt.toLowerCase().includes(assignSearchQuery.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [plans, assignedPlansForSelectedAthlete, assignGroupFilter, assignSearchQuery]);

  // --- Plan-centric helpers ---
  const handleGroupFilterChange = (newGroup: 'all' | 'anamnese' | 'ginasio' | 'rolo' | 'superiores' | 'inferiores') => {
    setGroupFilter(newGroup);
    let subset: MobilityPlan[] = plans;
    if (newGroup === 'anamnese') subset = plans.filter((p) => p.id.startsWith('prev_'));
    else if (newGroup === 'ginasio') subset = plans.filter((p) => !p.id.startsWith('prev_'));
    else if (newGroup === 'rolo') subset = plans.filter((p) => p.id === 'libertacao_miofascial_rolo' || p.titlePt.toLowerCase().includes('rolo'));
    else if (newGroup !== 'all') subset = plans.filter((p) => p.group === newGroup);

    if (subset.length > 0 && !subset.some((p) => p.id === selectedPlanId)) {
      setSelectedPlanId(subset[0].id);
    }
  };

  const filteredPlans = useMemo(() => {
    if (groupFilter === 'all') return plans;
    if (groupFilter === 'anamnese') return plans.filter((p) => p.id.startsWith('prev_') || p.id.startsWith('plan_indiv_'));
    if (groupFilter === 'ginasio') return plans.filter((p) => !p.id.startsWith('prev_') && !p.id.startsWith('plan_indiv_'));
    if (groupFilter === 'rolo') return plans.filter((p) => p.id === 'libertacao_miofascial_rolo' || p.titlePt.toLowerCase().includes('rolo'));
    return plans.filter((p) => p.group === groupFilter);
  }, [plans, groupFilter]);

  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || filteredPlans[0] || plans[0] || null;
  }, [plans, selectedPlanId, filteredPlans]);

  // Check if athlete is assigned in Plan-centric mode
  const isAthleteAssignedToActivePlan = (ath: Athlete): boolean => {
    if (!activePlan) return false;
    const directAsgn = assignments[`athlete_${ath.id}_${activePlan.id}`];
    if (directAsgn !== undefined) {
      return Boolean(directAsgn.active);
    }

    const cleanName = (ath.name || '').trim().toUpperCase();
    const isIzzy = cleanName.includes('IZZY') || ath.id === 'ath-28' || ath.id === 'ath-custom-1790842877064';

    if (isIzzy) {
      const alt1 = assignments[`athlete_ath-28_${activePlan.id}`];
      if (alt1 !== undefined) return Boolean(alt1.active);
      const alt2 = assignments[`athlete_ath-custom-1790842877064_${activePlan.id}`];
      if (alt2 !== undefined) return Boolean(alt2.active);
    }

    if (isIzzy && (activePlan.id === 'plan_indiv_ath-28_izzy' || activePlan.id === 'ativacao_izzy_tendao_aquiles')) {
      return true;
    }
    if (activePlan.id.startsWith('plan_indiv_') && activePlan.id.includes(ath.id)) {
      return true;
    }

    const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);
    const isGkPositionAssigned = Boolean(assignments[`pos_GR_${activePlan.id}`]?.active);
    const isFieldPositionAssigned = Boolean(assignments[`pos_Campo_${activePlan.id}`]?.active);
    const isAllSquadAssigned = Boolean(assignments[`all_all_${activePlan.id}`]?.active);

    if (isGk && isGkPositionAssigned) return true;
    if (!isGk && isFieldPositionAssigned) return true;
    if (isAllSquadAssigned) return true;
    return false;
  };

  const handleToggleAthleteForPlan = (ath: Athlete) => {
    if (!activePlan) return;
    const currentlyAssigned = isAthleteAssignedToActivePlan(ath);
    const nextState = !currentlyAssigned;
    let updated = toggleAthletePlanAssignment(ath.id, ath.name, activePlan.id, nextState);

    const cleanName = (ath.name || '').trim().toUpperCase();
    if (cleanName.includes('IZZY') || ath.id === 'ath-28' || ath.id === 'ath-custom-1790842877064') {
      const altId = ath.id === 'ath-28' ? 'ath-custom-1790842877064' : 'ath-28';
      updated = toggleAthletePlanAssignment(altId, ath.name, activePlan.id, nextState);
    }

    setAssignments({ ...updated });
    setFeedback(
      nextState
        ? `✓ Plano associado à jogadora ${ath.name}!`
        : `Plano removido da jogadora ${ath.name}.`
    );
    setTimeout(() => setFeedback(null), 3000);
  };

  const isAllSquadAssigned = activePlan ? Boolean(assignments[`all_all_${activePlan.id}`]?.active) : false;
  const isGkPositionAssigned = activePlan ? Boolean(assignments[`pos_GR_${activePlan.id}`]?.active) : false;
  const isFieldPositionAssigned = activePlan ? Boolean(assignments[`pos_Campo_${activePlan.id}`]?.active) : false;

  const handleToggleAllSquad = () => {
    if (!activePlan) return;
    const nextActive = !isAllSquadAssigned;
    const updated = toggleAllSquadPlanAssignment(activePlan.id, athletes, nextActive);
    setAssignments({ ...updated });
    setFeedback(nextActive ? '✓ Plano associado a TODO o plantel!' : 'Plano removido de todo o plantel.');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleTogglePosition = (pos: 'GR' | 'Campo') => {
    if (!activePlan) return;
    const isCurrentlyActive = pos === 'GR' ? isGkPositionAssigned : isFieldPositionAssigned;
    const nextActive = !isCurrentlyActive;
    const updated = togglePositionPlanAssignment(pos, activePlan.id, athletes, nextActive);
    setAssignments({ ...updated });
    setFeedback(
      nextActive
        ? `✓ Plano associado a todas as ${pos === 'GR' ? 'Guarda-Redes (GR)' : 'Jogadoras de Campo'}!`
        : `Plano desassociado de todas as ${pos === 'GR' ? 'Guarda-Redes' : 'Jogadoras de Campo'}.`
    );
    setTimeout(() => setFeedback(null), 3000);
  };

  const totalAssignedForActivePlan = activePlan
    ? athletes.filter((a) => isAthleteAssignedToActivePlan(a)).length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs font-bold animate-fade-in flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        </div>
      )}

      {/* Main Header Card with View Mode Switcher */}
      <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-blue-950/40 via-dark-card to-dark-surface p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0">
                <Dumbbell className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-slate-100 uppercase tracking-tight">
                    Prescrição de Planos & Biblioteca de Ginásio
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-black">
                    {plans.length} Planos na Biblioteca
                  </span>
                </div>
                <p className="text-[11px] text-blue-400 font-extrabold uppercase tracking-wide">
                  Gil Vicente FC • Prescrição Individual e Acompanhamento
                </p>
              </div>
            </div>
          </div>

          {/* Mode Switcher: By Athlete vs By Plan */}
          <div className="inline-flex rounded-2xl bg-slate-900/90 p-1.5 border border-slate-700/80 shadow-lg shrink-0">
            <button
              type="button"
              onClick={() => setManagementMode('byAthlete')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                managementMode === 'byAthlete'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Por Jogadora (Atribuir & Ver)</span>
            </button>

            <button
              type="button"
              onClick={() => setManagementMode('byPlan')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                managementMode === 'byPlan'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Por Plano (Biblioteca)</span>
            </button>
          </div>
        </div>

        {/* Quick Links & Cloud Sync Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-800/80 relative z-10 text-xs">
          <button
            type="button"
            onClick={handleManualSyncCloud}
            disabled={isSyncingCloud}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border cursor-pointer ${
              isSyncingCloud
                ? 'bg-blue-900/60 text-blue-200 border-blue-500/50 cursor-wait'
                : 'bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border-blue-500/40 shadow-sm'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
            <span>{isSyncingCloud ? 'A Sincronizar Nuvem...' : 'Sincronizar Nuvem Agora'}</span>
          </button>

          <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 font-semibold text-[11px]">
            <Cloud className="h-3.5 w-3.5 text-emerald-400" />
            <span>Auto-Sync Ativo • {plans.length} Planos</span>
          </div>

          <a
            href="/planos/biblioteca_planos_gil_vicente_fc.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 border border-purple-500/40 font-bold transition-all"
          >
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            <span>Biblioteca Completa HTML</span>
          </a>

          <a
            href="/planos/plano_anamnese_preventivo_plantel.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 font-bold transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Dossiê Clínico Anamnese</span>
          </a>

          <a
            href="/planos/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>Máquinas Ginásio A4</span>
          </a>

          <a
            href="/planos/video_reels_biblioteca.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-500/40 font-bold transition-all"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>Vídeos & Reels</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: BY ATHLETE (User's primary request) */}
      {/* ========================================================================= */}
      {managementMode === 'byAthlete' ? (
        <div className="space-y-6">
          {/* Athlete Selector Bar */}
          <div className="rounded-3xl border border-slate-800 bg-dark-card p-4 sm:p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-red-500" />
                <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                  Seleciona a Jogadora ({athletes.length} no Plantel)
                </h3>
              </div>

              {/* Position filter & search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={athleteSearchQuery}
                    onChange={(e) => setAthleteSearchQuery(e.target.value)}
                    placeholder="Filtrar por nome..."
                    className="w-40 sm:w-48 rounded-xl bg-slate-900 border border-slate-700 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-700 text-[10px] font-black">
                  {['ALL', 'DC', 'LAT', 'MC', 'EX', 'PL', 'GR'].map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setAthletePosFilter(pos)}
                      className={`px-2 py-1 rounded-lg transition-all ${
                        athletePosFilter === pos
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {pos === 'ALL' ? 'Todas' : pos}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Horizontal Athlete Cards Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {filteredAthletesList.map((ath) => {
                const isSelected = selectedAthlete?.id === ath.id;
                const plansCount = getPlansForAthlete(ath).length;
                const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);

                return (
                  <button
                    key={ath.id}
                    type="button"
                    onClick={() => setSelectedAthleteId(ath.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 select-none active:scale-95 ${
                      isSelected
                        ? 'border-red-500 bg-gradient-to-b from-red-950/60 to-dark-card shadow-lg shadow-red-950/50 ring-2 ring-red-500/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      {ath.avatarUrl ? (
                        <img
                          src={ath.avatarUrl}
                          alt={ath.name}
                          className="h-7 w-7 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">
                          {ath.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black truncate text-slate-100">
                          {ath.name}
                        </div>
                        <div className={`text-[9px] font-extrabold uppercase ${isGk ? 'text-amber-400' : 'text-slate-400'}`}>
                          {ath.position || 'Campo'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-800/80">
                      <span className="text-slate-400">Planos:</span>
                      <span className={`px-1.5 py-0.2 rounded-md font-black ${
                        plansCount > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {plansCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Selected Athlete Dashboard */}
          {selectedAthlete && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* SECTION A: Currently Assigned Plans */}
              <div className="rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Athlete Profile Header Card */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-dark-card to-dark-card shadow-inner">
                    <div className="flex items-center space-x-3 min-w-0">
                      {selectedAthlete.avatarUrl ? (
                        <img
                          src={selectedAthlete.avatarUrl}
                          alt={selectedAthlete.name}
                          className="h-11 w-11 rounded-full object-cover border-2 border-red-500/60 shadow"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-slate-800 border-2 border-red-500/60 flex items-center justify-center text-sm font-black text-red-300 shadow">
                          {selectedAthlete.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-black text-white uppercase tracking-tight truncate">
                            {selectedAthlete.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black uppercase">
                            {selectedAthlete.position || 'Campo'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <strong className="text-emerald-400">{assignedPlansForSelectedAthlete.length} planos</strong> atualmente ativos na app da jogadora
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center space-x-2 mb-2">
                      <BookmarkCheck className="h-4 w-4 text-emerald-400" />
                      <span>Planos Atribuídos a {selectedAthlete.name}</span>
                    </h4>

                    {/* Assigned Plans List */}
                    {assignedPlansForSelectedAthlete.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center space-y-2">
                        <div className="h-10 w-10 mx-auto rounded-full bg-slate-800 text-slate-500 flex items-center justify-center">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-300">
                          Nenhum plano atribuído a {selectedAthlete.name} de momento.
                        </p>
                        <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                          Escolhe qualquer plano da biblioteca na coluna ao lado e clica em <strong>"Atribuir"</strong> para associar instantaneamente à atleta.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                        {assignedPlansForSelectedAthlete.map((plan) => {
                          const origin = getAssignmentOrigin(plan, selectedAthlete);
                          const totalEx = plan.blocks.reduce((acc, b) => acc + b.exercises.length, 0);

                          return (
                            <div
                              key={plan.id}
                              className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900/70 hover:border-slate-700 transition-all space-y-2.5 shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${origin.badgeClass}`}>
                                      {origin.label}
                                    </span>
                                    <span className="text-[10px] font-bold text-cyan-400 flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{plan.durationTextPt || `${plan.durationMinutes} Min`}</span>
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">
                                      • {totalEx} Exercícios
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-black text-slate-100 uppercase leading-snug">
                                    {plan.titlePt}
                                  </h5>
                                  <p className="text-[10px] text-slate-400 italic line-clamp-1">
                                    {plan.titleEn}
                                  </p>
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPlanForPreview(plan)}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Ver Exercícios & Desenhos</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemovePlanFromSelectedAthlete(plan)}
                                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-500/40 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
                                  title="Remover este plano desta jogadora"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-rose-400" />
                                  <span>Remover da Atleta</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION B: Assign New Plan from Library */}
              <div className="rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-2">
                      <FolderPlus className="h-4 w-4 text-brand-lime" />
                      <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                        Atribuir Novo Plano da Biblioteca a {selectedAthlete.name}
                      </h4>
                    </div>
                  </div>

                  {/* Filter & Search library plans */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1 text-[11px] font-black">
                      {[
                        { id: 'all', label: 'Todos os Planos' },
                        { id: 'anamnese', label: '🩺 Anamnese / Prevenção' },
                        { id: 'ginasio', label: '🏋️ Máquinas Ginásio' },
                        { id: 'rolo', label: '🪵 Rolo Miofascial' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setAssignGroupFilter(cat.id as any)}
                          className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                            assignGroupFilter === cat.id
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={assignSearchQuery}
                        onChange={(e) => setAssignSearchQuery(e.target.value)}
                        placeholder="Pesquisar plano na biblioteca..."
                        className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Plans available to assign */}
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {availableLibraryPlans.map((plan) => {
                      const isAlreadyAssigned = assignedPlansForSelectedAthlete.some((p) => p.id === plan.id);
                      const totalEx = plan.blocks.reduce((acc, b) => acc + b.exercises.length, 0);

                      return (
                        <div
                          key={plan.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                            isAlreadyAssigned
                              ? 'border-emerald-500/40 bg-emerald-950/20'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-black uppercase text-cyan-400">
                                {plan.categoryPt || 'PLANO'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                • {plan.durationTextPt || `${plan.durationMinutes} Min`} • {totalEx} Ex.
                              </span>
                            </div>
                            <h5 className="text-xs font-black text-slate-100 uppercase truncate">
                              {plan.titlePt}
                            </h5>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedPlanForPreview(plan)}
                              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer"
                              title="Pré-visualizar plano"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {isAlreadyAssigned ? (
                              <button
                                type="button"
                                onClick={() => handleRemovePlanFromSelectedAthlete(plan)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-rose-950 text-emerald-300 hover:text-rose-300 border border-emerald-500/50 hover:border-rose-500/50 text-xs font-black transition-all cursor-pointer group"
                                title="Já atribuído. Clica para remover."
                              >
                                <Check className="h-3.5 w-3.5 text-emerald-400 group-hover:hidden" />
                                <Trash2 className="h-3.5 w-3.5 text-rose-400 hidden group-hover:block" />
                                <span className="group-hover:hidden">Ativo</span>
                                <span className="hidden group-hover:inline">Remover</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAssignPlanToSelectedAthlete(plan)}
                                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-950/50 cursor-pointer active:scale-95"
                              >
                                <Plus className="h-3.5 w-3.5 stroke-[3]" />
                                <span>Atribuir à Atleta</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* MODE 2: BY PLAN (Original library & bulk squad/position manager) */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Plan Filter & Selector Controls */}
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Segmented Group Filter */}
              <div className="inline-flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-xs font-bold shadow-inner shrink-0 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => handleGroupFilterChange('anamnese')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer flex items-center space-x-1.5 ${
                    groupFilter === 'anamnese'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/40'
                  }`}
                >
                  <span>🩺 Anamnese</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupFilterChange('ginasio')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer flex items-center space-x-1.5 ${
                    groupFilter === 'ginasio' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🏋️ Máquinas Ginásio</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupFilterChange('rolo')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer flex items-center space-x-1.5 ${
                    groupFilter === 'rolo'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
                  }`}
                >
                  <span>🪵 Rolo Miofascial</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGroupFilterChange('all')}
                  className={`px-3 py-1.5 rounded-lg transition text-xs font-black cursor-pointer ${
                    groupFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Todos ({plans.length})
                </button>
              </div>

              {/* Plan Selector Dropdown */}
              {activePlan && (
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
              )}
            </div>

            {/* Horizontal Quick Switcher Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
              {filteredPlans.map((p) => {
                const isSelected = activePlan && p.id === activePlan.id;
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
          {activePlan && (
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

                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Secções ({activePlan.blocks.length}):</span>
                      <span className="text-cyan-400 font-black text-[10px]">
                        {activePlan.blocks.reduce((acc, b) => acc + b.exercises.length, 0)} Exercícios
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                      {activePlan.blocks.map((b) => (
                        <div key={b.id} className="p-2 rounded-xl border bg-slate-900/60 border-slate-800 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-slate-200 truncate pr-2">
                              {b.number}. {b.titlePt}
                            </span>
                            <span className="font-extrabold text-[10px] text-cyan-400 shrink-0">
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

              {/* Right: Plan-centric Bulk Assignment Controls */}
              <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-dark-card p-5 space-y-4 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight flex items-center space-x-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span>Atribuição às Jogadoras da Equipa</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <strong className="text-white">{totalAssignedForActivePlan}</strong> de {athletes.length} jogadoras com este plano ativo na sua aplicação.
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

                {/* Athletes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
                  {athletes.map((ath) => {
                    const assigned = isAthleteAssignedToActivePlan(ath);
                    const isGk = ath.position === 'GR' || isGoalkeeper(ath.name);

                    return (
                      <button
                        key={ath.id}
                        type="button"
                        onClick={() => handleToggleAthleteForPlan(ath)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none active:scale-[0.98] ${
                          assigned
                            ? 'border-blue-500/60 bg-blue-950/30 hover:bg-blue-900/40 text-white shadow-md'
                            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-400'
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
                              ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                              : 'border-slate-700 bg-slate-800 text-transparent'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
