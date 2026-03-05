import { useRef, useEffect } from 'react';
import { GameConfig } from '../domain/gameConfig';

export function useGameLoop(
  callback: (deltaTime: number) => void,
  isRunning: boolean
) {
  const callbackRef = useRef(callback);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isRunning) {
      lastTimeRef.current = 0;
      return;
    }

    const loop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Convert to seconds and cap at MAX_DELTA_TIME
      const deltaTime = Math.min(deltaMs / 1000, GameConfig.MAX_DELTA_TIME);

      if (deltaTime > 0) {
        callbackRef.current(deltaTime);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning]);
}
