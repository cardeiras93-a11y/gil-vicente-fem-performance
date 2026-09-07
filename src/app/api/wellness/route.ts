import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'wellness_entries.json');

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
    console.error('Erro ao guardar wellness no ficheiro:', e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('wellness_entries').select('*').order('created_at', { ascending: false });
      if (athleteId) {
        query = query.eq('athlete_id', athleteId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((item: any) => ({
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
        return NextResponse.json({
          success: true,
          data: mapped,
          debug: {
            isSupabaseConfigured,
            hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
            hasKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
          }
        });
      }
    }

    let entries = getStoredEntries();
    if (athleteId) {
      entries = entries.filter((e) => e.athleteId === athleteId);
    }
    return NextResponse.json({
      success: true,
      data: entries,
      debug: {
        isSupabaseConfigured,
        hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL),
        hasKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY),
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      athleteId,
      athleteName,
      date,
      menstrualCycle,
      sleepQuality,
      sleepDuration,
      mood,
      stress,
      fatigue,
      soreness,
      heavyLegs,
      muscleFatigue,
      needsPhysio,
      physioReason,
    } = body;

    if (!athleteId || !date) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const entryToSave = {
      id: body.id || `wel-${Date.now()}`,
      athleteId,
      athleteName,
      date,
      menstrualCycle,
      sleepQuality,
      sleepDuration,
      mood,
      stress,
      fatigue,
      soreness,
      heavyLegs,
      wellnessTotal: body.wellnessTotal || (sleepQuality + sleepDuration + mood + stress + fatigue + soreness + heavyLegs),
      muscleFatigue,
      needsPhysio,
      physioReason: physioReason || null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // Save to disk JSON file
    saveEntryToFile(entryToSave);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('wellness_entries').upsert([
        {
          id: entryToSave.id,
          athlete_id: athleteId,
          athlete_name: athleteName,
          date,
          menstrual_cycle: menstrualCycle,
          sleep_quality: sleepQuality,
          sleep_duration: sleepDuration,
          mood,
          stress,
          fatigue,
          soreness,
          heavy_legs: heavyLegs,
          muscle_fatigue: muscleFatigue,
          needs_physio: needsPhysio,
          physio_reason: physioReason || null,
        },
      ], { onConflict: 'id' }).select();

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    return NextResponse.json(
      { success: true, data: entryToSave, message: 'Wellness guardado com sucesso' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}
