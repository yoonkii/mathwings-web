import { MathProblem, Operator } from './models';

// ── Difficulty Tiers ────────────────────────────────────────────────────────

export interface DifficultyTierConfig {
  readonly minScore: number;
  readonly maxScore: number;
  readonly availableOperators: readonly Operator[];
  readonly maxDigits: number;
  readonly description: string;
}

/**
 * Difficulty tiers for math problems.
 * Higher tiers unlock more complex operations.
 * Ported from Android DifficultyTier.kt.
 */
export const DifficultyTier = {
  /** Tier 1: Easy addition only with single digit numbers (1-9). Score 0-7. */
  TIER_1: {
    minScore: 0,
    maxScore: 7,
    availableOperators: [Operator.ADD] as readonly Operator[],
    maxDigits: 1,
    description: 'Easy Addition (single digits)',
  } satisfies DifficultyTierConfig,

  /** Tier 2: Addition and subtraction with mixed digits (2d + 1d). Score 8-15. */
  TIER_2: {
    minScore: 8,
    maxScore: 15,
    availableOperators: [Operator.ADD, Operator.SUBTRACT] as readonly Operator[],
    maxDigits: 2,
    description: 'Addition & Subtraction (2d + 1d)',
  } satisfies DifficultyTierConfig,

  /** Tier 3: Adds single-digit multiplication. Score 16-24. */
  TIER_3: {
    minScore: 16,
    maxScore: 24,
    availableOperators: [
      Operator.ADD,
      Operator.SUBTRACT,
      Operator.MULTIPLY,
    ] as readonly Operator[],
    maxDigits: 2,
    description: '+ Multiplication (1d x 1d)',
  } satisfies DifficultyTierConfig,

  /** Tier 4: Adds division and harder problems. Score 25+. */
  TIER_4: {
    minScore: 25,
    maxScore: Number.MAX_SAFE_INTEGER,
    availableOperators: [
      Operator.ADD,
      Operator.SUBTRACT,
      Operator.MULTIPLY,
      Operator.DIVIDE,
    ] as readonly Operator[],
    maxDigits: 3,
    description: '+ Division, harder problems',
  } satisfies DifficultyTierConfig,

  /**
   * Get the appropriate difficulty tier for a given score.
   */
  forScore(score: number): DifficultyTierConfig {
    const tiers: DifficultyTierConfig[] = [
      DifficultyTier.TIER_1,
      DifficultyTier.TIER_2,
      DifficultyTier.TIER_3,
      DifficultyTier.TIER_4,
    ];
    const match = tiers.find(
      (tier) => score >= tier.minScore && score <= tier.maxScore,
    );
    return match ?? DifficultyTier.TIER_4;
  },
} as const;

// ── Math Problem Generator ──────────────────────────────────────────────────

/**
 * Generates math problems based on difficulty tier.
 * Ensures all answers are positive integers and avoids consecutive same operators.
 * Ported from Android MathProblemGenerator.kt.
 */
export class MathProblemGenerator {
  private lastOperator: Operator | null = null;

  /**
   * Generate a new math problem for the given tier.
   */
  generateProblem(tier: DifficultyTierConfig): MathProblem {
    const operator = this.selectOperator(tier.availableOperators);
    this.lastOperator = operator;

    switch (operator) {
      case Operator.ADD:
        return this.generateAddition(tier);
      case Operator.SUBTRACT:
        return this.generateSubtraction(tier);
      case Operator.MULTIPLY:
        return this.generateMultiplication(tier);
      case Operator.DIVIDE:
        return this.generateDivision();
    }
  }

  /**
   * Generate a problem for a given score.
   * Convenience method that determines tier automatically.
   */
  generateProblemForScore(score: number): MathProblem {
    return this.generateProblem(DifficultyTier.forScore(score));
  }

  /**
   * Reset the last operator tracking.
   * Call when starting a new game.
   */
  reset(): void {
    this.lastOperator = null;
  }

  /**
   * Select an operator, avoiding consecutive repeats when possible.
   */
  private selectOperator(
    availableOperators: readonly Operator[],
  ): Operator {
    if (availableOperators.length === 1) {
      return availableOperators[0];
    }

    // Try to avoid repeating the last operator
    const candidates = availableOperators.filter(
      (op) => op !== this.lastOperator,
    );
    const pool = candidates.length > 0 ? candidates : availableOperators;

    return pool[randomInt(0, pool.length)];
  }

  /**
   * Generate an addition problem.
   * Tier 2 uses mixed digits (2d + 1d) for gentler progression.
   */
  private generateAddition(tier: DifficultyTierConfig): MathProblem {
    if (tier === DifficultyTier.TIER_2) {
      const twoDigit = randomInt(10, 100);
      const oneDigit = randomInt(1, 10);
      return MathProblem.addition(twoDigit, oneDigit);
    }
    const maxValue = this.getMaxValue(tier);
    const a = randomInt(1, maxValue + 1);
    const b = randomInt(1, maxValue + 1);
    return MathProblem.addition(a, b);
  }

  /**
   * Generate a subtraction problem.
   * First operand is always larger to ensure positive result.
   * Tier 2 uses mixed digits (2d - 1d).
   */
  private generateSubtraction(tier: DifficultyTierConfig): MathProblem {
    if (tier === DifficultyTier.TIER_2) {
      const twoDigit = randomInt(10, 100);
      const oneDigit = randomInt(1, Math.min(10, twoDigit));
      return MathProblem.subtraction(twoDigit, oneDigit);
    }
    const maxValue = this.getMaxValue(tier);
    const a = randomInt(10, maxValue + 1);
    const b = randomInt(1, a);
    return MathProblem.subtraction(a, b);
  }

  /**
   * Generate a multiplication problem.
   * Tier 3: 1-digit x 1-digit (2-9 x 2-9)
   * Tier 4: 2-digit x 1-digit (10-99 x 2-9)
   */
  private generateMultiplication(tier: DifficultyTierConfig): MathProblem {
    if (tier === DifficultyTier.TIER_4) {
      const a = randomInt(10, 100);
      const b = randomInt(2, 10);
      return MathProblem.multiplication(a, b);
    }
    // Tier 3: single-digit multiplication
    const a = randomInt(2, 10);
    const b = randomInt(2, 10);
    return MathProblem.multiplication(a, b);
  }

  /**
   * Generate a division problem.
   * Creates from quotient x divisor to ensure clean integer result.
   */
  private generateDivision(): MathProblem {
    const divisor = randomInt(2, 10); // 2-9
    const quotient = randomInt(2, 13); // 2-12
    return MathProblem.division(quotient, divisor);
  }

  /**
   * Get maximum value for operands based on tier's maxDigits.
   */
  private getMaxValue(tier: DifficultyTierConfig): number {
    switch (tier.maxDigits) {
      case 1:
        return 9;
      case 2:
        return 99;
      case 3:
        return 999;
      default:
        return 99;
    }
  }
}

/**
 * Generate a random integer in [min, max) (exclusive upper bound).
 * Matches Kotlin's Random.nextInt(from, until) semantics.
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}
