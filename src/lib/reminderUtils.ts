import { WellnessEntry, RPEEntry, HydrationEntry } from './types';
import { getWellnessLocally, getRPELocally, getHydrationLocally } from './storage';

export const REMINDER_SETTINGS_KEY = 'femperf_reminder_settings_v1';
export const LAST_NOTIFICATION_TIMESTAMP_KEY = 'femperf_last_notification_ts';

export interface ReminderConfig {
  enabled: boolean;
  wellnessTime: string; // "09:00"
  rpeTime: string; // "18:00"
  hydrationTime?: string; // legacy fallback
  preHydrationTime: string; // "10:00" (Pesagem Pré-Treino)
  postHydrationTime: string; // "12:00" (Pesagem Pós-Treino)
}

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  wellnessTime: '09:00',
  rpeTime: '18:00',
  preHydrationTime: '10:00',
  postHydrationTime: '12:00',
};

// Check current notification permission status in browser/smartphone
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission to send push notifications on smartphones/desktops
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();

    // Register service worker if available to ensure notifications work on iOS/Android PWA
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker registration warning:', err);
      });
    }

    return permission;
  } catch (e) {
    console.error('Erro ao pedir permissão de notificações:', e);
    return 'unsupported';
  }
}

// Send native notification on smartphone or desktop
export async function sendMobileNotification(title: string, body: string, tag: string = 'femperf-reminder'): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    // Try using active Service Worker registration (ideal for smartphones / PWAs)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag,
          vibrate: [200, 100, 200],
          data: { url: '/' },
        } as NotificationOptions);
        return true;
      }
    }

    // Fallback to standard Notification API
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
    });
    return true;
  } catch (e) {
    console.error('Erro ao emitir notificação no telemóvel:', e);
    return false;
  }
}

// Determine missing questionnaires for athlete on specified date
export function getPendingQuestionnairesStatus(
  athleteId: string,
  dateStr: string,
  wellnessList?: WellnessEntry[],
  rpeList?: RPEEntry[],
  hydrationList?: HydrationEntry[]
) {
  const wList = wellnessList || getWellnessLocally(athleteId);
  const rList = rpeList || getRPELocally(athleteId);
  const hList = hydrationList || getHydrationLocally(athleteId);

  const hasWellness = wList.some((w) => w.athleteId === athleteId && w.date === dateStr);
  const hasRPE = rList.some((r) => r.athleteId === athleteId && r.date === dateStr);
  const hEntry = hList.find((h) => h.athleteId === athleteId && h.date === dateStr);

  const hasPreHydration = !!(hEntry && hEntry.preWeight > 0);
  const hasPostHydration = !!(hEntry && hEntry.postWeight > 0);
  const hasHydration = hasPreHydration && hasPostHydration;

  const missingNames: string[] = [];
  if (!hasWellness) missingNames.push('Wellness');
  if (!hasRPE) missingNames.push('PSE (RPE)');
  if (!hasPreHydration) missingNames.push('Pesagem Pré-Treino');
  if (!hasPostHydration) missingNames.push('Pesagem Pós-Treino');

  return {
    hasWellness,
    hasRPE,
    hasPreHydration,
    hasPostHydration,
    hasHydration,
    pendingCount: missingNames.length,
    missingNames,
    isComplete: missingNames.length === 0,
  };
}

// Get stored reminder configuration
export function getStoredReminderConfig(): ReminderConfig {
  if (typeof window === 'undefined') return DEFAULT_REMINDER_CONFIG;
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) return DEFAULT_REMINDER_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_REMINDER_CONFIG,
      ...parsed,
      preHydrationTime: parsed.preHydrationTime || parsed.hydrationTime || DEFAULT_REMINDER_CONFIG.preHydrationTime,
      postHydrationTime: parsed.postHydrationTime || parsed.hydrationTime || DEFAULT_REMINDER_CONFIG.postHydrationTime,
    };
  } catch {
    return DEFAULT_REMINDER_CONFIG;
  }
}

// Save reminder configuration
export function saveReminderConfig(config: ReminderConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Erro ao guardar configurações de lembretes:', e);
  }
}

// Check and trigger reminder notification if missing items exist and cooldown has passed
export function checkAndSendPendingReminder(
  athleteId: string,
  athleteName: string,
  dateStr: string,
  wellnessList?: WellnessEntry[],
  rpeList?: RPEEntry[],
  hydrationList?: HydrationEntry[]
): void {
  if (typeof window === 'undefined') return;

  const status = getPendingQuestionnairesStatus(athleteId, dateStr, wellnessList, rpeList, hydrationList);
  if (status.isComplete) return;

  // Rate-limit notifications to once every 3 hours per device
  const lastTsStr = localStorage.getItem(LAST_NOTIFICATION_TIMESTAMP_KEY);
  const now = Date.now();
  if (lastTsStr) {
    const lastTs = parseInt(lastTsStr, 10);
    if (now - lastTs < 3 * 60 * 60 * 1000) {
      return; // Skip inside cooldown window
    }
  }

  const title = `⚽ Gil Vicente FC • Olá ${athleteName.split(' ')[0]}!`;
  const body = `Tens ${status.pendingCount} questionário(s) por responder hoje: ${status.missingNames.join(', ')}. Clica para responder.`;

  sendMobileNotification(title, body, `femperf-pending-${dateStr}`).then((sent) => {
    if (sent) {
      localStorage.setItem(LAST_NOTIFICATION_TIMESTAMP_KEY, now.toString());
    }
  });
}

// AUTOMATIC SCHEDULED REMINDERS
// Evaluates current time against configured reminder times and sends notifications automatically
export function checkAutomaticScheduledReminders(
  athleteId: string,
  athleteName: string,
  wellnessList?: WellnessEntry[],
  rpeList?: RPEEntry[],
  hydrationList?: HydrationEntry[]
): void {
  if (typeof window === 'undefined') return;
  if (getNotificationPermission() !== 'granted') return;

  const config = getStoredReminderConfig();
  if (!config.enabled) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const status = getPendingQuestionnairesStatus(athleteId, dateStr, wellnessList, rpeList, hydrationList);
  if (status.isComplete) return;

  const firstName = athleteName.split(' ')[0];

  const checkSlot = (slotName: 'wellness' | 'rpe' | 'hydration' | 'preHydration' | 'postHydration', slotTime: string, isMissing: boolean, label: string) => {
    if (!isMissing) return;

    if (currentHHMM >= slotTime) {
      const trackingKey = `femperf_auto_notified_${dateStr}_${slotName}_${athleteId}`;
      if (!localStorage.getItem(trackingKey)) {
        const title = `⚽ Gil Vicente FC • Lembrete de ${label}`;
        const body = `Olá ${firstName}! Está na hora de preencher o teu registo de ${label} de hoje.`;
        sendMobileNotification(title, body, `auto-remind-${slotName}-${dateStr}`).then((sent) => {
          if (sent) {
            localStorage.setItem(trackingKey, 'true');
          }
        });
      }
    }
  };

  checkSlot('wellness', config.wellnessTime, !status.hasWellness, 'Wellness');
  checkSlot('rpe', config.rpeTime, !status.hasRPE, 'PSE (RPE)');
  checkSlot('preHydration', config.preHydrationTime, !status.hasPreHydration, 'Pesagem Pré-Treino');
  checkSlot('postHydration', config.postHydrationTime, !status.hasPostHydration, 'Pesagem Pós-Treino');
}

// Start background automatic reminder scheduler (polling every 60s)
export function startAutomaticReminderScheduler(
  athleteId: string,
  athleteName: string,
  wellnessList?: WellnessEntry[],
  rpeList?: RPEEntry[],
  hydrationList?: HydrationEntry[]
): () => void {
  if (typeof window === 'undefined') return () => {};

  checkAutomaticScheduledReminders(athleteId, athleteName, wellnessList, rpeList, hydrationList);

  const intervalId = setInterval(() => {
    checkAutomaticScheduledReminders(athleteId, athleteName, wellnessList, rpeList, hydrationList);
  }, 60000);

  return () => clearInterval(intervalId);
}
