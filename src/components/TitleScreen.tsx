'use client';

import { useState, useEffect, useRef } from 'react';
import { colors } from '../theme/colors';
import { getHighScore } from '../data/scoreStore';
import { SettingsSheet } from './SettingsSheet';
import { SoundManager } from '../audio/soundManager';

interface TitleScreenProps {
  onStartGame: () => void;
  soundManager: SoundManager;
}

export function TitleScreen({ onStartGame, soundManager }: TitleScreenProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const bgOffsetRef = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    setHighScore(getHighScore());
  }, []);

  // Scrolling background animation
  useEffect(() => {
    const img = new Image();
    img.src = '/images/bg_skyline.jpg';
    img.onload = () => {
      bgImageRef.current = img;
    };

    let lastTime = 0;
    const animate = (timestamp: number) => {
      if (lastTime === 0) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      bgOffsetRef.current += 20 * dt; // slow scroll

      const canvas = canvasRef.current;
      const bgImg = bgImageRef.current;
      if (canvas && bgImg) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = canvas.offsetWidth * window.devicePixelRatio;
          canvas.height = canvas.offsetHeight * window.devicePixelRatio;
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

          const w = canvas.offsetWidth;
          const h = canvas.offsetHeight;
          const scale = h / bgImg.height;
          const scaledW = bgImg.width * scale;
          const offset = bgOffsetRef.current % scaledW;

          let x = -offset;
          while (x < w) {
            ctx.drawImage(bgImg, x, 0, scaledW, h);
            x += scaledW;
          }

          // Dark overlay
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(0, 0, w, h);
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleStart = () => {
    if (!showSettings) {
      onStartGame();
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onClick={handleStart}
      />

      {/* Settings gear icon */}
      <button
        className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full"
        style={{ color: '#ffffffB3' }}
        onClick={(e) => {
          e.stopPropagation();
          setShowSettings(true);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {/* Foreground content */}
      <div
        className="relative z-[1] flex flex-col items-center justify-center h-full py-12 px-8"
        onClick={handleStart}
      >
        <div className="flex-1" />

        {/* Title */}
        <h1
          className="font-dseg14 text-5xl font-bold tracking-wider"
          style={{ color: colors.goldAccent }}
        >
          FLAPPY
        </h1>
        <div className="h-3" />
        <h2
          className="font-dseg14 text-4xl font-bold tracking-wider"
          style={{ color: colors.terminalGreen }}
        >
          CALCULATOR
        </h2>
        <div className="h-2" />
        <p className="text-sm tracking-wider" style={{ color: '#ffffff99' }}>
          Your brain is the button
        </p>

        <div className="h-8" />

        {/* How to Play */}
        <div
          className="w-full max-w-xs rounded-xl p-4"
          style={{
            backgroundColor: colors.problemBackground,
            border: `1px solid ${colors.terminalGreen}4D`,
          }}
        >
          {/* Terminal title bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.stockRed }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.goldAccent }} />
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.terminalGreen }} />
            </div>
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: colors.terminalGreen }}
            >
              HOW TO PLAY
            </span>
          </div>
          <div className="w-full h-px mb-3" style={{ backgroundColor: colors.terminalGreen + '33' }} />
          <p
            className="text-sm leading-6 tracking-wider"
            style={{ color: colors.terminalGreen + 'D9' }}
          >
            1. Solve the math problem<br />
            2. Enter the answer<br />
            3. Press &#x2713; to flap<br />
            4. Navigate through pipes!
          </p>
        </div>

        <div className="h-6" />

        {/* High score */}
        {highScore > 0 && (
          <div
            className="px-5 py-2 rounded-full text-lg font-bold tracking-widest"
            style={{
              color: colors.goldAccent,
              backgroundColor: colors.problemBackground,
              border: `1px solid ${colors.goldAccent}80`,
            }}
          >
            HIGH SCORE: {highScore}
          </div>
        )}

        <div className="flex-1" />

        {/* Tap to start */}
        <div
          className="animate-pulse-scale px-8 py-3 rounded-full text-xl font-bold tracking-widest cursor-pointer"
          style={{
            color: colors.terminalGreen,
            backgroundColor: colors.problemBackground,
            border: `1.5px solid ${colors.terminalGreen}B3`,
          }}
        >
          TAP TO START
        </div>
      </div>

      {/* Settings overlay */}
      {showSettings && (
        <SettingsSheet
          soundManager={soundManager}
          onDismiss={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
