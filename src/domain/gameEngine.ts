import { GameConfig } from './gameConfig';
import {
  Bird,
  Pipe,
  MathProblem,
  GameState,
  GameSnapshot,
} from './models';
import { PhysicsSystem } from './physicsSystem';
import { CollisionDetector } from './collisionDetector';
import { MathProblemGenerator, DifficultyTier } from './mathProblemGenerator';

/**
 * Core game engine that orchestrates all game systems.
 * Manages game state, physics, collisions, scoring, and pipe spawning.
 * Ported from Android GameEngine.kt + PipeSpawner.kt.
 */
export class GameEngine {
  private readonly physicsSystem = new PhysicsSystem();
  private readonly collisionDetector = new CollisionDetector();
  private readonly mathGenerator = new MathProblemGenerator();

  // Game dimensions
  private screenWidth = 0;
  private screenHeight = 0;

  // Game state
  private bird: Bird = GameEngine.createDefaultBird();
  private pipes: Pipe[] = [];
  private currentProblem: MathProblem =
    this.mathGenerator.generateProblemForScore(0);
  private score = 0;
  private scrollSpeed: number = GameConfig.INITIAL_SCROLL_SPEED;
  private gameState: GameState = GameState.READY;
  private bgScrollOffset = 0;

  // Pipe spawner state
  private distanceSinceLastPipe = 0;
  private nextPipeIsRed = true;

  /**
   * Initialize the game engine with screen dimensions.
   * Must be called before starting the game.
   */
  initialize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.reset();
  }

  /**
   * Update the game state for one frame.
   * Called every frame (target 60fps).
   */
  update(deltaTime: number): GameSnapshot {
    if (this.gameState !== GameState.PLAYING) {
      return this.createSnapshot();
    }

    // Cap delta time to prevent physics explosion on frame drops
    const cappedDelta = Math.min(deltaTime, GameConfig.MAX_DELTA_TIME);

    // Update bird physics
    this.bird = this.physicsSystem.updateBird(this.bird, cappedDelta);

    // Update pipes (move, remove off-screen, spawn new)
    this.updatePipes(cappedDelta);

    // Check collisions
    const collision = this.collisionDetector.checkCollision(
      this.bird,
      this.pipes,
      this.screenHeight,
    );
    if (collision.hitObstacle) {
      this.gameState = GameState.GAME_OVER;
      return this.createSnapshot();
    }

    // Check and update scoring
    const newlyScored = this.collisionDetector.checkScoring(
      this.bird,
      this.pipes,
    );
    if (newlyScored > 0) {
      this.score += newlyScored;
      this.pipes = this.collisionDetector.updateScoredPipes(
        this.bird,
        this.pipes,
      );

      // Increase scroll speed
      this.scrollSpeed = Math.min(
        GameConfig.MAX_SCROLL_SPEED,
        this.scrollSpeed +
          GameConfig.SPEED_INCREMENT_PER_SCORE * newlyScored,
      );
    }

    // Update background scroll offset
    this.bgScrollOffset += GameConfig.BACKGROUND_SCROLL_SPEED * cappedDelta;

    return this.createSnapshot();
  }

  /**
   * Check if user's answer is correct.
   */
  checkAnswer(input: number): boolean {
    return this.currentProblem.isCorrect(input);
  }

  /**
   * Handle correct answer submission.
   * Triggers flap and generates new problem.
   */
  onCorrectAnswer(): void {
    this.bird = this.physicsSystem.applyFlap(this.bird);
    const tier = DifficultyTier.forScore(this.score);
    this.currentProblem = this.mathGenerator.generateProblem(tier);
  }

  /**
   * Start the game. Transitions from READY to PLAYING state.
   */
  start(): void {
    if (this.gameState === GameState.READY) {
      this.gameState = GameState.PLAYING;
    }
  }

  /**
   * Reset the game to initial state.
   */
  reset(): void {
    this.bird =
      this.screenWidth > 0 && this.screenHeight > 0
        ? Bird.createAtStart(this.screenWidth, this.screenHeight)
        : GameEngine.createDefaultBird();

    // Reset spawner state
    this.distanceSinceLastPipe = 0;
    this.nextPipeIsRed = true;

    this.mathGenerator.reset();

    // Create initial pipes (start empty, first pipe spawns quickly)
    this.distanceSinceLastPipe = this.screenWidth * 0.45;
    this.pipes = [];

    this.currentProblem = this.mathGenerator.generateProblemForScore(0);
    this.score = 0;
    this.scrollSpeed = GameConfig.INITIAL_SCROLL_SPEED;
    this.gameState = GameState.READY;
    this.bgScrollOffset = 0;
  }

  getSnapshot(): GameSnapshot {
    return this.createSnapshot();
  }

  getGameState(): GameState {
    return this.gameState;
  }

  getScore(): number {
    return this.score;
  }

  getCurrentProblem(): MathProblem {
    return this.currentProblem;
  }

  // ── Pipe Spawner Logic (inlined from PipeSpawner.kt) ──────────────────────

  /**
   * Update pipes: move existing, remove off-screen, spawn new.
   */
  private updatePipes(deltaTime: number): void {
    // Move all pipes
    let movedPipes = this.pipes.map((p) => p.move(this.scrollSpeed, deltaTime));

    // Remove off-screen pipes
    movedPipes = movedPipes.filter((p) => !p.isOffScreen());

    // Track distance for spawning
    this.distanceSinceLastPipe += this.scrollSpeed * deltaTime;

    // Spawn new pipe if needed
    if (this.shouldSpawnPipe(movedPipes)) {
      const newPipe = Pipe.createOffScreen(
        this.screenWidth,
        this.screenHeight,
        this.bird.height,
        this.nextPipeIsRed,
      );
      movedPipes.push(newPipe);
      this.distanceSinceLastPipe = 0;
      this.nextPipeIsRed = !this.nextPipeIsRed;
    }

    this.pipes = movedPipes;
  }

  /**
   * Determine if a new pipe should be spawned.
   */
  private shouldSpawnPipe(pipes: Pipe[]): boolean {
    if (pipes.length === 0) {
      // Give player some initial space
      return this.distanceSinceLastPipe >= this.screenWidth * 0.5;
    }

    // Find the rightmost pipe
    const rightmostPipe = pipes.reduce(
      (max, p) => (p.x > max.x ? p : max),
      pipes[0],
    );

    // Spawn new pipe when rightmost pipe has moved enough
    const spacing = this.screenWidth * GameConfig.PIPE_SPACING_RATIO;
    return rightmostPipe.x <= this.screenWidth - spacing;
  }

  /**
   * Create a snapshot of the current game state for rendering.
   */
  private createSnapshot(): GameSnapshot {
    return {
      bird: this.bird,
      pipes: this.pipes,
      score: this.score,
      currentProblem: this.currentProblem,
      gameState: this.gameState,
      scrollSpeed: this.scrollSpeed,
      bgScrollOffset: this.bgScrollOffset,
    };
  }

  /**
   * Create a default bird for initialization before screen dimensions are known.
   */
  private static createDefaultBird(): Bird {
    return new Bird({
      x: 100,
      y: 300,
      velocity: 0,
      rotation: 0,
      width: 50,
      height: 50,
    });
  }
}
