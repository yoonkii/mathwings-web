import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabase = createClient(url, key);
  return supabase;
}

function getSessionId(): string {
  const key = 'mathwings_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function trackEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  const client = getSupabase();
  if (!client) return;

  try {
    await client.from('analytics_events').insert({
      session_id: getSessionId(),
      event_type: eventType,
      event_data: eventData,
    });
  } catch {
    // Fire-and-forget: don't break the game
  }
}

export function trackPageVisit(): void {
  trackEvent('page_visit', {
    referrer: document.referrer || null,
    url: window.location.href,
    user_agent: navigator.userAgent,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  });
}

export function trackGameStart(): void {
  trackEvent('game_start');
}

export function trackGameOver(data: {
  score: number;
  duration_seconds: number;
}): void {
  trackEvent('game_over', data);
}

// ── Dashboard query helpers ──────────────────────────────────────────────────

export interface AnalyticsSummary {
  period: string;
  visitors: number;
  players: number;
  games_played: number;
  avg_score: number;
  max_score: number;
  avg_duration_seconds: number;
  total_play_minutes: number;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface AnalyticsEventRow {
  session_id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

const PAGE_SIZE = 1000;
const MAX_ROWS = 20000;

// Supabase caps .select() at 1000 rows per request; paginate to fetch everything.
async function fetchAllEvents(
  client: SupabaseClient,
  sinceIso: string,
): Promise<AnalyticsEventRow[] | null> {
  const all: AnalyticsEventRow[] = [];
  let offset = 0;

  while (offset < MAX_ROWS) {
    const { data, error } = await client
      .from('analytics_events')
      .select('session_id, event_type, event_data, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data) return all.length > 0 ? all : null;

    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

// Coerce a possibly-malformed event value to a finite number in [0, 100000].
function sanitizeNumber(v: unknown): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : 0;
  return Math.min(Math.max(n, 0), 100000);
}

// Format a timestamp as the viewer's local YYYY-MM-DD.
function localDay(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function periodStart(period: PeriodType): string {
  const now = new Date();
  if (period === 'daily') {
    now.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    const day = now.getDay();
    now.setDate(now.getDate() - day);
    now.setHours(0, 0, 0, 0);
  } else {
    now.setDate(1);
    now.setHours(0, 0, 0, 0);
  }
  return now.toISOString();
}

export async function getAnalyticsSummary(
  period: PeriodType,
): Promise<AnalyticsSummary | null> {
  const client = getSupabase();
  if (!client) return null;

  const since = periodStart(period);

  const events = await fetchAllEvents(client, since);
  if (!events) return null;

  const visitSessions = new Set<string>();
  const playSessions = new Set<string>();
  let gamesPlayed = 0;
  let totalScore = 0;
  let maxScore = 0;
  let totalDuration = 0;
  let gameOverCount = 0;

  for (const e of events) {
    if (e.event_type === 'page_visit') {
      visitSessions.add(e.session_id);
    }
    if (e.event_type === 'game_start') {
      playSessions.add(e.session_id);
      gamesPlayed++;
    }
    if (e.event_type === 'game_over') {
      const data = e.event_data;
      if (data) {
        const score = sanitizeNumber(data.score);
        totalScore += score;
        if (score > maxScore) maxScore = score;
        totalDuration += sanitizeNumber(data.duration_seconds);
        gameOverCount++;
      }
    }
  }

  const label =
    period === 'daily'
      ? 'Today'
      : period === 'weekly'
        ? 'This Week'
        : 'This Month';

  return {
    period: label,
    visitors: visitSessions.size,
    players: playSessions.size,
    games_played: gamesPlayed,
    avg_score: gameOverCount > 0 ? Math.round(totalScore / gameOverCount) : 0,
    max_score: maxScore,
    avg_duration_seconds:
      gameOverCount > 0 ? Math.round(totalDuration / gameOverCount) : 0,
    total_play_minutes: Math.round(totalDuration / 60),
  };
}

export interface DailyRow {
  date: string;
  visitors: number;
  games: number;
  avg_score: number;
}

export async function getDailyBreakdown(days: number = 30): Promise<DailyRow[]> {
  const client = getSupabase();
  if (!client) return [];

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const events = await fetchAllEvents(client, since.toISOString());
  if (!events) return [];

  const dayMap = new Map<
    string,
    { visitors: Set<string>; games: number; totalScore: number; gameOvers: number }
  >();

  for (const e of events) {
    const day = localDay(e.created_at); // viewer-local YYYY-MM-DD
    if (!dayMap.has(day)) {
      dayMap.set(day, { visitors: new Set(), games: 0, totalScore: 0, gameOvers: 0 });
    }
    const d = dayMap.get(day)!;

    if (e.event_type === 'page_visit') d.visitors.add(e.session_id);
    if (e.event_type === 'game_start') d.games++;
    if (e.event_type === 'game_over') {
      d.totalScore += sanitizeNumber(e.event_data?.score);
      d.gameOvers++;
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, d]) => ({
      date,
      visitors: d.visitors.size,
      games: d.games,
      avg_score: d.gameOvers > 0 ? Math.round(d.totalScore / d.gameOvers) : 0,
    }));
}
