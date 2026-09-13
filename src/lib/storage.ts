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

export function saveAthleteProfile(athleteId: string, updates: { name?: string; position?: AthletePosition; avatarUrl?: string; pin?: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const editedMapRaw = localStorage.getItem(EDITED_PROFILES_KEY);
    const editedMap: Record<string, Partial<Athlete>> = editedMapRaw ? JSON.parse(editedMapRaw) : {};
    editedMap[athleteId] = { ...(editedMap[athleteId] || {}), ...updates };
    localStorage.setItem(EDITED_PROFILES_KEY, JSON.stringify(editedMap));

    const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
    if (customListRaw) {
      try {
        const customList: Athlete[] = JSON.parse(customListRaw);
        const idx = customList.findIndex((a) => a.id === athleteId);
        if (idx !== -1) {
          customList[idx] = { ...customList[idx], ...updates };
          localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(customList));
        }
      } catch {}
    }

    if (updates.avatarUrl !== undefined) {
      setAthleteAvatar(athleteId, updates.avatarUrl);
    }
    if (updates.pin !== undefined && updates.pin.length > 0) {
      setAthletePin(athleteId, updates.pin);
    }

    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ editedProfiles: editedMap }),
    }).catch(() => {});

    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar perfil da jogadora:', e);
  }
}

export function addNewAthlete(name: string, position: AthletePosition = 'Campo', pin?: string, avatarUrl?: string): Athlete {
  const newId = `ath-custom-${Date.now()}`;
  const newAth: Athlete = {
    id: newId,
    name: name.trim().toUpperCase(),
    position,
    avatarUrl,
  };

  if (typeof window !== 'undefined') {
    try {
      const customListRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
      const customList: Athlete[] = customListRaw ? JSON.parse(customListRaw) : [];
      customList.push(newAth);
      localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(customList));

      if (pin) {
        setAthletePin(newId, pin);
      }
      if (avatarUrl) {
        setAthleteAvatar(newId, avatarUrl);
      }

      secureFetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customAthletes: customList }),
      }).catch(() => {});

      window.dispatchEvent(new Event('femperf_credentials_updated'));
    } catch (e) {
      console.error('Erro ao adicionar nova jogadora:', e);
    }
  }

  return newAth;
}

export function deleteAthlete(athleteId: string): void {
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

    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customAthletes: filtered, deletedAthletes: deletedList }),
    }).catch(() => {});

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

export function syncCredentialsFromCloud(): void {
  if (typeof window === 'undefined') return;
  secureFetch('/api/credentials')
    .then((res) => res.json())
    .then((data) => {
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
        } = data.data;

        const localAthletePinsRaw = localStorage.getItem(ATHLETE_PINS_KEY);
        let localAthletePins: { [id: string]: string } = {};
        try {
          if (localAthletePinsRaw) localAthletePins = JSON.parse(localAthletePinsRaw);
        } catch {}

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

        // 2. Athlete PINs: Cloud overrides local stale PINs
        const mergedAthletePins = { ...localAthletePins, ...(cloudAthletePins || {}) };
        localStorage.setItem(ATHLETE_PINS_KEY, JSON.stringify(mergedAthletePins));

        // 3. Athlete Avatars Sync: Cloud overrides local
        const localAvatarsRaw = localStorage.getItem(ATHLETE_AVATARS_KEY);
        let localAvatars: { [id: string]: string } = {};
        try {
          if (localAvatarsRaw) localAvatars = JSON.parse(localAvatarsRaw);
        } catch {}

        const mergedAvatars = { ...localAvatars, ...(cloudAthleteAvatars || {}) };
        localStorage.setItem(ATHLETE_AVATARS_KEY, JSON.stringify(mergedAvatars));

        // 4. Fines Enabled Days Sync: Cloud overrides local
        const localFinesEnabledDaysRaw = localStorage.getItem('femperf_fines_enabled_days');
        let localFinesEnabledDays: { [date: string]: boolean } = {};
        try {
          if (localFinesEnabledDaysRaw) localFinesEnabledDays = JSON.parse(localFinesEnabledDaysRaw);
        } catch {}

        const mergedFinesEnabledDays = { ...(cloudFinesEnabledDays || {}), ...localFinesEnabledDays };
        localStorage.setItem('femperf_fines_enabled_days', JSON.stringify(mergedFinesEnabledDays));

        // 5. Edited Profiles Sync
        if (cloudEditedProfiles) {
          const localEditedRaw = localStorage.getItem(EDITED_PROFILES_KEY);
          let localEdited = {};
          try { if (localEditedRaw) localEdited = JSON.parse(localEditedRaw); } catch {}
          const mergedEdited = { ...localEdited, ...cloudEditedProfiles };
          localStorage.setItem(EDITED_PROFILES_KEY, JSON.stringify(mergedEdited));
        }

        // 6. Custom Athletes Sync
        if (cloudCustomAthletes && Array.isArray(cloudCustomAthletes)) {
          const localCustomRaw = localStorage.getItem(CUSTOM_ATHLETES_KEY);
          let localCustom: Athlete[] = [];
          try { if (localCustomRaw) localCustom = JSON.parse(localCustomRaw); } catch {}
          const map = new Map<string, Athlete>();
          localCustom.forEach((a) => map.set(a.id, a));
          cloudCustomAthletes.forEach((a: Athlete) => map.set(a.id, a));
          localStorage.setItem(CUSTOM_ATHLETES_KEY, JSON.stringify(Array.from(map.values())));
        }

        // 7. Deleted Athletes Sync
        if (data.data.deletedAthletes && Array.isArray(data.data.deletedAthletes)) {
          const localDeleted = getDeletedAthleteIds();
          const mergedDeleted = Array.from(new Set([...localDeleted, ...data.data.deletedAthletes]));
          localStorage.setItem(DELETED_ATHLETES_KEY, JSON.stringify(mergedDeleted));
        }

        // 8. Inactive Athletes Sync
        if (data.data.inactiveAthletes && Array.isArray(data.data.inactiveAthletes)) {
          const localInactive = getInactiveAthleteIds();
          const mergedInactive = Array.from(new Set([...localInactive, ...data.data.inactiveAthletes]));
          localStorage.setItem(INACTIVE_ATHLETES_KEY, JSON.stringify(mergedInactive));
        }

        // 9. Reminder Config Sync
        if (data.data.reminderConfig) {
          localStorage.setItem('femperf_reminder_settings_v1', JSON.stringify(data.data.reminderConfig));
        }

        window.dispatchEvent(new Event('femperf_credentials_updated'));
      }
    })
    .catch(() => {});
}

export function syncAllDataFromCloud(): void {
  if (typeof window === 'undefined') return;

  // 1. Sync credentials / PINs
  syncCredentialsFromCloud();

  // 2. Sync training sessions & calendar schedule
  secureFetch('/api/training-sessions')
    .then((res) => res.json())
    .then((data) => {
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
    })
    .catch(() => {});

  // 3. Sync Wellness Entries
  secureFetch('/api/wellness')
    .then((res) => res.json())
    .then((data) => {
      const items = data?.entries || data?.data;
      if (Array.isArray(items) && items.length > 0) {
        try {
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
        } catch {}
      }
    })
    .catch(() => {});

  // 4. Sync RPE Entries
  secureFetch('/api/rpe')
    .then((res) => res.json())
    .then((data) => {
      const items = data?.entries || data?.data;
      if (Array.isArray(items) && items.length > 0) {
        try {
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
        } catch {}
      }
    })
    .catch(() => {});

  // 5. Sync Hydration Entries
  secureFetch('/api/hydration')
    .then((res) => res.json())
    .then((data) => {
      const items = data?.entries || data?.data;
      if (Array.isArray(items) && items.length > 0) {
        try {
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
        } catch {}
      }
    })
    .catch(() => {});
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
  if (typeof window === 'undefined') return 'GVFC2026';
  return localStorage.getItem(ACTIVATION_CODE_KEY) || 'GVFC2026';
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

export function getStoredFinesEnabledDays(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FINES_ENABLED_DAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFinesEnabledDays(map: Record<string, boolean>): void {
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

