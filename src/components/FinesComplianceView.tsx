'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, AthleteComplianceReport, Athlete, IndividualFineExemption } from '@/lib/types';
import { getDynamicAthletes } from '@/lib/storage';
import { useLanguage } from '@/context/LanguageContext';
import {
  getStoredCalendarSchedule,
  saveCalendarSchedule,
  CalendarDayType,
  getStoredFinesEnabledDays,
  saveFinesEnabledDays,
  DayFineConfig,
  normalizeDayFineConfig,
  isDayAnyFineActive,
  getEffectiveDeadlineForDate,
  getStoredDeadlineConfig,
  saveDeadlineConfig,
  getStoredTrainingSessions,
  saveTrainingSessionInfo,
  getStoredFineExemptions,
  saveFineExemption,
  saveFineExemptions,
  removeFineExemption,
  isFineExempt,
  approveWellnessSubmission,
  approveRPESubmission
} from '@/lib/storage';
import { secureFetch } from '@/lib/authGuard';
import {
  AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Copy,
  Euro, ShieldAlert, Sparkles, UserX, Dumbbell, Coffee, FileSpreadsheet, Trophy, Check, X,
  HeartPulse, Scale, Settings2, Clock, Trash2, RotateCcw, LayoutGrid, List, Users
} from 'lucide-react';

interface FinesComplianceViewProps {
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  hydrationList: HydrationEntry[];
}

export const FinesComplianceView: React.FC<FinesComplianceViewProps> = ({
  wellnessList,
  rpeList,
  hydrationList,
}) => {
  const { t } = useLanguage();

  const [athletes, setAthletes] = useState<Athlete[]>(() => getDynamicAthletes());

  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    handleUpdate();
    window.addEventListener('femperf_credentials_updated', handleUpdate);
    return () => window.removeEventListener('femperf_credentials_updated', handleUpdate);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7) // YYYY-MM
  );
  const [finePerFault, setFinePerFault] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('femperf_fine_per_fault');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 1.0;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_fine_per_fault', finePerFault.toString());
    }
  }, [finePerFault]);
  const [expandedAthleteId, setExpandedAthleteId] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Sub-navigation state: 'table' | 'calendar' | 'summary' | 'all'
  const [finesSubTab, setFinesSubTab] = useState<'table' | 'calendar' | 'summary' | 'all'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('femperf_fines_sub_tab');
      if (saved === 'table' || saved === 'calendar' || saved === 'summary' || saved === 'all') {
        return saved;
      }
    }
    return 'table';
  });

  const handleSubTabChange = (tab: 'table' | 'calendar' | 'summary' | 'all') => {
    setFinesSubTab(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_fines_sub_tab', tab);
    }
  };

  // Saved manual calendar schedule overrides (dateStr -> 'training' | 'match' | 'rest')
  const [manualDayTypes, setManualDayTypes] = useState<Record<string, CalendarDayType>>({});

  // Fine enabled status per date (dateStr -> boolean | DayFineConfig)
  const [finesEnabledDays, setFinesEnabledDays] = useState<Record<string, boolean | DayFineConfig>>({});
  const [configuringDate, setConfiguringDate] = useState<string | null>(null);
  const [modalFineConfig, setModalFineConfig] = useState<DayFineConfig>({
    wellness: true,
    rpe: true,
    hydration: true,
  });
  const [modalWellnessTime, setModalWellnessTime] = useState<string>('08:15');
  const [modalRpeTime, setModalRpeTime] = useState<string>('14:00');

  // Individual fine exemptions (athleteId_date_type -> IndividualFineExemption)
  const [fineExemptions, setFineExemptions] = useState<Record<string, IndividualFineExemption>>(() => getStoredFineExemptions());
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    setManualDayTypes(getStoredCalendarSchedule());
    setFinesEnabledDays(getStoredFinesEnabledDays());
    setFineExemptions(getStoredFineExemptions());

    const handleDataUpdate = () => {
      setManualDayTypes(getStoredCalendarSchedule());
      setFinesEnabledDays(getStoredFinesEnabledDays());
      setFineExemptions(getStoredFineExemptions());
    };

    window.addEventListener('femperf_credentials_updated', handleDataUpdate);
    window.addEventListener('femperf_data_updated', handleDataUpdate);
    window.addEventListener('femperf_fines_updated', handleDataUpdate);

    secureFetch('/api/training-sessions')
      .then((res) => res.json())
      .then((data) => {
        const remoteSchedule = data?.schedule || data?.data?.schedule;
        if (remoteSchedule) {
          setManualDayTypes((prev) => ({ ...prev, ...remoteSchedule }));
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('femperf_credentials_updated', handleDataUpdate);
      window.removeEventListener('femperf_data_updated', handleDataUpdate);
      window.removeEventListener('femperf_fines_updated', handleDataUpdate);
    };
  }, []);

  // Eliminate fine individually for an athlete on a specific date
  const handleEliminateFine = (
    athleteId: string,
    athleteName: string,
    date: string,
    type: 'wellness' | 'rpe' | 'hydration' | 'all'
  ) => {
    // If an approved submission exists with keepFine, also set keepFine to false
    if (type === 'wellness' || type === 'all') {
      const wEntry = wellnessList.find(
        (w) => w.date === date && (w.athleteId === athleteId || w.athleteName === athleteName)
      );
      if (wEntry && wEntry.keepFine) {
        approveWellnessSubmission(wEntry.id, 'Treinador', false);
      }
    }
    if (type === 'rpe' || type === 'all') {
      const rEntry = rpeList.find(
        (r) => r.date === date && (r.athleteId === athleteId || r.athleteName === athleteName)
      );
      if (rEntry && rEntry.keepFine) {
        approveRPESubmission(rEntry.id, 'Treinador', false);
      }
    }

    const newExemption: IndividualFineExemption = {
      id: `${athleteId}_${date}_${type}`,
      athleteId,
      athleteName,
      date,
      type,
      waivedAt: new Date().toISOString(),
      reason: 'Eliminada pelo treinador',
    };

    saveFineExemption(newExemption);
    setFineExemptions(getStoredFineExemptions());

    const typeLabel =
      type === 'wellness'
        ? 'Falta Wellness'
        : type === 'rpe'
        ? 'Falta PSE'
        : type === 'hydration'
        ? 'Falta Pesagem'
        : 'Multa';

    setActionFeedback(`✓ ${typeLabel} (${date}) eliminada com sucesso para ${athleteName}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Eliminate all fines in month atomically for an athlete
  const handleEliminateAllFinesForAthlete = (
    athleteId: string,
    athleteName: string,
    failedDates: AthleteComplianceReport['failedDates']
  ) => {
    if (!failedDates || failedDates.length === 0) return;

    // 1. Clear keepFine on any existing approved late questionnaires
    failedDates.forEach((fd) => {
      const wEntry = wellnessList.find(
        (w) => w.date === fd.date && (w.athleteId === athleteId || w.athleteName === athleteName)
      );
      if (wEntry && wEntry.keepFine) {
        approveWellnessSubmission(wEntry.id, 'Treinador', false);
      }
      const rEntry = rpeList.find(
        (r) => r.date === fd.date && (r.athleteId === athleteId || r.athleteName === athleteName)
      );
      if (rEntry && rEntry.keepFine) {
        approveRPESubmission(rEntry.id, 'Treinador', false);
      }
    });

    // 2. Build exemptions list for all dates
    const exemptionsToSave: IndividualFineExemption[] = failedDates.map((fd) => ({
      id: `${athleteId}_${fd.date}_all`,
      athleteId,
      athleteName,
      date: fd.date,
      type: 'all',
      waivedAt: new Date().toISOString(),
      reason: 'Eliminada pelo treinador',
    }));

    saveFineExemptions(exemptionsToSave);
    setFineExemptions(getStoredFineExemptions());

    setActionFeedback(`✓ Todas as ${failedDates.length} datas de multa eliminadas com sucesso para ${athleteName}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Restore/re-activate fine individually
  const handleRestoreFine = (
    athleteId: string,
    athleteName: string,
    date: string,
    type: 'wellness' | 'rpe' | 'hydration' | 'all'
  ) => {
    removeFineExemption(athleteId, date, type);
    setFineExemptions(getStoredFineExemptions());

    const typeLabel =
      type === 'wellness'
        ? 'Falta Wellness'
        : type === 'rpe'
        ? 'Falta PSE'
        : type === 'hydration'
        ? 'Falta Pesagem'
        : 'Multa';

    setActionFeedback(`✓ ${typeLabel} (${date}) restaurada para ${athleteName}.`);
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'strip'>('grid');

  // Get all days in selected month (full month from 1 to end of month)
  const datesInMonth = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const daysCount = new Date(year, month, 0).getDate();
    const list: string[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${yearStr}-${monthStr.padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      list.push(dateStr);
    }
    return list;
  }, [selectedMonth]);

  const calendarMonthData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const firstDate = new Date(year, month - 1, 1);
    let startingDayOfWeek = firstDate.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const paddingLeading: null[] = Array(startingDayOfWeek).fill(null);
    const totalCells = paddingLeading.length + datesInMonth.length;
    const trailingCount = (7 - (totalCells % 7)) % 7;
    const paddingTrailing: null[] = Array(trailingCount).fill(null);

    return {
      paddingLeading,
      paddingTrailing,
    };
  }, [selectedMonth, datesInMonth]);

  // Determine day type for each date ('training' | 'match' | 'rest')
  const dayTypesMap = useMemo(() => {
    const map: Record<string, CalendarDayType> = {};

    datesInMonth.forEach((dateStr) => {
      if (manualDayTypes[dateStr] !== undefined) {
        map[dateStr] = manualDayTypes[dateStr];
      } else {
        // Auto-detect: check entries
        const hasWellness = wellnessList.some((w) => w.date === dateStr);
        const hasRPE = rpeList.some((r) => r.date === dateStr);
        const hasHydration = hydrationList.some((h) => h.date === dateStr);
        const isMatch = rpeList.some((r) => r.date === dateStr && r.matchDayOffset === 'MD');

        if (isMatch) {
          map[dateStr] = 'match';
        } else if (hasWellness || hasRPE || hasHydration) {
          map[dateStr] = 'training';
        } else {
          map[dateStr] = 'rest';
        }
      }
    });

    return map;
  }, [datesInMonth, manualDayTypes, wellnessList, rpeList, hydrationList]);

  // Fine config map per date (DayFineConfig for every date in month)
  const finesConfigMap = useMemo(() => {
    const map: Record<string, DayFineConfig> = {};
    datesInMonth.forEach((dateStr) => {
      map[dateStr] = normalizeDayFineConfig(finesEnabledDays[dateStr], dayTypesMap[dateStr]);
    });
    return map;
  }, [datesInMonth, finesEnabledDays, dayTypesMap]);

  // Fine status map per date (true if ANY questionnaire gives fine on that date)
  const finesEnabledMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    datesInMonth.forEach((dateStr) => {
      map[dateStr] = isDayAnyFineActive(finesConfigMap[dateStr]);
    });
    return map;
  }, [datesInMonth, finesConfigMap]);

  // All dates where at least one fine is active in month
  const fineActiveDates = useMemo(() => {
    return datesInMonth.filter((dateStr) => finesEnabledMap[dateStr] === true);
  }, [datesInMonth, finesEnabledMap]);

  // Fine active dates up to today (for fine/compliance calculation)
  const pastAndTodayFineActiveDates = useMemo(() => {
    return fineActiveDates.filter((dateStr) => dateStr <= todayStr);
  }, [fineActiveDates, todayStr]);

  const totalTrainingsCount = useMemo(() => {
    return datesInMonth.filter((dStr) => dayTypesMap[dStr] === 'training').length;
  }, [datesInMonth, dayTypesMap]);

  const totalMatchesCount = useMemo(() => {
    return datesInMonth.filter((dStr) => dayTypesMap[dStr] === 'match').length;
  }, [datesInMonth, dayTypesMap]);

  // Cycle day type: Treino (⚽) -> Jogo (🏆) -> Folga (🏖️) -> Treino (⚽) and persist in localStorage
  const cycleDayType = (dateStr: string) => {
    const current = dayTypesMap[dateStr] || 'rest';
    let next: CalendarDayType = 'training';
    if (current === 'training') {
      next = 'match';
    } else if (current === 'match') {
      next = 'rest';
    } else {
      next = 'training';
    }

    const updatedSchedule = {
      ...manualDayTypes,
      [dateStr]: next,
    };

    setManualDayTypes(updatedSchedule);
    saveCalendarSchedule(updatedSchedule);
  };

  // Open fine configuration modal for a specific date
  const handleOpenConfigModal = (dateStr: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const currentCfg = finesConfigMap[dateStr] || normalizeDayFineConfig(finesEnabledDays[dateStr], dayTypesMap[dateStr]);
    setModalFineConfig({ ...currentCfg });

    const dCfg = getStoredDeadlineConfig();
    const sessions = getStoredTrainingSessions();
    const s = sessions[dateStr];
    const effW = getEffectiveDeadlineForDate(dateStr, 'wellness');
    const effR = getEffectiveDeadlineForDate(dateStr, 'rpe');

    setModalWellnessTime(
      dCfg.customDateDeadlinesWellness?.[dateStr] ||
      s?.customDeadlineWellness ||
      dCfg.customDateDeadlines?.[dateStr] ||
      effW.deadlineTime ||
      (dayTypesMap[dateStr] === 'match' ? '12:00' : '08:15')
    );

    setModalRpeTime(
      dCfg.customDateDeadlinesRpe?.[dateStr] ||
      s?.customDeadlineRpe ||
      effR.deadlineTime ||
      (dayTypesMap[dateStr] === 'match' ? '18:30' : '14:00')
    );

    setConfiguringDate(dateStr);
  };

  // Save updated fine config from modal
  const handleSaveModalFineConfig = (applyToMatchingDayType: boolean = false) => {
    if (!configuringDate) return;
    const targetType = dayTypesMap[configuringDate];
    const updated = { ...finesEnabledDays };

    if (applyToMatchingDayType && targetType) {
      datesInMonth.forEach((dStr) => {
        if (dayTypesMap[dStr] === targetType) {
          updated[dStr] = { ...modalFineConfig };
        }
      });
    } else {
      updated[configuringDate] = { ...modalFineConfig };
    }

    setFinesEnabledDays(updated);
    saveFinesEnabledDays(updated);

    // Save custom deadlines for this specific date
    try {
      const dCfg = getStoredDeadlineConfig();
      const currentWellness = { ...(dCfg.customDateDeadlinesWellness || {}) };
      const currentRpe = { ...(dCfg.customDateDeadlinesRpe || {}) };
      const currentCustom = { ...(dCfg.customDateDeadlines || {}) };

      const defaultW = targetType === 'match' ? (dCfg.wellnessMatchTime || '12:00') : (dCfg.wellnessRegularTime || '08:15');
      const defaultR = targetType === 'match' ? (dCfg.rpeMatchTime || '18:30') : (dCfg.rpeRegularTime || '14:00');

      if (modalWellnessTime && modalWellnessTime.trim() && modalWellnessTime.trim() !== defaultW) {
        currentWellness[configuringDate] = modalWellnessTime.trim();
        currentCustom[configuringDate] = modalWellnessTime.trim();
      } else {
        delete currentWellness[configuringDate];
        delete currentCustom[configuringDate];
      }

      if (modalRpeTime && modalRpeTime.trim() && modalRpeTime.trim() !== defaultR) {
        currentRpe[configuringDate] = modalRpeTime.trim();
      } else {
        delete currentRpe[configuringDate];
      }

      saveDeadlineConfig({
        ...dCfg,
        customDateDeadlines: currentCustom,
        customDateDeadlinesWellness: currentWellness,
        customDateDeadlinesRpe: currentRpe,
      });

      const sessions = getStoredTrainingSessions();
      if (sessions[configuringDate]) {
        sessions[configuringDate].customDeadline = currentWellness[configuringDate] || '';
        sessions[configuringDate].customDeadlineWellness = currentWellness[configuringDate] || '';
        sessions[configuringDate].customDeadlineRpe = currentRpe[configuringDate] || '';
        saveTrainingSessionInfo(sessions[configuringDate]);
      }
    } catch (e) {
      console.warn('Erro ao guardar prazos pontuais do dia:', e);
    }

    setConfiguringDate(null);
  };

  // Bulk action: Enable fines for all training and match days in month (all 3 questionnaires)
  const enableAllFinesForActivityDays = () => {
    const updated = { ...finesEnabledDays };
    datesInMonth.forEach((dateStr) => {
      if (dayTypesMap[dateStr] === 'training' || dayTypesMap[dateStr] === 'match') {
        updated[dateStr] = { wellness: true, rpe: true, hydration: true };
      } else {
        updated[dateStr] = { wellness: false, rpe: false, hydration: false };
      }
    });
    setFinesEnabledDays(updated);
    saveFinesEnabledDays(updated);
  };

  // Bulk action: Enable only Wellness for Rest days (Folgas)
  const enableWellnessOnlyForRestDays = () => {
    const updated = { ...finesEnabledDays };
    datesInMonth.forEach((dateStr) => {
      if (dayTypesMap[dateStr] === 'rest') {
        updated[dateStr] = { wellness: true, rpe: false, hydration: false };
      }
    });
    setFinesEnabledDays(updated);
    saveFinesEnabledDays(updated);
  };

  // Bulk action: Exempt all dates in month from fines
  const exemptAllFinesInMonth = () => {
    const updated = { ...finesEnabledDays };
    datesInMonth.forEach((dateStr) => {
      updated[dateStr] = { wellness: false, rpe: false, hydration: false };
    });
    setFinesEnabledDays(updated);
    saveFinesEnabledDays(updated);
  };

  // Build compliance report for all athletes across past & today fine active days
  const complianceReports: AthleteComplianceReport[] = useMemo(() => {
    return athletes.map((ath) => {
      let missingWellnessCount = 0;
      let missingRpeCount = 0;
      let missingHydrationCount = 0;
      const failedDates: AthleteComplianceReport['failedDates'] = [];

      pastAndTodayFineActiveDates.forEach((dateStr) => {
        const fineCfg = finesConfigMap[dateStr] || normalizeDayFineConfig(finesEnabledDays[dateStr], dayTypesMap[dateStr]);

        const athleteWellness = wellnessList.find(
          (w) => w.date === dateStr && (w.athleteId === ath.id || w.athleteName === ath.name)
        );
        const hasWellness = athleteWellness ? (
          athleteWellness.isAuthorizedLate ||
          (athleteWellness.approvalStatus === 'approved' && !athleteWellness.keepFine) ||
          (!athleteWellness.isLate && athleteWellness.approvalStatus !== 'rejected')
        ) : false;

        const athleteRpe = rpeList.find(
          (r) => r.date === dateStr && (r.athleteId === ath.id || r.athleteName === ath.name)
        );
        const hasRpe = athleteRpe ? (
          athleteRpe.isAuthorizedLate ||
          (athleteRpe.approvalStatus === 'approved' && !athleteRpe.keepFine) ||
          (!athleteRpe.isLate && athleteRpe.approvalStatus !== 'rejected')
        ) : false;

        const hasHydration = hydrationList.some(
          (h) => h.date === dateStr && (h.athleteId === ath.id || h.athleteName === ath.name)
        );

        // Check if fine is waived individually for this athlete on this date
        const isWellnessWaived = isFineExempt(fineExemptions, ath.id, ath.name, dateStr, 'wellness');
        const isRpeWaived = isFineExempt(fineExemptions, ath.id, ath.name, dateStr, 'rpe');
        const isHydrationWaived = isFineExempt(fineExemptions, ath.id, ath.name, dateStr, 'hydration');

        // Only count as missing if that questionnaire is enabled for fines on this date AND NOT WAIVED!
        const missingW = fineCfg.wellness && !hasWellness && !isWellnessWaived;
        const missingR = fineCfg.rpe && !hasRpe && !isRpeWaived;
        const missingH = fineCfg.hydration && !hasHydration && !isHydrationWaived;

        if (missingW || missingR || missingH) {
          if (missingW) missingWellnessCount++;
          if (missingR) missingRpeCount++;
          if (missingH) missingHydrationCount++;

          let wellnessReason: 'not_submitted' | 'late_pending' | 'late_rejected' | 'late_approved_fined' | undefined;
          if (missingW) {
            if (!athleteWellness) wellnessReason = 'not_submitted';
            else if (athleteWellness.approvalStatus === 'rejected') wellnessReason = 'late_rejected';
            else if (athleteWellness.approvalStatus === 'approved' && athleteWellness.keepFine) wellnessReason = 'late_approved_fined';
            else wellnessReason = 'late_pending';
          }

          let rpeReason: 'not_submitted' | 'late_pending' | 'late_rejected' | 'late_approved_fined' | undefined;
          if (missingR) {
            if (!athleteRpe) rpeReason = 'not_submitted';
            else if (athleteRpe.approvalStatus === 'rejected') rpeReason = 'late_rejected';
            else if (athleteRpe.approvalStatus === 'approved' && athleteRpe.keepFine) rpeReason = 'late_approved_fined';
            else rpeReason = 'late_pending';
          }

          const failsOnDate = (missingW ? 1 : 0) + (missingR ? 1 : 0) + (missingH ? 1 : 0);
          failedDates.push({
            date: dateStr,
            missingWellness: missingW,
            wellnessReason,
            missingRpe: missingR,
            rpeReason,
            missingHydration: missingH,
            subtotalFines: failsOnDate * finePerFault,
          });
        }
      });

      // Collect waived fines for this athlete within the selected month (deduplicated)
      const seenWaivedDates = new Set<string>();
      const waivedFines = Object.values(fineExemptions).filter((ex) => {
        if (!ex || !ex.date || !ex.date.startsWith(selectedMonth)) return false;
        const matchesAthlete =
          ex.athleteId === ath.id ||
          ex.athleteName === ath.name ||
          ex.athleteId?.toLowerCase() === ath.id.toLowerCase() ||
          ex.athleteName?.toLowerCase() === ath.name.toLowerCase() ||
          ex.id?.startsWith(`${ath.id}_`) ||
          ex.id?.startsWith(`${ath.name}_`);
        if (!matchesAthlete) return false;
        const dedupKey = `${ex.date}_${ex.type}`;
        if (seenWaivedDates.has(dedupKey) || (ex.type !== 'all' && seenWaivedDates.has(`${ex.date}_all`))) return false;
        seenWaivedDates.add(dedupKey);
        return true;
      });

      const totalFails = missingWellnessCount + missingRpeCount + missingHydrationCount;
      const totalFineEuros = totalFails * finePerFault;

      return {
        athleteId: ath.id,
        athleteName: ath.name,
        missingWellnessCount,
        missingRpeCount,
        missingHydrationCount,
        totalFails,
        totalFineEuros,
        failedDates,
        waivedFines,
      };
    }).sort((a, b) => b.totalFineEuros - a.totalFineEuros);
  }, [athletes, pastAndTodayFineActiveDates, wellnessList, rpeList, hydrationList, finePerFault, finesConfigMap, finesEnabledDays, dayTypesMap, fineExemptions, selectedMonth]);

  // Overall KPIs
  const totalSquadFinesEuros = useMemo(
    () => complianceReports.reduce((acc, curr) => acc + curr.totalFineEuros, 0),
    [complianceReports]
  );

  const totalPossibleSubmissions = useMemo(() => {
    return pastAndTodayFineActiveDates.reduce((sum, dateStr) => {
      const cfg = finesConfigMap[dateStr] || normalizeDayFineConfig(finesEnabledDays[dateStr], dayTypesMap[dateStr]);
      const activeCount = (cfg.wellness ? 1 : 0) + (cfg.rpe ? 1 : 0) + (cfg.hydration ? 1 : 0);
      return sum + (activeCount * athletes.length);
    }, 0);
  }, [pastAndTodayFineActiveDates, finesConfigMap, finesEnabledDays, dayTypesMap, athletes.length]);

  const totalActualFails = useMemo(
    () => complianceReports.reduce((acc, curr) => acc + curr.totalFails, 0),
    [complianceReports]
  );

  const squadComplianceRate = useMemo(() => {
    if (totalPossibleSubmissions === 0) return 100;
    const rate = ((totalPossibleSubmissions - totalActualFails) / totalPossibleSubmissions) * 100;
    return Math.max(0, Math.min(100, +rate.toFixed(1)));
  }, [totalPossibleSubmissions, totalActualFails]);

  const topMissingAthlete = complianceReports[0]?.totalFails > 0 ? complianceReports[0] : null;

  // Copy WhatsApp / Email summary report
  const handleCopyReport = () => {
    const formattedMonth = new Date(`${selectedMonth}-01`).toLocaleDateString('pt-PT', {
      month: 'long',
      year: 'numeric',
    });

    let text = `⚽ *GIL VICENTE FC - MAPA DE MULTAS & FALTAS DE PREENCHIMENTO*\n`;
    text += `📅 Mês: ${formattedMonth.toUpperCase()}\n`;
    text += `🎯 Dias de Atividade com Multa: ${fineActiveDates.length} dias (${pastAndTodayFineActiveDates.length} avaliados até hoje)\n`;
    text += `💰 Multa Unitária por Falta: ${finePerFault.toFixed(2)} €\n`;
    text += `--------------------------------------------------\n`;

    const athletesWithFines = complianceReports.filter((rep) => rep.totalFineEuros > 0);

    if (athletesWithFines.length === 0) {
      text += `🎉 Excelente rigor! Nenhuma jogadora com multas neste mês.\n`;
    } else {
      athletesWithFines.forEach((rep) => {
        text += `🔴 *${rep.athleteName}*: ${rep.totalFineEuros.toFixed(2)} € (${rep.totalFails} falhas: `;
        const breakdown = [];
        if (rep.missingWellnessCount) breakdown.push(`${rep.missingWellnessCount}x Wellness`);
        if (rep.missingRpeCount) breakdown.push(`${rep.missingRpeCount}x PSE`);
        if (rep.missingHydrationCount) breakdown.push(`${rep.missingHydrationCount}x Pesagem`);
        text += `${breakdown.join(', ')})\n`;
      });
      text += `--------------------------------------------------\n`;
      text += `💶 *TOTAL GERAL ACUMULADO:* ${totalSquadFinesEuros.toFixed(2)} €\n`;
    }

    navigator.clipboard.writeText(text);
    setCopyFeedback(t.admin?.fines?.reportCopied || 'Relatório copiado para a área de transferência!');
    setTimeout(() => setCopyFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Header & Settings Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-dark-card border border-slate-800 p-4 rounded-2xl gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-500">
            <Euro className="h-5 w-5" />
            <h2 className="text-base font-extrabold uppercase tracking-tight text-slate-100">
              {t.admin?.fines?.finesTitle || 'Gestão de Faltas & Multas Mensais'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.admin?.fines?.finesSub || 'Contabilização de ausências com seleção de dias com multa ou isenção.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center space-x-2 bg-dark-surface border border-slate-700 px-3 py-1.5 rounded-xl">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            />
          </div>

          {/* Fine Per Fault Unit Input */}
          <div className="flex items-center space-x-2 bg-dark-surface border border-slate-700 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-slate-400">€ / Falta:</span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              value={finePerFault}
              onChange={(e) => setFinePerFault(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-16 bg-transparent text-xs font-extrabold text-brand-lime text-center focus:outline-none"
            />
          </div>

          {/* Copy Report Button */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center space-x-2 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all active:scale-95"
          >
            <Copy className="h-4 w-4" />
            <span>{t.admin?.fines?.copyReport || 'Copiar Relatório de Multas'}</span>
          </button>
        </div>
      </div>

      {copyFeedback && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Sub-navigation Pills for Fines View */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-dark-card/60 p-1.5 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => handleSubTabChange('table')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            finesSubTab === 'table'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>👥 Tabela por Jogadora</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {complianceReports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('calendar')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            finesSubTab === 'calendar'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>📅 Calendário de Multas</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {fineActiveDates.length} dias
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('summary')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
            finesSubTab === 'summary'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Euro className="h-4 w-4" />
          <span>📊 Resumo & Estatísticas</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
            {totalSquadFinesEuros.toFixed(0)} €
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabChange('all')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ml-auto ${
            finesSubTab === 'all'
              ? 'bg-slate-800 text-brand-lime border border-brand-lime/40 shadow-sm'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
          }`}
        >
          <span>📑 Ver Tudo</span>
        </button>
      </div>

      {/* Monthly Summary KPI Cards */}
      {(finesSubTab === 'summary' || finesSubTab === 'all') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
          {/* Total Fines Euros */}
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-dark-card to-rose-950/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-400">Total Multas no Mês</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
                <Euro className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-rose-400">{totalSquadFinesEuros.toFixed(2)} €</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{totalActualFails} falhas totais contabilizadas</p>
          </div>

          {/* Active Fine Days */}
          <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-dark-card to-blue-950/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-400">Dias com Multa Ativa</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Dumbbell className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-blue-400">{fineActiveDates.length} dias</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {pastAndTodayFineActiveDates.length} avaliados até hoje
            </p>
          </div>

          {/* Squad Compliance Rate % */}
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-dark-card to-emerald-950/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-400">Cumprimento do Plantel</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-2xl font-black text-emerald-400">{squadComplianceRate}%</p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">Taxa nos dias com multa</p>
          </div>

          {/* Top Missing Player */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-dark-card to-amber-950/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase text-slate-400">Maior Acumulação</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <UserX className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-2 text-lg font-extrabold text-amber-400 truncate">
              {topMissingAthlete ? topMissingAthlete.athleteName : 'Nenhuma'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              {topMissingAthlete ? `${topMissingAthlete.totalFineEuros.toFixed(2)} € (${topMissingAthlete.totalFails} faltas)` : '100% Rigor'}
            </p>
          </div>
        </div>
      )}

      {/* Calendar Strip: Treino vs Jogo vs Folga + Fine Day Selection */}
      {(finesSubTab === 'calendar' || finesSubTab === 'all') && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-4 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar className="h-4 w-4 text-brand-lime" />
            <h3 className="text-xs font-extrabold uppercase tracking-wide">Dias do Mês & Seleção de Multas por Dia</h3>
          </div>
          
          {/* Quick Bulk Actions & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: Grid vs Strip */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setCalendarViewMode('grid')}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calendarViewMode === 'grid'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Vista em Grelha de Calendário Mensal"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Calendário</span>
              </button>
              <button
                type="button"
                onClick={() => setCalendarViewMode('strip')}
                className={`flex items-center space-x-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  calendarViewMode === 'strip'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title="Vista em Linha Horizontal"
              >
                <List className="h-3.5 w-3.5" />
                <span>Linha</span>
              </button>
            </div>

            <button
              type="button"
              onClick={enableAllFinesForActivityDays}
              className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 transition-all flex items-center space-x-1"
            >
              <span>💶 Ativar Todas as Multas (Treinos/Jogos)</span>
            </button>
            <button
              type="button"
              onClick={enableWellnessOnlyForRestDays}
              className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/60 transition-all flex items-center space-x-1"
            >
              <span>🏖️ Ativar Só Wellness nas Folgas</span>
            </button>
            <button
              type="button"
              onClick={exemptAllFinesInMonth}
              className="px-2.5 py-1 text-[11px] font-extrabold rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800 transition-all flex items-center space-x-1"
            >
              <span>🚫 Isentar Todas as Multas</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-400">
          <span>Clica no cartão para mudar atividade (⚽/🏆/🏖️) ou na etiqueta para escolher os questionários com multa:</span>
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <span className="flex items-center space-x-1 text-emerald-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>💶 Todas Multas</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span>💶 Multas Selecionadas (W/PSE/PES)</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-slate-500" />
              <span>🚫 Dia Isento</span>
            </span>
          </div>
        </div>

        {calendarViewMode === 'grid' ? (
          /* Calendar Grid View (7 Columns) */
          <div className="space-y-1.5">
            {/* Weekday column headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-black uppercase text-slate-400 py-1.5 border-b border-slate-800/80">
              <div className="text-slate-300">Segunda</div>
              <div className="text-slate-300">Terça</div>
              <div className="text-slate-300">Quarta</div>
              <div className="text-slate-300">Quinta</div>
              <div className="text-slate-300">Sexta</div>
              <div className="text-amber-400/90 font-extrabold">Sábado</div>
              <div className="text-rose-400/90 font-extrabold">Domingo</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Padding before month */}
              {calendarMonthData.paddingLeading.map((_, idx) => (
                <div
                  key={`pad-lead-fines-${idx}`}
                  className="min-h-[72px] sm:min-h-[86px] rounded-xl border border-slate-800/30 bg-slate-950/20 opacity-25"
                />
              ))}

              {/* Day cells */}
              {datesInMonth.map((dStr) => {
                const dayType = dayTypesMap[dStr] || 'rest';
                const cfg = finesConfigMap[dStr] || normalizeDayFineConfig(finesEnabledDays[dStr], dayType);
                const hasFine = isDayAnyFineActive(cfg);
                const allActive = cfg.wellness && cfg.rpe && cfg.hydration;
                const dayNum = dStr.split('-')[2];
                const isToday = dStr === todayStr;

                let icon = '🏖️';
                let label = 'Folga';
                let cardStyle = 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:bg-slate-850 hover:border-slate-700';

                if (dayType === 'training') {
                  icon = '⚽';
                  label = 'Treino';
                  cardStyle = 'border-blue-500/40 bg-blue-950/30 text-blue-200 hover:bg-blue-950/50 hover:border-blue-500/70 shadow-sm';
                } else if (dayType === 'match') {
                  icon = '🏆';
                  label = 'Jogo';
                  cardStyle = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50 hover:border-emerald-500/80 shadow-sm';
                }

                if (isToday) {
                  cardStyle += ' ring-2 ring-red-500 border-red-500 shadow-lg';
                }

                let badgeText = '🚫 NÃO';
                let badgeTitle = `${dStr}: Dia Isento de multas. Clica para escolher questionários.`;
                let badgeStyle = 'bg-slate-800/90 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200';

                if (allActive) {
                  badgeText = '💶 TODAS';
                  badgeTitle = `${dStr}: Todas as multas ativas (Wellness, Pesagem, PSE). Clica para personalizar.`;
                  badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 font-bold';
                } else if (hasFine) {
                  const activeLabels: string[] = [];
                  if (cfg.wellness) activeLabels.push('W');
                  if (cfg.rpe) activeLabels.push('PSE');
                  if (cfg.hydration) activeLabels.push('PES');
                  badgeText = `💶 ${activeLabels.join('·')}`;
                  badgeTitle = `${dStr}: Multas ativas em ${activeLabels.join(', ')}. Clica para personalizar.`;
                  badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30 font-bold';
                }

                return (
                  <div
                    key={dStr}
                    onClick={() => cycleDayType(dStr)}
                    title={`${dStr}: Clica para alternar (${label}). Clica na etiqueta para personalizar multas.`}
                    className={`group relative flex flex-col justify-between p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer min-h-[72px] sm:min-h-[86px] select-none ${cardStyle}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black text-slate-200">
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[7px] sm:text-[8px] uppercase font-black bg-red-600 text-white px-1.5 py-0.2 rounded-full shadow-sm">
                          Hoje
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-center my-0.5">
                      <span className="text-sm sm:text-base font-black">{icon}</span>
                      <span className="hidden sm:inline text-[10px] font-bold ml-1">{label}</span>
                    </div>

                    {/* Interactive Fine Active Badge */}
                    <button
                      type="button"
                      onClick={(e) => handleOpenConfigModal(dStr, e)}
                      title={badgeTitle}
                      className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] uppercase transition-all flex items-center justify-center w-full truncate border cursor-pointer ${badgeStyle}`}
                    >
                      <span className="truncate">{badgeText}</span>
                    </button>
                  </div>
                );
              })}

              {/* Padding after month */}
              {calendarMonthData.paddingTrailing.map((_, idx) => (
                <div
                  key={`pad-trail-fines-${idx}`}
                  className="min-h-[72px] sm:min-h-[86px] rounded-xl border border-slate-800/30 bg-slate-950/20 opacity-25"
                />
              ))}
            </div>
          </div>
        ) : (
          /* Strip View */
          <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {datesInMonth.map((dStr) => {
              const dayType = dayTypesMap[dStr] || 'rest';
              const cfg = finesConfigMap[dStr] || normalizeDayFineConfig(finesEnabledDays[dStr], dayType);
              const hasFine = isDayAnyFineActive(cfg);
              const allActive = cfg.wellness && cfg.rpe && cfg.hydration;
              const dayNum = dStr.split('-')[2];
              const isToday = dStr === todayStr;

              let icon = '🏖️';
              let label = 'Folga';
              let style = 'border-slate-800 bg-slate-900/80 text-slate-500 hover:bg-slate-800';

              if (dayType === 'training') {
                icon = '⚽';
                label = 'Treino';
                style = 'border-blue-500/60 bg-blue-950/60 text-blue-200 hover:bg-blue-900/60';
              } else if (dayType === 'match') {
                icon = '🏆';
                label = 'Jogo';
                style = 'border-emerald-500/80 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70 font-black';
              }

              if (isToday) {
                style += ' ring-2 ring-red-500 border-red-500 shadow-lg';
              }

              let badgeText = '🚫 NÃO';
              let badgeTitle = `${dStr}: Dia Isento de multas. Clica para escolher questionários.`;
              let badgeStyle = 'bg-slate-800/90 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-slate-200';

              if (allActive) {
                badgeText = '💶 TODAS';
                badgeTitle = `${dStr}: Todas as multas ativas (Wellness, Pesagem, PSE). Clica para personalizar.`;
                badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30';
              } else if (hasFine) {
                const activeLabels: string[] = [];
                if (cfg.wellness) activeLabels.push('W');
                if (cfg.rpe) activeLabels.push('PSE');
                if (cfg.hydration) activeLabels.push('PES');
                badgeText = `💶 ${activeLabels.join('·')}`;
                badgeTitle = `${dStr}: Multas ativas em ${activeLabels.join(', ')}. Clica para personalizar.`;
                badgeStyle = 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30';
              }

              return (
                <div
                  key={dStr}
                  onClick={() => cycleDayType(dStr)}
                  title={`${dStr}: Clica para alternar tipo (${label}). Clica na etiqueta para escolher questionários sujeitos a multa.`}
                  className={`flex flex-col items-center justify-between min-w-[58px] min-h-[74px] py-1.5 px-1 rounded-xl border transition-all text-xs font-bold relative cursor-pointer ${style}`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] opacity-75">{dayNum}</span>
                    <span className="text-sm font-black">{icon}</span>
                    {isToday && (
                      <span className="text-[7px] uppercase font-black bg-red-600 text-white px-1 rounded-full mt-0.5">
                        Hoje
                      </span>
                    )}
                  </div>

                  {/* Interactive Fine Active Badge / Questionnaire Selector */}
                  <button
                    type="button"
                    onClick={(e) => handleOpenConfigModal(dStr, e)}
                    title={badgeTitle}
                    className={`mt-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase transition-all flex items-center justify-center w-full truncate ${badgeStyle}`}
                  >
                    <span className="truncate">{badgeText}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
        </div>
      )}

      {/* Roster Fines & Compliance Master Table */}
      {(finesSubTab === 'table' || finesSubTab === 'all') && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-5 animate-fade-in">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            Contabilização do Plantel ({complianceReports.length} Jogadoras)
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {pastAndTodayFineActiveDates.length} dias com multa avaliados até hoje
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-extrabold bg-dark-surface/50">
                <th className="py-3 px-3">Atleta</th>
                <th className="py-3 px-3 text-center">Falta Wellness</th>
                <th className="py-3 px-3 text-center">Falta PSE</th>
                <th className="py-3 px-3 text-center">Falta Pesagem</th>
                <th className="py-3 px-3 text-center">Total Falhas</th>
                <th className="py-3 px-3 text-right">Multa Acumulada (€)</th>
                <th className="py-3 px-3 text-center">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {complianceReports.map((report) => {
                const hasFines = report.totalFineEuros > 0;
                const isExpanded = expandedAthleteId === report.athleteId;

                return (
                  <React.Fragment key={report.athleteId}>
                    <tr className={`hover:bg-slate-800/40 transition-colors ${hasFines ? 'bg-rose-950/10' : ''}`}>
                      <td className="py-3 px-3 font-bold text-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className={`h-2 w-2 rounded-full ${hasFines ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span>{report.athleteName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {report.missingWellnessCount > 0 ? (
                          <span className="inline-block bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                            {report.missingWellnessCount}
                          </span>
                        ) : (
                          <span className="text-slate-600">&bull;</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {report.missingRpeCount > 0 ? (
                          <span className="inline-block bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                            {report.missingRpeCount}
                          </span>
                        ) : (
                          <span className="text-slate-600">&bull;</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {report.missingHydrationCount > 0 ? (
                          <span className="inline-block bg-rose-500/20 text-rose-300 font-extrabold px-2 py-0.5 rounded-full border border-rose-500/30">
                            {report.missingHydrationCount}
                          </span>
                        ) : (
                          <span className="text-slate-600">&bull;</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-black">
                        {report.totalFails > 0 ? (
                          <span className="text-amber-400">{report.totalFails}</span>
                        ) : (
                          <span className="text-emerald-400 text-[10px]">0 (Ok)</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {hasFines ? (
                          <span className="inline-flex items-center font-black text-rose-400 bg-rose-500/10 border border-rose-500/40 px-2.5 py-1 rounded-xl">
                            {report.totalFineEuros.toFixed(2)} €
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold">0,00 €</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {(report.failedDates.length > 0 || (report.waivedFines && report.waivedFines.length > 0)) && (
                          <button
                            type="button"
                            onClick={() => setExpandedAthleteId(isExpanded ? null : report.athleteId)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
                            title={isExpanded ? "Recolher detalhes" : "Ver detalhe das faltas"}
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Breakdown of Failed Dates & Waived Fines */}
                    {isExpanded && (report.failedDates.length > 0 || (report.waivedFines && report.waivedFines.length > 0)) && (
                      <tr className="bg-slate-900/90">
                        <td colSpan={7} className="p-4 border-b border-slate-800">
                          <div className="space-y-4">
                            {report.failedDates.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                  <h4 className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                                    Datas com Faltas Registadas — {report.athleteName}
                                  </h4>
                                  {report.failedDates.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleEliminateAllFinesForAthlete(report.athleteId, report.athleteName, report.failedDates);
                                      }}
                                      className="inline-flex items-center space-x-1 text-[10px] text-rose-400 hover:text-rose-300 font-bold bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30 transition-all cursor-pointer self-start sm:self-auto"
                                      title="Eliminar todas as multas deste mês para esta atleta"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                      <span>Eliminar Todas as Multas ({report.failedDates.length})</span>
                                    </button>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {report.failedDates.map((fd) => (
                                    <div
                                      key={fd.date}
                                      className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs space-y-2"
                                    >
                                      <div className="flex justify-between items-center font-bold text-slate-200">
                                        <span>📅 {fd.date}</span>
                                        <div className="flex items-center space-x-1.5">
                                          <span className="text-rose-400 font-black">+{fd.subtotalFines.toFixed(2)} €</span>
                                          <button
                                            type="button"
                                            onClick={() => handleEliminateFine(report.athleteId, report.athleteName, fd.date, 'all')}
                                            className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-rose-600/30 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/50 text-[10px] font-black transition-all cursor-pointer active:scale-95 shadow-sm"
                                            title="Eliminar multa desta data"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            <span>Eliminar</span>
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-1 text-[10px]">
                                        {fd.missingWellness && (
                                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold ${
                                            fd.wellnessReason === 'late_pending'
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : fd.wellnessReason === 'late_approved_fined'
                                              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                                              : 'bg-rose-500/20 text-rose-300'
                                          }`}>
                                            <span>
                                              {fd.wellnessReason === 'late_pending'
                                                ? 'Wellness Fora de Horas (Pendente de Validação)'
                                                : fd.wellnessReason === 'late_approved_fined'
                                                ? 'Wellness Aceite c/ Multa (Atraso)'
                                                : fd.wellnessReason === 'late_rejected'
                                                ? 'Wellness Recusado (Não Aceite)'
                                                : 'Falta Wellness'}
                                            </span>
                                            {(fd.missingRpe || fd.missingHydration) && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEliminateFine(report.athleteId, report.athleteName, fd.date, 'wellness');
                                                }}
                                                className="ml-1 p-0.5 rounded hover:bg-rose-500/40 text-slate-300 hover:text-white"
                                                title="Eliminar apenas multa de Wellness"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            )}
                                          </span>
                                        )}
                                        {fd.missingRpe && (
                                          <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full font-bold ${
                                            fd.rpeReason === 'late_pending'
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : fd.rpeReason === 'late_approved_fined'
                                              ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40'
                                              : 'bg-amber-500/20 text-amber-300'
                                          }`}>
                                            <span>
                                              {fd.rpeReason === 'late_pending'
                                                ? 'PSE Fora de Horas (Pendente de Validação)'
                                                : fd.rpeReason === 'late_approved_fined'
                                                ? 'PSE Aceite c/ Multa (Atraso)'
                                                : fd.rpeReason === 'late_rejected'
                                                ? 'PSE Recusado (Não Aceite)'
                                                : 'Falta PSE'}
                                            </span>
                                            {(fd.missingWellness || fd.missingHydration) && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEliminateFine(report.athleteId, report.athleteName, fd.date, 'rpe');
                                                }}
                                                className="ml-1 p-0.5 rounded hover:bg-rose-500/40 text-slate-300 hover:text-white"
                                                title="Eliminar apenas multa de PSE"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            )}
                                          </span>
                                        )}
                                        {fd.missingHydration && (
                                          <span className="inline-flex items-center space-x-1 bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                            <span>Falta Pesagem</span>
                                            {(fd.missingWellness || fd.missingRpe) && (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEliminateFine(report.athleteId, report.athleteName, fd.date, 'hydration');
                                                }}
                                                className="ml-1 p-0.5 rounded hover:bg-blue-500/40 text-slate-300 hover:text-white"
                                                title="Eliminar apenas multa de Pesagem"
                                              >
                                                <X className="h-2.5 w-2.5" />
                                              </button>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* All active fines forgiven state */}
                            {report.failedDates.length === 0 && report.waivedFines && report.waivedFines.length > 0 && (
                              <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span>🎉 Todas as faltas registadas deste mês foram isentas / eliminadas para esta atleta.</span>
                              </div>
                            )}

                            {/* Waived / Eliminated Fines Section with Restore action */}
                            {report.waivedFines && report.waivedFines.length > 0 && (
                              <div className="space-y-2 pt-2 border-t border-slate-800">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[11px] font-extrabold uppercase text-emerald-400 tracking-wider flex items-center space-x-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Multas Eliminadas / Isentas ({report.waivedFines.length})</span>
                                  </h4>
                                  <span className="text-[10px] text-slate-400">
                                    Podes restaurar a qualquer momento se tiver sido um engano
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                  {report.waivedFines.map((wf) => (
                                    <div
                                      key={wf.id || `${wf.athleteId}_${wf.date}_${wf.type}`}
                                      className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs flex items-center justify-between"
                                    >
                                      <div className="space-y-0.5">
                                        <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                                          <span>📅 {wf.date}</span>
                                          <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30 font-black">
                                            0.00 € (Isenta)
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400">
                                          {wf.type === 'wellness' ? 'Falta Wellness' : wf.type === 'rpe' ? 'Falta PSE' : wf.type === 'hydration' ? 'Falta Pesagem' : 'Todas as Faltas'}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRestoreFine(wf.athleteId, report.athleteName, wf.date, wf.type)}
                                        className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                                        title="Restaurar / Reativar multa"
                                      >
                                        <RotateCcw className="h-3 w-3 text-cyan-400" />
                                        <span>Restaurar</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* Questionnaire Fine Configuration Modal */}
      {configuringDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-700 bg-dark-card p-6 shadow-2xl space-y-5 text-slate-100">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">
                  {dayTypesMap[configuringDate] === 'training'
                    ? '⚽'
                    : dayTypesMap[configuringDate] === 'match'
                    ? '🏆'
                    : '🏖️'}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center space-x-2">
                    <span>Configurar Multas por Questionário</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {configuringDate.split('-').reverse().join('/')} &bull;{' '}
                    {dayTypesMap[configuringDate] === 'training'
                      ? 'Dia de Treino'
                      : dayTypesMap[configuringDate] === 'match'
                      ? 'Dia de Jogo'
                      : 'Dia de Folga'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringDate(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Interactive Deadline Adjustment for this specific Date */}
            {(() => {
              const sessions = getStoredTrainingSessions();
              const s = sessions[configuringDate];
              const isMatch = dayTypesMap[configuringDate] === 'match';
              const defaultW = isMatch ? '12:00' : '08:15';
              const defaultR = isMatch ? '18:30' : '14:00';
              const isCustom = modalWellnessTime !== defaultW || modalRpeTime !== defaultR;

              return (
                <div className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-black text-slate-100 uppercase">
                        Horários Limite deste Dia (Pontual)
                      </span>
                      {isCustom && (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full font-black">
                          Exceção
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setModalWellnessTime(defaultW);
                        setModalRpeTime(defaultR);
                      }}
                      className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                    >
                      Repor Padrão
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Wellness Time Input */}
                    <div className="bg-dark-bg/80 p-2.5 rounded-xl border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-amber-300">
                          ☀️ Limite Wellness (Pré):
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {modalWellnessTime}
                        </span>
                      </div>
                      <input
                        type="time"
                        value={modalWellnessTime}
                        onChange={(e) => setModalWellnessTime(e.target.value)}
                        className="w-full rounded-lg border border-amber-500/40 bg-dark-card p-2 text-xs font-bold text-amber-100 focus:border-amber-400 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                        <button
                          type="button"
                          onClick={() => setModalWellnessTime('08:15')}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                        >
                          08:15
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalWellnessTime('12:00')}
                          className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/80 cursor-pointer"
                        >
                          12:00 (Jogo)
                        </button>
                        {s?.startTime ? (() => {
                          const [h, m] = s.startTime.split(':').map(Number);
                          const t = Math.max(0, (h * 60 + m) - 60);
                          const tStr = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
                          return (
                            <button
                              type="button"
                              onClick={() => setModalWellnessTime(tStr)}
                              className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-900/80 cursor-pointer"
                            >
                              -1h treino ({tStr})
                            </button>
                          );
                        })() : null}
                      </div>
                    </div>

                    {/* RPE Time Input */}
                    <div className="bg-dark-bg/80 p-2.5 rounded-xl border border-cyan-500/30 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-cyan-300">
                          ⚡ Limite PSE / RPE (Pós):
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {modalRpeTime}
                        </span>
                      </div>
                      <input
                        type="time"
                        value={modalRpeTime}
                        onChange={(e) => setModalRpeTime(e.target.value)}
                        className="w-full rounded-lg border border-cyan-500/40 bg-dark-card p-2 text-xs font-bold text-cyan-100 focus:border-cyan-400 focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                        <button
                          type="button"
                          onClick={() => setModalRpeTime('14:00')}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                        >
                          14:00
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalRpeTime('18:30')}
                          className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/80 cursor-pointer"
                        >
                          18:30 (Jogo)
                        </button>
                        {(() => {
                          const base = s?.endTime || s?.startTime;
                          if (!base) return null;
                          const [h, m] = base.split(':').map(Number);
                          const t = Math.min(1439, (h * 60 + m) + 60);
                          const tStr = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
                          return (
                            <button
                              type="button"
                              onClick={() => setModalRpeTime(tStr)}
                              className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-900/80 cursor-pointer"
                            >
                              +1h fim ({tStr})
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                Atalhos Rápidos (1 Toque)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setModalFineConfig({ wellness: false, rpe: false, hydration: false })}
                  className="px-2.5 py-2 text-xs font-black rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all text-center"
                >
                  🚫 Isentar Dia
                </button>
                <button
                  type="button"
                  onClick={() => setModalFineConfig({ wellness: true, rpe: true, hydration: true })}
                  className="px-2.5 py-2 text-xs font-black rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-all text-center"
                >
                  💶 Todas Multas
                </button>
                <button
                  type="button"
                  onClick={() => setModalFineConfig({ wellness: true, rpe: false, hydration: false })}
                  className="px-2.5 py-2 text-xs font-black rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 transition-all text-center"
                >
                  🏖️ Só Wellness
                </button>
                <button
                  type="button"
                  onClick={() => setModalFineConfig({ wellness: true, rpe: true, hydration: false })}
                  className="px-2.5 py-2 text-xs font-black rounded-xl border border-amber-500/50 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 transition-all text-center"
                >
                  🏆 Jogo (W+PSE)
                </button>
              </div>
            </div>

            {/* Questionnaire Fine Toggles */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                Escolhe quais os questionários que dão multa neste dia:
              </span>

              {/* 1. Wellness Toggle */}
              <div
                onClick={() => setModalFineConfig((prev) => ({ ...prev, wellness: !prev.wellness }))}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  modalFineConfig.wellness
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-dark-surface/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      modalFineConfig.wellness
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <HeartPulse className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">Questionário Wellness (Manhã)</h4>
                    <p className="text-[11px] text-slate-400">
                      Sono, fadiga, humor, dor muscular e stress diário.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase ${
                    modalFineConfig.wellness
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {modalFineConfig.wellness ? '💶 Dá Multa' : '🚫 Isento'}
                </span>
              </div>

              {/* 2. Pesagem / Hidratação Toggle */}
              <div
                onClick={() => setModalFineConfig((prev) => ({ ...prev, hydration: !prev.hydration }))}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  modalFineConfig.hydration
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-dark-surface/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      modalFineConfig.hydration
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Scale className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">Pesagem de Hidratação (Pré / Pós Treino)</h4>
                    <p className="text-[11px] text-slate-400">
                      Registo de peso corporal e desidratação no treino.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase ${
                    modalFineConfig.hydration
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {modalFineConfig.hydration ? '💶 Dá Multa' : '🚫 Isento'}
                </span>
              </div>

              {/* 3. PSE / RPE Toggle */}
              <div
                onClick={() => setModalFineConfig((prev) => ({ ...prev, rpe: !prev.rpe }))}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  modalFineConfig.rpe
                    ? 'border-emerald-500/60 bg-emerald-950/20 shadow-sm shadow-emerald-500/10'
                    : 'border-slate-800 bg-dark-surface/50 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                      modalFineConfig.rpe
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100">PSE / RPE (Perceção de Esforço Pós-Treino)</h4>
                    <p className="text-[11px] text-slate-400">
                      Escala de Borg (0 a 10) e cansaço pós-treino / jogo.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[10px] font-black rounded-full border uppercase ${
                    modalFineConfig.rpe
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {modalFineConfig.rpe ? '💶 Dá Multa' : '🚫 Isento'}
                </span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSaveModalFineConfig(true)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-center"
              >
                Aplicar a todos os{' '}
                {dayTypesMap[configuringDate] === 'training'
                  ? 'Treinos'
                  : dayTypesMap[configuringDate] === 'match'
                  ? 'Jogos'
                  : 'Folgas'}{' '}
                do mês
              </button>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setConfiguringDate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveModalFineConfig(false)}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-brand-lime text-slate-950 shadow-lg shadow-brand-lime/20 hover:bg-lime-400 transition-all active:scale-95"
                >
                  Confirmar & Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
