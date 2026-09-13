import { NextResponse } from 'next/server';
import { getAllMatches, getMatchById, calculateTeamKpis, calculateSectorAverages } from '@/data/matchRegistry';
import { normalizeAthleteName, sanitizeMatchForAthlete } from '@/lib/matchAcl';
import { verifyApiAuth } from '@/lib/authGuard';

export async function GET(request: Request) {
  // 1. Verify app security token
  const authError = verifyApiAuth(request);
  if (authError) {
    return authError;
  }

  const { searchParams } = new URL(request.url);
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
