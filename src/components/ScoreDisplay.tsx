'use client';

import { colors } from '../theme/colors';

interface ScoreDisplayProps {
  score: number;
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  return (
    <div className="absolute top-4 left-4">
      <span
        className="font-dseg7 text-3xl font-bold drop-shadow-lg"
        style={{ color: colors.scoreWhite }}
      >
        {score}
      </span>
    </div>
  );
}
