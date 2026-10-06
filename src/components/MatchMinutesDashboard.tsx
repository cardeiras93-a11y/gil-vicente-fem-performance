'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MatchInfo, MatchPlayerGps, getAllMatches, posColorClassMap } from '@/data/matchRegistry';
import { getDynamicAthletes, getStoredTrainingSessions } from '@/lib/storage';
import { normalizeAthleteName } from '@/lib/matchAcl';
import { Athlete } from '@/lib/types';
import { isGoalkeeper } from '@/lib/data';
import {
  Timer, Clock, Trophy, Shield, Search, Filter, CheckCircle2,
  Edit3, Save, RotateCcw, Download, Copy, Check, ChevronRight, X,
  Flame, TrendingUp, AlertCircle, Calendar, Users, SlidersHorizontal,
  Layers, BarChart3, HelpCircle, ArrowUpDown, ChevronDown, Plus, Trash2
} from 'lucide-react';

export type MatchCategory = 'friendly' | 'championship' | 'cup';
export type FilterContext = 'all' | 'official' | 'friendly';
export type OfficialSubFilter = 'all_official' | 'championship' | 'cup';
export type SortOption = 'minutes_desc' | 'minutes_asc' | 'matches_desc' | 'avg_desc' | 'name_asc';

const CATEGORY_STORAGE_KEY = 'femperf_match_category_overrides';
const MINUTES_STORAGE_KEY = 'femperf_player_minutes_overrides';
const CUSTOM_MATCHES_STORAGE_KEY = 'femperf_custom_matches';

interface PlayerMatchDetail {
  matchId: string;
  matchDate: string;
  opponent: string;
  competition: string;
  category: MatchCategory;
  durationMin: number;
  dist: number;
  min: number;
  isOverridden: boolean;
  hasGps?: boolean;
  score?: string;
}

interface PlayerMinutesStats {
  id: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  pos: string;
  posBadge: { text: string; bg: string; border: string };
  // Raw totals
  minutesFriendly: number;
  minutesChampionship: number;
  minutesCup: number;
  minutesOfficial: number;
  minutesTotal: number;
  // Match counts
  matchesFriendly: number;
  matchesChampionship: number;
  matchesCup: number;
  matchesOfficial: number;
  matchesTotal: number;
  // Dynamic filtered values
  filteredMinutes: number;
  filteredMatches: number;
  avgMinPerMatch: number;
  pctOfMaxPossible: number;
  // Detail history
  matchHistory: PlayerMatchDetail[];
}

export const MatchMinutesDashboard: React.FC<{ isStandalone?: boolean }> = ({ isStandalone = false }) => {
  const [customMatches, setCustomMatches] = useState<MatchInfo[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);

  // Filter States
  const [contextFilter, setContextFilter] = useState<FilterContext>('all');
  const [officialSubFilter, setOfficialSubFilter] = useState<OfficialSubFilter>('all_official');
  const [positionFilter, setPositionFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('minutes_desc');

  // Overrides States
  const [categoryOverrides, setCategoryOverrides] = useState<Record<string, MatchCategory>>({});
  const [minutesOverrides, setMinutesOverrides] = useState<Record<string, number>>({});

  // UI Modals / Drawers
  const [selectedPlayerForDetail, setSelectedPlayerForDetail] = useState<PlayerMinutesStats | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState<boolean>(false);
  const [showAddMatchModal, setShowAddMatchModal] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState<string | null>(null);

  // Detail Modal Sub-Filter ('all' | 'played' | 'unplayed')
  const [modalFilter, setModalFilter] = useState<'all' | 'played' | 'unplayed'>('all');

  // New Match Form States
  const [newMatchOpponent, setNewMatchOpponent] = useState<string>('');
  const [newMatchDate, setNewMatchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newMatchCategory, setNewMatchCategory] = useState<MatchCategory>('friendly');
  const [newMatchCompetition, setNewMatchCompetition] = useState<string>('');
  const [newMatchDuration, setNewMatchDuration] = useState<number>(80);
  const [newMatchScore, setNewMatchScore] = useState<string>('');

  // Combined matches: registered matches + custom matches, sorted newest first
  const allMatches = useMemo(() => {
    const base = getAllMatches();
    const combined = [...base, ...customMatches];
    return combined.sort((a, b) => (b.matchDate || '').localeCompare(a.matchDate || ''));
  }, [customMatches]);

  // Load athletes, stored overrides, and custom matches
  useEffect(() => {
    setAthletes(getDynamicAthletes(true));

    try {
      const storedCat = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (storedCat) setCategoryOverrides(JSON.parse(storedCat));
    } catch (e) {
      console.error('Error loading category overrides:', e);
    }

    try {
      const storedMin = localStorage.getItem(MINUTES_STORAGE_KEY);
      if (storedMin) setMinutesOverrides(JSON.parse(storedMin));
    } catch (e) {
      console.error('Error loading minutes overrides:', e);
    }

    try {
      const storedCustom = localStorage.getItem(CUSTOM_MATCHES_STORAGE_KEY);
      if (storedCustom) setCustomMatches(JSON.parse(storedCustom));
    } catch (e) {
      console.error('Error loading custom matches:', e);
    }
  }, []);

  // Helper to resolve match category
  const getMatchCategory = useCallback((m: MatchInfo): MatchCategory => {
    // 1. Explicit coach category override
    if (categoryOverrides[m.id]) {
      return categoryOverrides[m.id];
    }

    const comp = (m.competition || '').toLowerCase();
    const opp = (m.opponent || '').toLowerCase();
    const id = (m.id || '').toLowerCase();
    const text = `${comp} ${opp} ${id}`;

    // 2. Training matches (Internal, Preparation, Sub-14, U14, U15, Friendly)
    if (
      text.includes('treino') ||
      text.includes('jt') ||
      text.includes('amigável') ||
      text.includes('amigavel') ||
      text.includes('sub-14') ||
      text.includes('sub14') ||
      text.includes('u14') ||
      text.includes('u15') ||
      text.includes('vila') ||
      text.includes('romariz') ||
      text.includes('braga') ||
      text.includes('rio ave') ||
      text.includes('valadares') ||
      text.includes('vitória') ||
      text.includes('vsc')
    ) {
      return 'friendly';
    }

    // 3. Taça de Portugal
    if (text.includes('taça') || text.includes('taca') || text.includes('cup') || text.includes('freiriz')) {
      return 'cup';
    }

    // 4. Campeonato Nacional
    if (
      text.includes('campeonato') ||
      text.includes('liga') ||
      text.includes('jornada') ||
      text.includes('fase regular') ||
      text.includes('albergaria') ||
      text.includes('j1pv') ||
      text.includes('juveforce') ||
      text.includes('juve force') ||
      text.includes('juve')
    ) {
      return 'championship';
    }

    // 5. Training session calendar classification as fallback
    try {
      const sessions = getStoredTrainingSessions();
      if (sessions[m.matchDate]?.matchCategory) {
        return sessions[m.matchDate].matchCategory as MatchCategory;
      }
    } catch {}

    return 'friendly';
  }, [categoryOverrides]);

  // Save Category Override
  const handleSetCategory = (matchId: string, category: MatchCategory) => {
    const updated = { ...categoryOverrides, [matchId]: category };
    setCategoryOverrides(updated);
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving category override:', e);
    }
  };

  // Reset Category Overrides
  const handleResetCategories = () => {
    if (window.confirm('Deseja repor as categorias predefinidas de todos os jogos?')) {
      setCategoryOverrides({});
      try {
        localStorage.removeItem(CATEGORY_STORAGE_KEY);
      } catch {}
    }
  };

  // Save Single Player Minute Override
  const handleSavePlayerMinute = (matchId: string, athleteName: string, minutes: number) => {
    const norm = normalizeAthleteName(athleteName).toLowerCase();
    const key = `${matchId}__${norm}`;
    const updated = { ...minutesOverrides, [key]: Math.max(0, minutes) };
    setMinutesOverrides(updated);
    try {
      localStorage.setItem(MINUTES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving minutes override:', e);
    }
  };

  // Reset Player Minute Overrides for a specific athlete
  const handleResetAthleteMinutes = (athleteName: string) => {
    const norm = normalizeAthleteName(athleteName).toLowerCase();
    const prefix = `__${norm}`;
    const updated = { ...minutesOverrides };
    Object.keys(updated).forEach((k) => {
      if (k.endsWith(prefix)) {
        delete updated[k];
      }
    });
    setMinutesOverrides(updated);
    try {
      localStorage.setItem(MINUTES_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Reset Single Match Minute Override for an athlete
  const handleResetMatchMinute = (matchId: string, athleteName: string) => {
    const norm = normalizeAthleteName(athleteName).toLowerCase();
    const key = `${matchId}__${norm}`;
    const updated = { ...minutesOverrides };
    delete updated[key];
    setMinutesOverrides(updated);
    try {
      localStorage.setItem(MINUTES_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error removing match minute override:', e);
    }
  };

  // Save Custom Match Form
  const handleSaveCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatchOpponent.trim()) return;

    const newId = `custom_match_${Date.now()}`;
    const matchCat = newMatchCategory;
    const dur = Number(newMatchDuration) || (matchCat === 'friendly' ? 80 : 90);
    const comp = newMatchCompetition.trim() || (
      matchCat === 'friendly' ? 'Jogo Treino' : matchCat === 'championship' ? 'Campeonato Nacional II Divisão' : 'Taça de Portugal'
    );

    const opp = newMatchOpponent.trim();
    const dt = newMatchDate || new Date().toISOString().split('T')[0];
    const newMatch: MatchInfo = {
      id: newId,
      title: `Gil Vicente vs ${opp}`,
      subtitle: `${comp} — ${dt}`,
      opponent: opp,
      matchDate: dt,
      teamCategory: 'Feminino Equipa Principal',
      competition: comp,
      durationMin: dur,
      score: newMatchScore.trim() || undefined,
      monitoredCount: 0,
      players: [],
    };

    const updated = [newMatch, ...customMatches];
    setCustomMatches(updated);
    try {
      localStorage.setItem(CUSTOM_MATCHES_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving custom match:', err);
    }

    // Set category override for new match
    handleSetCategory(newId, matchCat);

    // Reset form & close
    setNewMatchOpponent('');
    setNewMatchScore('');
    setNewMatchCompetition('');
    setShowAddMatchModal(false);
  };

  // Delete Custom Match
  const handleDeleteCustomMatch = (matchId: string) => {
    if (window.confirm('Tem a certeza que deseja eliminar este jogo manual?')) {
      const updated = customMatches.filter((m) => m.id !== matchId);
      setCustomMatches(updated);
      try {
        localStorage.setItem(CUSTOM_MATCHES_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Error deleting custom match:', err);
      }
    }
  };

  // Aggregate stats across all matches
  const { statsList, matchCountsByCategory, maxPossibleByContext } = useMemo(() => {
    // 1. Calculate matches count by category and max possible minutes
    const counts = { friendly: 0, championship: 0, cup: 0, official: 0, total: allMatches.length };
    const maxMins = { friendly: 0, championship: 0, cup: 0, official: 0, total: 0 };

    allMatches.forEach((m) => {
      const cat = getMatchCategory(m);
      const dur = m.durationMin || (cat === 'friendly' ? 80 : 90);
      counts[cat]++;
      maxMins[cat] += dur;
      if (cat === 'championship' || cat === 'cup') {
        counts.official++;
        maxMins.official += dur;
      }
      maxMins.total += dur;
    });

    // 2. Build roster mapping (Roster Athletes + any GPS player)
    const playerMap: Record<string, {
      id: string;
      rawName: string;
      displayName: string;
      avatarUrl?: string;
      posCounts: Record<string, number>;
      history: PlayerMatchDetail[];
    }> = {};

    // Initialize with dynamic athletes (ensuring Goalkeepers get GR position count)
    athletes.forEach((ath) => {
      const norm = normalizeAthleteName(ath.name).toLowerCase();
      const isGR = ath.position === 'GR' || isGoalkeeper(ath.name);
      playerMap[norm] = {
        id: ath.id,
        rawName: ath.name,
        displayName: ath.name,
        avatarUrl: ath.avatarUrl,
        posCounts: isGR ? { GR: 10 } : {},
        history: [],
      };
    });

    // Discover any extra GPS players not in dynamic athletes and count GPS positions
    allMatches.forEach((m) => {
      (m.players || []).forEach((p) => {
        const norm = normalizeAthleteName(p.name).toLowerCase();
        if (!playerMap[norm]) {
          playerMap[norm] = {
            id: `ath-gps-${norm}`,
            rawName: p.name,
            displayName: p.fullName || p.name,
            posCounts: {},
            history: [],
          };
        }
        if (p.pos) {
          playerMap[norm].posCounts[p.pos] = (playerMap[norm].posCounts[p.pos] || 0) + 1;
        }
      });
    });

    // Chronological order: newest matches first
    const sortedSeasonMatches = [...allMatches].sort((a, b) =>
      (b.matchDate || '').localeCompare(a.matchDate || '')
    );

    // Build complete match history for EVERY athlete across ALL season matches
    Object.entries(playerMap).forEach(([norm, data]) => {
      sortedSeasonMatches.forEach((m) => {
        const cat = getMatchCategory(m);
        const matchDuration = m.durationMin || (cat === 'friendly' ? 80 : 90);
        const overrideKey = `${m.id}__${norm}`;

        // Find GPS player record if present
        const p = (m.players || []).find(
          (pl) => normalizeAthleteName(pl.name).toLowerCase() === norm
        );

        let minutes = 0;
        let isOverridden = false;
        let dist = 0;

        if (minutesOverrides[overrideKey] !== undefined) {
          minutes = minutesOverrides[overrideKey];
          isOverridden = true;
          dist = p?.dist || 0;
        } else if (p) {
          dist = p.dist || 0;
          if (p.min != null) {
            minutes = p.min;
          } else if (p.dist && p.dist >= 350) {
            // GPS fallback only if min was not provided in raw report and distance was significant
            if (p.dist >= 4500) {
              minutes = matchDuration;
            } else {
              minutes = Math.round((p.dist / 6500) * matchDuration);
            }
          } else {
            minutes = 0;
          }
        } else {
          // No GPS entry and no override: 0 minutes
          minutes = 0;
          dist = 0;
        }

        data.history.push({
          matchId: m.id,
          matchDate: m.matchDate,
          opponent: m.opponent,
          competition: m.competition || (cat === 'friendly' ? 'Jogo Treino' : 'Jogo Oficial'),
          category: cat,
          durationMin: matchDuration,
          dist,
          min: minutes,
          isOverridden,
          hasGps: !!p,
          score: m.score,
        });
      });
    });

    // Convert to PlayerMinutesStats array
    const compiledStats: PlayerMinutesStats[] = Object.values(playerMap).map((data) => {
      // Determine primary position
      let primaryPos = 'Campo';
      let highestPosCount = 0;
      Object.entries(data.posCounts).forEach(([pos, count]) => {
        if (count > highestPosCount) {
          highestPosCount = count;
          primaryPos = pos;
        }
      });

      // Position styling
      const posStyle = posColorClassMap[primaryPos] || (
        primaryPos === 'GR'
          ? { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
          : { text: 'text-slate-300', bg: 'bg-slate-800', border: 'border-slate-700' }
      );

      // Sum minutes by category
      let minutesFriendly = 0;
      let minutesChampionship = 0;
      let minutesCup = 0;
      let matchesFriendly = 0;
      let matchesChampionship = 0;
      let matchesCup = 0;

      data.history.forEach((h) => {
        if (h.min > 0) {
          if (h.category === 'friendly') {
            minutesFriendly += h.min;
            matchesFriendly++;
          } else if (h.category === 'championship') {
            minutesChampionship += h.min;
            matchesChampionship++;
          } else if (h.category === 'cup') {
            minutesCup += h.min;
            matchesCup++;
          }
        }
      });

      const minutesOfficial = minutesChampionship + minutesCup;
      const matchesOfficial = matchesChampionship + matchesCup;
      const minutesTotal = minutesFriendly + minutesOfficial;
      const matchesTotal = matchesFriendly + matchesOfficial;

      // Filtered calculation based on current UI selection
      let filteredMinutes = minutesTotal;
      let filteredMatches = matchesTotal;
      let maxPossibleContext = maxMins.total;

      if (contextFilter === 'friendly') {
        filteredMinutes = minutesFriendly;
        filteredMatches = matchesFriendly;
        maxPossibleContext = maxMins.friendly;
      } else if (contextFilter === 'official') {
        if (officialSubFilter === 'championship') {
          filteredMinutes = minutesChampionship;
          filteredMatches = matchesChampionship;
          maxPossibleContext = maxMins.championship;
        } else if (officialSubFilter === 'cup') {
          filteredMinutes = minutesCup;
          filteredMatches = matchesCup;
          maxPossibleContext = maxMins.cup;
        } else {
          filteredMinutes = minutesOfficial;
          filteredMatches = matchesOfficial;
          maxPossibleContext = maxMins.official;
        }
      }

      const avgMinPerMatch = filteredMatches > 0 ? Math.round((filteredMinutes / filteredMatches) * 10) / 10 : 0;
      const pctOfMaxPossible = maxPossibleContext > 0 ? Math.round((filteredMinutes / maxPossibleContext) * 100) : 0;

      return {
        id: data.id,
        name: data.rawName,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        pos: primaryPos,
        posBadge: posStyle,
        minutesFriendly,
        minutesChampionship,
        minutesCup,
        minutesOfficial,
        minutesTotal,
        matchesFriendly,
        matchesChampionship,
        matchesCup,
        matchesOfficial,
        matchesTotal,
        filteredMinutes,
        filteredMatches,
        avgMinPerMatch,
        pctOfMaxPossible,
        matchHistory: data.history.sort((a, b) => b.matchDate.localeCompare(a.matchDate)),
      };
    });

    return {
      statsList: compiledStats,
      matchCountsByCategory: counts,
      maxPossibleByContext: maxMins,
    };
  }, [allMatches, athletes, categoryOverrides, minutesOverrides, getMatchCategory, contextFilter, officialSubFilter]);

  // Keep detail modal updated with latest stats if open
  useEffect(() => {
    if (selectedPlayerForDetail) {
      const refreshed = statsList.find((p) => p.name === selectedPlayerForDetail.name);
      if (refreshed) setSelectedPlayerForDetail(refreshed);
    }
  }, [statsList]);

  // Filtered match history inside Detail Modal
  const modalMatches = useMemo(() => {
    if (!selectedPlayerForDetail) return [];
    if (modalFilter === 'played') {
      return selectedPlayerForDetail.matchHistory.filter((h) => h.min > 0);
    }
    if (modalFilter === 'unplayed') {
      return selectedPlayerForDetail.matchHistory.filter((h) => h.min === 0);
    }
    return selectedPlayerForDetail.matchHistory;
  }, [selectedPlayerForDetail, modalFilter]);

  const modalHistoryTotal = selectedPlayerForDetail?.matchHistory.length || 0;
  const modalHistoryPlayed = selectedPlayerForDetail?.matchHistory.filter((h) => h.min > 0).length || 0;
  const modalHistoryUnplayed = selectedPlayerForDetail?.matchHistory.filter((h) => h.min === 0).length || 0;

  // Filtered and Sorted Athletes List
  const displayedStats = useMemo(() => {
    return statsList
      .filter((p) => {
        // Position filter
        if (positionFilter !== 'ALL' && p.pos !== positionFilter) return false;
        // Search term
        if (searchTerm.trim() !== '') {
          const s = searchTerm.toLowerCase();
          return p.displayName.toLowerCase().includes(s) || p.name.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'minutes_desc') return b.filteredMinutes - a.filteredMinutes;
        if (sortBy === 'minutes_asc') return a.filteredMinutes - b.filteredMinutes;
        if (sortBy === 'matches_desc') return b.filteredMatches - a.filteredMatches;
        if (sortBy === 'avg_desc') return b.avgMinPerMatch - a.avgMinPerMatch;
        if (sortBy === 'name_asc') return a.displayName.localeCompare(b.displayName);
        return 0;
      });
  }, [statsList, positionFilter, searchTerm, sortBy]);

  // Team KPIs for Current Filter
  const teamKpis = useMemo(() => {
    const totalMinTeam = displayedStats.reduce((acc, p) => acc + p.filteredMinutes, 0);
    const activePlayersCount = displayedStats.filter((p) => p.filteredMinutes > 0).length;
    const avgPerPlayer = activePlayersCount > 0 ? Math.round(totalMinTeam / activePlayersCount) : 0;
    const topPlayer = [...displayedStats].sort((a, b) => b.filteredMinutes - a.filteredMinutes)[0] || null;
    const lowMinutesCount = displayedStats.filter((p) => p.filteredMinutes > 0 && p.filteredMinutes < 90).length;

    return {
      totalMinTeam,
      activePlayersCount,
      avgPerPlayer,
      topPlayer,
      lowMinutesCount,
    };
  }, [displayedStats]);

  // Copy Summary to Clipboard
  const handleCopyReport = () => {
    let filterLabel = 'Todos os Jogos';
    if (contextFilter === 'friendly') filterLabel = 'Só Jogos Treino';
    else if (contextFilter === 'official') {
      if (officialSubFilter === 'championship') filterLabel = 'Campeonato Nacional';
      else if (officialSubFilter === 'cup') filterLabel = 'Taça de Portugal';
      else filterLabel = 'Todos os Jogos Oficiais (Campeonato + Taça)';
    }

    let report = `⏱️ RELATÓRIO DE MINUTOS DE JOGO — GIL VICENTE FC\n`;
    report += `Filtro: ${filterLabel}\n`;
    report += `Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}\n\n`;
    report += `Classificação por Minutos:\n`;

    displayedStats.forEach((p, idx) => {
      report += `${idx + 1}. ${p.displayName} (${p.pos}): ${p.filteredMinutes} min | ${p.filteredMatches} jogos (Média: ${p.avgMinPerMatch} min/j)\n`;
      report += `   [Treino: ${p.minutesFriendly}m | Campeonato: ${p.minutesChampionship}m | Taça: ${p.minutesCup}m]\n`;
    });

    navigator.clipboard.writeText(report);
    setCopiedToast('Relatório copiado com sucesso para a área de transferência!');
    setTimeout(() => setCopiedToast(null), 3500);
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Posição', 'Jogadora', 'Posição Tática', 'Minutos Filtro Atual', 'Jogos Disputados', 'Média Min/Jogo', 'Minutos Jogo Treino', 'Minutos Campeonato', 'Minutos Taça Portugal', 'Total Jogos Oficiais', 'Total Geral Minutos'];
    const rows = displayedStats.map((p, idx) => [
      idx + 1,
      `"${p.displayName}"`,
      p.pos,
      p.filteredMinutes,
      p.filteredMatches,
      p.avgMinPerMatch,
      p.minutesFriendly,
      p.minutesChampionship,
      p.minutesCup,
      p.minutesOfficial,
      p.minutesTotal,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `minutos_jogadoras_${contextFilter}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Toast Alert */}
      {copiedToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center space-x-2 bg-emerald-500 text-slate-950 font-black px-4 py-3 rounded-xl shadow-2xl animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm">{copiedToast}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                <Timer className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Gestão & Tempo de Jogo
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    GPS & Rotação
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Monitorização discriminada de minutos disputados por contexto: Jogos Treino vs Jogos Oficiais (Campeonato Nacional & Taça de Portugal)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                showCategoryManager
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{showCategoryManager ? 'Ocultar Categorias' : 'Gerir Categorias Jogos'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddMatchModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-all active:scale-95"
              title="Adicionar um novo jogo à época (manual / sem GPS)"
            >
              <Plus className="h-4 w-4" />
              <span>Novo Jogo</span>
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all active:scale-95"
              title="Copiar resumo de minutos para texto"
            >
              <Copy className="h-4 w-4" />
              <span>Copiar</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Collapsible Match Category Manager Drawer */}
        {showCategoryManager && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-4 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" />
                  Classificação das Competições dos Jogos
                </h3>
                <p className="text-xs text-slate-400">
                  Altere a qualquer momento a categoria de cada partida. A afetação dos minutos atualiza-se imediatamente.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(true)}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar Novo Jogo</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetCategories}
                  className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 underline"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Repor Categorias</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {allMatches.map((m) => {
                const currentCat = getMatchCategory(m);
                const isCustom = m.id.startsWith('custom_');
                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white truncate max-w-[170px] flex items-center gap-1.5" title={m.opponent}>
                          vs {m.opponent}
                          {isCustom && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                              Manual
                            </span>
                          )}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] text-slate-500">{m.matchDate}</span>
                          {isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomMatch(m.id)}
                              className="text-rose-400 hover:text-rose-300 p-0.5 rounded transition-all"
                              title="Eliminar este jogo manual"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{m.competition || 'Sem rótulo'}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleSetCategory(m.id, 'friendly')}
                        className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                          currentCat === 'friendly'
                            ? 'bg-emerald-500 text-slate-950 font-black shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🤝 Treino
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCategory(m.id, 'championship')}
                        className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                          currentCat === 'championship'
                            ? 'bg-sky-500 text-slate-950 font-black shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🏆 Camp.
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetCategory(m.id, 'cup')}
                        className={`py-1 text-[10px] font-bold rounded transition-all text-center ${
                          currentCat === 'cup'
                            ? 'bg-amber-400 text-slate-950 font-black shadow'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        🇵🇹 Taça
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
        {/* Primary Filter Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-red-500" />
              Contexto do Jogo
            </span>
            <span className="text-xs text-slate-400">
              {displayedStats.length} jogadoras encontradas
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 1. Todos os Jogos */}
            <button
              type="button"
              onClick={() => setContextFilter('all')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                contextFilter === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border-red-500 shadow-md shadow-red-600/30'
                  : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 text-left">
                <div className={`p-1.5 rounded-lg ${contextFilter === 'all' ? 'bg-white/20' : 'bg-slate-800 text-slate-400'}`}>
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Todos os Jogos</div>
                  <div className="text-[10px] opacity-80">Treino + Oficiais</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                contextFilter === 'all' ? 'bg-white text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {matchCountsByCategory.total}
              </span>
            </button>

            {/* 2. Só Jogos Oficiais */}
            <button
              type="button"
              onClick={() => setContextFilter('official')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                contextFilter === 'official'
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white border-sky-400 shadow-md shadow-sky-600/30'
                  : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 text-left">
                <div className={`p-1.5 rounded-lg ${contextFilter === 'official' ? 'bg-white/20' : 'bg-slate-800 text-sky-400'}`}>
                  <Trophy className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Só Jogos Oficiais</div>
                  <div className="text-[10px] opacity-80">Campeonato & Taça</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                contextFilter === 'official' ? 'bg-white text-slate-950' : 'bg-slate-800 text-sky-400'
              }`}>
                {matchCountsByCategory.official}
              </span>
            </button>

            {/* 3. Só Jogos Treino */}
            <button
              type="button"
              onClick={() => setContextFilter('friendly')}
              className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                contextFilter === 'friendly'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950/70 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-2 text-left">
                <div className={`p-1.5 rounded-lg ${contextFilter === 'friendly' ? 'bg-white/20' : 'bg-slate-800 text-emerald-400'}`}>
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-extrabold">Só Jogos Treino</div>
                  <div className="text-[10px] opacity-80">Amigáveis & Preparação</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${
                contextFilter === 'friendly' ? 'bg-white text-slate-950' : 'bg-slate-800 text-emerald-400'
              }`}>
                {matchCountsByCategory.friendly}
              </span>
            </button>
          </div>
        </div>

        {/* Sub-Filter for Official Competitions (Discriminator: Campeonato vs Taça) */}
        {contextFilter === 'official' && (
          <div className="p-3 rounded-xl bg-slate-950/90 border border-sky-500/40 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-sky-300">
              <span>Discriminativo de Competições Oficiais:</span>
              <span className="text-[11px] text-slate-400">Escolha a competição pretendida</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setOfficialSubFilter('all_official')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  officialSubFilter === 'all_official'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>Todos os Oficiais ({matchCountsByCategory.official})</span>
              </button>

              <button
                type="button"
                onClick={() => setOfficialSubFilter('championship')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  officialSubFilter === 'championship'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>🏆 Campeonato Nacional ({matchCountsByCategory.championship})</span>
              </button>

              <button
                type="button"
                onClick={() => setOfficialSubFilter('cup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  officialSubFilter === 'cup'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <span>🇵🇹 Taça de Portugal ({matchCountsByCategory.cup})</span>
              </button>
            </div>
          </div>
        )}

        {/* Search, Position Pills and Sort Row */}
        <div className="pt-2 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Position Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Posição:</span>
            {['ALL', 'GR', 'DC', 'LAT', 'MED', 'EXT', 'AV'].map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setPositionFilter(pos)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  positionFilter === pos
                    ? 'bg-red-600 text-white font-black shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                {pos === 'ALL' ? 'Todas' : pos}
              </button>
            ))}
          </div>

          {/* Search and Sort controls */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-48">
              <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar jogadora..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 font-bold focus:outline-none focus:border-red-500"
            >
              <option value="minutes_desc">Mais Minutos</option>
              <option value="minutes_asc">Menos Minutos</option>
              <option value="matches_desc">Mais Jogos</option>
              <option value="avg_desc">Média Min/Jogo</option>
              <option value="name_asc">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Jogos Analisados */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="text-slate-400 text-xs font-bold">Jogos no Filtro</div>
          <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
            <span>
              {contextFilter === 'all'
                ? matchCountsByCategory.total
                : contextFilter === 'friendly'
                ? matchCountsByCategory.friendly
                : officialSubFilter === 'championship'
                ? matchCountsByCategory.championship
                : officialSubFilter === 'cup'
                ? matchCountsByCategory.cup
                : matchCountsByCategory.official}
            </span>
            <span className="text-xs font-semibold text-slate-400">partidas</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
              {matchCountsByCategory.friendly} Treino
            </span>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 font-bold">
              {matchCountsByCategory.championship} Camp.
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
              {matchCountsByCategory.cup} Taça
            </span>
          </div>
        </div>

        {/* Card 2: Minutos Totais da Equipa */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-bold">Minutos Totais Monitorizados</div>
          <div className="text-2xl font-black text-rose-400 mt-1 flex items-baseline gap-1.5">
            <span>{teamKpis.totalMinTeam.toLocaleString('pt-PT')}</span>
            <span className="text-xs font-semibold text-slate-400">minutos</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Média de <span className="font-bold text-white">{teamKpis.avgPerPlayer} min</span> por jogadora ativa
          </div>
        </div>

        {/* Card 3: Jogadora Mais Utilizada */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-bold">Mais Utilizada no Filtro</div>
          <div className="text-lg font-black text-amber-300 mt-1 truncate">
            {teamKpis.topPlayer ? teamKpis.topPlayer.displayName : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span>{teamKpis.topPlayer ? `${teamKpis.topPlayer.filteredMinutes} min disputados` : ''}</span>
            {teamKpis.topPlayer && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                {teamKpis.topPlayer.pctOfMaxPossible}% tempo
              </span>
            )}
          </div>
        </div>

        {/* Card 4: Rotação / Alerta (< 90 min) */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-slate-400 text-xs font-bold">Alerta de Rotação (&lt; 90 min)</div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-1.5">
            <span>{teamKpis.lowMinutesCount}</span>
            <span className="text-xs font-semibold text-slate-400">jogadoras</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Atletas ativas que necessitam de minutos
          </div>
        </div>
      </div>

      {/* TEAM PLAYING TIME DISTRIBUTION BAR */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-red-500" />
            Distribuição Global dos Minutos da Equipa
          </span>
          <span className="text-slate-400 text-[11px]">
            {statsList.reduce((acc, p) => acc + p.minutesTotal, 0).toLocaleString('pt-PT')} min acumulados
          </span>
        </div>

        {(() => {
          const friendlyMin = statsList.reduce((acc, p) => acc + p.minutesFriendly, 0);
          const champMin = statsList.reduce((acc, p) => acc + p.minutesChampionship, 0);
          const cupMin = statsList.reduce((acc, p) => acc + p.minutesCup, 0);
          const total = friendlyMin + champMin + cupMin || 1;

          const pctFriendly = Math.round((friendlyMin / total) * 100);
          const pctChamp = Math.round((champMin / total) * 100);
          const pctCup = 100 - pctFriendly - pctChamp;

          return (
            <div className="space-y-2">
              <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${pctFriendly}%` }}
                  className="bg-emerald-500 hover:opacity-90 transition-all cursor-pointer"
                  title={`Jogos Treino: ${friendlyMin} min (${pctFriendly}%)`}
                />
                <div
                  style={{ width: `${pctChamp}%` }}
                  className="bg-sky-500 hover:opacity-90 transition-all cursor-pointer"
                  title={`Campeonato Nacional: ${champMin} min (${pctChamp}%)`}
                />
                <div
                  style={{ width: `${pctCup}%` }}
                  className="bg-amber-400 hover:opacity-90 transition-all cursor-pointer"
                  title={`Taça de Portugal: ${cupMin} min (${pctCup}%)`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-xs gap-2 pt-1 text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Jogos Treino: <strong className="text-white">{friendlyMin}m</strong> ({pctFriendly}%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-500 inline-block" />
                  <span>Campeonato: <strong className="text-white">{champMin}m</strong> ({pctChamp}%)</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Taça de Portugal: <strong className="text-white">{cupMin}m</strong> ({pctCup}%)</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* MASTER DATA TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Tabela de Minutos Disputados
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Clique na jogadora para consultar ou ajustar minutos jogo-a-jogo
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-[11px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Jogadora</th>
                <th className="py-3 px-4 text-center">Pos.</th>
                <th className="py-3 px-4 text-right">
                  <span className="text-rose-400">Minutos (Filtro)</span>
                </th>
                <th className="py-3 px-4 text-center">Jogos</th>
                <th className="py-3 px-4 text-right">Média Min/J</th>
                <th className="py-3 px-3 text-right bg-emerald-950/20 text-emerald-300">Treino</th>
                <th className="py-3 px-3 text-right bg-sky-950/20 text-sky-300">Campeonato</th>
                <th className="py-3 px-3 text-right bg-amber-950/20 text-amber-300">Taça</th>
                <th className="py-3 px-3 text-right font-black text-sky-400 bg-sky-900/10">Total Oficial</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-semibold">
              {displayedStats.map((player, index) => {
                const isSelected = selectedPlayerForDetail?.name === player.name;
                const hasMinutes = player.filteredMinutes > 0;

                return (
                  <tr
                    key={player.id}
                    onClick={() => setSelectedPlayerForDetail(player)}
                    className={`hover:bg-slate-800/60 transition-colors cursor-pointer ${
                      isSelected ? 'bg-red-950/30 ring-1 ring-inset ring-red-500/50' : ''
                    } ${!hasMinutes ? 'opacity-50' : ''}`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3 text-center text-slate-500 font-bold text-xs">
                      {index + 1}
                    </td>

                    {/* Athlete Name + Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt={player.displayName}
                            className="h-8 w-8 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                            {player.displayName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-white text-xs sm:text-sm hover:text-red-400 transition-colors">
                            {player.displayName}
                          </div>
                          {player.name !== player.displayName && (
                            <div className="text-[10px] text-slate-400">{player.name}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Tactical Position */}
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black border ${player.posBadge.bg} ${player.posBadge.text} ${player.posBadge.border}`}>
                        {player.pos}
                      </span>
                    </td>

                    {/* Filtered Minutes */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-sm text-white flex items-center gap-1">
                          {player.filteredMinutes} <span className="text-[10px] text-slate-400 font-normal">min</span>
                        </span>
                        {/* Mini progress indicator */}
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            style={{ width: `${Math.min(100, player.pctOfMaxPossible)}%` }}
                            className={`h-full ${
                              contextFilter === 'friendly'
                                ? 'bg-emerald-500'
                                : contextFilter === 'official'
                                ? 'bg-sky-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Match Count */}
                    <td className="py-3 px-4 text-center">
                      <span className="font-black text-slate-300 bg-slate-800 px-2 py-0.5 rounded-lg text-xs">
                        {player.filteredMatches}
                      </span>
                    </td>

                    {/* Avg Min per Match */}
                    <td className="py-3 px-4 text-right font-bold text-slate-300">
                      {player.avgMinPerMatch > 0 ? `${player.avgMinPerMatch}m` : '—'}
                    </td>

                    {/* Friendly Min */}
                    <td className="py-3 px-3 text-right bg-emerald-950/10 font-bold text-emerald-400">
                      {player.minutesFriendly}m
                      <span className="text-[10px] text-emerald-500/70 block">({player.matchesFriendly}j)</span>
                    </td>

                    {/* Championship Min */}
                    <td className="py-3 px-3 text-right bg-sky-950/10 font-bold text-sky-400">
                      {player.minutesChampionship}m
                      <span className="text-[10px] text-sky-500/70 block">({player.matchesChampionship}j)</span>
                    </td>

                    {/* Cup Min */}
                    <td className="py-3 px-3 text-right bg-amber-950/10 font-bold text-amber-400">
                      {player.minutesCup}m
                      <span className="text-[10px] text-amber-500/70 block">({player.matchesCup}j)</span>
                    </td>

                    {/* Official Total (Camp + Taça) */}
                    <td className="py-3 px-3 text-right font-black text-sky-300 bg-sky-900/10">
                      {player.minutesOfficial}m
                      <span className="text-[10px] text-slate-400 block">({player.matchesOfficial}j)</span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedPlayerForDetail(player)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all flex items-center space-x-1 mx-auto active:scale-95"
                      >
                        <Edit3 className="h-3 w-3 text-red-400" />
                        <span>Ver / Editar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* GAME-BY-GAME DETAIL & MINUTE OVERRIDE MODAL */}
      {selectedPlayerForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 space-y-5 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3.5">
                {selectedPlayerForDetail.avatarUrl ? (
                  <img
                    src={selectedPlayerForDetail.avatarUrl}
                    alt={selectedPlayerForDetail.displayName}
                    className="h-12 w-12 rounded-full object-cover border-2 border-red-500"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-sm font-black text-white">
                    {selectedPlayerForDetail.displayName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    {selectedPlayerForDetail.displayName}
                    <span className={`text-xs px-2 py-0.5 rounded font-black border ${selectedPlayerForDetail.posBadge.bg} ${selectedPlayerForDetail.posBadge.text} ${selectedPlayerForDetail.posBadge.border}`}>
                      {selectedPlayerForDetail.pos}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Histórico detalhado jogo-a-jogo e personalização de minutos
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlayerForDetail(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Athlete Category Stats Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Geral</span>
                <div className="text-lg font-black text-white mt-0.5">
                  {selectedPlayerForDetail.minutesTotal} <span className="text-xs font-normal text-slate-400">min</span>
                </div>
                <div className="text-[10px] text-slate-400">{selectedPlayerForDetail.matchesTotal} partidas</div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">🤝 Jogos Treino</span>
                <div className="text-lg font-black text-emerald-300 mt-0.5">
                  {selectedPlayerForDetail.minutesFriendly} <span className="text-xs font-normal text-emerald-400">min</span>
                </div>
                <div className="text-[10px] text-emerald-400/80">{selectedPlayerForDetail.matchesFriendly} partidas</div>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/30">
                <span className="text-[10px] font-bold text-sky-400 uppercase">🏆 Campeonato</span>
                <div className="text-lg font-black text-sky-300 mt-0.5">
                  {selectedPlayerForDetail.minutesChampionship} <span className="text-xs font-normal text-sky-400">min</span>
                </div>
                <div className="text-[10px] text-sky-400/80">{selectedPlayerForDetail.matchesChampionship} partidas</div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <span className="text-[10px] font-bold text-amber-400 uppercase">🇵🇹 Taça de Portugal</span>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  {selectedPlayerForDetail.minutesCup} <span className="text-xs font-normal text-amber-400">min</span>
                </div>
                <div className="text-[10px] text-amber-400/80">{selectedPlayerForDetail.matchesCup} partidas</div>
              </div>
            </div>

            {/* Match History Table / Editor */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-red-500" />
                    Registo dos Jogos da Época
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedPlayerForDetail.matchesTotal} jogados de {modalHistoryTotal}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMatchModal(true)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 bg-emerald-950/30 border border-emerald-500/30 px-2 py-1 rounded-lg"
                  >
                    <Plus className="h-3 w-3" />
                    <span>+ Novo Jogo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAthleteMinutes(selectedPlayerForDetail.name)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restaurar Minutos</span>
                  </button>
                </div>
              </div>

              {/* Modal Sub-filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModalFilter('all')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    modalFilter === 'all'
                      ? 'bg-slate-700 text-white font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({modalHistoryTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('played')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    modalFilter === 'played'
                      ? 'bg-emerald-600 text-white font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Com Minutos ({modalHistoryPlayed})
                </button>
                <button
                  type="button"
                  onClick={() => setModalFilter('unplayed')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    modalFilter === 'unplayed'
                      ? 'bg-amber-500 text-slate-950 font-black shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sem Minutos / Banco ({modalHistoryUnplayed})
                </button>
              </div>

              {/* Match Rows */}
              <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
                {modalMatches.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/60">
                    {modalFilter === 'played'
                      ? 'Nenhum jogo com minutos registados para esta atleta. Alterne para "Todos" ou "Sem Minutos" para atribuir tempo de jogo.'
                      : modalFilter === 'unplayed'
                      ? 'Esta atleta tem minutos atribuídos em todos os jogos da época.'
                      : 'Nenhum jogo registado na época.'}
                  </div>
                ) : (
                  modalMatches.map((h) => {
                    return (
                      <div
                        key={h.matchId}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-extrabold text-white">vs {h.opponent}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-black ${
                              h.category === 'friendly'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : h.category === 'championship'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {h.category === 'friendly' ? '🤝 Treino' : h.category === 'championship' ? '🏆 Campeonato' : '🇵🇹 Taça'}
                            </span>
                            {h.score && (
                              <span className="text-[10px] text-slate-400 font-semibold">({h.score})</span>
                            )}
                            {!h.hasGps ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                Sem GPS
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-medium bg-slate-800 text-slate-400">
                                GPS {Math.round(h.dist)}m
                              </span>
                            )}
                            {h.isOverridden && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black">
                                Manual
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span>📅 {h.matchDate}</span>
                            <span>•</span>
                            <span className="truncate max-w-[200px]">{h.competition}</span>
                            <span>•</span>
                            <span className="text-slate-500">Duração: {h.durationMin}m</span>
                          </div>
                        </div>

                        {/* Editable Minute Stepper / Buttons */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center flex-wrap gap-y-1">
                          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                            <input
                              type="number"
                              min="0"
                              max="130"
                              value={h.min === 0 ? '' : h.min}
                              placeholder="0"
                              onChange={(e) => {
                                const raw = e.target.value;
                                const val = raw === '' ? 0 : Math.max(0, parseInt(raw) || 0);
                                handleSavePlayerMinute(h.matchId, selectedPlayerForDetail.name, val);
                              }}
                              className="w-14 bg-slate-950 text-white font-black text-center text-xs px-1 py-1 rounded border border-slate-800 focus:outline-none focus:border-red-500"
                            />
                            <span className="text-[10px] text-slate-400 pr-1">min</span>
                          </div>

                          {/* Quick Set Presets */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleSavePlayerMinute(h.matchId, selectedPlayerForDetail.name, 0)}
                              className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all active:scale-95"
                              title="0 min (Não jogou / Banco)"
                            >
                              0m
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePlayerMinute(h.matchId, selectedPlayerForDetail.name, 45)}
                              className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all active:scale-95"
                              title="45 min (1 parte)"
                            >
                              45m
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSavePlayerMinute(h.matchId, selectedPlayerForDetail.name, h.durationMin)}
                              className="px-2 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all active:scale-95"
                              title={`Jogo completo (${h.durationMin} min)`}
                            >
                              {h.durationMin}m
                            </button>

                            {h.isOverridden && (
                              <button
                                type="button"
                                onClick={() => handleResetMatchMinute(h.matchId, selectedPlayerForDetail.name)}
                                className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all ml-0.5"
                                title="Remover ajuste manual deste jogo"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlayerForDetail(null)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-red-600 hover:bg-red-500 text-white transition-all shadow-lg active:scale-95"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD MANUAL MATCH MODAL */}
      {showAddMatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Adicionar Jogo Manual</h3>
                  <p className="text-xs text-slate-400">Registe uma nova partida para atribuir minutos às jogadoras</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMatchModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomMatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Adversário *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: SC Braga B ou Vilaverdense U15"
                  value={newMatchOpponent}
                  onChange={(e) => setNewMatchOpponent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Data do Jogo *</label>
                  <input
                    type="date"
                    required
                    value={newMatchDate}
                    onChange={(e) => setNewMatchDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Duração (min) *</label>
                  <input
                    type="number"
                    min="10"
                    max="140"
                    required
                    value={newMatchDuration}
                    onChange={(e) => setNewMatchDuration(parseInt(e.target.value) || 90)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Categoria do Jogo</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewMatchCategory('friendly');
                      setNewMatchDuration(80);
                      setNewMatchCompetition('Jogo Treino');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      newMatchCategory === 'friendly'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🤝 Treino
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMatchCategory('championship');
                      setNewMatchDuration(90);
                      setNewMatchCompetition('Campeonato Nacional II Divisão');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      newMatchCategory === 'championship'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🏆 Camp.
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewMatchCategory('cup');
                      setNewMatchDuration(90);
                      setNewMatchCompetition('Taça de Portugal');
                    }}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      newMatchCategory === 'cup'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow font-black'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    🇵🇹 Taça
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Competição (opcional)</label>
                  <input
                    type="text"
                    placeholder="ex: Fase Regular"
                    value={newMatchCompetition}
                    onChange={(e) => setNewMatchCompetition(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Resultado (opcional)</label>
                  <input
                    type="text"
                    placeholder="ex: 2-1"
                    value={newMatchScore}
                    onChange={(e) => setNewMatchScore(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddMatchModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg active:scale-95 flex items-center space-x-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Guardar Jogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
