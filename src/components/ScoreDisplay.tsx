'use client';

import { memo } from 'react';
import { colors } from '../theme/colors';

interface ScoreDisplayProps {
  score: number;
}

export const ScoreDisplay = memo(function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div
      className="absolute left-4"
      style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
    >
      <span
        className="font-dseg7 text-3xl font-bold drop-shadow-lg"
        style={{ color: colors.scoreWhite }}
      >
        {score}
      </span>
    </div>
  );
});
