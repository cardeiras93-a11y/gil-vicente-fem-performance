import { Athlete, WellnessEntry, RPEEntry, HydrationEntry, TrainingSessionInfo } from './types';
import { INITIAL_ATHLETES } from './data';

const ACTIVE_ATHLETE_KEY = 'femperf_active_athlete_id';
const ATHLETE_PINS_KEY = 'femperf_athlete_pins';
const WELLNESS_LOCAL_KEY = 'femperf_wellness_entries';
const RPE_LOCAL_KEY = 'femperf_rpe_entries';
const HYDRATION_LOCAL_KEY = 'femperf_hydration_entries';
const SYNTHETIC_PURGED_KEY = 'femperf_synthetic_purged_v2';

export function getStoredActiveAthlete(): Athlete | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(ACTIVE_ATHLETE_KEY);
  if (!id) return null;
  return INITIAL_ATHLETES.find((a) => a.id === id) || null;
}

export function setStoredActiveAthleteId(athleteId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ATHLETE_KEY, athleteId);
}

export function getAthletePin(athleteId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const pinsMap = JSON.parse(localStorage.getItem(ATHLETE_PINS_KEY) || '{}');
    return pinsMap[athleteId] || null;
  } catch {
    return null;
  }
}

export function setAthletePin(athleteId: string, pin: string): void {
  if (typeof window === 'undefined') return;
  try {
    const pinsMap = JSON.parse(localStorage.getItem(ATHLETE_PINS_KEY) || '{}');
    pinsMap[athleteId] = pin;
    localStorage.setItem(ATHLETE_PINS_KEY, JSON.stringify(pinsMap));
  } catch (e) {
    console.error('Erro ao guardar PIN:', e);
  }
}

const ADMIN_PIN_KEY = 'femperf_admin_pin';
const PHYSIO_PIN_KEY = 'femperf_physio_pin';

export function getAdminPin(): string {
  if (typeof window === 'undefined') return '2026';
  return localStorage.getItem(ADMIN_PIN_KEY) || '2026';
}

export function setAdminPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
}

export function getPhysioPin(): string {
  if (typeof window === 'undefined') return '2026';
  return localStorage.getItem(PHYSIO_PIN_KEY) || '2026';
}

export function setPhysioPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PHYSIO_PIN_KEY, pin);
}

const CLEAN_SLATE_KEY = 'femperf_clean_slate_v3';

// Clear all historical entries for a clean start starting today
export function clearAllHistoricalData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(WELLNESS_LOCAL_KEY);
    localStorage.removeItem(RPE_LOCAL_KEY);
    localStorage.removeItem(HYDRATION_LOCAL_KEY);
    localStorage.removeItem(TRAINING_SESSIONS_INFO_KEY);
    localStorage.removeItem(TRAINING_CALENDAR_KEY);
    localStorage.setItem(CLEAN_SLATE_KEY, 'true');
  } catch (e) {
    console.error('Erro ao apagar dados históricos:', e);
  }
}

// Purge any previously auto-seeded synthetic demo data so days without training show 0 entries
export function purgeSyntheticDemoData(): void {
  if (typeof window === 'undefined') return;
  try {
    const isClean = localStorage.getItem(CLEAN_SLATE_KEY);
    if (!isClean) {
      localStorage.setItem(CLEAN_SLATE_KEY, 'true');
    }
  } catch (e) {
    console.error('Erro ao purgar dados sintéticos:', e);
  }
}

// Bulk save Gsheets data merging with local storage
export function saveBulkGsheetsData(
  wellnessData: WellnessEntry[],
  rpeData: RPEEntry[],
  hydrationData: HydrationEntry[]
): { wellnessAdded: number; rpeAdded: number; hydrationAdded: number } {
  if (typeof window === 'undefined') return { wellnessAdded: 0, rpeAdded: 0, hydrationAdded: 0 };

  let wAdded = 0;
  let rAdded = 0;
  let hAdded = 0;

  try {
    purgeSyntheticDemoData();

    const existingW: WellnessEntry[] = JSON.parse(localStorage.getItem(WELLNESS_LOCAL_KEY) || '[]');
    const existingMapW = new Set(existingW.map((i) => i.id || `${i.date}-${i.athleteId}`));

    const mergedW = [...existingW];
    wellnessData.forEach((item) => {
      const key = item.id || `${item.date}-${item.athleteId}`;
      if (!existingMapW.has(key)) {
        mergedW.unshift(item);
        wAdded++;
      }
    });

    const existingR: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
    const existingMapR = new Set(existingR.map((i) => i.id || `${i.date}-${i.athleteId}`));

    const mergedR = [...existingR];
    rpeData.forEach((item) => {
      const key = item.id || `${item.date}-${item.athleteId}`;
      if (!existingMapR.has(key)) {
        mergedR.unshift(item);
        rAdded++;
      }
    });

    const existingH: HydrationEntry[] = JSON.parse(localStorage.getItem(HYDRATION_LOCAL_KEY) || '[]');
    const existingMapH = new Set(existingH.map((i) => i.id || `${i.date}-${i.athleteId}`));

    const mergedH = [...existingH];
    hydrationData.forEach((item) => {
      const key = item.id || `${item.date}-${item.athleteId}`;
      if (!existingMapH.has(key)) {
        mergedH.unshift(item);
        hAdded++;
      }
    });

    localStorage.setItem(WELLNESS_LOCAL_KEY, JSON.stringify(mergedW));
    localStorage.setItem(RPE_LOCAL_KEY, JSON.stringify(mergedR));
    localStorage.setItem(HYDRATION_LOCAL_KEY, JSON.stringify(mergedH));
  } catch (e) {
    console.error('Erro ao fundir dados do Gsheets:', e);
  }

  return { wellnessAdded: wAdded, rpeAdded: rAdded, hydrationAdded: hAdded };
}

// Offline / LocalStorage entries helper
export function saveWellnessLocally(entry: WellnessEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const list: WellnessEntry[] = JSON.parse(localStorage.getItem(WELLNESS_LOCAL_KEY) || '[]');
    list.unshift(entry);
    localStorage.setItem(WELLNESS_LOCAL_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao guardar Wellness localmente:', e);
  }
}

export function getWellnessLocally(athleteId?: string): WellnessEntry[] {
  if (typeof window === 'undefined') return [];
  purgeSyntheticDemoData();
  try {
    const list: WellnessEntry[] = JSON.parse(localStorage.getItem(WELLNESS_LOCAL_KEY) || '[]');
    if (athleteId) {
      return list.filter((item) => item.athleteId === athleteId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveRPELocally(entry: RPEEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const list: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
    list.unshift(entry);
    localStorage.setItem(RPE_LOCAL_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao guardar RPE localmente:', e);
  }
}

export function getRPELocally(athleteId?: string): RPEEntry[] {
  if (typeof window === 'undefined') return [];
  purgeSyntheticDemoData();
  try {
    const list: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
    if (athleteId) {
      return list.filter((item) => item.athleteId === athleteId);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveHydrationLocally(entry: HydrationEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const list: HydrationEntry[] = JSON.parse(localStorage.getItem(HYDRATION_LOCAL_KEY) || '[]');
    // Replace if existing for same ID or athlete/date
    const index = list.findIndex((item) => item.id === entry.id || (item.date === entry.date && item.athleteId === entry.athleteId));
    if (index !== -1) {
      list[index] = entry;
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(HYDRATION_LOCAL_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Erro ao guardar Hidratação localmente:', e);
  }
}

export function updateHydrationLocally(updatedEntry: HydrationEntry): void {
  saveHydrationLocally(updatedEntry);
}

export function deleteHydrationLocally(entryId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const list: HydrationEntry[] = JSON.parse(localStorage.getItem(HYDRATION_LOCAL_KEY) || '[]');
    const filtered = list.filter((item) => item.id !== entryId);
    localStorage.setItem(HYDRATION_LOCAL_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Erro ao apagar Hidratação localmente:', e);
  }
}

export function getHydrationLocally(athleteId?: string): HydrationEntry[] {
  if (typeof window === 'undefined') return [];
  purgeSyntheticDemoData();
  try {
    const list: HydrationEntry[] = JSON.parse(localStorage.getItem(HYDRATION_LOCAL_KEY) || '[]');
    if (athleteId) {
      return list.filter((item) => item.athleteId === athleteId);
    }
    return list;
  } catch {
    return [];
  }
}

// Training & Match Calendar schedule overrides persistence
const TRAINING_CALENDAR_KEY = 'femperf_training_calendar_schedule_v2';
const TRAINING_SESSIONS_INFO_KEY = 'femperf_training_sessions_info';

export type CalendarDayType = 'training' | 'match' | 'rest';

export function getStoredCalendarSchedule(): Record<string, CalendarDayType> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TRAINING_CALENDAR_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCalendarSchedule(map: Record<string, CalendarDayType>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRAINING_CALENDAR_KEY, JSON.stringify(map));
    fetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'schedule', schedule: map }),
    }).catch(() => {});
  } catch (e) {
    console.error('Erro ao guardar calendário de treinos:', e);
  }
}

export function getStoredTrainingSessions(): Record<string, TrainingSessionInfo> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(TRAINING_SESSIONS_INFO_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTrainingSessionInfo(info: TrainingSessionInfo): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getStoredTrainingSessions();
    map[info.date] = info;
    localStorage.setItem(TRAINING_SESSIONS_INFO_KEY, JSON.stringify(map));

    const schedule = getStoredCalendarSchedule();
    schedule[info.date] = info.dayType;
    saveCalendarSchedule(schedule);

    fetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', info }),
    }).catch(() => {});
  } catch (e) {
    console.error('Erro ao guardar informação de treino:', e);
  }
}

