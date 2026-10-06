import { Athlete, AthletePosition, WellnessEntry, RPEEntry, HydrationEntry, TrainingSessionInfo, QuestionnaireDeadlinesConfig, LateSubmissionAuthorization, IndividualFineExemption } from './types';
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
export const DEADLINE_SETTINGS_KEY = 'femperf_deadline_settings_v1';

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
        individualFineExemptions: cloudIndividualFineExemptions,
        editedProfiles: cloudEditedProfiles,
        customAthletes: cloudCustomAthletes,
        deletedAthletes: cloudDeletedAthletes,
        inactiveAthletes: cloudInactiveAthletes,
        reminderConfig: cloudReminderConfig,
        deadlineConfig: cloudDeadlineConfig,
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

      // 4b. Individual Fine Exemptions: Cloud takes priority
      if (cloudIndividualFineExemptions && typeof cloudIndividualFineExemptions === 'object') {
        localStorage.setItem(FINE_EXEMPTIONS_KEY, JSON.stringify(cloudIndividualFineExemptions));
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

      // 10. Deadline Config: Cloud is authoritative
      if (cloudDeadlineConfig && typeof cloudDeadlineConfig === 'object') {
        localStorage.setItem(DEADLINE_SETTINGS_KEY, JSON.stringify(cloudDeadlineConfig));
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
      const mergedSessions: Record<string, TrainingSessionInfo> = { ...localSessions };
      if (remoteSessions) {
        Object.keys(remoteSessions).forEach((d) => {
          const loc = localSessions[d];
          const rem = remoteSessions[d];
          if (!loc) {
            mergedSessions[d] = rem;
            return;
          }
          if (!rem) {
            mergedSessions[d] = loc;
            return;
          }

          const locTime = loc.updatedAt || 0;
          const remTime = rem.updatedAt || 0;

          if (locTime > remTime) {
            // Local is newer: preserve local customizations completely
            mergedSessions[d] = {
              ...rem,
              ...loc,
            };
          } else if (remTime > locTime) {
            // Remote is newer: preserve remote customizations completely
            mergedSessions[d] = {
              ...loc,
              ...rem,
            };
          } else {
            // Timestamps equal or not yet set:
            // Never let remote default values overwrite user-customized local values
            const locHasCustomTime = loc.startTime && (loc.startTime !== '09:00' || loc.dayType === 'match');
            const remHasCustomTime = rem.startTime && (rem.startTime !== '09:00' || rem.dayType === 'match');

            let bestStartTime = loc.startTime || rem.startTime || (loc.dayType === 'match' ? '10:00' : '09:00');
            let bestEndTime = loc.endTime || rem.endTime || (loc.dayType === 'match' ? '11:30' : '10:30');

            if (locHasCustomTime && !remHasCustomTime) {
              bestStartTime = loc.startTime!;
              bestEndTime = loc.endTime || bestEndTime;
            } else if (remHasCustomTime && !locHasCustomTime) {
              bestStartTime = rem.startTime!;
              bestEndTime = rem.endTime || bestEndTime;
            } else if (loc.startTime) {
              bestStartTime = loc.startTime;
              bestEndTime = loc.endTime || bestEndTime;
            }

            mergedSessions[d] = {
              ...rem,
              ...loc,
              dayType: loc.dayType || rem.dayType,
              matchCategory: loc.matchCategory || rem.matchCategory || undefined,
              startTime: bestStartTime,
              endTime: bestEndTime,
              customDeadlineWellness: loc.customDeadlineWellness || rem.customDeadlineWellness || undefined,
              customDeadlineRpe: loc.customDeadlineRpe || rem.customDeadlineRpe || undefined,
            };
          }
        });
      }
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

export const FINE_EXEMPTIONS_KEY = 'femperf_individual_fine_exemptions';

export function getStoredFineExemptions(): Record<string, IndividualFineExemption> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(FINE_EXEMPTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveFineExemption(exemption: IndividualFineExemption): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredFineExemptions();
    const key = `${exemption.athleteId}_${exemption.date}_${exemption.type}`;
    current[key] = exemption;
    localStorage.setItem(FINE_EXEMPTIONS_KEY, JSON.stringify(current));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ individualFineExemptions: current }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_fines_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao guardar isenção individual de multa:', e);
  }
}

export function removeFineExemption(athleteId: string, date: string, type: 'wellness' | 'rpe' | 'hydration' | 'all'): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getStoredFineExemptions();
    const key = `${athleteId}_${date}_${type}`;
    delete current[key];
    if (type === 'all') {
      delete current[`${athleteId}_${date}_wellness`];
      delete current[`${athleteId}_${date}_rpe`];
      delete current[`${athleteId}_${date}_hydration`];
    }
    localStorage.setItem(FINE_EXEMPTIONS_KEY, JSON.stringify(current));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ individualFineExemptions: current }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_fines_updated'));
    window.dispatchEvent(new Event('femperf_credentials_updated'));
  } catch (e) {
    console.error('Erro ao remover isenção individual de multa:', e);
  }
}

export function isFineExempt(
  exemptions: Record<string, IndividualFineExemption>,
  athleteId: string,
  athleteName: string,
  date: string,
  type: 'wellness' | 'rpe' | 'hydration'
): boolean {
  if (!exemptions) return false;
  // Check exact id match
  if (exemptions[`${athleteId}_${date}_${type}`]) return true;
  if (exemptions[`${athleteId}_${date}_all`]) return true;

  // Check slugified athleteName match for robustness
  if (athleteName) {
    const nameSlug = athleteName.trim().toLowerCase().replace(/\s+/g, '-');
    if (exemptions[`${nameSlug}_${date}_${type}`]) return true;
    if (exemptions[`${nameSlug}_${date}_all`]) return true;
  }
  return false;
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
    const cleanInfo = { ...info };
    if (!cleanInfo.customDeadline || !cleanInfo.customDeadline.trim()) delete cleanInfo.customDeadline;
    if (!cleanInfo.customDeadlineWellness || !cleanInfo.customDeadlineWellness.trim()) delete cleanInfo.customDeadlineWellness;
    if (!cleanInfo.customDeadlineRpe || !cleanInfo.customDeadlineRpe.trim()) delete cleanInfo.customDeadlineRpe;
    cleanInfo.updatedAt = cleanInfo.updatedAt || Date.now();
    map[info.date] = cleanInfo;
    localStorage.setItem(TRAINING_SESSIONS_INFO_KEY, JSON.stringify(map));

    const schedule = getStoredCalendarSchedule();
    schedule[info.date] = info.dayType;
    localStorage.setItem(TRAINING_CALENDAR_KEY, JSON.stringify(schedule));

    if (info.customDeadline !== undefined || info.customDeadlineWellness !== undefined || info.customDeadlineRpe !== undefined) {
      const dConfig = getStoredDeadlineConfig();
      const customMap = { ...(dConfig.customDateDeadlines || {}) };
      const customWellnessMap = { ...(dConfig.customDateDeadlinesWellness || {}) };
      const customRpeMap = { ...(dConfig.customDateDeadlinesRpe || {}) };

      if (info.customDeadline && info.customDeadline.trim()) {
        customMap[info.date] = info.customDeadline.trim();
      } else if (info.customDeadline !== undefined) {
        delete customMap[info.date];
      }

      if (info.customDeadlineWellness && info.customDeadlineWellness.trim()) {
        customWellnessMap[info.date] = info.customDeadlineWellness.trim();
      } else if (info.customDeadlineWellness !== undefined) {
        delete customWellnessMap[info.date];
      }

      if (info.customDeadlineRpe && info.customDeadlineRpe.trim()) {
        customRpeMap[info.date] = info.customDeadlineRpe.trim();
      } else if (info.customDeadlineRpe !== undefined) {
        delete customRpeMap[info.date];
      }

      dConfig.customDateDeadlines = customMap;
      dConfig.customDateDeadlinesWellness = customWellnessMap;
      dConfig.customDateDeadlinesRpe = customRpeMap;
      saveDeadlineConfig(dConfig);
    }

    secureFetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', info: cleanInfo }),
    }).catch(() => {});
    dispatchDataUpdatedEvent();
  } catch (e) {
    console.error('Erro ao guardar informação de treino:', e);
  }
}

export async function saveTrainingSessionInfoAsync(info: TrainingSessionInfo): Promise<boolean> {
  saveTrainingSessionInfo(info);
  try {
    const cleanInfo = {
      ...info,
      updatedAt: info.updatedAt || Date.now(),
    };
    if (!cleanInfo.customDeadline || !cleanInfo.customDeadline.trim()) delete cleanInfo.customDeadline;
    if (!cleanInfo.customDeadlineWellness || !cleanInfo.customDeadlineWellness.trim()) delete cleanInfo.customDeadlineWellness;
    if (!cleanInfo.customDeadlineRpe || !cleanInfo.customDeadlineRpe.trim()) delete cleanInfo.customDeadlineRpe;

    const res = await secureFetch('/api/training-sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'session', info: cleanInfo }),
    });
    return res.ok;
  } catch {
    return false;
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

// ---------------------------------------------------------------------------
// QUESTIONNAIRE DEADLINES & CUTOFF MANAGEMENT
// ---------------------------------------------------------------------------

export const DEFAULT_DEADLINE_CONFIG: QuestionnaireDeadlinesConfig = {
  enabled: true,
  mode: 'fixed',
  defaultRegularTime: '08:15',
  defaultMatchTime: '11:00',
  relativeMinutesBeforeSession: 60,
  strictBlock: true,
  allowLateWithApproval: false,
  applyToWellness: true,
  applyToRpe: true,
  applyToHydration: false,
  wellnessRegularTime: '08:15',
  wellnessMatchTime: '11:00',
  wellnessRelativeMinutesBefore: 60,
  rpeRegularTime: '14:00',
  rpeMatchTime: '22:00',
  rpeRelativeMinutesAfter: 90,
  customDateDeadlines: {},
  customDateDeadlinesWellness: {},
  customDateDeadlinesRpe: {},
  athleteLateAuthorizations: {},
};

export function getStoredDeadlineConfig(): QuestionnaireDeadlinesConfig {
  if (typeof window === 'undefined') return DEFAULT_DEADLINE_CONFIG;
  try {
    const raw = localStorage.getItem(DEADLINE_SETTINGS_KEY);
    if (!raw) return DEFAULT_DEADLINE_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_DEADLINE_CONFIG,
      ...parsed,
      strictBlock: parsed.strictBlock !== undefined ? Boolean(parsed.strictBlock) : true,
      allowLateWithApproval: parsed.allowLateWithApproval ? true : false,
      customDateDeadlines: {
        ...(DEFAULT_DEADLINE_CONFIG.customDateDeadlines || {}),
        ...(parsed.customDateDeadlines || {}),
      },
      customDateDeadlinesWellness: {
        ...(DEFAULT_DEADLINE_CONFIG.customDateDeadlinesWellness || {}),
        ...(parsed.customDateDeadlinesWellness || {}),
      },
      customDateDeadlinesRpe: {
        ...(DEFAULT_DEADLINE_CONFIG.customDateDeadlinesRpe || {}),
        ...(parsed.customDateDeadlinesRpe || {}),
      },
      athleteLateAuthorizations: {
        ...(DEFAULT_DEADLINE_CONFIG.athleteLateAuthorizations || {}),
        ...(parsed.athleteLateAuthorizations || {}),
      },
    };
  } catch {
    return DEFAULT_DEADLINE_CONFIG;
  }
}

export function saveDeadlineConfig(config: QuestionnaireDeadlinesConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DEADLINE_SETTINGS_KEY, JSON.stringify(config));
    secureFetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deadlineConfig: config }),
    }).catch(() => {});
    window.dispatchEvent(new Event('femperf_credentials_updated'));
    window.dispatchEvent(new Event('femperf_data_updated'));
  } catch (e) {
    console.error('Erro ao guardar configurações de prazos:', e);
  }
}

export interface EffectiveDeadlineResult {
  hasDeadline: boolean;
  deadlineTime: string; // "HH:mm"
  isMatchDay: boolean;
  isTrainingDay: boolean;
  isRestDay: boolean;
  isCustom: boolean;
  isRelativeToSession: boolean;
  sessionStartTime?: string;
  sourceDescription: string;
}

export function getEffectiveDeadlineForDate(
  dateStr: string,
  questionnaireType: 'wellness' | 'rpe' | 'hydration' = 'wellness'
): EffectiveDeadlineResult {
  const config = getStoredDeadlineConfig();
  if (!config.enabled) {
    return {
      hasDeadline: false,
      deadlineTime: '23:59',
      isMatchDay: false,
      isTrainingDay: false,
      isRestDay: false,
      isCustom: false,
      isRelativeToSession: false,
      sourceDescription: 'Sem limite de horário ativo',
    };
  }

  // Check if deadline applies to this questionnaire type
  if (questionnaireType === 'wellness' && !config.applyToWellness) {
    return {
      hasDeadline: false,
      deadlineTime: '23:59',
      isMatchDay: false,
      isTrainingDay: false,
      isRestDay: false,
      isCustom: false,
      isRelativeToSession: false,
      sourceDescription: 'Sem limite ativo para Wellness',
    };
  }
  if (questionnaireType === 'rpe' && !config.applyToRpe) {
    return {
      hasDeadline: false,
      deadlineTime: '23:59',
      isMatchDay: false,
      isTrainingDay: false,
      isRestDay: false,
      isCustom: false,
      isRelativeToSession: false,
      sourceDescription: 'Sem limite ativo para PSE',
    };
  }
  if (questionnaireType === 'hydration' && !config.applyToHydration) {
    return {
      hasDeadline: false,
      deadlineTime: '23:59',
      isMatchDay: false,
      isTrainingDay: false,
      isRestDay: false,
      isCustom: false,
      isRelativeToSession: false,
      sourceDescription: 'Sem limite ativo para Pesagem',
    };
  }

  const schedule = getStoredCalendarSchedule();
  const sessions = getStoredTrainingSessions();
  const session = sessions[dateStr];
  const dayType = schedule[dateStr] || session?.dayType || 'training';
  const isMatchDay = dayType === 'match';
  const isTrainingDay = dayType === 'training';
  const isRestDay = dayType === 'rest';

  // 1. Specific custom deadline for this date and questionnaireType
  let customDeadline: string | undefined = undefined;
  if (questionnaireType === 'wellness') {
    customDeadline =
      (config.customDateDeadlinesWellness && config.customDateDeadlinesWellness[dateStr]) ||
      session?.customDeadlineWellness ||
      (config.customDateDeadlines && config.customDateDeadlines[dateStr]) ||
      session?.customDeadline;
  } else if (questionnaireType === 'rpe') {
    customDeadline =
      (config.customDateDeadlinesRpe && config.customDateDeadlinesRpe[dateStr]) ||
      session?.customDeadlineRpe ||
      (config.customDateDeadlines && config.customDateDeadlines[dateStr]) ||
      session?.customDeadline;
  } else {
    customDeadline = (config.customDateDeadlines && config.customDateDeadlines[dateStr]) || session?.customDeadline;
  }

  if (customDeadline && customDeadline.includes(':')) {
    return {
      hasDeadline: true,
      deadlineTime: customDeadline,
      isMatchDay,
      isTrainingDay,
      isRestDay,
      isCustom: true,
      isRelativeToSession: false,
      sessionStartTime: session?.startTime,
      sourceDescription: `Personalizado para ${questionnaireType.toUpperCase()} (${customDeadline})`,
    };
  }

  // 2. Specific session schedule defined ("outro horário no treino ou jogo")
  // Whenever the coach defines another schedule for the training or match:
  // - A match day with a scheduled start time
  // - A training with a specific startTime (differing from standard 09:00 morning session)
  // - Or global mode is 'relative_to_session'
  // The default fixed time is automatically deactivated for this session!
  const hasSpecificSchedule = Boolean(
    session?.startTime &&
    session.startTime.includes(':') &&
    (
      isMatchDay ||
      session.startTime !== '09:00' ||
      config.mode === 'relative_to_session'
    )
  );

  if (hasSpecificSchedule && session?.startTime) {
    if (questionnaireType === 'wellness') {
      const [h, m] = session.startTime.split(':').map(Number);
      const sessionMinutes = (h || 0) * 60 + (m || 0);
      const relMin = config.wellnessRelativeMinutesBefore || config.relativeMinutesBeforeSession || 60;
      let targetMin = sessionMinutes - relMin;
      if (targetMin < 0) targetMin = 0;
      const tH = Math.floor(targetMin / 60);
      const tM = targetMin % 60;
      const calcTime = `${String(tH).padStart(2, '0')}:${String(tM).padStart(2, '0')}`;
      return {
        hasDeadline: true,
        deadlineTime: calcTime,
        isMatchDay,
        isTrainingDay,
        isRestDay,
        isCustom: false,
        isRelativeToSession: true,
        sessionStartTime: session.startTime,
        sourceDescription: `Auto ${isMatchDay ? 'Jogo' : 'Treino'} das ${session.startTime} (${relMin}min antes: ${calcTime})`,
      };
    } else if (questionnaireType === 'rpe') {
      const baseTime = session.endTime || session.startTime;
      const [h, m] = baseTime.split(':').map(Number);
      const baseMinutes = (h || 0) * 60 + (m || 0) + (session.endTime ? 0 : 90);
      const relMin = config.rpeRelativeMinutesAfter || 60;
      let targetMin = baseMinutes + relMin;
      if (targetMin > 1439) targetMin = 1439;
      const tH = Math.floor(targetMin / 60);
      const tM = targetMin % 60;
      const calcTime = `${String(tH).padStart(2, '0')}:${String(tM).padStart(2, '0')}`;
      return {
        hasDeadline: true,
        deadlineTime: calcTime,
        isMatchDay,
        isTrainingDay,
        isRestDay,
        isCustom: false,
        isRelativeToSession: true,
        sessionStartTime: session.startTime,
        sourceDescription: `Auto ${isMatchDay ? 'Jogo' : 'Treino'} (Fim ${baseTime} +${relMin}min: ${calcTime})`,
      };
    }
  }

  // 3. Match day fallback logic (when no specific startTime was scheduled for the match)
  if (isMatchDay) {
    let matchTime = config.defaultMatchTime || '11:00';
    if (questionnaireType === 'wellness') {
      matchTime = config.wellnessMatchTime || config.defaultMatchTime || '11:00';
    } else if (questionnaireType === 'rpe') {
      matchTime = config.rpeMatchTime || config.defaultMatchTime || '22:00';
    }

    return {
      hasDeadline: true,
      deadlineTime: matchTime,
      isMatchDay: true,
      isTrainingDay: false,
      isRestDay: false,
      isCustom: false,
      isRelativeToSession: false,
      sessionStartTime: session?.startTime,
      sourceDescription: `Dia de Jogo Padrão (${matchTime})`,
    };
  }

  // 4. Default regular time (standard 10:00 training / rest fixed)
  let regTime = config.defaultRegularTime || '08:15';
  if (questionnaireType === 'wellness') {
    regTime = config.wellnessRegularTime || config.defaultRegularTime || '08:15';
  } else if (questionnaireType === 'rpe') {
    regTime = config.rpeRegularTime || '14:00';
  }

  return {
    hasDeadline: true,
    deadlineTime: regTime,
    isMatchDay: false,
    isTrainingDay,
    isRestDay,
    isCustom: false,
    isRelativeToSession: false,
    sessionStartTime: session?.startTime,
    sourceDescription: isRestDay ? `Dia de Folga (${regTime})` : `Regra Geral (${regTime})`,
  };
}

export interface DeadlineCheckResult {
  hasDeadline: boolean;
  isPast: boolean;
  strictBlock: boolean;
  isAuthorizedLate?: boolean;
  allowLateWithApproval?: boolean;
  requireApproval?: boolean;
  deadlineTime: string;
  minutesLeft: number;
  minutesRemaining?: number;
  formattedTimeLeft: string;
  effectiveInfo: EffectiveDeadlineResult;
}

export function isAthleteAuthorizedForLateSubmission(
  athleteId: string,
  dateStr?: string,
  questionnaireType: 'wellness' | 'rpe' | 'hydration' = 'wellness'
): boolean {
  if (!athleteId) return false;
  const config = getStoredDeadlineConfig();
  const auths = config.athleteLateAuthorizations || {};

  // 1. Check date-specific authorization: `${athleteId}_${dateStr}`
  if (dateStr) {
    const dateKey = `${athleteId}_${dateStr}`;
    const dateAuth = auths[dateKey];
    if (dateAuth) {
      if (!dateAuth.questionnaireType || dateAuth.questionnaireType === 'all' || dateAuth.questionnaireType === questionnaireType) {
        return true;
      }
    }
  }

  // 2. Check permanent / general authorization: athleteId
  const permAuth = auths[athleteId];
  if (permAuth) {
    if (!permAuth.date || !dateStr || permAuth.date === dateStr) {
      if (!permAuth.questionnaireType || permAuth.questionnaireType === 'all' || permAuth.questionnaireType === questionnaireType) {
        return true;
      }
    }
  }

  return false;
}

export function grantAthleteLateAuthorization(
  athleteId: string,
  athleteName: string,
  dateStr?: string,
  questionnaireType: 'all' | 'wellness' | 'rpe' | 'hydration' = 'all'
): void {
  const config = getStoredDeadlineConfig();
  const auths = { ...(config.athleteLateAuthorizations || {}) };
  const key = dateStr ? `${athleteId}_${dateStr}` : athleteId;

  auths[key] = {
    athleteId,
    athleteName,
    date: dateStr || undefined,
    questionnaireType,
    grantedAt: new Date().toISOString(),
    grantedBy: 'Admin',
  };

  config.athleteLateAuthorizations = auths;
  saveDeadlineConfig(config);
}

export function revokeAthleteLateAuthorization(
  athleteId: string,
  dateStr?: string
): void {
  const config = getStoredDeadlineConfig();
  const auths = { ...(config.athleteLateAuthorizations || {}) };

  if (dateStr) {
    delete auths[`${athleteId}_${dateStr}`];
  }
  delete auths[athleteId];

  config.athleteLateAuthorizations = auths;
  saveDeadlineConfig(config);
}

export function getAllAthleteLateAuthorizations(): LateSubmissionAuthorization[] {
  const config = getStoredDeadlineConfig();
  const auths = config.athleteLateAuthorizations || {};
  return Object.values(auths);
}

export function isSubmissionPastDeadline(
  dateStr: string,
  questionnaireType: 'wellness' | 'rpe' | 'hydration' = 'wellness',
  athleteId?: string
): DeadlineCheckResult {
  const config = getStoredDeadlineConfig();
  const effective = getEffectiveDeadlineForDate(dateStr, questionnaireType);

  // Check if this specific athlete is authorized by the coach to submit late
  const isAuthorized = Boolean(athleteId && isAthleteAuthorizedForLateSubmission(athleteId, dateStr, questionnaireType));

  // Policy resolution:
  // - If authorized VIP: never blocked, never pending (always immediately approved)
  // - If strictBlock is true: player is strictly blocked from filling/submitting (unless authorized VIP)
  // - If allowLateWithApproval is true and strictBlock is false: player can submit, but requires coach approval
  // - Otherwise: player can submit directly with late tag
  const isStrictBlock = Boolean(config.strictBlock);
  const allowLateWithApproval = !isStrictBlock && Boolean(config.allowLateWithApproval);
  const effectiveStrictBlock = isAuthorized ? false : isStrictBlock;

  if (!config.enabled || !effective.hasDeadline) {
    return {
      hasDeadline: false,
      isPast: false,
      strictBlock: false,
      isAuthorizedLate: isAuthorized,
      allowLateWithApproval,
      requireApproval: false,
      deadlineTime: '23:59',
      minutesLeft: 9999,
      minutesRemaining: 9999,
      formattedTimeLeft: '',
      effectiveInfo: effective,
    };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // If the target date is in the past (e.g. yesterday), it is past deadline
  if (dateStr < todayStr) {
    const requireApproval = !isAuthorized && allowLateWithApproval;
    return {
      hasDeadline: true,
      isPast: true,
      strictBlock: effectiveStrictBlock,
      isAuthorizedLate: isAuthorized,
      allowLateWithApproval,
      requireApproval,
      deadlineTime: effective.deadlineTime,
      minutesLeft: -1,
      minutesRemaining: -1,
      formattedTimeLeft: isAuthorized ? 'Autorizada pelo Treinador' : (requireApproval ? 'Requer aprovação' : 'Prazo expirado'),
      effectiveInfo: effective,
    };
  }

  // If target date is in the future, it is not past deadline yet
  if (dateStr > todayStr) {
    return {
      hasDeadline: true,
      isPast: false,
      strictBlock: effectiveStrictBlock,
      isAuthorizedLate: isAuthorized,
      allowLateWithApproval,
      requireApproval: false,
      deadlineTime: effective.deadlineTime,
      minutesLeft: 9999,
      minutesRemaining: 9999,
      formattedTimeLeft: `Até às ${effective.deadlineTime}`,
      effectiveInfo: effective,
    };
  }

  // Target date is today: compare current time HH:mm with effective.deadlineTime
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [dH, dM] = effective.deadlineTime.split(':').map(Number);
  const deadlineMinutes = (dH || 0) * 60 + (dM || 0);

  const diff = deadlineMinutes - currentMinutes;
  const isPast = diff <= 0;
  const requireApproval = isPast && !isAuthorized && allowLateWithApproval;

  let formattedTimeLeft = '';
  if (isPast) {
    formattedTimeLeft = isAuthorized ? 'Autorizada pelo Treinador' : (requireApproval ? 'Requer aprovação do treinador' : 'Prazo expirado');
  } else if (diff < 60) {
    formattedTimeLeft = `restam ${diff} min`;
  } else {
    const hLeft = Math.floor(diff / 60);
    const mLeft = diff % 60;
    formattedTimeLeft = mLeft > 0 ? `restam ${hLeft}h ${mLeft}m` : `restam ${hLeft}h`;
  }

  return {
    hasDeadline: true,
    isPast,
    strictBlock: effectiveStrictBlock,
    isAuthorizedLate: isAuthorized,
    allowLateWithApproval,
    requireApproval,
    deadlineTime: effective.deadlineTime,
    minutesLeft: diff,
    minutesRemaining: diff,
    formattedTimeLeft,
    effectiveInfo: effective,
  };
}

export function approveWellnessSubmission(entryId: string, reviewer = 'Treinador', keepFine = false): void {
  const list = getWellnessLocally();
  const index = list.findIndex((w) => w.id === entryId);
  if (index !== -1) {
    list[index].approvalStatus = 'approved';
    list[index].keepFine = keepFine;
    list[index].reviewedAt = new Date().toISOString();
    list[index].reviewedBy = reviewer;
    saveWellnessLocally(list[index]);
  }
}

export function rejectWellnessSubmission(entryId: string, reviewer = 'Treinador'): void {
  const list = getWellnessLocally();
  const index = list.findIndex((w) => w.id === entryId);
  if (index !== -1) {
    list[index].approvalStatus = 'rejected';
    list[index].reviewedAt = new Date().toISOString();
    list[index].reviewedBy = reviewer;
    saveWellnessLocally(list[index]);
  }
}

export function approveRPESubmission(entryId: string, reviewer = 'Treinador', keepFine = false): void {
  const list = getRPELocally();
  const index = list.findIndex((r) => r.id === entryId);
  if (index !== -1) {
    list[index].approvalStatus = 'approved';
    list[index].keepFine = keepFine;
    list[index].reviewedAt = new Date().toISOString();
    list[index].reviewedBy = reviewer;
    saveRPELocally(list[index]);
  }
}

export function rejectRPESubmission(entryId: string, reviewer = 'Treinador'): void {
  const list = getRPELocally();
  const index = list.findIndex((r) => r.id === entryId);
  if (index !== -1) {
    list[index].approvalStatus = 'rejected';
    list[index].reviewedAt = new Date().toISOString();
    list[index].reviewedBy = reviewer;
    saveRPELocally(list[index]);
  }
}

export function approveAllPendingSubmissions(dateStr?: string, reviewer = 'Treinador', keepFine = false): void {
  const wList = getWellnessLocally();
  wList.forEach((w) => {
    if (w.approvalStatus === 'pending' && (!dateStr || w.date === dateStr)) {
      w.approvalStatus = 'approved';
      w.keepFine = keepFine;
      w.reviewedAt = new Date().toISOString();
      w.reviewedBy = reviewer;
      saveWellnessLocally(w);
    }
  });

  const rList = getRPELocally();
  rList.forEach((r) => {
    if (r.approvalStatus === 'pending' && (!dateStr || r.date === dateStr)) {
      r.approvalStatus = 'approved';
      r.keepFine = keepFine;
      r.reviewedAt = new Date().toISOString();
      r.reviewedBy = reviewer;
      saveRPELocally(r);
    }
  });
}

export function formatSubmissionTime(dateOrIso?: string): string {
  if (!dateOrIso) return '-';
  const str = dateOrIso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return '-';
  }
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    return str.substring(0, 5);
  }
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

