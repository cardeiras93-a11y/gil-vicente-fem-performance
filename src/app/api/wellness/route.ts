import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('wellness_entries').insert([
        {
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
      ]).select();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    // Local / Serverless fallback response
    return NextResponse.json(
      { success: true, message: 'Guardado com sucesso (modo local/offline)' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}
