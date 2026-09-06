'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { WellnessEntry, RPEEntry, HydrationEntry, AthleteComplianceReport } from '@/lib/types';
import { INITIAL_ATHLETES } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { getStoredCalendarSchedule, saveCalendarSchedule, CalendarDayType } from '@/lib/storage';
import {
  AlertTriangle, Calendar, CheckCircle2, ChevronDown, ChevronUp, Copy,
  Euro, ShieldAlert, Sparkles, UserX, Dumbbell, Coffee, FileSpreadsheet, Trophy
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

  // Saved manual calendar schedule overrides (dateStr -> 'training' | 'match' | 'rest')
  const [manualDayTypes, setManualDayTypes] = useState<Record<string, CalendarDayType>>({});

  useEffect(() => {
    setManualDayTypes(getStoredCalendarSchedule());
  }, []);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

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

  // All active activity dates (training or match) in month
  const activeDates = useMemo(() => {
    return datesInMonth.filter((dateStr) => dayTypesMap[dateStr] === 'training' || dayTypesMap[dateStr] === 'match');
  }, [datesInMonth, dayTypesMap]);

  // Activity dates up to today (for fine/compliance calculation)
  const pastAndTodayActiveDates = useMemo(() => {
    return activeDates.filter((dateStr) => dateStr <= todayStr);
  }, [activeDates, todayStr]);

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

    const updated = {
      ...manualDayTypes,
      [dateStr]: next,
    };

    setManualDayTypes(updated);
    saveCalendarSchedule(updated);
  };

  // Build compliance report for all athletes across past & today active days
  const complianceReports: AthleteComplianceReport[] = useMemo(() => {
    return INITIAL_ATHLETES.map((ath) => {
      let missingWellnessCount = 0;
      let missingRpeCount = 0;
      let missingHydrationCount = 0;
      const failedDates: AthleteComplianceReport['failedDates'] = [];

      pastAndTodayActiveDates.forEach((dateStr) => {
        const hasWellness = wellnessList.some(
          (w) => w.date === dateStr && (w.athleteId === ath.id || w.athleteName === ath.name)
        );
        const hasRpe = rpeList.some(
          (r) => r.date === dateStr && (r.athleteId === ath.id || r.athleteName === ath.name)
        );
        const hasHydration = hydrationList.some(
          (h) => h.date === dateStr && (h.athleteId === ath.id || h.athleteName === ath.name)
        );

        const missingW = !hasWellness;
        const missingR = !hasRpe;
        const missingH = !hasHydration;

        if (missingW || missingR || missingH) {
          if (missingW) missingWellnessCount++;
          if (missingR) missingRpeCount++;
          if (missingH) missingHydrationCount++;

          const failsOnDate = (missingW ? 1 : 0) + (missingR ? 1 : 0) + (missingH ? 1 : 0);
          failedDates.push({
            date: dateStr,
            missingWellness: missingW,
            missingRpe: missingR,
            missingHydration: missingH,
            subtotalFines: failsOnDate * finePerFault,
          });
        }
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
      };
    }).sort((a, b) => b.totalFineEuros - a.totalFineEuros);
  }, [pastAndTodayActiveDates, wellnessList, rpeList, hydrationList, finePerFault]);

  // Overall KPIs
  const totalSquadFinesEuros = useMemo(
    () => complianceReports.reduce((acc, curr) => acc + curr.totalFineEuros, 0),
    [complianceReports]
  );

  const totalPossibleSubmissions = pastAndTodayActiveDates.length * INITIAL_ATHLETES.length * 3;
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
    text += `🎯 Dias de Atividade Considerados: ${activeDates.length} (${totalTrainingsCount} Treinos ⚽, ${totalMatchesCount} Jogos 🏆)\n`;
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
            {t.admin?.fines?.finesSub || 'Contabilização de ausências aos questionários apenas em dias de treino.'}
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

      {/* Monthly Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Active Activity Days */}
        <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-dark-card to-blue-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Dias de Atividade Efetivos</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-400">{activeDates.length} dias</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {totalTrainingsCount} Treinos ⚽ &bull; {totalMatchesCount} Jogos 🏆
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
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Taxa global de submissão</p>
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

      {/* Calendar Strip: Treino vs Jogo vs Folga Toggle */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-slate-300">
            <Calendar className="h-4 w-4 text-brand-lime" />
            <h3 className="text-xs font-extrabold uppercase">Dias do Mês & Calendário de Atividade</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
            <span>Clica em qualquer dia para alternar entre:</span>
            <span className="bg-blue-950/60 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-lg font-bold">⚽ Treino</span>
            <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-lg font-bold">🏆 Jogo</span>
            <span className="bg-slate-900 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-lg font-bold">🏖️ Folga</span>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {datesInMonth.map((dStr) => {
            const dayType = dayTypesMap[dStr] || 'rest';
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

            return (
              <button
                key={dStr}
                type="button"
                onClick={() => cycleDayType(dStr)}
                title={`${dStr}: Clica para alternar (${label})`}
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

      {/* Roster Fines & Compliance Master Table */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            Contabilização do Plantel ({complianceReports.length} Jogadoras)
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {activeDates.length} dias de atividade avaliados
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
                        {report.failedDates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedAthleteId(isExpanded ? null : report.athleteId)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-all"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable Breakdown of Failed Dates */}
                    {isExpanded && report.failedDates.length > 0 && (
                      <tr className="bg-slate-900/90">
                        <td colSpan={7} className="p-4 border-b border-slate-800">
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider">
                              Datas com Faltas Registadas — {report.athleteName}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {report.failedDates.map((fd) => (
                                <div
                                  key={fd.date}
                                  className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs space-y-1"
                                >
                                  <div className="flex justify-between items-center font-bold text-slate-200">
                                    <span>📅 {fd.date}</span>
                                    <span className="text-rose-400 font-black">+{fd.subtotalFines.toFixed(2)} €</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 text-[10px]">
                                    {fd.missingWellness && (
                                      <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                                        Falta Wellness
                                      </span>
                                    )}
                                    {fd.missingRpe && (
                                      <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                                        Falta PSE
                                      </span>
                                    )}
                                    {fd.missingHydration && (
                                      <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                                        Falta Pesagem
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
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
    </div>
  );
};
