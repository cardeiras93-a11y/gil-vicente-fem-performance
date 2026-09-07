import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'rpe_entries.json');

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
    console.error('Erro ao guardar RPE no ficheiro:', e);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');

    if (isSupabaseConfigured && supabase) {
      let query = supabase.from('rpe_entries').select('*').order('created_at', { ascending: false });
      if (athleteId) {
        query = query.eq('athlete_id', athleteId);
      }
      const { data, error } = await query;
      if (!error && data) {
        const mapped = data.map((item: any) => ({
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      athleteId,
      athleteName,
      date,
      physicalDemand,
      postFatigue,
      muscleFatigue,
      preWorkoutPlans,
      comments,
    } = body;

    if (!athleteId || !date || physicalDemand === undefined) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const entryToSave = {
      id: body.id || `rpe-${Date.now()}`,
      athleteId,
      athleteName,
      date,
      physicalDemand,
      postFatigue,
      muscleFatigue,
      preWorkoutPlans: preWorkoutPlans || [],
      comments: comments || null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    saveEntryToFile(entryToSave);

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('rpe_entries').upsert([
        {
          id: entryToSave.id,
          athlete_id: athleteId,
          athlete_name: athleteName,
          date,
          physical_demand: physicalDemand,
          post_fatigue: postFatigue,
          muscle_fatigue: muscleFatigue,
          pre_workout_plans: preWorkoutPlans || [],
          comments: comments || null,
        },
      ], { onConflict: 'id' }).select();

      if (error) {
        console.error('Supabase error:', error);
      }
    }

    return NextResponse.json(
      { success: true, data: entryToSave, message: 'RPE guardado com sucesso' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

