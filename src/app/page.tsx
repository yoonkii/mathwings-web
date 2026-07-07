'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TitleScreen } from '../components/TitleScreen';
import { GameView } from '../components/GameView';
import { GameOverScreen } from '../components/GameOverScreen';
import { NumericKeypad } from '../components/NumericKeypad';
import { AnswerInput } from '../components/AnswerInput';
import { MathProblemDisplay } from '../components/MathProblemDisplay';
import { ScoreDisplay } from '../components/ScoreDisplay';
import { SoundManager } from '../audio/soundManager';
import { useGameState } from '../hooks/useGameState';
import { GameState } from '../domain/models';
import { colors } from '../theme/colors';
import { trackPageVisit } from '../data/analyticsClient';

type Screen = 'title' | 'game' | 'gameOver';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('title');
  const [soundManager, setSoundManager] = useState<SoundManager | null>(null);

  // Initialize SoundManager once (client-side only). Intentional one-time
  // setState in effect: lazy useState would run during SSR/hydration and
  // mismatch the server-rendered loading state.
  useEffect(() => {
    const sm = new SoundManager();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSoundManager(sm);
    trackPageVisit();
    return () => sm.release();
  }, []);

  // Pause/resume audio when tab or app goes to background
  useEffect(() => {
    if (!soundManager) return;
    const handleVisibility = () => {
      if (document.hidden) {
        soundManager.pauseAll();
      } else {
        soundManager.ensureAudioContext();
        soundManager.resumeAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [soundManager]);

  if (!soundManager) {
    return (
      <div
        className="w-screen flex items-center justify-center"
        style={{ backgroundColor: colors.skyBlue, height: '100dvh' }}
      >
        <p className="font-dseg14 text-xl" style={{ color: colors.terminalGreen }}>
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="w-screen max-w-lg mx-auto overflow-hidden" style={{ height: '100dvh' }}>
      {screen === 'title' && (
        <TitleScreen
          soundManager={soundManager}
          onStartGame={() => {
            soundManager.stopTitleBgm();
            soundManager.ensureAudioContext();
            setScreen('game');
          }}
        />
      )}

      {screen === 'game' && (
        <GameScreenWrapper
          soundManager={soundManager}
          onMenu={() => {
            soundManager.stopBgm();
            soundManager.stopGameOverMusic();
            soundManager.startTitleBgm();
            setScreen('title');
          }}
        />
      )}
    </div>
  );
}

interface GameOverData {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
}

function GameScreenWrapper({
  soundManager,
  onMenu,
}: {
  soundManager: SoundManager;
  onMenu: () => void;
}) {
  const game = useGameState(soundManager);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  // Latest game state for the ResizeObserver callback (avoids stale closure)
  const gameStateRef = useRef(game.snapshot.gameState);
  gameStateRef.current = game.snapshot.gameState;

  // Initialize engine with game area dimensions on mount
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    // Use rAF to ensure layout is computed
    const rafId = requestAnimationFrame(() => {
      const rect = gameArea.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        game.initialize(rect.width, rect.height);
      }
    });

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep engine coordinates in sync with the game area's display size
  // (window resize, device rotation)
  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) return;
      if (gameStateRef.current === GameState.READY) {
        // Re-initialize while waiting to start so proportions are fresh
        game.initialize(width, height);
      } else {
        game.resize(width, height);
      }
    });
    observer.observe(gameArea);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.initialize, game.resize]);

  // Watch for game over state from the game hook
  useEffect(() => {
    if (game.gameOverData && !gameOverData) {
      setGameOverData(game.gameOverData);
    }
  }, [game.gameOverData, gameOverData]);

  const handleRetry = useCallback(() => {
    soundManager.stopGameOverMusic();
    setGameOverData(null);
    game.resetGame();
  }, [soundManager, game]);

  return (
    <div ref={gameContainerRef} className="game-screen w-full h-full flex relative">
      {/* Game view (60% height, or 60% width in short landscape) */}
      <div ref={gameAreaRef} className="game-screen-canvas relative">
        <GameView snapshot={game.snapshot} onTapToStart={game.startGame} />

        {/* Score overlay */}
        {game.snapshot.gameState !== GameState.READY && !gameOverData && (
          <ScoreDisplay score={game.snapshot.score} />
        )}

        {/* Math problem at bottom of game view (shown during READY too so
            the player can solve the first problem before starting) */}
        {(game.snapshot.gameState === GameState.READY ||
          game.snapshot.gameState === GameState.PLAYING) && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <MathProblemDisplay problem={game.snapshot.currentProblem} />
          </div>
        )}
      </div>

      {/* Input area (40% height, or 40% width in short landscape) */}
      <div
        className="game-screen-input flex flex-col min-h-0 px-3 py-2"
        style={{
          backgroundColor: colors.keypadBackground,
          paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="mb-2">
          <AnswerInput
            currentInput={game.currentInput}
            feedback={game.inputFeedback}
          />
        </div>
        <div className="flex-1 min-h-0">
          <NumericKeypad
            onDigit={game.onDigitPressed}
            onBackspace={game.onBackspacePressed}
            onSubmit={game.onSubmitPressed}
            enabled={game.snapshot.gameState === GameState.PLAYING}
          />
        </div>
      </div>

      {/* Game over overlay (on top of everything) */}
      {gameOverData && (
        <div className="absolute inset-0 z-10">
          <GameOverScreen
            score={gameOverData.score}
            highScore={gameOverData.highScore}
            isNewHighScore={gameOverData.isNewHighScore}
            onRetry={handleRetry}
            onMenu={onMenu}
          />
        </div>
      )}
    </div>
  );
}
