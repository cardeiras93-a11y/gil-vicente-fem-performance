'use client';

import React, { useState, useMemo } from 'react';
import { Athlete, WellnessEntry, RPEEntry, MatchDayOffset } from '@/lib/types';
import { INITIAL_ATHLETES } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import {
  Users, Activity, TrendingUp, TrendingDown, AlertTriangle, ShieldCheck,
  Dumbbell, HeartPulse, Search, Filter, ArrowUpDown, ChevronRight, Stethoscope, Zap
} from 'lucide-react';

interface CollectiveSquadViewProps {
  wellnessList: WellnessEntry[];
  rpeList: RPEEntry[];
  selectedDate: string;
}

export const CollectiveSquadView: React.FC<CollectiveSquadViewProps> = ({
  wellnessList,
  rpeList,
  selectedDate,
}) => {
  const { t } = useLanguage();

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL'); // ALL | DANGER | CAUTION font | OPTIMAL | UNDERLOAD
  const [sortKey, setSortKey] = useState<'acwr' | 'wellness' | 'fatigue' | 'name'>('acwr');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Compute 28-day analytics matrix for ALL 27 athletes concurrently
  const squadMetrics = useMemo(() => {
    const todayObj = new Date(selectedDate);

    return INITIAL_ATHLETES.map((ath) => {
      // Build 28-day history for athlete
      const days28: Array<{
        date: string;
        mdTag: MatchDayOffset;
        wellnessTotal: number;
        sRPE: number;
        postFatigue: number;
        needsPhysio: boolean;
      }> = [];

      for (let i = 27; i >= 0; i--) {
        const d = new Date(todayObj);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const realW = wellnessList.find(
          (w) => w.athleteName.toLowerCase() === ath.name.toLowerCase() && w.date === dateStr
        );
        const realR = rpeList.find(
          (r) => r.athleteName.toLowerCase() === ath.name.toLowerCase() && r.date === dateStr
        );

        const wTotal = realW
          ? (realW.wellnessTotal || (realW.sleepQuality + realW.sleepDuration + realW.mood + realW.stress + realW.fatigue + realW.soreness + realW.heavyLegs))
          : 0;

        const borg = realR ? realR.physicalDemand : 0;
        const dur = realR?.sessionDurationMin || 0;
        const sRPE = borg * dur;
        const pFatigue = realR ? realR.postFatigue : 0;

        days28.push({
          date: dateStr,
          mdTag: realR?.matchDayOffset || realW?.matchDayOffset || 'MD-3',
          wellnessTotal: wTotal,
          sRPE,
          postFatigue: pFatigue,
          needsPhysio: Boolean(realW?.needsPhysio),
        });
      }

      // ACWR 7:28
      const last7 = days28.slice(-7);
      const acuteLoad7 = Math.round(last7.reduce((acc, curr) => acc + curr.sRPE, 0) / 7);
      const chronicLoad28 = Math.round(days28.reduce((acc, curr) => acc + curr.sRPE, 0) / 28);
      const standardACWR = chronicLoad28 > 0 ? +(acuteLoad7 / chronicLoad28).toFixed(2) : 0.0;

      // Micro ACWR 3:14
      const last3 = days28.slice(-3);
      const last14 = days28.slice(-14);
      const acuteLoad3 = last3.reduce((acc, curr) => acc + curr.sRPE, 0) / 3;
      const chronicLoad14 = last14.reduce((acc, curr) => acc + curr.sRPE, 0) / 14;
      const shortACWR = chronicLoad14 > 0 ? +(acuteLoad3 / chronicLoad14).toFixed(2) : 0.0;

      // Wellness 7d avg
      const validWellness = last7.filter((item) => item.wellnessTotal > 0);
      const avgWellness7d = validWellness.length
        ? +(validWellness.reduce((acc, curr) => acc + curr.wellnessTotal, 0) / validWellness.length).toFixed(1)
        : 0;

      // Post-fatigue 7d avg
      const validFatigue = last7.filter((item) => item.postFatigue > 0);
      const avgFatigue7d = validFatigue.length
        ? +(validFatigue.reduce((acc, curr) => acc + curr.postFatigue, 0) / validFatigue.length).toFixed(1)
        : 0;

      // Physio flag today
      const todayEntryW = wellnessList.find(
        (w) => w.athleteName.toLowerCase() === ath.name.toLowerCase() && w.date === selectedDate
      );
      const needsPhysioToday = Boolean(todayEntryW?.needsPhysio);

      // Match Day microcycle sparkline data (MD-6 to MD+2)
      const microcycleMap: Record<MatchDayOffset, number> = {
        'MD-6': 0, 'MD-5': 0, 'MD-4': 0, 'MD-3': 0, 'MD-2': 0, 'MD-1': 0, 'MD': 0, 'MD+1': 0, 'MD+2': 0
      };
      last7.forEach((item) => {
        if (microcycleMap[item.mdTag] !== undefined) {
          microcycleMap[item.mdTag] = item.sRPE;
        }
      });

      // Risk category classification
      let riskCategory: 'DANGER' | 'CAUTION' | 'OPTIMAL' | 'UNDERLOAD' = 'OPTIMAL';
      if (standardACWR > 1.5) riskCategory = 'DANGER';
      else if (standardACWR > 1.3) riskCategory = 'CAUTION';
      else if (standardACWR < 0.8) riskCategory = 'UNDERLOAD';

      return {
        athlete: ath,
        standardACWR,
        shortACWR,
        acuteLoad7: Math.round(acuteLoad7),
        chronicLoad28: Math.round(chronicLoad28),
        avgWellness7d,
        avgFatigue7d,
        needsPhysioToday,
        microcycleMap,
        riskCategory,
      };
    });
  }, [wellnessList, rpeList, selectedDate]);

  // Squad Aggregate Statistics
  const squadStats = useMemo(() => {
    const count = squadMetrics.length;
    if (count === 0) return { avgACWR: 1.0, dangerCount: 0, cautionCount: 0, avgWellness: 28, physioCount: 0 };

    const avgACWR = +(squadMetrics.reduce((acc, c) => acc + c.standardACWR, 0) / count).toFixed(2);
    const dangerCount = squadMetrics.filter((m) => m.riskCategory === 'DANGER').length;
    const cautionCount = squadMetrics.filter((m) => m.riskCategory === 'CAUTION').length;
    const avgWellness = +(squadMetrics.reduce((acc, c) => acc + c.avgWellness7d, 0) / count).toFixed(1);
    const physioCount = squadMetrics.filter((m) => m.needsPhysioToday).length;

    return { avgACWR, dangerCount, cautionCount, avgWellness, physioCount };
  }, [squadMetrics]);

  // Filtered & Sorted squad metrics list
  const filteredSquad = useMemo(() => {
    return squadMetrics
      .filter((item) => {
        const matchesName = item.athlete.name.toLowerCase().includes(searchFilter.toLowerCase());
        if (!matchesName) return false;

        if (riskFilter === 'DANGER') return item.riskCategory === 'DANGER';
        if (riskFilter === 'CAUTION') return item.riskCategory === 'CAUTION';
        if (riskFilter === 'OPTIMAL') return item.riskCategory === 'OPTIMAL';
        if (riskFilter === 'UNDERLOAD') return item.riskCategory === 'UNDERLOAD';

        return true;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortKey === 'acwr') comp = a.standardACWR - b.standardACWR;
        else if (sortKey === 'wellness') comp = a.avgWellness7d - b.avgWellness7d;
        else if (sortKey === 'fatigue') comp = a.avgFatigue7d - b.avgFatigue7d;
        else if (sortKey === 'name') comp = a.athlete.name.localeCompare(b.athlete.name);

        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [squadMetrics, searchFilter, riskFilter, sortKey, sortOrder]);

  const renderACWRBadge = (val: number) => {
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40';
    let label = 'Zona Ótima (0.8-1.3)';

    if (val > 1.5) {
      colorClass = 'bg-rose-600/20 text-rose-300 border-rose-500/60 animate-pulse';
      label = 'Perigo (> 1.5)';
    } else if (val > 1.3) {
      colorClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      label = 'Alerta (1.3-1.5)';
    } else if (val < 0.8) {
      colorClass = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/40';
      label = 'Sub-carga (< 0.8)';
    }

    return (
      <span className={`inline-flex items-center space-x-1 font-black px-2.5 py-1 rounded-xl border text-xs ${colorClass}`}>
        <span>{val}</span>
        <span className="opacity-80 text-[10px] font-bold">({label})</span>
      </span>
    );
  };

  const renderWellnessBadge = (score: number) => {
    let colorClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (score < 18) colorClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    else if (score < 24) colorClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

    return (
      <span className={`font-black px-2 py-0.5 rounded-lg border text-xs ${colorClass}`}>
        {score} <span className="text-[10px] opacity-75">/ 35</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-brand-lime/40 bg-gradient-to-r from-dark-card via-slate-900 to-dark-surface p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-lime text-slate-950 font-black shadow-md shadow-brand-lime/30">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight text-slate-100">
                Análise Coletiva & Carga do Plantel
              </h2>
              <p className="text-xs text-slate-400">
                Visualização simultânea de todas as jogadoras com rácios ACWR, tendências de Wellness e microciclo.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-brand-lime block">{squadMetrics.length} Atletas Ativas</span>
            <span className="text-[10px] text-slate-400 font-bold">Data de Referência: {selectedDate}</span>
          </div>
        </div>
      </div>

      {/* Squad Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Squad Avg ACWR */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-dark-card to-emerald-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">ACWR Média da Equipa</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">{squadStats.avgACWR}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Equilíbrio de carga da equipa</p>
        </div>

        {/* High Workload Risk Count */}
        <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-dark-card to-rose-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Risco de Sobrecarga</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-400">
            {squadStats.dangerCount + squadStats.cautionCount}{' '}
            <span className="text-xs text-slate-400 font-bold">
              ({squadStats.dangerCount} Perigo / {squadStats.cautionCount} Alerta)
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Atletas com ACWR &gt; 1.3</p>
        </div>

        {/* Squad Avg Wellness */}
        <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-dark-card to-cyan-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Wellness Coletivo</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-cyan-300">{squadStats.avgWellness} <span className="text-xs text-slate-500">/ 35</span></p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Média dos 7 indicadores pré-treino</p>
        </div>

        {/* Physio Referrals Today */}
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-dark-card to-amber-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-slate-400">Fisioterapia Hoje</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-400">{squadStats.physioCount} jogadoras</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">Solicitaram avaliação médica hoje</p>
        </div>
      </div>

      {/* Control Bar: Search, Sorting & Risk Filtering */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-dark-card border border-slate-800 p-4 rounded-2xl gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar jogadora..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-dark-bg py-2 pl-9 pr-3 text-xs font-bold text-slate-100 focus:border-brand-lime focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Category Filter Pill Buttons */}
          <button
            type="button"
            onClick={() => setRiskFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
              riskFilter === 'ALL'
                ? 'bg-slate-700 text-white border-slate-500'
                : 'bg-dark-surface text-slate-400 border-slate-800 hover:bg-slate-800'
            }`}
          >
            Todas ({squadMetrics.length})
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('DANGER')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
              riskFilter === 'DANGER'
                ? 'bg-rose-600 text-white border-rose-400'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            🚨 Perigo (&gt;1.5)
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('CAUTION')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
              riskFilter === 'CAUTION'
                ? 'bg-amber-600 text-white border-amber-400'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            ⚠️ Alerta (1.3-1.5)
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('OPTIMAL')}
            className={`px-3 py-1.5 text-xs font-extrabold rounded-xl border transition-all ${
              riskFilter === 'OPTIMAL'
                ? 'bg-emerald-600 text-white border-emerald-400'
                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            ✅ Ótima (0.8-1.3)
          </button>

          {/* Sort Order Selector */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-extrabold rounded-xl bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{sortOrder === 'desc' ? 'Maior Carga' : 'Menor Carga'}</span>
          </button>
        </div>
      </div>

      {/* Master Squad Collective Matrix Table */}
      <div className="space-y-3 rounded-2xl border border-slate-800 bg-dark-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
            Matriz Coletiva de Indicadores ({filteredSquad.length} Jogadoras)
          </h3>
          <span className="text-xs font-bold text-slate-400">
            Filtro: {riskFilter === 'ALL' ? 'Plantel Completo' : riskFilter}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400 font-extrabold tracking-wider bg-dark-surface/60">
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => setSortKey('name')}
                >
                  Atleta
                </th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => setSortKey('wellness')}
                >
                  Wellness (7d)
                </th>
                <th className="py-3 px-3">Carga Aguda (7d)</th>
                <th className="py-3 px-3">Carga Crónica (28d)</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => setSortKey('acwr')}
                >
                  Rácio ACWR (7:28)
                </th>
                <th className="py-3 px-3">ACWR Curto (3:14)</th>
                <th
                  className="py-3 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => setSortKey('fatigue')}
                >
                  Fadiga Média
                </th>
                <th className="py-3 px-3 text-center">Microciclo (MD-6 a MD+2)</th>
                <th className="py-3 px-3 text-center">Fisioterapia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-semibold">
              {filteredSquad.map((item) => (
                <tr key={item.athlete.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* Athlete Name */}
                  <td className="py-3 px-3 font-bold text-slate-100 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-brand-lime border border-slate-700">
                        {item.athlete.name.charAt(0)}
                      </div>
                      <span>{item.athlete.name}</span>
                    </div>
                  </td>

                  {/* Wellness 7d Avg */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {renderWellnessBadge(item.avgWellness7d)}
                  </td>

                  {/* Acute Load (7d AU) */}
                  <td className="py-3 px-3 text-slate-300 font-bold whitespace-nowrap">
                    {item.acuteLoad7} <span className="text-[10px] text-slate-500 font-normal">AU/dia</span>
                  </td>

                  {/* Chronic Load (28d AU) */}
                  <td className="py-3 px-3 text-slate-400 whitespace-nowrap">
                    {item.chronicLoad28} <span className="text-[10px] text-slate-500 font-normal">AU/dia</span>
                  </td>

                  {/* Standard ACWR 7:28 */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    {renderACWRBadge(item.standardACWR)}
                  </td>

                  {/* Short ACWR 3:14 */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-extrabold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/30 text-xs">
                      {item.shortACWR}
                    </span>
                  </td>

                  {/* Avg Post-Fatigue (1-10) */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`font-bold ${item.avgFatigue7d >= 7 ? 'text-rose-400 font-extrabold' : 'text-slate-300'}`}>
                      {item.avgFatigue7d} <span className="text-[10px] text-slate-500">/ 10</span>
                    </span>
                  </td>

                  {/* Microcycle Match Day Mini Heatmap */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {(['MD-6', 'MD-5', 'MD-4', 'MD-3', 'MD-2', 'MD-1', 'MD', 'MD+1', 'MD+2'] as MatchDayOffset[]).map((md) => {
                        const load = item.microcycleMap[md] || 0;
                        const heightPercent = Math.min(100, Math.max(20, (load / 900) * 100));
                        const isMD = md === 'MD';

                        return (
                          <div key={md} className="flex flex-col items-center group relative" title={`${md}: ${load} AU`}>
                            <div className="h-6 w-2.5 bg-slate-800 rounded-sm overflow-hidden flex items-end">
                              <div
                                style={{ height: `${heightPercent}%` }}
                                className={`w-full transition-all ${
                                  isMD
                                    ? 'bg-rose-500'
                                    : load > 600
                                    ? 'bg-amber-400'
                                    : 'bg-brand-lime'
                                }`}
                              />
                            </div>
                            <span className="text-[8px] text-slate-500 mt-0.5 font-bold">{md.replace('MD', '') || '0'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </td>

                  {/* Physio Referral Flag */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    {item.needsPhysioToday ? (
                      <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full text-[10px] font-extrabold animate-pulse">
                        <Stethoscope className="h-3 w-3" />
                        <span>Fisioterapia</span>
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px] italic">Sem queixas</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
