import { Athlete, AthletePosition, WellnessEntry, RPEEntry, HydrationEntry, TrainingSessionInfo } from './types';
import { INITIAL_ATHLETES } from './data';
import { secureFetch } from './authGuard';

const ACTIVE_ATHLETE_KEY = 'femperf_active_athlete_id';
const ATHLETE_PINS_KEY = 'femperf_athlete_pins';
const ATHLETE_SESSION_KEY = 'femperf_authenticated_athlete_session';
const CLUB_ACCESS_KEY = 'femperf_club_access_granted';
const WELLNESS_LOCAL_KEY = 'femperf_wellness_entries';
const RPE_LOCAL_KEY = 'femperf_rpe_entries';
const HYDRATION_LOCAL_KEY = 'femperf_hydration_entries';
const SYNTHETIC_PURGED_KEY = 'femperf_synthetic_purged_v2';
const ACTIVATION_CODE_KEY = 'femperf_club_activation_code';
const ADMIN_PIN_KEY = 'femperf_admin_pin';
const PHYSIO_PIN_KEY = 'femperf_physio_pin';
const TRAINING_CALENDAR_KEY = 'femperf_training_calendar_schedule_v2';
const TRAINING_SESSIONS_INFO_KEY = 'femperf_training_sessions_info';

const ATHLETE_AVATARS_KEY = 'femperf_athlete_avatars';

export function getAthleteAvatar(athleteId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const map = JSON.parse(localStorage.getItem(ATHLETE_AVATARS_KEY) || '{}');
    return map[athleteId] || null;
  } catch {
    return null;
  }
}

export function setAthleteAvatar(athleteId: string, avatarUrl: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const map = JSON.parse(localStorage.getItem(ATHLETE_AVATARS_KEY) || '{}');
    if (avatarUrl) {
      map[athleteId] = avatarUrl;
    } else {
      delete map[athleteId];
    }
    localStorage.setItem(ATHLETE_AVATARS_KEY, JSON.stringify(map));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athleteAvatars: { [athleteId]: avatarUrl || '' } }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar foto de perfil:', e);
  }
}

export function setAthleteSession(athleteId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATHLETE_SESSION_KEY, JSON.stringify({
    athleteId,
    timestamp: Date.now(),
  }));
  setStoredActiveAthleteId(athleteId);
}

export function getAthleteSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ATHLETE_SESSION_KEY);
    if (!raw) {
      // Fallback to ACTIVE_ATHLETE_KEY if set from previous login
      return localStorage.getItem(ACTIVE_ATHLETE_KEY) || null;
    }
    const parsed = JSON.parse(raw);
    return parsed?.athleteId || null;
  } catch {
    return localStorage.getItem(ACTIVE_ATHLETE_KEY) || null;
  }
}

export function clearAthleteSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ATHLETE_SESSION_KEY);
  localStorage.removeItem(ACTIVE_ATHLETE_KEY);
}

export function isClubAccessGranted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CLUB_ACCESS_KEY) === 'true';
}

export function grantClubAccess(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLUB_ACCESS_KEY, 'true');
}

const CUSTOM_ATHLETES_KEY = 'femperf_custom_athletes_v2';
const EDITED_PROFILES_KEY = 'femperf_edited_athlete_profiles_v2';
const DELETED_ATHLETES_KEY = 'femperf_deleted_athletes_v1';
const INACTIVE_ATHLETES_KEY = 'femperf_inactive_athletes_v1';

export function getDeletedAthleteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELETED_ATHLETES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getInactiveAthleteIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(INACTIVE_ATHLETES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setAthleteActiveStatus(athleteId: string, isActive: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getInactiveAthleteIds();
    let updated: string[];
    if (isActive) {
      updated = current.filter((id) => id !== athleteId);
    } else {
      updated = Array.from(new Set([...current, athleteId]));
    }
    localStorage.setItem(INACTIVE_ATHLETES_KEY, JSON.stringify(updated));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inactiveAthletes: updated }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar estado de visibilidade da jogadora:', e);
  }
}

export function setAllAthletesActive(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INACTIVE_ATHLETES_KEY, JSON.stringify([]));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inactiveAthletes: [] }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao ativar todas as jogadoras:', e);
  }
}

export function getDynamicAthletes(includeInactive: boolean = false): Athlete[] {
  if (typeof window === 'undefined') {
    return includeInactive ? INITIAL_ATHLETES : INITIAL_ATHLETES.filter((a) => a.isActive !== false);
  }
  try {
    const editedMapRaw = localStorage.getItem(EDITED_PROFILES_KEY);
    const editedMap: Record<string, Partial<Athlete>> = editedMapRaw ? JSON.parse(editedMapRaw) : {};
    
    const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
    const customList: Athlete[] = customListRaw ? JSON.parse(customListRaw) : [];
    const deletedIds = getDeletedAthleteIds();
    const inactiveIds = getInactiveAthleteIds();

    const baseAthletes = INITIAL_ATHLETES.filter((a) => !deletedIds.includes(a.id)).map((ath) => {
      const edit = editedMap[ath.id] || {};
      const avatar = getAthleteAvatar(ath.id);
      const isInactive = inactiveIds.includes(ath.id);
      return {
        ...ath,
        ...edit,
        avatarUrl: avatar || edit.avatarUrl || ath.avatarUrl,
        isActive: !isInactive,
      };
    });

    const customAthletes = customList.filter((a) => !deletedIds.includes(a.id)).map((ath) => {
      const edit = editedMap[ath.id] || {};
      const avatar = getAthleteAvatar(ath.id);
      const isInactive = inactiveIds.includes(ath.id);
      return {
        ...ath,
        ...edit,
        avatarUrl: avatar || edit.avatarUrl || ath.avatarUrl,
        isActive: !isInactive,
      };
    });

    let combined = [...baseAthletes, ...customAthletes];
    if (!includeInactive) {
      combined = combined.filter((a) => a.isActive !== false);
    }
    combined.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
    return combined;
  } catch {
    const deletedIds = getDeletedAthleteIds();
    const inactiveIds = getInactiveAthleteIds();
    let sortedInitial = INITIAL_ATHLETES.filter((a) => !deletedIds.includes(a.id)).map((a) => ({
      ...a,
      isActive: !inactiveIds.includes(a.id),
    }));
    if (!includeInactive) {
      sortedInitial = sortedInitial.filter((a) => a.isActive !== false);
    }
    return sortedInitial.sort((a, b) => a.name.localeCompare(b.name, 'pt', { sensitivity: 'base' }));
  }
}

export async function saveAthleteProfile(
  athleteId: string,
  updates: { name?: string; position?: AthletePosition; avatarUrl?: string; pin?: string }
): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const editedMapRaw = localStorage.getItem(EDITED_PROFILES_KEY);
    const editedMap: Record<string, Partial<Athlete>> = editedMapRaw ? JSON.parse(editedMapRaw) : {};
    editedMap[athleteId] = { ...(editedMap[athleteId] || {}), ...updates };
    localStorage.setItem(EDITED_PROFILES_KEY, JSON.stringify(editedMap));

    const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
    let customList: Athlete[] = [];
    if (customListRaw) {
      try {
        customList = JSON.parse(customListRaw);
        const idx = customList.findIndex((a) => a.id === athleteId);
        if (idx !== -1) {
          customList[idx] = { ...customList[idx], ...updates };
          localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(customList));
        }
      } catch {}
    }

    const payload: any = {
      editedProfiles: editedMap,
    };

    if (updates.avatarUrl !== undefined) {
      const avatarsMap = JSON.parse(localStorage.getItem(ATHLETE_AVATARS_KEY) || '{}');
      avatarsMap[athleteId] = updates.avatarUrl;
      localStorage.setItem(ATHLETE_AVATARS_KEY, JSON.stringify(avatarsMap));
      payload.athleteAvatars = { [athleteId]: updates.avatarUrl };
    }

    if (updates.pin !== undefined && updates.pin.length > 0) {
      const pinsMap = JSON.parse(localStorage.getItem(ATHLETE_PINS_KEY) || '{}');
      pinsMap[athleteId] = updates.pin;
      localStorage.setItem(ATHLETE_PINS_KEY, JSON.stringify(pinsMap));
      payload.athletePins = { [athleteId]: updates.pin };
    }

    if (customList.length > 0) {
      payload.customAthletes = customList;
    }

    await secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar perfil da jogadora:', e);
  }
}

export async function addNewAthlete(
  name: string,
  position: AthletePosition = 'Campo',
  pin?: string,
  avatarUrl?: string
): Promise<Athlete> {
  const cleanName = name.trim().toUpperCase();
  const newId = `ath-custom-${Date.now()}`;
  const newAth: Athlete = {
    id: newId,
    name: cleanName,
    position,
    avatarUrl,
    isActive: true,
  };

  if (typeof window !== 'undefined') {
    try {
      const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
      const customList: Athlete[] = customListRaw ? JSON.parse(customListRaw) : [];
      const existingIdx = customList.findIndex((a) => a.name === cleanName);
      if (existingIdx !== -1) {
        customList[existingIdx] = { ...customList[existingIdx], ...newAth };
      } else {
        customList.push(newAth);
      }
      localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(customList));

      // Remove from deleted list if present
      const deletedList = getDeletedAthleteIds().filter((id) => id !== newId);
      localStorage.setItem(DELETED_ATHLETES_KEY, JSON.stringify(deletedList));

      // Ensure active in inactive list
      const inactiveList = getInactiveAthleteIds().filter((id) => id !== newId);
      localStorage.setItem(INACTIVE_ATHLETES_KEY, JSON.stringify(inactiveList));

      const payload: any = {
        customAthletes: customList,
      };

      if (pin && pin.trim().length > 0) {
        const pinsMap = JSON.parse(localStorage.getItem(ATHLETE_PINS_KEY) || '{}');
        pinsMap[newId] = pin.trim();
        localStorage.setItem(ATHLETE_PINS_KEY, JSON.stringify(pinsMap));
        payload.athletePins = { [newId]: pin.trim() };
      }

      if (avatarUrl && avatarUrl.trim().length > 0) {
        const avatarsMap = JSON.parse(localStorage.getItem(ATHLETE_AVATARS_KEY) || '{}');
        avatarsMap[newId] = avatarUrl.trim();
        localStorage.setItem(ATHLETE_AVATARS_KEY, JSON.stringify(avatarsMap));
        payload.athleteAvatars = { [newId]: avatarUrl.trim() };
      }

      const res = await secureFetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data?.customAthletes && Array.isArray(json.data.customAthletes)) {
          localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(json.data.customAthletes));
        }
      }

      window.dispatchEvent(new Event('femperf_credentials_updated'));
    } catch (e) {
      console.error('Erro ao adicionar nova jogadora:', e);
    }
  }

  return newAth;
}

export async function deleteAthlete(athleteId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
    const customList: Athlete[] = customListRaw ? JSON.parse(customListRaw) : [];
    const filtered = customList.filter((a) => a.id !== athleteId);
    localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(filtered));

    const deletedList = getDeletedAthleteIds();
    if (!deletedList.includes(athleteId)) {
      deletedList.push(athleteId);
      localStorage.setItem(DELETED_ATHLETES_KEY, JSON.stringify(deletedList));
    }

    await secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customAthletes: filtered, deletedAthletes: deletedList }),
    });

    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao apagar jogadora:', e);
  }
}

export function getStoredActiveAthlete(): Athlete | null {
  if (typeof window === 'undefined') return null;
  const id = localStorage.getItem(ACTIVE_ATHLETE_KEY);
  if (!id) return null;
  const all = getDynamicAthletes();
  return all.find((a) => a.id === id) || null;
}

export function setStoredActiveAthleteId(athleteId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_ATHLETE_KEY, athleteId);
}

export async function syncCredentialsFromCloud(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await secureFetch(`/api/credentials?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.success && data.data) {
      const {
        activationCode: cloudActivationCode,
        adminPin: cloudAdminPin,
        physioPin: cloudPhysioPin,
        athletePins: cloudAthletePins,
        athleteAvatars: cloudAthleteAvatars,
        finesEnabledDays: cloudFinesEnabledDays,
        editedProfiles: cloudEditedProfiles,
        customAthletes: cloudCustomAthletes,
        deletedAthletes: cloudDeletedAthletes,
        inactiveAthletes: cloudInactiveAthletes,
        reminderConfig: cloudReminderConfig,
      } = data.data;

      // 1. Activation Code & Admin & Physio PIN: Cloud takes absolute priority
      if (cloudActivationCode) {
        localStorage.setItem(ACTIVATION_CODE_KEY, cloudActivationCode);
      }
      if (cloudAdminPin) {
        localStorage.setItem(ADMIN_PIN_KEY, cloudAdminPin);
      }
      if (cloudPhysioPin) {
        localStorage.setItem(PHYSIO_PIN_KEY, cloudPhysioPin);
      }

      // 2. Athlete PINs: Cloud is the single source of truth
      if (cloudAthletePins && typeof cloudAthletePins === 'object') {
        localStorage.setItem(ATHLETE_PINS_KEY, JSON.stringify(cloudAthletePins));
      }

      // 3. Athlete Avatars: Cloud is the single source of truth
      if (cloudAthleteAvatars && typeof cloudAthleteAvatars === 'object') {
        localStorage.setItem(ATHLETE_AVATARS_KEY, JSON.stringify(cloudAthleteAvatars));
      }

      // 4. Fines Enabled Days: Cloud takes priority
      if (cloudFinesEnabledDays && typeof cloudFinesEnabledDays === 'object') {
        localStorage.setItem('femperf_fines_enabled_days', JSON.stringify(cloudFinesEnabledDays));
      }

      // 5. Edited Profiles: Cloud is authoritative
      if (cloudEditedProfiles && typeof cloudEditedProfiles === 'object') {
        localStorage.setItem(EDITED_PROFILES_KEY, JSON.stringify(cloudEditedProfiles));
      }

      // 6. Custom Athletes: Cloud list is authoritative
      if (cloudCustomAthletes && Array.isArray(cloudCustomAthletes)) {
        localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(cloudCustomAthletes));
      }

      // 7. Deleted Athletes: Cloud list is authoritative
      if (cloudDeletedAthletes && Array.isArray(cloudDeletedAthletes)) {
        localStorage.setItem(DELETED_ATHLETES_KEY, JSON.stringify(cloudDeletedAthletes));
      }

      // 8. Inactive Athletes: Cloud list is authoritative (no stale merge!)
      if (cloudInactiveAthletes && Array.isArray(cloudInactiveAthletes)) {
        localStorage.setItem(INACTIVE_ATHLETES_KEY, JSON.stringify(cloudInactiveAthletes));
      }

      // 9. Reminder Config: Save to both v2 and v1 keys for 100% compatibility
      if (cloudReminderConfig && typeof cloudReminderConfig === 'object') {
        localStorage.setItem('femperf_reminder_settings_v2', JSON.stringify(cloudReminderConfig));
        localStorage.setItem('femperf_reminder_settings_v1', JSON.stringify(cloudReminderConfig));
      }

      window.dispatchEvent(new Event('femperf_credentials_updated'));
      return true;
    }
    return false;
  } catch (err) {
    console.warn('Erro ao sincronizar credenciais da nuvem:', err);
    return false;
  }
}

export async function syncAllDataFromCloud(): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Sync credentials / PINs first
  await syncCredentialsFromCloud();

  // 2. Sync training sessions & calendar schedule
  try {
    const res = await secureFetch(`/api/training-sessions?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    const remoteSessions = data?.sessions || data?.data?.sessions;
    const remoteSchedule = data?.schedule || data?.data?.schedule;
    if (remoteSessions || remoteSchedule) {
      const localSessions = getStoredTrainingSessions();
      const localSched = getStoredCalendarSchedule();
      const mergedSessions = { ...localSessions, ...(remoteSessions || {}) };
      const mergedSched = { ...localSched, ...(remoteSchedule || {}) };
      localStorage.setItem(TRAINING_SESSIONS_INFO_KEY, JSON.stringify(mergedSessions));
      localStorage.setItem(TRAINING_CALENDAR_KEY, JSON.stringify(mergedSched));
      dispatchDataUpdatedEvent();
    }
  } catch {}

  // 3. Sync Wellness Entries
  try {
    const res = await secureFetch(`/api/wellness?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    const items = data?.entries || data?.data;
    if (Array.isArray(items) && items.length > 0) {
      const local: WellnessEntry[] = JSON.parse(localStorage.getItem(WELLNESS_LOCAL_KEY) || '[]');
      const map = new Map<string, WellnessEntry>();
      const getKey = (item: WellnessEntry) => {
        if (item.athleteId && item.date) return `${item.athleteId}_${item.date}`;
        if (item.athleteName && item.date) return `${item.athleteName.toLowerCase().trim()}_${item.date}`;
        return item.id || `wel_${Math.random()}`;
      };
      local.forEach((item) => map.set(getKey(item), item));
      items.forEach((item) => map.set(getKey(item), item));
      const merged = Array.from(map.values());
      localStorage.setItem(WELLNESS_LOCAL_KEY, JSON.stringify(merged));
      dispatchDataUpdatedEvent();
    }
  } catch {}

  // 4. Sync RPE Entries
  try {
    const res = await secureFetch(`/api/rpe?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    const items = data?.entries || data?.data;
    if (Array.isArray(items) && items.length > 0) {
      const local: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
      const map = new Map<string, RPEEntry>();
      const getKey = (item: RPEEntry) => {
        if (item.athleteId && item.date) return `${item.athleteId}_${item.date}`;
        if (item.athleteName && item.date) return `${item.athleteName.toLowerCase().trim()}_${item.date}`;
        return item.id || `rpe_${Math.random()}`;
      };
      local.forEach((item) => map.set(getKey(item), item));
      items.forEach((item) => map.set(getKey(item), item));
      const merged = Array.from(map.values());
      localStorage.setItem(RPE_LOCAL_KEY, JSON.stringify(merged));
      dispatchDataUpdatedEvent();
    }
  } catch {}

  // 5. Sync Hydration Entries
  try {
    const res = await secureFetch(`/api/hydration?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();
    const items = data?.entries || data?.data;
    if (Array.isArray(items) && items.length > 0) {
      const local: HydrationEntry[] = JSON.parse(localStorage.getItem(HYDRATION_LOCAL_KEY) || '[]');
      const map = new Map<string, HydrationEntry>();
      const getKey = (item: HydrationEntry) => {
        if (item.athleteId && item.date) return `${item.athleteId}_${item.date}`;
        if (item.athleteName && item.date) return `${item.athleteName.toLowerCase().trim()}_${item.date}`;
        return item.id || `hyd_${Math.random()}`;
      };
      local.forEach((item) => map.set(getKey(item), item));
      items.forEach((item) => map.set(getKey(item), item));
      const merged = Array.from(map.values());
      localStorage.setItem(HYDRATION_LOCAL_KEY, JSON.stringify(merged));
      dispatchDataUpdatedEvent();
    }
  } catch {}
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
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ athletePins: { [athleteId]: pin } }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar PIN:', e);
  }
}

export function getClubActivationCode(): string {
  if (typeof window === 'undefined') return 'GVFC2026@';
  return localStorage.getItem(ACTIVATION_CODE_KEY) || 'GVFC2026@';
}

export function setClubActivationCode(code: string): void {
  if (typeof window === 'undefined') return;
  const upperCode = code.trim().toUpperCase();
  localStorage.setItem(ACTIVATION_CODE_KEY, upperCode);
  secureFetch('/api/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ activationCode: upperCode }),
  }).catch(() => {});
  window.dispatchEvent(new Event('femperf_credentials_updated'));
}

export function getAdminPin(): string {
  if (typeof window === 'undefined') return '2026';
  return localStorage.getItem(ADMIN_PIN_KEY) || '2026';
}

export function setAdminPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_PIN_KEY, pin);
  secureFetch('/api/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ adminPin: pin }),
  }).catch(() => {});
  window.dispatchEvent(new Event('femperf_credentials_updated'));
}

export function getPhysioPin(): string {
  if (typeof window === 'undefined') return '2026';
  return localStorage.getItem(PHYSIO_PIN_KEY) || '2026';
}

export function setPhysioPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PHYSIO_PIN_KEY, pin);
  secureFetch('/api/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ physioPin: pin }),
  }).catch(() => {});
  window.dispatchEvent(new Event('femperf_credentials_updated'));
}

const FINES_ENABLED_DAYS_KEY = 'femperf_fines_enabled_days';

export interface DayFineConfig {
  wellness: boolean;   // Aplica multa por falta de Wellness
  rpe: boolean;        // Aplica multa por falta de PSE (RPE)
  hydration: boolean;  // Aplica multa por falta de Pesagem (Pré/Pós)
}

export function normalizeDayFineConfig(
  rawVal: boolean | DayFineConfig | undefined,
  dayType?: CalendarDayType
): DayFineConfig {
  if (typeof rawVal === 'boolean') {
    return {
      wellness: rawVal,
      rpe: rawVal,
      hydration: rawVal,
    };
  }
  if (rawVal && typeof rawVal === 'object') {
    return {
      wellness: rawVal.wellness ?? true,
      rpe: rawVal.rpe ?? true,
      hydration: rawVal.hydration ?? true,
    };
  }
  const isActivity = dayType === 'training' || dayType === 'match';
  return {
    wellness: isActivity,
    rpe: isActivity,
    hydration: isActivity,
  };
}

export function isDayAnyFineActive(config: DayFineConfig): boolean {
  return !!(config.wellness || config.rpe || config.hydration);
}

export function getStoredFinesEnabledDays(): Record<string, boolean | DayFineConfig> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FINES_ENABLED_DAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFinesEnabledDays(map: Record<string, boolean | DayFineConfig>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FINES_ENABLED_DAYS_KEY, JSON.stringify(map));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ finesEnabledDays: map }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar isenções/multas por dia:', e);
  }
}

const CLEAN_SLATE_KEY = 'femperf_clean_slate_v3';

// Clear historical entries for a clean start with options for days and categories
export function clearAllHistoricalData(): void {
  clearSelectiveHistoricalData('all', ['wellness', 'rpe', 'hydration', 'training']);
}

export function clearSelectiveHistoricalData(days: string | number, menus: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    let cutoffDate: string | null = null;
    if (days !== 'all') {
      const daysNum = typeof days === 'number' ? days : parseInt(days, 10);
      if (!isNaN(daysNum)) {
        const d = new Date();
        d.setDate(d.getDate() - (daysNum - 1));
        cutoffDate = d.toISOString().split('T')[0];
      }
    }

    const filterOrRemove = (key: string) => {
      if (!cutoffDate) {
        localStorage.removeItem(key);
      } else {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const list: any[] = JSON.parse(raw);
            const filtered = list.filter((item) => item.date < cutoffDate);
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    };

    if (menus.includes('wellness')) filterOrRemove(WELLNESS_LOCAL_KEY);
    if (menus.includes('rpe')) filterOrRemove(RPE_LOCAL_KEY);
    if (menus.includes('hydration')) filterOrRemove(HYDRATION_LOCAL_KEY);
    if (menus.includes('training')) {
      filterOrRemove(TRAINING_SESSIONS_INFO_KEY);
      filterOrRemove(TRAINING_CALENDAR_KEY);
    }
    localStorage.setItem(CLEAN_SLATE_KEY, 'true');
  } catch (e) {
    console.error('Erro ao apagar dados históricos seletivamente:', e);
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

function dispatchDataUpdatedEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('femperf_data_updated'));
  }
}

// Offline / LocalStorage entries helper
export function saveWellnessLocally(entry: WellnessEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const list: WellnessEntry[] = JSON.parse(localStorage.getItem(WELLNESS_LOCAL_KEY) || '[]');
    const index = list.findIndex((item) => item.id === entry.id || (item.date === entry.date && item.athleteId === entry.athleteId));
    if (index !== -1) {
      list[index] = entry;
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(WELLNESS_LOCAL_KEY, JSON.stringify(list));
    secureFetch('/api/wellness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
    dispatchDataUpdatedEvent();
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
    if (!entry.sessionDurationMin || entry.sessionDurationMin <= 0) {
      const sessions = getStoredTrainingSessions();
      entry.sessionDurationMin = sessions[entry.date]?.durationMin || 90;
    }

    const list: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
    const index = list.findIndex((item) => item.id === entry.id || (item.date === entry.date && item.athleteId === entry.athleteId));
    if (index !== -1) {
      list[index] = entry;
    } else {
      list.unshift(entry);
    }
    localStorage.setItem(RPE_LOCAL_KEY, JSON.stringify(list));
    secureFetch('/api/rpe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
    dispatchDataUpdatedEvent();
  } catch (e) {
    console.error('Erro ao guardar RPE localmente:', e);
  }
}

export function getRPELocally(athleteId?: string): RPEEntry[] {
  if (typeof window === 'undefined') return [];
  purgeSyntheticDemoData();
  try {
    const list: RPEEntry[] = JSON.parse(localStorage.getItem(RPE_LOCAL_KEY) || '[]');
    const sessions = getStoredTrainingSessions();
    const resolved = list.map((item) => ({
      ...item,
      sessionDurationMin: item.sessionDurationMin || sessions[item.date]?.durationMin || 90,
    }));
    if (athleteId) {
      return resolved.filter((item) => item.athleteId === athleteId);
    }
    return resolved;
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
    secureFetch('/api/hydration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    }).catch(() => {});
    dispatchDataUpdatedEvent();
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
    secureFetch(`/api/hydration?id=${entryId}`, { method: 'DELETE' }).catch(() => {});
    dispatchDataUpdatedEvent();
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
    secureFetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'schedule', schedule: map }),
    }).catch(() => {});

    dispatchDataUpdatedEvent();
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

    secureFetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', info }),
    }).catch(() => {});
    dispatchDataUpdatedEvent();
  } catch (e) {
    console.error('Erro ao guardar informação de treino:', e);
  }
}

export function compressImageFile(file: File, callback: (dataUrl: string) => void): void {
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 350;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        callback(compressedDataUrl);
      }
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

