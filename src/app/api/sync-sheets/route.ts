import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');

function getStoredEntries(filename: string): any[] {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;
  try {
    let wellness: any[] = [];
    let rpe: any[] = [];
    let hydration: any[] = [];

    if (isSupabaseConfigured && supabase) {
      const [wRes, rRes, hRes] = await Promise.all([
        supabase.from('wellness_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('rpe_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('hydration_entries').select('*').order('created_at', { ascending: false }),
      ]);

      wellness = (wRes.data || []).map((item: any) => ({
        id: item.id || `wel-${item.athlete_id}-${item.date}`,
        athleteId: item.athlete_id,
        athleteName: item.athlete_name,
        date: item.date,
        menstrualCycle: item.menstrual_cycle,
        sleepQuality: Number(item.sleep_quality),
        sleepDuration: Number(item.sleep_duration),
        mood: Number(item.mood),
        stress: Number(item.stress),
        fatigue: Number(item.fatigue),
        soreness: Number(item.soreness),
        heavyLegs: Number(item.heavy_legs),
        wellnessTotal: Number(item.sleep_quality + item.sleep_duration + item.mood + item.stress + item.fatigue + item.soreness + item.heavy_legs),
        muscleFatigue: item.muscle_fatigue || {},
        needsPhysio: Boolean(item.needs_physio),
        physioReason: item.physio_reason || null,
        createdAt: item.created_at || item.date,
      }));

      rpe = (rRes.data || []).map((item: any) => ({
        id: item.id || `rpe-${item.athlete_id}-${item.date}`,
        athleteId: item.athlete_id,
        athleteName: item.athlete_name,
        date: item.date,
        physicalDemand: Number(item.physical_demand),
        postFatigue: Number(item.post_fatigue),
        muscleFatigue: item.muscle_fatigue || {},
        preWorkoutPlans: item.pre_workout_plans || [],
        comments: item.comments || null,
        createdAt: item.created_at || item.date,
      }));

      hydration = (hRes.data || []).map((item: any) => ({
        id: item.id || `hyd-${item.athlete_id}-${item.date}`,
        athleteId: item.athlete_id,
        athleteName: item.athlete_name,
        date: item.date,
        durationMin: item.duration_min ? Number(item.duration_min) : 90,
        preWeight: Number(item.pre_weight),
        postWeight: Number(item.post_weight),
        fluidsIntake: Number(item.fluids_intake || 0),
        weightLoss: Number(item.weight_loss),
        dehydrationRate: Number(item.dehydration_rate),
        status: item.status,
        refillNeededLiters: Number(item.refill_needed_liters),
        recommendation: item.recommendation,
        biologicalImpact: item.biological_impact,
        createdAt: item.created_at || item.date,
      }));
    } else {
      wellness = getStoredEntries('wellness_entries.json');
      rpe = getStoredEntries('rpe_entries.json');
      hydration = getStoredEntries('hydration_entries.json');
    }

    return NextResponse.json({
      success: true,
      data: {
        wellness,
        rpe,
        hydration
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao sincronizar' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const googleSheetWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!googleSheetWebhookUrl) {
      return NextResponse.json({
        success: true,
        message: 'Endpoint de sincronização pronto. Define GOOGLE_SHEETS_WEBHOOK_URL nas variáveis de ambiente da Vercel para ativar o envio automático.',
        received: body,
      });
    }

    const response = await fetch(googleSheetWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao enviar dados para Google Sheets' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Dados sincronizados com Google Sheets com sucesso!' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro na sincronização' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      const { searchParams } = new URL(request.url);
      const daysParam = searchParams.get('days');
      const menusParam = searchParams.get('menus');
      body = {
        days: daysParam || 'all',
        menus: menusParam ? menusParam.split(',') : ['wellness', 'rpe', 'hydration', 'training'],
      };
    }

    const days: string = body.days || 'all';
    const menus: string[] = Array.isArray(body.menus) && body.menus.length > 0
      ? body.menus
      : ['wellness', 'rpe', 'hydration', 'training'];

    let cutoffDate: string | null = null;
    if (days !== 'all') {
      const daysNum = parseInt(days, 10);
      if (!isNaN(daysNum)) {
        const d = new Date();
        d.setDate(d.getDate() - (daysNum - 1));
        cutoffDate = d.toISOString().split('T')[0];
      }
    }

    if (isSupabaseConfigured && supabase) {
      const deletePromises: Promise<any>[] = [];

      if (menus.includes('wellness')) {
        let q = supabase.from('wellness_entries').delete();
        if (cutoffDate) {
          q = q.gte('date', cutoffDate);
        } else {
          q = q.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        deletePromises.push(Promise.resolve(q));
      }

      if (menus.includes('rpe')) {
        let q = supabase.from('rpe_entries').delete();
        if (cutoffDate) {
          q = q.gte('date', cutoffDate);
        } else {
          q = q.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        deletePromises.push(Promise.resolve(q));
      }

      if (menus.includes('hydration')) {
        let q = supabase.from('hydration_entries').delete();
        if (cutoffDate) {
          q = q.gte('date', cutoffDate);
        } else {
          q = q.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        deletePromises.push(Promise.resolve(q));
      }

      if (menus.includes('training')) {
        let q = supabase.from('training_sessions').delete();
        if (cutoffDate) {
          q = q.gte('date', cutoffDate);
        } else {
          q = q.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        deletePromises.push(Promise.resolve(q));
      }

      await Promise.all(deletePromises);
    }

    try {
      const updateDiskFile = (filename: string) => {
        const filePath = path.join(DATA_DIR, filename);
        if (fs.existsSync(filePath)) {
          if (!cutoffDate) {
            fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
          } else {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const entries: any[] = JSON.parse(raw);
            const filtered = entries.filter((e) => e.date < cutoffDate);
            fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
          }
        }
      };

      if (menus.includes('wellness')) updateDiskFile('wellness_entries.json');
      if (menus.includes('rpe')) updateDiskFile('rpe_entries.json');
      if (menus.includes('hydration')) updateDiskFile('hydration_entries.json');
    } catch (e) {
      console.error('Erro ao limpar ficheiros em disco:', e);
    }

    return NextResponse.json({
      success: true,
      message: `Dados eliminados com sucesso (${days === 'all' ? 'Todo o histórico' : `Últimos ${days} dias`}).`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao apagar dados da base de dados' }, { status: 500 });
  }
}

