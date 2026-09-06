'use client';

import React, { useState, useEffect } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, Athlete } from '@/lib/types';
import { INITIAL_ATHLETES, BORG_SCALE, calculateHydrationStatus } from '@/lib/data';
import { getWellnessLocally, getRPELocally, getHydrationLocally, getAthletePin, setAthletePin, saveBulkGsheetsData, deleteHydrationLocally, updateHydrationLocally, clearAllHistoricalData, getAdminPin, setAdminPin as saveAdminPinToStorage, getPhysioPin, setPhysioPin as savePhysioPinToStorage } from '@/lib/storage';
import { exportWellnessToExcel, exportRPEToExcel, exportHydrationToExcel, exportAllDataToExcel } from '@/lib/exportUtils';
import { getStoredReminderConfig, saveReminderConfig, requestNotificationPermission, getNotificationPermission, sendMobileNotification, getPendingQuestionnairesStatus, ReminderConfig } from '@/lib/reminderUtils';
import { useLanguage } from '@/context/LanguageContext';
import { IndividualAthleteView } from './IndividualAthleteView';
import { FinesComplianceView } from './FinesComplianceView';
import { CollectiveSquadView } from './CollectiveSquadView';
import { TrainingSessionManager } from './TrainingSessionManager';
import { SquadMuscleHeatmap } from './SquadMuscleHeatmap';
import {
  Shield, Users, Stethoscope, Activity, Search, Lock, X, KeyRound,
  CheckCircle2, LayoutGrid, HeartPulse, Dumbbell, Droplets, AlertTriangle,
  MessageSquare, Tag, Info, AlertCircle, ArrowUpRight, User, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Sparkles, Euro, Trash2, Pencil,
  Download, FileSpreadsheet, FileText, Bell, Smartphone
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminLoginPin, setAdminLoginPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [wellnessList, setWellnessList] = useState<WellnessEntry[]>([]);
  const [rpeList, setRpeList] = useState<RPEEntry[]>([]);
  const [hydrationList, setHydrationList] = useState<HydrationEntry[]>([]);

  const [allWellnessList, setAllWellnessList] = useState<WellnessEntry[]>([]);
  const [allRpeList, setAllRpeList] = useState<RPEEntry[]>([]);
  const [allHydrationList, setAllHydrationList] = useState<HydrationEntry[]>([]);

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('femperf_admin_selected_date') || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_selected_date', date);
    }
  };

  const [searchFilter, setSearchFilter] = useState<string>('');

  const [activeTab, setActiveTabState] = useState<'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_admin_active_tab') as any) || 'schedule';
    }
    return 'schedule';
  });

  const setActiveTab = (tab: 'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_active_tab', tab);
    }
  };

  const [subTab, setSubTabState] = useState<'general' | 'wellness' | 'rpe' | 'hydration'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_admin_sub_tab') as any) || 'general';
    }
    return 'general';
  });

  const setSubTab = (tab: 'general' | 'wellness' | 'rpe' | 'hydration') => {
    setSubTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_sub_tab', tab);
    }
  };

  const [pinsState, setPinsState] = useState<{ [athleteId: string]: string | null }>({});
  const [editingPinAthlete, setEditingPinAthlete] = useState<Athlete | null>(null);
  const [newPinInput, setNewPinInput] = useState<string>('');

  const [editingHydrationEntry, setEditingHydrationEntry] = useState<HydrationEntry | null>(null);
  const [editPreWeight, setEditPreWeight] = useState<string>('');
  const [editPostWeight, setEditPostWeight] = useState<string>('');
  const [editFluids, setEditFluids] = useState<string>('');

  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportDataType, setExportDataType] = useState<'ALL' | 'WELLNESS' | 'RPE' | 'HYDRATION'>('ALL');
  const [exportAthleteId, setExportAthleteId] = useState<string>('ALL');

  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(getStoredReminderConfig());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, [isOpen]);

  const handleUpdateReminderConfig = (updated: Partial<ReminderConfig>) => {
    const newCfg = { ...reminderConfig, ...updated };
    setReminderConfig(newCfg);
    saveReminderConfig(newCfg);
  };

  const handleSendBroadcastReminder = async () => {
    let pendingCount = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    INITIAL_ATHLETES.forEach((ath) => {
      const st = getPendingQuestionnairesStatus(ath.id, todayStr, allWellnessList, allRpeList, allHydrationList);
      if (!st.isComplete) {
        pendingCount++;
      }
    });

    const title = `⚽ Gil Vicente FC • Lembrete da Equipa Técnica`;
    const body = pendingCount > 0
      ? `Atenção: Há ${pendingCount} jogadora(s) com questionários pendentes hoje. Por favor preenche os teus registos.`
      : `Lembrete geral de preenchimento dos questionários de Wellness e PSE.`;

    const sent = await sendMobileNotification(title, body, `admin-broadcast-${Date.now()}`);
    if (sent) {
      setBroadcastMessage(`📢 Notificação enviada para os telemóveis com sucesso! (${pendingCount} atletas pendentes hoje)`);
    } else {
      const res = await requestNotificationPermission();
      setNotifPermission(res);
      if (res === 'granted') {
        await sendMobileNotification(title, body, `admin-broadcast-${Date.now()}`);
        setBroadcastMessage(`📢 Notificações no telemóvel ativadas e alerta enviado!`);
      } else {
        setBroadcastMessage(`⚠️ Permissão de notificação pendente neste dispositivo.`);
      }
    }
    setTimeout(() => setBroadcastMessage(null), 5000);
  };

  const handleExecuteExport = () => {
    const selectedAthleteObj = INITIAL_ATHLETES.find((a) => a.id === exportAthleteId);
    const athleteFilterName = exportAthleteId === 'ALL' ? undefined : (selectedAthleteObj?.name || exportAthleteId);

    if (exportDataType === 'WELLNESS') {
      exportWellnessToExcel(allWellnessList, athleteFilterName);
    } else if (exportDataType === 'RPE') {
      exportRPEToExcel(allRpeList, athleteFilterName);
    } else if (exportDataType === 'HYDRATION') {
      exportHydrationToExcel(allHydrationList, athleteFilterName);
    } else {
      exportAllDataToExcel(allWellnessList, allRpeList, allHydrationList, athleteFilterName);
    }

    setIsExportModalOpen(false);
  };

  const handleDeleteHydration = (id: string) => {
    if (confirm('Tem a certeza que deseja apagar este registo de hidratação?')) {
      deleteHydrationLocally(id);
      loadAllData();
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

    const pre = parseFloat(editPreWeight);
    const post = parseFloat(editPostWeight);
    const fluids = parseFloat(editFluids || '0.5');

    if (isNaN(pre) || isNaN(post) || pre <= 0 || post <= 0) return;

    const calc = calculateHydrationStatus(pre, post, fluids, language);
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
    loadAllData();
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadAllData();
      loadAllPins();

      // Automatic sync on load
      handleSyncGsheets(true);

      // Automatic background interval every 15 seconds
      const intervalId = setInterval(() => {
        handleSyncGsheets(true);
      }, 15000);

      return () => clearInterval(intervalId);
    }
  }, [isOpen, isAuthenticated, selectedDate]);

  const loadAllData = () => {
    const w = getWellnessLocally();
    const r = getRPELocally();
    const h = getHydrationLocally();

    setAllWellnessList(w);
    setAllRpeList(r);
    setAllHydrationList(h);

    setWellnessList(w.filter((item) => item.date === selectedDate));
    setRpeList(r.filter((item) => item.date === selectedDate));
    setHydrationList(h.filter((item) => item.date === selectedDate));
  };

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const setTodayDate = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const setYesterdayDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSyncGsheets = async (isSilent = false) => {
    if (!isSilent) {
      setIsSyncing(true);
      setSyncStatus(null);
    }
    try {
      const res = await fetch('/api/sync-sheets');
      const data = await res.json();
      if (data.success && data.data) {
        const result = saveBulkGsheetsData(
          data.data.wellness || [],
          data.data.rpe || [],
          data.data.hydration || []
        );
        loadAllData();
        if (!isSilent) {
          setSyncStatus(`⚡ Sincronização automática concluída! +${result.wellnessAdded + result.rpeAdded + result.hydrationAdded} novos registos.`);
        }
      } else {
        loadAllData();
        if (!isSilent) {
          setSyncStatus('⚡ Sincronização concluída. Apresentados apenas registos reais submetidos.');
        }
      }
    } catch {
      loadAllData();
      if (!isSilent) {
        setSyncStatus('⚡ Sincronização offline concluída com sucesso.');
      }
    } finally {
      if (!isSilent) {
        setIsSyncing(false);
        setTimeout(() => setSyncStatus(null), 5000);
      }
    }
  };

  const [currentAdminPinState, setCurrentAdminPinState] = useState<string>('2026');
  const [currentPhysioPinState, setCurrentPhysioPinState] = useState<string>('2026');

  const [isEditingAdminPin, setIsEditingAdminPin] = useState<boolean>(false);
  const [newAdminPinInput, setNewAdminPinInput] = useState<string>('');

  const [isEditingPhysioPin, setIsEditingPhysioPin] = useState<boolean>(false);
  const [newPhysioPinInput, setNewPhysioPinInput] = useState<string>('');

  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);

  const loadAllPins = () => {
    setCurrentAdminPinState(getAdminPin());
    setCurrentPhysioPinState(getPhysioPin());

    const pinsMap: { [athleteId: string]: string | null } = {};
    INITIAL_ATHLETES.forEach((ath) => {
      pinsMap[ath.id] = getAthletePin(ath.id);
    });
    setPinsState(pinsMap);
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getAdminPin();
    if (adminLoginPin.trim() === storedPin.trim()) {
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Palavra-passe / PIN de Administrador incorreto. Tente novamente.');
      setAdminLoginPin('');
    }
  };

  const handleSaveAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPinInput.trim().length > 0) {
      saveAdminPinToStorage(newAdminPinInput.trim());
      loadAllPins();
      setIsEditingAdminPin(false);
      setNewAdminPinInput('');
      setPinChangeSuccess('Palavra-passe / PIN da Administração redefinido com sucesso!');
      setTimeout(() => setPinChangeSuccess(null), 4000);
    }
  };

  const handleSavePhysioPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPhysioPinInput.trim().length > 0) {
      savePhysioPinToStorage(newPhysioPinInput.trim());
      loadAllPins();
      setIsEditingPhysioPin(false);
      setNewPhysioPinInput('');
      setPinChangeSuccess('Palavra-passe / PIN do Departamento Médico redefinido com sucesso!');
      setTimeout(() => setPinChangeSuccess(null), 4000);
    }
  };

  const handleSaveAthletePin = (athleteId: string) => {
    if (newPinInput.length === 4 || newPinInput === '') {
      setAthletePin(athleteId, newPinInput);
      loadAllPins();
      setEditingPinAthlete(null);
      setNewPinInput('');
    }
  };

  if (!isOpen) return null;

  // PIN Authentication Screen for Admin Access
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
        <div className="w-full max-w-sm rounded-2xl border border-red-500/40 bg-dark-card p-6 shadow-2xl space-y-5 text-center">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-red-500">
              <Shield className="h-6 w-6" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Área Técnica Gil Vicente FC</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <h2 className="text-base font-extrabold text-slate-100 uppercase">Acesso Restrito ao Departamento de Performance</h2>
            <p className="text-xs text-slate-400 mt-1">
              Introduz o PIN de Administrador para ver relatórios e gerir as palavras-passe das jogadoras.
            </p>
          </div>

          <form onSubmit={handleAdminPinSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                maxLength={6}
                placeholder="PIN Admin"
                value={adminLoginPin}
                onChange={(e) => setAdminLoginPin(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-bg py-3 pl-10 pr-4 text-center text-base font-bold text-slate-100 tracking-widest focus:border-red-500 focus:outline-none"
              />
            </div>

            {pinError && <p className="text-xs font-bold text-rose-400">{pinError}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-red-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all"
            >
              Entrar como Administrador
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Physio referrals today
  const physioReferrals = wellnessList.filter((item) => item.needsPhysio);

  // Helper for Wellness Total (sum of 7 variables: sleepQuality, sleepDuration, mood, stress, fatigue, soreness, heavyLegs) -> 7 to 35
  const getWellnessTotalScore = (w: WellnessEntry): number => {
    if (typeof w.wellnessTotal === 'number') return w.wellnessTotal;
    return (
      (w.sleepQuality || 0) +
      (w.sleepDuration || 0) +
      (w.mood || 0) +
      (w.stress || 0) +
      (w.fatigue || 0) +
      (w.soreness || 0) +
      (w.heavyLegs || 0)
    );
  };

  const renderWellnessTotalBadge = (totalScore: number) => {
    let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    let label = 'Excelente';

    if (totalScore < 16) {
      colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      label = 'Crítico';
    } else if (totalScore < 22) {
      colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      label = 'Atenção';
    } else if (totalScore < 28) {
      colorClasses = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      label = 'Bom';
    }

    return (
      <span className={`inline-flex items-center space-x-1 font-extrabold px-2.5 py-0.5 rounded-full border text-[11px] ${colorClasses}`}>
        <span>{totalScore} / 35</span>
        <span className="opacity-80 text-[10px]">({label})</span>
      </span>
    );
  };

  const renderFatigueBadge = (postFatigue: number) => {
    const label = t.rpe.fatigueDescriptors[postFatigue as keyof typeof t.rpe.fatigueDescriptors] || `${postFatigue}/10`;
    const colorClass =
      postFatigue <= 3
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : postFatigue <= 6
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        : 'bg-rose-500/10 text-rose-400 border-rose-500/30';

    return (
      <span className={`font-extrabold px-2.5 py-0.5 rounded-full border text-[11px] ${colorClass}`}>
        {label}
      </span>
    );
  };

  // Group stats calculations
  const totalSubmissions = wellnessList.length;
  const avgWellnessTotal = totalSubmissions
    ? +(
        wellnessList.reduce((acc, curr) => acc + getWellnessTotalScore(curr), 0) /
        totalSubmissions
      ).toFixed(1)
    : 0;

  // Filtered roster status
  const filteredAthletes = INITIAL_ATHLETES.filter((ath) =>
    ath.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // Wellness KPIs
  const totalWellness = wellnessList.length;
  const lowSleepCount = wellnessList.filter((w) => w.sleepQuality <= 2).length;
  const highStressCount = wellnessList.filter((w) => w.stress <= 2).length;

  // RPE KPIs
  const totalRPE = rpeList.length;
  const avgBorg = totalRPE
    ? +(rpeList.reduce((acc, curr) => acc + curr.physicalDemand, 0) / totalRPE).toFixed(1)
    : 0;
  const avgPostFatigue = totalRPE
    ? +(rpeList.reduce((acc, curr) => acc + curr.postFatigue, 0) / totalRPE).toFixed(1)
    : 0;
  const highBorgCount = rpeList.filter((r) => r.physicalDemand >= 7).length;

  // Hydration KPIs
  const totalHydration = hydrationList.length;
  const avgDehydration = totalHydration
    ? +(hydrationList.reduce((acc, curr) => acc + curr.dehydrationRate, 0) / totalHydration).toFixed(2)
    : 0;
  const alertHydrationCount = hydrationList.filter((h) => h.status === 'Alerta' || h.dehydrationRate > 2.0).length;

  // Helper for muscle fatigue tags
  const renderMuscleFatigueBadges = (map?: Record<string, number>) => {
    if (!map || Object.keys(map).length === 0) {
      return <span className="text-slate-500 italic text-[11px]">Sem zonas ativas</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {Object.entries(map).map(([muscle, score]) => (
          <span
            key={muscle}
            className="inline-flex items-center space-x-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold"
          >
            <span>{muscle}</span>
            <span className="bg-amber-400 text-slate-950 font-black px-1.5 rounded-full text-[9px]">{score}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-bg text-slate-100 p-4 sm:p-6 animate-fade-in">
      <div className="mx-auto max-w-5xl space-y-6 pb-12">
        {/* Admin Header Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-red-900/60 pb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white font-black shadow-lg shadow-red-600/30">
              <Shield className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-tight text-slate-100">
                Gil Vicente FC &bull; Painel da Equipa Técnica
              </h1>
              <p className="text-[11px] font-bold text-red-400">Departamento de Performance & Saúde</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Date Control Bar */}
            <div className="flex items-center space-x-1 rounded-xl border border-slate-700 bg-dark-card p-1">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                title="Dia Anterior"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={setTodayDate}
                className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-extrabold text-slate-200 hover:bg-slate-700"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={setYesterdayDate}
                className="rounded-lg bg-slate-800/60 px-2.5 py-1 text-[11px] font-bold text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              >
                Ontem
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border-0 bg-transparent px-2 py-1 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
              />
              <button
                type="button"
                onClick={() => shiftDate(1)}
                title="Dia Seguinte"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Clear All Data Button */}
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem a certeza de que deseja APAGAR TODOS OS DADOS gravados e começar de raiz a partir de hoje?')) {
                  clearAllHistoricalData();
                  loadAllData();
                  alert('Todos os dados anteriores foram apagados com sucesso. A aplicação está limpa e pronta a ser usada a partir de hoje!');
                }
              }}
              className="flex items-center space-x-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-300 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar Dados Anteriores</span>
            </button>

            {/* Export Excel Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-500/20 transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
              <span>📊 Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-all"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex space-x-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4 text-brand-lime" />
            <span>Info do Treino & Calendário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Resumo Diário do Plantel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collective')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'collective'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Análise Coletiva</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'individual'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <User className="h-4 w-4 text-brand-lime" />
            <span>Análise Individual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fines')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'fines'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Euro className="h-4 w-4 text-amber-400" />
            <span>{t.admin?.fines?.tabFines || 'Contabilização de Multas & Faltas'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pins')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'pins'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Credenciais & Lembretes</span>
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-5">
            {/* Sub-Navigation Pills for Resumo Diário do Plantel */}
            <div className="flex flex-wrap gap-2 bg-dark-card/80 p-2 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSubTab('general')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  subTab === 'general'
                    ? 'bg-slate-100 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-red-500" />
                <span>{t.admin.subTabs.general}</span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('wellness')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  subTab === 'wellness'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <HeartPulse className="h-3.5 w-3.5 text-emerald-400" />
                <span>{t.admin.subTabs.wellness}</span>
                <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-extrabold">
                  {wellnessList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('rpe')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  subTab === 'rpe'
                    ? 'bg-cyan-400 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Dumbbell className="h-3.5 w-3.5 text-cyan-400" />
                <span>{t.admin.subTabs.rpe}</span>
                <span className="ml-1 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] text-cyan-300 font-extrabold">
                  {rpeList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSubTab('hydration')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  subTab === 'hydration'
                    ? 'bg-blue-500 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Droplets className="h-3.5 w-3.5 text-blue-400" />
                <span>{t.admin.subTabs.hydration}</span>
                <span className="ml-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-300 font-extrabold">
                  {hydrationList.length}
                </span>
              </button>
            </div>

            {/* SUB-VIEW 1: GENERAL OVERVIEW (SECÇÃO GERAL) */}
            {subTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                {/* Summary Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-dark-card p-3.5 text-center shadow-sm">
                    <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                      <Users className="h-4 w-4 text-red-400" />
                      <span className="text-[11px] font-bold uppercase">Submissões</span>
                    </div>
                    <span className="text-2xl font-black text-slate-100">
                      {totalSubmissions} <span className="text-xs text-slate-500 font-normal">/ {INITIAL_ATHLETES.length}</span>
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-dark-card p-3.5 text-center shadow-sm">
                    <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                      <HeartPulse className="h-4 w-4 text-emerald-400" />
                      <span className="text-[11px] font-bold uppercase">Média Wellness Total</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-400">{avgWellnessTotal || '-'} <span className="text-xs text-slate-500">/ 35</span></span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-dark-card p-3.5 text-center shadow-sm">
                    <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                      <Stethoscope className="h-4 w-4 text-rose-400" />
                      <span className="text-[11px] font-bold uppercase">Fisioterapia</span>
                    </div>
                    <span className={`text-2xl font-black ${physioReferrals.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      {physioReferrals.length}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-dark-card p-3.5 text-center shadow-sm">
                    <div className="flex items-center justify-center space-x-1.5 text-slate-400 mb-1">
                      <Activity className="h-4 w-4 text-cyan-400" />
                      <span className="text-[11px] font-bold uppercase">Média RPE Borg</span>
                    </div>
                    <span className="text-2xl font-black text-cyan-400">{avgBorg || '-'} / 10</span>
                  </div>
                </div>

                {/* Urgent Physio Referrals Box */}
                {physioReferrals.length > 0 && (
                  <div className="space-y-3 rounded-2xl border border-rose-500/50 bg-rose-950/20 p-4 shadow-xl">
                    <div className="flex items-center space-x-2 text-rose-400">
                      <Stethoscope className="h-5 w-5" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider">
                        Jogadoras que Pediram Fisioterapia Antes do Treino ({physioReferrals.length})
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {physioReferrals.map((item) => (
                        <div key={item.id} className="rounded-xl border border-rose-500/30 bg-dark-card p-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-slate-100 text-sm">{item.athleteName}</span>
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                              FISIO REQUERIDA
                            </span>
                          </div>
                          <p className="text-xs text-rose-200 font-medium">
                            <span className="font-bold text-slate-400">Motivo:</span> {item.physioReason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consolidated Master Table */}
                <div className="space-y-4 rounded-2xl border border-dark-border bg-dark-card p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase">Visão Geral do Plantel ({selectedDate})</h3>
                      <p className="text-xs text-slate-400">Estado resumido consolidado de todos os formulários.</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filtrar jogadora..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-extrabold">
                          <th className="py-2.5 px-3">Atleta</th>
                          <th className="py-2.5 px-3">Questionário Wellness</th>
                          <th className="py-2.5 px-3">Wellness Total</th>
                          <th className="py-2.5 px-3">Questionário PSE</th>
                          <th className="py-2.5 px-3">Fadiga Após Treino</th>
                          <th className="py-2.5 px-3 text-right">Fisioterapia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredAthletes.map((ath) => {
                          const name = ath.name;
                          const wellness = wellnessList.find((w) => w.athleteName === name);
                          const rpe = rpeList.find((r) => r.athleteName === name);

                          return (
                            <tr key={name} className="hover:bg-slate-800/40">
                              {/* 1. Atleta */}
                              <td className="py-3 px-3 font-bold text-slate-100">{name}</td>

                              {/* 2. Questionário Wellness Status */}
                              <td className="py-3 px-3">
                                {wellness ? (
                                  <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Preenchido</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Pendente</span>
                                )}
                              </td>

                              {/* 3. Wellness Total Score */}
                              <td className="py-3 px-3">
                                {wellness ? (
                                  renderWellnessTotalBadge(getWellnessTotalScore(wellness))
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              {/* 4. Questionário PSE Status */}
                              <td className="py-3 px-3">
                                {rpe ? (
                                  <span className="inline-flex items-center space-x-1 text-cyan-400 font-bold">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    <span>Preenchido</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Pendente</span>
                                )}
                              </td>

                              {/* 5. Fadiga Após Treino */}
                              <td className="py-3 px-3">
                                {rpe ? (
                                  renderFatigueBadge(rpe.postFatigue)
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              {/* 6. Fisioterapia */}
                              <td className="py-3 px-3 text-right">
                                {wellness?.needsPhysio ? (
                                  <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                                    SIM
                                  </span>
                                ) : (
                                  <span className="text-slate-500">Não</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-VIEW 2: DEDICATED WELLNESS PAGE */}
            {subTab === 'wellness' && (
              <div className="space-y-6 animate-fade-in">
                {/* Wellness KPI Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 text-center shadow-sm">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase block">Submissões Wellness</span>
                    <span className="text-2xl font-black text-slate-100">{totalWellness} <span className="text-xs text-slate-500">/ {INITIAL_ATHLETES.length}</span></span>
                  </div>

                  <div className="rounded-xl border border-brand-lime/30 bg-lime-950/20 p-3.5 text-center shadow-sm">
                    <span className="text-[11px] font-bold text-brand-lime uppercase block">Média Wellness Total</span>
                    <span className="text-2xl font-black text-brand-lime">{avgWellnessTotal || '-'} <span className="text-xs text-slate-500">/ 35</span></span>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-center shadow-sm">
                    <span className="text-[11px] font-bold text-rose-400 uppercase block">Pedidos Fisio</span>
                    <span className={`text-2xl font-black ${physioReferrals.length > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      {physioReferrals.length}
                    </span>
                  </div>
                </div>

                {/* Wellness Table View */}
                <div className="space-y-4 rounded-2xl border border-emerald-500/30 bg-dark-card p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                        <HeartPulse className="h-4 w-4 text-emerald-400" />
                        <span>Relatório Detalhado de Wellness Pré-Treino ({selectedDate})</span>
                      </h3>
                      <p className="text-xs text-slate-400">Dados individuais de estado físico, mental e cálculo do Wellness Total (7 a 35).</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogadora..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {wellnessList.length === 0 ? (
                    <div className="rounded-xl bg-dark-bg/60 p-8 text-center border border-slate-800 space-y-2">
                      <HeartPulse className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Nenhum questionário Wellness registado para {selectedDate}.</p>
                      <p className="text-[11px] text-slate-500">As jogadoras podem preencher o formulário no tab "Wellness Pré-Treino".</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-extrabold">
                            <th className="py-2.5 px-3">Atleta</th>
                            <th className="py-2.5 px-3">Wellness Total</th>
                            <th className="py-2.5 px-3">Ciclo Menstrual</th>
                            <th className="py-2.5 px-3 text-center">Sono (Qual/Dur)</th>
                            <th className="py-2.5 px-3 text-center">Humor</th>
                            <th className="py-2.5 px-3 text-center">Stress</th>
                            <th className="py-2.5 px-3 text-center">Fadiga</th>
                            <th className="py-2.5 px-3 text-center">Desconforto</th>
                            <th className="py-2.5 px-3">Zonas c/ Dor</th>
                            <th className="py-2.5 px-3 text-right">Fisioterapia</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {wellnessList
                            .filter((w) => w.athleteName.toLowerCase().includes(searchFilter.toLowerCase()))
                            .map((w) => {
                              const score = getWellnessTotalScore(w);
                              return (
                                <tr key={w.id} className="hover:bg-slate-800/40">
                                  <td className="py-3 px-3 font-bold text-slate-100">{w.athleteName}</td>
                                  
                                  <td className="py-3 px-3">
                                    {renderWellnessTotalBadge(score)}
                                  </td>

                                  <td className="py-3 px-3 text-slate-300">{w.menstrualCycle}</td>

                                  <td className="py-3 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${w.sleepQuality <= 2 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-indigo-300'}`}>
                                      Q:{w.sleepQuality} | D:{w.sleepDuration}
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-center text-slate-200">{w.mood}/5</td>

                                  <td className="py-3 px-3 text-center">
                                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${w.stress <= 2 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-200'}`}>
                                      {w.stress}/5
                                    </span>
                                  </td>

                                  <td className="py-3 px-3 text-center text-slate-200">{w.fatigue}/5</td>
                                  <td className="py-3 px-3 text-center text-slate-200">{w.soreness}/5</td>

                                  <td className="py-3 px-3">
                                    {renderMuscleFatigueBadges(w.muscleFatigue)}
                                  </td>

                                  <td className="py-3 px-3 text-right">
                                    {w.needsPhysio ? (
                                      <div className="text-right">
                                        <span className="font-extrabold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 text-[10px]">
                                          SIM
                                        </span>
                                        {w.physioReason && (
                                          <p className="text-[10px] text-rose-300 mt-0.5 truncate max-w-[140px] inline-block">{w.physioReason}</p>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-[11px]">Não</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Squad Muscle Heatmap Body Chart */}
                <SquadMuscleHeatmap
                  entries={wellnessList.filter((w) => w.date === selectedDate)}
                  date={selectedDate}
                  title="Mapa Coletivo de Queixas Musculares no Plantel (Wellness)"
                />
              </div>
            )}

            {/* SUB-VIEW 3: DEDICATED PSE / RPE PAGE */}
            {subTab === 'rpe' && (
              <div className="space-y-6 animate-fade-in">
                {/* RPE KPI Header Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase block">Total PSE Submetidos</span>
                    <span className="text-2xl font-black text-slate-100">{totalRPE} <span className="text-xs text-slate-500">/ {INITIAL_ATHLETES.length}</span></span>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-amber-400 uppercase block">Média Borg CR10</span>
                    <span className="text-2xl font-black text-amber-300">{avgBorg || '-'} / 10</span>
                  </div>

                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-indigo-400 uppercase block">Média Fadiga Pós-Treino</span>
                    <span className="text-2xl font-black text-indigo-300">{avgPostFatigue || '-'} / 10</span>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-rose-400 uppercase block">Carga Elevada (&ge; 7)</span>
                    <span className={`text-2xl font-black ${highBorgCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      {highBorgCount}
                    </span>
                  </div>
                </div>

                {/* RPE Table View */}
                <div className="space-y-4 rounded-2xl border border-cyan-500/30 bg-dark-card p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                        <Dumbbell className="h-4 w-4 text-cyan-400" />
                        <span>Relatório Detalhado de PSE Pós-Treino ({selectedDate})</span>
                      </h3>
                      <p className="text-xs text-slate-400">Intensidade Borg CR10, fadiga pós-treino, trabalho prévio e mapas de fadiga muscular.</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogadora..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {rpeList.length === 0 ? (
                    <div className="rounded-xl bg-dark-bg/60 p-8 text-center border border-slate-800 space-y-2">
                      <Dumbbell className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Nenhum registo de PSE submetido para {selectedDate}.</p>
                      <p className="text-[11px] text-slate-500">As jogadoras podem registar a carga no tab "PSE Pós-Treino".</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-extrabold">
                            <th className="py-2.5 px-3">Atleta</th>
                            <th className="py-2.5 px-3">Exigência Física (Borg)</th>
                            <th className="py-2.5 px-3">Fadiga Pós-Treino</th>
                            <th className="py-2.5 px-3">Trabalho Prévio</th>
                            <th className="py-2.5 px-3">Zonas c/ Dor (Body Chart)</th>
                            <th className="py-2.5 px-3">Comentários</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {rpeList
                            .filter((r) => r.athleteName.toLowerCase().includes(searchFilter.toLowerCase()))
                            .map((r) => {
                              const borgObj = BORG_SCALE.find((b) => b.value === r.physicalDemand);
                              const borgLabel = t.rpe.borgDescriptors[r.physicalDemand as keyof typeof t.rpe.borgDescriptors] || borgObj?.label;
                              const fatigueLabel = t.rpe.fatigueDescriptors[r.postFatigue as keyof typeof t.rpe.fatigueDescriptors];

                              return (
                                <tr key={r.id} className="hover:bg-slate-800/40">
                                  <td className="py-3 px-3 font-bold text-slate-100">{r.athleteName}</td>

                                  {/* Borg score */}
                                  <td className="py-3 px-3">
                                    <span className="font-extrabold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/30 text-[11px]">
                                      {borgLabel}
                                    </span>
                                  </td>

                                  {/* Post fatigue */}
                                  <td className="py-3 px-3">
                                    <span className="font-extrabold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 text-[11px]">
                                      {fatigueLabel}
                                    </span>
                                  </td>

                                  {/* Pre workout tags */}
                                  <td className="py-3 px-3">
                                    <div className="flex flex-wrap gap-1">
                                      {r.preWorkoutPlans.map((tag) => (
                                        <span key={tag} className="bg-slate-800 text-brand-lime px-2 py-0.5 rounded text-[10px] font-bold border border-slate-700">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </td>

                                  {/* Body chart muscle fatigue */}
                                  <td className="py-3 px-3">
                                    {renderMuscleFatigueBadges(r.muscleFatigue)}
                                  </td>

                                  {/* Comments */}
                                  <td className="py-3 px-3 text-slate-300 max-w-xs truncate">
                                    {r.comments ? (
                                      <span className="text-slate-200 italic">{r.comments}</span>
                                    ) : (
                                      <span className="text-slate-600">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Squad Muscle Heatmap Body Chart */}
                <SquadMuscleHeatmap
                  entries={rpeList.filter((r) => r.date === selectedDate)}
                  date={selectedDate}
                  title="Mapa Coletivo de Queixas Musculares no Plantel (PSE Pós-Treino)"
                />
              </div>
            )}

            {/* SUB-VIEW 4: DEDICATED HYDRATION PAGE */}
            {subTab === 'hydration' && (
              <div className="space-y-6 animate-fade-in">
                {/* Hydration KPI Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-blue-400 uppercase block">Atletas Registadas</span>
                    <span className="text-2xl font-black text-slate-100">{totalHydration} <span className="text-xs text-slate-500">/ {INITIAL_ATHLETES.length}</span></span>
                  </div>

                  <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-cyan-400 uppercase block">Taxa Média Desidratação</span>
                    <span className="text-2xl font-black text-cyan-300">{avgDehydration}%</span>
                  </div>

                  <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3.5 text-center">
                    <span className="text-[11px] font-bold text-rose-400 uppercase block">Alerta (&gt; 2.0%)</span>
                    <span className={`text-2xl font-black ${alertHydrationCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
                      {alertHydrationCount}
                    </span>
                  </div>
                </div>

                {/* Hydration Table View */}
                <div className="space-y-4 rounded-2xl border border-blue-500/30 bg-dark-card p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                        <Droplets className="h-4 w-4 text-blue-400" />
                        <span>Relatório Detalhado de Hidratação ({selectedDate})</span>
                      </h3>
                      <p className="text-xs text-slate-400">Variação de peso pré e pós-treino, taxa de desidratação e volume de reposição obrigatória.</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogadora..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {hydrationList.length === 0 ? (
                    <div className="rounded-xl bg-dark-bg/60 p-8 text-center border border-slate-800 space-y-2">
                      <Droplets className="h-8 w-8 text-slate-600 mx-auto" />
                      <p className="text-xs font-bold text-slate-400">Nenhum registo de Hidratação registado para {selectedDate}.</p>
                      <p className="text-[11px] text-slate-500">Os dados são sincronizados automaticamente a partir da folha Google Sheets ou registados no tab "Hidratação".</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-extrabold">
                            <th className="py-2.5 px-3">Atleta</th>
                            <th className="py-2.5 px-3">Peso Pré (kg)</th>
                            <th className="py-2.5 px-3">Peso Pós (kg)</th>
                            <th className="py-2.5 px-3">Perda Líquida</th>
                            <th className="py-2.5 px-3">Ingestão Líquidos</th>
                            <th className="py-2.5 px-3">Taxa Desidratação</th>
                            <th className="py-2.5 px-3">Estado</th>
                            <th className="py-2.5 px-3 font-extrabold">Reposição Obrigatória</th>
                            <th className="py-2.5 px-3 text-center font-extrabold">Ações Admin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {hydrationList
                            .filter((h) => h.athleteName.toLowerCase().includes(searchFilter.toLowerCase()))
                            .map((h) => (
                              <tr key={h.id} className="hover:bg-slate-800/40">
                                <td className="py-3 px-3 font-bold text-slate-100">{h.athleteName}</td>
                                <td className="py-3 px-3 text-slate-300">{h.preWeight} kg</td>
                                <td className="py-3 px-3 text-slate-300">{h.postWeight} kg</td>
                                <td className="py-3 px-3 font-bold text-amber-400">-{h.weightLoss} kg</td>
                                <td className="py-3 px-3 text-slate-300">{h.fluidsIntake} L</td>

                                <td className="py-3 px-3 font-black text-slate-100">
                                  {h.dehydrationRate}%
                                </td>

                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                      h.status === 'Adequada'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : h.status === 'Atenção'
                                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                    }`}
                                  >
                                    {h.status}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right font-black text-cyan-300">
                                  +{h.refillNeededLiters} L
                                </td>

                                <td className="py-3 px-3 text-center">
                                  <div className="flex items-center justify-center space-x-1">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditHydration(h)}
                                      title="Editar Registos"
                                      className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/20 transition-all"
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteHydration(h.id)}
                                      title="Apagar Registo"
                                      className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/20 transition-all"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Admin Edit Hydration Modal */}
                {editingHydrationEntry && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <form onSubmit={handleSaveEditedHydration} className="w-full max-w-md space-y-4 rounded-2xl border border-cyan-500/50 bg-dark-card p-6 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center space-x-2 text-cyan-400 font-extrabold text-sm uppercase">
                          <Pencil className="h-4 w-4" />
                          <span>Editar Hidratação — {editingHydrationEntry.athleteName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingHydrationEntry(null)}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-800"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-300 mb-1">Peso Pré-Treino (kg)</label>
                          <input
                            type="number"
                            step="0.05"
                            required
                            value={editPreWeight}
                            onChange={(e) => setEditPreWeight(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 font-bold text-slate-100 text-center"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-300 mb-1">Peso Pós-Treino (kg)</label>
                          <input
                            type="number"
                            step="0.05"
                            required
                            value={editPostWeight}
                            onChange={(e) => setEditPostWeight(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 font-bold text-slate-100 text-center"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="block font-bold text-slate-300 mb-1">Líquidos Ingeridos (L)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={editFluids}
                          onChange={(e) => setEditFluids(e.target.value)}
                          className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 font-bold text-slate-100 text-center"
                        />
                      </div>

                      <div className="flex space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingHydrationEntry(null)}
                          className="w-1/2 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="w-1/2 rounded-xl bg-cyan-500 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-400"
                        >
                          Guardar Alterações
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'collective' ? (
          <CollectiveSquadView
            wellnessList={allWellnessList}
            rpeList={allRpeList}
            selectedDate={selectedDate}
          />
        ) : activeTab === 'individual' ? (
          <IndividualAthleteView
            wellnessList={allWellnessList}
            rpeList={allRpeList}
            selectedDate={selectedDate}
          />
        ) : activeTab === 'schedule' ? (
          <TrainingSessionManager
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            wellnessList={allWellnessList}
            rpeList={allRpeList}
            hydrationList={allHydrationList}
          />
        ) : activeTab === 'fines' ? (
          <FinesComplianceView
            wellnessList={allWellnessList}
            rpeList={allRpeList}
            hydrationList={allHydrationList}
          />
        ) : (
          /* PIN Management Section */
          <div className="space-y-6 animate-fade-in">
            {pinChangeSuccess && (
              <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>{pinChangeSuccess}</span>
              </div>
            )}

            {/* 1. System Master Accounts PIN Redefinition (Admin & Physio) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Admin PIN Card */}
              <div className="rounded-2xl border border-red-500/30 bg-dark-card p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-100">Palavra-passe da Administração</h4>
                      <p className="text-[10px] text-slate-400">Acesso à Equipa Técnica & Análises</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                    PIN: {currentAdminPinState}
                  </span>
                </div>

                {isEditingAdminPin ? (
                  <form onSubmit={handleSaveAdminPinSubmit} className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nova Palavra-passe / PIN Admin:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newAdminPinInput}
                        onChange={(e) => setNewAdminPinInput(e.target.value)}
                        placeholder="Novo PIN..."
                        autoFocus
                        className="flex-1 rounded-xl border border-red-500 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-500"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingAdminPin(false)}
                        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400"
                      >
                        X
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingAdminPin(true);
                      setNewAdminPinInput(currentAdminPinState);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-dark-bg py-2.5 text-xs font-extrabold text-slate-200 hover:bg-slate-800 hover:text-red-400 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="h-4 w-4 text-red-500" />
                    <span>Redefinir Palavra-passe do Administrador</span>
                  </button>
                )}
              </div>

              {/* Physio PIN Card */}
              <div className="rounded-2xl border border-teal-500/30 bg-dark-card p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-teal-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-100">Palavra-passe da Fisioterapia</h4>
                      <p className="text-[10px] text-teal-400">Gabinete Médico & Hidratação</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                    PIN: {currentPhysioPinState}
                  </span>
                </div>

                {isEditingPhysioPin ? (
                  <form onSubmit={handleSavePhysioPinSubmit} className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-slate-300 block">Nova Palavra-passe / PIN Fisioterapeuta:</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={newPhysioPinInput}
                        onChange={(e) => setNewPhysioPinInput(e.target.value)}
                        placeholder="Novo PIN..."
                        autoFocus
                        className="flex-1 rounded-xl border border-teal-500 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-black text-white hover:bg-teal-500"
                      >
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPhysioPin(false)}
                        className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-400"
                      >
                        X
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPhysioPin(true);
                      setNewPhysioPinInput(currentPhysioPinState);
                    }}
                    className="w-full rounded-xl border border-slate-800 bg-dark-bg py-2.5 text-xs font-extrabold text-slate-200 hover:bg-slate-800 hover:text-teal-400 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="h-4 w-4 text-teal-400" />
                    <span>Redefinir Palavra-passe do Dept. Médico</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. Mobile Notification & Reminders Settings Section */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-dark-card to-dark-card p-4 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100 uppercase">
                      Lembretes & Notificações nos Telemóveis
                    </h3>
                    <p className="text-xs text-slate-400">
                      Configura os alertas automáticos e envia notificações diretas para os smartphones das atletas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSendBroadcastReminder}
                  className="flex items-center justify-center space-x-1.5 bg-amber-500 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black hover:bg-amber-400 shadow-md shadow-amber-500/20 transition-all"
                >
                  <Smartphone className="h-4 w-4" />
                  <span>📢 Enviar Lembrete no Telemóvel</span>
                </button>
              </div>

              {broadcastMessage && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs font-extrabold text-amber-300 animate-fade-in">
                  {broadcastMessage}
                </div>
              )}

              {/* Automatic Trigger Status Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-dark-bg/60 p-3 rounded-xl border border-slate-800 gap-2">
                <div>
                  <span className="text-xs font-extrabold text-slate-200 flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Envio Automático Programado por Horário</span>
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Os telemóveis das jogadoras receberão a notificação automaticamente assim que o horário configurado for atingido.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateReminderConfig({ enabled: !reminderConfig.enabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all shrink-0 ${
                    reminderConfig.enabled
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {reminderConfig.enabled ? '🟢 Automático Ativo' : '⚪ Desativado'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                {/* Wellness Time Setting */}
                <div className="space-y-1 bg-dark-bg/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">Lembrete Wellness:</span>
                  <input
                    type="time"
                    value={reminderConfig.wellnessTime}
                    onChange={(e) => handleUpdateReminderConfig({ wellnessTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* RPE Time Setting */}
                <div className="space-y-1 bg-dark-bg/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">Lembrete PSE (RPE):</span>
                  <input
                    type="time"
                    value={reminderConfig.rpeTime}
                    onChange={(e) => handleUpdateReminderConfig({ rpeTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Pre-Training Weigh-In Time Setting */}
                <div className="space-y-1 bg-dark-bg/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">Pesagem Pré-Treino:</span>
                  <input
                    type="time"
                    value={reminderConfig.preHydrationTime}
                    onChange={(e) => handleUpdateReminderConfig({ preHydrationTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {/* Post-Training Weigh-In Time Setting */}
                <div className="space-y-1 bg-dark-bg/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">Pesagem Pós-Treino:</span>
                  <input
                    type="time"
                    value={reminderConfig.postHydrationTime}
                    onChange={(e) => handleUpdateReminderConfig({ postHydrationTime: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Athlete Direct Access Status Notice */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 shadow-lg">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-xs font-black uppercase text-emerald-300">
                    Acesso das Jogadoras Sem PIN (Desativado)
                  </h3>
                  <p className="text-xs text-slate-300">
                    As jogadoras podem selecionar o seu perfil e responder aos questionários diretamente, sem necessidade de introduzir qualquer PIN de verificação.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPORT DATA MODAL */}
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-dark-card p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-100">Exportar Dados para Excel</h3>
                    <p className="text-[11px] text-slate-400">Gera ficheiro Excel (.csv / .xlsx) formatado</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 1. Seleção por Tipo de Questionário / Dados */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-300 block">
                    1. Selecionar Questionário / Dados a Exportar
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportDataType('ALL')}
                      className={`p-3 text-left rounded-xl border transition-all text-xs font-bold ${
                        exportDataType === 'ALL'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <span>📁 Todos os Dados</span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">Wellness, PSE e Hidratação integrados</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportDataType('WELLNESS')}
                      className={`p-3 text-left rounded-xl border transition-all text-xs font-bold ${
                        exportDataType === 'WELLNESS'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <span>🧘 Questionário Wellness</span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">Sono, humor, stress, fadiga e dores</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportDataType('RPE')}
                      className={`p-3 text-left rounded-xl border transition-all text-xs font-bold ${
                        exportDataType === 'RPE'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <span>⚡ Questionário PSE / RPE</span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">Borg CR10, sRPE, duração e fadiga</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportDataType('HYDRATION')}
                      className={`p-3 text-left rounded-xl border transition-all text-xs font-bold ${
                        exportDataType === 'HYDRATION'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <span>💧 Pesagem & Hidratação</span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">Pesos pré/pós, perda kg e reposição</p>
                    </button>
                  </div>
                </div>

                {/* 2. Seleção por Jogadora */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-300 block">
                    2. Filtrar por Jogadora / Atleta
                  </label>
                  <select
                    value={exportAthleteId}
                    onChange={(e) => setExportAthleteId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-bold text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">📋 Todas as Jogadoras (Plantel Completo)</option>
                    {INITIAL_ATHLETES.map((ath) => (
                      <option key={ath.id} value={ath.name}>
                        👤 {ath.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-dark-bg px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleExecuteExport}
                  className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all"
                >
                  <Download className="h-4 w-4 stroke-[2.5]" />
                  <span>Descarregar Excel (.csv)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
