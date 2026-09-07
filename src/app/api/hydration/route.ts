import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { calculateHydrationStatus } from '@/lib/data';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'hydration_entries.json');

function ensureFileExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(FILE_PATH)) {
    fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
  }
}

function getStoredEntries(): any[] {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveEntryToFile(entry: any) {
  try {
    ensureFileExists();
    const entries = getStoredEntries();
    const index = entries.findIndex((e) => e.id === entry.id || (e.date === entry.date && e.athleteId === entry.athleteId));
    if (index !== -1) {
      entries[index] = { ...entries[index], ...entry };
    } else {
      entries.unshift(entry);
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(entries, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao guardar Hidratação no ficheiro:', e);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      athleteId,
      athleteName,
      date,
      durationMin,
      preWeight,
      postWeight,
      fluidsIntake,
    } = body;

    if (!athleteId || preWeight === undefined || postWeight === undefined) {
      return NextResponse.json({ error: 'Pesos pré e pós-treino são obrigatórios' }, { status: 400 });
    }

    const calc = calculateHydrationStatus(Number(preWeight), Number(postWeight), Number(fluidsIntake || 0));
    const entryDate = date || new Date().toISOString().split('T')[0];

    const entryToSave = {
      id: body.id || `hyd-${Date.now()}`,
      athleteId,
      athleteName,
      date: entryDate,
      durationMin: durationMin || 90,
      preWeight: Number(preWeight),
      postWeight: Number(postWeight),
      fluidsIntake: Number(fluidsIntake || 0),
      weightLoss: calc.weightLoss,
      dehydrationRate: calc.dehydrationRate,
      status: calc.status,
      refillNeededLiters: calc.refillNeededLiters,
      recommendation: calc.recommendation,
      biologicalImpact: calc.biologicalImpact,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    saveEntryToFile(entryToSave);

    // Send data to Google Sheets Webhook if configured
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    let sheetSynced = false;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            module: 'hydration',
            ...entryToSave,
          }),
        });
        sheetSynced = true;
      } catch (err) {
        console.error('Google Sheets sync error:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('hydration_entries').upsert([
        {
          id: entryToSave.id,
          athlete_id: athleteId,
          athlete_name: athleteName,
          date: entryDate,
          duration_min: durationMin || null,
          pre_weight: preWeight,
          post_weight: postWeight,
          fluids_intake: fluidsIntake || 0,
          weight_loss: calc.weightLoss,
          dehydration_rate: calc.dehydrationRate,
          status: calc.status,
          refill_needed_liters: calc.refillNeededLiters,
          recommendation: calc.recommendation,
          biological_impact: calc.biologicalImpact,
        },
      ], { onConflict: 'id' }).select();

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    return NextResponse.json(
      { success: true, data: entryToSave, calc, sheetSynced, message: 'Dados de hidratação calculados e guardados.' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('hydration_entries').select('*').order('created_at', { ascending: false });
      if (athleteId) {
        query = query.eq('athlete_id', athleteId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((item: any) => ({
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
        return NextResponse.json({ success: true, data: mapped });
      }
    }

    let entries = getStoredEntries();
    if (athleteId) {
      entries = entries.filter((e) => e.athleteId === athleteId);
    }
    return NextResponse.json({ success: true, data: entries });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

