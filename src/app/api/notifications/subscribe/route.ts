import { NextResponse } from 'next/server';
import { verifyApiAuth } from '@/lib/authGuard';
import {
  getAllActivePushSubscriptions,
  saveOrUpdatePushSubscription,
  purgeExpiredPushSubscription,
  clearAllPushSubscriptions,
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

    const updatedList = await saveOrUpdatePushSubscription(newSub);

    return NextResponse.json({
      success: true,
      count: updatedList.length,
      message: 'Subscrição Web Push registada e guardada com sucesso.',
      subscription: newSub,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao registar subscrição' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const clearAll = searchParams.get('all') === '1' || searchParams.get('all') === 'true';

    if (endpoint && !clearAll) {
      await purgeExpiredPushSubscription(endpoint);
      return NextResponse.json({
        success: true,
        message: 'Dispositivo removido com sucesso.',
      });
    }

    // Clear all push subscriptions
    await clearAllPushSubscriptions();
    return NextResponse.json({
      success: true,
      message: 'Todos os dispositivos registados foram removidos com sucesso.',
      count: 0,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao remover subscrições' }, { status: 500 });
  }
}

