'use client';

import { useState, useEffect, useRef } from 'react';
import { colors } from '../theme/colors';
import { getTopScores } from '../data/scoreStore';
import {
  submitScore,
  getGlobalTopScores,
  LeaderboardEntry,
} from '../data/supabaseClient';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  onRetry: () => void;
  onMenu: () => void;
}

export function GameOverScreen({
  score,
  highScore,
  isNewHighScore,
  onRetry,
  onMenu,
}: GameOverScreenProps) {
  // Lazy init is safe: this component only mounts client-side (page gates on SoundManager)
  const [topScores] = useState<number[]>(() => getTopScores());
  const [globalScores, setGlobalScores] = useState<LeaderboardEntry[]>([]);
  const [configured, setConfigured] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the global leaderboard once; the response says whether the
    // server-side leaderboard is configured.
    getGlobalTopScores().then(({ configured, scores }) => {
      setConfigured(configured);
      setGlobalScores(scores);
    });
  }, []);

  useEffect(() => {
    cardRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      // Ignore Enter on the name input (posts the score) and on focused
      // buttons (they fire their own click), so retry only triggers globally
      if (e.key === 'Enter' && tag !== 'INPUT' && tag !== 'BUTTON') {
        onRetry();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRetry]);

  const handleSubmitScore = async () => {
    if (submitted || submitting || !playerName.trim()) return;
    setSubmitting(true);
    setSubmitError(false);
    const success = await submitScore(playerName.trim(), score);
    if (success) {
      setSubmitted(true);
      // Refresh global scores
      const { scores: updated } = await getGlobalTopScores();
      setGlobalScores(updated);
    } else {
      setSubmitError(true);
    }
    setSubmitting(false);
  };

  const highlightIndex = topScores.indexOf(score);

  return (
    <div
      className="w-full h-full flex overflow-y-auto px-6 py-8"
      style={{ backgroundColor: colors.gameOverBackground }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        tabIndex={-1}
        className="w-full max-w-sm m-auto rounded-2xl p-6 max-h-[85dvh] overflow-y-auto outline-none"
        style={{
          backgroundColor: colors.problemBackground,
          border: `1px solid ${colors.goldAccent}4D`,
        }}
      >
        {/* Game Over title */}
        <h1
          id="game-over-title"
          className="text-center text-3xl font-bold tracking-widest"
          style={{ color: colors.wrongRed }}
        >
          GAME OVER
        </h1>

        <div className="h-2" />

        {/* Gold divider */}
        <div
          className="w-28 h-0.5 mx-auto"
          style={{ backgroundColor: colors.goldAccent }}
        />

        <div className="h-5" />

        {/* Score label */}
        <p
          className="text-center text-sm font-medium tracking-widest"
          style={{ color: '#ffffff99' }}
        >
          SCORE
        </p>

        <div className="h-1" />

        {/* Score number */}
        <p
          className="text-center text-5xl font-bold tracking-wider"
          style={{ color: colors.terminalGreen }}
        >
          {score}
        </p>

        {/* New high score */}
        {isNewHighScore && (
          <>
            <div className="h-1" />
            <p
              className="text-center text-base font-bold tracking-widest animate-gold-pulse"
              style={{ color: colors.newHighScoreGold }}
            >
              &#x2605; NEW HIGH SCORE &#x2605;
            </p>
          </>
        )}

        {/* Global score submission */}
        {configured && (
          <>
            <div className="h-4" />
            {!submitted ? (
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitScore();
                }}
              >
                <input
                  type="text"
                  placeholder="Your name"
                  aria-label="Your name"
                  autoComplete="nickname"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="send"
                  maxLength={20}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 h-10 rounded-lg px-3 text-sm font-medium outline-none"
                  style={{
                    backgroundColor: colors.inputBackground,
                    color: colors.inputText,
                    border: `1px solid ${colors.terminalGreen}40`,
                  }}
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg text-sm font-bold tracking-wider text-white"
                  style={{
                    backgroundColor:
                      playerName.trim() && !submitting ? colors.submitButton : colors.keypadButton,
                  }}
                  disabled={!playerName.trim() || submitting}
                >
                  POST
                </button>
              </form>
            ) : (
              <p
                className="text-center text-sm font-medium tracking-wider"
                style={{ color: colors.terminalGreen }}
              >
                Score posted!
              </p>
            )}
            {submitError && (
              <>
                <div className="h-2" />
                <p
                  className="text-center text-xs font-medium tracking-wider"
                  style={{ color: colors.wrongRed }}
                >
                  Failed to post — try again
                </p>
              </>
            )}
          </>
        )}

        {/* Tab buttons for local/global leaderboard */}
        {configured && globalScores.length > 0 && (
          <>
            <div className="h-4" />
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  backgroundColor: !showGlobal ? colors.terminalGreen + '33' : 'transparent',
                  color: !showGlobal ? colors.terminalGreen : '#ffffffA6',
                  border: `1px solid ${!showGlobal ? colors.terminalGreen + '66' : '#ffffff55'}`,
                }}
                onClick={() => setShowGlobal(false)}
              >
                LOCAL
              </button>
              <button
                className="px-4 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  backgroundColor: showGlobal ? colors.terminalGreen + '33' : 'transparent',
                  color: showGlobal ? colors.terminalGreen : '#ffffffA6',
                  border: `1px solid ${showGlobal ? colors.terminalGreen + '66' : '#ffffff55'}`,
                }}
                onClick={() => setShowGlobal(true)}
              >
                GLOBAL
              </button>
            </div>
          </>
        )}

        {/* Local leaderboard */}
        {!showGlobal && topScores.length > 0 && (
          <>
            <div className="h-3" />
            <p
              className="text-center text-sm font-bold tracking-widest"
              style={{ color: colors.terminalGreen + 'B3' }}
            >
              LEADERBOARD
            </p>
            <div className="h-2" />
            <div
              className="rounded-xl p-2"
              style={{
                backgroundColor: colors.keypadBackground,
                border: `1px solid ${colors.keypadButton}80`,
              }}
            >
              {topScores.map((topScore, index) => (
                <LeaderboardRow
                  key={index}
                  rank={index + 1}
                  scoreValue={topScore}
                  isHighlighted={index === highlightIndex}
                />
              ))}
            </div>
          </>
        )}

        {/* Global leaderboard */}
        {showGlobal && globalScores.length > 0 && (
          <>
            <div className="h-3" />
            <p
              className="text-center text-sm font-bold tracking-widest"
              style={{ color: colors.terminalGreen + 'B3' }}
            >
              GLOBAL TOP 20
            </p>
            <div className="h-2" />
            <div
              className="rounded-xl p-2"
              style={{
                backgroundColor: colors.keypadBackground,
                border: `1px solid ${colors.keypadButton}80`,
              }}
            >
              {globalScores.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{
                    backgroundColor:
                      index === 0 ? '#FFD70019' : index === 1 ? '#C0C0C014' : index === 2 ? '#CD7F3214' : 'transparent',
                  }}
                >
                  <span
                    className={`w-9 ${index < 3 ? 'text-lg font-bold' : 'text-sm'}`}
                    style={{ color: '#ffffff80' }}
                  >
                    {index === 0
                      ? '\uD83E\uDD47'
                      : index === 1
                      ? '\uD83E\uDD48'
                      : index === 2
                      ? '\uD83E\uDD49'
                      : `#${index + 1}`}
                  </span>
                  <span
                    className="flex-1 text-sm font-medium truncate mx-2"
                    style={{ color: '#ffffffB3' }}
                  >
                    {entry.player_name}
                  </span>
                  <span
                    className="text-base font-medium tracking-wider"
                    style={{ color: colors.terminalGreen + 'E6' }}
                  >
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="h-6" />

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            className="flex-1 h-13 rounded-xl text-lg font-bold tracking-widest"
            style={{
              backgroundColor: colors.keypadButton,
              color: '#ffffffCC',
              border: `1px solid #ffffff33`,
            }}
            onClick={onMenu}
          >
            MENU
          </button>
          <button
            className="flex-1 h-13 rounded-xl text-lg font-bold tracking-widest text-white"
            style={{ backgroundColor: colors.submitButton }}
            onClick={onRetry}
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  rank,
  scoreValue,
  isHighlighted,
}: {
  rank: number;
  scoreValue: number;
  isHighlighted: boolean;
}) {
  const rankEmoji =
    rank === 1 ? '\uD83E\uDD47' : rank === 2 ? '\uD83E\uDD48' : rank === 3 ? '\uD83E\uDD49' : '';

  const bgColor = isHighlighted
    ? colors.goldAccent + '26'
    : rank === 1
    ? '#FFD70019'
    : rank === 2
    ? '#C0C0C014'
    : rank === 3
    ? '#CD7F3214'
    : 'transparent';

  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg"
      style={{
        backgroundColor: bgColor,
        border: isHighlighted ? `1px solid ${colors.goldAccent}66` : '1px solid transparent',
      }}
    >
      <span
        className={`w-9 ${rank <= 3 ? 'text-lg font-bold' : 'text-sm'}`}
        style={{
          color: isHighlighted ? colors.goldAccent : '#ffffff80',
        }}
      >
        {rankEmoji || `#${rank}`}
      </span>
      <span
        className={`text-base tracking-wider ${isHighlighted ? 'font-bold' : 'font-medium'}`}
        style={{
          color: isHighlighted ? colors.goldAccent : colors.terminalGreen + 'E6',
        }}
      >
        {scoreValue}
      </span>
    </div>
  );
}
