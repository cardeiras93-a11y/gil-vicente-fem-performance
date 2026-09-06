import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { calculateHydrationStatus } from '@/lib/data';

export async function POST(request: Request) {
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

    if (!athleteId || !preWeight || !postWeight) {
      return NextResponse.json({ error: 'Pesos pré e pós-treino são obrigatórios' }, { status: 400 });
    }

    const calc = calculateHydrationStatus(Number(preWeight), Number(postWeight), Number(fluidsIntake || 0));

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
            athleteId,
            athleteName,
            date: date || new Date().toISOString().split('T')[0],
            durationMin: durationMin || 90,
            preWeight: Number(preWeight),
            postWeight: Number(postWeight),
            fluidsIntake: Number(fluidsIntake || 0),
            weightLoss: calc.weightLoss,
            dehydrationRate: calc.dehydrationRate,
            status: calc.status,
            refillNeededLiters: calc.refillNeededLiters,
            recommendation: calc.recommendation,
            biologicalImpact: calc.biologicalImpact,
          }),
        });
        sheetSynced = true;
      } catch (err) {
        console.error('Google Sheets sync error:', err);
      }
    }

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('hydration_entries').insert([
        {
          athlete_id: athleteId,
          athlete_name: athleteName,
          date: date || new Date().toISOString().split('T')[0],
          duration_min: durationMin || null,
          pre_weight: preWeight,
          post_weight: postWeight,
          fluids_intake: fluidsIntake || 0,
          weight_loss: calc.weightLoss,
          dehydration_rate: calc.dehydrationRate,
          status: calc.status,
          refill_needed_liters: calc.refillNeededLiters,
          recommendation: calc.recommendation,
          biological_impact: calc.biologicalImpact,
        },
      ]).select();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: data[0], calc, sheetSynced }, { status: 201 });
    }

    return NextResponse.json(
      { success: true, calc, sheetSynced, message: 'Dados de hidratação calculados e guardados.' },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro no servidor' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const athleteId = searchParams.get('athleteId');

  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('hydration_entries').select('*').order('created_at', { ascending: false });
    if (athleteId) {
      query = query.eq('athlete_id', athleteId);
    }
    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  }

  return NextResponse.json({
    success: true,
    message: 'Modo local ativo. Define VERCEL/Supabase env vars para persistência cloud.',
    data: []
  });
}
