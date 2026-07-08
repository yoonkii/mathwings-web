// Client-side analytics tracking. Events are POSTed to /api/events — the
// browser never talks to Supabase directly, so no Supabase keys ship to the
// client. The dashboard query helpers live in src/data/supabaseServer.ts;
// only their shared result types are declared here.

function getSessionId(): string {
  const key = 'mathwings_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

// Persistent per-browser visitor id, so the dashboard counts users instead of
// browser tabs (sessionStorage is per-tab). Falls back to null when storage
// is unavailable (SSR, private mode, blocked cookies).
function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const key = 'mathwings_visitor_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return null;
  }
}

function trackEvent(
  eventType: string,
  eventData: Record<string, unknown> = {},
): void {
  try {
    // keepalive lets the request survive page unloads; fire-and-forget.
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        session_id: getSessionId(),
        event_type: eventType,
        event_data: eventData,
      }),
    }).catch(() => {});
  } catch {
    // Fire-and-forget: don't break the game
  }
}

export function trackPageVisit(): void {
  trackEvent('page_visit', {
    visitor_id: getVisitorId(),
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

// ── Shared dashboard types (queries live in src/data/supabaseServer.ts) ──────

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

export interface DailyRow {
  date: string;
  visitors: number;
  games: number;
  avg_score: number;
}
