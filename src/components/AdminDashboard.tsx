'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, Athlete, AthletePosition, QuestionnaireDeadlinesConfig } from '@/lib/types';
import { INITIAL_ATHLETES, BORG_SCALE, calculateHydrationStatus } from '@/lib/data';
import { getWellnessLocally, getRPELocally, getHydrationLocally, getAthletePin, setAthletePin, getAthleteAvatar, saveBulkGsheetsData, deleteHydrationLocally, updateHydrationLocally, clearAllHistoricalData, clearSelectiveHistoricalData, getAdminPin, setAdminPin as saveAdminPinToStorage, getPhysioPin, setPhysioPin as savePhysioPinToStorage, getClubActivationCode, setClubActivationCode as saveClubActivationCodeToStorage, getDynamicAthletes, saveAthleteProfile, addNewAthlete, deleteAthlete, compressImageFile, setAthleteActiveStatus, setAllAthletesActive, syncAllDataFromCloud, syncCredentialsFromCloud, getStoredDeadlineConfig, saveDeadlineConfig, getStoredTrainingSessions, saveTrainingSessionInfo, grantAthleteLateAuthorization, revokeAthleteLateAuthorization, isAthleteAuthorizedForLateSubmission, formatSubmissionTime, approveWellnessSubmission, rejectWellnessSubmission, approveRPESubmission, rejectRPESubmission, approveAllPendingSubmissions } from '@/lib/storage';
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
import { MatchMinutesDashboard } from './MatchMinutesDashboard';
import { KioskModeView } from './KioskModeView';
import { AdminMobilityManager } from './AdminMobilityManager';
import {
  Shield, Users, Stethoscope, Activity, Search, Lock, X, KeyRound,
  CheckCircle2, LayoutGrid, HeartPulse, Dumbbell, Droplets, AlertTriangle,
  MessageSquare, Tag, Info, AlertCircle, ArrowUpRight, User, RefreshCw,
  ChevronLeft, ChevronRight, Calendar, Sparkles, Euro, Trash2, Pencil,
  Download, FileSpreadsheet, FileText, Bell, BellRing, Send, Smartphone, Tablet, Scale, Plus, Camera, Copy, Check, Trophy, MessageCircle, Clock,
  Unlock, UserCheck
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
  const [isKioskOpen, setIsKioskOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('kiosk') === 'true';
    }
    return false;
  });

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

  const [activeTab, setActiveTabState] = useState<'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins' | 'matchReport' | 'matchMinutes' | 'mobility'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_admin_active_tab') as any) || 'schedule';
    }
    return 'schedule';
  });

  const setActiveTab = (tab: 'schedule' | 'overview' | 'collective' | 'individual' | 'fines' | 'pins' | 'matchReport' | 'matchMinutes' | 'mobility') => {
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

  const [pinsSubTab, setPinsSubTabState] = useState<'deadlines' | 'authorizations' | 'playerPins' | 'credentials' | 'all'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('femperf_admin_pins_sub_tab');
      if (stored === 'notifications') return 'deadlines';
      return (stored as any) || 'deadlines';
    }
    return 'deadlines';
  });

  const setPinsSubTab = (tab: 'deadlines' | 'authorizations' | 'playerPins' | 'credentials' | 'all') => {
    setPinsSubTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_admin_pins_sub_tab', tab);
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
  const [deadlineConfig, setDeadlineConfig] = useState<QuestionnaireDeadlinesConfig>(getStoredDeadlineConfig());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState<boolean>(false);
  const [forceBroadcast, setForceBroadcast] = useState<boolean>(false);
  const [activeSubscribers, setActiveSubscribers] = useState<any[]>([]);
  const [isLoadingSubscribers, setIsLoadingSubscribers] = useState<boolean>(false);
  const [specificDateInput, setSpecificDateInput] = useState<string>(() => getTodayLocalDateStr());
  const [specificWellnessTime, setSpecificWellnessTime] = useState<string>('08:15');
  const [specificRpeTime, setSpecificRpeTime] = useState<string>('14:00');
  const [specificExceptionToast, setSpecificExceptionToast] = useState<string | null>(null);

  const handleUpdateDeadlineConfig = (updated: Partial<QuestionnaireDeadlinesConfig>) => {
    const newCfg = { ...deadlineConfig, ...updated };
    setDeadlineConfig(newCfg);
    saveDeadlineConfig(newCfg);
  };

  const handleSaveSpecificDeadline = () => {
    if (!specificDateInput) return;
    const currentCustom = { ...(deadlineConfig.customDateDeadlines || {}) };
    const currentWellness = { ...(deadlineConfig.customDateDeadlinesWellness || {}) };
    const currentRpe = { ...(deadlineConfig.customDateDeadlinesRpe || {}) };

    if (specificWellnessTime && specificWellnessTime.trim()) {
      currentWellness[specificDateInput] = specificWellnessTime.trim();
      currentCustom[specificDateInput] = specificWellnessTime.trim();
    } else {
      delete currentWellness[specificDateInput];
    }

    if (specificRpeTime && specificRpeTime.trim()) {
      currentRpe[specificDateInput] = specificRpeTime.trim();
    } else {
      delete currentRpe[specificDateInput];
    }

    handleUpdateDeadlineConfig({
      customDateDeadlines: currentCustom,
      customDateDeadlinesWellness: currentWellness,
      customDateDeadlinesRpe: currentRpe,
    });

    try {
      const sessions = getStoredTrainingSessions();
      if (sessions[specificDateInput]) {
        sessions[specificDateInput].customDeadline = specificWellnessTime;
        sessions[specificDateInput].customDeadlineWellness = specificWellnessTime;
        sessions[specificDateInput].customDeadlineRpe = specificRpeTime;
        saveTrainingSessionInfo(sessions[specificDateInput]);
      }
    } catch {}

    setSpecificExceptionToast(`✓ Limites para ${specificDateInput} guardados: Wellness (${specificWellnessTime}) | PSE (${specificRpeTime})!`);
    setTimeout(() => setSpecificExceptionToast(null), 4000);
  };

  const handleRemoveSpecificDeadline = (dateToRemove: string) => {
    const currentCustom = { ...(deadlineConfig.customDateDeadlines || {}) };
    const currentWellness = { ...(deadlineConfig.customDateDeadlinesWellness || {}) };
    const currentRpe = { ...(deadlineConfig.customDateDeadlinesRpe || {}) };

    delete currentCustom[dateToRemove];
    delete currentWellness[dateToRemove];
    delete currentRpe[dateToRemove];

    handleUpdateDeadlineConfig({
      customDateDeadlines: currentCustom,
      customDateDeadlinesWellness: currentWellness,
      customDateDeadlinesRpe: currentRpe,
    });

    try {
      const sessions = getStoredTrainingSessions();
      if (sessions[dateToRemove]) {
        delete sessions[dateToRemove].customDeadline;
        delete sessions[dateToRemove].customDeadlineWellness;
        delete sessions[dateToRemove].customDeadlineRpe;
        saveTrainingSessionInfo(sessions[dateToRemove]);
      }
    } catch {}

    setSpecificExceptionToast(`✓ Exceção do dia ${dateToRemove} removida. Segue agora a regra geral.`);
    setTimeout(() => setSpecificExceptionToast(null), 4000);
  };

  const [selectedAuthAthleteId, setSelectedAuthAthleteId] = useState<string>('');
  const [authScopeType, setAuthScopeType] = useState<'today' | 'date' | 'permanent'>('today');
  const [authCustomDate, setAuthCustomDate] = useState<string>(() => getTodayLocalDateStr());
  const [authQuestionnaireType, setAuthQuestionnaireType] = useState<'all' | 'wellness' | 'rpe'>('all');
  const [authSearchQuery, setAuthSearchQuery] = useState<string>('');
  const [authToast, setAuthToast] = useState<string | null>(null);

  const handleGrantAthleteAuthorization = (athleteId?: string, isPermanent = false) => {
    const targetId = athleteId || selectedAuthAthleteId;
    if (!targetId) return;

    const ath = athletesList.find((a) => a.id === targetId);
    const athName = ath ? ath.name : targetId;
    const today = getTodayLocalDateStr();
    const targetDate = isPermanent ? undefined : (authScopeType === 'permanent' ? undefined : (authScopeType === 'date' ? authCustomDate : today));

    grantAthleteLateAuthorization(targetId, athName, targetDate, authQuestionnaireType);
    setDeadlineConfig(getStoredDeadlineConfig());

    setAuthToast(`✓ Autorização concedida a ${athName} (${targetDate ? `para o dia ${targetDate}` : 'Permanente'})!`);
    setTimeout(() => setAuthToast(null), 4000);
  };

  const handleRevokeAthleteAuthorization = (athleteId: string, dateStr?: string) => {
    const ath = athletesList.find((a) => a.id === athleteId);
    const athName = ath ? ath.name : athleteId;

    revokeAthleteLateAuthorization(athleteId, dateStr);
    setDeadlineConfig(getStoredDeadlineConfig());

    setAuthToast(`✓ Autorização de ${athName} removida.`);
    setTimeout(() => setAuthToast(null), 4000);
  };

  // Pending submissions approval state & handlers
  const [approvalToast, setApprovalToast] = useState<string | null>(null);

  const pendingWellnessList = useMemo(() => {
    return allWellnessList.filter((w) => w.approvalStatus === 'pending');
  }, [allWellnessList]);

  const pendingRpeList = useMemo(() => {
    return allRpeList.filter((r) => r.approvalStatus === 'pending');
  }, [allRpeList]);

  const totalPendingReviews = pendingWellnessList.length + pendingRpeList.length;

  const handleApproveWellness = async (id: string, keepFine = true) => {
    approveWellnessSubmission(id, 'Treinador', keepFine);
    loadAllData(selectedDate);
    setApprovalToast(
      keepFine
        ? '⚠️ Submissão de Wellness aceite mantendo a multa por atraso.'
        : '✅ Submissão de Wellness aceite e isenta de multa.'
    );
    setTimeout(() => setApprovalToast(null), 3500);

    const updated = getWellnessLocally().find((e) => e.id === id);
    if (updated) {
      secureFetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const handleRejectWellness = async (id: string) => {
    rejectWellnessSubmission(id, 'Treinador');
    loadAllData(selectedDate);
    setApprovalToast('❌ Submissão de Wellness rejeitada (marcada como não válida).');
    setTimeout(() => setApprovalToast(null), 3500);

    const updated = getWellnessLocally().find((e) => e.id === id);
    if (updated) {
      secureFetch('/api/wellness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const handleApproveRPE = async (id: string, keepFine = true) => {
    approveRPESubmission(id, 'Treinador', keepFine);
    loadAllData(selectedDate);
    setApprovalToast(
      keepFine
        ? '⚠️ Submissão de PSE aceite mantendo a multa por atraso.'
        : '✅ Submissão de PSE aceite e isenta de multa.'
    );
    setTimeout(() => setApprovalToast(null), 3500);

    const updated = getRPELocally().find((e) => e.id === id);
    if (updated) {
      secureFetch('/api/rpe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const handleRejectRPE = async (id: string) => {
    rejectRPESubmission(id, 'Treinador');
    loadAllData(selectedDate);
    setApprovalToast('❌ Submissão de PSE rejeitada (marcada como não válida).');
    setTimeout(() => setApprovalToast(null), 3500);

    const updated = getRPELocally().find((e) => e.id === id);
    if (updated) {
      secureFetch('/api/rpe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const handleApproveAllPending = async (keepFine = true) => {
    approveAllPendingSubmissions(selectedDate, 'Treinador', keepFine);
    loadAllData(selectedDate);
    setApprovalToast(
      keepFine
        ? '⚠️ Todas as submissões aceites mantendo a multa por atraso.'
        : '✅ Todas as submissões aceites e isentas de multa.'
    );
    setTimeout(() => setApprovalToast(null), 3500);
  };

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
    // Notificações desativadas a pedido do utilizador
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

  const handleSendWhatsAppReminder = (type: 'all' | 'wellness' | 'preHydration' | 'postTraining' | 'rpe', customName?: string) => {
    let message = '';
    const appUrl = 'https://fem-performance-app.vercel.app';
    if (customName) {
      if (type === 'wellness') {
        message = `Olá ${customName}! 👋\nLembra-te de preencher o teu Questionário Wellness de hoje na app Gil Vicente FC:\n🔗 ${appUrl}\nObrigado! ⚽`;
      } else if (type === 'preHydration') {
        message = `Olá ${customName}! 👋\nLembra-te de registar a tua Pesagem Pré-Treino de hoje:\n🔗 ${appUrl}\nBom treino! ⚽`;
      } else if (type === 'postTraining' || type === 'rpe') {
        message = `Olá ${customName}! 👋\nLembra-te de registar a tua Pesagem Pós-Treino e o PSE (RPE) de hoje:\n🔗 ${appUrl}\nBom descanso! ⚽`;
      } else {
        message = `Olá ${customName}! 👋\nTens questionários pendentes na app Gil Vicente FC:\n🔗 ${appUrl}\nPor favor responde assim que puderes! ⚽`;
      }
    } else {
      if (type === 'wellness') {
        message = `⚽ *GIL VICENTE FC • QUESTIONÁRIO WELLNESS* ⚽\n\nBom dia meninas! Lembrete para preencherem o vosso Wellness desta manhã na app:\n🔗 ${appUrl}\n\nBom treino a todas! 💪🔴🔵`;
      } else if (type === 'preHydration') {
        message = `⚽ *GIL VICENTE FC • PESAGEM PRÉ-TREINO* ⚽\n\nMeninas, lembrete para registarem a vossa pesagem pré-treino de hoje na app:\n🔗 ${appUrl}\n\nFoco no treino! 💪🔴🔵`;
      } else if (type === 'postTraining' || type === 'rpe') {
        message = `⚽ *GIL VICENTE FC • REGISTO PÓS-TREINO & PSE (RPE)* ⚽\n\nMeninas, treino concluído! Não se esqueçam de registar a pesagem pós-treino e o vosso PSE (RPE) na app:\n🔗 ${appUrl}\n\nBom descanso! 💪🔴🔵`;
      } else {
        message = `⚽ *GIL VICENTE FC • LEMBRETE DIÁRIO* ⚽\n\nMeninas, por favor confirmem se têm todos os vossos questionários e pesagens preenchidos na app:\n🔗 ${appUrl}\n\n(Wellness, Pesagens e PSE)\nObrigado pelo compromisso! 💪🔴🔵`;
      }
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      syncAllDataFromCloud().then(() => {
        loadAllData(selectedDate);
        loadAllPins();
      });

      // Auto-poll cloud every 8 seconds to synchronize any updates made from other devices
      const intervalId = setInterval(() => {
        syncAllDataFromCloud().then(() => {
          loadAllData(selectedDate);
          loadAllPins();
        });
      }, 8000);

      const onFocus = () => {
        syncAllDataFromCloud().then(() => {
          loadAllData(selectedDate);
          loadAllPins();
        });
      };
      window.addEventListener('focus', onFocus);

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
        clearInterval(intervalId);
        window.removeEventListener('focus', onFocus);
        window.removeEventListener('femperf_data_updated', handleDataUpdate);
        window.removeEventListener('femperf_credentials_updated', handleCredsUpdate);
      };
    }
  }, [isOpen, isAuthenticated, selectedDate]);

  // Sync credentials from cloud as soon as modal opens, even before logging in
  useEffect(() => {
    if (isOpen) {
      syncCredentialsFromCloud().then(() => {
        loadAllPins();
      });
    }
  }, [isOpen]);

  // Auto-open Kiosk mode if URL contains ?kiosk=true
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('kiosk') === 'true') {
        setIsKioskOpen(true);
      }
    }
  }, [isOpen]);

  const handleManualSyncCloudData = async () => {
    setIsSyncingCloud(true);
    try {
      await syncAllDataFromCloud();
      loadAllData(selectedDate);
      loadAllPins();
    } finally {
      setIsSyncingCloud(false);
    }
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

      const monthPreEntries = monthEntries.filter((h) => Number(h.preWeight) > 0);
      if (monthPreEntries.length > 0) {
        const fw = monthPreEntries[0].preWeight;
        const lw = monthPreEntries[monthPreEntries.length - 1].preWeight;
        if (fw) initialWeights.push(fw);
        if (lw) lastWeights.push(lw);
      } else if (monthEntries.length > 0) {
        const fw = monthEntries[0].preWeight || monthEntries[0].postWeight;
        const lw = monthEntries[monthEntries.length - 1].preWeight || monthEntries[monthEntries.length - 1].postWeight;
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
    setReminderConfig(getStoredReminderConfig());
    setDeadlineConfig(getStoredDeadlineConfig());

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

  const handleAdminPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await syncCredentialsFromCloud();
    } catch {}
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

  // Helper for monthly weight tracking (1º peso pré-treino do mês, último peso pré-treino do mês, peso pré-treino hoje)
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

    // Filtrar especificamente por pesagens pré-treino para garantir comparação 100% fidedigna (baseline vs baseline)
    const monthPreEntries = monthEntries.filter((h) => Number(h.preWeight) > 0);
    const firstEntry = monthPreEntries.length > 0 ? monthPreEntries[0] : (monthEntries.length > 0 ? monthEntries[0] : null);
    const lastEntry = monthPreEntries.length > 0 ? monthPreEntries[monthPreEntries.length - 1] : (monthEntries.length > 0 ? monthEntries[monthEntries.length - 1] : null);

    const firstWeightMonth = firstEntry ? (firstEntry.preWeight || firstEntry.postWeight) : null;
    const firstWeightDate = firstEntry ? firstEntry.date.split('-').slice(1).reverse().join('/') : null;

    // Ambos 1º e último peso do mês utilizam o peso pré-treino!
    const lastWeightMonth = lastEntry ? (lastEntry.preWeight || lastEntry.postWeight) : null;
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

            {/* Kiosk Mode Button (iPad / Balneário) */}
            <button
              type="button"
              onClick={() => setIsKioskOpen(true)}
              className="flex items-center space-x-1.5 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 px-3.5 py-2 text-xs font-black text-amber-300 hover:from-amber-500/30 hover:to-orange-500/30 transition-all shadow-md active:scale-95 cursor-pointer"
              title="Ativar Modo Quiosque para iPad / Balneário (Sem PIN)"
            >
              <Tablet className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>📱 Modo Quiosque</span>
            </button>

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
        <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'schedule'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-lime shrink-0" />
            <span>Treino & Calendário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400 shrink-0" />
            <span>Resumo Diário</span>
            {totalPendingReviews > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse shadow-sm">
                {totalPendingReviews}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('collective')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'collective'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 shrink-0" />
            <span>Análise Coletiva</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'individual'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-brand-lime shrink-0" />
            <span>Análise Individual</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matchReport')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'matchReport'
                ? 'bg-gradient-to-r from-sky-600 to-sky-500 text-white shadow-md shadow-sky-600/30 border border-sky-400/50'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300 shrink-0" />
            <span>Dashboard Jogos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matchMinutes')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'matchMinutes'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md shadow-red-600/30 border border-rose-400/50'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-400 shrink-0" />
            <span>Tempo de Jogo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fines')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'fines'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Euro className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            <span>{t.admin?.fines?.tabFines || 'Multas & Cumprimento'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mobility')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'mobility'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <Dumbbell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400 shrink-0" />
            <span>Mobilidade & Planos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pins')}
            className={`flex-1 min-w-[125px] sm:min-w-[135px] flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs font-extrabold rounded-xl transition-all text-center leading-tight shadow-sm ${
              activeTab === 'pins'
                ? 'bg-red-600 text-white shadow-md shadow-red-600/30 border border-red-500'
                : 'text-slate-400 bg-slate-900/60 hover:bg-slate-800 hover:text-white border border-slate-800/80'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400 shrink-0" />
            <span>PINs & Acessos</span>
          </button>
        </div>

        {activeTab === 'overview' ? (
          <div className="space-y-5">
            {/* Approval Toast Notification */}
            {approvalToast && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold animate-fade-in flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{approvalToast}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setApprovalToast(null)}
                  className="text-emerald-400 hover:text-emerald-200 p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Pending Approvals Review Queue Card */}
            {totalPendingReviews > 0 && (
              <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-dark-card to-dark-surface p-4 shadow-xl space-y-3 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-200 uppercase tracking-wide flex items-center space-x-2">
                        <span>Submissões Fora do Prazo a Aguardar Validação</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/40">
                          {totalPendingReviews} pendente{totalPendingReviews > 1 ? 's' : ''}
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Atletas que submeteram questionários após a hora limite estipulada. Aceita para validar as respostas ou rejeita para manter a falta/multa.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleApproveAllPending(true)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-[11px] transition-all shadow-md flex items-center justify-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
                      title="Aceitar todas as submissões mantendo a multa por atraso"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Aceitar Todas (c/ Multa)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveAllPending(false)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] transition-all shadow-md flex items-center justify-center space-x-1 shrink-0 active:scale-95 cursor-pointer"
                      title="Aceitar todas as submissões e perdoar/isentar a multa"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>Aceitar Todas (s/ Multa)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {pendingWellnessList.map((w) => (
                    <div key={w.id} className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between text-xs space-x-2">
                      <div className="truncate space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-slate-100">{w.athleteName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-500/40 uppercase">
                            Wellness
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          📅 {w.date} às {formatSubmissionTime(w.submittedAt || w.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleApproveWellness(w.id, true)}
                          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] transition-all shadow flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Aceitar submissão mantendo a multa por atraso"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>c/ Multa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveWellness(w.id, false)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] transition-all shadow flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Aceitar submissão e perdoar/isentar a multa"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>s/ Multa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectWellness(w.id)}
                          className="px-1.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-black text-[10px] transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Rejeitar submissão"
                        >
                          <X className="h-3 w-3" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {pendingRpeList.map((r) => (
                    <div key={r.id} className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between text-xs space-x-2">
                      <div className="truncate space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-black text-slate-100">{r.athleteName}</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-black border border-cyan-500/40 uppercase">
                            PSE (RPE)
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          📅 {r.date} às {formatSubmissionTime(r.submittedAt || r.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0 flex-wrap justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleApproveRPE(r.id, true)}
                          className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-[10px] transition-all shadow flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Aceitar submissão mantendo a multa por atraso"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>c/ Multa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveRPE(r.id, false)}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] transition-all shadow flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Aceitar submissão e perdoar/isentar a multa"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>s/ Multa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectRPE(r.id)}
                          className="px-1.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-black text-[10px] transition-all flex items-center space-x-1 cursor-pointer active:scale-95"
                          title="Rejeitar submissão"
                        >
                          <X className="h-3 w-3" />
                          <span>Rejeitar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                            <th className="py-2.5 px-3 whitespace-nowrap">Hora Submissão</th>
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
                              const subTime = formatSubmissionTime(w.submittedAt || w.createdAt);

                              return (
                                <tr key={w.id} className="hover:bg-slate-800/40">
                                  <td className="py-3 px-3 font-bold text-slate-100">
                                    {w.athleteName}
                                  </td>

                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <Clock className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                      <span className="font-extrabold text-slate-200 text-xs">
                                        {subTime}
                                      </span>
                                      {w.isAuthorizedLate && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black" title="Autorizada fora de horas">
                                          🔓 VIP
                                        </span>
                                      )}
                                      {w.approvalStatus === 'pending' ? (
                                        <div className="inline-flex items-center space-x-1 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black text-amber-300">
                                          <span className="animate-pulse">⏳ Pendente:</span>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveWellness(w.id, true)}
                                            className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black cursor-pointer active:scale-90"
                                            title="Aceitar mantendo multa por atraso"
                                          >
                                            ✓ c/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveWellness(w.id, false)}
                                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer active:scale-90"
                                            title="Aceitar e isentar de multa"
                                          >
                                            ✓ s/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectWellness(w.id)}
                                            className="px-1 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer active:scale-90"
                                            title="Rejeitar submissão"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : w.approvalStatus === 'rejected' ? (
                                        <div className="inline-flex items-center space-x-1 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 rounded text-[9px] font-black text-rose-300">
                                          <span>❌ Não Aceite</span>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveWellness(w.id, true)}
                                            className="ml-1 px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border border-amber-500 text-[8px] cursor-pointer"
                                            title="Mudar para Aceite com Multa"
                                          >
                                            c/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveWellness(w.id, false)}
                                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-500 text-[8px] cursor-pointer"
                                            title="Mudar para Aceite sem Multa"
                                          >
                                            s/ Multa
                                          </button>
                                        </div>
                                      ) : w.approvalStatus === 'approved' && w.isLate && !w.isAuthorizedLate ? (
                                        <div className="inline-flex items-center space-x-1">
                                          {w.keepFine ? (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black" title="Aceite mas mantém a multa por atraso">
                                              ⚠️ Aceite c/ Multa
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black" title="Aceite e isento de multa">
                                              ✅ Aceite s/ Multa
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleApproveWellness(w.id, !w.keepFine)}
                                            className="px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold border border-slate-700 cursor-pointer"
                                            title={w.keepFine ? "Retirar multa" : "Manter multa"}
                                          >
                                            {w.keepFine ? "Isentar" : "Multar"}
                                          </button>
                                        </div>
                                      ) : w.isLate && !w.isAuthorizedLate ? (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black" title="Submetido fora de prazo">
                                          ⚠️ Fora
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>
                                  
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
                            <th className="py-2.5 px-3 whitespace-nowrap">Hora Submissão</th>
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
                              const subTime = formatSubmissionTime(r.submittedAt || r.createdAt);

                              return (
                                <tr key={r.id} className="hover:bg-slate-800/40">
                                  <td className="py-3 px-3 font-bold text-slate-100">
                                    <div className="flex items-center space-x-1.5">
                                      <span>{r.athleteName}</span>
                                      {r.sessionType === 'gym_lower' && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[9px] font-black uppercase tracking-wider">
                                          🏋️ Ginásio MMII
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <div className="flex items-center space-x-1.5">
                                      <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                      <span className="font-extrabold text-slate-200 text-xs">
                                        {subTime}
                                      </span>
                                      {r.isAuthorizedLate && (
                                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black" title="Autorizada fora de horas">
                                          🔓 VIP
                                        </span>
                                      )}
                                      {r.approvalStatus === 'pending' ? (
                                        <div className="inline-flex items-center space-x-1 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded text-[9px] font-black text-amber-300">
                                          <span className="animate-pulse">⏳ Pendente:</span>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRPE(r.id, true)}
                                            className="px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-black cursor-pointer active:scale-90"
                                            title="Aceitar mantendo multa por atraso"
                                          >
                                            ✓ c/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRPE(r.id, false)}
                                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer active:scale-90"
                                            title="Aceitar e isentar de multa"
                                          >
                                            ✓ s/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleRejectRPE(r.id)}
                                            className="px-1 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer active:scale-90"
                                            title="Rejeitar submissão"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      ) : r.approvalStatus === 'rejected' ? (
                                        <div className="inline-flex items-center space-x-1 bg-rose-500/20 border border-rose-500/40 px-1.5 py-0.5 rounded text-[9px] font-black text-rose-300">
                                          <span>❌ Não Aceite</span>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRPE(r.id, true)}
                                            className="ml-1 px-1.5 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold border border-amber-500 text-[8px] cursor-pointer"
                                            title="Mudar para Aceite com Multa"
                                          >
                                            c/ Multa
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRPE(r.id, false)}
                                            className="px-1.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold border border-emerald-500 text-[8px] cursor-pointer"
                                            title="Mudar para Aceite sem Multa"
                                          >
                                            s/ Multa
                                          </button>
                                        </div>
                                      ) : r.approvalStatus === 'approved' && r.isLate && !r.isAuthorizedLate ? (
                                        <div className="inline-flex items-center space-x-1">
                                          {r.keepFine ? (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black" title="Aceite mas mantém a multa por atraso">
                                              ⚠️ Aceite c/ Multa
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-black" title="Aceite e isento de multa">
                                              ✅ Aceite s/ Multa
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => handleApproveRPE(r.id, !r.keepFine)}
                                            className="px-1 py-0.2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[8px] font-bold border border-slate-700 cursor-pointer"
                                            title={r.keepFine ? "Retirar multa" : "Manter multa"}
                                          >
                                            {r.keepFine ? "Isentar" : "Multar"}
                                          </button>
                                        </div>
                                      ) : r.isLate && !r.isAuthorizedLate ? (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-black" title="Submetido fora de prazo">
                                          ⚠️ Fora
                                        </span>
                                      ) : null}
                                    </div>
                                  </td>

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
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="font-extrabold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-500/30">
                                        {h.preWeight} kg
                                      </span>
                                      {(() => {
                                        const preTime = formatSubmissionTime(h.preWeightTime || h.submittedAtPre || (h.preWeight > 0 ? h.createdAt : undefined));
                                        return preTime !== '-' ? (
                                          <span className="inline-flex items-center space-x-1 text-[10px] text-slate-300 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/80">
                                            <Clock className="h-2.5 w-2.5 text-blue-400 shrink-0" />
                                            <span>{preTime}</span>
                                          </span>
                                        ) : null;
                                      })()}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-slate-300">
                                    {h.postWeight > 0 ? (
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="font-extrabold text-slate-100 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
                                          {h.postWeight} kg
                                        </span>
                                        {(() => {
                                          const postTime = formatSubmissionTime(h.postWeightTime || h.submittedAtPost || h.createdAt);
                                          return postTime !== '-' ? (
                                            <span className="inline-flex items-center space-x-1 text-[10px] text-slate-300 font-bold bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-700/80">
                                              <Clock className="h-2.5 w-2.5 text-amber-400 shrink-0" />
                                              <span>{postTime}</span>
                                            </span>
                                          ) : null;
                                        })()}
                                      </div>
                                    ) : (
                                      <span className="text-slate-500 text-xs italic">Pendente</span>
                                    )}
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
                      Consulta de Peso Pré-Treino, Peso Pós-Treino e Evolução Mensal (Ambos Pré-Treino)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-amber-500/20 bg-dark-card p-3 text-center">
                      <span className="text-[11px] font-bold text-amber-400 uppercase block">1º Peso do Mês (Média Pré)</span>
                      <span className="text-xl font-black text-slate-100">
                        {weightAnalytics.avgFirstMonthWeight ? `${weightAnalytics.avgFirstMonthWeight} kg` : '-'}
                      </span>
                    </div>

                    <div className="rounded-xl border border-cyan-500/20 bg-dark-card p-3 text-center">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase block">Último Peso do Mês (Média Pré)</span>
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
                      <p className="text-xs text-slate-400">Consulta de peso pré-treino, peso pós-treino, 1º/último pré do mês e variação fidedigna.</p>
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
                          <th className="py-2.5 px-3">Peso Matinal / Pré (kg)</th>
                          <th className="py-2.5 px-3">Peso Pós-Treino (kg)</th>
                          <th className="py-2.5 px-3">1º Peso do Mês (Pré)</th>
                          <th className="py-2.5 px-3">Último Peso do Mês (Pré)</th>
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
        ) : activeTab === 'matchMinutes' ? (
          <MatchMinutesDashboard />
        ) : activeTab === 'mobility' ? (
          <AdminMobilityManager />
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

            {/* Sub-Navigation Pills for PINs & Acessos */}
            <div className="flex flex-wrap gap-2 bg-dark-card/80 p-2 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setPinsSubTab('deadlines')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  pinsSubTab === 'deadlines'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                <span>Horários Limite & Deadlines</span>
              </button>

              <button
                type="button"
                onClick={() => setPinsSubTab('authorizations')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  pinsSubTab === 'authorizations'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold ring-1 ring-emerald-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                <span>Autorizações Individuais</span>
                {deadlineConfig.athleteLateAuthorizations && Object.keys(deadlineConfig.athleteLateAuthorizations).length > 0 && (
                  <span className="ml-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] text-emerald-300 font-extrabold border border-emerald-500/40">
                    {Object.keys(deadlineConfig.athleteLateAuthorizations).length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setPinsSubTab('playerPins')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  pinsSubTab === 'playerPins'
                    ? 'bg-rose-500 text-white shadow-md font-extrabold ring-1 ring-rose-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Users className="h-3.5 w-3.5 text-rose-400" />
                <span>PINs das Jogadoras</span>
                <span className="ml-1 rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] text-rose-300 font-extrabold">
                  {athletesList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPinsSubTab('credentials')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  pinsSubTab === 'credentials'
                    ? 'bg-slate-100 text-slate-950 shadow-md font-extrabold ring-1 ring-white/50'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                <span>Credenciais Mestres</span>
              </button>

              <button
                type="button"
                onClick={() => setPinsSubTab('all')}
                className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  pinsSubTab === 'all'
                    ? 'bg-slate-700 text-white shadow-md font-extrabold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5 text-slate-300" />
                <span>Ver Tudo</span>
              </button>
            </div>

            {/* 1. System Master Credentials Redefinition (Activation Code, Admin & Physio) */}
            {(pinsSubTab === 'credentials' || pinsSubTab === 'all') && (
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
            )}

            {/* 2. Mobile Notification & Reminders Settings Section (Desativado a pedido do utilizador) */}
            {false && (
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/20 via-dark-card to-dark-card p-4 space-y-4 shadow-lg animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
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

                {/* Jogadoras que ainda não ativaram notificações no telemóvel */}
                {(() => {
                  const subscribedAthleteIds = new Set(activeSubscribers.map((s) => s.athleteId).filter(Boolean));
                  const unregisteredAthletes = athletesList.filter((a) => !subscribedAthleteIds.has(a.id));

                  if (unregisteredAthletes.length === 0) {
                    return (
                      <div className="flex items-center space-x-2 text-[11px] font-bold text-emerald-400 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>Excelente! Todas as {athletesList.length} jogadoras do plantel têm notificações ativas no telemóvel.</span>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-[11px] font-black text-amber-300 flex items-center space-x-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <span>{unregisteredAthletes.length} jogadoras ainda não ativaram notificações no telemóvel:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const names = unregisteredAthletes.map((a) => a.name).join(', ');
                            const msg = `⚽ *GIL VICENTE FC • ATIVAÇÃO DE NOTIFICAÇÕES* ⚽\n\nMeninas, precisamos que ativem os alertas no telemóvel para receberem os lembretes com a app fechada:\n🔗 https://fem-performance-app.vercel.app\n\nJogadoras em falta: ${names}\n(No iPhone: Safari ➔ Partilhar ➔ Adicionar ao Ecrã Principal ➔ Ativar Alertas)`;
                            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="inline-flex items-center space-x-1 text-[10px] font-black text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/90 px-2.5 py-1 rounded-lg border border-emerald-500/40 transition-all active:scale-95"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Avisar Jogadoras no WhatsApp</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {unregisteredAthletes.map((ath) => (
                          <span
                            key={ath.id}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-950/50 text-amber-200 border border-amber-500/30 px-2 py-0.5 rounded-md"
                          >
                            <span>{ath.name}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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
                    <span>Disparo Manual Imediato de Notificações Push</span>
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
                      : '📢 ENVIAR NOTIFICAÇÃO PUSH PARA TODOS OS QUESTIONÁRIOS'}
                  </span>
                </button>

                {/* Botões Individuais por Categoria */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Ou enviar notificação push individual por questionário:
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

                {/* 100% RELIABLE WHATSAPP SQUAD REMINDER */}
                <div className="space-y-2 pt-3 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-black text-emerald-400 flex items-center space-x-1.5">
                      <MessageCircle className="h-4 w-4 text-emerald-400" />
                      <span>Lembrete de Equipa no WhatsApp (100% Infalível)</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      Disparo instantâneo com link direto da app para o grupo
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSendWhatsAppReminder('all')}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-emerald-950/40 flex items-center justify-center space-x-2 border border-emerald-400/40 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>📲 ENVIAR LEMBRETE NO GRUPO DO WHATSAPP (1 CLIQUE)</span>
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder('wellness')}
                      className="py-2 px-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/60 transition-all text-center cursor-pointer"
                    >
                      💬 WhatsApp Wellness
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder('preHydration')}
                      className="py-2 px-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/60 transition-all text-center cursor-pointer"
                    >
                      💬 WhatsApp Pré
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSendWhatsAppReminder('postTraining')}
                      className="py-2 px-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-[11px] font-bold hover:bg-emerald-900/60 transition-all text-center cursor-pointer"
                    >
                      💬 WhatsApp Pós / PSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* 2.5 Limitação de Horários de Preenchimento (Deadlines) */}
            {(pinsSubTab === 'deadlines' || pinsSubTab === 'all') && (
              <div className="rounded-2xl border border-amber-500/30 bg-dark-card p-4 space-y-4 shadow-lg animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
                      <span>Limitação de Horários de Preenchimento (Deadlines)</span>
                      {deadlineConfig.enabled && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black">
                          ATIVO
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Define a hora limite até à qual as atletas podem responder aos questionários nos smartphones.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdateDeadlineConfig({ enabled: !deadlineConfig.enabled })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all shrink-0 cursor-pointer ${
                    deadlineConfig.enabled
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black hover:bg-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {deadlineConfig.enabled ? '⏰ Limite Ativo' : '⚪ Sem Limite (Desativado)'}
                </button>
              </div>

              {deadlineConfig.enabled && (
                <div className="space-y-4 animate-fade-in">
                  {/* Mode Selector & Action Selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Mode Selector: Horas Fixas vs Relativo ao Treino */}
                    <div className="space-y-1.5 bg-dark-bg/60 p-3 rounded-xl border border-slate-800">
                      <label className="text-[11px] font-extrabold uppercase text-slate-300 block">
                        1. Modo de Cálculo em Dias de Treino:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateDeadlineConfig({ mode: 'fixed' })}
                          className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all text-center cursor-pointer ${
                            deadlineConfig.mode === 'fixed'
                              ? 'border-amber-500 bg-amber-950/70 text-amber-200 ring-2 ring-amber-500/40'
                              : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span className="block font-black">🕒 Hora Fixa</span>
                          <span className="text-[10px] text-slate-400 font-normal">Sempre à mesma hora</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateDeadlineConfig({ mode: 'relative_to_session' })}
                          className={`p-2.5 rounded-xl border text-xs font-extrabold transition-all text-center cursor-pointer ${
                            deadlineConfig.mode === 'relative_to_session'
                              ? 'border-cyan-500 bg-cyan-950/70 text-cyan-200 ring-2 ring-cyan-500/40'
                              : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span className="block font-black">⚡ Relativo ao Treino</span>
                          <span className="text-[10px] text-slate-400 font-normal">Ajusta à hora do treino</span>
                        </button>
                      </div>
                    </div>

                    {/* Action: Strict Block vs Allow with Approval vs Allow Direct */}
                    <div className="space-y-1.5 bg-dark-bg/60 p-3 rounded-xl border border-slate-800 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold uppercase text-slate-300 block">
                          2. Política de Submissão Fora do Horário Limite:
                        </label>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Configura como o sistema lida com respostas após a hora limite
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateDeadlineConfig({ strictBlock: true, allowLateWithApproval: false })}
                          className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-left cursor-pointer ${
                            Boolean(deadlineConfig.strictBlock)
                              ? 'border-red-500 bg-red-950/70 text-red-200 ring-2 ring-red-500/40 shadow-md'
                              : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">🔒</span>
                            <span className="block font-black text-slate-100">Bloqueio Estrito</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal block mt-1 leading-snug">
                            O questionário bloqueia totalmente após a hora limite (exceto para atletas com autorização VIP individual).
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateDeadlineConfig({ strictBlock: false, allowLateWithApproval: true })}
                          className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-left cursor-pointer ${
                            !deadlineConfig.strictBlock && Boolean(deadlineConfig.allowLateWithApproval)
                              ? 'border-brand-cyan bg-cyan-950/70 text-cyan-200 ring-2 ring-brand-cyan/40 shadow-md'
                              : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">📋</span>
                            <span className="block font-black text-slate-100">Permitir c/ Validação</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal block mt-1 leading-snug">
                            A atleta consegue preencher, mas a submissão fica <strong className="text-amber-300 font-semibold">pendente</strong> até o treinador aceitar ou recusar.
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateDeadlineConfig({ strictBlock: false, allowLateWithApproval: false })}
                          className={`p-3 rounded-xl border text-xs font-extrabold transition-all text-left cursor-pointer ${
                            !deadlineConfig.strictBlock && !deadlineConfig.allowLateWithApproval
                              ? 'border-amber-500 bg-amber-950/70 text-amber-200 ring-2 ring-amber-500/40 shadow-md'
                              : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm">⚠️</span>
                            <span className="block font-black text-slate-100">Permitir Direto</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal block mt-1 leading-snug">
                            Aceita automaticamente mesmo fora de horas, ficando registada com etiqueta de atraso sem necessitar de validação manual.
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* General Config Boxes: Distinct for Wellness and PSE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Wellness Box */}
                    <div className="bg-dark-bg/60 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center space-x-1.5 text-amber-300 font-extrabold text-xs">
                          <span>☀️ Regra Geral: Wellness (Matinal)</span>
                        </div>
                        <label className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deadlineConfig.applyToWellness}
                            onChange={(e) => handleUpdateDeadlineConfig({ applyToWellness: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-800 text-amber-500 h-3.5 w-3.5"
                          />
                          <span>Ativo</span>
                        </label>
                      </div>

                      {deadlineConfig.mode === 'fixed' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-300 block">⚽ Limite Dias Treino:</span>
                            <input
                              type="time"
                              value={deadlineConfig.wellnessRegularTime || deadlineConfig.defaultRegularTime || '08:15'}
                              onChange={(e) => handleUpdateDeadlineConfig({ wellnessRegularTime: e.target.value })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-500 block">Antes do treino matinal</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 block">🏆 Limite Dia de Jogo:</span>
                            <input
                              type="time"
                              value={deadlineConfig.wellnessMatchTime || deadlineConfig.defaultMatchTime || '12:00'}
                              onChange={(e) => handleUpdateDeadlineConfig({ wellnessMatchTime: e.target.value })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-emerald-200 focus:border-emerald-400 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-500 block">Manhã de Match Day</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-cyan-300 block">⚡ Antecedência ao Treino:</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min={15}
                              max={300}
                              step={15}
                              value={deadlineConfig.wellnessRelativeMinutesBefore || 60}
                              onChange={(e) => handleUpdateDeadlineConfig({ wellnessRelativeMinutesBefore: parseInt(e.target.value, 10) || 60 })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-cyan-500 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">min antes</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">Ex: 60 min antes do início do treino</span>
                        </div>
                      )}
                    </div>

                    {/* PSE (RPE) Box */}
                    <div className="bg-dark-bg/60 p-3.5 rounded-xl border border-cyan-500/30 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <div className="flex items-center space-x-1.5 text-cyan-300 font-extrabold text-xs">
                          <span>⚡ Regra Geral: PSE / RPE (Pós-Treino)</span>
                        </div>
                        <label className="inline-flex items-center space-x-1 text-[11px] font-bold text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deadlineConfig.applyToRpe}
                            onChange={(e) => handleUpdateDeadlineConfig({ applyToRpe: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-800 text-cyan-500 h-3.5 w-3.5"
                          />
                          <span>Ativo</span>
                        </label>
                      </div>

                      {deadlineConfig.mode === 'fixed' ? (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-300 block">⚽ Limite Dias Treino:</span>
                            <input
                              type="time"
                              value={deadlineConfig.rpeRegularTime || '14:00'}
                              onChange={(e) => handleUpdateDeadlineConfig({ rpeRegularTime: e.target.value })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-cyan-500 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-500 block">Pós-treino habitual</span>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-400 block">🏆 Limite Dia de Jogo:</span>
                            <input
                              type="time"
                              value={deadlineConfig.rpeMatchTime || '18:30'}
                              onChange={(e) => handleUpdateDeadlineConfig({ rpeMatchTime: e.target.value })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-emerald-200 focus:border-emerald-400 focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-500 block">Após o apito final</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-cyan-300 block">⚡ Tolerância Pós-Treino:</span>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              min={15}
                              max={600}
                              step={15}
                              value={deadlineConfig.rpeRelativeMinutesAfter || 90}
                              onChange={(e) => handleUpdateDeadlineConfig({ rpeRelativeMinutesAfter: parseInt(e.target.value, 10) || 90 })}
                              className="w-full rounded-lg border border-slate-700 bg-dark-card p-2 text-xs font-bold text-slate-100 focus:border-cyan-500 focus:outline-none"
                            />
                            <span className="text-xs font-bold text-slate-400">min após fim</span>
                          </div>
                          <span className="text-[10px] text-slate-500 block">Ex: 90 min após o apito final / fim</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Exceções por Treino / Data Específica */}
                  {(() => {
                    const allSessions = typeof window !== 'undefined' ? getStoredTrainingSessions() : {};
                    const currentSelectedSession = allSessions[specificDateInput];

                    // Combined unique dates from all custom deadline maps
                    const allDateKeys = Array.from(new Set([
                      ...Object.keys(deadlineConfig.customDateDeadlinesWellness || {}),
                      ...Object.keys(deadlineConfig.customDateDeadlinesRpe || {}),
                      ...Object.keys(deadlineConfig.customDateDeadlines || {}),
                    ])).sort((a, b) => a.localeCompare(b));

                    return (
                      <div className="rounded-xl border border-amber-500/40 bg-dark-bg/80 p-3.5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-amber-400" />
                            <span className="text-xs font-black uppercase text-slate-200">
                              3. Definir Horários para um Treino em Específico
                            </span>
                          </div>
                          <span className="text-[11px] text-amber-300 font-semibold">
                            Permite definir horas diferentes para Wellness e PSE neste treino
                          </span>
                        </div>

                        {/* Interactive Form to add/edit exception */}
                        <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                          {/* Row 1: Date & Session Info */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <label className="text-[11px] font-bold text-slate-300 shrink-0">
                                Data do Treino:
                              </label>
                              <input
                                type="date"
                                value={specificDateInput}
                                onChange={(e) => {
                                  const newDate = e.target.value;
                                  setSpecificDateInput(newDate);

                                  // Load specific wellness or fallback
                                  if (deadlineConfig.customDateDeadlinesWellness?.[newDate]) {
                                    setSpecificWellnessTime(deadlineConfig.customDateDeadlinesWellness[newDate]);
                                  } else if (deadlineConfig.customDateDeadlines?.[newDate]) {
                                    setSpecificWellnessTime(deadlineConfig.customDateDeadlines[newDate]);
                                  } else {
                                    const s = allSessions[newDate];
                                    if (s?.startTime) {
                                      const [h, m] = s.startTime.split(':').map(Number);
                                      const target = Math.max(0, (h * 60 + m) - 60);
                                      setSpecificWellnessTime(`${String(Math.floor(target / 60)).padStart(2, '0')}:${String(target % 60).padStart(2, '0')}`);
                                    } else {
                                      setSpecificWellnessTime(deadlineConfig.wellnessRegularTime || '08:15');
                                    }
                                  }

                                  // Load specific RPE
                                  if (deadlineConfig.customDateDeadlinesRpe?.[newDate]) {
                                    setSpecificRpeTime(deadlineConfig.customDateDeadlinesRpe[newDate]);
                                  } else {
                                    const s = allSessions[newDate];
                                    if (s?.endTime) {
                                      const [h, m] = s.endTime.split(':').map(Number);
                                      const target = Math.min(1439, (h * 60 + m) + 90);
                                      setSpecificRpeTime(`${String(Math.floor(target / 60)).padStart(2, '0')}:${String(target % 60).padStart(2, '0')}`);
                                    } else {
                                      setSpecificRpeTime(deadlineConfig.rpeRegularTime || '14:00');
                                    }
                                  }
                                }}
                                className="rounded-lg border border-slate-700 bg-dark-card p-1.5 text-xs font-bold text-slate-100 focus:border-amber-500 focus:outline-none"
                              />
                            </div>

                            {currentSelectedSession && (
                              <span className="text-[11px] text-slate-300 bg-dark-bg px-2.5 py-1 rounded-md border border-slate-700">
                                {currentSelectedSession.dayType === 'match' ? '🏆 Jogo' : '⚽ Treino'}:{' '}
                                <strong>{currentSelectedSession.startTime} - {currentSelectedSession.endTime || '?'}</strong>
                              </span>
                            )}
                          </div>

                          {/* Row 2: Wellness Time & RPE Time side-by-side */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Wellness Input */}
                            <div className="space-y-1.5 p-2.5 rounded-lg bg-dark-bg/60 border border-amber-500/30">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-amber-300">
                                  ☀️ Limite Wellness (Matinal):
                                </span>
                              </div>
                              <input
                                type="time"
                                value={specificWellnessTime}
                                onChange={(e) => setSpecificWellnessTime(e.target.value)}
                                className="w-full rounded-lg border border-amber-500/40 bg-dark-card p-2 text-xs font-bold text-amber-200 focus:border-amber-400 focus:outline-none"
                              />
                              <div className="flex flex-wrap gap-1.5 text-[10px] pt-1">
                                <button
                                  type="button"
                                  onClick={() => setSpecificWellnessTime('08:15')}
                                  className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-900/60 cursor-pointer"
                                >
                                  08:15
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSpecificWellnessTime('12:00')}
                                  className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-900/60 cursor-pointer"
                                >
                                  12:00 (Jogo)
                                </button>
                                {currentSelectedSession?.startTime && (() => {
                                  const [h, m] = currentSelectedSession.startTime.split(':').map(Number);
                                  const target1h = Math.max(0, (h * 60 + m) - 60);
                                  const time1h = `${String(Math.floor(target1h / 60)).padStart(2, '0')}:${String(target1h % 60).padStart(2, '0')}`;
                                  return (
                                    <button
                                      type="button"
                                      onClick={() => setSpecificWellnessTime(time1h)}
                                      className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold hover:bg-amber-900/60 cursor-pointer"
                                    >
                                      ⚡ 1h antes ({time1h})
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>

                            {/* RPE Input */}
                            <div className="space-y-1.5 p-2.5 rounded-lg bg-dark-bg/60 border border-cyan-500/30">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-cyan-300">
                                  ⚡ Limite PSE / RPE (Pós-Treino):
                                </span>
                              </div>
                              <input
                                type="time"
                                value={specificRpeTime}
                                onChange={(e) => setSpecificRpeTime(e.target.value)}
                                className="w-full rounded-lg border border-cyan-500/40 bg-dark-card p-2 text-xs font-bold text-cyan-200 focus:border-cyan-400 focus:outline-none"
                              />
                              {(() => {
                                const base = currentSelectedSession?.endTime || currentSelectedSession?.startTime;
                                if (base) {
                                  const [h, m] = base.split(':').map(Number);
                                  const target1h = Math.min(1439, (h * 60 + m) + 60);
                                  const time1h = `${String(Math.floor(target1h / 60)).padStart(2, '0')}:${String(target1h % 60).padStart(2, '0')}`;
                                  const target2h = Math.min(1439, (h * 60 + m) + 120);
                                  const time2h = `${String(Math.floor(target2h / 60)).padStart(2, '0')}:${String(target2h % 60).padStart(2, '0')}`;
                                  return (
                                    <div className="flex gap-1.5 text-[10px] pt-1">
                                      <button
                                        type="button"
                                        onClick={() => setSpecificRpeTime(time1h)}
                                        className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-900/60 cursor-pointer"
                                      >
                                        ⚡ +1h ({time1h})
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setSpecificRpeTime(time2h)}
                                        className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-900/60 cursor-pointer"
                                      >
                                        ⚡ +2h ({time2h})
                                      </button>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="flex gap-1.5 text-[10px] pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setSpecificRpeTime('14:00')}
                                      className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-900/60 cursor-pointer"
                                    >
                                      14:00
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSpecificRpeTime('18:30')}
                                      className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold hover:bg-emerald-900/60 cursor-pointer"
                                    >
                                      18:30 (Jogo)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSpecificRpeTime('22:00')}
                                      className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold hover:bg-cyan-900/60 cursor-pointer"
                                    >
                                      22:00 (Noite)
                                    </button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Row 3: Submit Button */}
                          <button
                            type="button"
                            onClick={handleSaveSpecificDeadline}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                          >
                            <Check className="h-4 w-4 stroke-[3]" />
                            <span>Guardar Horários para este Treino</span>
                          </button>

                          {/* Feedback Toast */}
                          {specificExceptionToast && (
                            <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in flex items-center space-x-2">
                              <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                              <span>{specificExceptionToast}</span>
                            </div>
                          )}
                        </div>

                        {/* Active Exceptions List */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                            <span>Treinos com Horários Personalizados:</span>
                            <span>{allDateKeys.length} treino(s)</span>
                          </div>

                          {allDateKeys.length === 0 ? (
                            <div className="text-slate-400 text-xs italic bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">
                              Nenhum treino com limite específico definido. Todos os treinos seguem as regras gerais.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {allDateKeys.map((dateKey) => {
                                const s = allSessions[dateKey];
                                const wTime = deadlineConfig.customDateDeadlinesWellness?.[dateKey] || deadlineConfig.customDateDeadlines?.[dateKey];
                                const rTime = deadlineConfig.customDateDeadlinesRpe?.[dateKey];

                                return (
                                  <div
                                    key={dateKey}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs"
                                  >
                                    <div className="flex items-center space-x-2 truncate">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                                        <Calendar className="h-4 w-4" />
                                      </div>
                                      <div className="truncate">
                                        <span className="font-black text-slate-200 block truncate">
                                          {dateKey}
                                        </span>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                          {s ? `${s.dayType === 'match' ? 'Jogo' : 'Treino'} às ${s.startTime}` : 'Exceção Diária'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center space-x-2 shrink-0 ml-2">
                                      <div className="flex flex-col items-end gap-1">
                                        {wTime && (
                                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black text-[10px]">
                                            ☀️ {wTime}
                                          </span>
                                        )}
                                        {rTime && (
                                          <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-black text-[10px]">
                                            ⚡ {rTime}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSpecificDeadline(dateKey)}
                                        className="p-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:text-red-200 transition-all text-xs cursor-pointer"
                                        title="Remover limite deste treino e voltar à regra geral"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

            {/* 4. Autorizações Individuais para Submissão Fora de Horas */}
            {(pinsSubTab === 'authorizations' || pinsSubTab === 'all') && (
              <div className="rounded-2xl border border-emerald-500/30 bg-dark-card p-4 space-y-4 shadow-lg animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Unlock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        <span>Autorização Individual por Jogadora (Submeter Após Prazo)</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">
                          VIP / Exceção
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Autorize uma atleta específica a submeter os questionários mesmo que o prazo já tenha terminado e o bloqueio estrito esteja ativo.
                      </p>
                    </div>
                  </div>
                </div>

                    {/* Selector & Form */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Selecionar Jogadora:
                        </label>
                        <select
                          value={selectedAuthAthleteId}
                          onChange={(e) => setSelectedAuthAthleteId(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="">-- Escolher Jogadora --</option>
                          {athletesList.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name} ({a.position || 'Geral'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Validade da Autorização:
                        </label>
                        <select
                          value={authScopeType}
                          onChange={(e) => setAuthScopeType(e.target.value as 'today' | 'date' | 'permanent')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="today">Apenas Hoje ({getTodayLocalDateStr()})</option>
                          <option value="date">Data Específica...</option>
                          <option value="permanent">Permanente (Sempre Autorizada)</option>
                        </select>
                        {authScopeType === 'date' && (
                          <input
                            type="date"
                            value={authCustomDate}
                            onChange={(e) => setAuthCustomDate(e.target.value)}
                            className="w-full mt-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Questionários:
                        </label>
                        <select
                          value={authQuestionnaireType}
                          onChange={(e) => setAuthQuestionnaireType(e.target.value as 'all' | 'wellness' | 'rpe')}
                          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                          <option value="all">Todos (Wellness + PSE)</option>
                          <option value="wellness">Apenas Wellness (Manhã)</option>
                          <option value="rpe">Apenas PSE (Pós-Treino)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3 pt-1">
                        <button
                          type="button"
                          disabled={!selectedAuthAthleteId}
                          onClick={() => handleGrantAthleteAuthorization()}
                          className={`w-full py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                            selectedAuthAthleteId
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          }`}
                        >
                          <Unlock className="h-4 w-4" />
                          <span>Conceder Autorização para Submissão Fora do Prazo</span>
                        </button>
                      </div>
                    </div>

                    {/* Toast */}
                    {authToast && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in flex items-center space-x-2">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{authToast}</span>
                      </div>
                    )}

                    {/* List of Active Authorizations */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold px-1">
                        <span>Autorizações Ativas no Sistema:</span>
                        <span>
                          {Object.keys(deadlineConfig.athleteLateAuthorizations || {}).length} registadas
                        </span>
                      </div>

                      {Object.keys(deadlineConfig.athleteLateAuthorizations || {}).length === 0 ? (
                        <div className="text-slate-400 text-xs italic bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">
                          Nenhuma atleta tem autorização especial ativa no momento. Todas estão sujeitas ao horário de fecho estrito.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(deadlineConfig.athleteLateAuthorizations || {}).map(([key, auth]) => {
                            const ath = athletesList.find((a) => a.id === auth.athleteId);
                            const qTypeLabel =
                              auth.questionnaireType === 'wellness'
                                ? 'Apenas Wellness'
                                : auth.questionnaireType === 'rpe'
                                ? 'Apenas PSE'
                                : 'Todos (Wellness + PSE)';

                            const scopeLabel = auth.date ? `Dia ${auth.date}` : 'Permanente (Sem Prazo)';

                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-xs"
                              >
                                <div className="flex items-center space-x-2.5 truncate">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                    <UserCheck className="h-4 w-4" />
                                  </div>
                                  <div className="truncate">
                                    <span className="font-black text-slate-100 block truncate">
                                      {auth.athleteName || ath?.name || auth.athleteId}
                                    </span>
                                    <span className="text-[10px] text-emerald-300 block truncate font-medium">
                                      🔓 {scopeLabel} • {qTypeLabel}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRevokeAthleteAuthorization(auth.athleteId, auth.date)}
                                  className="p-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:text-red-200 transition-all text-xs cursor-pointer shrink-0 ml-2"
                                  title="Revogar autorização e bloquear submissão tardia"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Quick Access Roster Search */}
                    <div className="mt-2 pt-2 border-t border-slate-800/80">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <span>Acesso Rápido por Jogadora</span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            (Clique para autorizar hoje em 1 toque)
                          </span>
                        </span>
                        <div className="relative w-40 sm:w-52">
                          <input
                            type="text"
                            placeholder="Filtrar jogadora..."
                            value={authSearchQuery}
                            onChange={(e) => setAuthSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                          <Search className="h-3 w-3 text-slate-500 absolute left-2 top-2" />
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                        {athletesList
                          .filter((a) => !authSearchQuery || a.name.toLowerCase().includes(authSearchQuery.toLowerCase()))
                          .map((athlete) => {
                            const isAuthToday = isAthleteAuthorizedForLateSubmission(athlete.id, getTodayLocalDateStr());
                            const isAuthPermanent = isAthleteAuthorizedForLateSubmission(athlete.id);

                            return (
                              <div
                                key={athlete.id}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-800/50 text-xs transition-colors"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <div className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">
                                    {athlete.name.charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <span className="text-slate-200 font-medium truncate block">
                                      {athlete.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {athlete.position || 'Geral'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                                  {isAuthToday || isAuthPermanent ? (
                                    <div className="flex items-center space-x-1">
                                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px]">
                                        🔓 Autorizada {isAuthPermanent ? 'Permanente' : 'Hoje'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRevokeAthleteAuthorization(athlete.id, isAuthPermanent ? undefined : getTodayLocalDateStr())}
                                        className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/50 hover:text-red-200 text-[10px] font-bold cursor-pointer transition-all"
                                      >
                                        Bloquear
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleGrantAthleteAuthorization(athlete.id)}
                                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 hover:border-emerald-500 text-[11px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                                    >
                                      <Unlock className="h-3 w-3" />
                                      <span>Autorizar Hoje</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="flex items-center space-x-1.5">
                      <span className="text-amber-400">💡</span>
                      <span>
                        Pode também ajustar a hora limite diretamente ao criar ou editar qualquer treino no separador <strong>Sessões / Calendário</strong>.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTabState('schedule');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      <span>Abrir Calendário de Treinos</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

            {/* 5. Tabela de Gestão do Plantel, Perfis & PINs */}
            {(pinsSubTab === 'playerPins' || pinsSubTab === 'all') && (
              <div className="rounded-2xl border border-rose-500/30 bg-dark-card p-4 space-y-4 shadow-lg animate-fade-in">
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
                              <div className="flex flex-col">
                                <span className="text-xs font-black">
                                  {athlete.name}
                                </span>
                              </div>
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
                                  onClick={() => handleSendWhatsAppReminder('all', athlete.name)}
                                  title={`Enviar lembrete individual no WhatsApp para ${athlete.name}`}
                                  className="flex items-center space-x-1 rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-2.5 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-900/80 transition-all shadow-sm active:scale-95"
                                >
                                  <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </button>

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
            )}
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

      {/* Kiosk Mode Overlay (iPad / Balneário / Qualquer dispositivo com conta admin) */}
      {isKioskOpen && (
        <KioskModeView
          onClose={() => setIsKioskOpen(false)}
          athletes={athletesList}
          wellnessList={allWellnessList.length > 0 ? allWellnessList : wellnessList}
          rpeList={allRpeList.length > 0 ? allRpeList : rpeList}
          hydrationList={allHydrationList.length > 0 ? allHydrationList : hydrationList}
        />
      )}
      </div>
    </div>
  );
};
