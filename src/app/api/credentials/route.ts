import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'credentials.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      const initial = {
        activationCode: 'GVFC2026',
        adminPin: '2026',
        physioPin: '2026',
        athletePins: {},
        athleteAvatars: {},
        finesEnabledDays: {},
        editedProfiles: {},
        customAthletes: [],
      };
      fs.writeFileSync(FILE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    }
  } catch (e) {
    console.warn('Ficheiro de credenciais indisponível:', e);
  }
}

function getStoredCredentialsFile(): any {
  try {
    ensureFileExists();
    const raw = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { activationCode: 'GVFC2026', adminPin: '2026', physioPin: '2026', athletePins: {}, athleteAvatars: {}, finesEnabledDays: {}, editedProfiles: {}, customAthletes: [] };
  }
}

function saveCredentialsFile(data: any) {
  try {
    ensureFileExists();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Erro ao guardar credenciais em ficheiro:', e);
  }
}

export async function GET(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    let result = getStoredCredentialsFile();

    if (isSupabaseConfigured && supabase) {
      // 1. Try reading primary app_credentials table
      try {
        const { data, error } = await supabase.from('app_credentials').select('*');
        if (!error && data && data.length > 0) {
          data.forEach((item: any) => {
            if (item.key === 'activation_code' && item.value?.code) {
              result.activationCode = item.value.code;
            } else if (item.key === 'admin_pin' && item.value?.pin) {
              result.adminPin = item.value.pin;
            } else if (item.key === 'physio_pin' && item.value?.pin) {
              result.physioPin = item.value.pin;
            } else if (item.key === 'athlete_pins' && item.value) {
              result.athletePins = { ...result.athletePins, ...item.value };
            } else if (item.key === 'athlete_avatars' && item.value) {
              result.athleteAvatars = { ...result.athleteAvatars, ...item.value };
            } else if (item.key === 'fines_enabled_days' && item.value) {
              result.finesEnabledDays = { ...result.finesEnabledDays, ...item.value };
            } else if (item.key === 'edited_profiles' && item.value) {
              result.editedProfiles = { ...result.editedProfiles, ...item.value };
            } else if (item.key === 'custom_athletes' && item.value) {
              result.customAthletes = item.value;
            } else if (item.key === 'reminder_config' && item.value) {
              result.reminderConfig = item.value;
            }
          });
        }
      } catch (e) {
        console.warn('Erro ao ler tabela app_credentials:', e);
      }

      // 2. Try reading fallback __APP_CREDENTIALS__ from athletes table
      try {
        const { data: athData, error: athError } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__APP_CREDENTIALS__')
          .single();

        if (!athError && athData?.name) {
          const fallbackCreds = JSON.parse(athData.name);
          if (fallbackCreds.activationCode) result.activationCode = fallbackCreds.activationCode;
          if (fallbackCreds.adminPin) result.adminPin = fallbackCreds.adminPin;
          if (fallbackCreds.physioPin) result.physioPin = fallbackCreds.physioPin;
          if (fallbackCreds.athletePins) result.athletePins = { ...result.athletePins, ...fallbackCreds.athletePins };
          if (fallbackCreds.athleteAvatars) result.athleteAvatars = { ...result.athleteAvatars, ...fallbackCreds.athleteAvatars };
          if (fallbackCreds.finesEnabledDays) result.finesEnabledDays = { ...result.finesEnabledDays, ...fallbackCreds.finesEnabledDays };
          if (fallbackCreds.editedProfiles) result.editedProfiles = { ...result.editedProfiles, ...fallbackCreds.editedProfiles };
          if (fallbackCreds.customAthletes) result.customAthletes = fallbackCreds.customAthletes;
          if (fallbackCreds.deletedAthletes) result.deletedAthletes = fallbackCreds.deletedAthletes;
          if (fallbackCreds.inactiveAthletes) result.inactiveAthletes = fallbackCreds.inactiveAthletes;
          if (fallbackCreds.reminderConfig) result.reminderConfig = fallbackCreds.reminderConfig;
        }
      } catch (e) {
        console.warn('Erro ao ler fallback __APP_CREDENTIALS__ de athletes:', e);
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao ler credenciais' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const current = getStoredCredentialsFile();

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: athData } = await supabase.from('athletes').select('name').eq('id', '__APP_CREDENTIALS__').single();
        if (athData?.name) {
          const fromCloud = JSON.parse(athData.name);
          if (fromCloud.activationCode) current.activationCode = fromCloud.activationCode;
          if (fromCloud.adminPin) current.adminPin = fromCloud.adminPin;
          if (fromCloud.physioPin) current.physioPin = fromCloud.physioPin;
          if (fromCloud.athletePins) current.athletePins = { ...fromCloud.athletePins, ...current.athletePins };
          if (fromCloud.athleteAvatars) current.athleteAvatars = { ...fromCloud.athleteAvatars, ...current.athleteAvatars };
          if (fromCloud.finesEnabledDays) current.finesEnabledDays = { ...fromCloud.finesEnabledDays, ...current.finesEnabledDays };
          if (fromCloud.editedProfiles) current.editedProfiles = { ...fromCloud.editedProfiles, ...current.editedProfiles };
          if (fromCloud.customAthletes) current.customAthletes = fromCloud.customAthletes;
          if (fromCloud.deletedAthletes) current.deletedAthletes = fromCloud.deletedAthletes;
          if (fromCloud.inactiveAthletes) current.inactiveAthletes = fromCloud.inactiveAthletes;
          if (fromCloud.reminderConfig) current.reminderConfig = fromCloud.reminderConfig;
        }
      } catch {}
    }

    if (body.activationCode !== undefined) {
      current.activationCode = body.activationCode;
    }
    if (body.adminPin !== undefined) {
      current.adminPin = body.adminPin;
    }
    if (body.physioPin !== undefined) {
      current.physioPin = body.physioPin;
    }
    if (body.athletePins !== undefined) {
      current.athletePins = { ...current.athletePins, ...body.athletePins };
    }
    if (body.athleteAvatars !== undefined) {
      current.athleteAvatars = { ...current.athleteAvatars, ...body.athleteAvatars };
    }
    if (body.finesEnabledDays !== undefined) {
      current.finesEnabledDays = { ...current.finesEnabledDays, ...body.finesEnabledDays };
    }
    if (body.editedProfiles !== undefined) {
      current.editedProfiles = { ...(current.editedProfiles || {}), ...body.editedProfiles };
    }
    if (body.deletedAthletes !== undefined) {
      const mergedDeleted = Array.from(new Set([...(current.deletedAthletes || []), ...body.deletedAthletes]));
      current.deletedAthletes = mergedDeleted;
      if (current.customAthletes) {
        current.customAthletes = current.customAthletes.filter((a: any) => !mergedDeleted.includes(a.id));
      }
    }
    if (body.customAthletes !== undefined) {
      const map = new Map<string, any>();
      (current.customAthletes || []).forEach((a: any) => map.set(a.id, a));
      (body.customAthletes || []).forEach((a: any) => map.set(a.id, a));
      const deletedList = current.deletedAthletes || [];
      current.customAthletes = Array.from(map.values()).filter((a: any) => !deletedList.includes(a.id));
    }
    if (body.inactiveAthletes !== undefined) {
      current.inactiveAthletes = body.inactiveAthletes;
    }
    if (body.reminderConfig !== undefined) {
      current.reminderConfig = body.reminderConfig;
    }

    saveCredentialsFile(current);

    if (isSupabaseConfigured && supabase) {
      // 1. Try upserting to primary app_credentials table
      try {
        const updates = [];
        if (body.activationCode !== undefined) {
          updates.push({ key: 'activation_code', value: { code: body.activationCode }, updated_at: new Date().toISOString() });
        }
        if (body.adminPin !== undefined) {
          updates.push({ key: 'admin_pin', value: { pin: body.adminPin }, updated_at: new Date().toISOString() });
        }
        if (body.physioPin !== undefined) {
          updates.push({ key: 'physio_pin', value: { pin: body.physioPin }, updated_at: new Date().toISOString() });
        }
        if (body.athletePins !== undefined) {
          updates.push({ key: 'athlete_pins', value: current.athletePins, updated_at: new Date().toISOString() });
        }
        if (body.athleteAvatars !== undefined) {
          updates.push({ key: 'athlete_avatars', value: current.athleteAvatars, updated_at: new Date().toISOString() });
        }
        if (body.finesEnabledDays !== undefined) {
          updates.push({ key: 'fines_enabled_days', value: current.finesEnabledDays, updated_at: new Date().toISOString() });
        }
        if (body.editedProfiles !== undefined) {
          updates.push({ key: 'edited_profiles', value: current.editedProfiles, updated_at: new Date().toISOString() });
        }
        if (body.customAthletes !== undefined) {
          updates.push({ key: 'custom_athletes', value: current.customAthletes, updated_at: new Date().toISOString() });
        }
        if (body.reminderConfig !== undefined) {
          updates.push({ key: 'reminder_config', value: current.reminderConfig, updated_at: new Date().toISOString() });
        }

        if (updates.length > 0) {
          await supabase.from('app_credentials').upsert(updates, { onConflict: 'key' });
        }
      } catch (e) {
        console.warn('Falha no upsert app_credentials (ignorado):', e);
      }

      // 2. Always upsert to fallback __APP_CREDENTIALS__ row in athletes table for guaranteed persistence
      try {
        await supabase.from('athletes').upsert(
          {
            id: '__APP_CREDENTIALS__',
            name: JSON.stringify(current),
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.error('Erro ao guardar fallback em athletes:', e);
      }
    }

    return NextResponse.json({ success: true, data: current, message: 'Credenciais guardadas permanentemente na nuvem.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao guardar credenciais' }, { status: 500 });
  }
}
