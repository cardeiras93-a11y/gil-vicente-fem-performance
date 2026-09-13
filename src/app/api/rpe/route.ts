import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'rpe_entries.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de RPE indisponível:', e);
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
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const athleteId = searchParams.get('athleteId');

    const entryMap = new Map<string, any>();

    // 1. Fetch from local file
    const localEntries = getStoredEntries();
    localEntries.forEach((e) => entryMap.set(e.id || `${e.athleteId}-${e.date}`, e));

    if (isSupabaseConfigured && supabase) {
      // 2. Try primary rpe_entries table
      try {
        let query = supabase.from('rpe_entries').select('*').order('created_at', { ascending: false });
        if (athleteId) {
          query = query.eq('athlete_id', athleteId);
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach((item: any) => {
            const mapped = {
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
            };
            entryMap.set(mapped.id, mapped);
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao ler tabela rpe_entries:', dbErr);
      }

      // 3. Fallback: read __RPE_ENTRIES__ row in athletes table for guaranteed cross-device persistence
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__RPE_ENTRIES__')
          .single();

        if (!athError && athData?.name) {
          const fallbackList: any[] = JSON.parse(athData.name);
          if (Array.isArray(fallbackList)) {
            fallbackList.forEach((e) => {
              const key = e.id || `${e.athleteId}-${e.date}`;
              if (!entryMap.has(key)) {
                entryMap.set(key, e);
              }
            });
          }
        }
      } catch (e) {
        console.warn('Erro ao ler fallback __RPE_ENTRIES__ de athletes:', e);
      }
    }

    let result = Array.from(entryMap.values());
    if (athleteId) {
      result = result.filter((e) => e.athleteId === athleteId);
    }

    result.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

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
      physicalDemand: Number(physicalDemand),
      postFatigue: Number(postFatigue || 0),
      muscleFatigue: muscleFatigue || {},
      preWorkoutPlans: preWorkoutPlans || [],
      comments: comments || null,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    // 1. Save to local file backup
    saveEntryToFile(entryToSave);

    // 2. Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      // 2a. Try primary rpe_entries table
      try {
        await supabase.from('rpe_entries').upsert([
          {
            id: entryToSave.id,
            athlete_id: athleteId,
            athlete_name: athleteName,
            date,
            physical_demand: entryToSave.physicalDemand,
            post_fatigue: entryToSave.postFatigue,
            muscle_fatigue: entryToSave.muscleFatigue,
            pre_workout_plans: entryToSave.preWorkoutPlans,
            comments: entryToSave.comments,
          },
        ], { onConflict: 'id' });
      } catch (e) {
        console.warn('Erro na tabela rpe_entries (ignorado):', e);
      }

      // 2b. Always upsert fallback __RPE_ENTRIES__ row in athletes table for guaranteed persistence
      try {
        let existingFallback: any[] = [];
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__RPE_ENTRIES__')
          .single();

        if (athData?.name) {
          try { existingFallback = JSON.parse(athData.name); } catch {}
        }

        const index = existingFallback.findIndex((e: any) => e.id === entryToSave.id || (e.date === entryToSave.date && e.athleteId === entryToSave.athleteId));
        if (index !== -1) {
          existingFallback[index] = { ...existingFallback[index], ...entryToSave };
        } else {
          existingFallback.unshift(entryToSave);
        }

        await supabase.from('athletes').upsert(
          {
            id: '__RPE_ENTRIES__',
            name: JSON.stringify(existingFallback),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback __RPE_ENTRIES__ em athletes:', e);
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
