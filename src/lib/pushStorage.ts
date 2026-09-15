import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from './supabase';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'push_subscriptions.json');

export interface StoredPushSubscription {
  id: string;
  athleteId?: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de subscrições push indisponível:', e);
  }
}

export function getStoredSubscriptionsFile(): StoredPushSubscription[] {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSubscriptionsFile(list: StoredPushSubscription[]) {
  try {
    ensureFileExists();
    fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao guardar subscrições em ficheiro:', e);
  }
}

export async function getAllActivePushSubscriptions(): Promise<StoredPushSubscription[]> {
  const fileSubs = getStoredSubscriptionsFile();
  let cloudSubs: StoredPushSubscription[] = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.from('push_subscriptions').select('*');
      if (data && data.length > 0) {
        cloudSubs = data.map((item: any) => ({
          id: item.id || item.endpoint,
          athleteId: item.athlete_id,
          endpoint: item.endpoint,
          p256dh: item.p256dh,
          auth: item.auth,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));
      }
    } catch {}

    try {
      const { data: athData } = await supabase.from('athletes').select('name').eq('id', '__PUSH_SUBSCRIPTIONS__').single();
      if (athData?.name) {
        const parsed = JSON.parse(athData.name);
        if (Array.isArray(parsed)) {
          cloudSubs = [...cloudSubs, ...parsed];
        }
      }
    } catch {}
  }

  const map = new Map<string, StoredPushSubscription>();
  [...fileSubs, ...cloudSubs].forEach((sub) => {
    if (sub && sub.endpoint && sub.p256dh && sub.auth) {
      map.set(sub.endpoint, sub);
    }
  });

  return Array.from(map.values());
}

export async function saveOrUpdatePushSubscription(
  newSub: StoredPushSubscription
): Promise<StoredPushSubscription[]> {
  const currentSubs = await getAllActivePushSubscriptions();
  const existingIdx = currentSubs.findIndex((s) => s.endpoint === newSub.endpoint);

  if (existingIdx !== -1) {
    currentSubs[existingIdx] = {
      ...currentSubs[existingIdx],
      athleteId: newSub.athleteId || currentSubs[existingIdx].athleteId,
      p256dh: newSub.p256dh,
      auth: newSub.auth,
      userAgent: newSub.userAgent || currentSubs[existingIdx].userAgent,
      updatedAt: newSub.updatedAt,
    };
  } else {
    currentSubs.unshift(newSub);
  }

  saveSubscriptionsFile(currentSubs);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('push_subscriptions').upsert(
        {
          athlete_id: newSub.athleteId,
          endpoint: newSub.endpoint,
          p256dh: newSub.p256dh,
          auth: newSub.auth,
          updated_at: newSub.updatedAt,
        },
        { onConflict: 'endpoint' }
      );
    } catch {}

    try {
      await supabase.from('athletes').upsert(
        {
          id: '__PUSH_SUBSCRIPTIONS__',
          name: JSON.stringify(currentSubs),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch (e) {
      console.error('Erro ao sincronizar subscrições com Supabase:', e);
    }
  }

  return currentSubs;
}

export async function purgeExpiredPushSubscription(endpoint: string) {
  try {
    const currentSubs = await getAllActivePushSubscriptions();
    const filtered = currentSubs.filter((s) => s.endpoint !== endpoint);
    saveSubscriptionsFile(filtered);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      } catch {}
      try {
        await supabase.from('athletes').upsert(
          {
            id: '__PUSH_SUBSCRIPTIONS__',
            name: JSON.stringify(filtered),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch {}
    }
  } catch (e) {
    console.error('Erro ao eliminar subscrição expirada:', e);
  }
}

export async function clearAllPushSubscriptions(): Promise<void> {
  try {
    saveSubscriptionsFile([]);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('push_subscriptions').delete().neq('endpoint', '___NONE___');
      } catch {}
      try {
        await supabase.from('athletes').upsert(
          {
            id: '__PUSH_SUBSCRIPTIONS__',
            name: JSON.stringify([]),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch {}
    }
  } catch (e) {
    console.error('Erro ao remover todas as subscrições push:', e);
  }
}

