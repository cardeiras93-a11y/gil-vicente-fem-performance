'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MatchDayOffset, WellnessEntry, RPEEntry, HydrationEntry, TrainingSessionInfo, AthleteTrainingStatus, AthleteSessionStatus, Athlete, ComplementaryWorkOptions, ComplementaryWorkConfig } from '@/lib/types';
import { isGoalkeeper } from '@/lib/data';
import { getStoredCalendarSchedule, saveCalendarSchedule, getStoredTrainingSessions, saveTrainingSessionInfo, saveTrainingSessionInfoAsync, syncAllDataFromCloud, syncTrainingSessionsToCloud, CalendarDayType, getDynamicAthletes, getEffectiveDeadlineForDate, getStoredDeadlineConfig, saveDeadlineConfig, getStoredWeeklyPlanMetadata, saveWeeklyPlanMetadata } from '@/lib/storage';
import {
  COMPLEMENTARY_WORK_ITEMS,
  ComplementaryWorkItem,
  hasAnyComplementaryWork,
  getActiveComplementaryItems,
  getWeekDates,
  getDayNamePt,
  formatDatePtShort,
  generateWhatsAppWeeklyPlanText,
  applyWeeklyPreset,
} from '@/lib/complementaryWork';
import { secureFetch } from '@/lib/authGuard';
import {
  Calendar, Clock, Dumbbell, MapPin, Sparkles, Save, CheckCircle2,
  AlertCircle, Trophy, Coffee, ChevronLeft, ChevronRight, FileText, Activity, ShieldCheck, Thermometer, Users,
  LayoutGrid, List, Loader2, Share2, Copy, Check, MessageSquare, RotateCcw, X, Pencil
} from 'lucide-react';
import { WeeklyPlanExportModal } from './WeeklyPlanExportModal';
import { getAllMatches } from '@/data/matchRegistry';

interface TrainingSessionManagerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  hydrationList: HydrationEntry[];
}

export const TrainingSessionManager: React.FC<TrainingSessionManagerProps> = ({
  selectedDate,
  onSelectDate,
  wellnessList,
  rpeList,
  hydrationList,
}) => {
  const [athletes, setAthletes] = useState<Athlete[]>(() => getDynamicAthletes());

  useEffect(() => {
    const handleUpdate = () => {
      setAthletes(getDynamicAthletes());
    };
    handleUpdate();
    window.addEventListener('femperf_credentials_updated', handleUpdate);
    return () => window.removeEventListener('femperf_credentials_updated', handleUpdate);
  }, []);
  // Calendar month selection
  const [selectedMonth, setSelectedMonth] = useState<string>(
    selectedDate.substring(0, 7)
  );

  // Stored schedule overrides & session info
  const [calendarSchedule, setCalendarSchedule] = useState<Record<string, CalendarDayType>>({});
  const [trainingSessions, setTrainingSessions] = useState<Record<string, TrainingSessionInfo>>({});

  // Current selected session state
  const [dayType, setDayType] = useState<CalendarDayType>('training');
  const [matchCategory, setMatchCategory] = useState<'friendly' | 'championship' | 'cup'>('championship');
  const [matchDayOffset, setMatchDayOffset] = useState<MatchDayOffset>('MD-3');
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('10:30');
  const [tempStart, setTempStart] = useState<string>('20.0');
  const [tempEnd, setTempEnd] = useState<string>('25.0');
  const [locationName, setLocationName] = useState<string>('Campo de São Martinho - Barcelos');
  const [focusNotes, setFocusNotes] = useState<string>('');
  const [athleteStatuses, setAthleteStatuses] = useState<Record<string, AthleteSessionStatus>>({});
  const [customDeadline, setCustomDeadline] = useState<string>('');
  const [customDeadlineWellness, setCustomDeadlineWellness] = useState<string>('');
  const [customDeadlineRpe, setCustomDeadlineRpe] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'strip'>('grid');

  const [complementaryWork, setComplementaryWork] = useState<ComplementaryWorkConfig>({});
  const [weeklyRefDate, setWeeklyRefDate] = useState<string>(selectedDate || new Date().toISOString().split('T')[0]);
  const [microcycleTitle, setMicrocycleTitle] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const meta = getStoredWeeklyPlanMetadata();
      return meta.title || 'Weekly Microcycle';
    }
    return 'Weekly Microcycle';
  });
  const [weeklyTeamNotes, setWeeklyTeamNotes] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const meta = getStoredWeeklyPlanMetadata();
      return meta.notes || '';
    }
    return '';
  });
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');

  // Quick Day Schedule & Activity Edit Modal (for 7-day cards)
  const [editingDayDate, setEditingDayDate] = useState<string | null>(null);
  const [editDayModalType, setEditDayModalType] = useState<CalendarDayType>('training');
  const [editDayModalStartTime, setEditDayModalStartTime] = useState<string>('09:00');
  const [editDayModalEndTime, setEditDayModalEndTime] = useState<string>('10:30');
  const [editDayModalGymStartTime, setEditDayModalGymStartTime] = useState<string>('10:45');
  const [editDayModalGymEndTime, setEditDayModalGymEndTime] = useState<string>('11:30');
  const [editDayModalMatchCategory, setEditDayModalMatchCategory] = useState<'friendly' | 'championship' | 'cup'>('championship');
  const [editDayModalLocation, setEditDayModalLocation] = useState<string>('');
  const [editDayModalFocus, setEditDayModalFocus] = useState<string>('');

  const handleManualSyncToCloud = async () => {
    setSyncStatus('syncing');
    const ok = await syncTrainingSessionsToCloud(trainingSessions);
    if (ok) {
      setSyncStatus('synced');
      setSaveSuccess('Plano semanal publicado e sincronizado com a app das jogadoras!');
      setTimeout(() => {
        setSyncStatus('idle');
        setSaveSuccess(null);
      }, 3500);
    } else {
      setSyncStatus('idle');
    }
  };
  const [metaSaveStatus, setMetaSaveStatus] = useState<boolean>(false);
  const metaSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [whatsAppLang, setWhatsAppLang] = useState<'en' | 'pt'>('en');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const [sessionSubTab, setSessionSubTabState] = useState<'calendar' | 'timing' | 'complementary' | 'roster' | 'conditions' | 'submissions' | 'all'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('femperf_session_sub_tab') as any) || 'calendar';
    }
    return 'calendar';
  });

  const setSessionSubTab = (tab: 'calendar' | 'timing' | 'complementary' | 'roster' | 'conditions' | 'submissions' | 'all') => {
    setSessionSubTabState(tab);
    if (typeof window !== 'undefined') {
      localStorage.setItem('femperf_session_sub_tab', tab);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const statusCounts = useMemo(() => {
    let normal = 0;
    let conditioned = 0;
    let injured = 0;
    let absent = 0;

    let grNormal = 0;
    let grConditioned = 0;
    let grInjured = 0;
    let grAbsent = 0;

    let fieldNormal = 0;
    let fieldConditioned = 0;
    let fieldInjured = 0;
    let fieldAbsent = 0;

    athletes.forEach((ath) => {
      const st = athleteStatuses[ath.id]?.status || 'normal';
      const isGR = ath.position === 'GR' || isGoalkeeper(ath.name);

      if (st === 'normal') {
        normal++;
        if (isGR) grNormal++; else fieldNormal++;
      } else if (st === 'conditioned') {
        conditioned++;
        if (isGR) grConditioned++; else fieldConditioned++;
      } else if (st === 'injured') {
        injured++;
        if (isGR) grInjured++; else fieldInjured++;
      } else if (st === 'absent') {
        absent++;
        if (isGR) grAbsent++; else fieldAbsent++;
      }
    });

    const totalGR = grNormal + grConditioned + grInjured + grAbsent;
    const totalField = fieldNormal + fieldConditioned + fieldInjured + fieldAbsent;

    const grInTraining = grNormal + grConditioned;
    const fieldInTraining = fieldNormal + fieldConditioned;
    const totalInTraining = normal + conditioned;

    return {
      normal,
      conditioned,
      injured,
      absent,
      grNormal,
      grConditioned,
      grInjured,
      grAbsent,
      fieldNormal,
      fieldConditioned,
      fieldInjured,
      fieldAbsent,
      totalGR,
      totalField,
      grInTraining,
      fieldInTraining,
      totalInTraining,
    };
  }, [athleteStatuses]);

  // Calculate duration automatically from startTime and endTime
  const durationMin = useMemo(() => {
    if (!startTime || !endTime) return 90;
    const [sH, sM] = startTime.split(':').map((n) => parseInt(n, 10));
    const [eH, eM] = endTime.split(':').map((n) => parseInt(n, 10));
    if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return 90;

    let startTotal = sH * 60 + sM;
    let endTotal = eH * 60 + eM;
    if (endTotal < startTotal) {
      endTotal += 1440; // overnight session fallback
    }
    const diff = endTotal - startTotal;
    return diff >= 0 ? diff : 0;
  }, [startTime, endTime]);

  // Calculate temperature variation (delta) automatically
  const tempDelta = useMemo(() => {
    const s = parseFloat(tempStart);
    const e = parseFloat(tempEnd);
    if (isNaN(s) || isNaN(e)) return null;
    return +(e - s).toFixed(1);
  }, [tempStart, tempEnd]);

  // Auto calculate microcycle match day offset based on nearest match day
  const getAutoMatchDayOffset = (dateStr: string, currentType: CalendarDayType): MatchDayOffset => {
    if (currentType === 'match') return 'MD';

    // Collect all match dates across registered matches, schedule, training sessions, and rpe entries
    const matchDatesSet = new Set<string>();

    getAllMatches().forEach((m) => {
      if (m.matchDate) matchDatesSet.add(m.matchDate);
    });
    Object.entries(calendarSchedule).forEach(([d, t]) => {
      if (t === 'match') matchDatesSet.add(d);
    });
    Object.entries(trainingSessions).forEach(([d, s]) => {
      if (s.dayType === 'match' || s.matchDayOffset === 'MD') matchDatesSet.add(d);
    });
    rpeList.forEach((r) => {
      if (r.matchDayOffset === 'MD') matchDatesSet.add(r.date);
    });

    const matchDates = Array.from(matchDatesSet);

    if (matchDates.length === 0) {
      // Default fallback by day of week (Sunday = MD)
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayOfWeek = d.getDay(); // 0 = Sun
        if (dayOfWeek === 0) return 'MD';
        if (dayOfWeek === 6) return 'MD-1';
        if (dayOfWeek === 5) return 'MD-2';
        if (dayOfWeek === 4) return 'MD-3';
        if (dayOfWeek === 3) return 'MD-4';
        if (dayOfWeek === 2) return 'MD-5';
        if (dayOfWeek === 1) return 'MD-6';
      }
      return 'MD-3';
    }

    // Find closest match date
    const targetMs = Date.parse(dateStr + 'T00:00:00');
    let closestMs: number | null = null;
    let minDiff = Infinity;

    matchDates.forEach((mStr) => {
      const mMs = Date.parse(mStr + 'T00:00:00');
      const diff = Math.abs(targetMs - mMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestMs = mMs;
      }
    });

    if (closestMs === null) return 'MD-3';

    const diffDays = Math.round((targetMs - closestMs) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'MD';
    if (diffDays === -1) return 'MD-1';
    if (diffDays === -2) return 'MD-2';
    if (diffDays === -3) return 'MD-3';
    if (diffDays === -4) return 'MD-4';
    if (diffDays === -5) return 'MD-5';
    if (diffDays <= -6) return 'MD-6';
    if (diffDays === 1) return 'MD+1';
    if (diffDays >= 2) return 'MD+2';

    return 'MD-3';
  };

  // Load stored data
  const loadAllStoredData = () => {
    const sched = getStoredCalendarSchedule();
    const sessions = getStoredTrainingSessions();
    setCalendarSchedule(sched);
    setTrainingSessions(sessions);

    // Populate fields for currently selectedDate
    const existing = sessions[selectedDate];

    // Helper to build initial statuses for all roster athletes if missing
    const buildInitialStatuses = (stored?: Record<string, AthleteSessionStatus>) => {
      const result: Record<string, AthleteSessionStatus> = {};
      athletes.forEach((ath) => {
        if (stored && stored[ath.id]) {
          result[ath.id] = stored[ath.id];
        } else {
          result[ath.id] = {
            athleteId: ath.id,
            athleteName: ath.name,
            status: 'normal',
            notes: '',
          };
        }
      });
      return result;
    };

    if (existing) {
      setDayType(existing.dayType);
      setMatchCategory(existing.matchCategory || 'championship');
      setMatchDayOffset(existing.matchDayOffset);
      setStartTime(existing.startTime || (existing.dayType === 'match' ? '10:00' : '09:00'));
      setEndTime(existing.endTime || (existing.dayType === 'match' ? '11:30' : '10:30'));
      setTempStart(existing.tempStart !== undefined ? existing.tempStart.toString() : '20.0');
      setTempEnd(existing.tempEnd !== undefined ? existing.tempEnd.toString() : '25.0');
      setLocationName(existing.locationTime || 'Campo de São Martinho - Barcelos');
      setFocusNotes(existing.focusNotes || '');
      setCustomDeadline(existing.customDeadline || '');
      setComplementaryWork(existing.complementaryWork || {});
      setWeeklyRefDate(selectedDate);
      const dCfg = getStoredDeadlineConfig();
      const initWellness = existing.customDeadlineWellness || existing.customDeadline || dCfg.customDateDeadlinesWellness?.[selectedDate] || dCfg.customDateDeadlines?.[selectedDate] || '';
      const initRpe = existing.customDeadlineRpe || dCfg.customDateDeadlinesRpe?.[selectedDate] || '';

      setCustomDeadlineWellness(initWellness);
      setCustomDeadlineRpe(initRpe);
    } else {
      // Default fallbacks
      const typeOverride = sched[selectedDate];
      let initialType: CalendarDayType = 'rest';
      if (typeOverride) {
        initialType = typeOverride;
      } else {
        const isMatch = getAllMatches().some((m) => m.matchDate === selectedDate) || rpeList.some((r) => r.date === selectedDate && r.matchDayOffset === 'MD');
        const hasData = wellnessList.some((w) => w.date === selectedDate) || rpeList.some((r) => r.date === selectedDate);
        const [y, m, d] = selectedDate.split('-').map(Number);
        const isSun = !isNaN(y) && !isNaN(m) && !isNaN(d) ? new Date(y, m - 1, d).getDay() === 0 : false;
        initialType = isMatch ? 'match' : hasData ? 'training' : isSun ? 'rest' : 'training';
      }
      setDayType(initialType);
      setMatchCategory('championship');
      setMatchDayOffset(getAutoMatchDayOffset(selectedDate, initialType));
      if (initialType === 'match') {
        setStartTime('10:00');
        setEndTime('11:30');
      } else {
        setStartTime('09:00');
        setEndTime('10:30');
      }
      setTempStart('20.0');
      setTempEnd('25.0');
      setLocationName('Campo de São Martinho - Barcelos');
      setFocusNotes('');
      setComplementaryWork({});
      setWeeklyRefDate(selectedDate);
      setAthleteStatuses(buildInitialStatuses());

      const dCfg = getStoredDeadlineConfig();
      setCustomDeadline(dCfg.customDateDeadlines?.[selectedDate] || '');
      setCustomDeadlineWellness(dCfg.customDateDeadlinesWellness?.[selectedDate] || dCfg.customDateDeadlines?.[selectedDate] || '');
      setCustomDeadlineRpe(dCfg.customDateDeadlinesRpe?.[selectedDate] || '');
    }
  };

  const isInitialLoad = useRef(true);
  const lastUserEditTimestamp = useRef<number>(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleDataUpdate = () => {
      const localSessions = getStoredTrainingSessions();
      const localSched = getStoredCalendarSchedule();
      setTrainingSessions(localSessions);
      setCalendarSchedule(localSched);

      // Protect against overwriting user's active typing or recent edits (15s grace period)
      const isInputFocused =
        typeof document !== 'undefined' &&
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          document.activeElement.tagName === 'SELECT');

      const userRecentlyEdited = Date.now() - lastUserEditTimestamp.current < 15000;

      if (isInputFocused || userRecentlyEdited) {
        // User is currently interacting or recently edited: do not overwrite form state
        return;
      }

      // Re-populate form state for selectedDate only if truly idle and new session exists
      const currentSession = localSessions[selectedDate];
      if (currentSession) {
        if (currentSession.dayType) setDayType(currentSession.dayType);
        if (currentSession.matchCategory) setMatchCategory(currentSession.matchCategory);
        if (currentSession.matchDayOffset) setMatchDayOffset(currentSession.matchDayOffset);
        if (currentSession.startTime) setStartTime(currentSession.startTime);
        if (currentSession.endTime) setEndTime(currentSession.endTime);
        if (currentSession.tempStart !== undefined) setTempStart(currentSession.tempStart.toString());
        if (currentSession.tempEnd !== undefined) setTempEnd(currentSession.tempEnd.toString());
        if (currentSession.locationTime) setLocationName(currentSession.locationTime);
        if (currentSession.focusNotes !== undefined) setFocusNotes(currentSession.focusNotes);
        if (currentSession.athleteStatuses) setAthleteStatuses(currentSession.athleteStatuses);
      }
    };

    window.addEventListener('femperf_data_updated', handleDataUpdate);
    syncAllDataFromCloud();

    return () => {
      window.removeEventListener('femperf_data_updated', handleDataUpdate);
    };
  }, [selectedDate]);

  useEffect(() => {
    isInitialLoad.current = true;
    loadAllStoredData();
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // Centralized robust save function with immediate synchronous local storage & cloud persistence
  const performSave = async (explicitUpdates?: Partial<TrainingSessionInfo>) => {
    if (!selectedDate) return;
    lastUserEditTimestamp.current = Date.now();
    setSaveStatus('saving');

    const sTime = explicitUpdates?.startTime !== undefined ? explicitUpdates.startTime : startTime;
    const eTime = explicitUpdates?.endTime !== undefined ? explicitUpdates.endTime : endTime;
    const dType = explicitUpdates?.dayType !== undefined ? explicitUpdates.dayType : dayType;
    const mCat = explicitUpdates?.matchCategory !== undefined ? explicitUpdates.matchCategory : (dType === 'match' ? matchCategory : undefined);
    const mOffset = explicitUpdates?.matchDayOffset !== undefined ? explicitUpdates.matchDayOffset : matchDayOffset;
    const tStart = explicitUpdates?.tempStart !== undefined ? explicitUpdates.tempStart : (parseFloat(tempStart) || undefined);
    const tEnd = explicitUpdates?.tempEnd !== undefined ? explicitUpdates.tempEnd : (parseFloat(tempEnd) || undefined);
    const loc = explicitUpdates?.locationTime !== undefined ? explicitUpdates.locationTime : locationName;
    const notes = explicitUpdates?.focusNotes !== undefined ? explicitUpdates.focusNotes : focusNotes;
    const statuses = explicitUpdates?.athleteStatuses !== undefined ? explicitUpdates.athleteStatuses : athleteStatuses;
    const compWork = explicitUpdates?.complementaryWork !== undefined ? explicitUpdates.complementaryWork : complementaryWork;
    const cWellness = explicitUpdates?.customDeadlineWellness !== undefined ? explicitUpdates.customDeadlineWellness : customDeadlineWellness;
    const cRpe = explicitUpdates?.customDeadlineRpe !== undefined ? explicitUpdates.customDeadlineRpe : customDeadlineRpe;
    const cDead = explicitUpdates?.customDeadline !== undefined ? explicitUpdates.customDeadline : (cWellness.trim() || customDeadline.trim() || '');

    // Calculate duration
    let dur = durationMin;
    if (sTime && eTime && sTime.includes(':') && eTime.includes(':')) {
      const [sH, sM] = sTime.split(':').map((n) => parseInt(n, 10));
      const [eH, eM] = eTime.split(':').map((n) => parseInt(n, 10));
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let sTot = sH * 60 + sM;
        let eTot = eH * 60 + eM;
        if (eTot < sTot) eTot += 1440;
        dur = Math.max(0, eTot - sTot);
      }
    }

    const info: TrainingSessionInfo = {
      date: selectedDate,
      dayType: dType,
      matchCategory: mCat,
      matchDayOffset: mOffset,
      startTime: sTime,
      endTime: eTime,
      durationMin: dur,
      tempStart: isNaN(Number(tStart)) ? undefined : Number(tStart),
      tempEnd: isNaN(Number(tEnd)) ? undefined : Number(tEnd),
      tempDelta: tempDelta !== null ? tempDelta : undefined,
      locationTime: loc,
      focusNotes: notes,
      complementaryWork: compWork,
      athleteStatuses: statuses,
      customDeadline: cDead.trim() || '',
      customDeadlineWellness: cWellness.trim() || '',
      customDeadlineRpe: cRpe.trim() || '',
      updatedAt: Date.now(),
    };

    // 1. Synchronously update component state and local storage immediately
    setTrainingSessions((prev) => ({
      ...prev,
      [selectedDate]: info,
    }));
    setCalendarSchedule((prev) => ({
      ...prev,
      [selectedDate]: dType,
    }));

    saveTrainingSessionInfo(info);
    await saveTrainingSessionInfoAsync(info);
    syncTrainingSessionsToCloud({ ...trainingSessions, [selectedDate]: info });

    try {
      const dCfg = getStoredDeadlineConfig();
      const currentWellness = { ...(dCfg.customDateDeadlinesWellness || {}) };
      const currentRpe = { ...(dCfg.customDateDeadlinesRpe || {}) };
      const currentCustom = { ...(dCfg.customDateDeadlines || {}) };

      const defaultW = dType === 'match' ? (dCfg.wellnessMatchTime || '12:00') : (dCfg.wellnessRegularTime || '08:15');
      const defaultR = dType === 'match' ? (dCfg.rpeMatchTime || '18:30') : (dCfg.rpeRegularTime || '14:00');

      if (cWellness.trim() && cWellness.trim() !== defaultW) {
        currentWellness[selectedDate] = cWellness.trim();
        currentCustom[selectedDate] = cWellness.trim();
      } else {
        delete currentWellness[selectedDate];
        delete currentCustom[selectedDate];
      }

      if (cRpe.trim() && cRpe.trim() !== defaultR) {
        currentRpe[selectedDate] = cRpe.trim();
      } else {
        delete currentRpe[selectedDate];
      }

      saveDeadlineConfig({
        ...dCfg,
        customDateDeadlines: currentCustom,
        customDateDeadlinesWellness: currentWellness,
        customDateDeadlinesRpe: currentRpe,
      });
    } catch {}

    setSaveStatus('saved');
    if (saveStatusTimerRef.current) clearTimeout(saveStatusTimerRef.current);
    saveStatusTimerRef.current = setTimeout(() => {
      setSaveStatus('idle');
    }, 2500);
  };

  // Auto-save session configuration on any other field change (debounced fallback)
  useEffect(() => {
    if (isInitialLoad.current || !selectedDate) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [selectedDate, dayType, matchCategory, matchDayOffset, startTime, endTime, durationMin, tempStart, tempEnd, tempDelta, locationName, focusNotes, athleteStatuses, customDeadlineWellness, customDeadlineRpe, customDeadline]);

  // All dates in selected month for calendar strip
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

  const formattedMonthName = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    const name = d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(y, m, 1);
    const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonthStr);
  };

  const calendarMonthData = useMemo(() => {
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const firstDate = new Date(year, month - 1, 1);
    // In Portugal / Europe: Monday is day 0
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

  // Combined day types map (manual overrides or auto-detected)
  const dayTypesMap = useMemo(() => {
    const map: Record<string, CalendarDayType> = {};

    datesInMonth.forEach((dateStr) => {
      if (trainingSessions[dateStr]?.dayType) {
        map[dateStr] = trainingSessions[dateStr].dayType;
      } else if (calendarSchedule[dateStr] !== undefined) {
        map[dateStr] = calendarSchedule[dateStr];
      } else {
        const hasW = wellnessList.some((w) => w.date === dateStr);
        const hasR = rpeList.some((r) => r.date === dateStr);
        const hasH = hydrationList.some((h) => h.date === dateStr);
        const isM = rpeList.some((r) => r.date === dateStr && r.matchDayOffset === 'MD');

        if (isM) map[dateStr] = 'match';
        else if (hasW || hasR || hasH) map[dateStr] = 'training';
        else map[dateStr] = 'rest';
      }
    });

    return map;
  }, [datesInMonth, calendarSchedule, trainingSessions, wellnessList, rpeList, hydrationList]);

  // Set day type for any date directly (Treino, Jogo ou Folga)
  const handleSetSpecificDayType = (dateStr: string, next: CalendarDayType) => {
    lastUserEditTimestamp.current = Date.now();
    const updatedSched = {
      ...calendarSchedule,
      [dateStr]: next,
    };
    setCalendarSchedule(updatedSched);
    saveCalendarSchedule(updatedSched);

    const existing = trainingSessions[dateStr];
    const offset = getAutoMatchDayOffset(dateStr, next);

    const updatedInfo: TrainingSessionInfo = {
      ...(existing || {}),
      date: dateStr,
      durationMin: existing?.durationMin || 90,
      startTime: existing?.startTime || (next === 'match' ? '10:00' : '09:00'),
      endTime: existing?.endTime || (next === 'match' ? '11:30' : '10:30'),
      dayType: next,
      matchCategory: next === 'match' ? (existing?.matchCategory || 'championship') : undefined,
      matchDayOffset: offset,
      updatedAt: Date.now(),
    };

    saveTrainingSessionInfo(updatedInfo);
    saveTrainingSessionInfoAsync(updatedInfo);
    const newSessions = {
      ...trainingSessions,
      [dateStr]: updatedInfo,
    };
    setTrainingSessions(newSessions);
    syncTrainingSessionsToCloud(newSessions);

    // If currently selected date, update state & recalculate MD tag
    if (dateStr === selectedDate) {
      setDayType(next);
      setMatchDayOffset(offset);
      if (next === 'match') {
        setMatchCategory(existing?.matchCategory || 'championship');
        setStartTime(existing?.startTime || (startTime !== '09:00' ? startTime : '10:00'));
        setEndTime(existing?.endTime || (endTime !== '10:30' ? endTime : '11:30'));
      } else if (next === 'training') {
        setStartTime(existing?.startTime || (startTime !== '10:00' ? startTime : '09:00'));
        setEndTime(existing?.endTime || (endTime !== '11:30' ? endTime : '10:30'));
      }
    }
  };

  // Cycle day type on calendar strip button click
  const cycleDayTypeOnCalendar = (dateStr: string) => {
    const current = trainingSessions[dateStr]?.dayType || calendarSchedule[dateStr] || dayTypesMap[dateStr] || 'rest';
    let next: CalendarDayType = 'training';
    if (current === 'training') next = 'match';
    else if (current === 'match') next = 'rest';
    else next = 'training';

    handleSetSpecificDayType(dateStr, next);
  };

  // Handle start time change - strictly updates training start time without altering default deadlines
  const handleStartTimeChange = (newStartTime: string) => {
    lastUserEditTimestamp.current = Date.now();
    setStartTime(newStartTime);
    performSave({
      startTime: newStartTime,
    });
  };

  // Handle end time change - strictly updates training end time without altering default deadlines
  const handleEndTimeChange = (newEndTime: string) => {
    lastUserEditTimestamp.current = Date.now();
    setEndTime(newEndTime);
    performSave({
      endTime: newEndTime,
    });
  };

  // Change day type for currently selected session and auto-update microcycle tag
  const handleSelectDayType = (newType: CalendarDayType) => {
    lastUserEditTimestamp.current = Date.now();
    setDayType(newType);
    const newOffset = getAutoMatchDayOffset(selectedDate, newType);
    setMatchDayOffset(newOffset);
    const existing = trainingSessions[selectedDate];

    let matchStart = startTime;
    let matchEnd = endTime;
    let newCategory = matchCategory;

    if (newType === 'match') {
      if (existing?.matchCategory) {
        newCategory = existing.matchCategory;
        setMatchCategory(newCategory);
      }
      matchStart = existing?.startTime || (startTime !== '09:00' ? startTime : '10:00');
      matchEnd = existing?.endTime || (endTime !== '10:30' ? endTime : '11:30');
      setStartTime(matchStart);
      setEndTime(matchEnd);
    } else if (newType === 'training') {
      matchStart = existing?.startTime || (startTime && startTime !== '10:00' ? startTime : '09:00');
      matchEnd = existing?.endTime || (endTime && endTime !== '11:30' ? endTime : '10:30');
      setStartTime(matchStart);
      setEndTime(matchEnd);
    }

    performSave({
      dayType: newType,
      matchCategory: newType === 'match' ? newCategory : undefined,
      matchDayOffset: newOffset,
      startTime: matchStart,
      endTime: matchEnd,
    });
  };

  // Change match category (friendly, championship, cup) and save immediately
  const handleSelectMatchCategory = (cat: 'friendly' | 'championship' | 'cup') => {
    setMatchCategory(cat);

    const startT = parseFloat(tempStart);
    const endT = parseFloat(tempEnd);

    const info: TrainingSessionInfo = {
      date: selectedDate,
      dayType,
      matchCategory: cat,
      matchDayOffset,
      startTime,
      endTime,
      durationMin,
      tempStart: isNaN(startT) ? undefined : startT,
      tempEnd: isNaN(endT) ? undefined : endT,
      tempDelta: tempDelta !== null ? tempDelta : undefined,
      locationTime: locationName,
      focusNotes,
      athleteStatuses,
      customDeadline: customDeadlineWellness.trim() || customDeadline.trim() || '',
      customDeadlineWellness: customDeadlineWellness.trim() || '',
      customDeadlineRpe: customDeadlineRpe.trim() || '',
      updatedAt: Date.now(),
    };

    saveTrainingSessionInfo(info);
    setTrainingSessions((prev) => ({
      ...prev,
      [selectedDate]: info,
    }));
  };

  // Update athlete training status
  const handleUpdateAthleteStatus = (athleteId: string, status: AthleteTrainingStatus, notes?: string) => {
    const ath = athletes.find((a) => a.id === athleteId);
    const name = ath ? ath.name : athleteId;

    setAthleteStatuses((prev) => ({
      ...prev,
      [athleteId]: {
        athleteId,
        athleteName: name,
        status,
        notes: notes !== undefined ? notes : prev[athleteId]?.notes || '',
      },
    }));
  };

  const handleSetAllNormal = () => {
    const allNormal: Record<string, AthleteSessionStatus> = {};
    athletes.forEach((ath) => {
      allNormal[ath.id] = {
        athleteId: ath.id,
        athleteName: ath.name,
        status: 'normal',
        notes: athleteStatuses[ath.id]?.notes || '',
      };
    });
    setAthleteStatuses(allNormal);
  };

  // Week navigation for Complementary Work tab
  const handlePrevWeek = () => {
    const [y, m, d] = weeklyRefDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 7);
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    setWeeklyRefDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleNextWeek = () => {
    const [y, m, d] = weeklyRefDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 7);
    const yStr = dt.getFullYear();
    const mStr = String(dt.getMonth() + 1).padStart(2, '0');
    const dStr = String(dt.getDate()).padStart(2, '0');
    setWeeklyRefDate(`${yStr}-${mStr}-${dStr}`);
  };

  const handleCurrentWeek = () => {
    setWeeklyRefDate(todayStr);
  };

  const weekDatesForComplementary = useMemo(() => {
    return getWeekDates(weeklyRefDate);
  }, [weeklyRefDate]);

  // Sync microcycle title & notes when switching week
  useEffect(() => {
    const weekStart = weekDatesForComplementary[0];
    if (!weekStart) return;
    const meta = getStoredWeeklyPlanMetadata(weekStart);
    if (meta.title) {
      setMicrocycleTitle(meta.title);
    } else {
      const curr = getStoredWeeklyPlanMetadata('__current__');
      if (curr.title) setMicrocycleTitle(curr.title);
    }
    if (meta.notes !== undefined) {
      setWeeklyTeamNotes(meta.notes);
    } else {
      const curr = getStoredWeeklyPlanMetadata('__current__');
      if (curr.notes) setWeeklyTeamNotes(curr.notes);
    }
  }, [weekDatesForComplementary]);

  const handleTitleChange = (val: string) => {
    setMicrocycleTitle(val);
    const weekStart = weekDatesForComplementary[0];
    saveWeeklyPlanMetadata(weekStart, { title: val, notes: weeklyTeamNotes });
    setMetaSaveStatus(true);
    if (metaSaveTimeoutRef.current) clearTimeout(metaSaveTimeoutRef.current);
    metaSaveTimeoutRef.current = setTimeout(() => setMetaSaveStatus(false), 2000);
  };

  const handleNotesChange = (val: string) => {
    setWeeklyTeamNotes(val);
    const weekStart = weekDatesForComplementary[0];
    saveWeeklyPlanMetadata(weekStart, { title: microcycleTitle, notes: val });
    setMetaSaveStatus(true);
    if (metaSaveTimeoutRef.current) clearTimeout(metaSaveTimeoutRef.current);
    metaSaveTimeoutRef.current = setTimeout(() => setMetaSaveStatus(false), 2000);
  };

  // Toggle complementary work item for a given date
  const handleToggleComplementaryItem = (key: keyof ComplementaryWorkOptions, targetDate: string = selectedDate) => {
    lastUserEditTimestamp.current = Date.now();
    const dType = calendarSchedule[targetDate] || 'rest';
    const existing = trainingSessions[targetDate] || {
      date: targetDate,
      dayType: dType,
      matchDayOffset: getAutoMatchDayOffset(targetDate, dType),
      durationMin: 90,
      startTime: dType === 'match' ? '10:00' : '09:00',
      endTime: dType === 'match' ? '11:30' : '10:30',
    };

    const currentComp: ComplementaryWorkConfig = existing.complementaryWork || (targetDate === selectedDate ? complementaryWork : {});
    const updatedComp: ComplementaryWorkConfig = {
      ...currentComp,
      [key]: !currentComp[key],
    };

    if (targetDate === selectedDate) {
      setComplementaryWork(updatedComp);
    }

    const updatedSession: TrainingSessionInfo = {
      ...existing,
      complementaryWork: updatedComp,
      updatedAt: Date.now(),
    };

    const newSessions = {
      ...trainingSessions,
      [targetDate]: updatedSession,
    };
    setTrainingSessions(newSessions);
    saveTrainingSessionInfo(updatedSession);
    syncTrainingSessionsToCloud(newSessions);
  };

  // Update complementary notes for a given date
  const handleUpdateComplementaryNotes = (notes: string, targetDate: string = selectedDate) => {
    lastUserEditTimestamp.current = Date.now();
    const dType = calendarSchedule[targetDate] || 'rest';
    const existing = trainingSessions[targetDate] || {
      date: targetDate,
      dayType: dType,
      matchDayOffset: getAutoMatchDayOffset(targetDate, dType),
      durationMin: 90,
      startTime: dType === 'match' ? '10:00' : '09:00',
      endTime: dType === 'match' ? '11:30' : '10:30',
    };

    const currentComp: ComplementaryWorkConfig = existing.complementaryWork || (targetDate === selectedDate ? complementaryWork : {});
    const updatedComp: ComplementaryWorkConfig = {
      ...currentComp,
      notes,
    };

    if (targetDate === selectedDate) {
      setComplementaryWork(updatedComp);
    }

    const updatedSession: TrainingSessionInfo = {
      ...existing,
      complementaryWork: updatedComp,
      updatedAt: Date.now(),
    };

    const newSessions = {
      ...trainingSessions,
      [targetDate]: updatedSession,
    };
    setTrainingSessions(newSessions);
    saveTrainingSessionInfo(updatedSession);
    syncTrainingSessionsToCloud(newSessions);
  };

  // Update training or match times directly for any date
  const handleUpdateDayTimes = (targetDate: string, newStartTime: string, newEndTime: string) => {
    lastUserEditTimestamp.current = Date.now();
    const dType = trainingSessions[targetDate]?.dayType || calendarSchedule[targetDate] || dayTypesMap[targetDate] || 'training';
    const existing = trainingSessions[targetDate];

    let duration = existing?.durationMin || 90;
    if (newStartTime && newEndTime) {
      const [sH, sM] = newStartTime.split(':').map((n) => parseInt(n, 10));
      const [eH, eM] = newEndTime.split(':').map((n) => parseInt(n, 10));
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0) duration = diff;
      }
    }

    const updatedSession: TrainingSessionInfo = {
      ...(existing || {
        date: targetDate,
        dayType: dType,
        matchDayOffset: getAutoMatchDayOffset(targetDate, dType),
      }),
      startTime: newStartTime,
      endTime: newEndTime,
      durationMin: duration,
      updatedAt: Date.now(),
    };

    if (targetDate === selectedDate) {
      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }

    const newSessions = {
      ...trainingSessions,
      [targetDate]: updatedSession,
    };
    setTrainingSessions(newSessions);
    saveTrainingSessionInfo(updatedSession);
    syncTrainingSessionsToCloud(newSessions);
  };

  const handleUpdateDayGymTimes = (targetDate: string, newStartTime: string, newEndTime: string) => {
    lastUserEditTimestamp.current = Date.now();
    const existing = trainingSessions[targetDate];
    const dType = existing?.dayType || calendarSchedule[targetDate] || dayTypesMap[targetDate] || 'training';

    let duration = existing?.gymDurationMin || 45;
    if (newStartTime && newEndTime) {
      const [sH, sM] = newStartTime.split(':').map((n) => parseInt(n, 10));
      const [eH, eM] = newEndTime.split(':').map((n) => parseInt(n, 10));
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0) duration = diff;
      }
    }

    const updatedSession: TrainingSessionInfo = {
      ...(existing || {
        date: targetDate,
        dayType: dType,
        matchDayOffset: getAutoMatchDayOffset(targetDate, dType),
        durationMin: 90,
      }),
      gymStartTime: newStartTime,
      gymEndTime: newEndTime,
      gymDurationMin: duration,
      updatedAt: Date.now(),
    };

    const newSessions = {
      ...trainingSessions,
      [targetDate]: updatedSession,
    };
    setTrainingSessions(newSessions);
    saveTrainingSessionInfo(updatedSession);
    syncTrainingSessionsToCloud(newSessions);
  };

  const openEditDayModal = (dateStr: string) => {
    const s = trainingSessions[dateStr];
    const dType = s?.dayType || calendarSchedule[dateStr] || dayTypesMap[dateStr] || 'training';
    setEditingDayDate(dateStr);
    setEditDayModalType(dType);
    setEditDayModalStartTime(s?.startTime || (dType === 'match' ? '10:00' : '09:00'));
    setEditDayModalEndTime(s?.endTime || (dType === 'match' ? '11:30' : '10:30'));
    setEditDayModalGymStartTime(s?.gymStartTime || '10:45');
    setEditDayModalGymEndTime(s?.gymEndTime || '11:30');
    setEditDayModalMatchCategory(s?.matchCategory || 'championship');
    setEditDayModalLocation(s?.locationTime || '');
    setEditDayModalFocus(s?.focusNotes || '');
  };

  const handleSaveEditDayModal = () => {
    if (!editingDayDate) return;
    lastUserEditTimestamp.current = Date.now();
    const dateStr = editingDayDate;
    const existing = trainingSessions[dateStr];
    const offset = getAutoMatchDayOffset(dateStr, editDayModalType);

    let duration = 90;
    if (editDayModalStartTime && editDayModalEndTime) {
      const [sH, sM] = editDayModalStartTime.split(':').map((n) => parseInt(n, 10));
      const [eH, eM] = editDayModalEndTime.split(':').map((n) => parseInt(n, 10));
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0) duration = diff;
      }
    }

    let gymDuration = existing?.gymDurationMin || 45;
    if (editDayModalGymStartTime && editDayModalGymEndTime) {
      const [sH, sM] = editDayModalGymStartTime.split(':').map((n) => parseInt(n, 10));
      const [eH, eM] = editDayModalGymEndTime.split(':').map((n) => parseInt(n, 10));
      if (!isNaN(sH) && !isNaN(sM) && !isNaN(eH) && !isNaN(eM)) {
        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0) gymDuration = diff;
      }
    }

    const updatedSession: TrainingSessionInfo = {
      ...(existing || {}),
      date: dateStr,
      dayType: editDayModalType,
      matchDayOffset: offset,
      matchCategory: editDayModalType === 'match' ? editDayModalMatchCategory : undefined,
      startTime: editDayModalType === 'rest' ? undefined : editDayModalStartTime,
      endTime: editDayModalType === 'rest' ? undefined : editDayModalEndTime,
      durationMin: duration,
      gymStartTime: editDayModalType === 'rest' ? undefined : editDayModalGymStartTime,
      gymEndTime: editDayModalType === 'rest' ? undefined : editDayModalGymEndTime,
      gymDurationMin: gymDuration,
      locationTime: editDayModalLocation.trim() || undefined,
      focusNotes: editDayModalFocus.trim() || undefined,
      updatedAt: Date.now(),
    };

    const updatedSchedule = {
      ...calendarSchedule,
      [dateStr]: editDayModalType,
    };
    setCalendarSchedule(updatedSchedule);
    saveCalendarSchedule(updatedSchedule);

    const newSessions = {
      ...trainingSessions,
      [dateStr]: updatedSession,
    };
    setTrainingSessions(newSessions);
    saveTrainingSessionInfo(updatedSession);
    syncTrainingSessionsToCloud(newSessions);

    if (dateStr === selectedDate) {
      setDayType(editDayModalType);
      setMatchDayOffset(offset);
      if (editDayModalType === 'match') {
        setMatchCategory(editDayModalMatchCategory);
      }
      setStartTime(editDayModalStartTime);
      setEndTime(editDayModalEndTime);
      setLocationName(editDayModalLocation);
      setFocusNotes(editDayModalFocus);
    }

    setEditingDayDate(null);
    setSaveSuccess(`Horário e atividade de ${getDayNamePt(dateStr)} (${formatDatePtShort(dateStr)}) atualizados com sucesso!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Apply weekly preset
  const handleApplyWeeklyPreset = async (presetKey: 'championship_saturday' | 'championship_sunday' | 'regenerative' | 'double_game') => {
    lastUserEditTimestamp.current = Date.now();
    const week = weekDatesForComplementary;
    const updated = applyWeeklyPreset(presetKey, week, trainingSessions);

    setTrainingSessions(updated);
    if (week.includes(selectedDate)) {
      setComplementaryWork(updated[selectedDate]?.complementaryWork || {});
    }
    // Update local storage and perform a single atomic cloud sync
    localStorage.setItem('femperf_training_sessions_info', JSON.stringify(updated));
    await syncTrainingSessionsToCloud(updated);

    setSaveSuccess(`Preset aplicado e sincronizado com as jogadoras (${formatDatePtShort(week[0])} a ${formatDatePtShort(week[6])})!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // Clear complementary work for the current week
  const handleClearWeekComplementary = async () => {
    lastUserEditTimestamp.current = Date.now();
    const week = weekDatesForComplementary;
    const updated = { ...trainingSessions };
    week.forEach((d) => {
      if (updated[d]) {
        updated[d] = {
          ...updated[d],
          complementaryWork: {},
          updatedAt: Date.now(),
        };
      }
    });
    setTrainingSessions(updated);
    if (week.includes(selectedDate)) {
      setComplementaryWork({});
    }
    localStorage.setItem('femperf_training_sessions_info', JSON.stringify(updated));
    await syncTrainingSessionsToCloud(updated);
    setSaveSuccess(`Trabalho complementar limpo para a semana!`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  // WhatsApp share & copy
  const handleShareWhatsApp = () => {
    const text = generateWhatsAppWeeklyPlanText({
      microcycleTitle,
      weekDates: weekDatesForComplementary,
      sessions: trainingSessions,
      generalNotes: weeklyTeamNotes,
      lang: whatsAppLang,
    });
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyWhatsApp = async () => {
    const text = generateWhatsAppWeeklyPlanText({
      microcycleTitle,
      weekDates: weekDatesForComplementary,
      sessions: trainingSessions,
      generalNotes: weeklyTeamNotes,
      lang: whatsAppLang,
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2500);
    }
  };

  // Save current training session info
  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setIsSaving(true);
    await performSave();
    setIsSaving(false);

    setSaveSuccess(`Informação do ${dayType === 'match' ? 'jogo' : 'treino'} para ${selectedDate} guardada com sucesso!`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  // Athlete responses on selected date
  const wellnessTodayCount = wellnessList.filter((w) => w.date === selectedDate).length;
  const rpeTodayCount = rpeList.filter((r) => r.date === selectedDate).length;
  const hydrationTodayCount = hydrationList.filter((h) => h.date === selectedDate).length;

  const formattedHoursMinutes = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h > 0) return `${min} min (${h}h${m > 0 ? ` ${m}m` : ''})`;
    return `${min} min`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-Navigation Pills for Treino & Calendário */}
      <div className="flex flex-wrap gap-2 bg-dark-card/80 p-2 rounded-2xl border border-slate-800">
        <button
          type="button"
          onClick={() => setSessionSubTab('calendar')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'calendar'
              ? 'bg-brand-lime text-slate-950 shadow-md font-extrabold ring-1 ring-lime-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Calendar className="h-3.5 w-3.5 text-brand-lime" />
          <span>Calendário Mensal</span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('timing')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'timing'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold ring-1 ring-amber-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Clock className="h-3.5 w-3.5 text-amber-400" />
          <span>Horário do Treino</span>
          <span className="ml-1 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] text-amber-300 font-extrabold border border-amber-500/30">
            {startTime} - {endTime}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('complementary')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'complementary'
              ? 'bg-purple-600 text-white shadow-md font-extrabold ring-1 ring-purple-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Dumbbell className="h-3.5 w-3.5 text-purple-400" />
          <span>Extra-Treino (Pós-Treino)</span>
          <span className="ml-1 rounded-full bg-slate-900/60 px-2 py-0.5 text-[10px] text-purple-300 font-extrabold border border-purple-500/30">
            Pós-Treino
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('roster')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'roster'
              ? 'bg-red-600 text-white shadow-md font-extrabold ring-1 ring-red-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="h-3.5 w-3.5 text-rose-400" />
          <span>Presenças do Plantel</span>
          <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-300 font-extrabold">
            {statusCounts.normal}/{athletes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('conditions')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'conditions'
              ? 'bg-cyan-500 text-slate-950 shadow-md font-extrabold ring-1 ring-cyan-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Thermometer className="h-3.5 w-3.5 text-cyan-400" />
          <span>Condições & Notas</span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('submissions')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'submissions'
              ? 'bg-blue-500 text-white shadow-md font-extrabold ring-1 ring-blue-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Activity className="h-3.5 w-3.5 text-blue-400" />
          <span>Respostas do Dia</span>
        </button>

        <button
          type="button"
          onClick={() => setSessionSubTab('all')}
          className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            sessionSubTab === 'all'
              ? 'bg-slate-700 text-white shadow-md font-extrabold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="h-3.5 w-3.5 text-slate-300" />
          <span>Ver Tudo</span>
        </button>
      </div>

      {/* 1. Activity Calendar Bar (DIAS DO MÊS & CALENDÁRIO DE ATIVIDADE) */}
      {(sessionSubTab === 'calendar' || sessionSubTab === 'all') && (
        <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-4 shadow-lg animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar className="h-5 w-5 text-brand-lime shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-xs font-extrabold uppercase text-slate-100">
                  Dias do Mês & Calendário de Atividade
                </h3>
                <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-800/50 font-bold">
                  {formattedMonthName}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Clica num dia para selecionar e editar o treino. Clica na etiqueta da atividade para alternar (⚽ Treino / 🏆 Jogo / 🏖️ Folga).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle: Grid vs Strip */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800">
              <button
                type="button"
                onClick={() => setCalendarViewMode('grid')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

            {/* Month Navigation & Selector */}
            <div className="flex items-center space-x-1 bg-dark-bg border border-slate-700 rounded-xl px-1.5 py-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer px-1 py-0.5"
              />
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                title="Mês seguinte"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Legend badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="bg-blue-950/60 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg font-bold">⚽ Treino</span>
              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold">🏆 Jogo</span>
              <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg font-bold">🏖️ Folga</span>
            </div>
          </div>
        </div>

        {/* 1A. Calendar Grid View (Requested Mode) */}
        {calendarViewMode === 'grid' ? (
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

            {/* 7-column Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Padding cells before day 1 */}
              {calendarMonthData.paddingLeading.map((_, idx) => (
                <div
                  key={`pad-lead-${idx}`}
                  className="min-h-[70px] sm:min-h-[88px] rounded-xl border border-slate-800/30 bg-slate-950/20 opacity-25"
                />
              ))}

              {/* Day cells */}
              {datesInMonth.map((dStr) => {
                const currentType = dayTypesMap[dStr] || 'rest';
                const dayNum = dStr.split('-')[2];
                const isToday = dStr === todayStr;
                const isSelected = dStr === selectedDate;
                const session = trainingSessions[dStr];

                let icon = '🏖️';
                let label = 'Folga';
                let cardStyle = 'border-slate-800/80 bg-slate-900/60 text-slate-400 hover:bg-slate-850 hover:border-slate-700';
                let badgeStyle = 'bg-slate-800/80 text-slate-400 border border-slate-700/80';

                if (currentType === 'training') {
                  icon = '⚽';
                  label = 'Treino';
                  cardStyle = 'border-blue-500/40 bg-blue-950/30 text-blue-200 hover:bg-blue-950/50 hover:border-blue-500/70 shadow-sm';
                  badgeStyle = 'bg-blue-900/60 text-blue-300 border border-blue-500/50';
                } else if (currentType === 'match') {
                  const cat = session?.matchCategory;
                  icon = cat === 'cup' ? '🥇' : cat === 'friendly' ? '🤝' : '🏆';
                  label = cat === 'cup' ? 'Taça' : cat === 'friendly' ? 'Treino' : 'Jogo';
                  cardStyle = cat === 'cup'
                    ? 'border-purple-500/50 bg-purple-950/30 text-purple-200 hover:bg-purple-950/50 hover:border-purple-500/80 shadow-sm'
                    : 'border-emerald-500/50 bg-emerald-950/30 text-emerald-200 hover:bg-emerald-950/50 hover:border-emerald-500/80 shadow-sm';
                  badgeStyle = cat === 'cup'
                    ? 'bg-purple-900/60 text-purple-300 border border-purple-500/50 font-black'
                    : 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/50 font-black';
                }

                if (isSelected) {
                  cardStyle += ' ring-2 ring-red-500 border-red-500 bg-red-950/30 shadow-lg';
                }

                return (
                  <div
                    key={dStr}
                    onClick={() => {
                      onSelectDate(dStr);
                    }}
                    title={`${dStr}: Clica para selecionar (${label})`}
                    className={`group relative flex flex-col justify-between p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer min-h-[70px] sm:min-h-[88px] select-none ${cardStyle}`}
                  >
                    {/* Header: Day number + Today pill */}
                    <div className="flex items-center justify-between">
                      <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-red-400 font-extrabold' : 'text-slate-200'}`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[7px] sm:text-[8px] uppercase font-black bg-red-600 text-white px-1.5 py-0.2 rounded-full shadow-sm">
                          Hoje
                        </span>
                      )}
                    </div>

                    {/* Center: Activity Badge (clickable to toggle activity) */}
                    <div className="flex items-center justify-center my-0.5 sm:my-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleDayTypeOnCalendar(dStr);
                        }}
                        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[11px] font-bold hover:scale-105 transition-transform cursor-pointer ${badgeStyle}`}
                        title="Clica para alternar atividade (Treino ➔ Jogo ➔ Folga)"
                      >
                        <span>{icon}</span>
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    </div>

                    {/* Footer: Start time & Match Day offset */}
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400 truncate">
                      {session?.startTime ? (
                        <span className="truncate text-cyan-400 font-bold flex items-center space-x-0.5" title={`Início às ${session.startTime}`}>
                          <Clock className="h-2.5 w-2.5 inline shrink-0" />
                          <span>{session.startTime}</span>
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-60 transition-opacity text-[8px] text-slate-500">
                          {isSelected ? 'Alternar' : 'Selecionar'}
                        </span>
                      )}

                      {session?.matchDayOffset && currentType === 'training' && (
                        <span className="font-extrabold text-[8px] text-blue-300 bg-blue-950/80 px-1 py-0.2 rounded border border-blue-500/30">
                          {session.matchDayOffset}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Padding cells after last day */}
              {calendarMonthData.paddingTrailing.map((_, idx) => (
                <div
                  key={`pad-trail-${idx}`}
                  className="min-h-[70px] sm:min-h-[88px] rounded-xl border border-slate-800/30 bg-slate-950/20 opacity-25"
                />
              ))}
            </div>
          </div>
        ) : (
          /* 1B. Scrollable Horizontal Strip View (Compact) */
          <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {datesInMonth.map((dStr) => {
              const currentType = dayTypesMap[dStr] || 'rest';
              const dayNum = dStr.split('-')[2];
              const isToday = dStr === todayStr;
              const isSelected = dStr === selectedDate;

              let icon = '🏖️';
              let label = 'Folga';
              let style = 'border-slate-800 bg-slate-900/80 text-slate-500 hover:bg-slate-800';

              if (currentType === 'training') {
                icon = '⚽';
                label = 'Treino';
                style = 'border-blue-500/60 bg-blue-950/60 text-blue-200 hover:bg-blue-900/60';
              } else if (currentType === 'match') {
                const session = trainingSessions[dStr];
                const cat = session?.matchCategory;
                icon = cat === 'cup' ? '🥇' : cat === 'friendly' ? '🤝' : '🏆';
                label = cat === 'cup' ? 'Taça' : cat === 'friendly' ? 'Treino' : 'Jogo';
                style = cat === 'cup'
                  ? 'border-purple-500/80 bg-purple-950/70 text-purple-300 hover:bg-purple-900/70 font-black'
                  : 'border-emerald-500/80 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70 font-black';
              }

              if (isSelected) {
                style += ' ring-2 ring-red-500 border-red-500 bg-red-950/40 shadow-lg scale-105';
              }

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => {
                    onSelectDate(dStr);
                  }}
                  title={`${dStr}: Clica para selecionar (${label})`}
                  className={`flex flex-col items-center justify-center min-w-[46px] py-1.5 px-1 rounded-xl border transition-all text-xs font-bold relative ${style}`}
                >
                  <span className="text-[10px] opacity-75">{dayNum}</span>
                  <span className="text-sm font-black">{icon}</span>
                  {isToday && (
                    <span className="text-[7px] uppercase font-black bg-red-600 text-white px-1 rounded-full mt-0.5">
                      Hoje
                    </span>
                  )}
                </button>
              );
            })}
            </div>
          )}

          {/* Quick Summary Strip for Selected Day in Calendar View */}
          {sessionSubTab === 'calendar' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg font-black shrink-0 ${
                  dayType === 'match'
                    ? matchCategory === 'cup'
                      ? 'bg-purple-600/20 text-purple-300 border-purple-500/40'
                      : matchCategory === 'friendly'
                      ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                    : dayType === 'rest'
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                    : 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                }`}>
                  {dayType === 'match'
                    ? matchCategory === 'cup'
                      ? '🥇'
                      : matchCategory === 'friendly'
                      ? '🤝'
                      : '🏆'
                    : dayType === 'rest'
                    ? '🏖️'
                    : '⚽'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-100 uppercase flex items-center space-x-2">
                    <span>{selectedDate}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      dayType === 'match'
                        ? matchCategory === 'cup'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/40'
                          : matchCategory === 'friendly'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : dayType === 'rest'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {dayType === 'match'
                        ? matchCategory === 'cup'
                          ? 'Jogo de Taça (MD)'
                          : matchCategory === 'friendly'
                          ? 'Jogo de Treino (MD)'
                          : 'Dia de Jogo (MD)'
                        : dayType === 'rest'
                        ? 'Dia de Folga'
                        : 'Dia de Treino'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Horário: <strong className="text-cyan-300">{startTime} - {endTime}</strong> ({formattedHoursMinutes(durationMin)}) &bull; Presenças: <strong className="text-emerald-400">{statusCounts.normal}</strong> normais, <strong className="text-amber-400">{statusCounts.conditioned}</strong> cond., <strong className="text-rose-400">{statusCounts.injured}</strong> les.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSessionSubTab('timing')}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>Editar Horários</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionSubTab('roster')}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center space-x-1 cursor-pointer"
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Presenças ({statusCounts.normal}/{athletes.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 2. DEDICATED WEEKLY EXTRA-TREINO & WHATSAPP SHARING PANEL */}
      {(sessionSubTab === 'complementary' || sessionSubTab === 'all') && (
        <div className="space-y-5 rounded-2xl border border-purple-500/30 bg-dark-card p-5 shadow-xl animate-fade-in">
          {/* Header & Week Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xl shadow-md">
                🏋️‍♂️
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-black uppercase text-slate-100">
                    Planeamento Semanal de Extra-Treino (Sempre Pós-Treino)
                  </h3>
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-black text-purple-300 border border-purple-500/30 uppercase">
                    ⚡ Sempre Pós-Treino
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Planeia o trabalho de ginásio, recuperação e mobilidade da semana e partilha no grupo do WhatsApp com 1 clique.
                </p>
              </div>
            </div>

            {/* Week navigation buttons */}
            <div className="flex items-center space-x-2 self-start md:self-auto">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-dark-bg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Semana Ant.</span>
              </button>

              <button
                type="button"
                onClick={handleCurrentWeek}
                className="px-3 py-1.5 rounded-xl border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-900/50 text-xs font-extrabold transition-all cursor-pointer"
              >
                Semana Atual
              </button>

              <button
                type="button"
                onClick={handleNextWeek}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-700 bg-dark-bg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                <span>Próxima</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                disabled={syncStatus === 'syncing'}
                onClick={handleManualSyncToCloud}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-emerald-500/50 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer disabled:opacity-50"
                title="Publica e sincroniza imediatamente o plano semanal com a aplicação das jogadoras"
              >
                {syncStatus === 'syncing' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                ) : syncStatus === 'synced' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>{syncStatus === 'synced' ? '✓ Publicado p/ Jogadoras' : syncStatus === 'syncing' ? 'A publicar...' : 'Publicar p/ Jogadoras'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-purple-500/50 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900 hover:to-indigo-900 text-purple-200 text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer"
                title="Exportar Poster / Documento da Semana (PDF, PNG ou Impressão)"
              >
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                <span>📄 Exportar Poster</span>
              </button>
            </div>
          </div>

          {/* Post-Training Mandatory Rule Banner */}
          <div className="flex items-center space-x-2.5 p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300 text-xs font-bold">
            <span className="text-base shrink-0">⚡</span>
            <div>
              <strong className="uppercase font-black text-amber-200">Indicação Obrigatória:</strong>
              <span className="ml-1 text-slate-200">Todo o trabalho complementar (ginásio, mobilidade, gelo e sauna) é para ser realizado <u>SEMPRE APÓS O TREINO</u> de campo.</span>
            </div>
          </div>

          {/* Microcycle Title & General Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-slate-300 flex items-center space-x-1.5">
                  <span>📅 Título do Microciclo / Semana:</span>
                </label>
                {metaSaveStatus && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                    <Check className="h-3 w-3" />
                    <span>Guardado</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Ex: Microciclo 6 • Preparação Campeonato"
                value={microcycleTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 text-xs font-bold text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400">
                Semana de <strong className="text-slate-200">{formatDatePtShort(weekDatesForComplementary[0])}</strong> a <strong className="text-slate-200">{formatDatePtShort(weekDatesForComplementary[6])}</strong> (Segunda a Domingo)
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-slate-300 flex items-center space-x-1.5">
                  <span>💬 Nota Geral da Equipa Técnica (Aparece no WhatsApp):</span>
                </label>
                {metaSaveStatus && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1 animate-fade-in">
                    <Check className="h-3 w-3" />
                    <span>Guardado</span>
                  </span>
                )}
              </div>
              <textarea
                rows={2}
                placeholder="Ex: Ginásio aberto 45 min antes. Levar material de treino completo. Recuperação obrigatória sábado..."
                value={weeklyTeamNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Preset Selector Buttons */}
          <div className="space-y-2 p-3.5 rounded-xl border border-purple-500/20 bg-purple-950/10">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-purple-300 flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Preenchimento Rápido por Presets:</span>
              </span>
              <button
                type="button"
                onClick={handleClearWeekComplementary}
                className="flex items-center space-x-1 text-[10px] font-extrabold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpar Trabalho da Semana</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyWeeklyPreset('championship_saturday')}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 text-indigo-200 text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-101"
              >
                <span>🏆</span>
                <span>Jogo ao Sábado (MD Sábado)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyWeeklyPreset('championship_sunday')}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/50 text-amber-200 text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-101"
              >
                <span>🥇</span>
                <span>Jogo ao Domingo (MD Domingo)</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyWeeklyPreset('regenerative')}
                className="flex items-center justify-center space-x-2 p-2.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 text-xs font-extrabold transition-all cursor-pointer shadow-sm hover:scale-101"
              >
                <span>🧘</span>
                <span>Semana Regenerativa / Paragem</span>
              </button>
            </div>
          </div>

          {/* 7-Day Interactive Card Grid (Segunda a Domingo) */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-200">
              Distribuição Diária por Atividade & Conteúdos (7 Dias)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {weekDatesForComplementary.map((dateStr) => {
                const s = trainingSessions[dateStr];
                const dayType = s?.dayType || calendarSchedule[dateStr] || dayTypesMap[dateStr] || 'rest';
                const comp = s?.complementaryWork || {};
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    className={`rounded-xl border p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                      isSelected
                        ? 'border-purple-400 bg-purple-950/30 ring-2 ring-purple-500/40 shadow-lg'
                        : isToday
                        ? 'border-brand-lime/60 bg-dark-surface/60 ring-1 ring-brand-lime/40'
                        : dayType === 'rest'
                        ? 'border-slate-800/80 bg-slate-950/50 opacity-95'
                        : 'border-slate-800 bg-dark-bg/80'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Day Header */}
                      <div className="border-b border-slate-800/80 pb-2.5 space-y-2">
                        {/* Row 1: Day Name + Date / MD Tag */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs sm:text-sm font-black text-slate-100 tracking-tight">
                              {getDayNamePt(dateStr)}
                            </span>
                            {isToday && (
                              <span className="text-[9px] font-black uppercase text-brand-lime bg-brand-lime/10 px-1.5 py-0.5 rounded border border-brand-lime/30">
                                Hoje
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                              {formatDatePtShort(dateStr)} &bull; {dayType === 'rest' ? 'Folga' : s?.matchDayOffset || (dayType === 'match' ? 'MD' : 'MD-3')}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDayModal(dateStr);
                              }}
                              className="p-1 rounded-md text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                              title="Opções e atalhos rápidos deste dia"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {/* Row 2: Day Type Segmented Buttons (Full width of card, equal 3 columns) */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetSpecificDayType(dateStr, 'training');
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                              dayType === 'training'
                                ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                            title="Definir como Dia de Treino"
                          >
                            <span>⚽</span>
                            <span>Treino</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetSpecificDayType(dateStr, 'match');
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                              dayType === 'match'
                                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                            title="Definir como Dia de Jogo"
                          >
                            <span>🏆</span>
                            <span>Jogo</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetSpecificDayType(dateStr, 'rest');
                            }}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                              dayType === 'rest'
                                ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-300'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                            title="Definir como Dia de Folga"
                          >
                            <span>🏖️</span>
                            <span>Folga</span>
                          </button>
                        </div>

                        {/* Row 3: Time Bar (Fits completely inside the rectangle without overflowing) */}
                        {dayType !== 'rest' ? (
                          <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-xl border border-slate-700/80 shadow-inner overflow-hidden min-w-0">
                            <div className="flex items-center space-x-1 text-cyan-300 font-bold text-xs shrink-0">
                              <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                              <span className="uppercase tracking-wider font-extrabold text-[10px]">
                                {dayType === 'match' ? 'Jogo:' : 'Treino:'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 font-mono shrink-0">
                              <input
                                type="time"
                                value={s?.startTime || (dayType === 'match' ? '10:00' : '09:00')}
                                onChange={(e) => handleUpdateDayTimes(dateStr, e.target.value, s?.endTime || (dayType === 'match' ? '11:30' : '10:30'))}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-800 text-cyan-200 font-black text-xs px-1 py-0.5 rounded border border-slate-600 hover:border-cyan-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer text-center w-[54px] sm:w-[58px] tracking-tight [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                title="Hora de Início (grava automaticamente)"
                              />
                              <span className="text-slate-400 font-black text-xs">-</span>
                              <input
                                type="time"
                                value={s?.endTime || (dayType === 'match' ? '11:30' : '10:30')}
                                onChange={(e) => handleUpdateDayTimes(dateStr, s?.startTime || (dayType === 'match' ? '10:00' : '09:00'), e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-800 text-cyan-200 font-black text-xs px-1 py-0.5 rounded border border-slate-600 hover:border-cyan-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 cursor-pointer text-center w-[54px] sm:w-[58px] tracking-tight [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                title="Hora de Término (grava automaticamente)"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-1.5 bg-amber-950/20 px-2.5 py-1.5 rounded-xl border border-amber-500/20 text-amber-400 text-xs font-bold">
                            <span>🏖️</span>
                            <span>Descanso / Recuperação</span>
                          </div>
                        )}

                        {/* Row 3B: Gym Time Bar (Only when Ginásio is active on this day) */}
                        {dayType !== 'rest' && (comp.lowerBody || comp.upperBody || comp.core || s?.gymStartTime) && (
                          <div className="flex items-center justify-between bg-purple-950/40 px-2.5 py-1.5 rounded-xl border border-purple-500/40 shadow-inner overflow-hidden min-w-0 animate-fade-in">
                            <div className="flex items-center space-x-1 text-purple-300 font-bold text-xs shrink-0">
                              <span className="text-xs">🏋️</span>
                              <span className="uppercase tracking-wider font-extrabold text-[10px]">
                                Ginásio:
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 font-mono shrink-0">
                              <input
                                type="time"
                                value={s?.gymStartTime || '10:45'}
                                onChange={(e) => handleUpdateDayGymTimes(dateStr, e.target.value, s?.gymEndTime || '11:30')}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-800 text-purple-200 font-black text-xs px-1 py-0.5 rounded border border-purple-500/60 hover:border-purple-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 cursor-pointer text-center w-[54px] sm:w-[58px] tracking-tight [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                title="Hora de Início do Ginásio (grava automaticamente)"
                              />
                              <span className="text-purple-400 font-black text-xs">-</span>
                              <input
                                type="time"
                                value={s?.gymEndTime || '11:30'}
                                onChange={(e) => handleUpdateDayGymTimes(dateStr, s?.gymStartTime || '10:45', e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-slate-800 text-purple-200 font-black text-xs px-1 py-0.5 rounded border border-purple-500/60 hover:border-purple-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 cursor-pointer text-center w-[54px] sm:w-[58px] tracking-tight [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden"
                                title="Hora de Fim do Ginásio (utilizada para o questionário das jogadoras)"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chips by Category */}
                      {/* 1. Ginásio */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-indigo-400 tracking-wider">
                          🏋️ Ginásio & Força
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'gym').map((item) => {
                            const active = Boolean(comp[item.key]);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleComplementaryItem(item.key, dateStr)}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                                  active
                                    ? `${item.badgeClass} ring-1 ring-purple-400 scale-102`
                                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{item.icon}</span>
                                <span>{item.shortLabel}</span>
                                {active && <Check className="h-2.5 w-2.5 text-purple-300" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Recuperação */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-cyan-400 tracking-wider">
                          🧊 Recuperação
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'recovery').map((item) => {
                            const active = Boolean(comp[item.key]);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleComplementaryItem(item.key, dateStr)}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                                  active
                                    ? `${item.badgeClass} ring-1 ring-cyan-400 scale-102`
                                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{item.icon}</span>
                                <span>{item.shortLabel}</span>
                                {active && <Check className="h-2.5 w-2.5 text-cyan-300" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Mobilidade */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold uppercase text-teal-400 tracking-wider">
                          🧘 Mobilidade
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'mobility').map((item) => {
                            const active = Boolean(comp[item.key]);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleComplementaryItem(item.key, dateStr)}
                                className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                                  active
                                    ? `${item.badgeClass} ring-1 ring-teal-400 scale-102`
                                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <span>{item.icon}</span>
                                <span>{item.shortLabel}</span>
                                {active && <Check className="h-2.5 w-2.5 text-teal-300" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Day Note Input */}
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder="Nota / Instrução para este dia..."
                          value={comp.notes || ''}
                          onChange={(e) => handleUpdateComplementaryNotes(e.target.value, dateStr)}
                          className="w-full rounded-lg border border-slate-700 bg-dark-bg p-1.5 text-[11px] font-medium text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Day Select & Edit Schedule Footer */}
                    <div className="flex items-center space-x-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => openEditDayModal(dateStr)}
                        className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center space-x-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-500/50 shadow-sm active:scale-95"
                        title="Abrir editor de horário e detalhes para este dia"
                      >
                        <Clock className="h-3 w-3 text-cyan-400" />
                        <span>Editar Horário / Treino</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectDate(dateStr)}
                        className={`p-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600 border-purple-500 text-white shadow ring-1 ring-purple-400'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                        title={isSelected ? 'Dia atualmente ativo no painel principal' : 'Selecionar este dia no painel'}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5 text-white" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Live Preview & 1-Click Sharing */}
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💬</span>
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-300">
                    Mensagem Formatada para o Grupo do WhatsApp
                  </h4>
                  <p className="text-[11px] text-emerald-200/80">
                    Atualiza-se automaticamente com as opções marcadas acima nos 7 dias.
                  </p>
                </div>
              </div>

              {/* Language Switcher & Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Language Toggle */}
                <div className="flex items-center space-x-1 rounded-xl bg-slate-900 border border-emerald-500/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => setWhatsAppLang('en')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      whatsAppLang === 'en'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    onClick={() => setWhatsAppLang('pt')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      whatsAppLang === 'pt'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🇵🇹 Português
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyWhatsApp}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-emerald-500/40 bg-emerald-900/60 hover:bg-emerald-800/70 text-emerald-100 text-xs font-extrabold transition-all cursor-pointer shadow active:scale-98"
                >
                  {copyFeedback ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4 text-emerald-300" />}
                  <span>{copyFeedback ? 'Copied!' : whatsAppLang === 'en' ? 'Copy Text' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-500/30 active:scale-98"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{whatsAppLang === 'en' ? 'Share on WhatsApp' : 'Partilhar no WhatsApp'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-purple-500/50 bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 text-xs font-black transition-all cursor-pointer shadow active:scale-98"
                  title="Abrir Poster visual da semana para PDF, PNG ou Impressão"
                >
                  <FileText className="h-4 w-4 text-purple-300" />
                  <span>{whatsAppLang === 'en' ? 'Export Poster / PDF' : 'Exportar Poster / PDF'}</span>
                </button>
              </div>
            </div>

            {/* Preview Box */}
            <div className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-3.5 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
              {generateWhatsAppWeeklyPlanText({
                microcycleTitle,
                weekDates: weekDatesForComplementary,
                sessions: trainingSessions,
                generalNotes: weeklyTeamNotes,
                lang: whatsAppLang,
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-emerald-300/80">
              <span className="flex items-center space-x-1">
                <span>📱</span>
                <span>As atletas já conseguem ver este planeamento em tempo real na app delas!</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Training Session Info Form & Athlete Submissions KPI */}
      {sessionSubTab !== 'calendar' && sessionSubTab !== 'complementary' && (
        <div className={`grid grid-cols-1 ${sessionSubTab === 'all' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 animate-fade-in`}>
          {sessionSubTab !== 'submissions' && (
            <form onSubmit={handleSaveSession} className={`${sessionSubTab === 'all' ? 'lg:col-span-2' : ''} space-y-5 rounded-2xl border border-dark-border bg-dark-card p-5 shadow-lg`}>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-black uppercase text-slate-100 flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-red-500" />
                    <span>Configurar Informação do Treino &bull; {selectedDate}</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Define o horário, cálculo automático de duração, temperaturas inicial/final e conteúdos da sessão.
                  </p>
                </div>

                <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-xl text-xs font-extrabold font-mono">
                  {selectedDate}
                </span>
              </div>

              {/* Timing Section (Day Type, Offset, Times, Deadlines) */}
              {(sessionSubTab === 'timing' || sessionSubTab === 'all') && (
                <>
                  {/* Day Type Selector Buttons */}
                  <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase text-slate-300 block">
              1. Tipo de Dia / Atividade
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSelectDayType('training')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-extrabold transition-all ${
                  dayType === 'training'
                    ? 'border-blue-500 bg-blue-950/70 text-blue-200 shadow-md ring-2 ring-blue-500/50'
                    : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">⚽</span>
                <span>Dia de Treino</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDayType('match')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-extrabold transition-all ${
                  dayType === 'match'
                    ? 'border-emerald-500 bg-emerald-950/70 text-emerald-200 shadow-md ring-2 ring-emerald-500/50'
                    : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">🏆</span>
                <span>Dia de Jogo (MD)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectDayType('rest')}
                className={`flex items-center justify-center space-x-2 p-3 rounded-xl border text-xs font-extrabold transition-all ${
                  dayType === 'rest'
                    ? 'border-amber-500 bg-amber-950/70 text-amber-200 shadow-md ring-2 ring-amber-500/50'
                    : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-base">🏖️</span>
                <span>Dia de Folga</span>
              </button>
            </div>

            {/* Match Category Sub-selector (Jogo de Treino / Campeonato / Taça) */}
            {dayType === 'match' && (
              <div className="space-y-2 mt-3 animate-fade-in p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30">
                <label className="text-[11px] font-extrabold uppercase text-emerald-400 flex items-center space-x-1">
                  <span>🏆 Categoria / Competição do Jogo:</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectMatchCategory('friendly')}
                    className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                      matchCategory === 'friendly'
                        ? 'border-emerald-500 bg-emerald-900/90 text-emerald-100 shadow-md ring-2 ring-emerald-500/50'
                        : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🤝</span>
                    <span>Jogo de Treino</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMatchCategory('championship')}
                    className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                      matchCategory === 'championship'
                        ? 'border-amber-500 bg-amber-900/90 text-amber-100 shadow-md ring-2 ring-amber-500/50'
                        : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🏆</span>
                    <span>Campeonato</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectMatchCategory('cup')}
                    className={`flex items-center justify-center space-x-1.5 p-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                      matchCategory === 'cup'
                        ? 'border-purple-500 bg-purple-900/90 text-purple-100 shadow-md ring-2 ring-purple-500/50'
                        : 'border-slate-800 bg-dark-bg text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>🥇</span>
                    <span>Taça</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Match Day Microcycle Phase (MD Tag) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-slate-300 block">
                2. Fase do Microciclo de Jogo (Match Day Tag)
              </label>
              <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-full border border-red-500/30 flex items-center space-x-1">
                <span>⚡ Auto:</span>
                <span className="font-black text-white">{matchDayOffset}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['MD-6', 'MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'] as const).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMatchDayOffset(tag)}
                  className={`px-3 py-2 text-xs font-extrabold rounded-xl border transition-all ${
                    matchDayOffset === tag
                      ? 'bg-red-600 text-white border-red-500 shadow-md'
                      : 'bg-dark-bg border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {tag === 'MD' ? '🏆 MD (Dia de Jogo)' : tag}
                </button>
              ))}
            </div>
          </div>

          {/* Start Time, End Time & Automatic Duration Calculation */}
          <div className="rounded-xl border border-slate-800 bg-dark-surface/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-slate-200 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>3. Horário & Cálculo Automático da Duração</span>
              </label>
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <span className="text-[10px] font-bold text-amber-400 animate-pulse bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    A guardar...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ✓ Guardado
                  </span>
                )}
                <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  ⏱️ {formattedHoursMinutes(durationMin)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Hora de Início:</span>
                <input
                  type="time"
                  value={startTime}
                  onFocus={() => { lastUserEditTimestamp.current = Date.now(); }}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Hora de Fim:</span>
                <input
                  type="time"
                  value={endTime}
                  onFocus={() => { lastUserEditTimestamp.current = Date.now(); }}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-400">
                Alterações de horário são guardadas instantaneamente na Cloud e recalculam os limites dos questionários.
              </span>
              <button
                type="button"
                onClick={() => performSave()}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer self-end sm:self-auto shrink-0 shadow-sm"
              >
                {saveStatus === 'saving' ? 'A guardar...' : 'Gravar Horário'}
              </button>
            </div>
          </div>

          {/* 3.1 Horários Limite dos Questionários (Exceção Pontual para este Dia) */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-amber-500/20 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-extrabold uppercase text-slate-200">
                  3.1 Horários Limite dos Questionários (Exceção Pontual)
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {(customDeadlineWellness || customDeadlineRpe) && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black">
                    Personalizado
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCustomDeadlineWellness('');
                    setCustomDeadlineRpe('');
                    setCustomDeadline('');
                    performSave({ customDeadlineWellness: '', customDeadlineRpe: '', customDeadline: '' });
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Repor Padrão
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Wellness Cutoff */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-bg/60 border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center space-x-1">
                    <span>☀️ Limite Wellness (Pré):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customDeadlineWellness || (dayType === 'match' ? '12:00 (Padrão Jogo)' : '08:15 (Padrão Treino)')}
                  </span>
                </div>
                <input
                  type="time"
                  value={customDeadlineWellness}
                  placeholder={dayType === 'match' ? '12:00' : '08:15'}
                  onFocus={() => { lastUserEditTimestamp.current = Date.now(); }}
                  onChange={(e) => {
                    setCustomDeadlineWellness(e.target.value);
                    performSave({ customDeadlineWellness: e.target.value, customDeadline: e.target.value });
                  }}
                  className="w-full rounded-lg border border-amber-500/40 bg-dark-card p-2 text-xs font-bold text-amber-100 focus:border-amber-400 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDeadlineWellness('08:15');
                      performSave({ customDeadlineWellness: '08:15', customDeadline: '08:15' });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    08:15
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDeadlineWellness('12:00');
                      performSave({ customDeadlineWellness: '12:00', customDeadline: '12:00' });
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/80 cursor-pointer"
                  >
                    12:00 (Jogo)
                  </button>
                  {startTime && (() => {
                    const [h, m] = startTime.split(':').map(Number);
                    const t = Math.max(0, (h * 60 + m) - 60);
                    const tStr = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDeadlineWellness(tStr);
                          performSave({ customDeadlineWellness: tStr, customDeadline: tStr });
                        }}
                        className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-900/80 cursor-pointer"
                      >
                        -1h ({tStr})
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* RPE Cutoff */}
              <div className="space-y-1.5 p-2.5 rounded-xl bg-dark-bg/60 border border-cyan-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center space-x-1">
                    <span>⚡ Limite PSE / RPE (Pós):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {customDeadlineRpe || (dayType === 'match' ? '18:30 (Padrão Jogo)' : '14:00 (Padrão Treino)')}
                  </span>
                </div>
                <input
                  type="time"
                  value={customDeadlineRpe}
                  placeholder={dayType === 'match' ? '18:30' : '14:00'}
                  onFocus={() => { lastUserEditTimestamp.current = Date.now(); }}
                  onChange={(e) => {
                    setCustomDeadlineRpe(e.target.value);
                    performSave({ customDeadlineRpe: e.target.value });
                  }}
                  className="w-full rounded-lg border border-cyan-500/40 bg-dark-card p-2 text-xs font-bold text-cyan-100 focus:border-cyan-400 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 text-[10px] pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDeadlineRpe('14:00');
                      performSave({ customDeadlineRpe: '14:00' });
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
                  >
                    14:00
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDeadlineRpe('18:30');
                      performSave({ customDeadlineRpe: '18:30' });
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900/80 cursor-pointer"
                  >
                    18:30 (Jogo)
                  </button>
                  {(endTime || startTime) && (() => {
                    const base = endTime || startTime;
                    const [h, m] = base.split(':').map(Number);
                    const t = Math.min(1439, (h * 60 + m) + 60);
                    const tStr = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDeadlineRpe(tStr);
                          performSave({ customDeadlineRpe: tStr });
                        }}
                        className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold hover:bg-cyan-900/80 cursor-pointer"
                      >
                        +1h ({tStr})
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          </>
        )}

        {/* Conditions Section (Temperature, Location, Focus) */}
        {(sessionSubTab === 'conditions' || sessionSubTab === 'all') && (
          <>
            {/* Temperature Start, Temperature End & Automatic Delta Variation */}
            <div className="rounded-xl border border-slate-800 bg-dark-surface/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-slate-200 flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-amber-400" />
                <span>4. Temperatura do Treino (°C) & Variação Automática</span>
              </label>

              {tempDelta !== null && (
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                  tempDelta > 0
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : tempDelta < 0
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {tempDelta > 0 ? `+${tempDelta}°C 📈 (Subida)` : tempDelta < 0 ? `${tempDelta}°C 📉 (Queda)` : `0.0°C ➡️ (Estável)`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Temp. Inicial (°C):</span>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 20.0"
                  value={tempStart}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Temp. Final (°C):</span>
                <input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 25.5"
                  value={tempEnd}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location / Pitch Name */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase text-slate-300 flex items-center space-x-1.5">
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span>5. Local / Campo</span>
            </label>
            <input
              type="text"
              placeholder="Ex: Campo de São Martinho - Barcelos • Estádio Cidade de Barcelos"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 text-xs font-bold text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Tactical Focus & Notes */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase text-slate-300 block">
              5. Conteúdos Táticos & Objetivos da Sessão
            </label>
            <textarea
              rows={3}
              placeholder="Descreve o foco principal do treino (ex: Organização defensiva bloco médio, transição ofensiva rápida, bolas paradas)..."
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>
          </>
        )}

        {/* Roster Section (Athlete Statuses) */}
        {(sessionSubTab === 'roster' || sessionSubTab === 'all') && (
          <>
            {/* 7. Estado Individual do Treino por Jogadora */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-dark-surface/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-200 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>6. Estado do Treino Por Jogadora</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Regista se a jogadora treinou normal, condicionada, lesionada ou esteve ausente.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSetAllNormal}
                className="self-start sm:self-auto text-[11px] font-extrabold text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 px-2.5 py-1 rounded-xl transition-all hover:scale-105"
              >
                🟢 Marcar Todas como Normal
              </button>
            </div>

            {/* KPI Summary Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold pt-1">
              <span className="bg-brand-lime text-slate-950 px-3 py-1.5 rounded-xl font-black shadow-md shadow-brand-lime/20 border border-brand-lime flex items-center space-x-1.5">
                <Users className="h-4 w-4 stroke-[2.5]" />
                <span>👥 TOTAL NO TREINO: {statusCounts.totalInTraining} / {athletes.length} JOGADORAS</span>
              </span>

              <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-black">
                <span>🏃 Jogadoras de Campo:</span>
                <span className="text-cyan-200">{statusCounts.fieldInTraining} / {statusCounts.totalField}</span>
              </span>

              <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-3 py-1.5 rounded-xl flex items-center space-x-1.5 font-black">
                <span>🧤 Guarda-Redes (GR):</span>
                <span className="text-purple-200">{statusCounts.grInTraining} / {statusCounts.totalGR}</span>
              </span>

              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl">
                🟢 Treino Integral: {statusCounts.normal}
              </span>
              <span className="bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl">
                🟡 Condicionada: {statusCounts.conditioned}
              </span>
              <span className="bg-rose-950/60 text-rose-300 border border-rose-500/30 px-2.5 py-1.5 rounded-xl">
                🔴 Lesionada: {statusCounts.injured}
              </span>
              <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2.5 py-1.5 rounded-xl">
                ⚪ Ausente: {statusCounts.absent}
              </span>
            </div>

            {/* Roster Athletes Status Grid */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin pt-2">
              {athletes.map((athlete) => {
                const currentStatus = athleteStatuses[athlete.id]?.status || 'normal';
                const currentNotes = athleteStatuses[athlete.id]?.notes || '';
                const isGR = athlete.position === 'GR' || isGoalkeeper(athlete.name);

                return (
                  <div
                    key={athlete.id}
                    className={`p-3 rounded-xl border transition-all space-y-2 ${
                      currentStatus === 'normal'
                        ? 'border-slate-800 bg-dark-bg/60'
                        : currentStatus === 'conditioned'
                        ? 'border-amber-500/40 bg-amber-950/20'
                        : currentStatus === 'injured'
                        ? 'border-rose-500/40 bg-rose-950/20'
                        : 'border-slate-700 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-200">{athlete.name}</span>
                        {isGR ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
                            🧤 GR
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            🏃 Campo
                          </span>
                        )}
                      </div>

                      {/* Status Selector Buttons */}
                      <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleUpdateAthleteStatus(athlete.id, 'normal')}
                          className={`px-2.5 py-1 rounded-lg border transition-all ${
                            currentStatus === 'normal'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm font-extrabold'
                              : 'bg-dark-surface border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🟢 Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAthleteStatus(athlete.id, 'conditioned')}
                          className={`px-2.5 py-1 rounded-lg border transition-all ${
                            currentStatus === 'conditioned'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-sm font-extrabold'
                              : 'bg-dark-surface border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🟡 Condicionada
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAthleteStatus(athlete.id, 'injured')}
                          className={`px-2.5 py-1 rounded-lg border transition-all ${
                            currentStatus === 'injured'
                              ? 'bg-rose-600 text-white border-rose-500 shadow-sm font-extrabold'
                              : 'bg-dark-surface border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🔴 Lesionada
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateAthleteStatus(athlete.id, 'absent')}
                          className={`px-2.5 py-1 rounded-lg border transition-all ${
                            currentStatus === 'absent'
                              ? 'bg-slate-700 text-white border-slate-600 shadow-sm font-extrabold'
                              : 'bg-dark-surface border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          ⚪ Ausente
                        </button>
                      </div>
                    </div>

                    {/* Notes Input for non-normal statuses or additional remarks */}
                    {currentStatus !== 'normal' && (
                      <div className="pt-1">
                        <input
                          type="text"
                          placeholder={`Observações (${currentStatus === 'conditioned' ? 'ex: Gestão de carga' : currentStatus === 'injured' ? 'ex: DM / Entorse tornozelo' : 'ex: Motivo pessoal'})...`}
                          value={currentNotes}
                          onChange={(e) => handleUpdateAthleteStatus(athlete.id, currentStatus, e.target.value)}
                          className="w-full text-xs font-medium rounded-lg border border-slate-700 bg-dark-bg p-2 text-slate-200 placeholder-slate-500 focus:border-red-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}

          {/* 7. Trabalho Complementar / Extra-Treino Deste Dia */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2">
              <div>
                <label className="text-xs font-extrabold uppercase text-purple-200 flex items-center space-x-2">
                  <Dumbbell className="h-4 w-4 text-purple-400" />
                  <span>Trabalho Complementar (Sempre Pós-Treino) &bull; {selectedDate}</span>
                </label>
                <p className="text-[10px] text-amber-300 font-bold mt-0.5">
                  ⚡ O trabalho complementar de ginásio, mobilidade e recuperação é realizado SEMPRE PÓS-TREINO.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSessionSubTab('complementary')}
                className="text-[11px] font-extrabold text-purple-300 hover:text-white underline cursor-pointer self-start sm:self-auto"
              >
                Abrir Planeamento Semanal Completo &rarr;
              </button>
            </div>

            {/* Toggle Chips */}
            <div className="space-y-2.5">
              {/* Ginásio */}
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">🏋️ Ginásio & Força</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'gym').map((item) => {
                    const active = Boolean(complementaryWork[item.key]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleComplementaryItem(item.key)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? `${item.badgeClass} ring-1 ring-purple-400 shadow-md font-extrabold scale-102`
                            : 'border-slate-800 bg-dark-bg/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.shortLabel}</span>
                        {active && <Check className="h-3 w-3 text-purple-300 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recuperação */}
              <div>
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">🧊 Recuperação & Regeneração</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'recovery').map((item) => {
                    const active = Boolean(complementaryWork[item.key]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleComplementaryItem(item.key)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? `${item.badgeClass} ring-1 ring-cyan-400 shadow-md font-extrabold scale-102`
                            : 'border-slate-800 bg-dark-bg/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.shortLabel}</span>
                        {active && <Check className="h-3 w-3 text-cyan-300 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mobilidade */}
              <div>
                <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">🧘 Mobilidade & Prevenção</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {COMPLEMENTARY_WORK_ITEMS.filter((i) => i.category === 'mobility').map((item) => {
                    const active = Boolean(complementaryWork[item.key]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleComplementaryItem(item.key)}
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          active
                            ? `${item.badgeClass} ring-1 ring-teal-400 shadow-md font-extrabold scale-102`
                            : 'border-slate-800 bg-dark-bg/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.shortLabel}</span>
                        {active && <Check className="h-3 w-3 text-teal-300 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Notes */}
              <div className="pt-1.5">
                <input
                  type="text"
                  placeholder="Orientação / Notas deste dia (ex: Ginásio 45 min antes, sauna opcional pós-treino)..."
                  value={complementaryWork.notes || ''}
                  onChange={(e) => handleUpdateComplementaryNotes(e.target.value)}
                  className="w-full rounded-xl border border-purple-500/40 bg-dark-bg p-2 text-xs font-medium text-purple-100 placeholder-purple-300/40 focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSaving}
            className={`w-full flex items-center justify-center space-x-2 rounded-xl bg-red-600 py-3 text-xs font-black text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all active:scale-98 cursor-pointer ${
              isSaving ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>A guardar informação do treino...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Guardar Informação do Treino</span>
              </>
            )}
          </button>
        </form>
        )}

        {/* Side Panel: Selected Date Overview & Athlete Response Stats */}
        {(sessionSubTab === 'submissions' || sessionSubTab === 'all') && (
        <div className={`space-y-4 ${sessionSubTab === 'submissions' ? 'max-w-xl mx-auto w-full' : ''}`}>
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4 shadow-md">
            <h3 className="text-xs font-black uppercase text-slate-100 border-b border-slate-800 pb-2">
              Respostas das Atletas em {selectedDate}
            </h3>

            <div className="space-y-3">
              {/* Wellness Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Questionário Wellness</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {wellnessTodayCount} / {athletes.length}
                </span>
              </div>

              {/* RPE Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Questionário PSE (RPE)</span>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {rpeTodayCount} / {athletes.length}
                </span>
              </div>

              {/* Hydration Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Registo de Hidratação</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {hydrationTodayCount} / {athletes.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black uppercase text-slate-100 flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Resumo da Sessão Programada</span>
            </h3>

            <div className="text-xs space-y-2 text-slate-300">
              <p>
                <span className="text-slate-500 font-bold">Tipo:</span>{' '}
                <span className="font-extrabold text-slate-100 uppercase">
                  {dayType === 'training'
                    ? '⚽ Treino'
                    : dayType === 'match'
                    ? `🏆 Jogo (${matchCategory === 'cup' ? 'Taça' : matchCategory === 'friendly' ? 'Treino' : 'Campeonato'})`
                    : '🏖️ Folga'}
                </span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">Total no Treino:</span>{' '}
                <span className="font-black text-emerald-400">
                  {statusCounts.normal + statusCounts.conditioned} / {athletes.length} Jogadoras
                </span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">Microciclo:</span>{' '}
                <span className="font-mono font-bold text-red-400">{matchDayOffset}</span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">Horário:</span>{' '}
                <span className="font-bold text-slate-200">{startTime} - {endTime}</span>
              </p>
              <p>
                <span className="text-slate-500 font-bold">Duração Calculada:</span>{' '}
                <span className="font-bold text-cyan-300">{formattedHoursMinutes(durationMin)}</span>
              </p>
              {(tempStart || tempEnd) && (
                <p>
                  <span className="text-slate-500 font-bold">Temperatura:</span>{' '}
                  <span className="font-bold text-amber-300">
                    {tempStart ? `${tempStart}°C` : '?'} &rarr; {tempEnd ? `${tempEnd}°C` : '?'}
                    {tempDelta !== null && ` (${tempDelta > 0 ? `+${tempDelta}` : tempDelta}°C)`}
                  </span>
                </p>
              )}
              {locationName && (
                <p>
                  <span className="text-slate-500 font-bold">Local:</span>{' '}
                  <span className="font-bold text-slate-200">{locationName}</span>
                </p>
              )}
              {focusNotes && (
                <p className="border-t border-slate-800 pt-2 text-[11px] text-slate-400 italic">
                  &quot;{focusNotes}&quot;
                </p>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Quick Day Schedule & Activity Edit Modal */}
      {editingDayDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-dark-card p-6 shadow-2xl space-y-5 text-left relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 relative z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-100 uppercase tracking-tight">
                    Editar Horário & Atividade
                  </h3>
                  <span className="text-[11px] text-purple-300 font-bold">
                    {getDayNamePt(editingDayDate)} &bull; {formatDatePtShort(editingDayDate)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingDayDate(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 relative z-10">
              {/* 1. Tipo de Dia / Atividade */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase text-slate-300 block">
                  Tipo de Atividade:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditDayModalType('training');
                      if (editDayModalStartTime === '10:00' && editDayModalEndTime === '11:30') {
                        setEditDayModalStartTime('09:00');
                        setEditDayModalEndTime('10:30');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      editDayModalType === 'training'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/40'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>⚽</span>
                    <span>Treino</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditDayModalType('match');
                      if (editDayModalStartTime === '09:00' && editDayModalEndTime === '10:30') {
                        setEditDayModalStartTime('10:00');
                        setEditDayModalEndTime('11:30');
                      }
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      editDayModalType === 'match'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>🏆</span>
                    <span>Jogo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDayModalType('rest')}
                    className={`py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                      editDayModalType === 'rest'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/40'
                        : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>🏖️</span>
                    <span>Folga</span>
                  </button>
                </div>
              </div>

              {/* 2. Horários (apenas para Treino ou Jogo) */}
              {editDayModalType !== 'rest' && (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase text-cyan-300 flex items-center space-x-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Horário {editDayModalType === 'match' ? 'do Jogo' : 'do Treino'}:</span>
                    </label>
                    {editDayModalStartTime && editDayModalEndTime && (() => {
                      const [sH, sM] = editDayModalStartTime.split(':').map(Number);
                      const [eH, eM] = editDayModalEndTime.split(':').map(Number);
                      let diff = (eH * 60 + eM) - (sH * 60 + sM);
                      if (diff < 0) diff += 24 * 60;
                      return (
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                          {diff > 0 ? `${diff} Min` : '--'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Hora de Início:</span>
                      <input
                        type="time"
                        value={editDayModalStartTime}
                        onChange={(e) => setEditDayModalStartTime(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono font-black text-slate-100 focus:outline-none focus:border-cyan-400 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block mb-1">Hora de Fim:</span>
                      <input
                        type="time"
                        value={editDayModalEndTime}
                        onChange={(e) => setEditDayModalEndTime(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-mono font-black text-slate-100 focus:outline-none focus:border-cyan-400 text-center"
                      />
                    </div>
                  </div>

                  {/* Quick time presets */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      Atalhos Rápidos:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '09:00 - 10:30', s: '09:00', e: '10:30' },
                        { label: '10:00 - 11:30', s: '10:00', e: '11:30' },
                        { label: '10:30 - 12:00', s: '10:30', e: '12:00' },
                        { label: '15:00 - 16:30', s: '15:00', e: '16:30' },
                        { label: '16:00 - 17:30', s: '16:00', e: '17:30' },
                        { label: '17:00 - 18:30', s: '17:00', e: '18:30' },
                        { label: '18:00 - 19:30', s: '18:00', e: '19:30' },
                        { label: '19:00 - 20:30', s: '19:00', e: '20:30' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setEditDayModalStartTime(preset.s);
                            setEditDayModalEndTime(preset.e);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                            editDayModalStartTime === preset.s && editDayModalEndTime === preset.e
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 2B. Horário do Ginásio (Força / MMII) */}
              {editDayModalType !== 'rest' && (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/40 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold uppercase text-purple-300 flex items-center space-x-1.5">
                      <span>🏋️</span>
                      <span>Horário do Ginásio (Força / MMII):</span>
                    </label>
                    {editDayModalGymStartTime && editDayModalGymEndTime && (() => {
                      const [sH, sM] = editDayModalGymStartTime.split(':').map(Number);
                      const [eH, eM] = editDayModalGymEndTime.split(':').map(Number);
                      let diff = (eH * 60 + eM) - (sH * 60 + sM);
                      if (diff < 0) diff += 24 * 60;
                      return (
                        <span className="text-[10px] font-black text-purple-300 bg-purple-950/80 border border-purple-500/40 px-2 py-0.5 rounded-full">
                          {diff > 0 ? `${diff} Min` : '--'}
                        </span>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-purple-300/80 font-bold block mb-1">Hora de Início:</span>
                      <input
                        type="time"
                        value={editDayModalGymStartTime}
                        onChange={(e) => setEditDayModalGymStartTime(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-purple-500/50 px-3 py-2 text-xs font-mono font-black text-slate-100 focus:outline-none focus:border-purple-400 text-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-purple-300/80 font-bold block mb-1">Hora de Fim (p/ questionário):</span>
                      <input
                        type="time"
                        value={editDayModalGymEndTime}
                        onChange={(e) => setEditDayModalGymEndTime(e.target.value)}
                        className="w-full rounded-xl bg-slate-800 border border-purple-500/50 px-3 py-2 text-xs font-mono font-black text-slate-100 focus:outline-none focus:border-purple-400 text-center"
                      />
                    </div>
                  </div>

                  {/* Quick presets for gym */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-purple-400/80 font-bold uppercase tracking-wider">
                      Atalhos Rápidos de Ginásio:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '10:30 - 11:15', s: '10:30', e: '11:15' },
                        { label: '10:45 - 11:30', s: '10:45', e: '11:30' },
                        { label: '11:00 - 11:45', s: '11:00', e: '11:45' },
                        { label: '11:30 - 12:15', s: '11:30', e: '12:15' },
                        { label: '17:30 - 18:15', s: '17:30', e: '18:15' },
                        { label: '18:00 - 18:45', s: '18:00', e: '18:45' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setEditDayModalGymStartTime(preset.s);
                            setEditDayModalGymEndTime(preset.e);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                            editDayModalGymStartTime === preset.s && editDayModalGymEndTime === preset.e
                              ? 'bg-purple-500 text-slate-950 border-purple-400 font-black shadow-sm'
                              : 'bg-slate-800/80 text-purple-200 border-purple-500/30 hover:bg-purple-900/50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Match Details if Match */}
              {editDayModalType === 'match' && (
                <div className="space-y-2 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
                  <span className="text-[11px] font-extrabold uppercase text-emerald-300 block">
                    Tipo de Competição:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'championship', label: '🏆 Campeonato' },
                      { key: 'cup', label: '🛡️ Taça' },
                      { key: 'friendly', label: '🤝 Amigável' },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setEditDayModalMatchCategory(cat.key as any)}
                        className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                          editDayModalMatchCategory === cat.key
                            ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Local / Adversário:</span>
                    <input
                      type="text"
                      placeholder="Ex: Estádio Adelino Ribeiro Novo • Gil Vicente vs ..."
                      value={editDayModalLocation}
                      onChange={(e) => setEditDayModalLocation(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. Training Location if Training */}
              {editDayModalType === 'training' && (
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Local / Campo de Treino:</span>
                    <input
                      type="text"
                      placeholder="Ex: Campo de São Martinho - Barcelos"
                      value={editDayModalLocation}
                      onChange={(e) => setEditDayModalLocation(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Foco Principal da Sessão:</span>
                    <input
                      type="text"
                      placeholder="Ex: Força Rápida, Transições Ofensivas e Bola Parada"
                      value={editDayModalFocus}
                      onChange={(e) => setEditDayModalFocus(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800 relative z-10">
              <button
                type="button"
                onClick={() => setEditingDayDate(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditDayModal}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-900/40 transition-all cursor-pointer flex items-center space-x-1.5 active:scale-95"
              >
                <Check className="h-4 w-4" />
                <span>Guardar Horário & Atividade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Plan Export Modal (PDF / PNG / Print) */}
      <WeeklyPlanExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        microcycleTitle={microcycleTitle}
        weekDates={weekDatesForComplementary}
        sessions={trainingSessions}
        weeklyTeamNotes={weeklyTeamNotes}
        initialLang={whatsAppLang}
      />
    </div>
  );
};
