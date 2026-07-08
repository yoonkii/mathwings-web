// Thin fetch client for the /api/scores route. The browser never talks to
// Supabase directly — all access (and validation) happens server-side in
// src/app/api/scores/route.ts, so no Supabase keys ship to the client.

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

export interface LeaderboardResponse {
  configured: boolean;
  scores: LeaderboardEntry[];
}

export async function getGlobalTopScores(): Promise<LeaderboardResponse> {
  try {
    const res = await fetch('/api/scores');
    if (!res.ok) return { configured: false, scores: [] };
    const data = (await res.json()) as Partial<LeaderboardResponse>;
    return {
      configured: data.configured === true,
      scores: Array.isArray(data.scores) ? data.scores : [],
    };
  } catch {
    return { configured: false, scores: [] };
  }
}

export async function submitScore(
  playerName: string,
  score: number,
): Promise<boolean> {
  try {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerName, score }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { ok?: boolean };
    return data.ok === true;
  } catch {
    return false;
  }
}
