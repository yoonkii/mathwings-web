'use client';

import { useState, useEffect } from 'react';
import { colors } from '../theme/colors';
import { getTopScores } from '../data/scoreStore';
import {
  isSupabaseConfigured,
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
  const [topScores, setTopScores] = useState<number[]>([]);
  const [globalScores, setGlobalScores] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showGlobal, setShowGlobal] = useState(false);

  useEffect(() => {
    setTopScores(getTopScores());

    // Load global leaderboard if Supabase is configured
    if (isSupabaseConfigured()) {
      getGlobalTopScores(20).then(setGlobalScores);
    }
  }, []);

  const handleSubmitScore = async () => {
    if (submitted || !playerName.trim()) return;
    const success = await submitScore(playerName.trim(), score);
    if (success) {
      setSubmitted(true);
      // Refresh global scores
      const updated = await getGlobalTopScores(20);
      setGlobalScores(updated);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-y-auto"
      style={{ backgroundColor: colors.gameOverBackground }}
    >
      <div
        className="w-full max-w-sm mx-6 my-8 rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: colors.problemBackground,
          border: `1px solid ${colors.goldAccent}4D`,
        }}
      >
        {/* Game Over title */}
        <h1
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
        {isSupabaseConfigured() && (
          <>
            <div className="h-4" />
            {!submitted ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your name"
                  maxLength={20}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="flex-1 h-10 rounded-lg px-3 text-sm font-medium outline-none"
                  style={{
                    backgroundColor: colors.inputBackground,
                    color: colors.inputText,
                    border: `1px solid ${colors.terminalGreen}40`,
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitScore();
                  }}
                />
                <button
                  className="h-10 px-4 rounded-lg text-sm font-bold tracking-wider text-white"
                  style={{
                    backgroundColor:
                      playerName.trim() ? colors.submitButton : colors.keypadButton,
                  }}
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim()}
                >
                  POST
                </button>
              </div>
            ) : (
              <p
                className="text-center text-sm font-medium tracking-wider"
                style={{ color: colors.terminalGreen }}
              >
                Score posted!
              </p>
            )}
          </>
        )}

        {/* Tab buttons for local/global leaderboard */}
        {isSupabaseConfigured() && globalScores.length > 0 && (
          <>
            <div className="h-4" />
            <div className="flex gap-2 justify-center">
              <button
                className="px-4 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  backgroundColor: !showGlobal ? colors.terminalGreen + '33' : 'transparent',
                  color: !showGlobal ? colors.terminalGreen : '#ffffff66',
                  border: `1px solid ${!showGlobal ? colors.terminalGreen + '66' : '#ffffff33'}`,
                }}
                onClick={() => setShowGlobal(false)}
              >
                LOCAL
              </button>
              <button
                className="px-4 py-1 rounded-full text-xs font-bold tracking-wider"
                style={{
                  backgroundColor: showGlobal ? colors.terminalGreen + '33' : 'transparent',
                  color: showGlobal ? colors.terminalGreen : '#ffffff66',
                  border: `1px solid ${showGlobal ? colors.terminalGreen + '66' : '#ffffff33'}`,
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
                  isHighlighted={topScore === score}
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
