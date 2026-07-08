import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Bird,
  GameState,
  GameSnapshot,
  InputFeedback,
  MathProblem,
} from '../domain/models';
import { GameEngine } from '../domain/gameEngine';
import { GameConfig } from '../domain/gameConfig';
import { addScore as addScoreToStore, getHighScore } from '../data/scoreStore';
import { trackGameStart, trackGameOver } from '../data/analyticsClient';
import { SoundManager } from '../audio/soundManager';
import { useGameLoop } from './useGameLoop';
import { useKeyboard } from './useKeyboard';

interface GameOverData {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
}

export function useGameState(soundManager: SoundManager) {
  const engineRef = useRef<GameEngine | null>(null);
  const gameOverHandledRef = useRef(false);
  const gameStartTimeRef = useRef<number>(0);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    bird: new Bird({ x: 100, y: 300, width: 50, height: 50 }),
    pipes: [],
    score: 0,
    gameState: GameState.READY,
    currentProblem: null as unknown as MathProblem,
    scrollSpeed: 100,
    bgScrollOffset: 0,
  });
  const [currentInput, setCurrentInput] = useState('');
  const [inputFeedback, setInputFeedback] = useState<InputFeedback>(InputFeedback.NONE);
  const [gameOverData, setGameOverData] = useState<GameOverData | null>(null);
  const feedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameOverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback((width: number, height: number) => {
    const engine = new GameEngine();
    engine.initialize(width, height);
    engineRef.current = engine;
    setSnapshot(engine.getSnapshot());
  }, []);

  const resize = useCallback((width: number, height: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.resize(width, height);
    setSnapshot(engine.getSnapshot());
  }, []);

  const startGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.getGameState() !== GameState.READY) return;
    soundManager.ensureAudioContext();
    engine.start();
    soundManager.startBgm();
    gameStartTimeRef.current = Date.now();
    trackGameStart();
    setSnapshot(engine.getSnapshot());
  }, [soundManager]);

  const update = useCallback((deltaTime: number) => {
    const engine = engineRef.current;
    if (!engine) return;

    const snap = engine.update(deltaTime);
    setSnapshot(snap);

    // Guard: only handle game over once
    if (snap.gameState === GameState.GAME_OVER && !gameOverHandledRef.current) {
      gameOverHandledRef.current = true;
      soundManager.playHit();
      soundManager.stopBgm();

      // Track analytics
      const durationSeconds = Math.round((Date.now() - gameStartTimeRef.current) / 1000);
      trackGameOver({ score: snap.score, duration_seconds: durationSeconds });

      // Save score (read previous best first so a tie is not a new high score)
      const prevBest = getHighScore();
      addScoreToStore(snap.score);
      const storedHighScore = getHighScore();

      gameOverTimeoutRef.current = setTimeout(() => {
        soundManager.playGameOverMusic();
        setGameOverData({
          score: snap.score,
          highScore: storedHighScore,
          isNewHighScore: snap.score > prevBest,
        });
      }, 500);
    }
  }, [soundManager]);

  const clearFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setInputFeedback(InputFeedback.NONE);
    }, 300);
  }, []);

  const onDigitPressed = useCallback((digit: number) => {
    if (snapshot.gameState !== GameState.PLAYING) return;
    if (currentInput.length >= GameConfig.MAX_INPUT_LENGTH) return;
    soundManager.playKeyPress();
    setCurrentInput((prev) => prev + digit.toString());
  }, [snapshot.gameState, currentInput.length, soundManager]);

  const onBackspacePressed = useCallback(() => {
    if (snapshot.gameState !== GameState.PLAYING) return;
    soundManager.playKeyPress();
    setCurrentInput((prev) => prev.slice(0, -1));
  }, [snapshot.gameState, soundManager]);

  const onSubmitPressed = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || snapshot.gameState !== GameState.PLAYING) return;
    if (currentInput.length === 0) return;

    const answer = parseInt(currentInput);
    const isCorrect = engine.checkAnswer(answer);

    if (isCorrect) {
      soundManager.playCorrect();
      soundManager.playFlap();
      setInputFeedback(InputFeedback.CORRECT);
      engine.onCorrectAnswer();
    } else {
      soundManager.playWrong();
      setInputFeedback(InputFeedback.INCORRECT);
    }

    setCurrentInput('');
    clearFeedback();
    setSnapshot(engine.getSnapshot());
  }, [snapshot.gameState, currentInput, soundManager, clearFeedback]);

  const resetGame = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    soundManager.stopGameOverMusic();
    gameOverHandledRef.current = false;
    engine.reset();
    setCurrentInput('');
    setInputFeedback(InputFeedback.NONE);
    setGameOverData(null);
    setSnapshot(engine.getSnapshot());
  }, [soundManager]);

  // Clear pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
      if (gameOverTimeoutRef.current) {
        clearTimeout(gameOverTimeoutRef.current);
      }
    };
  }, []);

  // Game loop — only runs during PLAYING state
  useGameLoop(update, snapshot.gameState === GameState.PLAYING);

  // Keyboard input
  useKeyboard({
    onDigitPressed,
    onBackspacePressed,
    onSubmitPressed,
    onStartGame: startGame,
    enabled: !gameOverData && snapshot.gameState !== GameState.GAME_OVER,
  });

  return {
    snapshot,
    currentInput,
    inputFeedback,
    gameOverData,
    initialize,
    resize,
    startGame,
    onDigitPressed,
    onBackspacePressed,
    onSubmitPressed,
    resetGame,
  };
}
