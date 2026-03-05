'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { GameSnapshot, GameState } from '../domain/models';
import { renderFrame, GameSprites, loadSprites } from '../rendering/gameCanvas';
import { colors } from '../theme/colors';

interface GameViewProps {
  snapshot: GameSnapshot;
  onTapToStart: () => void;
}

export function GameView({ snapshot, onTapToStart }: GameViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sprites, setSprites] = useState<GameSprites | null>(null);

  // Load sprites once
  useEffect(() => {
    loadSprites()
      .then(setSprites)
      .catch((err) => console.error('Failed to load sprites:', err));
  }, []);

  // Render on every snapshot change (or when sprites finish loading)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sprites) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    if (displayWidth === 0 || displayHeight === 0) return;

    // Always sync canvas buffer size with display size
    const bufferWidth = Math.round(displayWidth * dpr);
    const bufferHeight = Math.round(displayHeight * dpr);

    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
    }

    // Reset transform and apply DPR scaling fresh each frame
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderFrame(ctx, snapshot, sprites, displayWidth, displayHeight);
  }, [snapshot, sprites]);

  const handleClick = useCallback(() => {
    if (snapshot.gameState === GameState.READY) {
      onTapToStart();
    }
  }, [snapshot.gameState, onTapToStart]);

  return (
    <div className="relative w-full h-full" onClick={handleClick}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ backgroundColor: colors.skyBlue }}
      />

      {/* Tap to start overlay */}
      {snapshot.gameState === GameState.READY && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="px-6 py-3 rounded-lg text-xl font-semibold cursor-pointer"
            style={{
              backgroundColor: colors.problemBackground,
              color: colors.problemText,
            }}
          >
            Tap to Start
          </div>
        </div>
      )}
    </div>
  );
}
