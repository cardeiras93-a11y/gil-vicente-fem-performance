'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MatchInfo, MatchPlayerGps, calculateTeamKpis, calculateSectorAverages,
  calculateNormalizedStats, getDeltaPct, posColorClassMap, getAllMatches
} from '@/data/matchRegistry';
import {
  ArrowLeftRight, Calendar, MapPin, Trophy, Zap, Activity, Flame,
  ArrowUpRight, ArrowDownRight, User, Gauge, Clock, Sparkles, BarChart3,
  TrendingUp, TrendingDown, Layers, CheckCircle, Scale
} from 'lucide-react';

interface MatchComparisonViewProps {
  matches?: MatchInfo[];
  initialMatchAId?: string;
  initialMatchBId?: string;
  onBack?: () => void;
  isAthleteView?: boolean;
  lockedPlayerName?: string;
}

export const MatchComparisonView: React.FC<MatchComparisonViewProps> = ({
  matches: propMatches,
  initialMatchAId,
  initialMatchBId,
  onBack,
  isAthleteView = false,
  lockedPlayerName,
}) => {
  const rawMatches = useMemo(() => propMatches || getAllMatches(), [propMatches]);
  
  // If in athlete view, filter available matches to only matches where the athlete participated
  const allMatches = useMemo(() => {
    if (!isAthleteView || !lockedPlayerName) return rawMatches;
    const target = lockedPlayerName.trim().toLowerCase();
    const filtered = rawMatches.filter((m) =>
      m.players.some((p) => p.name.trim().toLowerCase() === target && p.dist > 0)
    );
    return filtered.length > 0 ? filtered : rawMatches;
  }, [rawMatches, isAthleteView, lockedPlayerName]);

  const [matchAId, setMatchAId] = useState<string>(() => initialMatchAId || allMatches[0]?.id || '');
  const [matchBId, setMatchBId] = useState<string>(() => initialMatchBId || allMatches[1]?.id || allMatches[0]?.id || '');

  // Active comparison chart metric
  const [chartMetric, setChartMetric] = useState<'dist' | 'sprint' | 'acc' | 'rpe'>('dist');

  // Selected athlete for Head-to-Head
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>(() => lockedPlayerName || 'Simães');

  // Keep player locked if in athlete view
  useEffect(() => {
    if (isAthleteView && lockedPlayerName) {
      setSelectedPlayerName(lockedPlayerName);
    }
  }, [isAthleteView, lockedPlayerName]);

  const matchA = useMemo(() => allMatches.find((m) => m.id === matchAId) || allMatches[0], [allMatches, matchAId]);
  const matchB = useMemo(() => allMatches.find((m) => m.id === matchBId) || allMatches[1] || allMatches[0], [allMatches, matchBId]);

  // Swap matches
  const handleSwapMatches = () => {
    setMatchAId(matchBId);
    setMatchBId(matchAId);
  };

  // Calculate KPIs
  const kpiA = useMemo(() => calculateTeamKpis(matchA), [matchA]);
  const kpiB = useMemo(() => calculateTeamKpis(matchB), [matchB]);

  // Calculate Sector Averages
  const sectorA = useMemo(() => calculateSectorAverages(matchA), [matchA]);
  const sectorB = useMemo(() => calculateSectorAverages(matchB), [matchB]);

  // Head to Head Player
  const playerA = useMemo(() => matchA.players.find((p) => p.name === selectedPlayerName) || null, [matchA, selectedPlayerName]);
  const playerB = useMemo(() => matchB.players.find((p) => p.name === selectedPlayerName) || null, [matchB, selectedPlayerName]);

  const normA = useMemo(() => (playerA ? calculateNormalizedStats(playerA) : null), [playerA]);
  const normB = useMemo(() => (playerB ? calculateNormalizedStats(playerB) : null), [playerB]);

  // Unique list of player names across both matches
  const allPlayerNames = useMemo(() => {
    const set = new Set<string>();
    matchA.players.forEach((p) => set.add(p.name));
    matchB.players.forEach((p) => set.add(p.name));
    return Array.from(set);
  }, [matchA, matchB]);

  // Days difference
  const daysDiff = useMemo(() => {
    const dateA = new Date(matchA.matchDate);
    const dateB = new Date(matchB.matchDate);
    const diffTime = Math.abs(dateA.getTime() - dateB.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [matchA, matchB]);

  // Chart players sorted by metric
  const chartPlayers = useMemo(() => {
    return allPlayerNames.map((name) => {
      const pA = matchA.players.find((p) => p.name === name);
      const pB = matchB.players.find((p) => p.name === name);
      const pos = pA?.pos || pB?.pos || 'CAMPO';

      const valA = pA ? (chartMetric === 'dist' ? pA.dist : chartMetric === 'sprint' ? pA.sprint : chartMetric === 'acc' ? pA.acc + pA.dec : pA.rpe || 0) : 0;
      const valB = pB ? (chartMetric === 'dist' ? pB.dist : chartMetric === 'sprint' ? pB.sprint : chartMetric === 'acc' ? pB.acc + pB.dec : pB.rpe || 0) : 0;

      return { name, pos, valA, valB, maxVal: Math.max(valA, valB) };
    }).sort((a, b) => b.valA - a.valA);
  }, [allPlayerNames, matchA, matchB, chartMetric]);

  const maxChartVal = useMemo(() => {
    const max = Math.max(...chartPlayers.map((p) => Math.max(p.valA, p.valB)), 1);
    return max;
  }, [chartPlayers]);

  // Athlete individual match bars across her games
  const athleteMatchBars = useMemo(() => {
    if (!isAthleteView) return null;
    const target = selectedPlayerName.trim().toLowerCase();
    return allMatches.map((m) => {
      const p = m.players.find((pl) => pl.name.trim().toLowerCase() === target);
      const val = p ? (chartMetric === 'dist' ? p.dist : chartMetric === 'sprint' ? p.sprint : chartMetric === 'acc' ? p.acc + p.dec : p.rpe || 0) : 0;
      const isMatchA = m.id === matchA.id;
      const isMatchB = m.id === matchB.id;
      return { matchId: m.id, opponent: m.opponent, date: m.matchDate, val, isMatchA, isMatchB };
    });
  }, [isAthleteView, allMatches, selectedPlayerName, chartMetric, matchA, matchB]);

  const maxAthleteVal = useMemo(() => {
    if (!athleteMatchBars) return 1;
    return Math.max(...athleteMatchBars.map((b) => b.val), 1);
  }, [athleteMatchBars]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 text-slate-100 animate-fade-in pb-16">
      {/* HEADER & MATCH SELECTOR BAR */}
      <section className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-[#152244] to-[#0B1329] p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-sky-950/60 shrink-0">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>COMPARADOR DE PARTIDAS & ANÁLISE EVOLUTIVA</span>
              </h1>
              <p className="text-xs font-bold text-sky-400">
                Comparação de Desempenho Tático-Físico GPS • Gil Vicente FC Sub-15
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-300">
            <Calendar className="h-4 w-4 text-sky-400" />
            <span>{daysDiff} dias entre jogos</span>
          </div>
        </div>

        {isAthleteView && allMatches.length < 2 && (
          <div className="mt-4 rounded-xl bg-amber-500/20 border border-amber-500/40 p-3 flex items-center space-x-3 text-xs text-amber-200">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-bold">Tens 1 jogo registado com dados individuais ({allMatches[0]?.opponent} • {allMatches[0]?.matchDate}).</p>
              <p className="text-[11px] text-amber-300/80">O comparador evolutivo traça o confronto direto entre 2 partidas da mesma atleta. Quando participares num próximo jogo, poderás confrontar diretamente ambos os desempenhos aqui!</p>
            </div>
          </div>
        )}

        {/* DUAL MATCH SELECTORS */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center pt-4">
          {/* MATCH A SELECTOR */}
          <div className="md:col-span-5 rounded-xl bg-sky-500/10 border-2 border-sky-500/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-sky-300">
              <span>🔵 Jogo A (Referência Principal)</span>
              {matchA.score && <span className="bg-sky-500/20 px-2 py-0.5 rounded-md border border-sky-500/30 font-black">{matchA.score}</span>}
            </div>
            <select
              value={matchAId}
              onChange={(e) => setMatchAId(e.target.value)}
              className="w-full rounded-lg bg-slate-900/90 border border-sky-500/30 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {allMatches.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.matchDate} — vs {m.opponent} {m.score ? `(${m.score})` : ''}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>{matchA.competition || 'Campeonato'}</span>
              <span>{matchA.location || 'Campo'}</span>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center">
            <button
              type="button"
              onClick={handleSwapMatches}
              title="Inverter Jogos A e B"
              className="h-10 w-10 rounded-full bg-slate-800 border border-white/20 text-slate-200 hover:bg-sky-500 hover:text-slate-950 transition-all flex items-center justify-center shadow-lg active:scale-95"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>

          {/* MATCH B SELECTOR */}
          <div className="md:col-span-5 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 p-3 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase text-amber-300">
              <span>🟡 Jogo B (Comparação)</span>
              {matchB.score && <span className="bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30 font-black">{matchB.score}</span>}
            </div>
            <select
              value={matchBId}
              onChange={(e) => setMatchBId(e.target.value)}
              className="w-full rounded-lg bg-slate-900/90 border border-amber-500/30 px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {allMatches.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.matchDate} — vs {m.opponent} {m.score ? `(${m.score})` : ''}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
              <span>{matchB.competition || 'Campeonato'}</span>
              <span>{matchB.location || 'Campo'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: COLLECTIVE TEAM KPIS (HEAD-TO-HEAD GLOBAL) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span>1. Balanço Coletivo da Equipa (KPIs Globais & Δ%)</span>
          </h2>
          <span className="text-[11px] text-slate-400">Δ% = Variação do Jogo A vs Jogo B</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card: Distância Média */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgDist, kpiB.avgDist);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Distância Média</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-white">{kpiA.avgDist.toLocaleString('pt-PT')} m</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgDist.toLocaleString('pt-PT')} m</span>
                  <span className="font-bold">{delta.diff > 0 ? `+${delta.diff}m` : `${delta.diff}m`}</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Distância em Corrida */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgRunning, kpiB.avgRunning);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Corrida (&gt;7 km/h)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-sky-400">{kpiA.avgRunning.toLocaleString('pt-PT')} m</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgRunning.toLocaleString('pt-PT')} m</span>
                  <span>{kpiA.runningPct.toFixed(0)}% do total</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Sprint >19 km/h */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgSprint, kpiB.avgSprint);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Sprint Média (&gt;19 km/h)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-emerald-400">{kpiA.avgSprint} m</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgSprint} m</span>
                  <span className="font-bold">{delta.diff > 0 ? `+${delta.diff}m` : `${delta.diff}m`}</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Velocidade Máxima */}
          {(() => {
            const delta = getDeltaPct(kpiA.maxTopSpeed, kpiB.maxTopSpeed);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Pico Vel. Equipa</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-amber-300">{kpiA.maxTopSpeed.toFixed(2)} km/h</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Líder A: {kpiA.topSpeedPlayer}</span>
                  <span>B: {kpiB.maxTopSpeed.toFixed(1)}</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Sprint Máximo >23 km/h */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgSprint23, kpiB.avgSprint23);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Sprint (&gt;23 km/h)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-rose-400">{kpiA.avgSprint23} m</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgSprint23} m</span>
                  <span className="font-bold">{delta.diff > 0 ? `+${delta.diff}m` : `${delta.diff}m`}</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Carga Mecânica (ACC + DEC) */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgMechanicalLoad, kpiB.avgMechanicalLoad);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Ações Mecânicas Média</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-purple-300">{kpiA.avgMechanicalLoad}</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {delta.pct > 0 ? `+${delta.pct}%` : `${delta.pct}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>ACC: {kpiA.avgAcc} | DEC: {kpiA.avgDec}</span>
                  <span>B: {kpiB.avgMechanicalLoad}</span>
                </div>
              </div>
            );
          })()}

          {/* Card: PSE / Carga Interna */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgRpe, kpiB.avgRpe);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">PSE Média (Carga Interna)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-amber-400">{kpiA.avgRpe} / 10</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.diff <= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {delta.diff > 0 ? `+${delta.diff}` : `${delta.diff}`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgRpe} / 10</span>
                  <span>Perceção de Esforço</span>
                </div>
              </div>
            );
          })()}

          {/* Card: Fadiga Muscular */}
          {(() => {
            const delta = getDeltaPct(kpiA.avgFatigue, kpiB.avgFatigue);
            return (
              <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">Fadiga Muscular Média</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-black text-rose-300">{kpiA.avgFatigue} / 5</span>
                  <span className={`text-xs font-black px-1.5 py-0.5 rounded-md flex items-center ${delta.diff <= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {delta.diff > 0 ? `+${delta.diff}` : `${delta.diff}`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex justify-between">
                  <span>Jogo B: {kpiB.avgFatigue} / 5</span>
                  <span>Impacto neuromuscular</span>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* SECTION 2: COMPARISON BY SECTOR / POSITION */}
      <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>2. Comparação Posicional por Setor ([LAT], [DC], [MED], [EXT], [AV])</span>
          </h2>
          <div className="flex items-center space-x-3 text-xs font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-sky-400"></span>
              <span className="text-sky-300">Jogo A: {matchA.opponent}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-400"></span>
              <span className="text-amber-300">Jogo B: {matchB.opponent}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {Object.keys(sectorA).map((posKey) => {
            const secA = sectorA[posKey];
            const secB = sectorB[posKey] || { ...secA, avgDist: 0, avgSprint: 0, avgAcc: 0, avgDec: 0 };
            const deltaDist = getDeltaPct(secA.avgDist, secB.avgDist);
            const deltaSprint = getDeltaPct(secA.avgSprint, secB.avgSprint);
            const posConf = posColorClassMap[posKey] || { bg: 'bg-slate-700', text: 'text-slate-300', border: 'border-slate-600' };

            return (
              <div key={posKey} className="rounded-xl bg-[#0B1329]/80 border border-white/10 p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md ${posConf.bg} ${posConf.text} border ${posConf.border}`}>
                    {posKey} • {secA.posName}
                  </span>
                  <span className="text-[10px] text-slate-400">{secA.count} jogadoras</span>
                </div>

                {/* Distância */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Distância:</span>
                    <span className="text-white font-black">{secA.avgDist}m vs {secB.avgDist}m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 rounded-full bg-[#1E2D57] overflow-hidden flex">
                      <div className="h-full bg-sky-400" style={{ width: `${Math.min(100, (secA.avgDist / 10000) * 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-black ${deltaDist.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {deltaDist.pct > 0 ? `+${deltaDist.pct}%` : `${deltaDist.pct}%`}
                    </span>
                  </div>
                </div>

                {/* Sprint >19 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-slate-400">Sprint &gt;19:</span>
                    <span className="text-emerald-400 font-black">{secA.avgSprint}m vs {secB.avgSprint}m</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 rounded-full bg-[#1E2D57] overflow-hidden flex">
                      <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (secA.avgSprint / 800) * 100)}%` }} />
                    </div>
                    <span className={`text-[10px] font-black ${deltaSprint.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {deltaSprint.pct > 0 ? `+${deltaSprint.pct}%` : `${deltaSprint.pct}%`}
                    </span>
                  </div>
                </div>

                {/* Ações ACC/DEC */}
                <div className="pt-1 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Cargas ACC/DEC:</span>
                  <span className="text-purple-300 font-bold">{secA.avgAcc + secA.avgDec} vs {secB.avgAcc + secB.avgDec}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: HEAD-TO-HEAD INDIVIDUAL ATHLETE COMPARISON */}
      <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4 text-brand-lime" />
              <span>3. Comparação Individual de Atleta (Head-to-Head Normalizado)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Inclui métricas relativas normalizadas por minuto (<span className="text-sky-300 font-bold">m/min</span>, <span className="text-emerald-300 font-bold">HSR/min</span> e <span className="text-purple-300 font-bold">ACC/min</span>) para comparação justa de tempo jogado.
            </p>
          </div>

          {isAthleteView ? (
            <div className="flex items-center space-x-2 rounded-xl bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 shadow-sm">
              <User className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-black text-emerald-300 uppercase">{selectedPlayerName}</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                🔒 O Teu Perfil
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold text-slate-300 whitespace-nowrap">Atleta:</span>
              <select
                value={selectedPlayerName}
                onChange={(e) => setSelectedPlayerName(e.target.value)}
                className="rounded-xl bg-slate-900 border border-sky-500/40 px-3 py-1.5 text-xs font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                {allPlayerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {playerA && playerB ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* JOGO A CARD */}
            <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-b from-[#1E2D57]/60 to-[#0B1329] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse"></span>
                  <span className="text-xs font-black uppercase text-sky-300">Jogo A — vs {matchA.opponent} ({matchA.matchDate})</span>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {playerA.pos}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Distância Total</span>
                  <p className="text-base font-black text-white">{playerA.dist.toLocaleString('pt-PT')} m</p>
                  <p className="text-[10px] font-bold text-sky-400">⚡ {normA?.mPerMin} m/min</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Alta Intensidade (&gt;19)</span>
                  <p className="text-base font-black text-emerald-400">{playerA.sprint.toFixed(1)} m</p>
                  <p className="text-[10px] font-bold text-emerald-300">⚡ {normA?.hsrPerMin} m/min</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Sprint (&gt;23 km/h)</span>
                  <p className="text-base font-black text-rose-400">{playerA.sprint23.toFixed(1)} m</p>
                  <p className="text-[10px] text-slate-400">Pico: {playerA.topSpeed.toFixed(2)} km/h</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ações ACC / DEC</span>
                  <p className="text-base font-black text-purple-300">{playerA.acc + playerA.dec}</p>
                  <p className="text-[10px] text-purple-400">⚡ {normA?.accPerMin} ações/min</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300">
                <span>Perceção de Esforço (PSE): <strong className="text-amber-400">{playerA.rpe || '—'}/10</strong></span>
                <span>Fadiga: <strong className="text-rose-400">{playerA.fatigue || '—'}/5</strong></span>
              </div>
            </div>

            {/* JOGO B CARD */}
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#2D241E]/40 to-[#0B1329] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                  <span className="text-xs font-black uppercase text-amber-300">Jogo B — vs {matchB.opponent} ({matchB.matchDate})</span>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {playerB.pos}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Distância Total</span>
                  <p className="text-base font-black text-white">{playerB.dist.toLocaleString('pt-PT')} m</p>
                  <p className="text-[10px] font-bold text-amber-400">⚡ {normB?.mPerMin} m/min</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Alta Intensidade (&gt;19)</span>
                  <p className="text-base font-black text-emerald-400">{playerB.sprint.toFixed(1)} m</p>
                  <p className="text-[10px] font-bold text-emerald-300">⚡ {normB?.hsrPerMin} m/min</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Sprint (&gt;23 km/h)</span>
                  <p className="text-base font-black text-rose-400">{playerB.sprint23.toFixed(1)} m</p>
                  <p className="text-[10px] text-slate-400">Pico: {playerB.topSpeed.toFixed(2)} km/h</p>
                </div>

                <div className="bg-[#0B1329]/80 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Ações ACC / DEC</span>
                  <p className="text-base font-black text-purple-300">{playerB.acc + playerB.dec}</p>
                  <p className="text-[10px] text-purple-400">⚡ {normB?.accPerMin} ações/min</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-900/60 border border-white/5 text-slate-300">
                <span>Perceção de Esforço (PSE): <strong className="text-amber-400">{playerB.rpe || '—'}/10</strong></span>
                <span>Fadiga: <strong className="text-rose-400">{playerB.fatigue || '—'}/5</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">Dados insuficientes para a atleta selecionada num dos jogos.</p>
        )}
      </section>

      {/* SECTION 4: INTERACTIVE DUAL-BAR SQUAD / ATHLETE COMPARISON CHART */}
      <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              <span>
                {isAthleteView ? `4. A Tua Evolução Individual (${selectedPlayerName})` : '4. Gráfico Comparativo do Plantel (Jogo A vs Jogo B)'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {isAthleteView
                ? 'Visualização da tua performance ao longo dos jogos em que estiveste em campo (Jogo A e Jogo B destacados)'
                : 'Visualização lado a lado de todas as atletas convocadas'}
            </p>
          </div>

          {/* METRIC SWITCHER */}
          <div className="flex flex-wrap gap-1 bg-[#0B1329]/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              type="button"
              onClick={() => setChartMetric('dist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                chartMetric === 'dist'
                  ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏃‍♀️ Distância (m)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('sprint')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                chartMetric === 'sprint'
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Sprint &gt;19km/h (m)
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('acc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                chartMetric === 'acc'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              💥 Ações ACC/DEC
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('rpe')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                chartMetric === 'rpe'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-400 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 PSE (1-10)
            </button>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex items-center justify-end space-x-4 text-xs font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-sm bg-sky-400"></span>
            <span className="text-sky-300">Jogo A: vs {matchA.opponent} ({matchA.matchDate})</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-400"></span>
            <span className="text-amber-300">Jogo B: vs {matchB.opponent} ({matchB.matchDate})</span>
          </div>
          {isAthleteView && (
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-sm bg-slate-600"></span>
              <span className="text-slate-400">Outros Jogos</span>
            </div>
          )}
        </div>

        {/* BARS CONTAINER */}
        <div className="w-full overflow-x-auto pb-2">
          {isAthleteView && athleteMatchBars ? (
            /* ATHLETE'S PERSONAL MATCH EVOLUTION BARS */
            <div className="flex items-end gap-4 h-64 min-w-[650px] px-4 pt-6 pb-2 border-b border-white/10">
              {athleteMatchBars.map((item) => {
                const pct = Math.min(100, Math.max(item.val > 0 ? 6 : 0, (item.val / maxAthleteVal) * 100));
                const barColor = item.isMatchA
                  ? 'bg-sky-400 shadow-sky-500/30'
                  : item.isMatchB
                  ? 'bg-amber-400 shadow-amber-500/30'
                  : 'bg-slate-600/80 hover:bg-slate-500';

                return (
                  <div
                    key={item.matchId}
                    onClick={() => {
                      if (!item.isMatchA && !item.isMatchB) {
                        setMatchAId(item.matchId);
                      }
                    }}
                    className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all"
                    title={`vs ${item.opponent} (${item.date}): ${item.val}`}
                  >
                    <div className="flex flex-col items-center w-full h-full justify-end pb-1">
                      {item.val > 0 && (
                        <span className={`text-[10px] font-black leading-none mb-1 whitespace-nowrap ${
                          item.isMatchA ? 'text-sky-300 font-extrabold' : item.isMatchB ? 'text-amber-300 font-extrabold' : 'text-slate-300'
                        }`}>
                          {chartMetric === 'dist' ? `${(item.val / 1000).toFixed(1)}k` : item.val.toFixed(0)}
                        </span>
                      )}
                      <div
                        className={`w-full max-w-[48px] rounded-t transition-all duration-300 shadow-md ${barColor}`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>

                    <span className={`text-[10px] font-bold mt-2 whitespace-nowrap transition-colors text-center ${
                      item.isMatchA ? 'text-sky-300 font-black' : item.isMatchB ? 'text-amber-300 font-black' : 'text-slate-400'
                    }`}>
                      {item.opponent.replace('Gil Vicente', 'GV').replace('Valadares Gaia FC', 'Valadares')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-medium">
                      {item.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* SQUAD COMPARISON BARS (ADMIN ONLY) */
            <div className="flex items-end gap-3 h-64 min-w-[850px] px-2 pt-6 pb-2 border-b border-white/10">
              {chartPlayers.map((item) => {
                const pctA = Math.min(100, Math.max(item.valA > 0 ? 6 : 0, (item.valA / maxChartVal) * 100));
                const pctB = Math.min(100, Math.max(item.valB > 0 ? 6 : 0, (item.valB / maxChartVal) * 100));
                const isSelected = item.name === selectedPlayerName;

                return (
                  <div
                    key={item.name}
                    onClick={() => setSelectedPlayerName(item.name)}
                    className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all ${
                      isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                    }`}
                    title={`${item.name} - Jogo A: ${item.valA} | Jogo B: ${item.valB}`}
                  >
                    <div className="flex items-end justify-center gap-1 w-full h-full pb-1">
                      {/* BAR A */}
                      <div className="flex flex-col items-center w-1/2 h-full justify-end">
                        {item.valA > 0 && (
                          <span className="text-[10px] font-black leading-none mb-1 whitespace-nowrap text-sky-400">
                            {chartMetric === 'dist' ? `${(item.valA / 1000).toFixed(1)}k` : item.valA.toFixed(0)}
                          </span>
                        )}
                        <div
                          className="w-full rounded-t transition-all duration-300 bg-sky-400 group-hover:bg-sky-300 shadow-md"
                          style={{ height: `${pctA}%` }}
                        />
                      </div>

                      {/* BAR B */}
                      <div className="flex flex-col items-center w-1/2 h-full justify-end">
                        {item.valB > 0 && (
                          <span className="text-[10px] font-black leading-none mb-1 whitespace-nowrap text-amber-400">
                            {chartMetric === 'dist' ? `${(item.valB / 1000).toFixed(1)}k` : item.valB.toFixed(0)}
                          </span>
                        )}
                        <div
                          className="w-full rounded-t transition-all duration-300 bg-amber-400 group-hover:bg-amber-300 shadow-md"
                          style={{ height: `${pctB}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold mt-2 whitespace-nowrap transition-colors ${
                        isSelected ? 'text-white font-black underline underline-offset-4 decoration-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
