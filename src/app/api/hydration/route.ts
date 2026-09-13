import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { calculateHydrationStatus } from '@/lib/data';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'hydration_entries.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de hidratação indisponível:', e);
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
      // 2. Try primary hydration_entries table
      try {
        let query = supabase.from('hydration_entries').select('*').order('created_at', { ascending: false });
        if (athleteId) {
          query = query.eq('athlete_id', athleteId);
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach((item: any) => {
            const mapped = {
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
            };
            entryMap.set(mapped.id, mapped);
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao ler tabela hydration_entries:', dbErr);
      }

      // 3. Fallback: read __HYDRATION_ENTRIES__ row in athletes table for guaranteed cross-device persistence
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__HYDRATION_ENTRIES__')
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
        console.warn('Erro ao ler fallback __HYDRATION_ENTRIES__ de athletes:', e);
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
      durationMin,
      preWeight,
      postWeight,
      fluidsIntake,
    } = body;

    if (!athleteId || preWeight === undefined || postWeight === undefined) {
      return NextResponse.json({ error: 'Pesos pré e pós-treino são obrigatórios' }, { status: 400 });
    }

    const parseVal = (v: any): number => {
      if (v === null || v === undefined || v === '') return 0;
      const str = String(v).trim().replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    const numPre = parseVal(preWeight);
    const numPost = parseVal(postWeight);
    const numFluids = parseVal(fluidsIntake);

    const calc = calculateHydrationStatus(numPre, numPost, numFluids);
    const entryDate = date || new Date().toISOString().split('T')[0];

    const entryToSave = {
      id: body.id || `hyd-${entryDate}-${athleteId}`,
      athleteId,
      athleteName,
      date: entryDate,
      durationMin: durationMin || 90,
      preWeight: numPre,
      postWeight: numPost,
      fluidsIntake: numFluids,
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
      // 2a. Try primary hydration_entries table
      try {
        await supabase.from('hydration_entries').upsert([
          {
            id: entryToSave.id,
            athlete_id: athleteId,
            athlete_name: athleteName,
            date: entryDate,
            duration_min: durationMin || null,
            pre_weight: numPre,
            post_weight: numPost,
            fluids_intake: numFluids,
            weight_loss: calc.weightLoss,
            dehydration_rate: calc.dehydrationRate,
            status: calc.status,
            refill_needed_liters: calc.refillNeededLiters,
            recommendation: calc.recommendation,
            biological_impact: calc.biologicalImpact,
          },
        ], { onConflict: 'id' });
      } catch (e) {
        console.warn('Erro na tabela hydration_entries (ignorado):', e);
      }

      // 2b. Always upsert fallback __HYDRATION_ENTRIES__ row in athletes table for guaranteed persistence
      try {
        let existingFallback: any[] = [];
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__HYDRATION_ENTRIES__')
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
            id: '__HYDRATION_ENTRIES__',
            name: JSON.stringify(existingFallback),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback __HYDRATION_ENTRIES__ em athletes:', e);
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

export async function DELETE(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      // 1. Try deleting from primary hydration_entries table
      try {
        await supabase.from('hydration_entries').delete().eq('id', id);
      } catch {}

      // 2. Also delete from fallback __HYDRATION_ENTRIES__ row in athletes table
      try {
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__HYDRATION_ENTRIES__')
          .single();

        if (athData?.name) {
          const fallbackList: any[] = JSON.parse(athData.name);
          const filtered = fallbackList.filter((e) => e.id !== id);
          await supabase.from('athletes').upsert(
            {
              id: '__HYDRATION_ENTRIES__',
              name: JSON.stringify(filtered),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
      } catch (e) {
        console.error('Erro ao apagar registo em fallback __HYDRATION_ENTRIES__:', e);
      }
    }

    try {
      ensureFileExists();
      const entries = getStoredEntries();
      const filtered = entries.filter((e: any) => e.id !== id);
      fs.writeFileSync(FILE_PATH, JSON.stringify(filtered, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao apagar entrada no ficheiro:', e);
    }

    return NextResponse.json({ success: true, message: 'Registo de hidratação apagado' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao apagar registo' }, { status: 500 });
  }
}
