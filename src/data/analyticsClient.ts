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

  const { data: events, error } = await client
    .from('analytics_events')
    .select('session_id, event_type, event_data, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: true });

  if (error || !events) return null;

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
      const data = e.event_data as Record<string, number> | null;
      if (data) {
        totalScore += data.score ?? 0;
        if ((data.score ?? 0) > maxScore) maxScore = data.score ?? 0;
        totalDuration += data.duration_seconds ?? 0;
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

  const { data: events, error } = await client
    .from('analytics_events')
    .select('session_id, event_type, event_data, created_at')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !events) return [];

  const dayMap = new Map<
    string,
    { visitors: Set<string>; games: number; totalScore: number; gameOvers: number }
  >();

  for (const e of events) {
    const day = e.created_at.slice(0, 10); // YYYY-MM-DD
    if (!dayMap.has(day)) {
      dayMap.set(day, { visitors: new Set(), games: 0, totalScore: 0, gameOvers: 0 });
    }
    const d = dayMap.get(day)!;

    if (e.event_type === 'page_visit') d.visitors.add(e.session_id);
    if (e.event_type === 'game_start') d.games++;
    if (e.event_type === 'game_over') {
      const data = e.event_data as Record<string, number> | null;
      d.totalScore += data?.score ?? 0;
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
