import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'training_sessions.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      fs.writeFileSync(FILE_PATH, JSON.stringify({ sessions: {}, schedule: {} }, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de sessões local indisponível:', e);
  }
}

export async function GET(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    let sessions: Record<string, any> = {};
    let schedule: Record<string, any> = {};
    let weeklyPlan: Record<string, any> = {};

    // 1. Fetch from Supabase if configured (global cross-device persistence)
    if (isSupabaseConfigured && supabase) {
      // 1a. Fallback row in athletes table is the authoritative rich store (full JSON object with exact match hours, deadlines, etc.)
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__TRAINING_SESSIONS__')
          .single();

        if (!athError && athData?.name) {
          const fallbackData = JSON.parse(athData.name);
          if (fallbackData.sessions && typeof fallbackData.sessions === 'object') {
            sessions = { ...fallbackData.sessions };
          }
          if (fallbackData.schedule && typeof fallbackData.schedule === 'object') {
            schedule = { ...fallbackData.schedule };
          }
          if (fallbackData.weeklyPlan && typeof fallbackData.weeklyPlan === 'object') {
            weeklyPlan = { ...fallbackData.weeklyPlan };
          }
        }
      } catch (e) {
        console.warn('Erro ao ler fallback __TRAINING_SESSIONS__ de athletes:', e);
      }

      // 1b. Check primary training_sessions table for any additional records or calendar overrides
      try {
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data && data.length > 0) {
          data.forEach((item: any) => {
            const dateStr = item.date;
            if (!dateStr) return;

            // Fallback row in athletes (1a) is authoritative and rich.
            // Only add records that are entirely missing in sessions, or supplement matchCategory.
            if (!sessions[dateStr]) {
              sessions[dateStr] = {
                date: dateStr,
                dayType: item.day_type || 'training',
                matchCategory: item.match_category || item.matchCategory || undefined,
                matchDayOffset: item.match_day_offset || 'MD-3',
                startTime: item.start_time || (item.day_type === 'match' ? '10:00' : '09:00'),
                endTime: item.end_time || (item.day_type === 'match' ? '11:30' : '10:30'),
                durationMin: item.duration_min || undefined,
                gymStartTime: item.gym_start_time || item.gymStartTime || undefined,
                gymEndTime: item.gym_end_time || item.gymEndTime || undefined,
                gymDurationMin: item.gym_duration_min || item.gymDurationMin || undefined,
                tempStart: item.temp_start !== null && item.temp_start !== undefined ? Number(item.temp_start) : 20.0,
                tempEnd: item.temp_end !== null && item.temp_end !== undefined ? Number(item.temp_end) : 25.0,
                locationTime: item.location_time || 'Campo de São Martinho - Barcelos',
                focusNotes: item.focus_notes || '',
                athleteStatuses: item.athlete_statuses || {},
                customDeadline: item.custom_deadline || undefined,
                customDeadlineWellness: item.custom_deadline_wellness || undefined,
                customDeadlineRpe: item.custom_deadline_rpe || undefined,
                updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : undefined,
              };
            } else {
              const existing = sessions[dateStr];
              // Never overwrite existing customized startTime/endTime/dayType/focusNotes with partial table data
              sessions[dateStr] = {
                ...existing,
                matchCategory: existing.matchCategory || item.match_category || item.matchCategory || undefined,
                gymStartTime: existing.gymStartTime || item.gym_start_time || item.gymStartTime || undefined,
                gymEndTime: existing.gymEndTime || item.gym_end_time || item.gymEndTime || undefined,
                gymDurationMin: existing.gymDurationMin || item.gym_duration_min || item.gymDurationMin || undefined,
                updatedAt: existing.updatedAt || (item.updated_at ? new Date(item.updated_at).getTime() : undefined),
              };
            }
            if (!schedule[dateStr]) {
              schedule[dateStr] = item.day_type || 'training';
            }
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao carregar sessões do Supabase (tabela training_sessions):', dbErr);
      }
    }

    // 2. Merge with local file backup if exists (only filling missing entries)
    try {
      ensureFileExists();
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        const localData = JSON.parse(raw);
        if (localData.sessions) {
          Object.keys(localData.sessions).forEach((dateStr) => {
            if (!sessions[dateStr]) {
              sessions[dateStr] = localData.sessions[dateStr];
            } else {
              sessions[dateStr] = {
                ...localData.sessions[dateStr],
                ...sessions[dateStr],
                matchCategory: sessions[dateStr].matchCategory || localData.sessions[dateStr].matchCategory || undefined,
              };
            }
          });
        }
        schedule = { ...(localData.schedule || {}), ...schedule };
        if (localData.weeklyPlan && typeof localData.weeklyPlan === 'object') {
          weeklyPlan = { ...localData.weeklyPlan, ...weeklyPlan };
        }
      }
    } catch {
      // ignore local file errors in serverless
    }

    const payload = { sessions, schedule, weeklyPlan };
    return NextResponse.json(
      { success: true, sessions, schedule, weeklyPlan, data: payload },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao ler sessões de treino' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    let currentData = { sessions: {} as Record<string, any>, schedule: {} as Record<string, any>, weeklyPlan: {} as Record<string, any> };

    // Load existing state from Supabase fallback row first (authoritative cloud state)
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__TRAINING_SESSIONS__')
          .single();

        if (athData?.name) {
          const cloudData = JSON.parse(athData.name);
          currentData.sessions = cloudData.sessions || {};
          currentData.schedule = cloudData.schedule || {};
          currentData.weeklyPlan = cloudData.weeklyPlan || {};
        }
      } catch {}
    }

    // Load existing state from local file backup only if Supabase had no state
    if (Object.keys(currentData.sessions).length === 0) {
      try {
        ensureFileExists();
        if (fs.existsSync(FILE_PATH)) {
          const raw = fs.readFileSync(FILE_PATH, 'utf-8');
          const parsed = JSON.parse(raw);
          currentData.sessions = parsed.sessions || {};
          currentData.schedule = parsed.schedule || {};
          currentData.weeklyPlan = parsed.weeklyPlan || {};
        }
      } catch {}
    }

    // Update currentData based on request payload
    if ((body.type === 'bulk_sessions' || body.type === 'sessions') && body.sessions && typeof body.sessions === 'object') {
      Object.entries(body.sessions).forEach(([d, sess]: [string, any]) => {
        if (!sess) return;
        const cleanInfo = {
          ...sess,
          updatedAt: sess.updatedAt || Date.now(),
        };
        currentData.sessions[d] = cleanInfo;
        if (sess.dayType) {
          currentData.schedule[d] = sess.dayType;
        }
      });
    } else if (body.type === 'session' && body.info) {
      const cleanInfo = {
        ...body.info,
        updatedAt: body.info.updatedAt || Date.now(),
      };
      currentData.sessions[body.info.date] = cleanInfo;
      if (body.info.dayType) {
        currentData.schedule[body.info.date] = body.info.dayType;
      }
    } else if (body.type === 'schedule' && body.schedule) {
      currentData.schedule = { ...currentData.schedule, ...body.schedule };
    } else if (body.type === 'weekly_plan' && body.weekStartDate && body.metadata) {
      if (!currentData.weeklyPlan) currentData.weeklyPlan = {};
      currentData.weeklyPlan[body.weekStartDate] = body.metadata;
      currentData.weeklyPlan['__current__'] = body.metadata;
    } else if (body.sessions && typeof body.sessions === 'object') {
      Object.entries(body.sessions).forEach(([d, sess]: [string, any]) => {
        if (!sess) return;
        const cleanInfo = {
          ...sess,
          updatedAt: sess.updatedAt || Date.now(),
        };
        currentData.sessions[d] = cleanInfo;
        if (sess.dayType) {
          currentData.schedule[d] = sess.dayType;
        }
      });
    } else if (body.date && body.dayType) {
      currentData.sessions[body.date] = body;
      currentData.schedule[body.date] = body.dayType;
    }

    // 1. Update local file
    try {
      ensureFileExists();
      fs.writeFileSync(FILE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    } catch {}

    // 2. Persist to Supabase authoritative fallback row in athletes table
    if (isSupabaseConfigured && supabase) {
      try {
        const { error: upErr } = await supabase.from('athletes').update({
          name: JSON.stringify(currentData),
          created_at: new Date().toISOString(),
        }).eq('id', '__TRAINING_SESSIONS__');

        if (upErr) {
          await supabase.from('athletes').upsert(
            {
              id: '__TRAINING_SESSIONS__',
              name: JSON.stringify(currentData),
              created_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }
      } catch (e) {
        console.error('Erro ao guardar fallback de sessões em athletes:', e);
      }
    }

    return NextResponse.json({
      success: true,
      sessions: currentData.sessions,
      schedule: currentData.schedule,
      message: 'Informação de treino guardada com sucesso'
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao guardar sessão de treino' }, { status: 500 });
  }
}
