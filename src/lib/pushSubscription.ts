import { secureFetch } from './authGuard';

// Helper: Convert VAPID base64 string to Uint8Array for PushManager
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface PushStatusResult {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  isSubscribed: boolean;
  reason?: string;
}

// Check device support, notification permission, and active push subscription
export async function checkPushSubscriptionStatus(): Promise<PushStatusResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      supported: false,
      permission: 'unsupported',
      isSubscribed: false,
      reason: 'Push notifications não são suportadas neste navegador/dispositivo. No iPhone/iPad, adiciona a App ao Ecrã Principal (PWA).',
    };
  }

  const permission = Notification.permission;
  if (permission !== 'granted') {
    return {
      supported: true,
      permission,
      isSubscribed: false,
    };
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return {
      supported: true,
      permission: 'granted',
      isSubscribed: !!sub,
    };
  } catch (e) {
    return {
      supported: true,
      permission: 'granted',
      isSubscribed: false,
    };
  }
}

const FALLBACK_VAPID_PUBLIC_KEY = 'BLElYRBRZOvn96NJTP6DiDf4EFwoTfUVmp-ASsFIBK1JSxRedoD8jGaafLIrRNenS6_ltU5bnwTVMzNDIHM8SpQ';

// Register Web Push subscription on device and send to backend
export async function registerPushSubscription(athleteId?: string): Promise<{ success: boolean; message?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return {
      success: false,
      message: 'Notificações Push não suportadas. No iPhone/iPad, abre o Safari e escolhe "Adicionar ao Ecrã Principal".',
    };
  }

  try {
    // 1. Request notification permission
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Permissão de notificações não concedida. Ativa as notificações nas definições do teu telemóvel.',
      };
    }

    // 2. Ensure Service Worker is registered and active
    let reg = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!reg) {
      reg = await navigator.serviceWorker.register('/sw.js');
    }
    await navigator.serviceWorker.ready;

    // 3. Obtain VAPID Public Key from environment, API or fallback
    let vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      try {
        const res = await secureFetch('/api/notifications/subscribe?getKey=1');
        const data = await res.json();
        if (data.vapidPublicKey) {
          vapidPublicKey = data.vapidPublicKey;
        }
      } catch {}
    }

    if (!vapidPublicKey) {
      vapidPublicKey = FALLBACK_VAPID_PUBLIC_KEY;
    }

    // 4. Get existing subscription or create a new one
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // 5. Send subscription JSON payload to backend API with athleteId
    const response = await secureFetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        athleteId: athleteId || null,
        userAgent: navigator.userAgent,
      }),
    });

    const result = await response.json();
    if (result.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('femperf_push_registered_endpoint', subscription.endpoint);
        localStorage.setItem('femperf_push_registered_at', new Date().toISOString());
      }
      return { success: true, message: 'Notificações em 2º plano (App Fechada) ativadas com sucesso!' };
    } else {
      return { success: false, message: result.error || 'Erro ao guardar subscrição no servidor.' };
    }
  } catch (e: any) {
    console.error('Erro ao registar subscrição Push:', e);
    return {
      success: false,
      message: `Erro de registo Push: ${e?.message || 'Falha desconhecida.'}`,
    };
  }
}

// Silently ensure push subscription is registered and synchronized with backend if permission is already granted
export async function syncPushSubscriptionIfGranted(athleteId?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false;

  try {
    const res = await registerPushSubscription(athleteId);
    return res.success;
  } catch (err) {
    console.warn('Erro ao sincronizar subscrição silenciosa:', err);
    return false;
  }
}

