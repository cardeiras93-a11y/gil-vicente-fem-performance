'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MatchPlayerGps, MatchInfo, getAllMatches, posColorClassMap,
  calculateTeamKpis, calculateSectorAverages, getAthleteParticipatedMatches, getDeltaPct
} from '@/data/matchRegistry';
import { MatchComparisonView } from './MatchComparisonView';
import { normalizeAthleteName, getCurrentClientRole, getActiveSessionAthlete } from '@/lib/matchAcl';
import {
  Trophy, Zap, Activity, Flame, Shield, ArrowUpDown, ChevronDown, ChevronUp,
  Table, LayoutGrid, ArrowLeft, Sparkles, Info, Heart, Scale,
  Lock, UserCheck, Eye, Compass, TrendingUp, TrendingDown, Target, Award
} from 'lucide-react';
import Link from 'next/link';

interface MatchDashboardProps {
  matchInfo?: MatchInfo;
  isStandalonePage?: boolean;
  onBack?: () => void;
  userRole?: 'admin' | 'coach' | 'athlete';
  athleteName?: string;
}

export const MatchDashboard: React.FC<MatchDashboardProps> = ({
  matchInfo: customMatch,
  isStandalonePage = false,
  onBack,
  userRole: propUserRole,
  athleteName: propAthleteName,
}) => {
  const allMatches = useMemo(() => getAllMatches(), []);

  // Determine initial role
  const initialRole = useMemo(() => {
    if (propUserRole) return propUserRole;
    return getCurrentClientRole();
  }, [propUserRole]);

  // Preview override for testing/coaches
  const [overrideRole, setOverrideRole] = useState<'admin' | 'athlete' | null>(null);
  const activeRole: 'admin' | 'coach' | 'athlete' = overrideRole || initialRole;
  const isAthlete = activeRole === 'athlete';

  // Determine active athlete name
  const effectiveAthleteName = useMemo(() => {
    if (propAthleteName) return normalizeAthleteName(propAthleteName);
    const session = getActiveSessionAthlete();
    if (session) return normalizeAthleteName(session.name);
    return 'Simães'; // default reference athlete
  }, [propAthleteName]);

  // All matches available for collective view
  const availableMatches = allMatches;

  const [selectedMatchId, setSelectedMatchId] = useState<string>(
    () => customMatch?.id || availableMatches[0]?.id || 'match_20260912_gvfc_romariz'
  );

  // Synchronize selected match if matches list changes
  useEffect(() => {
    if (!availableMatches.some((m) => m.id === selectedMatchId)) {
      if (availableMatches.length > 0) {
        setSelectedMatchId(availableMatches[0].id);
      }
    }
  }, [availableMatches, selectedMatchId]);

  const match = useMemo(
    () => availableMatches.find((m) => m.id === selectedMatchId) || customMatch || availableMatches[0] || allMatches[0],
    [availableMatches, selectedMatchId, customMatch, allMatches]
  );

  const rawPlayers = match.players;

  // Collective team KPIs & sector averages
  const teamKpis = useMemo(() => calculateTeamKpis(match), [match]);
  const sectorAverages = useMemo(() => calculateSectorAverages(match), [match]);

  // Find athlete in this match
  const athleteMatchPlayer = useMemo(() => {
    if (!effectiveAthleteName) return null;
    const target = normalizeAthleteName(effectiveAthleteName).toLowerCase();
    return rawPlayers.find((p) => normalizeAthleteName(p.name).toLowerCase() === target) || null;
  }, [effectiveAthleteName, rawPlayers]);

  const athletePlayerIndex = useMemo(() => {
    if (!effectiveAthleteName) return 0;
    const target = normalizeAthleteName(effectiveAthleteName).toLowerCase();
    const idx = rawPlayers.findIndex((p) => normalizeAthleteName(p.name).toLowerCase() === target);
    return idx >= 0 ? idx : 0;
  }, [effectiveAthleteName, rawPlayers]);

  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState<number>(0);

  // If in athlete view, keep index locked to the athlete
  useEffect(() => {
    if (isAthlete && athletePlayerIndex >= 0) {
      setSelectedPlayerIndex(athletePlayerIndex);
    }
  }, [isAthlete, athletePlayerIndex, selectedMatchId]);

  const [activePosFilter, setActivePosFilter] = useState<string>('ALL');
  const [currentChartMetric, setCurrentChartMetric] = useState<'dist' | 'sprint' | 'sprint23'>('dist');
  const [viewMode, setViewMode] = useState<'visual' | 'table' | 'compare'>('visual');
  const [tableSortKey, setTableSortKey] = useState<keyof MatchPlayerGps | 'totalAcc'>('dist');
  const [tableSortOrder, setTableSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const matchParam = params.get('match');
      const viewParam = params.get('view');
      if (matchParam && allMatches.some((m) => m.id === matchParam)) {
        setSelectedMatchId(matchParam);
      }
      if (viewParam === 'compare' || viewParam === 'table' || viewParam === 'visual') {
        setViewMode(viewParam);
      }
    }
  }, [allMatches]);

  const athleteParticipated = isAthlete ? (athleteMatchPlayer !== null && athleteMatchPlayer.dist > 0) : true;

  const selectedPlayer = isAthlete
    ? (athleteMatchPlayer || {
        name: effectiveAthleteName,
        fullName: effectiveAthleteName,
        pos: 'CAMPO',
        posName: 'Jogadora',
        dist: 0,
        sprint: 0,
        sprint23: 0,
        running: 0,
        topSpeed: 0,
        acc: 0,
        dec: 0,
        rpe: 0,
        fatigue: 0,
      } as MatchPlayerGps)
    : (rawPlayers[selectedPlayerIndex] || rawPlayers[0]);

  const maxDist = useMemo(() => Math.max(...rawPlayers.map((p) => p.dist), 1), [rawPlayers]);
  const maxSprint = useMemo(() => Math.max(...rawPlayers.map((p) => p.sprint), 1), [rawPlayers]);
  const maxSprint23 = useMemo(() => Math.max(...rawPlayers.map((p) => p.sprint23), 1), [rawPlayers]);
  const maxSpeed = useMemo(() => Math.max(...rawPlayers.map((p) => p.topSpeed), 1), [rawPlayers]);
  const maxAcc = useMemo(() => Math.max(...rawPlayers.map((p) => p.acc + p.dec), 1), [rawPlayers]);
  const avgSpeed = useMemo(() => (rawPlayers.length ? rawPlayers.reduce((a, b) => a + b.topSpeed, 0) / rawPlayers.length : 0), [rawPlayers]);

  // Filtered players for selector (Admin mode)
  const filteredPlayers = useMemo(() => {
    return rawPlayers
      .map((p, idx) => ({ ...p, globalIdx: idx }))
      .filter((p) => activePosFilter === 'ALL' || p.pos === activePosFilter);
  }, [rawPlayers, activePosFilter]);

  // Count by position
  const posCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rawPlayers.length, LAT: 0, DC: 0, MED: 0, EXT: 0, AV: 0 };
    rawPlayers.forEach((p) => {
      if (counts[p.pos] !== undefined) counts[p.pos]++;
    });
    return counts;
  }, [rawPlayers]);

  // Top 3 Podiums (Admin mode)
  const topSprint = useMemo(() => [...rawPlayers].sort((a, b) => b.sprint - a.sprint).slice(0, 3), [rawPlayers]);
  const topSpeed = useMemo(() => [...rawPlayers].sort((a, b) => b.topSpeed - a.topSpeed).slice(0, 3), [rawPlayers]);
  const topDistance = useMemo(() => [...rawPlayers].sort((a, b) => b.dist - a.dist).slice(0, 3), [rawPlayers]);

  // Sector avg for selected player
  const playerSectorAvg = sectorAverages[selectedPlayer.pos] || sectorAverages['DC'] || {
    pos: selectedPlayer.pos, posName: selectedPlayer.posName, count: 1,
    avgDist: teamKpis.avgDist, avgSprint: teamKpis.avgSprint, avgSprint23: teamKpis.avgSprint23,
    avgTopSpeed: teamKpis.maxTopSpeed, avgAcc: teamKpis.avgAcc, avgDec: teamKpis.avgDec, avgRpe: teamKpis.avgRpe
  };

  // Deltas for personal highlights
  const totalAcc = selectedPlayer.acc + selectedPlayer.dec;
  const sectorTotalAcc = playerSectorAvg.avgAcc + playerSectorAvg.avgDec;

  const deltaDistTeam = getDeltaPct(selectedPlayer.dist, teamKpis.avgDist);
  const deltaDistSector = getDeltaPct(selectedPlayer.dist, playerSectorAvg.avgDist);

  const deltaSprintTeam = getDeltaPct(selectedPlayer.sprint, teamKpis.avgSprint);
  const deltaSprintSector = getDeltaPct(selectedPlayer.sprint, playerSectorAvg.avgSprint);

  const deltaSpeedTeam = getDeltaPct(selectedPlayer.topSpeed, avgSpeed);
  const deltaSpeedSector = getDeltaPct(selectedPlayer.topSpeed, playerSectorAvg.avgTopSpeed);

  const deltaAccTeam = getDeltaPct(totalAcc, teamKpis.avgMechanicalLoad);
  const deltaAccSector = getDeltaPct(totalAcc, sectorTotalAcc);

  // Athlete's performance across all her matches (for Dual-Bar replacement in Athlete mode)
  const athleteMatchesEvolution = useMemo(() => {
    if (!isAthlete || !effectiveAthleteName) return [];
    const norm = effectiveAthleteName.trim().toLowerCase();
    const result: Array<{ match: MatchInfo; player: MatchPlayerGps; isCurrent: boolean }> = [];
    allMatches.forEach((m) => {
      const p = m.players.find((x) => normalizeAthleteName(x.name).toLowerCase() === norm && x.dist > 0);
      if (p) {
        result.push({ match: m, player: p, isCurrent: m.id === selectedMatchId });
      }
    });
    return result;
  }, [isAthlete, effectiveAthleteName, allMatches, selectedMatchId]);

  // Sort table players (Admin mode)
  const sortedTablePlayers = useMemo(() => {
    return [...rawPlayers].sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (tableSortKey === 'totalAcc') {
        valA = a.acc + a.dec;
        valB = b.acc + b.dec;
      } else {
        valA = (a[tableSortKey] as number) || 0;
        valB = (b[tableSortKey] as number) || 0;
      }

      return tableSortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [rawPlayers, tableSortKey, tableSortOrder]);

  const handleSortTable = (key: keyof MatchPlayerGps | 'totalAcc') => {
    if (tableSortKey === key) {
      setTableSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setTableSortKey(key);
      setTableSortOrder('desc');
    }
  };

  const compLabel = match.comparisonLabel || 'Jogo Anterior';
  const playedPreviousMatch = Boolean(selectedPlayer.prevDist && selectedPlayer.prevDist > 0);
  const prevDistTxt = playedPreviousMatch ? ` (${compLabel}: ${selectedPlayer.prevDist!.toLocaleString('pt-PT')} m)` : '';
  let sprintEvoTxt = '';
  if (playedPreviousMatch && selectedPlayer.prevSprint) {
    const sprintDiff = selectedPlayer.sprint - selectedPlayer.prevSprint;
    sprintEvoTxt = sprintDiff >= 0 ? ` (+${sprintDiff.toFixed(1)}m ${compLabel} 🚀)` : ` (${sprintDiff.toFixed(1)}m ${compLabel})`;
  }
  const sprint23EvoTxt = playedPreviousMatch && selectedPlayer.prevSprint23 ? ` (${compLabel}: ${selectedPlayer.prevSprint23} m)` : '';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 text-slate-100 animate-fade-in pb-12">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </button>
          ) : isStandalonePage ? (
            <Link
              href="/"
              className="flex items-center space-x-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Início</span>
            </Link>
          ) : null}

          {/* Match selector dropdown */}
          <div className="flex items-center space-x-1.5 rounded-xl bg-slate-900/90 px-2.5 py-1.5 border border-sky-500/40 shadow-sm">
            <span className="text-[11px] font-black text-sky-400">⚽ Jogo:</span>
            <select
              value={selectedMatchId}
              onChange={(e) => {
                setSelectedMatchId(e.target.value);
                if (!isAthlete) setSelectedPlayerIndex(0);
              }}
              className="bg-transparent text-xs font-black text-white focus:outline-none cursor-pointer pr-1 max-w-[200px] sm:max-w-[280px] truncate"
            >
              {availableMatches.map((m) => {
                const athletePlayed = isAthlete && effectiveAthleteName
                  ? m.players.some((p) => normalizeAthleteName(p.name).toLowerCase() === effectiveAthleteName.trim().toLowerCase() && p.dist > 0)
                  : true;
                return (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white font-bold">
                    {m.matchDate} — vs {m.opponent} {m.score ? `(${m.score})` : ''} {isAthlete ? (athletePlayed ? '✓ (Jogaste)' : '• (Coletivo)') : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center space-x-1 rounded-xl bg-slate-900/80 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'visual'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              <span>{isAthlete ? 'O Teu Desempenho' : 'Tabela GPS'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('compare')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'compare'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scale className="h-3.5 w-3.5 text-amber-300" />
              <span>Comparar Jogos</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Role Preview Switcher (Staff / Coach testing helper) */}
          <button
            type="button"
            onClick={() => setOverrideRole(isAthlete ? 'admin' : 'athlete')}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
              isAthlete
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
            }`}
            title="Alternar entre visualização de atleta privada e visualização irrestrita de equipa técnica"
          >
            {isAthlete ? <Lock className="h-3.5 w-3.5 text-emerald-400" /> : <Eye className="h-3.5 w-3.5 text-indigo-400" />}
            <span className="hidden sm:inline">{isAthlete ? `Modo Atleta (${effectiveAthleteName})` : 'Modo Equipa Técnica'}</span>
            <span className="sm:hidden">{isAthlete ? 'Atleta' : 'Staff'}</span>
          </button>
        </div>
      </div>

      {viewMode === 'compare' ? (
        <MatchComparisonView
          matches={availableMatches}
          initialMatchAId={selectedMatchId}
          isAthleteView={isAthlete}
          lockedPlayerName={effectiveAthleteName}
          onBack={() => setViewMode('visual')}
        />
      ) : (
        <>
          {/* HERO HEADER */}
          <header className="rounded-2xl border border-sky-500/30 bg-gradient-to-r from-slate-900 via-[#152244] to-[#0B1329] p-5 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 border-2 border-red-400/40 p-1 flex items-center justify-center shadow-lg shadow-red-950/50 shrink-0">
                <span className="text-xl font-black text-white tracking-tighter">GVFC</span>
              </div>

              <div className="space-y-0.5">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{match.title}</span>
                </h1>
                <p className="text-xs sm:text-sm font-bold text-sky-400">
                  {match.subtitle} • vs <strong className="text-white">{match.opponent}</strong> ({match.teamCategory})
                  {match.score ? ` • Resultado: ${match.score}` : ''}
                </p>
                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                  {match.weather && <span>Condições: {match.weather}</span>}
                  {match.location && <span>• {match.location}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
              <div className="rounded-full bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-1 text-xs font-black text-emerald-300 shadow-sm uppercase tracking-wide">
                {match.monitoredCount} Jogadoras Monitorizadas
              </div>
              {isAthlete ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Perfil Privado ({effectiveAthleteName})
                </span>
              ) : (
                <span className="text-[10px] font-bold text-sky-400 flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Visão Geral Coletiva (Equipa Técnica)
                </span>
              )}
            </div>
          </header>

          {/* VISÃO COLETIVA DO JOGO: MÉDIAS GLOBAIS E BENCHMARKS POSICIONAIS */}
          <section className="rounded-2xl border border-white/10 bg-[#152244]/90 p-4 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center space-x-2">
                <Compass className="h-4 w-4 text-sky-400" />
                <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-wider">
                  Médias Coletivas da Equipa — Jogo vs {match.opponent}
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                {teamKpis.activePlayers} atletas em campo
              </span>
            </div>

            {/* Collective Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Distância Média</span>
                <span className="text-sm sm:text-base font-black text-white mt-1">
                  {(teamKpis.avgDist / 1000).toFixed(2)} km
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">{teamKpis.avgDist.toLocaleString('pt-PT')} m</span>
              </div>

              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">% Corrida (&gt;7km/h)</span>
                <span className="text-sm sm:text-base font-black text-sky-400 mt-1">
                  {teamKpis.runningPct.toFixed(1)}%
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">{(teamKpis.avgRunning / 1000).toFixed(2)} km ritmado</span>
              </div>

              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Alta Intens. (&gt;19)</span>
                <span className="text-sm sm:text-base font-black text-emerald-400 mt-1">
                  {teamKpis.avgSprint} m
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">Média por atleta</span>
              </div>

              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sprint (&gt;23km/h)</span>
                <span className="text-sm sm:text-base font-black text-rose-400 mt-1">
                  {teamKpis.avgSprint23} m
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">Pico coletivo</span>
              </div>

              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Carga Mecânica</span>
                <span className="text-sm sm:text-base font-black text-purple-300 mt-1">
                  {teamKpis.avgMechanicalLoad}
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">{teamKpis.avgAcc} ACC + {teamKpis.avgDec} DEC</span>
              </div>

              <div className="rounded-xl bg-[#0B1329]/80 border border-white/5 p-3 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">PSE / RPE Médio</span>
                <span className="text-sm sm:text-base font-black text-amber-300 mt-1">
                  {teamKpis.avgRpe} / 10
                </span>
                <span className="text-[9px] text-slate-400 font-semibold">Carga percecionada</span>
              </div>
            </div>

            {/* Benchmarks Posicionais por Setor */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1 mb-2">
                <Target className="h-3 w-3 text-sky-400" />
                <span>Benchmarks Posicionais da Equipa no Jogo</span>
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {(['LAT', 'DC', 'MED', 'EXT', 'AV'] as const).map((posKey) => {
                  const sec = sectorAverages[posKey];
                  const posConf = posColorClassMap[posKey] || { badge: posKey, text: 'text-slate-300', bg: 'bg-slate-700', border: 'border-slate-600' };
                  const isPlayerPos = selectedPlayer.pos === posKey;

                  return (
                    <div
                      key={posKey}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isPlayerPos
                          ? 'bg-sky-500/10 border-sky-400/50 shadow-md shadow-sky-500/10'
                          : 'bg-[#0B1329]/60 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-black px-1.5 py-0.2 rounded ${posConf.bg} ${posConf.text} border ${posConf.border}`}>
                          {posKey}
                        </span>
                        {isPlayerPos && (
                          <span className="text-[9px] font-black text-amber-300 uppercase">O Teu Setor</span>
                        )}
                        <span className="text-[9px] text-slate-400 font-bold">{sec.count} atl.</span>
                      </div>

                      <div className="space-y-0.5 mt-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">Dist:</span>
                          <span className="text-white font-extrabold">{sec.avgDist.toLocaleString('pt-PT')}m</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">&gt;19km:</span>
                          <span className="text-emerald-400 font-extrabold">{sec.avgSprint}m</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="text-slate-400">ACC/DEC:</span>
                          <span className="text-purple-300 font-extrabold">{sec.avgAcc + sec.avgDec}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* PLAYER SELECTOR: PRIVATE LOCK BANNER (Athlete) VS PILLS GRID (Admin) */}
          {viewMode === 'visual' && (
            isAthlete ? (
              <section className="rounded-2xl border border-sky-500/40 bg-gradient-to-r from-sky-950/60 via-[#152244] to-[#0B1329] p-4 shadow-xl space-y-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-11 w-11 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-xl shadow-lg shadow-sky-500/20 shrink-0">
                      🏃‍♀️
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-base font-black text-white">{selectedPlayer.name}</h2>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          posColorClassMap[selectedPlayer.pos]?.bg || 'bg-slate-700'
                        } ${posColorClassMap[selectedPlayer.pos]?.text || 'text-white'} border ${
                          posColorClassMap[selectedPlayer.pos]?.border || 'border-slate-600'
                        }`}>
                          {selectedPlayer.pos} • {selectedPlayer.posName}
                        </span>
                        <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" />
                          Privacidade Protegida
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        {selectedPlayer.fullName && selectedPlayer.fullName !== selectedPlayer.name
                          ? `${selectedPlayer.fullName} — `
                          : ''}
                        A tua sessão individual está bloqueada aos teus dados e às médias da equipa.
                      </p>
                    </div>
                  </div>

                  {!athleteParticipated && (
                    <div className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-200">
                      Sem dados de GPS registados para esta partida. Seleciona outro jogo acima.
                    </div>
                  )}
                </div>
              </section>
            ) : (
              /* ADMIN: COMPACT PLAYER SELECTOR WITH ALL PILLS */
              <section className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/5 pb-2.5">
                  <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>👆 Seleciona a Carta de Jogadora (Visão Técnica)</span>
                  </span>

                  {/* Position Filter Tabs */}
                  <div className="flex flex-wrap gap-1 bg-[#0B1329]/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                    {(['ALL', 'LAT', 'DC', 'MED', 'EXT', 'AV'] as const).map((posKey) => (
                      <button
                        key={posKey}
                        type="button"
                        onClick={() => setActivePosFilter(posKey)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all ${
                          activePosFilter === posKey
                            ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white shadow-md'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {posKey === 'ALL' ? `TODAS (${posCounts.ALL})` : `${posKey} (${posCounts[posKey] || 0})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Pills Grid */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {filteredPlayers.map((p) => {
                    const isSelected = p.globalIdx === selectedPlayerIndex;
                    const posConf = posColorClassMap[p.pos] || { badge: p.pos, text: 'text-slate-300', bg: 'bg-slate-700', border: 'border-slate-600' };

                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedPlayerIndex(p.globalIdx)}
                        className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white border-sky-400 shadow-md shadow-sky-500/20 scale-102'
                            : 'bg-[#1E2D57]/70 text-slate-300 border border-white/10 hover:bg-[#1E2D57] hover:text-white'
                        }`}
                      >
                        <span>{p.name}</span>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${posConf.bg} ${posConf.text} border ${posConf.border}`}>
                          {p.pos}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )
          )}

          {/* ULTIMATE PLAYER CARD & COMPARATIVE BARS DISPLAY */}
          {viewMode === 'visual' && (
            isAthlete && !athleteParticipated ? (
              <section className="rounded-2xl border border-amber-500/30 bg-[#152244] p-8 text-center space-y-3 shadow-xl">
                <div className="h-14 w-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl text-amber-400">
                  ⚽
                </div>
                <h3 className="text-base font-black text-white">Sem Registo Individual neste Jogo</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  A jogadora <span className="text-amber-300 font-bold">{effectiveAthleteName}</span> não foi utilizada ou não tem métricas de GPS registadas na partida contra <span className="text-white font-bold">{match.opponent}</span> ({match.matchDate}).
                </p>
                <p className="text-xs text-slate-400">
                  Podes consultar acima as <strong className="text-sky-400">Médias Coletivas da Equipa</strong> deste jogo, ou selecionar no menu de jogos uma partida em que tenhas participado.
                </p>
              </section>
            ) : (
              <section className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* FIFA Style Ultimate Card */}
                <div className="md:col-span-5 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-b from-[#1E293B] via-[#152244] to-[#0F172A] p-5 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center justify-between space-y-3 relative overflow-hidden">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-sky-400 via-emerald-400 to-amber-300 border-4 border-white flex items-center justify-center text-3xl shadow-xl">
                    🏃‍♀️
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-white">{selectedPlayer.name}</h2>
                    <p className="text-xs font-semibold text-slate-400">
                      {selectedPlayer.fullName && selectedPlayer.fullName !== selectedPlayer.name
                        ? `${selectedPlayer.fullName} (${selectedPlayer.posName})`
                        : selectedPlayer.posName}
                    </p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 bg-[#0B1329]/80 p-3 rounded-xl border border-white/10">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Distância</span>
                      <span className="text-sm sm:text-base font-black text-white">{(selectedPlayer.dist / 1000).toFixed(2)} km</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Alta Intens. (&gt;19)</span>
                      <span className="text-sm sm:text-base font-black text-emerald-400">{selectedPlayer.sprint.toFixed(1)} m</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Vel. Máxima</span>
                      <span className="text-sm sm:text-base font-black text-amber-300">{selectedPlayer.topSpeed.toFixed(1)} km/h</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400">Ações ACC/DEC</span>
                      <span className="text-sm sm:text-base font-black text-purple-300">{totalAcc}</span>
                    </div>
                  </div>
                </div>

                {/* Player Details & Comparative Bars Card */}
                <div className="md:col-span-7 rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="border-b border-white/10 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      {isAthlete ? 'O Teu Rendimento Físico no Jogo' : 'Análise de Rendimento Individual'}
                    </span>
                    <span className="text-xs font-bold text-sky-400">
                      {selectedPlayer.prevSprint && selectedPlayer.sprint > selectedPlayer.prevSprint ? (
                        <span className="text-emerald-400">
                          +{(selectedPlayer.sprint - selectedPlayer.prevSprint).toFixed(1)}m em Alta Intensidade vs Jogo Anterior! ⚡
                        </span>
                      ) : (
                        'Excelente Consistência Tática 💪'
                      )}
                    </span>
                  </div>

                  {/* Visual Progress Bars */}
                  <div className="space-y-3.5">
                    {/* Distancia Total */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">🏃‍♀️ Distância Total Percorrida</span>
                        <span className="text-white font-black">
                          {selectedPlayer.dist.toLocaleString('pt-PT')} m{prevDistTxt}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#1E2D57] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(8, (selectedPlayer.dist / maxDist) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Sprint >19 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">⚡ Alta Intensidade (&gt;19 km/h)</span>
                        <span className="text-emerald-400 font-black">
                          {selectedPlayer.sprint} m{sprintEvoTxt}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#1E2D57] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(5, (selectedPlayer.sprint / maxSprint) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Sprint >23 */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">🔥 Sprint Puro (&gt;23 km/h)</span>
                        <span className="text-rose-400 font-black">
                          {selectedPlayer.sprint23} m{sprint23EvoTxt}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#1E2D57] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-500"
                          style={{ width: `${maxSprint23 > 0 ? (selectedPlayer.sprint23 / maxSprint23) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Top Speed */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">🚀 Velocidade Máxima</span>
                        <span className="text-amber-400 font-black">
                          {selectedPlayer.topSpeed.toFixed(2)} km/h (Média: {avgSpeed.toFixed(2)} km/h)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#1E2D57] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, ((selectedPlayer.topSpeed - 18) / (maxSpeed - 18)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* Acoes ACC + DEC */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-400">💥 Ações de Alta Intensidade (ACC + DEC &gt;3m/s²)</span>
                        <span className="text-purple-400 font-black">
                          {totalAcc} ações ({selectedPlayer.acc} ACC + {selectedPlayer.dec} DEC)
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-[#1E2D57] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(10, (totalAcc / maxAcc) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          )}

          {/* PODIUMS (ADMIN) OR PERSONAL HIGHLIGHTS CARD (ATHLETE) */}
          {isAthlete ? (
            athleteParticipated ? (
              /* ATHLETE: PERSONAL HIGHLIGHTS BENCHMARKED AGAINST SQUAD & SECTOR */
            <div className="pt-2 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>O Teu Desempenho & Destaques de Jogo ({match.matchDate})</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">
                  Comparado com Médias Coletivas da Equipa & Setor [{selectedPlayer.pos}]
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Distância */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🏃‍♀️</span>
                      <h4 className="text-xs font-black uppercase text-slate-200">Distância Total</h4>
                    </div>
                    <span className="text-sm font-black text-sky-400">{(selectedPlayer.dist / 1000).toFixed(2)} km</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Média Equipa:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaDistTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaDistTeam.isPositive ? `+${deltaDistTeam.pct}%` : `${deltaDistTeam.pct}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Setor [{selectedPlayer.pos}]:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaDistSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaDistSector.isPositive ? `+${deltaDistSector.pct}%` : `${deltaDistSector.pct}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alta Intensidade */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚡</span>
                      <h4 className="text-xs font-black uppercase text-slate-200">&gt;19 km/h (Sprint)</h4>
                    </div>
                    <span className="text-sm font-black text-emerald-400">{selectedPlayer.sprint.toFixed(1)} m</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Média Equipa:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaSprintTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaSprintTeam.isPositive ? `+${deltaSprintTeam.pct}%` : `${deltaSprintTeam.pct}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Setor [{selectedPlayer.pos}]:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaSprintSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaSprintSector.isPositive ? `+${deltaSprintSector.pct}%` : `${deltaSprintSector.pct}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Velocidade de Pico */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🚀</span>
                      <h4 className="text-xs font-black uppercase text-slate-200">Velocidade Máx.</h4>
                    </div>
                    <span className="text-sm font-black text-amber-400">{selectedPlayer.topSpeed.toFixed(2)} km/h</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Média Equipa:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaSpeedTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaSpeedTeam.isPositive ? `+${deltaSpeedTeam.pct}%` : `${deltaSpeedTeam.pct}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Setor [{selectedPlayer.pos}]:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaSpeedSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaSpeedSector.isPositive ? `+${deltaSpeedSector.pct}%` : `${deltaSpeedSector.pct}%`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações Mecânicas */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">💥</span>
                      <h4 className="text-xs font-black uppercase text-slate-200">Carga ACC/DEC</h4>
                    </div>
                    <span className="text-sm font-black text-purple-300">{totalAcc} ações</span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Média Equipa:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaAccTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaAccTeam.isPositive ? `+${deltaAccTeam.pct}%` : `${deltaAccTeam.pct}%`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">vs Setor [{selectedPlayer.pos}]:</span>
                      <span className={`font-black px-1.5 py-0.5 rounded text-[10px] ${
                        deltaAccSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {deltaAccSector.isPositive ? `+${deltaAccSector.pct}%` : `${deltaAccSector.pct}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null) : (
            /* ADMIN: TOP 3 INDIVIDUAL PODIUMS */
            <div className="pt-2">
              <h3 className="text-sm font-black uppercase text-sky-400 tracking-wider flex items-center gap-1.5 mb-3">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>TOP MÉTRICAS DE JOGO (TOP 3 INDIVIDUAL)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Top Alta Intensidade */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-3">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                    <span className="text-lg">⚡</span>
                    <h4 className="text-xs font-black uppercase text-slate-200">Alta Intensidade (&gt;19km/h)</h4>
                  </div>
                  <div className="space-y-2">
                    {topSprint.map((p, idx) => (
                      <div
                        key={p.name}
                        onClick={() => setSelectedPlayerIndex(rawPlayers.findIndex((x) => x.name === p.name))}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0B1329]/60 border border-white/5 cursor-pointer hover:bg-[#1E2D57] transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black text-slate-950 ${
                            idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}º
                          </span>
                          <span className="text-xs font-extrabold text-white">{p.name} ({p.pos})</span>
                        </div>
                        <span className="text-xs font-black text-emerald-400">{p.sprint.toFixed(1)} m</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Velocidade */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-3">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                    <span className="text-lg">🚀</span>
                    <h4 className="text-xs font-black uppercase text-slate-200">Top-Velocidade no Jogo</h4>
                  </div>
                  <div className="space-y-2">
                    {topSpeed.map((p, idx) => (
                      <div
                        key={p.name}
                        onClick={() => setSelectedPlayerIndex(rawPlayers.findIndex((x) => x.name === p.name))}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0B1329]/60 border border-white/5 cursor-pointer hover:bg-[#1E2D57] transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black text-slate-950 ${
                            idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}º
                          </span>
                          <span className="text-xs font-extrabold text-white">{p.name} ({p.pos})</span>
                        </div>
                        <span className="text-xs font-black text-amber-400">{p.topSpeed.toFixed(2)} km/h</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Distancia */}
                <div className="rounded-2xl border border-white/10 bg-[#152244] p-4 shadow-xl space-y-3">
                  <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                    <span className="text-lg">🏃‍♀️</span>
                    <h4 className="text-xs font-black uppercase text-slate-200">Top-Distância de Jogo</h4>
                  </div>
                  <div className="space-y-2">
                    {topDistance.map((p, idx) => (
                      <div
                        key={p.name}
                        onClick={() => setSelectedPlayerIndex(rawPlayers.findIndex((x) => x.name === p.name))}
                        className="flex items-center justify-between p-2 rounded-xl bg-[#0B1329]/60 border border-white/5 cursor-pointer hover:bg-[#1E2D57] transition-all"
                      >
                        <div className="flex items-center space-x-2">
                          <span className={`h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-black text-slate-950 ${
                            idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-300' : 'bg-amber-700 text-white'
                          }`}>
                            {idx + 1}º
                          </span>
                          <span className="text-xs font-extrabold text-white">{p.name} ({p.pos})</span>
                        </div>
                        <span className="text-xs font-black text-sky-400">{p.dist.toLocaleString('pt-PT')} m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DUAL-BAR EVOLUTION CHART */}
          <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex flex-wrap gap-1 bg-[#0B1329]/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrentChartMetric('dist')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    currentChartMetric === 'dist'
                      ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🏃‍♀️ Distância (m)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentChartMetric('sprint')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    currentChartMetric === 'sprint'
                      ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ⚡ Alta Intensidade &gt;19km/h (m)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentChartMetric('sprint23')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                    currentChartMetric === 'sprint23'
                      ? 'bg-gradient-to-r from-sky-600 to-sky-400 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🔥 Sprint &gt;23km/h (m)
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs font-bold">
                {isAthlete ? (
                  <span className="text-xs text-sky-400 font-bold flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5" />
                    <span>A tua evolução individual nos jogos realizados</span>
                  </span>
                ) : (
                  <>
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-sky-400" />
                      <span className="text-sky-300">Jogo ({match.matchDate})</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm bg-slate-500 border border-dashed border-slate-300" />
                      <span className="text-slate-400">{match.comparisonLabel}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Bars View */}
            {isAthlete ? (
              /* ATHLETE: HER EVOLUTION ACROSS MATCHES */
              <div className="space-y-3">
                <div className="w-full overflow-x-auto pb-2">
                  <div className="flex items-end gap-4 h-64 min-w-[500px] px-4 pt-6 pb-2 border-b border-white/10">
                    {athleteMatchesEvolution.map(({ match: m, player: p, isCurrent }) => {
                      let val = currentChartMetric === 'dist' ? p.dist : currentChartMetric === 'sprint' ? p.sprint : p.sprint23;
                      let max = currentChartMetric === 'dist' ? 12000 : currentChartMetric === 'sprint' ? 600 : 250;
                      let heightPct = Math.min(100, Math.max(8, (val / max) * 100));

                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMatchId(m.id)}
                          className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all ${
                            isCurrent ? 'scale-105' : 'opacity-85 hover:opacity-100'
                          }`}
                        >
                          <span className={`text-[11px] font-black leading-none mb-1.5 ${
                            isCurrent ? 'text-amber-300 font-extrabold' : 'text-sky-400'
                          }`}>
                            {currentChartMetric === 'dist' ? `${(val / 1000).toFixed(2)}k` : `${Math.round(val)}m`}
                          </span>

                          <div
                            className={`w-full max-w-[64px] rounded-t-lg transition-all duration-300 ${
                              isCurrent
                                ? 'bg-gradient-to-t from-amber-500 to-amber-300 shadow-lg shadow-amber-400/30'
                                : 'bg-gradient-to-t from-sky-600 to-sky-400 group-hover:from-sky-500 group-hover:to-sky-300'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />

                          <div className="text-center mt-2">
                            <span className={`text-xs font-black block whitespace-nowrap ${
                              isCurrent ? 'text-white' : 'text-slate-300'
                            }`}>
                              vs {m.opponent}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold block">
                              {m.matchDate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 bg-[#0B1329]/60 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-amber-400" />
                    <span className="text-white font-bold">Jogo Selecionado ({match.opponent})</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>Média Setor [{selectedPlayer.pos}]: <strong className="text-emerald-400">
                      {currentChartMetric === 'dist' ? `${(playerSectorAvg.avgDist / 1000).toFixed(2)}k` : `${playerSectorAvg.avgSprint}m`}
                    </strong></span>
                    <span>Média Equipa: <strong className="text-sky-400">
                      {currentChartMetric === 'dist' ? `${(teamKpis.avgDist / 1000).toFixed(2)}k` : `${teamKpis.avgSprint}m`}
                    </strong></span>
                  </div>
                </div>
              </div>
            ) : (
              /* ADMIN: SQUAD BARS CHART ACROSS ALL 19 PLAYERS */
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex items-end gap-3 h-64 min-w-[850px] px-2 pt-6 pb-2 border-b border-white/10">
                  {rawPlayers.map((p, idx) => {
                    const isSelected = idx === selectedPlayerIndex;

                    let valCurrent = 0;
                    let valPrev = 0;
                    let maxVal = 1;

                    if (currentChartMetric === 'dist') {
                      valCurrent = p.dist;
                      valPrev = p.prevDist || 0;
                      maxVal = maxDist;
                    } else if (currentChartMetric === 'sprint') {
                      valCurrent = p.sprint;
                      valPrev = p.prevSprint || 0;
                      maxVal = maxSprint;
                    } else {
                      valCurrent = p.sprint23;
                      valPrev = p.prevSprint23 || 0;
                      maxVal = maxSprint23 || 1;
                    }

                    const pctCurrent = Math.min(100, Math.max(6, (valCurrent / maxVal) * 100));
                    const pctPrev = Math.min(100, Math.max(0, (valPrev / maxVal) * 100));

                    let tagCurrent = '';
                    let tagPrev = '';
                    if (currentChartMetric === 'dist') {
                      tagCurrent = `${(valCurrent / 1000).toFixed(1)}k`;
                      tagPrev = valPrev > 0 ? `${(valPrev / 1000).toFixed(1)}k` : '';
                    } else {
                      tagCurrent = valCurrent > 0 ? `${Math.round(valCurrent)}m` : '0m';
                      tagPrev = valPrev > 0 ? `${Math.round(valPrev)}m` : '';
                    }

                    return (
                      <div
                        key={p.name}
                        onClick={() => setSelectedPlayerIndex(idx)}
                        className={`flex-1 flex flex-col items-center justify-end h-full cursor-pointer group transition-all ${
                          isSelected ? 'scale-105' : 'opacity-85 hover:opacity-100'
                        }`}
                        title={`${p.name} - Atual: ${valCurrent}m | Anterior: ${valPrev}m`}
                      >
                        <div className="flex items-end justify-center gap-1 w-full h-full pb-1">
                          <div className="flex flex-col items-center w-1/2 h-full justify-end">
                            <span className={`text-[10px] font-black leading-none mb-1 whitespace-nowrap ${
                              isSelected ? 'text-amber-300 font-extrabold' : 'text-sky-400'
                            }`}>
                              {tagCurrent}
                            </span>
                            <div
                              className={`w-full rounded-t transition-all duration-300 ${
                                isSelected ? 'bg-amber-400 shadow-lg shadow-amber-400/30' : 'bg-sky-400 group-hover:bg-sky-300'
                              }`}
                              style={{ height: `${pctCurrent}%` }}
                            />
                          </div>

                          <div className="flex flex-col items-center w-1/2 h-full justify-end">
                            <span className="text-[10px] font-bold text-slate-400 leading-none mb-1 whitespace-nowrap">
                              {tagPrev}
                            </span>
                            <div
                              className="w-full rounded-t bg-slate-600/50 border-t border-x border-dashed border-slate-400 transition-all duration-300"
                              style={{ height: `${pctPrev}%` }}
                            />
                          </div>
                        </div>

                        <span className={`text-[11px] font-bold mt-2 whitespace-nowrap transition-colors ${
                          isSelected ? 'text-white font-black' : 'text-slate-400 group-hover:text-slate-200'
                        }`}>
                          {p.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* TABLE SECTION: ATHLETE (BENCHMARKED TABLE) VS ADMIN (FULL SQUAD TABLE) */}
          {viewMode === 'table' && (
            isAthlete ? (
              !athleteParticipated ? (
                <section className="rounded-2xl border border-amber-500/30 bg-[#152244] p-8 text-center space-y-3 shadow-xl">
                  <div className="h-12 w-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400">
                    📋
                  </div>
                  <h3 className="text-base font-black text-white">Sem Dados na Tabela Individual</h3>
                  <p className="text-xs text-slate-300 max-w-md mx-auto">
                    Não foram recolhidos dados individuais para <span className="text-amber-300 font-bold">{effectiveAthleteName}</span> na partida contra <span className="text-white font-bold">{match.opponent}</span> ({match.matchDate}).
                  </p>
                  <p className="text-xs text-slate-400">
                    Podes consultar as <strong className="text-sky-400">Médias Coletivas da Equipa</strong> acima.
                  </p>
                </section>
              ) : (
                /* ATHLETE: BENCHMARKED PERSONAL REPORT TABLE */
                <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Table className="h-4 w-4 text-sky-400" />
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">
                      O Teu Relatório de Rendimento vs Benchmarks Coletivos
                    </h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    <Shield className="h-3 w-3" />
                    Privacidade Ativa: Sem dados individuais das colegas
                  </span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                        <th className="py-3 px-3">Métrica de Rendimento</th>
                        <th className="py-3 px-3 text-right text-amber-300 font-black">O Teu Valor ({selectedPlayer.name})</th>
                        <th className="py-3 px-3 text-right">Média Setor ({selectedPlayer.pos})</th>
                        <th className="py-3 px-3 text-right">Média da Equipa</th>
                        <th className="py-3 px-3 text-center">vs Setor</th>
                        <th className="py-3 px-3 text-center">vs Equipa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {/* Row 1: Distância Total */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>🏃‍♀️ Distância Total Percorrida</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-300 text-sm">
                          {selectedPlayer.dist.toLocaleString('pt-PT')} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {playerSectorAvg.avgDist.toLocaleString('pt-PT')} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {teamKpis.avgDist.toLocaleString('pt-PT')} m
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaDistSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaDistSector.isPositive ? `+${deltaDistSector.pct}%` : `${deltaDistSector.pct}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaDistTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaDistTeam.isPositive ? `+${deltaDistTeam.pct}%` : `${deltaDistTeam.pct}%`}
                          </span>
                        </td>
                      </tr>

                      {/* Row 2: Alta Intensidade >19km/h */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>⚡ Alta Intensidade (&gt;19 km/h)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-400 text-sm">
                          {selectedPlayer.sprint.toFixed(1)} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {playerSectorAvg.avgSprint} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {teamKpis.avgSprint} m
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaSprintSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaSprintSector.isPositive ? `+${deltaSprintSector.pct}%` : `${deltaSprintSector.pct}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaSprintTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaSprintTeam.isPositive ? `+${deltaSprintTeam.pct}%` : `${deltaSprintTeam.pct}%`}
                          </span>
                        </td>
                      </tr>

                      {/* Row 3: Sprint >23km/h */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>🔥 Sprint Puro (&gt;23 km/h)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-rose-400 text-sm">
                          {selectedPlayer.sprint23.toFixed(1)} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {playerSectorAvg.avgSprint23} m
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {teamKpis.avgSprint23} m
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300">
                            {selectedPlayer.sprint23 >= playerSectorAvg.avgSprint23 ? '▲ Acima' : '▼ Abaixo'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-800 text-slate-300">
                            {selectedPlayer.sprint23 >= teamKpis.avgSprint23 ? '▲ Acima' : '▼ Abaixo'}
                          </span>
                        </td>
                      </tr>

                      {/* Row 4: Velocidade Máxima */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>🚀 Velocidade Máxima Atingida</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-400 text-sm">
                          {selectedPlayer.topSpeed.toFixed(2)} km/h
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {playerSectorAvg.avgTopSpeed.toFixed(2)} km/h
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {avgSpeed.toFixed(2)} km/h
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaSpeedSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaSpeedSector.isPositive ? `+${deltaSpeedSector.pct}%` : `${deltaSpeedSector.pct}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaSpeedTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaSpeedTeam.isPositive ? `+${deltaSpeedTeam.pct}%` : `${deltaSpeedTeam.pct}%`}
                          </span>
                        </td>
                      </tr>

                      {/* Row 5: Ações ACC + DEC */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>💥 Carga Mecânica (ACC + DEC &gt;3m/s²)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-purple-300 text-sm">
                          {totalAcc} <span className="text-[10px] text-slate-400 font-normal">({selectedPlayer.acc}/{selectedPlayer.dec})</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {sectorTotalAcc}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {teamKpis.avgMechanicalLoad}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaAccSector.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaAccSector.isPositive ? `+${deltaAccSector.pct}%` : `${deltaAccSector.pct}%`}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            deltaAccTeam.isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {deltaAccTeam.isPositive ? `+${deltaAccTeam.pct}%` : `${deltaAccTeam.pct}%`}
                          </span>
                        </td>
                      </tr>

                      {/* Row 6: PSE / RPE */}
                      <tr className="hover:bg-[#1E2D57]/60 transition-colors">
                        <td className="py-3 px-3 font-extrabold text-white flex items-center gap-2">
                          <span>🧠 Percepção Subjetiva de Esforço (PSE)</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-amber-300 text-sm">
                          {selectedPlayer.rpe ? `${selectedPlayer.rpe}/10` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-300">
                          {playerSectorAvg.avgRpe}/10
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-400">
                          {teamKpis.avgRpe}/10
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 font-bold text-[10px]">
                          {selectedPlayer.rpe ? (selectedPlayer.rpe <= playerSectorAvg.avgRpe ? '✅ Carga Controlada' : '⚡ Intensidade Elevada') : '—'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400 font-bold text-[10px]">
                          {selectedPlayer.rpe ? (selectedPlayer.rpe <= teamKpis.avgRpe ? '✅ Dentro da Média' : '⚡ Acima da Média') : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )) : (
              /* ADMIN: FULL SORTABLE 19-PLAYER TABLE */
              <section className="rounded-2xl border border-white/10 bg-[#152244] p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
                    <Table className="h-4 w-4 text-sky-400" />
                    <span>Tabela de Rendimento GPS — Jogo vs {match.opponent}</span>
                  </h3>
                  <span className="text-xs text-slate-400">Clica nos cabeçalhos para ordenar</span>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-extrabold tracking-wider">
                        <th className="py-2.5 px-3">Jogadora</th>
                        <th className="py-2.5 px-3">Setor</th>
                        <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSortTable('min')}>
                          Min {tableSortKey === 'min' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSortTable('dist')}>
                          Distância (m) {tableSortKey === 'dist' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSortTable('sprint')}>
                          &gt;19 km/h (m) {tableSortKey === 'sprint' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSortTable('sprint23')}>
                          &gt;23 km/h (m) {tableSortKey === 'sprint23' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => handleSortTable('topSpeed')}>
                          Vel. Máx (km/h) {tableSortKey === 'topSpeed' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                        <th className="py-2.5 px-3 text-center cursor-pointer hover:text-white" onClick={() => handleSortTable('totalAcc')}>
                          ACC / DEC {tableSortKey === 'totalAcc' && (tableSortOrder === 'asc' ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedTablePlayers.map((p) => {
                        const isSelected = p.name === selectedPlayer.name;
                        const posConf = posColorClassMap[p.pos] || { badge: p.pos, text: 'text-slate-300', bg: 'bg-slate-700', border: 'border-slate-600' };

                        return (
                          <tr
                            key={p.name}
                            onClick={() => {
                              setSelectedPlayerIndex(rawPlayers.findIndex((x) => x.name === p.name));
                              setViewMode('visual');
                            }}
                            className={`hover:bg-[#1E2D57]/70 cursor-pointer transition-colors ${
                              isSelected ? 'bg-sky-500/15' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 font-extrabold text-white flex items-center space-x-2">
                              <span>{p.name}</span>
                              {p.fullName && p.fullName !== p.name && (
                                <span className="text-[10px] text-slate-400 font-normal">({p.fullName})</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${posConf.bg} ${posConf.text} border ${posConf.border}`}>
                                {p.pos}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                              {p.min != null && p.min > 0 ? `${p.min}'` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-sky-400">{p.dist.toLocaleString('pt-PT')} m</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-400">{p.sprint.toFixed(1)} m</td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-400">{p.sprint23.toFixed(1)} m</td>
                            <td className="py-2.5 px-3 text-right font-black text-amber-400">{p.topSpeed.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-purple-300">
                              {p.acc + p.dec} <span className="text-[10px] text-slate-500">({p.acc}/{p.dec})</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )
          )}

          {/* RECOVERY CARD */}
          <section className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-[#0B1329] to-[#0B1329] p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-black text-sm uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Dicas de Recuperação Pós-Jogo da Equipa</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[#0F172A]/80 border border-white/5 p-3.5 space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>💧 Hidratação & Reposição</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Beber água e eletrólitos nas 24h pós-jogo para repor glicogénio e acelerar a regeneração muscular.
                </p>
              </div>

              <div className="rounded-xl bg-[#0F172A]/80 border border-white/5 p-3.5 space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>😴 Sono Reparador (8h+)</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  O sono é o principal recuperador natural da atleta. Garantir 8 horas de sono de qualidade.
                </p>
              </div>

              <div className="rounded-xl bg-[#0F172A]/80 border border-white/5 p-3.5 space-y-1">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🧘‍♀️ Mobilidade & Libertações</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Sessão leve de mobilidade articular e libertação miofascial para aliviar a carga nos gémeos e ísquios.
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
