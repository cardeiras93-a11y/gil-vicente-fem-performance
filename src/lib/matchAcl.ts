import { Athlete } from './types';
import { getStoredActiveAthlete } from './storage';
import { MatchInfo, MatchPlayerGps } from '@/data/matchRegistry';

export type UserRole = 'admin' | 'coach' | 'athlete';

export function normalizeAthleteName(name: string): string {
  if (!name) return '';
  const upper = name.trim().toUpperCase();
  if (upper === 'SIMÃES' || upper === 'SIMOES') return 'Simães';
  if (upper === 'SARA TEIXEIRA' || upper === 'SARA T.') return 'Sara T.';
  if (upper === 'SARA ALVES' || upper === 'SARA A.') return 'Sara Alves';
  if (upper === 'SARA CARTAXO' || upper === 'CARTAXO') return 'Cartaxo';
  if (upper === 'PATRICIA BARREIROS' || upper === 'TICHA') return 'Ticha';
  if (upper === 'MARIA MALTA' || upper === 'MALTA') return 'Malta';
  if (upper === 'MARIA RIBEIRO' || upper === 'RIBEIRO') return 'Ribeiro';
  if (upper === 'MARTHE' || upper === 'MARTHE ENLID' || upper === 'MARTHE E.') return 'Marthe';
  if (upper === 'RITA RODRIGUES' || upper === 'RITA R.') return 'Rita R.';
  if (upper === 'LARA CORREIA' || upper === 'LARA') return 'Lara';
  if (upper === 'RITA RAMOS' || upper === 'RAMOS') return 'Ramos';
  if (upper === 'CARLOTA') return 'Carlota';
  if (upper === 'CAROL') return 'Carol';
  if (upper === 'MANU') return 'Manu';
  if (upper === 'MAGUI') return 'Magui';
  if (upper === 'NICOLE') return 'Nicole';
  if (upper === 'SERENA') return 'Serena';
  if (upper === 'MERIVA') return 'Meriva';
  if (upper === 'VERÓNICA' || upper === 'VERONICA') return 'Verónica';
  if (upper === 'TITA') return 'Tita';
  if (upper === 'CHELSEA') return 'Chelsea';
  if (upper === 'EVA') return 'Eva';
  if (upper === 'FAITH') return 'Faith';
  if (upper === 'PAYTON') return 'Payton';
  return name.trim();
}

/**
 * Returns current user role on client side:
 * - 'admin' if admin mode active or requested
 * - 'athlete' if an athlete is logged in
 */
export function getCurrentClientRole(): UserRole {
  if (typeof window === 'undefined') return 'athlete';
  try {
    const viewMode = localStorage.getItem('femperf_active_view_mode');
    if (viewMode === 'admin') return 'admin';
  } catch {}
  return 'athlete';
}

/**
 * Returns the currently active athlete in session, or null
 */
export function getActiveSessionAthlete(): Athlete | null {
  if (typeof window === 'undefined') return null;
  return getStoredActiveAthlete();
}

/**
 * Sanitizes a Match object for a specific athlete:
 * Keeps team metadata, collective KPIs, and sector averages,
 * but strips out all other teammates' rows to guarantee complete privacy.
 */
export function sanitizeMatchForAthlete(match: MatchInfo, athleteName: string): MatchInfo {
  const normTarget = normalizeAthleteName(athleteName).toLowerCase();
  
  const athletePlayer = match.players.find(
    (p) => normalizeAthleteName(p.name).toLowerCase() === normTarget
  );

  return {
    ...match,
    // Only return the authenticated athlete's record in players array
    players: athletePlayer ? [athletePlayer] : [],
  };
}
