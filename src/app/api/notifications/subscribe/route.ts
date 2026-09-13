import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import {
  getAllActivePushSubscriptions,
  getStoredSubscriptionsFile,
  saveSubscriptionsFile,
  StoredPushSubscription,
} from '@/lib/pushStorage';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Return public VAPID key if requested by frontend client
  if (searchParams.get('getKey') === '1') {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
    return NextResponse.json({ vapidPublicKey });
  }

  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const subscriptions = await getAllActivePushSubscriptions();
    return NextResponse.json({ success: true, count: subscriptions.length, subscriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao ler subscrições' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, athleteId, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: 'Dados de PushSubscription inválidos (endpoint, p256dh, auth obrigatórios).' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newSub: StoredPushSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      athleteId: athleteId || null,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent: userAgent || '',
      createdAt: now,
      updatedAt: now,
    };

    // 1. Update local file storage
    const currentFile = getStoredSubscriptionsFile();
    const existingIndex = currentFile.findIndex((s) => s.endpoint === newSub.endpoint);
    if (existingIndex !== -1) {
      currentFile[existingIndex] = {
        ...currentFile[existingIndex],
        athleteId: newSub.athleteId || currentFile[existingIndex].athleteId,
        p256dh: newSub.p256dh,
        auth: newSub.auth,
        updatedAt: now,
      };
    } else {
      currentFile.unshift(newSub);
    }
    saveSubscriptionsFile(currentFile);

    // 2. Update Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('push_subscriptions').upsert(
          {
            athlete_id: newSub.athleteId,
            endpoint: newSub.endpoint,
            p256dh: newSub.p256dh,
            auth: newSub.auth,
            updated_at: now,
          },
          { onConflict: 'endpoint' }
        );
      } catch (e) {
        console.warn('Upsert na tabela push_subscriptions falhou (a utilizar fallback):', e);
      }

      try {
        await supabase.from('athletes').upsert(
          {
            id: '__PUSH_SUBSCRIPTIONS__',
            name: JSON.stringify(currentFile),
            created_at: now,
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback de subscrições em athletes:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscrição Web Push registada e guardada com sucesso.',
      subscription: newSub,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao registar subscrição' }, { status: 500 });
  }
}
