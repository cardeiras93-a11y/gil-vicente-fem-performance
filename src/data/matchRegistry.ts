import romarizMatch from './matches/gilvicente-romariz-1209.json';
import u14Match from './matches/gilvicente-sub14-1009.json';
import vsc0109Match from './matches/gilvicente-vitoria-sc-0109.json';
import rioAveMatch from './matches/gilvicente-rio-ave.json';
import bragaMatch from './matches/gilvicente-sc-braga.json';
import u15PreSeasonMatch from './matches/gilvicente-u15-pre-season.json';
import valadaresMatch from './matches/gilvicente-valadares-gaia.json';

export interface MatchPlayerGps {
  name: string;
  fullName: string;
  pos: 'LAT' | 'DC' | 'MED' | 'EXT' | 'AV' | string;
  posName: string;
  min?: number | null;
  dist: number;
  sprint: number; // >19 km/h (m)
  sprint23: number; // >23 km/h (m)
  running?: number; // >7 km/h (m)
  topSpeed: number; // km/h
  acc: number;
  dec: number;
  rpe?: number; // PSE 1-10
  fatigue?: number; // 1-5
  prevDist?: number;
  prevSprint?: number;
  prevSprint23?: number;
}

export interface MatchInfo {
  id: string;
  title: string;
  subtitle: string;
  matchDate: string;
  opponent: string;
  teamCategory: string;
  competition?: string;
  score?: string;
  location?: string;
  weather?: string;
  durationMin?: number;
  comparisonDate?: string;
  comparisonLabel?: string;
  monitoredCount: number;
  players: MatchPlayerGps[];
}

export interface TeamKpis {
  matchId: string;
  opponent: string;
  matchDate: string;
  totalPlayers: number;
  activePlayers: number;
  avgDist: number;
  totalDist: number;
  avgRunning: number;
  runningPct: number;
  avgSprint: number;
  avgSprint23: number;
  maxTopSpeed: number;
  topSpeedPlayer: string;
  totalAcc: number;
  totalDec: number;
  avgAcc: number;
  avgDec: number;
  avgMechanicalLoad: number;
  avgRpe: number;
  avgFatigue: number;
}

export interface SectorAverages {
  pos: string;
  posName: string;
  count: number;
  avgDist: number;
  avgSprint: number;
  avgSprint23: number;
  avgTopSpeed: number;
  avgAcc: number;
  avgDec: number;
  avgRpe: number;
}

export const posColorClassMap: Record<string, { badge: string; text: string; bg: string; border: string }> = {
  LAT: { badge: 'lat', text: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
  DC: { badge: 'dc', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  MED: { badge: 'med', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  EXT: { badge: 'ext', text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
  AV: { badge: 'av', text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

export const ALL_MATCHES: MatchInfo[] = [
  romarizMatch as unknown as MatchInfo,
  u14Match as unknown as MatchInfo,
  vsc0109Match as unknown as MatchInfo,
  rioAveMatch as unknown as MatchInfo,
  bragaMatch as unknown as MatchInfo,
  u15PreSeasonMatch as unknown as MatchInfo,
  valadaresMatch as unknown as MatchInfo,
];

export function getAllMatches(): MatchInfo[] {
  return ALL_MATCHES;
}

export function getMatchById(id: string): MatchInfo {
  const match = ALL_MATCHES.find((m) => m.id === id);
  return match || ALL_MATCHES[0];
}

export function calculateTeamKpis(match: MatchInfo): TeamKpis {
  const activePlayers = match.players.filter((p) => p.dist > 0);
  const count = activePlayers.length || 1;

  const totalDist = activePlayers.reduce((acc, p) => acc + p.dist, 0);
  const avgDist = Math.round(totalDist / count);

  const totalRunning = activePlayers.reduce((acc, p) => acc + (p.running || p.dist * 0.35), 0);
  const avgRunning = Math.round(totalRunning / count);
  const runningPct = avgDist > 0 ? (avgRunning / avgDist) * 100 : 0;

  const totalSprint = activePlayers.reduce((acc, p) => acc + p.sprint, 0);
  const avgSprint = Math.round((totalSprint / count) * 10) / 10;

  const totalSprint23 = activePlayers.reduce((acc, p) => acc + p.sprint23, 0);
  const avgSprint23 = Math.round((totalSprint23 / count) * 10) / 10;

  let maxTopSpeed = 0;
  let topSpeedPlayer = '';
  activePlayers.forEach((p) => {
    if (p.topSpeed > maxTopSpeed) {
      maxTopSpeed = p.topSpeed;
      topSpeedPlayer = p.name;
    }
  });

  const totalAcc = activePlayers.reduce((acc, p) => acc + p.acc, 0);
  const totalDec = activePlayers.reduce((acc, p) => acc + p.dec, 0);
  const avgAcc = Math.round(totalAcc / count);
  const avgDec = Math.round(totalDec / count);
  const avgMechanicalLoad = Math.round((totalAcc + totalDec) / count);

  const rpePlayers = activePlayers.filter((p) => p.rpe && p.rpe > 0);
  const avgRpe = rpePlayers.length > 0
    ? Math.round((rpePlayers.reduce((acc, p) => acc + (p.rpe || 0), 0) / rpePlayers.length) * 10) / 10
    : 7.5;

  const fatiguePlayers = activePlayers.filter((p) => p.fatigue && p.fatigue > 0);
  const avgFatigue = fatiguePlayers.length > 0
    ? Math.round((fatiguePlayers.reduce((acc, p) => acc + (p.fatigue || 0), 0) / fatiguePlayers.length) * 10) / 10
    : 3.0;

  return {
    matchId: match.id,
    opponent: match.opponent,
    matchDate: match.matchDate,
    totalPlayers: match.players.length,
    activePlayers: activePlayers.length,
    avgDist,
    totalDist,
    avgRunning,
    runningPct,
    avgSprint,
    avgSprint23,
    maxTopSpeed,
    topSpeedPlayer,
    totalAcc,
    totalDec,
    avgAcc,
    avgDec,
    avgMechanicalLoad,
    avgRpe,
    avgFatigue,
  };
}

export function calculateSectorAverages(match: MatchInfo): Record<string, SectorAverages> {
  const sectors: Record<string, { posName: string; players: MatchPlayerGps[] }> = {
    LAT: { posName: 'Laterais', players: [] },
    DC: { posName: 'Defesas Centrais', players: [] },
    MED: { posName: 'Médias', players: [] },
    EXT: { posName: 'Extremas', players: [] },
    AV: { posName: 'Avançadas', players: [] },
  };

  match.players.forEach((p) => {
    if (sectors[p.pos] && p.dist > 0) {
      sectors[p.pos].players.push(p);
    }
  });

  const result: Record<string, SectorAverages> = {};

  Object.entries(sectors).forEach(([pos, data]) => {
    const list = data.players;
    const count = list.length || 1;

    result[pos] = {
      pos,
      posName: data.posName,
      count: list.length,
      avgDist: list.length ? Math.round(list.reduce((acc, p) => acc + p.dist, 0) / count) : 0,
      avgSprint: list.length ? Math.round((list.reduce((acc, p) => acc + p.sprint, 0) / count) * 10) / 10 : 0,
      avgSprint23: list.length ? Math.round((list.reduce((acc, p) => acc + p.sprint23, 0) / count) * 10) / 10 : 0,
      avgTopSpeed: list.length ? Math.round((list.reduce((acc, p) => acc + p.topSpeed, 0) / count) * 10) / 10 : 0,
      avgAcc: list.length ? Math.round(list.reduce((acc, p) => acc + p.acc, 0) / count) : 0,
      avgDec: list.length ? Math.round(list.reduce((acc, p) => acc + p.dec, 0) / count) : 0,
      avgRpe: list.length ? Math.round((list.reduce((acc, p) => acc + (p.rpe || 7.0), 0) / count) * 10) / 10 : 0,
    };
  });

  return result;
}

export function calculateNormalizedStats(p: MatchPlayerGps, fallbackMin = 80) {
  const min = p.min && p.min > 0 ? p.min : fallbackMin;
  const mPerMin = p.dist > 0 ? Math.round((p.dist / min) * 10) / 10 : 0;
  const hsrPerMin = p.sprint > 0 ? Math.round((p.sprint / min) * 10) / 10 : 0;
  const sprint23PerMin = p.sprint23 > 0 ? Math.round((p.sprint23 / min) * 100) / 100 : 0;
  const accPerMin = (p.acc + p.dec) > 0 ? Math.round(((p.acc + p.dec) / min) * 100) / 100 : 0;

  return { min, mPerMin, hsrPerMin, sprint23PerMin, accPerMin };
}

export function getDeltaPct(valCurrent: number, valBaseline: number): { diff: number; pct: number; isPositive: boolean } {
  const diff = Math.round((valCurrent - valBaseline) * 10) / 10;
  if (valBaseline === 0) {
    return { diff, pct: valCurrent > 0 ? 100 : 0, isPositive: diff >= 0 };
  }
  const pct = Math.round(((valCurrent - valBaseline) / valBaseline) * 1000) / 10;
  return { diff, pct, isPositive: diff >= 0 };
}

export function getAthleteParticipatedMatches(athleteName: string): MatchInfo[] {
  if (!athleteName) return ALL_MATCHES;
  const target = athleteName.trim().toLowerCase();
  return ALL_MATCHES.filter((m) =>
    m.players.some((p) => p.name.trim().toLowerCase() === target && p.dist > 0)
  );
}
