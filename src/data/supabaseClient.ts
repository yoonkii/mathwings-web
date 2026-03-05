import { createClient } from '@supabase/supabase-js';

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

export async function submitScore(
  playerName: string,
  score: number,
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('leaderboard')
    .insert({ player_name: playerName || 'Anonymous', score });

  return !error;
}

export async function getGlobalTopScores(
  limit = 20,
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as LeaderboardEntry[];
}
