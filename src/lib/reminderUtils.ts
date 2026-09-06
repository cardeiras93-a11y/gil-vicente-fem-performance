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

export interface NotificationResult {
  success: boolean;
  reason?: string;
}

// Send native notification on smartphone or desktop
export async function sendMobileNotification(
  title: string,
  body: string,
  tag: string = 'femperf-reminder'
): Promise<NotificationResult> {
  if (typeof window === 'undefined') {
    return { success: false, reason: 'Ambiente de servidor sem janela disponível.' };
  }

  if (!('Notification' in window)) {
    return {
      success: false,
      reason: 'O navegador/dispositivo não suporta notificações de sistema. No iPad/iPhone, adiciona a app ao Ecrã Principal primeiro.'
    };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = (await requestNotificationPermission()) as NotificationPermission;
  }

  if (permission !== 'granted') {
    return {
      success: false,
      reason: 'As notificações estão bloqueadas nas definições do iPad/Telemóvel. Acede a Definições ➔ Notificações ➔ Safari/Chrome e clica em Permitir.'
    };
  }

  try {
    // Try using active Service Worker registration (ideal for iPad/iPhone PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 1500))
        ]);

        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag,
            vibrate: [200, 100, 200],
            data: { url: '/' },
          } as NotificationOptions);
          return { success: true };
        }
      } catch (swErr) {
        console.warn('Falha na notificação via ServiceWorker, a tentar fallback:', swErr);
      }
    }

    // Fallback to standard Notification API
    const notif = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag,
    });
    return { success: true };
  } catch (e: any) {
    console.error('Erro ao emitir notificação no telemóvel:', e);
    return {
      success: false,
      reason: `Restrição do sistema iPadOS/iOS (${e?.message || 'abrir a partir do Ecrã Principal'}).`
    };
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

// GLOBAL AUTOMATIC SCHEDULED REMINDERS
// Evaluates current time and sends notifications to the device even when NO athlete profile is selected yet.
export function checkGlobalAutomaticScheduledReminders(): void {
  if (typeof window === 'undefined') return;
  if (getNotificationPermission() !== 'granted') return;

  const config = getStoredReminderConfig();
  if (!config.enabled) return;

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const checkGlobalSlot = (
    slotName: 'wellness' | 'rpe' | 'preHydration' | 'postHydration',
    slotTime: string,
    label: string,
    message: string
  ) => {
    if (currentHHMM >= slotTime) {
      const trackingKey = `femperf_global_notified_${dateStr}_${slotName}`;
      if (!localStorage.getItem(trackingKey)) {
        const title = `⚽ Gil Vicente FC • Lembrete de ${label}`;
        sendMobileNotification(title, message, `global-remind-${slotName}-${dateStr}`).then((sent) => {
          if (sent) {
            localStorage.setItem(trackingKey, 'true');
          }
        });
      }
    }
  };

  checkGlobalSlot(
    'wellness',
    config.wellnessTime,
    'Wellness',
    'Olá! Está na hora de preencher o teu Questionário Wellness de hoje. Abre a aplicação e seleciona o teu nome.'
  );

  checkGlobalSlot(
    'preHydration',
    config.preHydrationTime,
    'Pesagem Pré-Treino',
    'Lembrete de Pesagem Pré-Treino! Abre a aplicação, escolhe o teu nome e regista a tua pesagem inicial.'
  );

  checkGlobalSlot(
    'postHydration',
    config.postHydrationTime,
    'Pesagem Pós-Treino',
    'Lembrete de Pesagem Pós-Treino! Abre a aplicação, escolhe o teu nome e regista a tua pesagem final.'
  );

  checkGlobalSlot(
    'rpe',
    config.rpeTime,
    'PSE (RPE Pós-Treino)',
    'Está na hora de preencher o teu registo de PSE (Perceção Subjetiva do Esforço). Entra na aplicação e escolhe o teu perfil.'
  );
}

// Start background automatic reminder scheduler globally on app landing page
export function startGlobalAutomaticReminderScheduler(): () => void {
  if (typeof window === 'undefined') return () => {};

  checkGlobalAutomaticScheduledReminders();

  const intervalId = setInterval(() => {
    checkGlobalAutomaticScheduledReminders();
  }, 60000);

  return () => clearInterval(intervalId);
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
