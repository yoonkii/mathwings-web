import { GameConfig } from './gameConfig';

// ── Enums ──────────────────────────────────────────────────────────────────

export enum Operator {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '\u00d7', // multiplication sign
  DIVIDE = '\u00f7', // division sign
}

export enum GameState {
  READY = 'READY',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum InputFeedback {
  NONE = 'NONE',
  CORRECT = 'CORRECT',
  INCORRECT = 'INCORRECT',
}

// ── Utility Interfaces ─────────────────────────────────────────────────────

export interface Rect {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export interface CollisionResult {
  readonly hitObstacle: boolean;
  readonly hitCeiling: boolean;
  readonly hitFloor: boolean;
}

export interface GameSnapshot {
  readonly bird: Bird;
  readonly pipes: readonly Pipe[];
  readonly score: number;
  readonly gameState: GameState;
  readonly currentProblem: MathProblem | null;
  readonly scrollSpeed: number;
  readonly bgScrollOffset: number;
}

// ── Bird ────────────────────────────────────────────────────────────────────

export class Bird {
  readonly x: number;
  readonly y: number;
  readonly velocity: number;
  readonly rotation: number;
  readonly width: number;
  readonly height: number;

  constructor(params: {
    x: number;
    y: number;
    velocity?: number;
    rotation?: number;
    width: number;
    height: number;
  }) {
    this.x = params.x;
    this.y = params.y;
    this.velocity = params.velocity ?? 0;
    this.rotation = params.rotation ?? 0;
    this.width = params.width;
    this.height = params.height;
  }

  /**
   * Apply gravity and update position for one frame.
   * Returns a new Bird with updated position and velocity.
   */
  applyGravity(
    gravity: number,
    deltaTime: number,
    terminalVelocity: number,
  ): Bird {
    const newVelocity = Math.min(
      this.velocity + gravity * deltaTime,
      terminalVelocity,
    );
    const newY = this.y + newVelocity * deltaTime;

    return new Bird({
      x: this.x,
      y: newY,
      velocity: newVelocity,
      rotation: this.rotation,
      width: this.width,
      height: this.height,
    });
  }

  /**
   * Apply flap impulse (triggered by correct answer).
   * Returns a new Bird with flap velocity applied.
   */
  flap(flapImpulse: number): Bird {
    return new Bird({
      x: this.x,
      y: this.y,
      velocity: flapImpulse,
      rotation: GameConfig.MAX_ROTATION_UP,
      width: this.width,
      height: this.height,
    });
  }

  /**
   * Update rotation based on current velocity.
   * Bird tilts down when falling, up when rising.
   * Returns a new Bird with updated rotation.
   */
  updateRotation(): Bird {
    const targetRotation =
      (this.velocity / GameConfig.TERMINAL_VELOCITY) *
      GameConfig.MAX_ROTATION_DOWN;
    const newRotation = lerp(
      this.rotation,
      targetRotation,
      GameConfig.ROTATION_LERP_FACTOR,
    );

    return new Bird({
      x: this.x,
      y: this.y,
      velocity: this.velocity,
      rotation: newRotation,
      width: this.width,
      height: this.height,
    });
  }

  /**
   * Circular hitbox radius. Uses the smaller sprite dimension to inscribe
   * the circle, then applies BIRD_HITBOX_RATIO to shrink it further.
   */
  get hitboxRadius(): number {
    const spriteSize =
      Math.min(this.width, this.height) * GameConfig.BIRD_SPRITE_SCALE;
    return (spriteSize / 2) * GameConfig.BIRD_HITBOX_RATIO;
  }

  /** Hitbox center Y, shifted upward for more forgiveness at the bottom. */
  get hitboxCenterY(): number {
    return this.y + this.hitboxRadius * GameConfig.BIRD_HITBOX_Y_OFFSET_RATIO;
  }

  /**
   * Check if bird is within screen bounds using circular hitbox.
   */
  isWithinBounds(screenHeight: number): boolean {
    const cy = this.hitboxCenterY;
    return cy - this.hitboxRadius > 0 && cy + this.hitboxRadius < screenHeight;
  }

  /**
   * Create a bird at the starting position.
   */
  static createAtStart(screenWidth: number, screenHeight: number): Bird {
    const referenceDimension = Math.min(screenWidth, screenHeight);
    const birdWidth = referenceDimension * GameConfig.BIRD_SIZE_RATIO;
    const birdHeight = birdWidth * GameConfig.BIRD_ASPECT_RATIO;
    const birdX = screenWidth * GameConfig.BIRD_X_POSITION_RATIO;
    const birdY = screenHeight / 2;

    return new Bird({
      x: birdX,
      y: birdY,
      velocity: 0,
      rotation: 0,
      width: birdWidth,
      height: birdHeight,
    });
  }
}

// ── Pipe ────────────────────────────────────────────────────────────────────

export class Pipe {
  readonly x: number;
  readonly gapCenterY: number;
  readonly gapHeight: number;
  readonly width: number;
  readonly scored: boolean;
  readonly isRedBar: boolean;

  constructor(params: {
    x: number;
    gapCenterY: number;
    gapHeight: number;
    width: number;
    scored?: boolean;
    isRedBar?: boolean;
  }) {
    this.x = params.x;
    this.gapCenterY = params.gapCenterY;
    this.gapHeight = params.gapHeight;
    this.width = params.width;
    this.scored = params.scored ?? false;
    this.isRedBar = params.isRedBar ?? true;
  }

  /**
   * Get the bounds of the top pipe section (above the gap).
   */
  topPipeBounds(screenHeight: number): Rect {
    const gapTop = this.gapCenterY - this.gapHeight / 2;
    return {
      left: this.x,
      top: 0,
      right: this.x + this.width,
      bottom: gapTop,
    };
  }

  /**
   * Get the bounds of the bottom pipe section (below the gap).
   */
  bottomPipeBounds(screenHeight: number): Rect {
    const gapBottom = this.gapCenterY + this.gapHeight / 2;
    return {
      left: this.x,
      top: gapBottom,
      right: this.x + this.width,
      bottom: screenHeight,
    };
  }

  /**
   * Move the pipe left based on scroll speed.
   * Returns a new Pipe at updated position.
   */
  move(scrollSpeed: number, deltaTime: number): Pipe {
    return new Pipe({
      x: this.x - scrollSpeed * deltaTime,
      gapCenterY: this.gapCenterY,
      gapHeight: this.gapHeight,
      width: this.width,
      scored: this.scored,
      isRedBar: this.isRedBar,
    });
  }

  /**
   * Check if pipe has scrolled completely off the left edge.
   */
  isOffScreen(): boolean {
    return this.x + this.width < 0;
  }

  /**
   * Check if bird has passed this pipe (for scoring).
   * Scores when bird's center passes the pipe's center.
   */
  hasBeenPassed(birdX: number): boolean {
    return birdX > this.x + this.width / 2;
  }

  /**
   * Mark this pipe as scored. Returns a new Pipe with scored = true.
   */
  markAsScored(): Pipe {
    return new Pipe({
      x: this.x,
      gapCenterY: this.gapCenterY,
      gapHeight: this.gapHeight,
      width: this.width,
      scored: true,
      isRedBar: this.isRedBar,
    });
  }

  /**
   * Create a new pipe at the right edge of the screen.
   */
  static createOffScreen(
    screenWidth: number,
    gameAreaHeight: number,
    birdHeight: number,
    isRedBar: boolean = true,
  ): Pipe {
    const pipeWidth = screenWidth * GameConfig.PIPE_WIDTH_RATIO;
    const rawGapHeight = birdHeight * GameConfig.PIPE_GAP_MULTIPLIER;
    const maxGapHeight = gameAreaHeight * GameConfig.MAX_GAP_HEIGHT_RATIO;
    const gapHeight = Math.min(rawGapHeight, maxGapHeight);

    // Calculate valid range for gap center
    const minGapCenter =
      gameAreaHeight * GameConfig.MIN_PIPE_HEIGHT_RATIO + gapHeight / 2;
    const maxGapCenter =
      gameAreaHeight * (1 - GameConfig.MIN_PIPE_HEIGHT_RATIO) - gapHeight / 2;

    // Random gap position within valid range
    const gapCenterY =
      Math.random() * (maxGapCenter - minGapCenter) + minGapCenter;

    return new Pipe({
      x: screenWidth,
      gapCenterY,
      gapHeight,
      width: pipeWidth,
      scored: false,
      isRedBar,
    });
  }
}

// ── MathProblem ─────────────────────────────────────────────────────────────

export class MathProblem {
  readonly operand1: number;
  readonly operand2: number;
  readonly operator: Operator;
  readonly answer: number;

  constructor(
    operand1: number,
    operand2: number,
    operator: Operator,
    answer: number,
  ) {
    this.operand1 = operand1;
    this.operand2 = operand2;
    this.operator = operator;
    this.answer = answer;
  }

  /** Display string: "24 + 13 = ?" */
  displayString(): string {
    return `${this.operand1} ${this.operator} ${this.operand2} = ?`;
  }

  /** Short display: "24 + 13" */
  shortDisplayString(): string {
    return `${this.operand1} ${this.operator} ${this.operand2}`;
  }

  /** Check if a given input matches the answer. */
  isCorrect(input: number): boolean {
    return input === this.answer;
  }

  static addition(a: number, b: number): MathProblem {
    return new MathProblem(a, b, Operator.ADD, a + b);
  }

  static subtraction(a: number, b: number): MathProblem {
    const larger = Math.max(a, b);
    const smaller = Math.min(a, b);
    return new MathProblem(larger, smaller, Operator.SUBTRACT, larger - smaller);
  }

  static multiplication(a: number, b: number): MathProblem {
    return new MathProblem(a, b, Operator.MULTIPLY, a * b);
  }

  /**
   * Create a division problem from quotient and divisor to ensure clean division.
   */
  static division(quotient: number, divisor: number): MathProblem {
    const dividend = quotient * divisor;
    return new MathProblem(dividend, divisor, Operator.DIVIDE, quotient);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function lerp(start: number, end: number, fraction: number): number {
  return start + (end - start) * fraction;
}
