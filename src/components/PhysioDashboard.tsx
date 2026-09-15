'use client';

import React, { useState, useEffect } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, Athlete } from '@/lib/types';
import { calculateHydrationStatus, isGoalkeeper } from '@/lib/data';
import {
  getWellnessLocally,
  getRPELocally,
  getHydrationLocally,
  deleteHydrationLocally,
  updateHydrationLocally,
  saveHydrationLocally,
  getPhysioPin,
  setPhysioPin as savePhysioPinToStorage,
  getClubActivationCode,
  syncAllDataFromCloud,
  getDynamicAthletes,
} from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import { translateTextToPortuguese, normalizeMenstrualCycleToPortuguese } from '@/lib/translationUtils';
import {
  Stethoscope, Shield, CheckCircle2, Clock, AlertTriangle, Search,
  Calendar, User, Droplets, HeartPulse, Dumbbell, Pencil, Trash2, X, Lock,
  ChevronLeft, ChevronRight, Check, Activity, Scale, Plus, Sparkles
} from 'lucide-react';
import { SquadMuscleHeatmap } from './SquadMuscleHeatmap';

interface PhysioDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const PHYSIO_ATTENDANCE_KEY = 'femperf_physio_attendance_status';

export const PhysioDashboard: React.FC<PhysioDashboardProps> = ({ isOpen, onClose }) => {
  const [athletes, setAthletes] = useState<Athlete[]>(() => getDynamicAthletes());

  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    handleUpdate();
    window.addEventListener('femperf_credentials_updated', handleUpdate);
    return () => window.removeEventListener('femperf_credentials_updated', handleUpdate);
  }, []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('femperf_physio_auth') === 'true';
    }
    return false;
  });
  const [physioPin, setPhysioPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [isEditingPinModalOpen, setIsEditingPinModalOpen] = useState<boolean>(false);
  const [newPhysioPinValue, setNewPhysioPinValue] = useState<string>('');
  const [pinSuccessMessage, setPinSuccessMessage] = useState<string | null>(null);

  const handleSaveNewPhysioPin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPhysioPinValue.trim();
    if (trimmed.length > 0) {
      savePhysioPinToStorage(trimmed);
      setIsEditingPinModalOpen(false);
      setNewPhysioPinValue('');
      setPinSuccessMessage('PIN da Fisioterapia alterado para sempre!');
      setTimeout(() => setPinSuccessMessage(null), 5000);
    }
  };

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('femperf_physio_selected_date') || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_physio_selected_date', date);
    }
  };

  const [activeTab, setActiveTabState] = useState<'triage' | 'wellness' | 'hydration'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_physio_active_tab') as any) || 'triage';
    }
    return 'triage';
  });

  const setActiveTab = (tab: 'triage' | 'wellness' | 'hydration') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_physio_active_tab', tab);
    }
  };

  const [wellnessList, setWellnessList] = useState<WellnessEntry[]>([]);
  const [rpeList, setRpeList] = useState<RPEEntry[]>([]);
  const [hydrationList, setHydrationList] = useState<HydrationEntry[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Attendance status for physio triage (date-athleteId -> boolean)
  const [attendanceMap, setAttendanceMap] = useState<Record<string, boolean>>({});

  // Editing Hydration
  const [editingHydrationEntry, setEditingHydrationEntry] = useState<HydrationEntry | null>(null);
  const [editPreWeight, setEditPreWeight] = useState<string>('');
  const [editPostWeight, setEditPostWeight] = useState<string>('');
  const [editFluids, setEditFluids] = useState<string>('');

  // Weighing Station Modal & Quick Entry state
  const [isWeighingStationOpen, setIsWeighingStationOpen] = useState<boolean>(false);
  const [selectedAthleteIdForWeighing, setSelectedAthleteIdForWeighing] = useState<string>('');
  const [weighingStage, setWeighingStage] = useState<'pre' | 'post'>('pre');
  const [inputWeight, setInputWeight] = useState<string>('62.5');
  const [inputFluids, setInputFluids] = useState<string>('0.5');
  const [weighingSuccessToast, setWeighingSuccessToast] = useState<string | null>(null);
  const [weighingSearchFilter, setWeighingSearchFilter] = useState<string>('');

  const handleSelectAthleteForWeighing = (athId: string) => {
    setSelectedAthleteIdForWeighing(athId);
    const existing = hydrationList.find((h) => h.athleteId === athId && h.date === selectedDate);
    if (existing) {
      if (existing.postWeight > 0) {
        setWeighingStage('post');
        setInputWeight(existing.postWeight.toString());
        setInputFluids(existing.fluidsIntake > 0 ? existing.fluidsIntake.toString() : '0.5');
      } else if (existing.preWeight > 0) {
        setWeighingStage('post');
        setInputWeight((existing.preWeight - 0.8).toFixed(1));
        setInputFluids('0.5');
      } else {
        setWeighingStage('pre');
        setInputWeight('62.0');
        setInputFluids('0.5');
      }
    } else {
      setWeighingStage('pre');
      setInputWeight('62.0');
      setInputFluids('0.5');
    }
  };

  const adjustInputWeight = (delta: number) => {
    const parseNum = (val: string | number): number => {
      if (!val) return 60.0;
      const num = parseFloat(val.toString().replace(',', '.'));
      return isNaN(num) ? 60.0 : num;
    };
    const current = parseNum(inputWeight);
    const updated = Math.max(30, Number((current + delta).toFixed(2)));
    setInputWeight(updated.toString());
  };

  const handleSaveWeighingStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteIdForWeighing) return;

    const athlete = athletes.find((a) => a.id === selectedAthleteIdForWeighing);
    if (!athlete) return;

    const parseNum = (val: string | number): number => {
      if (val === null || val === undefined) return 0;
      const str = val.toString().trim().replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const weight = parseNum(inputWeight);
    const fluids = parseNum(inputFluids || '0.5');

    if (weight <= 0) return;

    const existing = hydrationList.find((h) => h.athleteId === athlete.id && h.date === selectedDate);

    let newEntry: HydrationEntry;

    if (weighingStage === 'pre') {
      const postW = existing ? existing.postWeight : 0;
      const calc = postW > 0 ? calculateHydrationStatus(weight, postW, fluids, 'pt') : null;
      newEntry = {
        id: existing ? existing.id : `hyd-${selectedDate}-${athlete.id}`,
        athleteId: athlete.id,
        athleteName: athlete.name,
        date: selectedDate,
        durationMin: 90,
        preWeight: weight,
        postWeight: postW,
        fluidsIntake: postW > 0 ? fluids : 0,
        weightLoss: calc ? calc.weightLoss : 0,
        dehydrationRate: calc ? calc.dehydrationRate : 0,
        status: calc ? calc.status : 'Adequada',
        refillNeededLiters: calc ? calc.refillNeededLiters : 0,
        recommendation: calc ? calc.recommendation : 'Pesagem pré-treino registada. Aguarda pesagem pós-treino.',
        biologicalImpact: calc ? calc.biologicalImpact : 'Registo de entrada efetuado.',
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    } else {
      const preW = existing && existing.preWeight > 0 ? existing.preWeight : weight + 0.8;
      const calc = calculateHydrationStatus(preW, weight, fluids, 'pt');
      newEntry = {
        id: existing ? existing.id : `hyd-${selectedDate}-${athlete.id}`,
        athleteId: athlete.id,
        athleteName: athlete.name,
        date: selectedDate,
        durationMin: 90,
        preWeight: preW,
        postWeight: weight,
        fluidsIntake: fluids,
        weightLoss: calc.weightLoss,
        dehydrationRate: calc.dehydrationRate,
        status: calc.status,
        refillNeededLiters: calc.refillNeededLiters,
        recommendation: calc.recommendation,
        biologicalImpact: calc.biologicalImpact,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    }

    saveHydrationLocally(newEntry);
    secureFetch('/api/hydration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEntry),
    }).catch(() => {});

    loadData();

    setWeighingSuccessToast(
      `✨ Pesagem de ${athlete.name} (${weighingStage === 'pre' ? 'PRÉ' : 'PÓS'}: ${weight} kg) guardada com sucesso!`
    );
    setTimeout(() => setWeighingSuccessToast(null), 3500);

    setSelectedAthleteIdForWeighing('');
  };

  const loadData = () => {
    const w = getWellnessLocally();
    const r = getRPELocally();
    const h = getHydrationLocally();

    setWellnessList(w);
    setRpeList(r);
    setHydrationList(h);

    try {
      const storedMap = JSON.parse(localStorage.getItem(PHYSIO_ATTENDANCE_KEY) || '{}');
      setAttendanceMap(storedMap);
    } catch {
      setAttendanceMap({});
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      syncAllDataFromCloud();
      loadData();

      const handleDataUpdate = () => {
        loadData();
      };

      window.addEventListener('femperf_data_updated', handleDataUpdate);
      return () => {
        window.removeEventListener('femperf_data_updated', handleDataUpdate);
      };
    }
  }, [isOpen, isAuthenticated, selectedDate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getPhysioPin();
    const cleanInput = physioPin.trim();
    const activationCode = getClubActivationCode();
    
    if (cleanInput.toUpperCase() === activationCode.toUpperCase() || cleanInput.toUpperCase() === 'GVFC2026@') {
      setPinError('O Código de Ativação da App não é válido para aceder ao Gabinete Médico. Introduza a Palavra-passe da Fisioterapia.');
      setPhysioPin('');
      return;
    }

    if (cleanInput === storedPin.trim()) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('femperf_physio_auth', 'true');
      }
      setPinError('');
      loadData();
    } else {
      setPinError('PIN da Fisioterapia incorreto. Tente novamente.');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('femperf_physio_auth');
      localStorage.removeItem('femperf_active_view_mode');
    }
    setIsAuthenticated(false);
    onClose();
  };

  const toggleAttendance = (key: string) => {
    const updated = { ...attendanceMap, [key]: !attendanceMap[key] };
    setAttendanceMap(updated);
    try {
      localStorage.setItem(PHYSIO_ATTENDANCE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Erro ao guardar estado da fisioterapia:', e);
    }
  };

  const handleDeleteHydration = async (id: string) => {
    if (confirm('Tem a certeza que deseja apagar este registo de hidratação?')) {
      deleteHydrationLocally(id);
      try {
        await secureFetch(`/api/hydration?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Erro ao apagar registo no servidor:', e);
      }
      loadData();
    }
  };

  const handleStartEditHydration = (entry: HydrationEntry) => {
    setEditingHydrationEntry(entry);
    setEditPreWeight(entry.preWeight.toString());
    setEditPostWeight(entry.postWeight.toString());
    setEditFluids(entry.fluidsIntake.toString());
  };

  const handleSaveEditedHydration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHydrationEntry) return;

    const parseNum = (val: string | number): number => {
      if (val === null || val === undefined) return 0;
      const str = val.toString().trim().replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const pre = parseNum(editPreWeight);
    const post = parseNum(editPostWeight);
    const fluids = parseNum(editFluids || '0.5');

    if (pre <= 0) return;

    const calc = calculateHydrationStatus(pre, post, fluids, 'pt');
    const updated: HydrationEntry = {
      ...editingHydrationEntry,
      preWeight: pre,
      postWeight: post,
      fluidsIntake: fluids,
      weightLoss: calc.weightLoss,
      dehydrationRate: calc.dehydrationRate,
      status: calc.status,
      refillNeededLiters: calc.refillNeededLiters,
      recommendation: calc.recommendation,
      biologicalImpact: calc.biologicalImpact,
    };

    updateHydrationLocally(updated);
    setEditingHydrationEntry(null);
    loadData();
  };

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl border border-teal-500/30 bg-dark-card p-6 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase text-slate-100">Gabinete de Fisioterapia</h2>
                <p className="text-[11px] text-teal-400 font-bold">Departamento Médico Gil Vicente</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-300 block mb-1.5">
                PIN de Acesso da Fisioterapeuta
              </label>
              <input
                type="password"
                value={physioPin}
                onChange={(e) => setPhysioPin(e.target.value)}
                placeholder="Insira o PIN"
                autoFocus
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-center text-lg font-black tracking-widest text-slate-100 focus:border-teal-500 focus:outline-none"
              />
              {pinError && <p className="text-xs font-bold text-rose-400 mt-1 text-center">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition-all"
            >
              Entrar no Gabinete Médico
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Triage list: Athletes needing physio for selected date
  const todaysWellness = wellnessList.filter((w) => w.date === selectedDate);
  const physioAthletesToday = todaysWellness.filter((w) => w.needsPhysio);

  // Filtered hydration list
  const filteredHydration = hydrationList.filter(
    (h) =>
      h.date === selectedDate &&
      h.athleteName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-bg text-slate-100 p-3 pt-safe sm:p-6 sm:pt-safe animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-teal-900/60 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-black shadow-lg shadow-teal-600/30">
              <Stethoscope className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-100">
                Gil Vicente FC &bull; Gabinete de Fisioterapia
              </h1>
              <p className="text-[11px] font-bold text-teal-400">Triagem Pré-Treino & Gestão Fisiológica</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Date Selector */}
            <div className="flex items-center space-x-1 rounded-xl border border-slate-700 bg-dark-card p-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              />
            </div>

            {/* Quick Weighing Station Button */}
            <button
              type="button"
              onClick={() => {
                setIsWeighingStationOpen(true);
                setSelectedAthleteIdForWeighing('');
              }}
              className="flex items-center space-x-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-black text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all active:scale-95"
            >
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">⚖️ Registar Pesagem</span>
              <span className="sm:hidden">⚖️ Pesagem</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setNewPhysioPinValue(getPhysioPin());
                setIsEditingPinModalOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-xl border border-teal-500/40 bg-teal-950/40 px-3 py-2 text-xs font-bold text-teal-300 hover:bg-teal-900/60 transition-all"
            >
              <Lock className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Redefinir PIN</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Sair
            </button>
          </div>
        </div>

        {pinSuccessMessage && (
          <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs font-black text-emerald-400 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{pinSuccessMessage}</span>
          </div>
        )}

        {/* Top Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('triage')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'triage'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>🚨 Atendimento Pré-Treino ({physioAthletesToday.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wellness')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'wellness'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <HeartPulse className="h-4 w-4 text-brand-lime" />
            <span>🧘 Questionários & Sintomas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hydration')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'hydration'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Droplets className="h-4 w-4 text-cyan-400" />
            <span>💧 Gestão de Pesagem & Hidratação</span>
          </button>
        </div>

        {/* TAB 1: TRIAGEM DE FISIOTERAPIA PRÉ-TREINO */}
        {activeTab === 'triage' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div>
                <h3 className="text-sm font-black text-amber-300 uppercase flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Jogadoras que Necessitam de Fisioterapia Pré-Treino</span>
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  Lista de atletas que assinalaram necessidade de atendimento fisioterapêutico no Wellness de {selectedDate}.
                </p>
              </div>
              <span className="text-xl font-black text-amber-400 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/40">
                {physioAthletesToday.length} Atletas
              </span>
            </div>

            {physioAthletesToday.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-dark-card p-12 text-center space-y-2">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h4 className="text-sm font-extrabold text-slate-200">Nenhuma jogadora assinalou fisioterapia pré-treino para esta data.</h4>
                <p className="text-xs text-slate-400">Todas as atletas aptas sem queixas registadas no dia {selectedDate}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {physioAthletesToday.map((item) => {
                  const key = `${item.date}-${item.athleteId}`;
                  const isAttended = Boolean(attendanceMap[key]);

                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-5 space-y-3 shadow-lg transition-all ${
                        isAttended
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-rose-500/50 bg-rose-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 text-slate-100 font-black text-sm border border-slate-700">
                            {item.athleteName.charAt(0)}
                          </div>
                           <div>
                             <div className="flex items-center space-x-1.5">
                               <h4 className="text-sm font-black text-slate-100">{item.athleteName}</h4>
                               {isGoalkeeper(item.athleteName) && (
                                 <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                   🧤 GR
                                 </span>
                               )}
                             </div>
                             <span className="text-[10px] font-bold text-slate-400">
                               Wellness Total: {item.wellnessTotal || '28'}/35
                             </span>
                           </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleAttendance(key)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                            isAttended
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-rose-600 text-white shadow-md hover:bg-rose-500'
                          }`}
                        >
                          {isAttended ? (
                            <>
                              <Check className="h-4 w-4" />
                              <span>Atendida / Trata</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-4 w-4" />
                              <span>Pendente</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Motivo & Queixa */}
                      <div className="space-y-1 bg-dark-bg p-3 rounded-xl border border-slate-800">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">
                          Motivo / Queixa Relatada:
                        </span>
                        <p className="text-xs font-semibold text-slate-200">
                          {translateTextToPortuguese(item.physioReason) || 'Dores e rigidez muscular generalizada.'}
                        </p>
                      </div>

                      {/* Muscle Fatigue Tags */}
                      {item.muscleFatigue && Object.keys(item.muscleFatigue).length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Zonas Afetadas:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(item.muscleFatigue).map(([muscle, score]) => (
                              <span
                                key={muscle}
                                className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-bold"
                              >
                                {muscle}: {score}/10
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONSULTA DE QUESTIONÁRIOS */}
        {activeTab === 'wellness' && (
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-100 uppercase">Questionários de Wellness em {selectedDate}</h3>
            <div className="divide-y divide-slate-800">
              {todaysWellness.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center italic">Nenhum questionário Wellness submetido nesta data.</p>
              ) : (
                todaysWellness.map((w) => (
                  <div key={w.id} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-100 text-xs">{w.athleteName}</span>
                      <div className="text-[11px] text-slate-400 space-x-2">
                        <span>Sono: {w.sleepQuality}/5</span>
                        <span>Fadiga: {w.fatigue}/5</span>
                        <span>Stress: {w.stress}/5</span>
                        <span>Dores: {w.soreness}/5</span>
                      </div>
                    </div>
                    {w.needsPhysio && (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        🚨 Fisioterapia
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Squad Muscle Heatmap Body Chart */}
            <SquadMuscleHeatmap
              entries={todaysWellness}
              date={selectedDate}
              title="Mapa Coletivo de Queixas Musculares do Plantel (Gabinete Médico)"
            />
          </div>
        )}

        {/* TAB 3: GESTÃO DE PESAGEM E HIDRATAÇÃO */}
        {activeTab === 'hydration' && (
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4 shadow-lg">
            {/* Quick Weighing Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-dark-bg p-3.5 rounded-xl border border-cyan-500/30">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-100">Balança Rápida & Registos do Plantel</h4>
                  <p className="text-[11px] text-slate-400">Regista a pesagem de entrada (pré) ou saída (pós) para qualquer jogadora.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsWeighingStationOpen(true);
                  setSelectedAthleteIdForWeighing('');
                }}
                className="flex items-center justify-center space-x-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>⚖️ Abrir Estação de Pesagem Rápida</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-cyan-400" />
                  <span>Gestão de Pesagem & Hidratação ({selectedDate})</span>
                </h3>
                <p className="text-xs text-slate-400">A fisioterapeuta pode visualizar, editar ou apagar qualquer registo.</p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar jogadora..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-dark-bg text-slate-400 font-extrabold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Jogadora</th>
                    <th className="py-2.5 px-3">Peso Pré</th>
                    <th className="py-2.5 px-3">Peso Pós</th>
                    <th className="py-2.5 px-3">Perda (kg)</th>
                    <th className="py-2.5 px-3">Desidratação (%)</th>
                    <th className="py-2.5 px-3">Reposição (L)</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-semibold">
                  {filteredHydration.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Sem registos de pesagem para {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredHydration.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-slate-100">{h.athleteName}</td>
                        <td className="py-3 px-3 text-slate-300">{h.preWeight} kg</td>
                        <td className="py-3 px-3 text-slate-300">{h.postWeight > 0 ? `${h.postWeight} kg` : '-'}</td>
                        <td className="py-3 px-3 font-bold text-amber-400">{h.postWeight > 0 ? `-${h.weightLoss} kg` : '-'}</td>
                        <td className="py-3 px-3 font-bold text-cyan-300">{h.postWeight > 0 ? `${h.dehydrationRate}%` : '-'}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{h.postWeight > 0 ? `+${h.refillNeededLiters} L` : '-'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              h.postWeight > 0
                                ? h.status === 'Alerta'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : h.status === 'Atenção'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                            }`}
                          >
                            {h.postWeight > 0 ? h.status : 'Pendente'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditHydration(h)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-cyan-400 hover:bg-slate-700"
                            title="Editar Registo"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteHydration(h.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                            title="Apagar Registo"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EDIT HYDRATION MODAL */}
        {editingHydrationEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-dark-card p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black uppercase text-slate-100">
                  Editar Pesagem: {editingHydrationEntry.athleteName}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingHydrationEntry(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedHydration} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-300 mb-1">Peso Pré-Treino (kg)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editPreWeight}
                    onChange={(e) => setEditPreWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Peso Pós-Treino (kg)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editPostWeight}
                    onChange={(e) => setEditPostWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1">Fluidos Ingeridos (L)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editFluids}
                    onChange={(e) => setEditFluids(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-slate-100 font-bold"
                  />
                </div>

                <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingHydrationEntry(null)}
                    className="rounded-xl border border-slate-700 bg-dark-bg px-4 py-2 text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-600 px-4 py-2 font-black text-white hover:bg-teal-500"
                  >
                    Guardar Alterações
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* WEIGHING STATION MODAL */}
        {isWeighingStationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-3xl rounded-2xl border border-cyan-500/40 bg-dark-card p-5 sm:p-6 shadow-2xl space-y-5 overflow-y-auto max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white font-black shadow-lg shadow-cyan-600/30">
                    <Scale className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-slate-100">Estação de Pesagem Rápida</h2>
                    <p className="text-[11px] font-bold text-cyan-400">Gabinete de Fisioterapia &bull; Data: {selectedDate}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWeighingStationOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {weighingSuccessToast && (
                <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{weighingSuccessToast}</span>
                </div>
              )}

              {/* Step 1: Select Athlete */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-extrabold uppercase text-slate-300">
                    1. Selecionar Jogadora do Plantel:
                  </label>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Procurar jogadora..."
                      value={weighingSearchFilter}
                      onChange={(e) => setWeighingSearchFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-dark-bg py-1 pl-8 pr-3 text-xs text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                  {athletes.filter((ath) =>
                    ath.name.toLowerCase().includes(weighingSearchFilter.toLowerCase())
                  ).map((ath) => {
                    const existing = hydrationList.find((h) => h.athleteId === ath.id && h.date === selectedDate);
                    const isSelected = selectedAthleteIdForWeighing === ath.id;

                    return (
                      <button
                        key={ath.id}
                        type="button"
                        onClick={() => handleSelectAthleteForWeighing(ath.id)}
                        className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-cyan-500 bg-cyan-950/60 ring-2 ring-cyan-500 shadow-lg scale-[1.02]'
                            : 'border-slate-800 bg-dark-bg hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 font-extrabold text-xs text-slate-200 border border-slate-700">
                          {ath.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-slate-100 mt-1 truncate w-full">{ath.name}</span>

                        {/* Status chip */}
                        <div className="mt-1 flex items-center space-x-1 text-[9px] font-extrabold">
                          {existing ? (
                            existing.postWeight > 0 ? (
                              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-full">
                                Pós: {existing.postWeight}kg
                              </span>
                            ) : (
                              <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded-full">
                                Pré: {existing.preWeight}kg
                              </span>
                            )
                          ) : (
                            <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-full">
                              Pendente
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Enter Weight for Selected Athlete */}
              {selectedAthleteIdForWeighing ? (
                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-4 animate-fade-in">
                  {(() => {
                    const selectedAth = athletes.find((a) => a.id === selectedAthleteIdForWeighing);
                    const existing = hydrationList.find((h) => h.athleteId === selectedAthleteIdForWeighing && h.date === selectedDate);

                    return (
                      <form onSubmit={handleSaveWeighingStation} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-100 flex items-center space-x-2">
                              <span>{selectedAth?.name}</span>
                              {selectedAth && isGoalkeeper(selectedAth.name) && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  🧤 GR
                                </span>
                              )}
                            </h3>
                            <span className="text-[11px] text-cyan-400 font-bold block mt-0.5">
                              {existing
                                ? existing.postWeight > 0
                                  ? `Pesagem concluída hoje (Pré: ${existing.preWeight} kg | Pós: ${existing.postWeight} kg)`
                                  : `Pesagem pré-treino guardada: ${existing.preWeight} kg`
                                : 'Nenhuma pesagem registada hoje.'}
                            </span>
                          </div>

                          {/* Stage Selector Toggle */}
                          <div className="flex items-center space-x-1 rounded-xl bg-dark-bg p-1 border border-slate-700">
                            <button
                              type="button"
                              onClick={() => setWeighingStage('pre')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                weighingStage === 'pre'
                                  ? 'bg-cyan-600 text-white shadow-md'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              🟢 PRÉ-Treino (Entrada)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWeighingStage('post')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                weighingStage === 'post'
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              🔵 PÓS-Treino (Saída)
                            </button>
                          </div>
                        </div>

                        {/* Main Weight Input + Steppers */}
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold uppercase text-slate-300 block">
                            Peso Registado em Balança (kg):
                          </label>
                          <div className="flex items-center justify-center space-x-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={inputWeight}
                              onChange={(e) => setInputWeight(e.target.value)}
                              className="w-48 text-center text-3xl font-black bg-dark-bg text-cyan-300 border-2 border-cyan-500 p-3 rounded-2xl focus:outline-none shadow-inner"
                            />
                            <span className="text-xl font-black text-slate-300">kg</span>
                          </div>

                          {/* Stepper Adjustment Buttons */}
                          <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                            {[-1.0, -0.5, -0.1, 0.1, 0.5, 1.0].map((delta) => (
                              <button
                                key={delta}
                                type="button"
                                onClick={() => adjustInputWeight(delta)}
                                className="px-3 py-1 rounded-xl border border-slate-700 bg-dark-bg text-xs font-black text-slate-200 hover:bg-cyan-600 hover:text-white transition-all"
                              >
                                {delta > 0 ? `+${delta}` : delta} kg
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Fluids intake input for Post-Training */}
                        {weighingStage === 'post' && (
                          <div className="space-y-2 bg-dark-bg p-3.5 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-300">Fluidos Ingeridos Durante o Treino (Litros):</label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={inputFluids}
                                onChange={(e) => setInputFluids(e.target.value)}
                                className="w-24 text-center font-bold bg-dark-card border border-slate-700 p-1.5 rounded-xl text-slate-100"
                              />
                            </div>
                            <div className="flex justify-end gap-1 text-[11px]">
                              {['0.25', '0.5', '0.75', '1.0', '1.5'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setInputFluids(val)}
                                  className="px-2 py-0.5 rounded-lg border border-slate-700 bg-dark-card text-slate-300 font-bold hover:bg-slate-700"
                                >
                                  {val} L
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submit button */}
                        <div className="flex justify-end space-x-2 border-t border-cyan-500/20 pt-3">
                          <button
                            type="button"
                            onClick={() => setSelectedAthleteIdForWeighing('')}
                            className="rounded-xl border border-slate-700 bg-dark-bg px-4 py-2 text-xs font-bold text-slate-300"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="rounded-xl bg-cyan-600 px-6 py-2.5 text-xs font-black text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all flex items-center space-x-2"
                          >
                            <Check className="h-4 w-4" />
                            <span>Guardar Pesagem de {selectedAth?.name}</span>
                          </button>
                        </div>
                      </form>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-slate-400 text-xs font-semibold">
                  👆 Clica numa jogadora acima para registar ou atualizar o peso de hoje.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Redefinir PIN de Fisioterapia */}
      {isEditingPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-teal-500/30 bg-dark-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-teal-400" />
                <h3 className="text-sm font-black uppercase text-slate-100">Redefinir PIN do Gabinete</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPinModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPhysioPin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Novo PIN da Fisioterapeuta
                </label>
                <input
                  type="text"
                  value={newPhysioPinValue}
                  onChange={(e) => setNewPhysioPinValue(e.target.value)}
                  placeholder="Ex: 4321"
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-center text-lg font-black tracking-widest text-teal-400 focus:border-teal-500 focus:outline-none shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Este novo PIN será guardado permanentemente na nuvem (Supabase).
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingPinModalOpen(false)}
                  className="w-1/2 rounded-xl border border-slate-700 bg-dark-bg py-2.5 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-teal-600 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-teal-600/30 hover:bg-teal-500 transition-all"
                >
                  Guardar PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
