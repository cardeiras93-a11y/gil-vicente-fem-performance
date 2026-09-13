import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { verifyApiAuth } from '@/lib/authGuard';
import { getAllActivePushSubscriptions, purgeExpiredPushSubscription } from '@/lib/pushStorage';

function initVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT_EMAIL || 'mailto:suporte@gilvicentefc.pt';

  if (publicKey && privateKey) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return true;
  }
  return false;
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  const vapidReady = initVapid();
  if (!vapidReady) {
    return NextResponse.json(
      {
        error: 'Chaves VAPID não configuradas no servidor. É necessário configurar VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.',
      },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { athleteId } = body;

    let subscriptions = await getAllActivePushSubscriptions();
    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma subscrição de dispositivo encontrada. Ativa as notificações num telemóvel primeiro.',
      });
    }

    // If a specific athleteId was passed, try targeting that athlete's devices first
    if (athleteId) {
      const athleteSubs = subscriptions.filter((s) => s.athleteId === athleteId);
      if (athleteSubs.length > 0) {
        subscriptions = athleteSubs;
      }
    }

    const payload = JSON.stringify({
      title: '⚽ Gil Vicente FC • Notificação de Teste',
      body: 'Tudo operacional! O teu dispositivo está pronto para receber avisos mesmo com a app fechada.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'gvfc-test-push',
      url: '/',
    });

    let sentCount = 0;
    let failedCount = 0;
    let purgedCount = 0;

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (err: any) {
          failedCount++;
          if (
            err?.statusCode === 410 ||
            err?.statusCode === 404 ||
            err?.statusCode === 400 ||
            err?.message?.includes('65 bytes') ||
            err?.message?.includes('invalid')
          ) {
            purgedCount++;
            await purgeExpiredPushSubscription(sub.endpoint);
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: `Notificação de teste enviada com sucesso para ${sentCount} dispositivo(s).`,
      sent: sentCount,
      failed: failedCount,
      purged: purgedCount,
      totalSubscriptions: subscriptions.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao enviar notificação de teste.' }, { status: 500 });
  }
}
