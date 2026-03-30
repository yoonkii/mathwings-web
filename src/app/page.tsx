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

  // Initialize SoundManager once (client-side only)
  useEffect(() => {
    const sm = new SoundManager();
    setSoundManager(sm);
    trackPageVisit();
    return () => sm.release();
  }, []);

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
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);

  // Initialize engine with container dimensions on mount
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    // Use rAF to ensure layout is computed
    const rafId = requestAnimationFrame(() => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const gameAreaHeight = rect.height * 0.6;
        game.initialize(rect.width, gameAreaHeight);
      }
    });

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    <div ref={gameContainerRef} className="w-full h-full flex flex-col relative">
      {/* Top 60%: Game view */}
      <div className="relative" style={{ height: '60%' }}>
        <GameView snapshot={game.snapshot} onTapToStart={game.startGame} />

        {/* Score overlay */}
        {game.snapshot.gameState !== GameState.READY && !gameOverData && (
          <ScoreDisplay score={game.snapshot.score} />
        )}

        {/* Math problem at bottom of game view */}
        {game.snapshot.gameState === GameState.PLAYING && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center">
            <MathProblemDisplay problem={game.snapshot.currentProblem} />
          </div>
        )}
      </div>

      {/* Bottom 40%: Input area */}
      <div
        className="flex flex-col px-3 py-2"
        style={{
          height: '40%',
          backgroundColor: colors.keypadBackground,
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="mb-2">
          <AnswerInput
            currentInput={game.currentInput}
            feedback={game.inputFeedback}
          />
        </div>
        <div className="flex-1">
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
