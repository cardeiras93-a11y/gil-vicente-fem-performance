import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

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

    // 1. Fetch from Supabase if configured (global cross-device persistence)
    if (isSupabaseConfigured && supabase) {
      // 1a. Try primary training_sessions table
      try {
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .order('date', { ascending: true });

        if (!error && data) {
          data.forEach((item: any) => {
            const dateStr = item.date;
            sessions[dateStr] = {
              date: dateStr,
              dayType: item.day_type || 'training',
              matchDayOffset: item.match_day_offset || 'MD-3',
              startTime: item.start_time || '10:00',
              endTime: item.end_time || '11:30',
              tempStart: item.temp_start !== null && item.temp_start !== undefined ? Number(item.temp_start) : 20.0,
              tempEnd: item.temp_end !== null && item.temp_end !== undefined ? Number(item.temp_end) : 25.0,
              locationTime: item.location_time || 'Campo de São Martinho - Barcelos',
              focusNotes: item.focus_notes || '',
              athleteStatuses: item.athlete_statuses || {},
            };
            schedule[dateStr] = item.day_type || 'training';
          });
        }
      } catch (dbErr) {
        console.warn('Erro ao carregar sessões do Supabase (tabela training_sessions):', dbErr);
      }

      // 1b. Fallback: read __TRAINING_SESSIONS__ row in athletes table for guaranteed cross-device persistence
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__TRAINING_SESSIONS__')
          .single();

        if (!athError && athData?.name) {
          const fallbackData = JSON.parse(athData.name);
          if (fallbackData.sessions) {
            sessions = { ...fallbackData.sessions, ...sessions };
          }
          if (fallbackData.schedule) {
            schedule = { ...fallbackData.schedule, ...schedule };
          }
        }
      } catch (e) {
        console.warn('Erro ao ler fallback __TRAINING_SESSIONS__ de athletes:', e);
      }
    }

    // 2. Merge with local file backup if exists
    try {
      ensureFileExists();
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        const localData = JSON.parse(raw);
        sessions = { ...(localData.sessions || {}), ...sessions };
        schedule = { ...(localData.schedule || {}), ...schedule };
      }
    } catch {
      // ignore local file errors in serverless
    }

    const payload = { sessions, schedule };
    return NextResponse.json({ success: true, sessions, schedule, data: payload }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao ler sessões de treino' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    let currentData = { sessions: {} as Record<string, any>, schedule: {} as Record<string, any> };

    // Load existing state from local file backup if readable
    try {
      ensureFileExists();
      if (fs.existsSync(FILE_PATH)) {
        const raw = fs.readFileSync(FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        currentData.sessions = parsed.sessions || {};
        currentData.schedule = parsed.schedule || {};
      }
    } catch {}

    // Load existing state from Supabase fallback row to ensure clean merging
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: athData } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__TRAINING_SESSIONS__')
          .single();

        if (athData?.name) {
          const cloudData = JSON.parse(athData.name);
          currentData.sessions = { ...(cloudData.sessions || {}), ...currentData.sessions };
          currentData.schedule = { ...(cloudData.schedule || {}), ...currentData.schedule };
        }
      } catch {}
    }

    // Update currentData based on request payload
    if (body.type === 'session' && body.info) {
      currentData.sessions[body.info.date] = body.info;
      if (body.info.dayType) {
        currentData.schedule[body.info.date] = body.info.dayType;
      }
    } else if (body.type === 'schedule' && body.schedule) {
      currentData.schedule = { ...currentData.schedule, ...body.schedule };
    } else if (body.date && body.dayType) {
      currentData.sessions[body.date] = body;
      currentData.schedule[body.date] = body.dayType;
    }

    // 1. Update local file
    try {
      ensureFileExists();
      fs.writeFileSync(FILE_PATH, JSON.stringify(currentData, null, 2), 'utf-8');
    } catch {}

    // 2. Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      // 2a. Try upserting to primary training_sessions table
      try {
        if (body.type === 'session' && body.info) {
          const info = body.info;
          await supabase.from('training_sessions').upsert([
            {
              date: info.date,
              day_type: info.dayType || 'training',
              match_day_offset: info.matchDayOffset || 'MD-3',
              start_time: info.startTime || '10:00',
              end_time: info.endTime || '11:30',
              temp_start: info.tempStart !== undefined ? info.tempStart : 20.0,
              temp_end: info.tempEnd !== undefined ? info.tempEnd : 25.0,
              location_time: info.locationTime || 'Campo de São Martinho - Barcelos',
              focus_notes: info.focusNotes || '',
              athlete_statuses: info.athleteStatuses || {},
            },
          ]);
        } else if (body.type === 'schedule' && body.schedule) {
          const updates = Object.entries(body.schedule).map(([date, dayType]) => ({
            date,
            day_type: dayType as string,
          }));
          if (updates.length > 0) {
            await supabase.from('training_sessions').upsert(updates, { onConflict: 'date' });
          }
        } else if (body.date && body.dayType) {
          await supabase.from('training_sessions').upsert([
            {
              date: body.date,
              day_type: body.dayType,
              match_day_offset: body.matchDayOffset || 'MD-3',
              start_time: body.startTime || '10:00',
              end_time: body.endTime || '11:30',
              location_time: body.locationTime || 'Campo de São Martinho - Barcelos',
              focus_notes: body.focusNotes || '',
              athlete_statuses: body.athleteStatuses || {},
            },
          ]);
        }
      } catch (dbErr) {
        console.warn('Erro ao guardar sessão na tabela training_sessions (ignorado):', dbErr);
      }

      // 2b. Always upsert fallback __TRAINING_SESSIONS__ row in athletes table for guaranteed persistence
      try {
        await supabase.from('athletes').upsert(
          {
            id: '__TRAINING_SESSIONS__',
            name: JSON.stringify(currentData),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback de sessões em athletes:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'Informação de treino guardada com sucesso' }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao guardar sessão de treino' }, { status: 500 });
  }
}
