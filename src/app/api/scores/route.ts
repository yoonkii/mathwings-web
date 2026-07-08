import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../data/supabaseServer';
import type { LeaderboardEntry } from '../../../data/supabaseClient';

// Leaderboard rows change on every submit — never cache.
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = getServerSupabase();
  if (!supabase) {
    return NextResponse.json({ configured: false, scores: [] });
  }

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(20);

  if (error) {
    console.error(
      'Leaderboard select error:',
      error.message,
      error.details,
      error.hint,
    );
    return NextResponse.json({ configured: true, scores: [] });
  }

  return NextResponse.json({
    configured: true,
    scores: (data as LeaderboardEntry[]) ?? [],
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { playerName, score } = body as Record<string, unknown>;

  if (typeof playerName !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const trimmedName = playerName.trim();
  if (trimmedName.length < 1 || trimmedName.length > 20) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (
    typeof score !== 'number' ||
    !Number.isSafeInteger(score) ||
    score <= 0 ||
    score > 10000
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    console.error('Supabase not configured');
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const { error } = await supabase
    .from('leaderboard')
    .insert({ player_name: trimmedName, score });

  if (error) {
    // Log server-side only; never leak Supabase details to the response.
    console.error(
      'Leaderboard insert error:',
      error.message,
      error.details,
      error.hint,
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
