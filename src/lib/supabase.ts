import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Initializes real-time subscriptions with Supabase on the client side.
 * When ANY table row changes (athletes, training_sessions, wellness, RPE, hydration),
 * the callback is immediately triggered to update all connected devices in milliseconds.
 */
export function initRealtimeCloudSync(onSync: () => void): () => void {
  if (typeof window === 'undefined' || !supabase) return () => {};

  try {
    const channel = supabase
      .channel('femperf_realtime_global')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athletes' },
        () => {
          onSync();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'training_sessions' },
        () => {
          onSync();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wellness_entries' },
        () => {
          onSync();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rpe_entries' },
        () => {
          onSync();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hydration_entries' },
        () => {
          onSync();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 Supabase Realtime ativo: alterações propagam-se instantaneamente entre dispositivos.');
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Aviso: Falha ao inicializar canais Supabase Realtime:', err);
    return () => {};
  }
}
