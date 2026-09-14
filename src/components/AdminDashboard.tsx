'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, Athlete, AthletePosition } from '@/lib/types';
import { INITIAL_ATHLETES, BORG_SCALE, calculateHydrationStatus } from '@/lib/data';
import { getWellnessLocally, getRPELocally, getHydrationLocally, getAthletePin, setAthletePin, getAthleteAvatar, saveBulkGsheetsData, deleteHydrationLocally, updateHydrationLocally, clearAllHistoricalData, clearSelectiveHistoricalData, getAdminPin, setAdminPin as saveAdminPinToStorage, getPhysioPin, setPhysioPin as savePhysioPinToStorage, getClubActivationCode, setClubActivationCode as saveClubActivationCodeToStorage, getDynamicAthletes, saveAthleteProfile, addNewAthlete, deleteAthlete, compressImageFile, setAthleteActiveStatus, setAllAthletesActive, syncAllDataFromCloud } from '@/lib/storage';
import { exportWellnessToExcel, exportRPEToExcel, exportHydrationToExcel, exportWeightToExcel, exportAllDataToExcel } from '@/lib/exportUtils';
import { getStoredReminderConfig, saveReminderConfig, requestNotificationPermission, getNotificationPermission, sendMobileNotification, getPendingQuestionnairesStatus, ReminderConfig } from '@/lib/reminderUtils';
import { useLanguage } from '@/context/LanguageContext';
import { secureFetch } from '@/lib/authGuard';
import { translateTextToPortuguese, normalizeMenstrualCycleToPortuguese, normalizeHydrationStatusToPortuguese } from '@/lib/translationUtils';
import { IndividualAthleteView } from './IndividualAthleteView';
import { FinesComplianceView } from './FinesComplianceView';
import { CollectiveSquadView } from './CollectiveSquadView';
import { TrainingSessionManager } from './TrainingSessionManager';
import { SquadMuscleHeatmap } from './SquadMuscleHeatmap';
import { MatchDashboard } from './MatchDashboard';
import {
  Shield, Users, Stethoscope, Activity, Search, Lock, X, KeyRound,
  CheckCircle2, LayoutGrid, HeartPulse, Dumbbell, Droplets, AlertTriangle,
  MessageSquare, Tag, Info, AlertCircle, ArrowUpRight, User, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Sparkles, Euro, Trash2, Pencil,
  Download, FileSpreadsheet, FileText, Bell, BellRing, Send, Smartphone, Scale, Plus, Camera, Copy, Check, Trophy
} from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAthleteSelector?: () => void;
}

const getTodayLocalDateStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getYesterdayLocalDateStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose, onOpenAthleteSelector }) => {
  const { t, language } = useLanguage();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('femperf_admin_auth') === 'true';
    }
    return false;
  });
  const [adminLoginPin, setAdminLoginPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  const [wellnessList, setWellnessList] = useState<WellnessEntry[]>([]);
  const [rpeList, setRpeList] = useState<RPEEntry[]>([]);
  const [hydrationList, setHydrationList] = useState<HydrationEntry[]>([]);

  const [allWellnessList, setAllWellnessList] = useState<WellnessEntry[]>([]);
  const [allRpeList, setAllRpeList] = useState<RPEEntry[]>([]);
  const [allHydrationList, setAllHydrationList] = useState<HydrationEntry[]>([]);
  const [athletesList, setAthletesList] = useState<Athlete[]>(() => getDynamicAthletes(true));

  const [selectedDate, setSelectedDateState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('femperf_admin_selected_date') || getTodayLocalDateStr();
    }
    return getTodayLocalDateStr();
  });

  const loadAllData = (targetDate: string = selectedDate) => {
    const wLoc = getWellnessLocally();
    const rLoc = getRPELocally();
    const hLoc = getHydrationLocally();

    setAllWellnessList([...wLoc]);
    setAllRpeList([...rLoc]);
    setAllHydrationList([...hLoc]);

    const wSel = wLoc.filter((e) => e.date === targetDate);
    const rSel = rLoc.filter((e) => e.date === targetDate);
    const hSel = hLoc.filter((e) => e.date === targetDate);

    setWellnessList(wSel);
    setRpeList(rSel);
    setHydrationList(hSel);
  };

  const setSelectedDate = (date: string) => {
    setSelectedDateState(date);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_selected_date', date);
    }
    loadAllData(date);
    syncAllDataFromCloud();
  };

  const [searchFilter, setSearchFilter] = useState<string>('');

  const [activeTab, setActiveTabState] = useState<'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins' | 'matchReport'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_admin_active_tab') as any) || 'schedule';
    }
    return 'schedule';
  });

  const setActiveTab = (tab: 'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins' | 'matchReport') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_active_tab', tab);
    }
  };

  const [subTab, setSubTabState] = useState<'general' | 'wellness' | 'rpe' | 'hydration' | 'weight'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_admin_sub_tab') as any) || 'general';
    }
    return 'general';
  });

  const setSubTab = (tab: 'general' | 'wellness' | 'rpe' | 'hydration' | 'weight') => {
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
  const [exportDataType, setExportDataType] = useState<'ALL' | 'WELLNESS' | 'RPE' | 'HYDRATION' | 'WEIGHT'>('ALL');
  const [exportAthleteId, setExportAthleteId] = useState<string>('ALL');

  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [clearDays, setClearDays] = useState<string>('7');
  const [clearMenus, setClearMenus] = useState<string[]>(['wellness', 'rpe', 'hydration', 'training']);
  const [isClearingData, setIsClearingData] = useState<boolean>(false);

  const handleExecuteClearData = async () => {
    if (clearMenus.length === 0) {
      alert('Selecione pelo menos um menu / categoria de dados a apagar.');
      return;
    }

    const periodLabel =
      clearDays === 'all'
        ? 'TODO O HISTÓRICO'
        : clearDays === '1'
        ? 'o ÚLTIMO 1 DIA'
        : `os ÚLTIMOS ${clearDays} DIAS`;

    const menuLabels = clearMenus
      .map((m) => {
        if (m === 'wellness') return 'Wellness';
        if (m === 'rpe') return 'RPE';
        if (m === 'hydration') return 'Hidratação';
        if (m === 'training') return 'Treinos/Calendário';
        return m;
      })
      .join(', ');

    if (
      !confirm(
        `Tem a certeza de que deseja apagar os registos de [${menuLabels}] referentes a [${periodLabel}]? Esta ação não pode ser desfeita.`
      )
    ) {
      return;
    }

    setIsClearingData(true);
    try {
      await secureFetch('/api/sync-sheets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: clearDays, menus: clearMenus }),
      });
    } catch (e) {
      console.error('Erro ao apagar dados no servidor:', e);
    }

    clearSelectiveHistoricalData(clearDays, clearMenus);
    loadAllData();
    setIsClearingData(false);
    setIsClearModalOpen(false);
    alert(`Registos de [${menuLabels}] para [${periodLabel}] apagados com sucesso!`);
  };

  const [reminderConfig, setReminderConfig] = useState<ReminderConfig>(getStoredReminderConfig());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [forceBroadcast, setForceBroadcast] = useState<boolean>(false);
  const [activeSubscribers, setActiveSubscribers] = useState<any[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState<boolean>(false);

  const fetchActiveSubscribers = async () => {
    setIsLoadingSubscribers(true);
    try {
      const res = await secureFetch('/api/notifications/subscribe');
      const data = await res.json();
      if (data.subscriptions) {
        setActiveSubscribers(data.subscriptions);
      }
    } catch {} finally {
      setIsLoadingSubscribers(false);
    }
  };

  const handleClearAllSubscribers = async () => {
    if (!confirm('Tem a certeza que deseja remover todos os dispositivos registados para notificações?')) return;
    setIsLoadingSubscribers(true);
    try {
      const res = await secureFetch('/api/notifications/subscribe?all=1', { method: 'DELETE' });
      if (res.ok) {
        setActiveSubscribers([]);
        setPinChangeSuccess('Todos os dispositivos registados foram removidos com sucesso.');
        setTimeout(() => setPinChangeSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  const handleRemoveSubscriber = async (endpoint: string, deviceName: string) => {
    if (!confirm(`Deseja remover o dispositivo "${deviceName}"?`)) return;
    setIsLoadingSubscribers(true);
    try {
      const res = await secureFetch(`/api/notifications/subscribe?endpoint=${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchActiveSubscribers();
        setPinChangeSuccess(`Dispositivo "${deviceName}" removido com sucesso.`);
        setTimeout(() => setPinChangeSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
    if (isOpen && isAuthenticated) {
      fetchActiveSubscribers();
      const interval = setInterval(fetchActiveSubscribers, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isAuthenticated]);

  const handleUpdateReminderConfig = (updated: Partial<ReminderConfig>) => {
    const newCfg = { ...reminderConfig, ...updated };
    setReminderConfig(newCfg);
    saveReminderConfig(newCfg);
  };

  const handleSendBroadcastReminder = async (slot: string = 'all', force?: boolean) => {
    const shouldForce = force !== undefined ? force : forceBroadcast;
    setIsSendingBroadcast(true);
    try {
      const url = `/api/notifications/send-scheduled?slot=${slot}${shouldForce ? '&force=true' : ''}`;
      const res = await secureFetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setBroadcastMessage(
          `📢 Push (${data.category || 'Todos'}) enviado com sucesso! ${data.sent} entregue(s)${
            data.skippedAlreadyCompleted ? ` • ${data.skippedAlreadyCompleted} ignorado(s) por já terem respondido hoje` : ''
          }${data.failed ? ` • ${data.failed} falha(s)` : ''}.`
        );
      } else {
        setBroadcastMessage(`⚠️ ${data.error || data.message || 'Nenhum dispositivo registado para Web Push.'}`);
      }
    } catch (e: any) {
      setBroadcastMessage(`⚠️ Erro ao enviar Push: ${e?.message || 'Falha no servidor.'}`);
    } finally {
      setIsSendingBroadcast(false);
    }
    loadAllPins();
    setTimeout(() => setBroadcastMessage(null), 6000);
  };

  const handleExecuteExport = () => {
    const selectedAthleteObj = athletesList.find((a) => a.id === exportAthleteId);
    const athleteFilterName = exportAthleteId === 'ALL' ? undefined : (selectedAthleteObj?.name || exportAthleteId);

    if (exportDataType === 'WELLNESS') {
      exportWellnessToExcel(allWellnessList, athleteFilterName);
    } else if (exportDataType === 'RPE') {
      exportRPEToExcel(allRpeList, athleteFilterName);
    } else if (exportDataType === 'HYDRATION') {
      exportHydrationToExcel(allHydrationList, athleteFilterName);
    } else if (exportDataType === 'WEIGHT') {
      exportWeightToExcel(allHydrationList, athleteFilterName);
    } else {
      exportAllDataToExcel(allWellnessList, allRpeList, allHydrationList, athleteFilterName);
    }

    setIsExportModalOpen(false);
  };

  const handleDeleteHydration = async (id: string) => {
    if (confirm('Tem a certeza que deseja apagar este registo de hidratação?')) {
      deleteHydrationLocally(id);
      try {
        await secureFetch(`/api/hydration?id=${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Erro ao apagar registo no servidor:', e);
      }
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

  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      syncAllDataFromCloud();
      loadAllData(selectedDate);
      loadAllPins();

      const handleDataUpdate = () => {
        loadAllData(selectedDate);
      };

      const handleCredsUpdate = () => {
        loadAllPins();
        setAthletesList(getDynamicAthletes(true));
        loadAllData(selectedDate);
      };

      window.addEventListener('femperf_data_updated', handleDataUpdate);
      window.addEventListener('femperf_credentials_updated', handleCredsUpdate);
      return () => {
        window.removeEventListener('femperf_data_updated', handleDataUpdate);
        window.removeEventListener('femperf_credentials_updated', handleCredsUpdate);
      };
    }
  }, [isOpen, isAuthenticated, selectedDate]);

  const handleManualSyncCloudData = () => {
    setIsSyncingCloud(true);
    syncAllDataFromCloud();
    setTimeout(() => {
      loadAllData(selectedDate);
      loadAllPins();
      setIsSyncingCloud(false);
    }, 1200);
  };

  // Compute weight statistics for weight management sub-tab
  const weightAnalytics = useMemo(() => {
    const allHydration = allHydrationList;
    const monthPrefix = selectedDate.substring(0, 7);

    const initialWeights: number[] = [];
    const lastWeights: number[] = [];
    const preWeightsToday: number[] = [];

    athletesList.forEach((ath) => {
      const monthEntries = allHydration
        .filter(
          (h) =>
            h.athleteName.toLowerCase() === ath.name.toLowerCase() &&
            h.date.startsWith(monthPrefix)
        )
        .sort((a, b) => a.date.localeCompare(b.date));

      const todayEntry = hydrationList.find(
        (h) => h.athleteName.toLowerCase() === ath.name.toLowerCase()
      );

      if (monthEntries.length > 0) {
        const fw = monthEntries[0].preWeight || monthEntries[0].postWeight;
        const lw = monthEntries[monthEntries.length - 1].postWeight || monthEntries[monthEntries.length - 1].preWeight;
        if (fw) initialWeights.push(fw);
        if (lw) lastWeights.push(lw);
      }

      if (todayEntry && todayEntry.preWeight > 0) {
        preWeightsToday.push(todayEntry.preWeight);
      }
    });

    const avgFirstMonthWeight = initialWeights.length
      ? +(initialWeights.reduce((a, b) => a + b, 0) / initialWeights.length).toFixed(1)
      : null;

    const avgLastMonthWeight = lastWeights.length
      ? +(lastWeights.reduce((a, b) => a + b, 0) / lastWeights.length).toFixed(1)
      : null;

    const avgPreWeightToday = preWeightsToday.length
      ? +(preWeightsToday.reduce((a, b) => a + b, 0) / preWeightsToday.length).toFixed(1)
      : null;

    return { avgFirstMonthWeight, avgLastMonthWeight, avgPreWeightToday };
  }, [selectedDate, hydrationList, athletesList, allHydrationList]);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const shiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return;
    const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const setTodayDate = () => {
    setSelectedDate(getTodayLocalDateStr());
  };

  const setYesterdayDate = () => {
    setSelectedDate(getYesterdayLocalDateStr());
  };

  const handleSyncGsheets = async (isSilent = false) => {
    if (!isSilent) {
      setIsSyncing(true);
      setSyncStatus(null);
    }
    try {
      const res = await secureFetch('/api/sync-sheets');
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

  const [currentActivationCodeState, setCurrentActivationCodeState] = useState<string>(getClubActivationCode);
  const [currentAdminPinState, setCurrentAdminPinState] = useState<string>(getAdminPin);
  const [currentPhysioPinState, setCurrentPhysioPinState] = useState<string>(getPhysioPin);

  const [isEditingActivationCode, setIsEditingActivationCode] = useState<boolean>(false);
  const [newActivationCodeInput, setNewActivationCodeInput] = useState<string>('');
  const [copiedCodeToast, setCopiedCodeToast] = useState<boolean>(false);

  const [isEditingAdminPin, setIsEditingAdminPin] = useState<boolean>(false);
  const [newAdminPinInput, setNewAdminPinInput] = useState<string>('');

  const [isEditingPhysioPin, setIsEditingPhysioPin] = useState<boolean>(false);
  const [newPhysioPinInput, setNewPhysioPinInput] = useState<string>('');

  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);

  const handleToggleAthleteActive = (athleteId: string, newActiveState: boolean) => {
    setAthleteActiveStatus(athleteId, newActiveState);
    loadAllPins();
    setPinChangeSuccess(newActiveState ? 'Jogadora ativada no treino com sucesso!' : 'Jogadora ocultada da sessão de hoje com sucesso!');
    setTimeout(() => setPinChangeSuccess(null), 4000);
  };

  const handleActivateAllAthletes = () => {
    setAllAthletesActive();
    loadAllPins();
    setPinChangeSuccess('Todas as jogadoras do plantel foram ativadas no treino!');
    setTimeout(() => setPinChangeSuccess(null), 4000);
  };

  // Modal para adicionar nova jogadora
  const [isAddAthleteModalOpen, setIsAddAthleteModalOpen] = useState<boolean>(false);
  const [newAthleteName, setNewAthleteName] = useState<string>('');
  const [newAthletePosition, setNewAthletePosition] = useState<AthletePosition>('Campo');
  const [newAthletePin, setNewAthletePin] = useState<string>('');
  const [newAthleteAvatar, setNewAthleteAvatar] = useState<string>('');

  // Modal para editar perfil da jogadora
  const [editingAthleteProfile, setEditingAthleteProfile] = useState<Athlete | null>(null);
  const [editProfileName, setEditProfileName] = useState<string>('');
  const [editProfilePosition, setEditProfilePosition] = useState<AthletePosition>('Campo');
  const [editProfileAvatar, setEditProfileAvatar] = useState<string>('');
  const [editProfilePin, setEditProfilePin] = useState<string>('');
  const [athleteToDelete, setAthleteToDelete] = useState<Athlete | null>(null);
  const [isSubmittingAthlete, setIsSubmittingAthlete] = useState<boolean>(false);

  const loadAllPins = () => {
    setCurrentActivationCodeState(getClubActivationCode());
    setCurrentAdminPinState(getAdminPin());
    setCurrentPhysioPinState(getPhysioPin());

    const currentAthletes = getDynamicAthletes(true);
    setAthletesList(currentAthletes);

    const pinsMap: { [athleteId: string]: string | null } = {};
    currentAthletes.forEach((ath) => {
      pinsMap[ath.id] = getAthletePin(ath.id);
    });
    setPinsState(pinsMap);
  };

  const handleAddAthleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newAthleteName.trim().toUpperCase();
    if (cleanName.length > 0) {
      setIsSubmittingAthlete(true);
      try {
        await addNewAthlete(cleanName, newAthletePosition, newAthletePin, newAthleteAvatar);
        loadAllPins();
        setIsAddAthleteModalOpen(false);
        setNewAthleteName('');
        setNewAthletePosition('Campo');
        setNewAthletePin('');
        setNewAthleteAvatar('');
        setPinChangeSuccess(`Jogadora ${cleanName} adicionada com sucesso e guardada permanentemente na nuvem!`);
        setTimeout(() => setPinChangeSuccess(null), 6000);
      } catch (err: any) {
        alert('Erro ao guardar jogadora: ' + (err?.message || 'Falha de comunicação'));
      } finally {
        setIsSubmittingAthlete(false);
      }
    }
  };

  const handleSaveAthleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAthleteProfile && editProfileName.trim().length > 0) {
      const cleanPin = editProfilePin.replace(/\D/g, '').slice(0, 4);
      const cleanName = editProfileName.trim().toUpperCase();
      await saveAthleteProfile(editingAthleteProfile.id, {
        name: cleanName,
        position: editProfilePosition,
        avatarUrl: editProfileAvatar || undefined,
        pin: cleanPin.length > 0 ? cleanPin : undefined,
      });
      loadAllPins();
      setEditingAthleteProfile(null);
      setPinChangeSuccess(`Perfil de ${cleanName} atualizado com sucesso!`);
      setTimeout(() => setPinChangeSuccess(null), 4000);
    }
  };

  const handleDeleteAthleteClick = async (athlete: Athlete) => {
    if (confirm(`Tem a certeza que deseja remover a jogadora ${athlete.name} do plantel?`)) {
      await deleteAthlete(athlete.id);
      loadAllPins();
      setPinChangeSuccess(`Jogadora ${athlete.name} removida do plantel.`);
      setTimeout(() => setPinChangeSuccess(null), 4000);
    }
  };

  const handleAdminPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = getAdminPin();
    const cleanInput = adminLoginPin.trim();
    const activationCode = getClubActivationCode();

    if (cleanInput.toUpperCase() === activationCode.toUpperCase() || cleanInput.toUpperCase() === 'GVFC2026@') {
      setPinError('O Código de Ativação da App não é válido para aceder à Administração. Introduza a Palavra-passe de Administrador.');
      setAdminLoginPin('');
      return;
    }

    if (cleanInput === storedPin.trim()) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('femperf_admin_auth', 'true');
      }
      setPinError('');
    } else {
      setPinError('Palavra-passe / PIN de Administrador incorreto. Tente novamente.');
      setAdminLoginPin('');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('femperf_admin_auth');
      localStorage.removeItem('femperf_active_view_mode');
    }
    setIsAuthenticated(false);
    onClose();
  };

  const handleCopyActivationCode = () => {
    const code = getClubActivationCode();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCodeToast(true);
      setTimeout(() => setCopiedCodeToast(false), 3000);
    }
  };

  const handleSaveActivationCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivationCodeInput.trim().length > 0) {
      saveClubActivationCodeToStorage(newActivationCodeInput.trim().toUpperCase());
      loadAllPins();
      setIsEditingActivationCode(false);
      setNewActivationCodeInput('');
      setPinChangeSuccess('Código de Ativação das Jogadoras redefinido com sucesso!');
      setTimeout(() => setPinChangeSuccess(null), 4000);
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
  const filteredAthletes = athletesList.filter((ath) =>
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
  const completedHydrationList = hydrationList.filter((h) => Number(h.postWeight) > 0);
  const totalHydration = completedHydrationList.length;
  const avgDehydration = totalHydration
    ? +(completedHydrationList.reduce((acc, curr) => acc + curr.dehydrationRate, 0) / totalHydration).toFixed(2)
    : 0;
  const alertHydrationCount = completedHydrationList.filter((h) => h.status === 'Alerta' || h.dehydrationRate > 2.0).length;

  // Helper for monthly weight tracking (1º peso do mês, último peso do mês, peso pré-treino)
  const getAthleteWeightMetrics = (athleteName: string) => {
    const monthPrefix = selectedDate.substring(0, 7); // e.g. "2026-09"
    const allHydration = getHydrationLocally();

    const monthEntries = allHydration
      .filter(
        (h) =>
          h.athleteName.toLowerCase() === athleteName.toLowerCase() &&
          h.date.startsWith(monthPrefix)
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const todayEntry = hydrationList.find(
      (h) => h.athleteName.toLowerCase() === athleteName.toLowerCase()
    );

    const firstEntry = monthEntries.length > 0 ? monthEntries[0] : null;
    const lastEntry = monthEntries.length > 0 ? monthEntries[monthEntries.length - 1] : null;

    const firstWeightMonth = firstEntry ? (firstEntry.preWeight || firstEntry.postWeight) : null;
    const firstWeightDate = firstEntry ? firstEntry.date.split('-').slice(1).reverse().join('/') : null;

    const lastWeightMonth = lastEntry ? (lastEntry.postWeight || lastEntry.preWeight) : null;
    const lastWeightDate = lastEntry ? lastEntry.date.split('-').slice(1).reverse().join('/') : null;

    const preWeightToday = todayEntry ? todayEntry.preWeight : null;
    const postWeightToday = todayEntry ? todayEntry.postWeight : null;

    return {
      preWeightToday,
      postWeightToday,
      firstWeightMonth,
      firstWeightDate,
      lastWeightMonth,
      lastWeightDate,
      todayEntry,
    };
  };

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-bg text-slate-100 p-3 pt-safe sm:p-6 sm:pt-safe animate-fade-in">
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
                className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                  selectedDate === getTodayLocalDateStr()
                    ? 'bg-sky-600 text-white font-black shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 font-bold hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={setYesterdayDate}
                className={`rounded-lg px-2.5 py-1 text-[11px] transition-all ${
                  selectedDate === getYesterdayLocalDateStr()
                    ? 'bg-sky-600 text-white font-black shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 font-bold hover:bg-slate-700 hover:text-slate-200'
                }`}
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

            {/* Sync Cloud Data Button */}
            <button
              type="button"
              onClick={handleManualSyncCloudData}
              disabled={isSyncingCloud}
              className="flex items-center space-x-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-black text-sky-300 hover:bg-sky-500/20 transition-all disabled:opacity-50"
              title="Sincronizar dados em tempo real com o servidor da nuvem"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-sky-400 ${isSyncingCloud ? 'animate-spin' : ''}`} />
              <span>{isSyncingCloud ? 'A Sincronizar...' : 'Sincronizar Nuvem'}</span>
            </button>

            {/* Clear Data Button */}
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-black text-rose-300 hover:bg-rose-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar Dados</span>
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
              onClick={handleLogout}
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
            onClick={() => setActiveTab('matchReport')}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'matchReport'
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Trophy className="h-4 w-4 text-amber-300" />
            <span>⚽ Dashboard Jogos</span>
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
            <KeyRound className="h-4 w-4 text-amber-400" />
            <span>🔑 PINs das Jogadoras & Credenciais</span>
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

              <button
                type="button"
                onClick={() => setSubTab('weight')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${
                  subTab === 'weight'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Scale className="h-3.5 w-3.5 text-amber-400" />
                <span>{t.admin?.subTabs?.weight || 'PESO'}</span>
                <span className="ml-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300 font-extrabold">
                  {athletesList.length}
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
                      {totalSubmissions} <span className="text-xs text-slate-500 font-normal">/ {athletesList.length}</span>
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
                            <span className="font-bold text-slate-400">Motivo:</span> {translateTextToPortuguese(item.physioReason)}
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

                              {/* 5. Questionário Wellness Status */}
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

                              {/* 6. Wellness Total Score */}
                              <td className="py-3 px-3">
                                {wellness ? (
                                  renderWellnessTotalBadge(getWellnessTotalScore(wellness))
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              {/* 7. Questionário PSE Status */}
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

                              {/* 8. Fadiga Após Treino */}
                              <td className="py-3 px-3">
                                {rpe ? (
                                  renderFatigueBadge(rpe.postFatigue)
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              {/* 9. Fisioterapia */}
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
                    <span className="text-2xl font-black text-slate-100">{totalWellness} <span className="text-xs text-slate-500">/ {athletesList.length}</span></span>
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
                                          <p className="text-[10px] text-rose-300 mt-0.5 truncate max-w-[140px] inline-block">{translateTextToPortuguese(w.physioReason)}</p>
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
                    <span className="text-2xl font-black text-slate-100">{totalRPE} <span className="text-xs text-slate-500">/ {athletesList.length}</span></span>
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
                                      <span className="text-slate-200 italic">{translateTextToPortuguese(r.comments)}</span>
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
                    <span className="text-2xl font-black text-slate-100">{totalHydration} <span className="text-xs text-slate-500">/ {athletesList.length}</span></span>
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
                      <p className="text-xs text-slate-400">Consulta de peso pré-treino, peso pós-treino, perda líquida e reposição recomendada.</p>
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
                            <th className="py-2.5 px-3">Peso Pré-Treino (kg)</th>
                            <th className="py-2.5 px-3">Peso Pós-Treino (kg)</th>
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
                            .map((h) => {
                              return (
                                <tr key={h.id} className="hover:bg-slate-800/40">
                                  <td className="py-3 px-3 font-bold text-slate-100">{h.athleteName}</td>
                                  <td className="py-3 px-3">
                                    <span className="font-extrabold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                      {h.preWeight} kg
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-slate-300">
                                    {h.postWeight > 0 ? `${h.postWeight} kg` : '-'}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-amber-400">
                                    {h.postWeight > 0 ? `-${h.weightLoss} kg` : '-'}
                                  </td>
                                  <td className="py-3 px-3 text-slate-300">{h.fluidsIntake} L</td>

                                  <td className="py-3 px-3 font-black text-slate-100">
                                    {h.postWeight > 0 ? `${h.dehydrationRate}%` : '-'}
                                  </td>

                                <td className="py-3 px-3">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                      h.postWeight > 0
                                        ? h.status === 'Adequada'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                          : h.status === 'Atenção'
                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                    }`}
                                  >
                                    {h.postWeight > 0 ? h.status : 'PENDENTE'}
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right font-black text-cyan-300">
                                  {h.postWeight > 0 ? `+${h.refillNeededLiters} L` : '-'}
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
                            );
                          })}
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
                            type="text"
                            inputMode="decimal"
                            required
                            value={editPreWeight}
                            onChange={(e) => setEditPreWeight(e.target.value)}
                            className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 font-bold text-slate-100 text-center"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-300 mb-1">Peso Pós-Treino (kg)</label>
                          <input
                            type="text"
                            inputMode="decimal"
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
                          type="text"
                          inputMode="decimal"
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

            {/* SUB-VIEW 5: WEIGHT CONTROL (ESPAÇO PESO) */}
            {subTab === 'weight' && (
              <div className="space-y-6 animate-fade-in">
                {/* Squad Monthly Weight Averages Banner */}
                <div className="rounded-2xl border border-amber-500/30 bg-amber-950/10 p-4 space-y-3 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-amber-300">
                      <Scale className="h-5 w-5 text-amber-400" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider">
                        Resumo Ponderal do Plantel — Controlo Mensal ({selectedDate.substring(0, 7)})
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">
                      Consulta de Peso Pré-Treino, Peso Pós-Treino, 1º e Último Peso do Mês
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-amber-500/20 bg-dark-card p-3 text-center">
                      <span className="text-[11px] font-bold text-amber-400 uppercase block">1º Peso Registado no Mês (Média)</span>
                      <span className="text-xl font-black text-slate-100">
                        {weightAnalytics.avgFirstMonthWeight ? `${weightAnalytics.avgFirstMonthWeight} kg` : '-'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-cyan-500/20 bg-dark-card p-3 text-center">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase block">Último Peso Registado no Mês (Média)</span>
                      <span className="text-xl font-black text-slate-100">
                        {weightAnalytics.avgLastMonthWeight ? `${weightAnalytics.avgLastMonthWeight} kg` : '-'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-500/20 bg-dark-card p-3 text-center">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase block">Peso Pré-Treino Médio (Hoje)</span>
                      <span className="text-xl font-black text-slate-100">
                        {weightAnalytics.avgPreWeightToday ? `${weightAnalytics.avgPreWeightToday} kg` : '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Roster Weight Table */}
                <div className="space-y-4 rounded-2xl border border-amber-500/30 bg-dark-card p-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                        <Scale className="h-4 w-4 text-amber-400" />
                        <span>Registo de Controlo Ponderal do Plantel ({selectedDate})</span>
                      </h3>
                      <p className="text-xs text-slate-400">Consulta de peso pré-treino, peso pós-treino, 1º/último peso do mês e variação.</p>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Pesquisar jogadora..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-8 pr-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase text-slate-400 font-extrabold">
                          <th className="py-2.5 px-3">Atleta</th>
                          <th className="py-2.5 px-3">Peso Pré-Treino (kg)</th>
                          <th className="py-2.5 px-3">Peso Pós-Treino (kg)</th>
                          <th className="py-2.5 px-3">1º Peso do Mês</th>
                          <th className="py-2.5 px-3">Último Peso do Mês</th>
                          <th className="py-2.5 px-3">Variação Mensal</th>
                          <th className="py-2.5 px-3 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {filteredAthletes.map((ath) => {
                          const name = ath.name;
                          const wMetrics = getAthleteWeightMetrics(name);
                          const diff = (wMetrics.lastWeightMonth && wMetrics.firstWeightMonth)
                            ? +(wMetrics.lastWeightMonth - wMetrics.firstWeightMonth).toFixed(1)
                            : null;

                          return (
                            <tr key={name} className="hover:bg-slate-800/40">
                              <td className="py-3 px-3 font-bold text-slate-100">{name}</td>
                              
                              <td className="py-3 px-3">
                                {wMetrics.preWeightToday ? (
                                  <span className="font-extrabold text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded-lg border border-blue-500/20">
                                    {wMetrics.preWeightToday} kg
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic text-[11px]">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-slate-300">
                                {wMetrics.postWeightToday ? `${wMetrics.postWeightToday} kg` : '-'}
                              </td>

                              <td className="py-3 px-3">
                                {wMetrics.firstWeightMonth ? (
                                  <span className="text-amber-300 font-bold">
                                    {wMetrics.firstWeightMonth} kg{' '}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({wMetrics.firstWeightDate})
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                {wMetrics.lastWeightMonth ? (
                                  <span className="text-cyan-300 font-bold">
                                    {wMetrics.lastWeightMonth} kg{' '}
                                    <span className="text-[10px] text-slate-400 font-normal">
                                      ({wMetrics.lastWeightDate})
                                    </span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3 font-bold">
                                {diff !== null ? (
                                  <span className={`px-2 py-0.5 rounded-md text-[11px] ${
                                    diff > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    diff < 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    'text-slate-400'
                                  }`}>
                                    {diff > 0 ? `+${diff} kg` : `${diff} kg`}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              <td className="py-3 px-3 text-center">
                                {wMetrics.todayEntry ? (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditHydration(wMetrics.todayEntry!)}
                                    title="Editar Pesagem"
                                    className="rounded-lg p-1.5 text-cyan-400 hover:bg-cyan-500/20 transition-all inline-flex items-center space-x-1"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
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
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'collective' ? (
          <CollectiveSquadView
            key={selectedDate}
            wellnessList={allWellnessList}
            rpeList={allRpeList}
            selectedDate={selectedDate}
          />
        ) : activeTab === 'individual' ? (
          <IndividualAthleteView
            key={selectedDate}
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
        ) : activeTab === 'matchReport' ? (
          <MatchDashboard userRole="admin" />
        ) : (
          /* PIN Management Section */
          <div className="space-y-6 animate-fade-in">
            {pinChangeSuccess && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{pinChangeSuccess}</span>
                </div>
                {onOpenAthleteSelector && (
                  <button
                    type="button"
                    onClick={onOpenAthleteSelector}
                    className="self-start sm:self-auto px-3 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[11px] font-black hover:bg-emerald-400 transition-all shadow shrink-0 active:scale-95"
                  >
                    👁️ Ver no Ecrã Principal →
                  </button>
                )}
              </div>
            )}

            {/* 1. System Master Credentials Redefinition (Activation Code, Admin & Physio) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Activation Code Card */}
              <div className="rounded-2xl border border-amber-500/30 bg-dark-card p-4 space-y-3 shadow-md flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-100">Código de Ativação da App</h4>
                      <p className="text-[10px] text-slate-400">Ativação de telemóveis das jogadoras</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-black text-amber-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {currentActivationCodeState}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleCopyActivationCode}
                    className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 transition-all flex items-center justify-center space-x-1.5"
                  >
                    {copiedCodeToast ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-extrabold">Copiado para a Área de Transferência!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-amber-400" />
                        <span>Copiar Código de Ativação</span>
                      </>
                    )}
                  </button>

                  {isEditingActivationCode ? (
                    <form onSubmit={handleSaveActivationCodeSubmit} className="space-y-2 pt-1">
                      <label className="text-[11px] font-bold text-slate-300 block">Novo Código de Ativação:</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newActivationCodeInput}
                          onChange={(e) => setNewActivationCodeInput(e.target.value)}
                          placeholder="Introduzir novo código..."
                          autoFocus
                          className="flex-1 rounded-xl border border-amber-500 bg-dark-bg p-2 text-xs font-bold uppercase text-slate-100 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white hover:bg-amber-500"
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingActivationCode(false)}
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
                        setIsEditingActivationCode(true);
                        setNewActivationCodeInput(currentActivationCodeState);
                      }}
                      className="w-full rounded-xl border border-slate-800 bg-dark-bg py-2 text-xs font-extrabold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition-all flex items-center justify-center space-x-1.5"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                      <span>Redefinir Código da App</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Admin PIN Card */}
              <div className="rounded-2xl border border-red-500/30 bg-dark-card p-4 space-y-3 shadow-md flex flex-col justify-between">
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
                    <label className="text-[11px] font-bold text-slate-300 block">Nova Palavra-passe Admin:</label>
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
                    className="w-full rounded-xl border border-slate-800 bg-dark-bg py-2 text-xs font-extrabold text-slate-200 hover:bg-slate-800 hover:text-red-400 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-red-500" />
                    <span>Redefinir Palavra-passe Admin</span>
                  </button>
                )}
              </div>

              {/* Physio PIN Card */}
              <div className="rounded-2xl border border-teal-500/30 bg-dark-card p-4 space-y-3 shadow-md flex flex-col justify-between">
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
                    <label className="text-[11px] font-bold text-slate-300 block">Nova Palavra-passe Fisioterapia:</label>
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
                    className="w-full rounded-xl border border-slate-800 bg-dark-bg py-2 text-xs font-extrabold text-slate-200 hover:bg-slate-800 hover:text-teal-400 transition-all flex items-center justify-center space-x-1.5"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-teal-400" />
                    <span>Redefinir Palavra-passe Dept. Médico</span>
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

              {/* Active Push Subscribers Live Card */}
              <div className="bg-slate-900/80 p-3.5 rounded-xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-black text-slate-200">
                      Dispositivos com Notificações Ativas em 2º Plano ({activeSubscribers.length})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {activeSubscribers.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSubscribers}
                        disabled={isLoadingSubscribers}
                        className="flex items-center space-x-1 text-[10px] font-bold text-red-400 hover:text-red-300 bg-red-950/60 px-2 py-0.5 rounded-lg border border-red-500/30 transition-all active:scale-95 disabled:opacity-50"
                        title="Remover todos os dispositivos registados"
                      >
                        <Trash2 className="h-3 w-3 text-red-400" />
                        <span>Remover Todos</span>
                      </button>
                    )}
                  </div>
                </div>

                {activeSubscribers.length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    Nenhum dispositivo registado de momento. As jogadoras só precisam de abrir a app e tocar em &quot;Ativar Alertas em 2º Plano&quot;.
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {activeSubscribers.map((sub, idx) => {
                        const athlete = athletesList.find((a) => a.id === sub.athleteId);
                        const name = athlete ? athlete.name : (sub.athleteId || 'Dispositivo Desconhecido');
                        const isIos = sub.userAgent && /iPhone|iPad|iPod/.test(sub.userAgent);
                        const isAndroid = sub.userAgent && /Android/.test(sub.userAgent);
                        const deviceType = isIos ? 'iPhone' : isAndroid ? 'Android' : 'PC/Mac';

                        return (
                          <span
                            key={sub.id || idx}
                            className="inline-flex items-center gap-1.5 text-[11px] font-extrabold bg-indigo-950/80 text-indigo-200 border border-indigo-500/40 px-2.5 py-1 rounded-lg shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span>{name}</span>
                            <span className="text-[9px] font-bold text-indigo-400/80 bg-indigo-900/60 px-1 py-0.2 rounded border border-indigo-700/40">
                              {deviceType}
                            </span>
                            {sub.endpoint && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSubscriber(sub.endpoint, name)}
                                disabled={isLoadingSubscribers}
                                className="ml-1 text-slate-400 hover:text-red-400 p-0.5 rounded hover:bg-red-500/20 transition-colors"
                                title={`Remover dispositivo ${name}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
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

              {/* Quick Manual Push Triggers */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-200 flex items-center space-x-1.5">
                    <BellRing className="h-4 w-4 text-red-400 animate-pulse" />
                    <span>Disparo Manual Imediato de Notificações</span>
                  </span>
                  <label className="inline-flex items-center space-x-2 cursor-pointer select-none bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={forceBroadcast}
                      onChange={(e) => setForceBroadcast(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-red-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="text-[11px] font-bold text-slate-300">
                      Forçar envio (mesmo a quem já respondeu)
                    </span>
                  </label>
                </div>

                {/* BOTÃO PRINCIPAL DE DESTAQUE: ENVIAR PARA TODOS OS QUESTIONÁRIOS */}
                <button
                  type="button"
                  onClick={() => handleSendBroadcastReminder('all')}
                  disabled={isSendingBroadcast}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:via-rose-500 hover:to-red-600 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-red-950/50 active:scale-[0.99] transition-all flex items-center justify-center space-x-2.5 border border-red-400/40 disabled:opacity-50 cursor-pointer"
                >
                  <Send className={`h-4 w-4 ${isSendingBroadcast ? 'animate-spin' : ''}`} />
                  <span>
                    {isSendingBroadcast
                      ? 'A ENVIAR NOTIFICAÇÕES A TODAS AS JOGADORAS...'
                      : '📢 ENVIAR NOTIFICAÇÃO PARA TODOS OS QUESTIONÁRIOS'}
                  </span>
                </button>

                {/* Botões Individuais por Categoria */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Ou enviar lembrete individual por questionário:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      disabled={isSendingBroadcast}
                      onClick={() => handleSendBroadcastReminder('wellness')}
                      className="py-2.5 px-2.5 rounded-xl border border-lime-500/40 bg-lime-950/40 text-lime-300 text-[11px] font-black hover:bg-lime-900/50 transition-all active:scale-95 text-center shadow-sm disabled:opacity-50"
                    >
                      🔔 Push Wellness ({reminderConfig.wellnessTime})
                    </button>
                    <button
                      type="button"
                      disabled={isSendingBroadcast}
                      onClick={() => handleSendBroadcastReminder('preHydration')}
                      className="py-2.5 px-2.5 rounded-xl border border-sky-500/40 bg-sky-950/40 text-sky-300 text-[11px] font-black hover:bg-sky-900/50 transition-all active:scale-95 text-center shadow-sm disabled:opacity-50"
                    >
                      🔔 Push Pré-Treino ({reminderConfig.preHydrationTime})
                    </button>
                    <button
                      type="button"
                      disabled={isSendingBroadcast}
                      onClick={() => handleSendBroadcastReminder('postHydration')}
                      className="py-2.5 px-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 text-[11px] font-black hover:bg-indigo-900/50 transition-all active:scale-95 text-center shadow-sm disabled:opacity-50"
                    >
                      🔔 Push Pós-Treino ({reminderConfig.postHydrationTime})
                    </button>
                    <button
                      type="button"
                      disabled={isSendingBroadcast}
                      onClick={() => handleSendBroadcastReminder('rpe')}
                      className="py-2.5 px-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 text-[11px] font-black hover:bg-amber-900/50 transition-all active:scale-95 text-center shadow-sm disabled:opacity-50"
                    >
                      🔔 Push PSE ({reminderConfig.rpeTime})
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tabela de Gestão do Plantel, Perfis & PINs */}
            <div className="rounded-2xl border border-red-500/30 bg-dark-card p-4 space-y-4 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100 uppercase">
                      Gestão do Plantel, Perfis & PINs ({athletesList.length} Jogadoras)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Adiciona novas jogadoras, edita o perfil (nome, posição, foto) e gere os códigos de acesso.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Pesquisar jogadora..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-dark-bg py-1.5 pl-9 pr-3 text-xs font-bold text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleActivateAllAthletes}
                    className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3 py-2 text-xs font-black text-emerald-300 hover:bg-emerald-900/80 transition-all whitespace-nowrap active:scale-95 shadow-md"
                    title="Repor todas as jogadoras como ativas no treino num só clique"
                  >
                    <span>⚡ Ativar Todas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewAthleteName('');
                      setNewAthletePosition('Campo');
                      setNewAthletePin('');
                      setNewAthleteAvatar('');
                      setIsAddAthleteModalOpen(true);
                    }}
                    className="flex items-center space-x-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all whitespace-nowrap active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Jogadora</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-dark-bg/60">
                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-black uppercase text-slate-400">
                    <tr>
                      <th className="py-3 px-4">Jogadora</th>
                      <th className="py-3 px-4">Posição</th>
                      <th className="py-3 px-4">PIN de Acesso</th>
                      <th className="py-3 px-4">No Treino / Visibilidade</th>
                      <th className="py-3 px-4 text-right">Ação do Administrador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAthletes.map((athlete) => {
                      const athletePin = pinsState[athlete.id];
                      const isEditingPin = editingPinAthlete?.id === athlete.id;
                      const customAvatar = getAthleteAvatar(athlete.id) || athlete.avatarUrl;
                      const isCustomAthlete = athlete.id.startsWith('ath-custom-');

                      return (
                        <tr key={athlete.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-extrabold text-slate-100">
                            <div className="flex items-center space-x-2.5">
                              {customAvatar ? (
                                <img
                                  src={customAvatar}
                                  alt={athlete.name}
                                  className="h-8 w-8 rounded-full object-cover border border-red-500/50"
                                />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-[10px] font-black text-slate-300 border border-slate-700">
                                  {athlete.name.substring(0, 2)}
                                </span>
                              )}
                              <span className="text-xs font-black">{athlete.name}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-bold">
                            {athlete.position === 'GR' ? (
                              <span className="text-[10px] font-black text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-md">
                                🧤 Guarda-Redes (GR)
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2 py-0.5 rounded-md">
                                ⚽ Campo
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-mono font-bold">
                            {athletePin ? (
                              <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-xs font-black">
                                <span>🔒 {athletePin}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                                ⚪ Não Definido
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 font-bold">
                            <button
                              type="button"
                              onClick={() => handleToggleAthleteActive(athlete.id, athlete.isActive === false)}
                              title={athlete.isActive !== false ? "Ativa na sessão. Clica para ocultar/desativar." : "Oculta da sessão. Clica para ativar."}
                              className={`px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase transition-all flex items-center space-x-1.5 active:scale-95 ${
                                athlete.isActive !== false
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/40'
                                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-500/40'
                              }`}
                            >
                              {athlete.isActive !== false ? (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>🟢 Ativa</span>
                                </>
                              ) : (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-slate-500" />
                                  <span>⚪ Oculta</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            {isEditingPin ? (
                              <div className="flex items-center justify-end space-x-2">
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={newPinInput}
                                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                                  placeholder="4 dígitos"
                                  autoFocus
                                  className="w-24 rounded-lg border border-red-500 bg-dark-card py-1 px-2 text-center text-xs font-mono font-black text-slate-100 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSaveAthletePin(athlete.id)}
                                  className="rounded-lg bg-red-600 px-3 py-1 text-xs font-black text-white hover:bg-red-500"
                                >
                                  Guardar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingPinAthlete(null);
                                    setNewPinInput('');
                                  }}
                                  className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-400 hover:text-slate-200"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end space-x-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAthleteProfile(athlete);
                                    setEditProfileName(athlete.name);
                                    setEditProfilePosition(athlete.position || 'Campo');
                                    setEditProfileAvatar(customAvatar || '');
                                    setEditProfilePin(athletePin || '');
                                  }}
                                  className="flex items-center space-x-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 px-3 py-1.5 text-xs font-black text-cyan-300 hover:bg-cyan-900/50 hover:border-cyan-400 transition-all shadow-sm active:scale-95"
                                  title="Editar Perfil, Posição, Foto e PIN"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Perfil</span>
                                </button>
                              </div>
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

                    <button
                      type="button"
                      onClick={() => setExportDataType('WEIGHT')}
                      className={`p-3 text-left rounded-xl border transition-all text-xs font-bold ${
                        exportDataType === 'WEIGHT'
                          ? 'border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-2 ring-emerald-500/40'
                          : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-extrabold flex items-center space-x-1.5">
                        <span>⚖️ Controlo Ponderal (PESO)</span>
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">Peso pré/pós, 1º e último peso do mês e variação</p>
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
                    {athletesList.map((ath) => (
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

      {/* Modal para Escolher Período e Menus a Limpar */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-dark-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <Trash2 className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase tracking-wide">Limpar Dados Registados</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 1. Escolher Período (Dias para trás) */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-300 flex items-center space-x-1.5">
                <Calendar className="h-4 w-4 text-rose-400" />
                <span>1. Selecionar Período (Dias para trás)</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: '1', label: '1 Dia' },
                  { value: '7', label: '7 Dias' },
                  { value: '15', label: '15 Dias' },
                  { value: '30', label: '30 Dias' },
                  { value: '60', label: '60 Dias' },
                  { value: 'all', label: 'Todo o Histórico' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setClearDays(opt.value)}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all border ${
                      clearDays === opt.value
                        ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-md shadow-rose-500/30 scale-102'
                        : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Escolher Menus / Categorias de dados */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-extrabold uppercase text-slate-300 flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-rose-400" />
                  <span>2. Selecionar Menus a Apagar</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (clearMenus.length === 4) {
                      setClearMenus([]);
                    } else {
                      setClearMenus(['wellness', 'rpe', 'hydration', 'training']);
                    }
                  }}
                  className="text-[10px] font-bold text-cyan-400 hover:underline"
                >
                  {clearMenus.length === 4 ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'wellness', label: '💖 Wellness (Questionário de Bem-Estar)', desc: 'Sono, Fadiga, Humor, Dores' },
                  { id: 'rpe', label: '⚡ RPE (Esforço & Carga de Treino)', desc: 'PSE, Carga Sessão, Planos Pré-Treino' },
                  { id: 'hydration', label: '💧 Hidratação (Peso Pré & Pós-Treino)', desc: 'Pesagem Chegada e Saída' },
                  { id: 'training', label: '📅 Informação de Treinos & Calendário', desc: 'Sessões agendadas e tipos de dia' },
                ].map((item) => {
                  const isChecked = clearMenus.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-start space-x-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-rose-500/50 bg-rose-950/20'
                          : 'border-slate-800 bg-slate-900/40 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setClearMenus([...clearMenus, item.id]);
                          } else {
                            setClearMenus(clearMenus.filter((m) => m !== item.id));
                          }
                        }}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-100">{item.label}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="w-1/2 rounded-xl bg-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isClearingData || clearMenus.length === 0}
                onClick={handleExecuteClearData}
                className="w-1/2 rounded-xl bg-rose-600 py-3 text-xs font-black text-white shadow-lg shadow-rose-600/30 hover:bg-rose-500 disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isClearingData ? 'A apagar...' : 'Apagar Dados'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Nova Jogadora ao Plantel */}
      {isAddAthleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-dark-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-red-400">
                <Plus className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase text-slate-100">Adicionar Jogadora ao Plantel</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAthleteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddAthleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                  Nome da Jogadora *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CHELSEA, PAYTON, SOFIA"
                  value={newAthleteName}
                  onChange={(e) => setNewAthleteName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                  Posição em Campo *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewAthletePosition('Campo')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                      newAthletePosition === 'Campo'
                        ? 'border-red-500 bg-red-950/40 text-red-300 ring-1 ring-red-500'
                        : 'border-slate-800 bg-dark-bg text-slate-400'
                    }`}
                  >
                    ⚽ Jogadora de Campo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewAthletePosition('GR')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                      newAthletePosition === 'GR'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-300 ring-1 ring-purple-500'
                        : 'border-slate-800 bg-dark-bg text-slate-400'
                    }`}
                  >
                    🧤 Guarda-Redes (GR)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                  PIN de Acesso Inicial (Opcional)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  placeholder="Ex: 1234 (4 dígitos)"
                  value={newAthletePin}
                  onChange={(e) => setNewAthletePin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-center text-sm font-mono font-bold text-amber-400 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Fotografia de Perfil (Opcional)
                </label>
                <div className="flex items-center space-x-3 bg-dark-bg p-3 rounded-xl border border-slate-700">
                  <div className="relative shrink-0">
                    {newAthleteAvatar ? (
                      <img
                        src={newAthleteAvatar}
                        alt="Preview"
                        className="h-12 w-12 rounded-full object-cover border-2 border-red-500 shadow"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 rounded-xl bg-red-600/20 border border-red-500/40 px-3 py-1.5 text-xs font-black text-red-300 hover:bg-red-600/30 transition-all cursor-pointer">
                        <Camera className="h-3.5 w-3.5" />
                        <span>📁 Carregar Ficheiro de Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, (dataUrl) => {
                                setNewAthleteAvatar(dataUrl);
                              });
                            }
                          }}
                        />
                      </label>

                      {newAthleteAvatar && (
                        <button
                          type="button"
                          onClick={() => setNewAthleteAvatar('')}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/30"
                          title="Remover foto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Ou colar URL da imagem..."
                      value={newAthleteAvatar}
                      onChange={(e) => setNewAthleteAvatar(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-dark-card py-1 px-2.5 text-[11px] font-mono text-slate-300 focus:border-red-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddAthleteModalOpen(false)}
                  disabled={isSubmittingAthlete}
                  className="w-1/2 rounded-xl border border-slate-700 bg-dark-bg py-2.5 text-xs font-bold text-slate-300 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAthlete}
                  className="w-1/2 rounded-xl bg-red-600 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-900/40 hover:bg-red-500 transition-all disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isSubmittingAthlete && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isSubmittingAthlete ? 'A Guardar...' : 'Adicionar Jogadora'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Perfil da Jogadora */}
      {editingAthleteProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-dark-card p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Pencil className="h-5 w-5" />
                <h3 className="text-sm font-black uppercase text-slate-100">Editar Perfil de {editingAthleteProfile.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingAthleteProfile(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAthleteProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                  Nome da Jogadora
                </label>
                <input
                  type="text"
                  required
                  value={editProfileName}
                  onChange={(e) => setEditProfileName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-bold text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase">
                  Posição em Campo
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProfilePosition('Campo')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                      editProfilePosition === 'Campo'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500'
                        : 'border-slate-800 bg-dark-bg text-slate-400'
                    }`}
                  >
                    ⚽ Campo
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditProfilePosition('GR')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold transition-all ${
                      editProfilePosition === 'GR'
                        ? 'border-purple-500 bg-purple-950/40 text-purple-300 ring-1 ring-purple-500'
                        : 'border-slate-800 bg-dark-bg text-slate-400'
                    }`}
                  >
                    🧤 Guarda-Redes (GR)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  PIN de Acesso Pessoal (4 Dígitos)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={4}
                    value={editProfilePin}
                    onChange={(e) => setEditProfilePin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234 (opcional)"
                    className="w-full rounded-xl border border-slate-700 bg-dark-bg py-2.5 pl-10 pr-3 text-xs font-mono font-black text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">PIN individual para a jogadora aceder à sua conta no ecrã inicial.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                  Fotografia de Perfil
                </label>
                <div className="flex items-center space-x-3 bg-dark-bg p-3 rounded-xl border border-slate-700">
                  <div className="relative shrink-0">
                    {editProfileAvatar ? (
                      <img
                        src={editProfileAvatar}
                        alt="Preview"
                        className="h-12 w-12 rounded-full object-cover border-2 border-cyan-500 shadow"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-black text-cyan-300 hover:bg-cyan-600/30 transition-all cursor-pointer">
                        <Camera className="h-3.5 w-3.5" />
                        <span>📁 Carregar Ficheiro de Foto</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              compressImageFile(file, (dataUrl) => {
                                setEditProfileAvatar(dataUrl);
                              });
                            }
                          }}
                        />
                      </label>

                      {editProfileAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditProfileAvatar('')}
                          className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/30"
                          title="Remover foto"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Ou colar URL da imagem..."
                      value={editProfileAvatar}
                      onChange={(e) => setEditProfileAvatar(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-dark-card py-1 px-2.5 text-[11px] font-mono text-slate-300 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const ath = editingAthleteProfile;
                    setEditingAthleteProfile(null);
                    setAthleteToDelete(ath);
                  }}
                  className="w-full flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 py-2.5 text-xs font-black text-rose-400 hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Apagar Perfil da Jogadora</span>
                </button>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAthleteProfile(null)}
                  className="w-1/2 rounded-xl border border-slate-700 bg-dark-bg py-2.5 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 rounded-xl bg-cyan-600 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-cyan-600/30 hover:bg-cyan-500 transition-all"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAÇÃO DE PERFIL */}
      {athleteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/40 bg-dark-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-2 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-sm font-black uppercase text-slate-100">Apagar Perfil da Jogadora</h3>
            </div>
            <p className="text-xs text-slate-300">
              Tem a certeza que deseja apagar o perfil da jogadora <strong className="text-white">{athleteToDelete.name}</strong>?
              Esta ação irá remover a jogadora do plantel ativo.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAthleteToDelete(null)}
                className="w-1/2 rounded-xl border border-slate-700 bg-dark-bg py-2.5 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteAthlete(athleteToDelete.id);
                  setAthleteToDelete(null);
                  loadAllPins();
                  setPinChangeSuccess(`Perfil de ${athleteToDelete.name} removido com sucesso.`);
                  setTimeout(() => setPinChangeSuccess(null), 4000);
                }}
                className="w-1/2 rounded-xl bg-rose-600 py-2.5 text-xs font-black text-white hover:bg-rose-500 shadow-lg shadow-rose-900/40 transition-all"
              >
                Apagar Perfil
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
