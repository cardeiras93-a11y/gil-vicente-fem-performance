'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Athlete, WellnessEntry, RPEEntry, HydrationEntry, HydrationStatus } from '@/lib/types';
import {
  getAthleteAvatar,
  saveHydrationLocally,
  getHydrationLocally,
  getDynamicAthletes
} from '@/lib/storage';
import { calculateHydrationStatus } from '@/lib/data';
import { secureFetch } from '@/lib/authGuard';
import { WellnessForm } from '@/components/WellnessForm';
import { RPEForm } from '@/components/RPEForm';
import {
  Scale, HeartPulse, Dumbbell, ArrowLeft, Search, CheckCircle2,
  Clock, Check, ChevronRight, Sparkles, AlertCircle, RefreshCw,
  User, Users, Delete
} from 'lucide-react';

interface KioskModeViewProps {
  onClose: () => void;
  athletes?: Athlete[];
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  hydrationList: HydrationEntry[];
}

export type KioskMode = 'all' | 'quick_weight' | 'wellness' | 'rpe';

export const KioskModeView: React.FC<KioskModeViewProps> = ({
  onClose,
  athletes: initialAthletes,
  wellnessList,
  rpeList,
  hydrationList,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>(() => initialAthletes || getDynamicAthletes());
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [kioskMode, setKioskMode] = useState<KioskMode>('all');
  const [activeFormType, setActiveFormType] = useState<'weight' | 'wellness' | 'rpe' | null>(null);

  // Search & Position filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'GR' | 'DEF' | 'MED' | 'AV'>('all');

  // Quick weight keypad state
  const [weightStage, setWeightStage] = useState<'pre' | 'post'>('pre');
  const [weightInputStr, setWeightInputStr] = useState<string>('60.0');
  const [isSubmittingWeight, setIsSubmittingWeight] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Inactivity auto-reset timer (60s)
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    // Return to athlete selector after 60s of inactivity if an athlete was selected
    if (selectedAthlete) {
      inactivityTimerRef.current = setTimeout(() => {
        setSelectedAthlete(null);
        setActiveFormType(null);
      }, 60000);
    }
  };

  useEffect(() => {
    const handleUserActivity = () => resetInactivityTimer();
    window.addEventListener('touchstart', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);

    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
    };
  }, [selectedAthlete]);

  // Keep athletes list up to date
  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    window.addEventListener('femperf_data_updated', handleUpdate);
    return () => window.removeEventListener('femperf_data_updated', handleUpdate);
  }, []);

  // Filter athletes
  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (a.isActive === false) return false;
      const matchSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(a.jerseyNumber || '').includes(searchQuery);

      if (!matchSearch) return false;

      if (positionFilter === 'all') return true;
      const pos = (a.position || '').toUpperCase();
      if (positionFilter === 'GR') return pos.includes('GR') || pos.includes('GUARDA');
      if (positionFilter === 'DEF') return pos.includes('DC') || pos.includes('LAT') || pos.includes('DEF') || pos.includes('CENTRAL');
      if (positionFilter === 'MED') return pos.includes('MED') || pos.includes('VOL') || pos.includes('MEIO');
      if (positionFilter === 'AV') return pos.includes('AV') || pos.includes('EXT') || pos.includes('PL') || pos.includes('ATA');
      return true;
    });
  }, [athletes, searchQuery, positionFilter]);

  // Status mapping for today
  const athleteTodayStatus = useMemo(() => {
    const map: Record<string, {
      wellness: boolean;
      preWeight: number | null;
      postWeight: number | null;
      rpe: number | null;
    }> = {};

    athletes.forEach((ath) => {
      const wel = wellnessList.some((w) => w.athleteId === ath.id && w.date === todayStr);
      const hyd = hydrationList.find((h) => h.athleteId === ath.id && h.date === todayStr);
      const rpe = rpeList.find((r) => r.athleteId === ath.id && r.date === todayStr);

      map[ath.id] = {
        wellness: wel,
        preWeight: hyd && hyd.preWeight > 0 ? hyd.preWeight : null,
        postWeight: hyd && hyd.postWeight > 0 ? hyd.postWeight : null,
        rpe: rpe && rpe.physicalDemand > 0 ? rpe.physicalDemand : null,
      };
    });

    return map;
  }, [athletes, wellnessList, hydrationList, rpeList, todayStr]);

  // Overall today counts
  const todayCounts = useMemo(() => {
    const total = athletes.filter((a) => a.isActive !== false).length || 1;
    let welCount = 0;
    let preCount = 0;
    let postCount = 0;
    let rpeCount = 0;

    Object.values(athleteTodayStatus).forEach((st) => {
      if (st.wellness) welCount++;
      if (st.preWeight !== null) preCount++;
      if (st.postWeight !== null) postCount++;
      if (st.rpe !== null) rpeCount++;
    });

    return { total, welCount, preCount, postCount, rpeCount };
  }, [athletes, athleteTodayStatus]);

  // Handle selecting an athlete
  const handleSelectAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    resetInactivityTimer();

    const st = athleteTodayStatus[athlete.id];
    const currentHour = new Date().getHours();

    // Smart default for weight stage: if pre is already done or afternoon, default to post
    if (st?.preWeight !== null || currentHour >= 13) {
      setWeightStage('post');
      const fallbackWeight = st?.postWeight || (st?.preWeight ? Number((st.preWeight - 0.7).toFixed(1)) : 60.0);
      setWeightInputStr(fallbackWeight.toString());
    } else {
      setWeightStage('pre');
      const fallbackWeight = st?.preWeight || 61.0;
      setWeightInputStr(fallbackWeight.toString());
    }

    if (kioskMode === 'quick_weight') {
      setActiveFormType('weight');
    } else if (kioskMode === 'wellness') {
      setActiveFormType('wellness');
    } else if (kioskMode === 'rpe') {
      setActiveFormType('rpe');
    } else {
      setActiveFormType(null); // will show choices
    }
  };

  // Quick weight keypad controls
  const handleKeypadPress = (val: string) => {
    if (val === 'backspace') {
      if (weightInputStr.length <= 1) {
        setWeightInputStr('0');
      } else {
        setWeightInputStr((prev) => prev.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (!weightInputStr.includes('.')) {
        setWeightInputStr((prev) => `${prev}.`);
      }
      return;
    }

    if (weightInputStr === '0' || weightInputStr === '0.0') {
      setWeightInputStr(val);
      return;
    }

    // Maximum 5 chars (e.g. 102.5)
    if (weightInputStr.length < 5) {
      setWeightInputStr((prev) => `${prev}${val}`);
    }
  };

  const handleAdjustWeightDelta = (delta: number) => {
    const current = parseFloat(weightInputStr.replace(',', '.')) || 60.0;
    const nextVal = Math.max(30, Math.min(120, Number((current + delta).toFixed(1))));
    setWeightInputStr(nextVal.toString());
  };

  // Submit quick weight
  const handleSubmitQuickWeight = async () => {
    if (!selectedAthlete) return;
    const parsedWeight = parseFloat(weightInputStr.replace(',', '.'));
    if (isNaN(parsedWeight) || parsedWeight <= 30 || parsedWeight >= 150) {
      alert('Por favor insere um peso válido (entre 30 kg e 150 kg).');
      return;
    }

    setIsSubmittingWeight(true);
    const nowIso = new Date().toISOString();
    const hydEntries = getHydrationLocally(selectedAthlete.id);
    const existing = hydEntries.find((h) => h.date === todayStr);

    let updatedEntry: HydrationEntry;

    if (weightStage === 'pre') {
      const hasPost = existing && Number(existing.postWeight) > 0;
      const postVal = hasPost ? Number(existing.postWeight) : 0;
      const fluidsVal = hasPost ? Number(existing.fluidsIntake || 0.5) : 0;
      const calc = hasPost ? calculateHydrationStatus(parsedWeight, postVal, fluidsVal, 'pt') : null;

      updatedEntry = {
        id: existing?.id || `hyd-${todayStr}-${selectedAthlete.id}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        date: todayStr,
        durationMin: existing?.durationMin || 90,
        preWeight: parsedWeight,
        postWeight: postVal,
        fluidsIntake: fluidsVal,
        weightLoss: calc ? calc.weightLoss : 0,
        dehydrationRate: calc ? calc.dehydrationRate : 0,
        status: calc ? calc.status : 'Pendente',
        refillNeededLiters: calc ? calc.refillNeededLiters : 0,
        recommendation: calc ? calc.recommendation : 'Peso Pré-treino registado com sucesso.',
        biologicalImpact: calc ? calc.biologicalImpact : 'Aguardando pesagem pós-treino',
        preWeightTime: existing?.preWeightTime || existing?.submittedAtPre || nowIso,
        submittedAtPre: existing?.submittedAtPre || existing?.preWeightTime || nowIso,
        postWeightTime: existing?.postWeightTime,
        submittedAtPost: existing?.submittedAtPost,
        createdAt: existing?.createdAt || nowIso,
      };
    } else {
      let preVal = existing && Number(existing.preWeight) > 0 ? Number(existing.preWeight) : 0;
      if (!preVal) {
        preVal = Number((parsedWeight + 0.8).toFixed(1));
      }
      const fluidsVal = Number(existing?.fluidsIntake || 0.5);
      const calc = calculateHydrationStatus(preVal, parsedWeight, fluidsVal, 'pt');

      updatedEntry = {
        id: existing?.id || `hyd-${todayStr}-${selectedAthlete.id}`,
        athleteId: selectedAthlete.id,
        athleteName: selectedAthlete.name,
        date: todayStr,
        durationMin: existing?.durationMin || 90,
        preWeight: preVal,
        postWeight: parsedWeight,
        fluidsIntake: fluidsVal,
        weightLoss: calc.weightLoss,
        dehydrationRate: calc.dehydrationRate,
        status: calc.status,
        refillNeededLiters: calc.refillNeededLiters,
        recommendation: calc.recommendation,
        biologicalImpact: calc.biologicalImpact,
        preWeightTime: existing?.preWeightTime,
        submittedAtPre: existing?.submittedAtPre,
        postWeightTime: existing?.postWeightTime || nowIso,
        submittedAtPost: existing?.submittedAtPost || nowIso,
        createdAt: existing?.createdAt || nowIso,
      };
    }

    saveHydrationLocally(updatedEntry);

    try {
      secureFetch('/api/hydration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEntry),
      }).catch(() => {});

      secureFetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: weightStage === 'pre' ? 'hydration_pre' : 'hydration_post',
          entry: updatedEntry,
        }),
      }).catch(() => {});
    } catch {}

    setIsSubmittingWeight(false);
    triggerSuccess(`✓ Peso ${weightStage === 'pre' ? 'Pré-treino' : 'Pós-treino'} (${parsedWeight} kg) de ${selectedAthlete.name} gravado!`);
  };

  const triggerSuccess = (msg: string) => {
    setFeedbackSuccess(msg);
    setTimeout(() => {
      setFeedbackSuccess(null);
      setSelectedAthlete(null);
      setActiveFormType(null);
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-lime selection:text-slate-950 overflow-hidden font-sans">
      {/* Top Kiosk Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 shadow-lg">
        <div className="flex items-center space-x-3">
          <img
            src="/gil-vicente-crest.png"
            alt="Gil Vicente FC"
            className="h-9 w-9 sm:h-11 sm:w-11 object-contain drop-shadow"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs sm:text-sm font-black tracking-wider text-slate-100 uppercase">
                Gil Vicente FC
              </span>
              <span className="text-[10px] sm:text-xs font-black uppercase px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                Quiosque Balneário
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium hidden sm:block">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Mode Selector in Header */}
        <div className="flex items-center bg-dark-bg p-1 rounded-xl border border-slate-800 text-xs font-bold space-x-1">
          <button
            type="button"
            onClick={() => {
              setKioskMode('all');
              if (selectedAthlete) setActiveFormType(null);
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-black cursor-pointer ${
              kioskMode === 'all'
                ? 'bg-brand-lime text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Todos
          </button>
          <button
            type="button"
            onClick={() => {
              setKioskMode('quick_weight');
              if (selectedAthlete) setActiveFormType('weight');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-black cursor-pointer ${
              kioskMode === 'quick_weight'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚖️ Só Balança
          </button>
          <button
            type="button"
            onClick={() => {
              setKioskMode('wellness');
              if (selectedAthlete) setActiveFormType('wellness');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-black cursor-pointer ${
              kioskMode === 'wellness'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☀️ Só Wellness
          </button>
          <button
            type="button"
            onClick={() => {
              setKioskMode('rpe');
              if (selectedAthlete) setActiveFormType('rpe');
            }}
            className={`px-2.5 py-1.5 rounded-lg transition-all text-xs font-black cursor-pointer ${
              kioskMode === 'rpe'
                ? 'bg-brand-cyan text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Só PSE
          </button>
        </div>

        {/* Exit Kiosk Button (No PIN Required) */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 sm:px-4 py-2 text-xs font-black text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
          title="Regressar ao painel de administração"
        >
          <ArrowLeft className="h-4 w-4 text-amber-400 shrink-0" />
          <span className="hidden sm:inline">Voltar ao Admin</span>
          <span className="sm:hidden">Sair</span>
        </button>
      </header>

      {/* Success Fullscreen Overlay */}
      {feedbackSuccess && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-slate-950/90 backdrop-blur-md animate-fade-in p-6">
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md w-full bg-slate-900 border-2 border-emerald-500/60 p-8 rounded-3xl shadow-2xl text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 animate-bounce">
              <Check className="h-10 w-10 stroke-[3]" />
            </div>
            <h3 className="text-xl font-black text-slate-100 uppercase tracking-wide">
              Registo Efetuado!
            </h3>
            <p className="text-sm font-bold text-emerald-300">
              {feedbackSuccess}
            </p>
            <span className="text-xs text-slate-400 pt-2 block">
              A preparar o ecrã para a próxima atleta...
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {!selectedAthlete ? (
          /* STATE 1: ATHLETE SELECTION GRID */
          <div className="max-w-6xl mx-auto space-y-5">
            {/* Quick Overview Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-900/90 border border-amber-500/30 p-3 rounded-2xl flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">☀️ Wellness</span>
                  <span className="text-base font-black text-slate-100">
                    {todayCounts.welCount} <span className="text-xs text-slate-500">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-cyan-500/30 p-3 rounded-2xl flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">⚖️ Peso Pré</span>
                  <span className="text-base font-black text-slate-100">
                    {todayCounts.preCount} <span className="text-xs text-slate-500">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-blue-500/30 p-3 rounded-2xl flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">⚖️ Peso Pós</span>
                  <span className="text-base font-black text-slate-100">
                    {todayCounts.postCount} <span className="text-xs text-slate-500">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-purple-500/30 p-3 rounded-2xl flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">⚡ PSE (Pós)</span>
                  <span className="text-base font-black text-slate-100">
                    {todayCounts.rpeCount} <span className="text-xs text-slate-500">/ {todayCounts.total}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome ou nº..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['all', 'GR', 'DEF', 'MED', 'AV'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setPositionFilter(pos)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                      positionFilter === pos
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {pos === 'all' ? 'Todas' : pos === 'GR' ? 'Guarda-Redes' : pos === 'DEF' ? 'Defesas' : pos === 'MED' ? 'Médias' : 'Avançadas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Instruction banner */}
            <div className="text-center py-1">
              <h2 className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wide">
                👇 Toca na tua fotografia para preencher
              </h2>
              <p className="text-xs text-slate-400">
                {kioskMode === 'quick_weight' ? 'Modo Balança Rápida ativo' : kioskMode === 'wellness' ? 'Modo Só Wellness ativo' : kioskMode === 'rpe' ? 'Modo Só PSE ativo' : 'Escolhe o teu perfil e seleciona o questionário ou balança'}
              </p>
            </div>

            {/* Athletes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAthletes.map((athlete) => {
                const customAvatar = getAthleteAvatar(athlete.id) || athlete.avatarUrl;
                const status = athleteTodayStatus[athlete.id];
                const allDone = status?.wellness && status?.preWeight !== null && status?.postWeight !== null && status?.rpe !== null;

                const initials = athlete.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2);

                return (
                  <button
                    key={athlete.id}
                    type="button"
                    onClick={() => handleSelectAthlete(athlete)}
                    className={`group relative flex flex-col items-center justify-between p-3.5 rounded-2xl border transition-all text-center cursor-pointer min-h-[145px] ${
                      allDone
                        ? 'bg-slate-900/90 border-emerald-500/50 hover:border-emerald-400 hover:scale-102 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 hover:scale-102 shadow-sm'
                    }`}
                  >
                    {/* Top jersey number badge */}
                    <div className="w-full flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                        #{athlete.jerseyNumber || '—'}
                      </span>
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase">
                        {athlete.position || ''}
                      </span>
                    </div>

                    {/* Avatar */}
                    <div className="relative my-1">
                      {customAvatar ? (
                        <img
                          src={customAvatar}
                          alt={athlete.name}
                          className="h-14 w-14 sm:h-16 sm:w-16 rounded-full object-cover border-2 border-slate-700 group-hover:border-amber-400 transition-all shadow"
                        />
                      ) : (
                        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-sm font-black text-slate-200 group-hover:border-amber-400">
                          {initials}
                        </div>
                      )}
                      {allDone && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center text-slate-950 font-black shadow-md">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    {/* Athlete Name */}
                    <span className="font-extrabold text-xs text-slate-100 truncate w-full mt-1.5 group-hover:text-amber-300 transition-colors">
                      {athlete.name}
                    </span>

                    {/* Status icons row */}
                    <div className="flex items-center justify-center gap-1.5 mt-2 w-full pt-1.5 border-t border-slate-800/80 text-[10px]">
                      <span
                        title={status?.wellness ? 'Wellness: Preenchido' : 'Wellness: Em falta'}
                        className={`px-1 py-0.2 rounded font-bold ${
                          status?.wellness ? 'text-amber-400 bg-amber-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ☀️ {status?.wellness ? '✓' : '—'}
                      </span>
                      <span
                        title={status?.preWeight !== null ? `Pré: ${status.preWeight}kg` : 'Pré: Em falta'}
                        className={`px-1 py-0.2 rounded font-bold ${
                          status?.preWeight !== null ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ⚖️ {status?.preWeight !== null ? `${status.preWeight}` : '—'}
                      </span>
                      <span
                        title={status?.rpe !== null ? `PSE: ${status.rpe}/10` : 'PSE: Em falta'}
                        className={`px-1 py-0.2 rounded font-bold ${
                          status?.rpe !== null ? 'text-purple-400 bg-purple-500/10' : 'text-slate-600 bg-slate-800/60'
                        }`}
                      >
                        ⚡ {status?.rpe !== null ? `${status.rpe}` : '—'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* STATE 2: ATHLETE FILLING SCREEN */
          <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
            {/* Athlete Selected Header Banner */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center space-x-3">
                {(() => {
                  const avatar = getAthleteAvatar(selectedAthlete.id) || selectedAthlete.avatarUrl;
                  const initials = selectedAthlete.name.split(' ').map((n) => n[0]).join('').substring(0, 2);
                  return avatar ? (
                    <img
                      src={avatar}
                      alt={selectedAthlete.name}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-red-500/60"
                    />
                  ) : (
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-black text-sm text-slate-200">
                      {initials}
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base font-black text-slate-100">
                      {selectedAthlete.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-slate-800 text-slate-400">
                      #{selectedAthlete.jerseyNumber || '—'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold">
                    {selectedAthlete.position || 'Jogadora'} &bull; Gil Vicente FC
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedAthlete(null);
                  setActiveFormType(null);
                }}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Trocar Atleta</span>
              </button>
            </div>

            {/* Mode: Selection of form (if in 'all' mode and none clicked) */}
            {activeFormType === null && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {/* 1. Balança / Pesagem */}
                <button
                  type="button"
                  onClick={() => setActiveFormType('weight')}
                  className="flex flex-col items-center justify-between p-6 rounded-2xl border-2 border-cyan-500/40 bg-slate-900/80 hover:bg-cyan-950/30 hover:border-cyan-400 hover:scale-102 transition-all text-center space-y-4 group cursor-pointer shadow-lg"
                >
                  <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Scale className="h-8 w-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-100 uppercase">
                      1. Balança / Pesagem
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Registo rápido de Peso Pré ou Pós-Treino
                    </p>
                  </div>
                  <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.preWeight ? `Pré: ${athleteTodayStatus[selectedAthlete.id]?.preWeight} kg` : 'Registar Peso'}
                  </span>
                </button>

                {/* 2. Wellness */}
                <button
                  type="button"
                  onClick={() => setActiveFormType('wellness')}
                  className="flex flex-col items-center justify-between p-6 rounded-2xl border-2 border-amber-500/40 bg-slate-900/80 hover:bg-amber-950/30 hover:border-amber-400 hover:scale-102 transition-all text-center space-y-4 group cursor-pointer shadow-lg"
                >
                  <div className="h-16 w-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HeartPulse className="h-8 w-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-100 uppercase">
                      2. Questionário Wellness
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Sono, fadiga, humor, dor e ciclo menstrual
                    </p>
                  </div>
                  <span className="text-xs font-black text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.wellness ? '✓ Já Preenchido' : 'Preencher Agora'}
                  </span>
                </button>

                {/* 3. PSE / RPE */}
                <button
                  type="button"
                  onClick={() => setActiveFormType('rpe')}
                  className="flex flex-col items-center justify-between p-6 rounded-2xl border-2 border-purple-500/40 bg-slate-900/80 hover:bg-purple-950/30 hover:border-purple-400 hover:scale-102 transition-all text-center space-y-4 group cursor-pointer shadow-lg"
                >
                  <div className="h-16 w-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Dumbbell className="h-8 w-8 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-100 uppercase">
                      3. Questionário PSE
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Perceção de esforço após o treino ou jogo
                    </p>
                  </div>
                  <span className="text-xs font-black text-purple-300 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                    {athleteTodayStatus[selectedAthlete.id]?.rpe ? `✓ PSE: ${athleteTodayStatus[selectedAthlete.id]?.rpe}/10` : 'Preencher Agora'}
                  </span>
                </button>
              </div>
            )}

            {/* FORM 1: FAST DIGITAL SCALE KEYPAD */}
            {activeFormType === 'weight' && (
              <div className="bg-slate-900/90 border border-cyan-500/40 p-5 rounded-3xl shadow-2xl space-y-5 animate-fade-in max-w-lg mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-5 w-5 text-cyan-400" />
                    <span className="text-sm font-black text-slate-100 uppercase">
                      Balança Digital • {selectedAthlete.name}
                    </span>
                  </div>
                  {kioskMode === 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormType(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                    >
                      Outras Opções
                    </button>
                  )}
                </div>

                {/* Stage selector: Pré vs Pós */}
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setWeightStage('pre')}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      weightStage === 'pre'
                        ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚖️ Peso Pré-Treino
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightStage('post')}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      weightStage === 'post'
                        ? 'bg-blue-600 text-white shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚖️ Peso Pós-Treino
                  </button>
                </div>

                {/* Digital Scale Display */}
                <div className="bg-slate-950 border-2 border-cyan-500/40 rounded-2xl p-4 text-center space-y-1 shadow-inner">
                  <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest block">
                    {weightStage === 'pre' ? 'À Entrada do Treino' : 'À Saída do Treino'}
                  </span>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className="font-mono text-5xl sm:text-6xl font-black text-slate-100 tracking-tight">
                      {weightInputStr}
                    </span>
                    <span className="text-lg font-black text-cyan-400">kg</span>
                  </div>
                  {athleteTodayStatus[selectedAthlete.id]?.preWeight !== null && weightStage === 'post' && (
                    <span className="text-[11px] text-slate-400 font-bold block pt-1">
                      Peso Pré registado hoje: <strong className="text-slate-200">{athleteTodayStatus[selectedAthlete.id]?.preWeight} kg</strong>
                    </span>
                  )}
                </div>

                {/* Quick Deltas */}
                <div className="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleAdjustWeightDelta(-0.5)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    -0.5
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustWeightDelta(-0.1)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    -0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustWeightDelta(0.1)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    +0.1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustWeightDelta(0.5)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    +0.5
                  </button>
                </div>

                {/* Touch Numeric Keypad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKeypadPress(key)}
                      className="py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-lg font-black text-slate-100 border border-slate-700 shadow-sm flex items-center justify-center transition-all cursor-pointer"
                    >
                      {key === 'backspace' ? <Delete className="h-5 w-5 text-rose-400" /> : key}
                    </button>
                  ))}
                </div>

                {/* Submit Weight Button */}
                <button
                  type="button"
                  onClick={handleSubmitQuickWeight}
                  disabled={isSubmittingWeight}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-base shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingWeight ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5 stroke-[3]" />
                      <span>Gravar Peso {weightStage === 'pre' ? 'Pré' : 'Pós'} ({weightInputStr} kg)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* FORM 2: WELLNESS FORM */}
            {activeFormType === 'wellness' && (
              <div className="bg-slate-900/90 border border-amber-500/30 p-4 sm:p-6 rounded-3xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <HeartPulse className="h-5 w-5 text-amber-400" />
                    <span className="text-sm font-black text-slate-100 uppercase">
                      Questionário Wellness • {selectedAthlete.name}
                    </span>
                  </div>
                  {kioskMode === 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormType(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                    >
                      Outras Opções
                    </button>
                  )}
                </div>

                <WellnessForm
                  activeAthlete={selectedAthlete}
                  onSubmitSuccess={() => triggerSuccess(`✓ Wellness de ${selectedAthlete.name} registado com sucesso!`)}
                />
              </div>
            )}

            {/* FORM 3: RPE FORM */}
            {activeFormType === 'rpe' && (
              <div className="bg-slate-900/90 border border-purple-500/30 p-4 sm:p-6 rounded-3xl shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="h-5 w-5 text-purple-400" />
                    <span className="text-sm font-black text-slate-100 uppercase">
                      Questionário PSE (Perceção de Esforço) • {selectedAthlete.name}
                    </span>
                  </div>
                  {kioskMode === 'all' && (
                    <button
                      type="button"
                      onClick={() => setActiveFormType(null)}
                      className="text-xs text-slate-400 hover:text-slate-200 underline font-bold cursor-pointer"
                    >
                      Outras Opções
                    </button>
                  )}
                </div>

                <RPEForm
                  activeAthlete={selectedAthlete}
                  onSubmitSuccess={() => triggerSuccess(`✓ PSE de ${selectedAthlete.name} registado com sucesso!`)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
