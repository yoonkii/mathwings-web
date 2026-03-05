/**
 * localStorage wrapper for score persistence.
 * Handles local storage of high scores (top 10).
 * Ported from Android ScorePreferences.kt.
 */

const KEY_TOP_SCORES = 'mathwings_top_scores';
const MAX_TOP_SCORES = 10;

/**
 * Get the stored high score (best score).
 */
export function getHighScore(): number {
  const scores = getTopScores();
  return scores.length > 0 ? scores[0] : 0;
}

/**
 * Get top 10 scores, sorted from highest to lowest.
 */
export function getTopScores(): number[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(KEY_TOP_SCORES);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
      .sort((a, b) => b - a);
  } catch {
    return [];
  }
}

/**
 * Add a score to the top 10 list.
 * Returns the rank (1-10) if it made the top 10, or null otherwise.
 */
export function addScore(score: number): number | null {
  if (score <= 0) {
    return null;
  }
  if (typeof window === 'undefined') {
    return null;
  }

  const currentScores = getTopScores();
  currentScores.push(score);
  const sortedScores = currentScores.sort((a, b) => b - a).slice(0, MAX_TOP_SCORES);

  const rank = sortedScores.indexOf(score) + 1;

  try {
    localStorage.setItem(KEY_TOP_SCORES, JSON.stringify(sortedScores));
  } catch {
    // localStorage full or unavailable -- silently fail
    return null;
  }

  return rank >= 1 && rank <= MAX_TOP_SCORES ? rank : null;
}

/**
 * Clear all stored score data.
 * Primarily for testing/debugging.
 */
export function clearScores(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.removeItem(KEY_TOP_SCORES);
  } catch {
    // Ignore
  }
}
