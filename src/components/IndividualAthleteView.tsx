'use client';

import React, { useState, useMemo } from 'react';
import { Athlete, WellnessEntry, RPEEntry, MatchDayOffset } from '@/lib/types';
import { INITIAL_ATHLETES, BORG_SCALE } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import { getHydrationLocally } from '@/lib/storage';
import { exportAllDataToExcel } from '@/lib/exportUtils';
import {
  Activity, Calendar, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  Dumbbell, HeartPulse, User, BarChart3, Clock, Scale, Zap, Info, ChevronDown, Filter, ChevronRight, FileSpreadsheet
} from 'lucide-react';

interface IndividualAthleteViewProps {
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  selectedDate: string;
}

export const IndividualAthleteView: React.FC<IndividualAthleteViewProps> = ({
  wellnessList,
  rpeList,
  selectedDate,
}) => {
  const { t } = useLanguage();

  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(INITIAL_ATHLETES[0].id);
  const [timeWindow, setTimeWindow] = useState<'7' | '14' | '28'>('28');
  const [filterMD, setFilterMD] = useState<string>('ALL');

  const selectedAthlete = INITIAL_ATHLETES.find((a) => a.id === selectedAthleteId) || INITIAL_ATHLETES[0];

  // Helper to generate or blend 28-day historical data for deep longitudinal analytics
  const athleteHistory = useMemo(() => {
    const daysCount = 28;
    const historyData: Array<{
      date: string;
      dayLabel: string;
      mdTag: MatchDayOffset;
      wellnessTotal: number;
      sleepQuality: number;
      fatigue: number;
      stress: number;
      soreness: number;
      borgDemand: number;
      durationMin: number;
      sRPE: number; // sRPE = Borg * duration
      postFatigue: number;
      needsPhysio: boolean;
      hasRealData: boolean;
    }> = [];

    const todayObj = new Date(selectedDate);

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Check real entries stored locally
      const realW = wellnessList.find(
        (w) => w.athleteName.toLowerCase() === selectedAthlete.name.toLowerCase() && w.date === dateStr
      );
      const realR = rpeList.find(
        (r) => r.athleteName.toLowerCase() === selectedAthlete.name.toLowerCase() && r.date === dateStr
      );

      const hasRealData = Boolean(realW || realR);

      const wellnessTotal = realW
        ? (realW.wellnessTotal ||
            realW.sleepQuality +
              realW.sleepDuration +
              realW.mood +
              realW.stress +
              realW.fatigue +
              realW.soreness +
              realW.heavyLegs)
        : 0;

      const borgDemand = realR ? realR.physicalDemand : 0;
      const durationMin = realR?.sessionDurationMin || 0;
      const sRPE = borgDemand * durationMin;
      const postFatigue = realR ? realR.postFatigue : 0;

      historyData.push({
        date: dateStr,
        dayLabel: d.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' }),
        mdTag: realR?.matchDayOffset || realW?.matchDayOffset || 'MD-3',
        wellnessTotal,
        sleepQuality: realW ? realW.sleepQuality : 0,
        fatigue: realW ? realW.fatigue : 0,
        stress: realW ? realW.stress : 0,
        soreness: realW ? realW.soreness : 0,
        borgDemand,
        durationMin,
        sRPE,
        postFatigue,
        needsPhysio: Boolean(realW?.needsPhysio),
        hasRealData,
      });
    }

    return historyData;
  }, [selectedAthlete, wellnessList, rpeList, selectedDate]);

  // Filtered dataset according to time window & MD selection
  const filteredHistory = useMemo(() => {
    const limit = parseInt(timeWindow, 10);
    let slice = athleteHistory.slice(-limit);

    if (filterMD !== 'ALL') {
      slice = slice.filter((item) => item.mdTag === filterMD);
    }
    return slice;
  }, [athleteHistory, timeWindow, filterMD]);

  // ACWR Calculations (Standard 7:28 vs Short/Micro 3:14)
  const acwrMetrics = useMemo(() => {
    const last7 = athleteHistory.slice(-7);
    const last28 = athleteHistory;
    const last3 = athleteHistory.slice(-3);
    const last14 = athleteHistory.slice(-14);

    const acuteLoad7 = last7.reduce((acc, curr) => acc + curr.sRPE, 0) / 7;
    const chronicLoad28 = last28.reduce((acc, curr) => acc + curr.sRPE, 0) / 28;

    const acuteLoad3 = last3.reduce((acc, curr) => acc + curr.sRPE, 0) / 3;
    const chronicLoad14 = last14.reduce((acc, curr) => acc + curr.sRPE, 0) / 14;

    const standardACWR = chronicLoad28 > 0 ? +(acuteLoad7 / chronicLoad28).toFixed(2) : 1.0;
    const shortACWR = chronicLoad14 > 0 ? +(acuteLoad3 / chronicLoad14).toFixed(2) : 1.0;

    return {
      acuteLoad7: Math.round(acuteLoad7),
      chronicLoad28: Math.round(chronicLoad28),
      standardACWR,

      acuteLoad3: Math.round(acuteLoad3),
      chronicLoad14: Math.round(chronicLoad14),
      shortACWR,
    };
  }, [athleteHistory]);

  // Helper for ACWR Risk Status Badge
  const getACWRBadge = (ratio: number, labelPrefix: string) => {
    if (ratio < 0.8) {
      return (
        <div className="flex items-center space-x-2 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-amber-400 font-extrabold text-xs">
          <TrendingDown className="h-4 w-4" />
          <span>{labelPrefix}: {ratio} &bull; Subtreino / Carga Baixa</span>
        </div>
      );
    }
    if (ratio <= 1.3) {
      return (
        <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-emerald-400 font-extrabold text-xs">
          <ShieldCheck className="h-4 w-4" />
          <span>{labelPrefix}: {ratio} &bull; Sweet Spot (Seguro / Ideal)</span>
        </div>
      );
    }
    if (ratio <= 1.5) {
      return (
        <div className="flex items-center space-x-2 rounded-xl bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-orange-400 font-extrabold text-xs">
          <AlertTriangle className="h-4 w-4" />
          <span>{labelPrefix}: {ratio} &bull; Risco Moderado de Lesão</span>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-rose-400 font-extrabold text-xs animate-pulse">
        <AlertTriangle className="h-4 w-4" />
        <span>{labelPrefix}: {ratio} &bull; ZONA DE PERIGO (Pico / Spike Elevado)</span>
      </div>
    );
  };

  // Microcycle Average Breakdown (MD-6, MD-5, MD-4, MD-3, MD-2, MD-1, MD, MD+1, MD+2)
  const mdMicrocycleBreakdown = useMemo(() => {
    const tags: MatchDayOffset[] = ['MD-6', 'MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'];
    return tags.map((tag) => {
      const entries = athleteHistory.filter((item) => item.mdTag === tag);
      const avgWellness = entries.length
        ? +(entries.reduce((acc, c) => acc + c.wellnessTotal, 0) / entries.length).toFixed(1)
        : 0;
      const avgBorg = entries.length
        ? +(entries.reduce((acc, c) => acc + c.borgDemand, 0) / entries.length).toFixed(1)
        : 0;
      const avgSRPE = entries.length
        ? Math.round(entries.reduce((acc, c) => acc + c.sRPE, 0) / entries.length)
        : 0;

      return {
        tag,
        count: entries.length,
        avgWellness,
        avgBorg,
        avgSRPE,
      };
    });
  }, [athleteHistory]);

  // Weight metrics for selected athlete
  const weightMetrics = useMemo(() => {
    const allHydration = getHydrationLocally();
    const monthPrefix = selectedDate.substring(0, 7);

    const monthEntries = allHydration
      .filter(
        (h) =>
          h.athleteName.toLowerCase() === selectedAthlete.name.toLowerCase() &&
          h.date.startsWith(monthPrefix)
      )
      .sort((a, b) => a.date.localeCompare(b.date));

    const todayEntry = allHydration.find(
      (h) =>
        h.athleteName.toLowerCase() === selectedAthlete.name.toLowerCase() &&
        h.date === selectedDate
    );

    const firstEntry = monthEntries.length > 0 ? monthEntries[0] : null;
    const lastEntry = monthEntries.length > 0 ? monthEntries[monthEntries.length - 1] : null;

    const firstWeight = firstEntry ? (firstEntry.preWeight || firstEntry.postWeight) : null;
    const firstWeightDate = firstEntry ? firstEntry.date.split('-').slice(1).reverse().join('/') : null;

    const lastWeight = lastEntry ? (lastEntry.postWeight || lastEntry.preWeight) : null;
    const lastWeightDate = lastEntry ? lastEntry.date.split('-').slice(1).reverse().join('/') : null;

    const preWeightToday = todayEntry ? todayEntry.preWeight : null;
    const postWeightToday = todayEntry ? todayEntry.postWeight : null;

    return {
      firstWeight,
      firstWeightDate,
      lastWeight,
      lastWeightDate,
      preWeightToday,
      postWeightToday,
    };
  }, [selectedAthlete.name, selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Athlete Selector & Filter Bar */}
      <div className="rounded-2xl border border-dark-border bg-dark-card p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white font-black text-lg shadow-md shadow-red-600/30">
              {selectedAthlete.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-100 uppercase">{selectedAthlete.name}</h2>
                <span className="bg-red-500/10 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                  Gil Vicente FC
                </span>
              </div>
              <p className="text-xs text-slate-400">Análise Longitudinal & Monitorização de Carga ACWR</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Athlete Select Dropdown */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="rounded-xl border border-slate-700 bg-dark-bg py-2 pl-9 pr-8 text-xs font-extrabold text-slate-100 focus:border-red-500 focus:outline-none appearance-none"
              >
                {INITIAL_ATHLETES.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Time Window Buttons */}
            <div className="flex rounded-xl bg-dark-bg p-1 border border-slate-800">
              {(['7', '14', '28'] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTimeWindow(days)}
                  className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-all ${
                    timeWindow === days
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>

            {/* Export Selected Athlete Excel Button */}
            <button
              type="button"
              onClick={() => exportAllDataToExcel(wellnessList, rpeList, [], selectedAthlete.name)}
              className="flex items-center space-x-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300 hover:bg-emerald-500/20 transition-all"
              title={`Exportar dados de ${selectedAthlete.name} para Excel`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>📊 Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Microcycle Filter Pills (MD-4 to MD+1) */}
        <div className="flex items-center space-x-2 border-t border-slate-800 pt-3 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center space-x-1 shrink-0">
            <Filter className="h-3 w-3 text-red-400" />
            <span>Filtro Microciclo:</span>
          </span>
          <div className="flex space-x-1">
            {['ALL', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterMD(tag)}
                className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg transition-all whitespace-nowrap ${
                  filterMD === tag
                    ? 'bg-slate-100 text-slate-950 shadow-sm'
                    : 'bg-dark-bg text-slate-400 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {tag === 'ALL' ? 'Todos os Dias' : tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ACWR Cards (Standard 7:28 vs Short 3:14) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Standard ACWR (7:28) */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Scale className="h-5 w-5 text-brand-lime" />
              <h3 className="text-sm font-extrabold uppercase">Rácio ACWR Habitual (Padrão 7d : 28d)</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-dark-bg px-2 py-0.5 rounded border border-slate-800">
              Janela Padrão
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black text-slate-100">{acwrMetrics.standardACWR}</span>
            <div className="text-xs font-semibold text-slate-400">
              Aguda (7d): <span className="font-bold text-brand-lime">{acwrMetrics.acuteLoad7} sRPE</span> &bull; Crónica (28d):{' '}
              <span className="font-bold text-slate-200">{acwrMetrics.chronicLoad28} sRPE</span>
            </div>
          </div>

          {getACWRBadge(acwrMetrics.standardACWR, 'ACWR Padrão')}
        </div>

        {/* Short Micro ACWR (3:14) */}
        <div className="rounded-2xl border border-slate-800 bg-dark-card p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-200">
              <Clock className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-extrabold uppercase">Rácio ACWR Curto / Micro (3d : 14d)</h3>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              Reação Rápida
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black text-slate-100">{acwrMetrics.shortACWR}</span>
            <div className="text-xs font-semibold text-slate-400">
              Aguda (3d): <span className="font-bold text-cyan-400">{acwrMetrics.acuteLoad3} sRPE</span> &bull; Crónica (14d):{' '}
              <span className="font-bold text-slate-200">{acwrMetrics.chronicLoad14} sRPE</span>
            </div>
          </div>

          {getACWRBadge(acwrMetrics.shortACWR, 'ACWR Curto')}
        </div>
      </div>

      {/* Controlo Ponderal Individual do Mês */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-950/10 p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-300">
            <Scale className="h-5 w-5 text-blue-400" />
            <h3 className="text-sm font-extrabold uppercase">Controlo Ponderal de {selectedAthlete.name} ({selectedDate.substring(0, 7)})</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-dark-bg px-2 py-0.5 rounded border border-slate-800">
            Pesagem Pré-Treino & Histórico
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-blue-500/20 bg-dark-card p-3 text-center">
            <span className="text-[11px] font-bold text-blue-400 uppercase block">Peso Pré-Treino (Hoje)</span>
            <span className="text-xl font-black text-slate-100">
              {weightMetrics.preWeightToday ? `${weightMetrics.preWeightToday} kg` : '-'}
            </span>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-dark-card p-3 text-center">
            <span className="text-[11px] font-bold text-amber-400 uppercase block">1º Peso Registado no Mês</span>
            <span className="text-xl font-black text-slate-100">
              {weightMetrics.firstWeight ? `${weightMetrics.firstWeight} kg` : '-'}
            </span>
            {weightMetrics.firstWeightDate && (
              <span className="text-[10px] text-slate-400 block mt-0.5">({weightMetrics.firstWeightDate})</span>
            )}
          </div>

          <div className="rounded-xl border border-cyan-500/20 bg-dark-card p-3 text-center">
            <span className="text-[11px] font-bold text-cyan-400 uppercase block">Último Peso Registado no Mês</span>
            <span className="text-xl font-black text-slate-100">
              {weightMetrics.lastWeight ? `${weightMetrics.lastWeight} kg` : '-'}
            </span>
            {weightMetrics.lastWeightDate && (
              <span className="text-[10px] text-slate-400 block mt-0.5">({weightMetrics.lastWeightDate})</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Longitudinal Trends Charts (Wellness & RPE sRPE Load) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* RPE & sRPE Workload Trend */}
        <div className="rounded-2xl border border-dark-border bg-dark-card p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-100">
              <Dumbbell className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-black uppercase">Evolução Diária da Carga sRPE ({filteredHistory.length}d)</h3>
            </div>
            <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              sRPE = Borg &times; Duração
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {filteredHistory.map((item) => {
              const maxLoad = 900;
              const pct = Math.min(100, Math.round((item.sRPE / maxLoad) * 100));

              return (
                <div key={item.date} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <span className="text-slate-400 font-mono text-[10px]">{item.dayLabel}</span>
                      <span className="bg-slate-800 text-cyan-300 px-1.5 py-0.2 rounded text-[9px] font-black border border-slate-700">
                        {item.mdTag}
                      </span>
                    </span>
                    <span className="font-extrabold text-cyan-300">
                      Borg {item.borgDemand}/10 &bull; {item.sRPE} sRPE
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-dark-bg overflow-hidden border border-slate-800 flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full transition-all rounded-full ${
                        item.borgDemand >= 8
                          ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                          : item.borgDemand >= 5
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wellness Total Trend (7 to 35) */}
        <div className="rounded-2xl border border-dark-border bg-dark-card p-4 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-100">
              <HeartPulse className="h-5 w-5 text-emerald-400" />
              <h3 className="text-sm font-black uppercase">Evolução do Wellness Total ({filteredHistory.length}d)</h3>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Escala 7 a 35
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {filteredHistory.map((item) => {
              const pct = Math.min(100, Math.round((item.wellnessTotal / 35) * 100));

              return (
                <div key={item.date} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <span className="text-slate-400 font-mono text-[10px]">{item.dayLabel}</span>
                      <span className="bg-slate-800 text-emerald-300 px-1.5 py-0.2 rounded text-[9px] font-black border border-slate-700">
                        {item.mdTag}
                      </span>
                    </span>
                    <span className="font-extrabold text-emerald-300">
                      {item.wellnessTotal} / 35
                    </span>
                  </div>

                  <div className="h-3 w-full rounded-full bg-dark-bg overflow-hidden border border-slate-800 flex">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full transition-all rounded-full ${
                        item.wellnessTotal >= 28
                          ? 'bg-emerald-500'
                          : item.wellnessTotal >= 22
                          ? 'bg-cyan-400'
                          : item.wellnessTotal >= 16
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Match Day Microcycle Comparison Matrix (MD-6 to MD+2) */}
      <div className="rounded-2xl border border-dark-border bg-dark-card p-4 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-100 uppercase flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-red-500" />
              <span>Comparação de Resposta da Atleta por Tipo de Dia (MD-6 a MD+2)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Compara a carga média e o índice de recuperação de {selectedAthlete.name} conforme a proximidade do jogo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {mdMicrocycleBreakdown.map((row) => (
            <div key={row.tag} className="rounded-xl border border-slate-800 bg-dark-bg p-3 space-y-2 text-center">
              <span className="text-xs font-black text-slate-100 bg-slate-800 px-2 py-0.5 rounded-md inline-block border border-slate-700">
                {row.tag}
              </span>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Carga sRPE</span>
                <span className="text-base font-black text-cyan-400">{row.avgSRPE}</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Wellness</span>
                <span className="text-sm font-extrabold text-emerald-400">{row.avgWellness} / 35</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Borg Média</span>
                <span className="text-xs font-bold text-amber-300">{row.avgBorg} / 10</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
