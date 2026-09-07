import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

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
  try {
    const { searchParams } = new URL(request.url);
    const customUrl = searchParams.get('url');
    const readUrl = customUrl || process.env.GOOGLE_SHEETS_READ_URL;

    if (!readUrl) {
      if (isSupabaseConfigured && supabase) {
        const [wRes, rRes, hRes] = await Promise.all([
          supabase.from('wellness_entries').select('*').order('created_at', { ascending: false }),
          supabase.from('rpe_entries').select('*').order('created_at', { ascending: false }),
          supabase.from('hydration_entries').select('*').order('created_at', { ascending: false }),
        ]);

        const wellness = (wRes.data || []).map((item: any) => ({
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

        const rpe = (rRes.data || []).map((item: any) => ({
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

        const hydration = (hRes.data || []).map((item: any) => ({
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

        return NextResponse.json({
          success: true,
          data: {
            wellness,
            rpe,
            hydration,
          }
        });
      }

      const wellness = getStoredEntries('wellness_entries.json');
      const rpe = getStoredEntries('rpe_entries.json');
      const hydration = getStoredEntries('hydration_entries.json');
      return NextResponse.json({
        success: true,
        data: {
          wellness,
          rpe,
          hydration
        }
      });
    }

    const response = await fetch(readUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao consultar Google Sheets URL' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao sincronizar do Google Sheets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

