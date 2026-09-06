'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MatchDayOffset, WellnessEntry, RPEEntry, HydrationEntry, TrainingSessionInfo, AthleteTrainingStatus, AthleteSessionStatus } from '@/lib/types';
import { INITIAL_ATHLETES } from '@/lib/data';
import { getStoredCalendarSchedule, saveCalendarSchedule, getStoredTrainingSessions, saveTrainingSessionInfo, CalendarDayType } from '@/lib/storage';
import {
  Calendar, Clock, Dumbbell, MapPin, Sparkles, Save, CheckCircle2,
  AlertCircle, Trophy, Coffee, ChevronLeft, ChevronRight, FileText, Activity, ShieldCheck, Thermometer, Users
} from 'lucide-react';

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
  // Calendar month selection
  const [selectedMonth, setSelectedMonth] = useState<string>(
    selectedDate.substring(0, 7)
  );

  // Stored schedule overrides & session info
  const [calendarSchedule, setCalendarSchedule] = useState<Record<string, CalendarDayType>>({});
  const [trainingSessions, setTrainingSessions] = useState<Record<string, TrainingSessionInfo>>({});

  // Current selected session state
  const [dayType, setDayType] = useState<CalendarDayType>('training');
  const [matchDayOffset, setMatchDayOffset] = useState<MatchDayOffset>('MD-3');
  const [startTime, setStartTime] = useState<string>('10:00');
  const [endTime, setEndTime] = useState<string>('11:30');
  const [tempStart, setTempStart] = useState<string>('20.0');
  const [tempEnd, setTempEnd] = useState<string>('25.0');
  const [locationName, setLocationName] = useState<string>('Campo N.º 1');
  const [focusNotes, setFocusNotes] = useState<string>('');
  const [athleteStatuses, setAthleteStatuses] = useState<Record<string, AthleteSessionStatus>>({});

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const statusCounts = useMemo(() => {
    let normal = 0;
    let conditioned = 0;
    let injured = 0;
    let absent = 0;

    INITIAL_ATHLETES.forEach((ath) => {
      const st = athleteStatuses[ath.id]?.status || 'normal';
      if (st === 'normal') normal++;
      else if (st === 'conditioned') conditioned++;
      else if (st === 'injured') injured++;
      else if (st === 'absent') absent++;
    });

    return { normal, conditioned, injured, absent };
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

    // Collect all match dates across schedule, training sessions, and rpe entries
    const matchDatesSet = new Set<string>();

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
      INITIAL_ATHLETES.forEach((ath) => {
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
      setMatchDayOffset(existing.matchDayOffset);
      setStartTime(existing.startTime || '10:00');
      setEndTime(existing.endTime || '11:30');
      setTempStart(existing.tempStart !== undefined ? existing.tempStart.toString() : '20.0');
      setTempEnd(existing.tempEnd !== undefined ? existing.tempEnd.toString() : '25.0');
      setLocationName(existing.locationTime || 'Campo N.º 1');
      setFocusNotes(existing.focusNotes || '');
      setAthleteStatuses(buildInitialStatuses(existing.athleteStatuses));
    } else {
      // Default fallbacks
      const typeOverride = sched[selectedDate];
      let initialType: CalendarDayType = 'training';
      if (typeOverride) {
        initialType = typeOverride;
      } else {
        const isMatch = rpeList.some((r) => r.date === selectedDate && r.matchDayOffset === 'MD');
        const hasData = wellnessList.some((w) => w.date === selectedDate) || rpeList.some((r) => r.date === selectedDate);
        initialType = isMatch ? 'match' : hasData ? 'training' : 'training';
      }
      setDayType(initialType);
      setMatchDayOffset(getAutoMatchDayOffset(selectedDate, initialType));
      setStartTime('10:00');
      setEndTime('11:30');
      setTempStart('20.0');
      setTempEnd('25.0');
      setLocationName('Campo N.º 1');
      setFocusNotes('');
      setAthleteStatuses(buildInitialStatuses());
    }
  };

  const isInitialLoad = useRef(true);

  useEffect(() => {
    fetch('/api/training-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.sessions) {
          const localSessions = getStoredTrainingSessions();
          const localSched = getStoredCalendarSchedule();
          const mergedSessions = { ...data.sessions, ...localSessions };
          const mergedSched = { ...(data.schedule || {}), ...localSched };
          localStorage.setItem('femperf_training_sessions_info', JSON.stringify(mergedSessions));
          localStorage.setItem('femperf_training_calendar_schedule_v2', JSON.stringify(mergedSched));
          setTrainingSessions(mergedSessions);
          setCalendarSchedule(mergedSched);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    isInitialLoad.current = true;
    loadAllStoredData();
    const timer = setTimeout(() => {
      isInitialLoad.current = false;
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  // Auto-save session configuration on any field change
  useEffect(() => {
    if (isInitialLoad.current || !selectedDate) return;

    const startT = parseFloat(tempStart);
    const endT = parseFloat(tempEnd);

    const info: TrainingSessionInfo = {
      date: selectedDate,
      dayType,
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
    };

    saveTrainingSessionInfo(info);
  }, [selectedDate, dayType, matchDayOffset, startTime, endTime, durationMin, tempStart, tempEnd, tempDelta, locationName, focusNotes, athleteStatuses]);

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

  // Cycle day type on calendar strip button click
  const cycleDayTypeOnCalendar = (dateStr: string) => {
    const current = dayTypesMap[dateStr] || 'rest';
    let next: CalendarDayType = 'training';
    if (current === 'training') next = 'match';
    else if (current === 'match') next = 'rest';
    else next = 'training';

    const updatedSched = {
      ...calendarSchedule,
      [dateStr]: next,
    };
    setCalendarSchedule(updatedSched);
    saveCalendarSchedule(updatedSched);

    const existing = trainingSessions[dateStr];
    if (existing) {
      const updatedInfo: TrainingSessionInfo = {
        ...existing,
        dayType: next,
        matchDayOffset: getAutoMatchDayOffset(dateStr, next),
      };
      saveTrainingSessionInfo(updatedInfo);
    }

    // If currently selected date, update state & recalculate MD tag
    if (dateStr === selectedDate) {
      setDayType(next);
      setMatchDayOffset(getAutoMatchDayOffset(selectedDate, next));
    }
  };

  // Change day type for currently selected session and auto-update microcycle tag
  const handleSelectDayType = (newType: CalendarDayType) => {
    setDayType(newType);
    setMatchDayOffset(getAutoMatchDayOffset(selectedDate, newType));
  };

  // Update athlete training status
  const handleUpdateAthleteStatus = (athleteId: string, status: AthleteTrainingStatus, notes?: string) => {
    const ath = INITIAL_ATHLETES.find((a) => a.id === athleteId);
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
    INITIAL_ATHLETES.forEach((ath) => {
      allNormal[ath.id] = {
        athleteId: ath.id,
        athleteName: ath.name,
        status: 'normal',
        notes: athleteStatuses[ath.id]?.notes || '',
      };
    });
    setAthleteStatuses(allNormal);
  };

  // Save current training session info
  const handleSaveSession = (e: React.FormEvent) => {
    e.preventDefault();

    const startT = parseFloat(tempStart);
    const endT = parseFloat(tempEnd);

    const info: TrainingSessionInfo = {
      date: selectedDate,
      dayType,
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
    };

    saveTrainingSessionInfo(info);
    loadAllStoredData();

    setSaveSuccess(`Informação do treino para ${selectedDate} guardada com sucesso!`);
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
      {/* 1. Activity Calendar Bar (DIAS DO MÊS & CALENDÁRIO DE ATIVIDADE) */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar className="h-5 w-5 text-brand-lime" />
            <div>
              <h3 className="text-xs font-extrabold uppercase text-slate-100">
                Dias do Mês & Calendário de Atividade
              </h3>
              <p className="text-[11px] text-slate-400">
                Clica num dia para ver/editar a informação do treino. Clica novamente para alternar a atividade.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Month Selector */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-700 bg-dark-bg px-2.5 py-1 text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            />

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <span className="bg-blue-950/60 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg font-bold">⚽ Treino</span>
              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold">🏆 Jogo</span>
              <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg font-bold">🏖️ Folga</span>
            </div>
          </div>
        </div>

        {/* Scrollable Month Calendar Buttons */}
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
              icon = '🏆';
              label = 'Jogo';
              style = 'border-emerald-500/80 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70 font-black';
            }

            if (isSelected) {
              style += ' ring-2 ring-red-500 border-red-500 bg-red-950/40 shadow-lg scale-105';
            }

            return (
              <button
                key={dStr}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    cycleDayTypeOnCalendar(dStr);
                  } else {
                    onSelectDate(dStr);
                  }
                }}
                title={`${dStr}: Clica para selecionar/alterar (${label})`}
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
      </div>

      {saveSuccess && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-300 animate-fade-in">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* 2. Main Training Session Info Form & Athlete Submissions KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel (2 columns wide on large screens) */}
        <form onSubmit={handleSaveSession} className="lg:col-span-2 space-y-5 rounded-2xl border border-dark-border bg-dark-card p-5 shadow-lg">
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
              <span className="text-xs font-black text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                ⏱️ {formattedHoursMinutes(durationMin)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Hora de Início:</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Hora de Fim:</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2 text-xs font-bold text-slate-100 focus:border-red-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

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
              placeholder="Ex: Campo N.º 1 • Estádio Cidade de Barcelos"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-dark-bg p-2.5 text-xs font-bold text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Tactical Focus & Notes */}
          <div className="space-y-1">
            <label className="text-xs font-extrabold uppercase text-slate-300 block">
              6. Conteúdos Táticos & Objetivos da Sessão
            </label>
            <textarea
              rows={3}
              placeholder="Descreve o foco principal do treino (ex: Organização defensiva bloco médio, transição ofensiva rápida, bolas paradas)..."
              value={focusNotes}
              onChange={(e) => setFocusNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-dark-bg p-3 text-xs font-medium text-slate-100 placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* 7. Estado Individual do Treino por Jogadora */}
          <div className="space-y-3 rounded-xl border border-slate-800 bg-dark-surface/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <label className="text-xs font-extrabold uppercase text-slate-200 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span>7. Estado do Treino Por Jogadora</span>
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
              <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                🟢 Treino Integral: {statusCounts.normal}
              </span>
              <span className="bg-amber-950/60 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                🟡 Condicionada: {statusCounts.conditioned}
              </span>
              <span className="bg-rose-950/60 text-rose-300 border border-rose-500/30 px-2.5 py-1 rounded-xl">
                🔴 Lesionada: {statusCounts.injured}
              </span>
              <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-xl">
                ⚪ Ausente: {statusCounts.absent}
              </span>
            </div>

            {/* Roster Athletes Status Grid */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin pt-2">
              {INITIAL_ATHLETES.map((athlete) => {
                const currentStatus = athleteStatuses[athlete.id]?.status || 'normal';
                const currentNotes = athleteStatuses[athlete.id]?.notes || '';

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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-red-600 py-3 text-xs font-black text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all active:scale-98"
          >
            <Save className="h-4 w-4" />
            <span>Guardar Informação do Treino</span>
          </button>
        </form>

        {/* Side Panel: Selected Date Overview & Athlete Response Stats */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-4 shadow-md">
            <h3 className="text-xs font-black uppercase text-slate-100 border-b border-slate-800 pb-2">
              Respostas das Atletas em {selectedDate}
            </h3>

            <div className="space-y-3">
              {/* Wellness Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Questionário Wellness</span>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  {wellnessTodayCount} / {INITIAL_ATHLETES.length}
                </span>
              </div>

              {/* RPE Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Questionário PSE (RPE)</span>
                <span className="text-xs font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                  {rpeTodayCount} / {INITIAL_ATHLETES.length}
                </span>
              </div>

              {/* Hydration Submissions */}
              <div className="flex items-center justify-between bg-dark-bg p-3 rounded-xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Registo de Hidratação</span>
                <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {hydrationTodayCount} / {INITIAL_ATHLETES.length}
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
                  {dayType === 'training' ? '⚽ Treino' : dayType === 'match' ? '🏆 Jogo (MD)' : '🏖️ Folga'}
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
      </div>
    </div>
  );
};
