import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../data/supabaseServer';

const ALLOWED_EVENT_TYPES = ['page_visit', 'game_start', 'game_over'];
const MAX_EVENT_DATA_JSON_LENGTH = 2048;

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

  const { session_id, event_type, event_data } = body as Record<string, unknown>;

  if (
    typeof session_id !== 'string' ||
    session_id.length < 1 ||
    session_id.length > 64
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (typeof event_type !== 'string' || !ALLOWED_EVENT_TYPES.includes(event_type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event_data !== undefined) {
    if (
      typeof event_data !== 'object' ||
      event_data === null ||
      Array.isArray(event_data) ||
      JSON.stringify(event_data).length > MAX_EVENT_DATA_JSON_LENGTH
    ) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    // Tracking is fire-and-forget; a missing backend is not the client's problem.
    return new Response(null, { status: 204 });
  }

  const { error } = await supabase.from('analytics_events').insert({
    session_id,
    event_type,
    event_data: event_data ?? {},
  });

  if (error) {
    // Log server-side only; never leak Supabase details to the response.
    console.error(
      'Analytics insert error:',
      error.message,
      error.details,
      error.hint,
    );
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
