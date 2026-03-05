'use client';

import { colors } from '../theme/colors';
import { MathProblem } from '../domain/models';

interface MathProblemDisplayProps {
  problem: MathProblem | null;
}

export function MathProblemDisplay({ problem }: MathProblemDisplayProps) {
  if (!problem) return null;

  return (
    <div
      className="px-6 py-4 rounded-xl text-center"
      style={{ backgroundColor: colors.problemBackground }}
    >
      <span
        className="text-2xl font-bold tracking-wider"
        style={{ color: colors.problemText }}
      >
        {problem.displayString()}
      </span>
    </div>
  );
}
