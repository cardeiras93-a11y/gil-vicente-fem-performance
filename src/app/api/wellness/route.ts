import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import { calculateHydrationStatus } from '@/lib/data';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'wellness_entries.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de wellness indisponível:', e);
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
      // 2. Try primary wellness_entries table
      try {
        let query = supabase.from('wellness_entries').select('*').order('created_at', { ascending: false });
        if (athleteId) {
          query = query.eq('athlete_id', athleteId);
        }
        const { data, error } = await query;
        if (!error && data) {
          data.forEach((item: any) => {
            const mapped = {
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
              wellnessTotal: Number((item.sleep_quality || 0) + (item.sleep_duration || 0) + (item.mood || 0) + (item.stress || 0) + (item.fatigue || 0) + (item.soreness || 0) + (item.heavy_legs || 0)),
              muscleFatigue: item.muscle_fatigue || {},
              needsPhysio: Boolean(item.needs_physio),
              physioReason: item.physio_reason || null,
              submittedAt: item.submitted_at || item.submittedAt || item.created_at || item.date,
              isLate: Boolean(item.is_late ?? item.isLate),
              isAuthorizedLate: Boolean(item.is_authorized_late ?? item.isAuthorizedLate),
              approvalStatus: item.approval_status || item.approvalStatus || 'approved',
              keepFine: Boolean(item.keep_fine ?? item.keepFine),
              reviewedAt: item.reviewed_at || item.reviewedAt || null,
              reviewedBy: item.reviewed_by || item.reviewedBy || null,
              createdAt: item.created_at || item.date,
            };
            entryMap.set(mapped.id, mapped);
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao ler tabela wellness_entries:', dbErr);
      }

      // 3. Fallback: read __WELLNESS_ENTRIES__ row in athletes table for guaranteed cross-device persistence
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__WELLNESS_ENTRIES__')
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
        console.warn('Erro ao ler fallback __WELLNESS_ENTRIES__ de athletes:', e);
      }
    }

    let result = Array.from(entryMap.values());
    if (athleteId) {
      result = result.filter((e) => e.athleteId === athleteId);
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    return NextResponse.json(
      { success: true, data: result },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
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
      sleepQuality: Number(sleepQuality || 0),
      sleepDuration: Number(sleepDuration || 0),
      mood: Number(mood || 0),
      stress: Number(stress || 0),
      fatigue: Number(fatigue || 0),
      soreness: Number(soreness || 0),
      heavyLegs: Number(heavyLegs || 0),
      wellnessTotal: body.wellnessTotal || (Number(sleepQuality || 0) + Number(sleepDuration || 0) + Number(mood || 0) + Number(stress || 0) + Number(fatigue || 0) + Number(soreness || 0) + Number(heavyLegs || 0)),
      muscleFatigue: muscleFatigue || {},
      needsPhysio: Boolean(needsPhysio),
      physioReason: physioReason || null,
      submittedAt: body.submittedAt || body.createdAt || new Date().toISOString(),
      isLate: Boolean(body.isLate),
      isAuthorizedLate: Boolean(body.isAuthorizedLate),
      approvalStatus: body.approvalStatus || (Boolean(body.isLate) && !body.isAuthorizedLate ? 'pending' : 'approved'),
      keepFine: Boolean(body.keepFine),
      reviewedAt: body.reviewedAt || null,
      reviewedBy: body.reviewedBy || null,
      createdAt: body.createdAt || new Date().toISOString(),
      morningWeight: body.morningWeight ? Number(body.morningWeight) : undefined,
    };

    // Auto-sync morningWeight to hydration_entries as a reliable safety net
    if (body.morningWeight && Number(body.morningWeight) > 0 && isSupabaseConfigured && supabase) {
      try {
        const hydId = `hyd-${date}-${athleteId}`;
        const numWeight = Number(body.morningWeight);
        const { data: existingHyd } = await supabase
          .from('hydration_entries')
          .select('*')
          .eq('id', hydId)
          .single();

        if (existingHyd && Number(existingHyd.post_weight) > 0) {
          const calc = calculateHydrationStatus(numWeight, Number(existingHyd.post_weight), Number(existingHyd.fluids_intake || 0));
          await supabase.from('hydration_entries').update({
            pre_weight: numWeight,
            weight_loss: calc.weightLoss,
            dehydration_rate: calc.dehydrationRate,
            status: calc.status,
            refill_needed_liters: calc.refillNeededLiters,
            recommendation: calc.recommendation,
            biological_impact: calc.biologicalImpact,
          }).eq('id', hydId);
        } else {
          await supabase.from('hydration_entries').upsert([
            {
              id: hydId,
              athlete_id: athleteId,
              athlete_name: athleteName,
              date: date,
              duration_min: existingHyd?.duration_min || 90,
              pre_weight: numWeight,
              post_weight: existingHyd?.post_weight || 0,
              fluids_intake: existingHyd?.fluids_intake || 0,
              weight_loss: existingHyd?.weight_loss || 0,
              dehydration_rate: existingHyd?.dehydration_rate || 0,
              status: existingHyd?.status || 'Pendente',
              refill_needed_liters: existingHyd?.refill_needed_liters || 0,
              recommendation: existingHyd?.recommendation || 'Peso Matinal / Pré-Treino registado. Conclui no final do treino.',
              biological_impact: existingHyd?.biological_impact || 'Aguardando pesagem pós-treino',
            }
          ], { onConflict: 'id' });
        }
      } catch {}
    }

    // 1. Save to local JSON file backup
    saveEntryToFile(entryToSave);

    // 2. Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      // 2a. Try upserting to primary wellness_entries table
      try {
        await supabase.from('wellness_entries').upsert([
          {
            id: entryToSave.id,
            athlete_id: athleteId,
            athlete_name: athleteName,
            date,
            menstrual_cycle: menstrualCycle,
            sleep_quality: entryToSave.sleepQuality,
            sleep_duration: entryToSave.sleepDuration,
            mood: entryToSave.mood,
            stress: entryToSave.stress,
            fatigue: entryToSave.fatigue,
            soreness: entryToSave.soreness,
            heavy_legs: entryToSave.heavyLegs,
            muscle_fatigue: entryToSave.muscleFatigue,
            needs_physio: entryToSave.needsPhysio,
            physio_reason: entryToSave.physioReason,
          },
        ], { onConflict: 'id' });
      } catch (e) {
        console.warn('Erro na tabela wellness_entries (ignorado):', e);
      }

      // 2b. Always upsert fallback __WELLNESS_ENTRIES__ row in athletes table for guaranteed persistence
      try {
        let existingFallback: any[] = [];
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__WELLNESS_ENTRIES__')
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
            id: '__WELLNESS_ENTRIES__',
            name: JSON.stringify(existingFallback),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback __WELLNESS_ENTRIES__ em athletes:', e);
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
