/**
 * Canvas rendering module for the game view.
 * Draws scrolling background, stock bar pipes, bird sprite, and trading floor.
 * Ported from Android GameCanvas.kt — Wall Street trading terminal aesthetic.
 */

import { GameConfig } from '../domain/gameConfig';

// --- Color constants (Wall Street theme) ---

const SKY_BLUE = '#0D1B2A';

const STOCK_RED = '#E53E3E';
const STOCK_RED_LIGHT = '#FC8181';
const STOCK_RED_DARK = '#C53030';

const STOCK_BLUE = '#3182CE';
const STOCK_BLUE_LIGHT = '#63B3ED';
const STOCK_BLUE_DARK = '#2B6CB0';

const TRADING_FLOOR = '#1A202C';
const TRADING_FLOOR_LIGHT = '#2D3748';
const GOLD_ACCENT = '#D69E2E';

const DARK_OVERLAY = 'rgba(0, 0, 0, 0.3)';

// --- Sprite paths ---

const SPRITE_PATHS = {
  background: '/images/bg_skyline.jpg',
  charDefault: '/images/char_default.png',
  charJump2: '/images/char_jump_2.png',
  charJump3: '/images/char_jump_3.png',
  charFall: '/images/char_fall.png',
} as const;

// --- Rendering constants ---

const FLOOR_HEIGHT = 15;
const FLOOR_HIGHLIGHT_HEIGHT = 3;
const FLOOR_ACCENT_HEIGHT = 3;
const FLOOR_GRID_SPACING = 40;
const PIPE_CAP_HEIGHT = 24;
const PIPE_CAP_WIDTH_MULTIPLIER = 1.1;
const PIPE_HIGHLIGHT_RATIO = 0.15;
const PIPE_SHADOW_OFFSET_RATIO = 0.85;
const PIPE_GRID_SPACING = 60;

// --- Types ---

export interface GameSprites {
  background: HTMLImageElement;
  charDefault: HTMLImageElement;
  charJump2: HTMLImageElement;
  charJump3: HTMLImageElement;
  charFall: HTMLImageElement;
}

/** Minimal pipe snapshot required for rendering. */
interface PipeSnapshot {
  x: number;
  gapCenterY: number;
  gapHeight: number;
  width: number;
  isRedBar: boolean;
}

/** Minimal bird snapshot required for rendering. */
interface BirdSnapshot {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
}

/** Complete game state snapshot consumed by renderFrame. */
export interface GameSnapshot {
  bird: BirdSnapshot;
  pipes: readonly PipeSnapshot[];
  bgScrollOffset: number;
}

// --- Sprite loading ---

/**
 * Load a single image as a Promise.
 * Resolves when the image fires its `load` event, rejects on `error`.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * Load all game sprites from the /images/ directory.
 * Returns a Promise that resolves when every sprite is ready.
 */
export async function loadSprites(): Promise<GameSprites> {
  const [background, charDefault, charJump2, charJump3, charFall] = await Promise.all([
    loadImage(SPRITE_PATHS.background),
    loadImage(SPRITE_PATHS.charDefault),
    loadImage(SPRITE_PATHS.charJump2),
    loadImage(SPRITE_PATHS.charJump3),
    loadImage(SPRITE_PATHS.charFall),
  ]);

  return { background, charDefault, charJump2, charJump3, charFall };
}

// --- Main render function ---

/**
 * Render a single game frame onto the provided canvas 2D context.
 * The canvas covers only the game area (top 60% of the screen).
 *
 * Draw order:
 *   1. Scrolling background with dark overlay
 *   2. Trading floor (bottom strip)
 *   3. Stock bar pipes
 *   4. Bird sprite
 */
export function renderFrame(
  ctx: CanvasRenderingContext2D,
  snapshot: GameSnapshot,
  sprites: GameSprites,
  canvasWidth: number,
  canvasHeight: number,
): void {
  // Clear the entire canvas
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 1. Background
  drawScrollingBackground(ctx, sprites.background, snapshot.bgScrollOffset, canvasWidth, canvasHeight);

  // 2. Pipes (stock bars)
  for (const pipe of snapshot.pipes) {
    drawStockBar(ctx, pipe, canvasHeight);
  }

  // 3. Bird
  const selectedSprite = selectBirdSprite(snapshot.bird.velocity, sprites);
  drawBird(ctx, snapshot.bird, selectedSprite);

  // 4. Trading floor (drawn last so it sits on top of pipes that extend to bottom)
  drawTradingFloor(ctx, canvasWidth, canvasHeight);
}

// --- Background rendering ---

/**
 * Draw the scrolling NYC skyline background.
 * Scales the image to fill the canvas height, then tiles it horizontally.
 * Applies a semi-transparent dark overlay for the trading terminal look.
 */
function drawScrollingBackground(
  ctx: CanvasRenderingContext2D,
  bgImage: HTMLImageElement,
  offset: number,
  canvasWidth: number,
  canvasHeight: number,
): void {
  // Fill with base color first (visible if image hasn't loaded)
  ctx.fillStyle = SKY_BLUE;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Scale image to fill canvas height
  const scale = canvasHeight / bgImage.naturalHeight;
  const scaledWidth = Math.ceil(bgImage.naturalWidth * scale);

  // Wrap offset to prevent float precision loss over time
  const wrappedOffset = ((offset % scaledWidth) + scaledWidth) % scaledWidth;

  // Tile the background across the full width
  let drawX = -wrappedOffset;
  while (drawX < canvasWidth) {
    ctx.drawImage(bgImage, drawX, 0, scaledWidth, canvasHeight);
    drawX += scaledWidth;
  }

  // Dark overlay for trading terminal aesthetic
  ctx.fillStyle = DARK_OVERLAY;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
}

// --- Stock bar (pipe) rendering ---

/**
 * Draw a single stock bar obstacle (pipe).
 * Each bar has a top section (screen top to gap top) and a bottom section
 * (gap bottom to screen bottom), with caps at the gap-facing ends.
 * Matches the Android drawStockBar implementation exactly.
 */
function drawStockBar(
  ctx: CanvasRenderingContext2D,
  pipe: PipeSnapshot,
  canvasHeight: number,
): void {
  const gapTop = pipe.gapCenterY - pipe.gapHeight / 2;
  const gapBottom = pipe.gapCenterY + pipe.gapHeight / 2;

  const mainColor = pipe.isRedBar ? STOCK_RED : STOCK_BLUE;
  const lightColor = pipe.isRedBar ? STOCK_RED_LIGHT : STOCK_BLUE_LIGHT;
  const darkColor = pipe.isRedBar ? STOCK_RED_DARK : STOCK_BLUE_DARK;

  const capWidth = pipe.width * PIPE_CAP_WIDTH_MULTIPLIER;
  const capOffset = (capWidth - pipe.width) / 2;
  const highlightWidth = pipe.width * PIPE_HIGHLIGHT_RATIO;
  const shadowX = pipe.x + pipe.width * PIPE_SHADOW_OFFSET_RATIO;
  const shadowWidth = pipe.width * PIPE_HIGHLIGHT_RATIO;

  // --- Top bar ---

  const topBodyHeight = gapTop - PIPE_CAP_HEIGHT;

  // Main body (from top of screen to just above cap)
  if (topBodyHeight > 0) {
    ctx.fillStyle = mainColor;
    ctx.fillRect(pipe.x, 0, pipe.width, topBodyHeight);

    // Highlight (left edge)
    ctx.fillStyle = lightColor;
    ctx.fillRect(pipe.x, 0, highlightWidth, topBodyHeight);

    // Shadow (right edge)
    ctx.fillStyle = darkColor;
    ctx.fillRect(shadowX, 0, shadowWidth, topBodyHeight);

    // Grid lines (trading chart style)
    drawPipeGridLines(ctx, darkColor, pipe.x, pipe.width, PIPE_GRID_SPACING, topBodyHeight);
  }

  // Cap (gap-facing end only)
  ctx.fillStyle = mainColor;
  ctx.fillRect(pipe.x - capOffset, gapTop - PIPE_CAP_HEIGHT, capWidth, PIPE_CAP_HEIGHT);
  ctx.fillStyle = lightColor;
  ctx.fillRect(pipe.x - capOffset, gapTop - PIPE_CAP_HEIGHT, capWidth * PIPE_HIGHLIGHT_RATIO, PIPE_CAP_HEIGHT);

  // --- Bottom bar ---

  // Cap (gap-facing end only)
  ctx.fillStyle = mainColor;
  ctx.fillRect(pipe.x - capOffset, gapBottom, capWidth, PIPE_CAP_HEIGHT);
  ctx.fillStyle = lightColor;
  ctx.fillRect(pipe.x - capOffset, gapBottom, capWidth * PIPE_HIGHLIGHT_RATIO, PIPE_CAP_HEIGHT);

  // Main body (from below cap to bottom of screen)
  const bottomBodyTop = gapBottom + PIPE_CAP_HEIGHT;
  const bottomBodyHeight = canvasHeight - bottomBodyTop;

  if (bottomBodyHeight > 0) {
    ctx.fillStyle = mainColor;
    ctx.fillRect(pipe.x, bottomBodyTop, pipe.width, bottomBodyHeight);

    // Highlight (left edge)
    ctx.fillStyle = lightColor;
    ctx.fillRect(pipe.x, bottomBodyTop, highlightWidth, bottomBodyHeight);

    // Shadow (right edge)
    ctx.fillStyle = darkColor;
    ctx.fillRect(shadowX, bottomBodyTop, shadowWidth, bottomBodyHeight);

    // Grid lines for bottom
    drawPipeGridLines(ctx, darkColor, pipe.x, pipe.width, bottomBodyTop + PIPE_GRID_SPACING, canvasHeight);
  }
}

/**
 * Draw horizontal grid lines on a pipe section for the stock chart appearance.
 * Lines are drawn at regular intervals within the specified vertical range.
 */
function drawPipeGridLines(
  ctx: CanvasRenderingContext2D,
  darkColor: string,
  pipeX: number,
  pipeWidth: number,
  startY: number,
  endY: number,
): void {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;

  let gridY = startY;
  while (gridY < endY) {
    ctx.beginPath();
    ctx.moveTo(pipeX, gridY);
    ctx.lineTo(pipeX + pipeWidth, gridY);
    ctx.stroke();
    gridY += PIPE_GRID_SPACING;
  }

  ctx.restore();
}

// --- Bird rendering ---

/** Velocity thresholds for sprite selection (matching Android logic). */
const VELOCITY_JUMP3_THRESHOLD = -300;
const VELOCITY_JUMP2_THRESHOLD = -100;
const VELOCITY_DEFAULT_THRESHOLD = 100;

/**
 * Select the appropriate bird sprite based on current vertical velocity.
 */
function selectBirdSprite(velocity: number, sprites: GameSprites): HTMLImageElement {
  if (velocity < VELOCITY_JUMP3_THRESHOLD) return sprites.charJump3;
  if (velocity < VELOCITY_JUMP2_THRESHOLD) return sprites.charJump2;
  if (velocity < VELOCITY_DEFAULT_THRESHOLD) return sprites.charDefault;
  return sprites.charFall;
}

/**
 * Draw the bird sprite centered on its position, scaled by BIRD_SPRITE_SCALE,
 * and rotated according to bird.rotation.
 */
function drawBird(
  ctx: CanvasRenderingContext2D,
  bird: BirdSnapshot,
  sprite: HTMLImageElement,
): void {
  const spriteW = bird.width * GameConfig.BIRD_SPRITE_SCALE;
  const spriteH = bird.height * GameConfig.BIRD_SPRITE_SCALE;

  ctx.save();

  // Translate to bird center, rotate, then draw centered
  ctx.translate(bird.x, bird.y);
  ctx.rotate((bird.rotation * Math.PI) / 180);
  ctx.drawImage(
    sprite,
    -spriteW / 2,
    -spriteH / 2,
    spriteW,
    spriteH,
  );

  ctx.restore();
}

// --- Trading floor rendering ---

/**
 * Draw the trading floor ground at the bottom of the game area.
 * A narrow marble-like strip with a gold accent line, matching Android.
 */
function drawTradingFloor(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const floorTop = canvasHeight - FLOOR_HEIGHT;

  // Main floor (dark marble)
  ctx.fillStyle = TRADING_FLOOR;
  ctx.fillRect(0, floorTop, canvasWidth, FLOOR_HEIGHT);

  // Highlight line at top
  ctx.fillStyle = TRADING_FLOOR_LIGHT;
  ctx.fillRect(0, floorTop, canvasWidth, FLOOR_HIGHLIGHT_HEIGHT);

  // Gold accent line at bottom
  ctx.fillStyle = GOLD_ACCENT;
  ctx.fillRect(0, canvasHeight - FLOOR_ACCENT_HEIGHT, canvasWidth, FLOOR_ACCENT_HEIGHT);

  // Vertical grid pattern
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = TRADING_FLOOR_LIGHT;
  ctx.lineWidth = 0.5;

  let gridX = 0;
  while (gridX < canvasWidth) {
    ctx.beginPath();
    ctx.moveTo(gridX, floorTop);
    ctx.lineTo(gridX, canvasHeight);
    ctx.stroke();
    gridX += FLOOR_GRID_SPACING;
  }

  ctx.restore();
}
