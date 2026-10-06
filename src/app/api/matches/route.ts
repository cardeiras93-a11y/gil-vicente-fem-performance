import { NextResponse } from 'next/server';
import { getAllMatches, getMatchById, calculateTeamKpis, calculateSectorAverages } from '@/data/matchRegistry';
import { normalizeAthleteName, sanitizeMatchForAthlete } from '@/lib/matchAcl';
import { verifyApiAuth } from '@/lib/authGuard';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Verify app security token
  const authError = verifyApiAuth(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
  const isSync = searchParams.get('sync') === 'true' || searchParams.get('customizations') === 'true';

  // If requesting customizations sync
  if (isSync) {
    let customizations = {
      minutesOverrides: {},
      categoryOverrides: {},
      customMatches: [],
      updatedAt: 0,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__MATCH_CUSTOMIZATIONS__')
          .single();
        if (data?.name) {
          const parsed = JSON.parse(data.name);
          customizations = {
            minutesOverrides: parsed.minutesOverrides || {},
            categoryOverrides: parsed.categoryOverrides || {},
            customMatches: parsed.customMatches || [],
            updatedAt: parsed.updatedAt || 0,
          };
        }
      } catch (e) {
        console.warn('Erro ao carregar __MATCH_CUSTOMIZATIONS__ do Supabase:', e);
      }
    }

    return NextResponse.json(
      { success: true, data: customizations },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  }

  const role = searchParams.get('role') || 'athlete';
  const rawAthleteName = searchParams.get('athleteName') || searchParams.get('athlete') || '';
  const matchId = searchParams.get('matchId') || searchParams.get('id');
  const view = searchParams.get('view') || 'collective';

  const allMatches = getAllMatches();

  // 2. Admin access: Return unrestricted full data
  if (role === 'admin' || role === 'coach') {
    if (matchId) {
      const match = getMatchById(matchId);
      return NextResponse.json({
        success: true,
        role: 'admin',
        match,
        teamKpis: calculateTeamKpis(match),
        sectorAverages: calculateSectorAverages(match),
      });
    }

    return NextResponse.json({
      success: true,
      role: 'admin',
      matches: allMatches,
      count: allMatches.length,
    });
  }

  // 3. Athlete access: Strictly enforce privacy and lock data to the authenticated athlete
  const athleteName = normalizeAthleteName(rawAthleteName);

  if (view === 'individual') {
    // Return only matches where the athlete participated, with ONLY her record
    const athleteMatches = allMatches
      .filter((m) => {
        const found = m.players.find(
          (p) => normalizeAthleteName(p.name).toLowerCase() === athleteName.toLowerCase() && p.dist > 0
        );
        return Boolean(found);
      })
      .map((m) => sanitizeMatchForAthlete(m, athleteName));

    return NextResponse.json({
      success: true,
      role: 'athlete',
      athleteName,
      matches: athleteMatches,
      count: athleteMatches.length,
    });
  }

  // Collective view of a specific match (or latest match)
  const targetMatch = matchId ? getMatchById(matchId) : allMatches[0];
  const sanitizedMatch = sanitizeMatchForAthlete(targetMatch, athleteName);

  return NextResponse.json({
    success: true,
    role: 'athlete',
    athleteName,
    match: sanitizedMatch,
    teamKpis: calculateTeamKpis(targetMatch),
    sectorAverages: calculateSectorAverages(targetMatch),
  });
}

export async function POST(request: Request) {
  const authError = verifyApiAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    let current = {
      minutesOverrides: {},
      categoryOverrides: {},
      customMatches: [],
      updatedAt: Date.now(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase
          .from('athletes')
          .select('name')
          .eq('id', '__MATCH_CUSTOMIZATIONS__')
          .single();
        if (data?.name) {
          const parsed = JSON.parse(data.name);
          current = {
            minutesOverrides: parsed.minutesOverrides || {},
            categoryOverrides: parsed.categoryOverrides || {},
            customMatches: parsed.customMatches || [],
            updatedAt: parsed.updatedAt || 0,
          };
        }
      } catch {}
    }

    // Merge or replace minutes overrides
    if (body.replaceMinutesOverrides !== undefined) {
      current.minutesOverrides = body.replaceMinutesOverrides;
    } else if (body.minutesOverrides && typeof body.minutesOverrides === 'object') {
      current.minutesOverrides = { ...current.minutesOverrides, ...body.minutesOverrides };
    }

    // Merge or replace category overrides
    if (body.replaceCategoryOverrides !== undefined) {
      current.categoryOverrides = body.replaceCategoryOverrides;
    } else if (body.categoryOverrides && typeof body.categoryOverrides === 'object') {
      current.categoryOverrides = { ...current.categoryOverrides, ...body.categoryOverrides };
    }

    // Custom matches
    if (body.customMatches !== undefined && Array.isArray(body.customMatches)) {
      current.customMatches = body.customMatches;
    }

    current.updatedAt = Date.now();

    // Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      await supabase.from('athletes').upsert(
        {
          id: '__MATCH_CUSTOMIZATIONS__',
          name: JSON.stringify(current),
          created_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Dados de jogos e minutos sincronizados com sucesso na nuvem',
      data: current,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao sincronizar dados de jogos' }, { status: 500 });
  }
}
