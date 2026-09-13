import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { getAllActivePushSubscriptions, purgeExpiredPushSubscription } from '@/lib/pushStorage';
import fs from 'fs';
import path from 'path';

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

function getStoredReminderConfig(): any {
  const defaultConfig = {
    enabled: true,
    wellnessTime: '09:00',
    rpeTime: '18:00',
    preHydrationTime: '10:00',
    postHydrationTime: '12:00',
  };

  try {
    const dataDir = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'credentials.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.reminderConfig) {
        return { ...defaultConfig, ...parsed.reminderConfig };
      }
    }
  } catch {}
  return defaultConfig;
}

function matchesSlotTime(currentHHMM: string, targetHHMM: string): boolean {
  if (!targetHHMM || !targetHHMM.includes(':')) return false;
  const [cH, cM] = currentHHMM.split(':').map(Number);
  const [tH, tM] = targetHHMM.split(':').map(Number);
  const cTotal = cH * 60 + cM;
  const tTotal = tH * 60 + tM;
  const diff = cTotal - tTotal;
  return diff >= 0 && diff <= 45; // Active inside 45-minute window of target time
}

async function executeScheduledSend(request: Request) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    const token = searchParams.get('token') || (authHeader ? authHeader.replace('Bearer ', '') : '');
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Acesso não autorizado ao Cloud Cron.' }, { status: 401 });
    }
  }

  const vapidReady = initVapid();
  if (!vapidReady) {
    return NextResponse.json(
      {
        error: 'Chaves VAPID não configuradas no servidor. Configura VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY no Vercel.',
      },
      { status: 500 }
    );
  }

  const config = getStoredReminderConfig();
  if (!config.enabled) {
    return NextResponse.json({
      success: true,
      message: 'Notificações desativadas nas definições do Administrador.',
    });
  }

  // Calculate current time in Portugal (Europe/Lisbon)
  const portugalTimeStr = new Date().toLocaleTimeString('pt-PT', {
    timeZone: 'Europe/Lisbon',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const forcedSlot = searchParams.get('slot'); // e.g. ?slot=wellness | ?slot=rpe | ?slot=preHydration | ?slot=postHydration | ?slot=all

  let activeTitle = '';
  let activeBody = '';
  let activeCategory = '';

  if (forcedSlot === 'wellness' || (!forcedSlot && matchesSlotTime(portugalTimeStr, config.wellnessTime))) {
    activeCategory = 'Wellness';
    activeTitle = '⚽ Gil Vicente FC • Lembrete Wellness';
    activeBody = 'Olá! Está na hora de preencheres o teu Questionário Wellness de hoje.';
  } else if (forcedSlot === 'preHydration' || (!forcedSlot && matchesSlotTime(portugalTimeStr, config.preHydrationTime))) {
    activeCategory = 'Pesagem Pré-Treino';
    activeTitle = '⚽ Gil Vicente FC • Pesagem Pré-Treino';
    activeBody = 'Lembrete: Entra na app e regista a tua pesagem pré-treino de hoje.';
  } else if (forcedSlot === 'postHydration' || (!forcedSlot && matchesSlotTime(portugalTimeStr, config.postHydrationTime))) {
    activeCategory = 'Pesagem Pós-Treino';
    activeTitle = '⚽ Gil Vicente FC • Pesagem Pós-Treino';
    activeBody = 'Lembrete: Entra na app e regista a tua pesagem pós-treino de hoje.';
  } else if (forcedSlot === 'rpe' || (!forcedSlot && matchesSlotTime(portugalTimeStr, config.rpeTime))) {
    activeCategory = 'PSE (RPE Pós-Treino)';
    activeTitle = '⚽ Gil Vicente FC • Lembrete PSE (RPE)';
    activeBody = 'Está na hora de preencheres o teu registo de Perceção Subjetiva do Esforço (RPE).';
  } else if (forcedSlot === 'all') {
    activeCategory = 'Geral';
    activeTitle = '⚽ Gil Vicente FC • Lembrete de Treino';
    activeBody = 'Olá! Não te esqueças de preencher o teu questionário diário na aplicação!';
  }

  if (!activeCategory) {
    return NextResponse.json({
      success: true,
      sent: 0,
      portugalTime: portugalTimeStr,
      message: `Nenhum lembrete agendado para a hora atual (${portugalTimeStr}). Lembretes configurados: Wellness ${config.wellnessTime}, Pré-Treino ${config.preHydrationTime}, Pós-Treino ${config.postHydrationTime}, PSE ${config.rpeTime}.`,
    });
  }

  const todayDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' });

  // 1. Fetch completed athlete IDs for today if Supabase is active
  const completedAthleteIds = new Set<string>();
  try {
    const { supabase, isSupabaseConfigured } = await import('@/lib/supabase');
    if (isSupabaseConfigured && supabase) {
      if (activeCategory === 'Wellness') {
        const { data } = await supabase.from('wellness_entries').select('athlete_id').eq('date', todayDateStr);
        if (data) data.forEach((d: any) => completedAthleteIds.add(d.athlete_id));
      } else if (activeCategory === 'PSE (RPE Pós-Treino)') {
        const { data } = await supabase.from('rpe_entries').select('athlete_id').eq('date', todayDateStr);
        if (data) data.forEach((d: any) => completedAthleteIds.add(d.athlete_id));
      } else if (activeCategory === 'Pesagem Pré-Treino') {
        const { data } = await supabase.from('hydration_entries').select('athlete_id, pre_weight').eq('date', todayDateStr);
        if (data) data.forEach((d: any) => { if (Number(d.pre_weight) > 0) completedAthleteIds.add(d.athlete_id); });
      } else if (activeCategory === 'Pesagem Pós-Treino') {
        const { data } = await supabase.from('hydration_entries').select('athlete_id, post_weight').eq('date', todayDateStr);
        if (data) data.forEach((d: any) => { if (Number(d.post_weight) > 0) completedAthleteIds.add(d.athlete_id); });
      }
    }
  } catch (err) {
    console.warn('Erro ao consultar respostas de hoje para filtragem de push:', err);
  }

  const subscriptions = await getAllActivePushSubscriptions();
  if (subscriptions.length === 0) {
    return NextResponse.json({
      success: true,
      sent: 0,
      failed: 0,
      category: activeCategory,
      message: 'Nenhuma subscrição Web Push ativa encontrada na base de dados.',
    });
  }

  let sentCount = 0;
  let skippedAlreadyDoneCount = 0;
  let failedCount = 0;
  let purgedCount = 0;

  const errorDetails: any[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      // If athlete already completed this questionnaire today, don't disturb her!
      if (sub.athleteId && completedAthleteIds.has(sub.athleteId)) {
        skippedAlreadyDoneCount++;
        return;
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      const payload = JSON.stringify({
        title: activeTitle,
        body: activeBody,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: `gvfc-${activeCategory.toLowerCase().replace(/\s+/g, '-')}-${todayDateStr}`,
        url: '/',
      });

      try {
        await webpush.sendNotification(pushSubscription, payload);
        sentCount++;
      } catch (err: any) {
        failedCount++;
        errorDetails.push({
          athleteId: sub.athleteId,
          endpoint: sub.endpoint ? sub.endpoint.substring(0, 40) + '...' : null,
          message: err?.message,
          statusCode: err?.statusCode,
          body: err?.body,
        });
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
    category: activeCategory,
    sent: sentCount,
    skippedAlreadyCompleted: skippedAlreadyDoneCount,
    failed: failedCount,
    purged: purgedCount,
    errors: errorDetails,
    totalSubscriptions: subscriptions.length,
    portugalTime: portugalTimeStr,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request: Request) {
  return executeScheduledSend(request);
}

export async function POST(request: Request) {
  return executeScheduledSend(request);
}
