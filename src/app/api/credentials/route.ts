import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { verifyApiAuth } from '@/lib/authGuard';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'credentials.json');

function ensureFileExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(FILE_PATH)) {
      const initial = {
        activationCode: 'GVFC2026@',
        adminPin: '2026',
        physioPin: '2026',
        athletePins: {},
        athleteAvatars: {},
        finesEnabledDays: {},
        individualFineExemptions: {},
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
    return { activationCode: 'GVFC2026@', adminPin: '2026', physioPin: '2026', athletePins: {}, athleteAvatars: {}, finesEnabledDays: {}, individualFineExemptions: {}, editedProfiles: {}, customAthletes: [] };
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
            } else if (item.key === 'individual_fine_exemptions' && item.value) {
              result.individualFineExemptions = { ...result.individualFineExemptions, ...item.value };
            } else if (item.key === 'edited_profiles' && item.value) {
              result.editedProfiles = { ...result.editedProfiles, ...item.value };
            } else if (item.key === 'custom_athletes' && item.value) {
              result.customAthletes = item.value;
            } else if (item.key === 'reminder_config' && item.value) {
              result.reminderConfig = item.value;
            } else if (item.key === 'deadline_config' && item.value) {
              result.deadlineConfig = item.value;
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
          if (fallbackCreds.individualFineExemptions) result.individualFineExemptions = { ...result.individualFineExemptions, ...fallbackCreds.individualFineExemptions };
          if (fallbackCreds.editedProfiles) result.editedProfiles = { ...result.editedProfiles, ...fallbackCreds.editedProfiles };
          if (fallbackCreds.customAthletes) result.customAthletes = fallbackCreds.customAthletes;
          if (fallbackCreds.deletedAthletes) result.deletedAthletes = fallbackCreds.deletedAthletes;
          if (fallbackCreds.inactiveAthletes) result.inactiveAthletes = fallbackCreds.inactiveAthletes;
          if (fallbackCreds.reminderConfig) result.reminderConfig = fallbackCreds.reminderConfig;
          if (fallbackCreds.deadlineConfig) result.deadlineConfig = fallbackCreds.deadlineConfig;
          if (fallbackCreds.physioAttendance) result.physioAttendance = fallbackCreds.physioAttendance;
        }
      } catch (e) {
        console.warn('Erro ao ler fallback __APP_CREDENTIALS__ de athletes:', e);
      }

      // 3. Read native athletes from public.athletes table to ensure dual-layer permanent persistence
      try {
        const { data: dbAthletes, error: athError } = await supabase
          .from('athletes')
          .select('id, name')
          .order('name');

        if (!athError && dbAthletes && Array.isArray(dbAthletes)) {
          const initialIds = new Set([
            'ath-1','ath-2','ath-3','ath-4','ath-5','ath-6','ath-7','ath-8','ath-9','ath-10',
            'ath-11','ath-12','ath-13','ath-14','ath-15','ath-16','ath-17','ath-18','ath-19','ath-20',
            'ath-21','ath-22','ath-23','ath-24','ath-25','ath-26','ath-27'
          ]);
          const deletedSet = new Set(result.deletedAthletes || []);
          const existingMap = new Map<string, any>();
          (result.customAthletes || []).forEach((ca: any) => existingMap.set(ca.id, ca));

          dbAthletes.forEach((row: any) => {
            if (row.id && !row.id.startsWith('__') && !initialIds.has(row.id) && !deletedSet.has(row.id)) {
              if (!existingMap.has(row.id)) {
                existingMap.set(row.id, {
                  id: row.id,
                  name: row.name,
                  position: 'Campo',
                });
              }
            }
          });

          result.customAthletes = Array.from(existingMap.values()).filter((a: any) => !deletedSet.has(a.id));
        }
      } catch (e) {
        console.warn('Erro ao carregar atletas adicionais de athletes table:', e);
      }
    }

    result.activationCode = result.activationCode || 'GVFC2026@';
    const existingDeadlineConfig = result.deadlineConfig || {};
    let getWellnessMatch = existingDeadlineConfig.wellnessMatchTime;
    if (!getWellnessMatch || getWellnessMatch === '11:00') getWellnessMatch = '12:00';
    let getRpeMatch = existingDeadlineConfig.rpeMatchTime;
    if (!getRpeMatch || getRpeMatch === '22:00') getRpeMatch = '18:30';

    result.deadlineConfig = {
      ...existingDeadlineConfig,
      enabled: existingDeadlineConfig.enabled !== undefined ? existingDeadlineConfig.enabled : true,
      strictBlock: false,
      applyToWellness: existingDeadlineConfig.applyToWellness !== undefined ? existingDeadlineConfig.applyToWellness : true,
      applyToRpe: existingDeadlineConfig.applyToRpe !== undefined ? existingDeadlineConfig.applyToRpe : true,
      applyToHydration: false,
      allowLateWithApproval: false,
      wellnessRegularTime: existingDeadlineConfig.wellnessRegularTime || '08:15',
      wellnessMatchTime: getWellnessMatch,
      rpeRegularTime: existingDeadlineConfig.rpeRegularTime || '14:00',
      rpeMatchTime: getRpeMatch,
    };

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
          if (fromCloud.individualFineExemptions) current.individualFineExemptions = { ...fromCloud.individualFineExemptions, ...(current.individualFineExemptions || {}) };
          if (fromCloud.editedProfiles) current.editedProfiles = { ...fromCloud.editedProfiles, ...current.editedProfiles };
          if (fromCloud.customAthletes) current.customAthletes = fromCloud.customAthletes;
          if (fromCloud.deletedAthletes) current.deletedAthletes = fromCloud.deletedAthletes;
          if (fromCloud.inactiveAthletes) current.inactiveAthletes = fromCloud.inactiveAthletes;
          if (fromCloud.reminderConfig) current.reminderConfig = fromCloud.reminderConfig;
          if (fromCloud.deadlineConfig) current.deadlineConfig = { ...fromCloud.deadlineConfig, ...(current.deadlineConfig || {}) };
          if (fromCloud.physioAttendance) current.physioAttendance = { ...fromCloud.physioAttendance, ...current.physioAttendance };
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
    if (body.physioAttendance !== undefined) {
      current.physioAttendance = { ...(current.physioAttendance || {}), ...body.physioAttendance };
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
    if (body.replaceIndividualFineExemptions !== undefined) {
      current.individualFineExemptions = body.replaceIndividualFineExemptions;
    } else if (body.individualFineExemptions !== undefined) {
      current.individualFineExemptions = { ...(current.individualFineExemptions || {}), ...body.individualFineExemptions };
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
    if (body.deadlineConfig !== undefined) {
      const incoming = body.deadlineConfig || {};
      let postWellnessMatch = incoming.wellnessMatchTime;
      if (!postWellnessMatch || postWellnessMatch === '11:00') postWellnessMatch = '12:00';
      let postRpeMatch = incoming.rpeMatchTime;
      if (!postRpeMatch || postRpeMatch === '22:00') postRpeMatch = '18:30';

      current.deadlineConfig = {
        ...incoming,
        enabled: incoming.enabled !== undefined ? incoming.enabled : true,
        wellnessRegularTime: incoming.wellnessRegularTime || '08:15',
        wellnessMatchTime: postWellnessMatch,
        rpeRegularTime: incoming.rpeRegularTime || '14:00',
        rpeMatchTime: postRpeMatch,
        strictBlock: false, // Nunca bloqueia o preenchimento
        applyToHydration: false, // Pesagem sempre sem restrição
        applyToWellness: incoming.applyToWellness !== undefined ? incoming.applyToWellness : true,
        applyToRpe: incoming.applyToRpe !== undefined ? incoming.applyToRpe : true,
      };
    }

    current.activationCode = current.activationCode || 'GVFC2026@';

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
        if (body.individualFineExemptions !== undefined || body.replaceIndividualFineExemptions !== undefined) {
          updates.push({ key: 'individual_fine_exemptions', value: current.individualFineExemptions, updated_at: new Date().toISOString() });
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
        if (body.deadlineConfig !== undefined) {
          updates.push({ key: 'deadline_config', value: current.deadlineConfig, updated_at: new Date().toISOString() });
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

      // 3. Upsert custom athletes directly into public.athletes table
      if (body.customAthletes && Array.isArray(body.customAthletes)) {
        try {
          const rowsToUpsert = body.customAthletes
            .filter((a: any) => a.id && a.name && !a.id.startsWith('__'))
            .map((a: any) => ({
              id: a.id,
              name: a.name.trim().toUpperCase(),
              created_at: new Date().toISOString(),
            }));
          if (rowsToUpsert.length > 0) {
            await supabase.from('athletes').upsert(rowsToUpsert, { onConflict: 'id' });
          }
        } catch (e) {
          console.warn('Erro ao upsert em athletes table:', e);
        }
      }

      // 4. Delete removed athletes from public.athletes table
      if (body.deletedAthletes && Array.isArray(body.deletedAthletes)) {
        try {
          const idsToDelete = body.deletedAthletes.filter((id: string) => id && !id.startsWith('__'));
          if (idsToDelete.length > 0) {
            await supabase.from('athletes').delete().in('id', idsToDelete);
          }
        } catch (e) {
          console.warn('Erro ao apagar atletas em athletes table:', e);
        }
      }
    }

    return NextResponse.json({ success: true, data: current, message: 'Credenciais guardadas permanentemente na nuvem.' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao guardar credenciais' }, { status: 500 });
  }
}
