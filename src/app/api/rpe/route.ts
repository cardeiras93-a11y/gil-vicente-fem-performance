import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

    if (!athleteId || !date || !physicalDemand) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('rpe_entries').insert([
        {
          athlete_id: athleteId,
          athlete_name: athleteName,
          date,
          physical_demand: physicalDemand,
          post_fatigue: postFatigue,
          muscle_fatigue: muscleFatigue,
          pre_workout_plans: preWorkoutPlans || [],
          comments: comments || null,
        },
      ]).select();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data }, { status: 201 });
    }

    return NextResponse.json(
      { success: true, message: 'RPE guardado com sucesso (modo local/offline)' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}
