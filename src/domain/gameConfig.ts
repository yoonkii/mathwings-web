/**
 * Game configuration constants.
 * Ported from Android GameConfig.kt.
 * Adjust these values for playtesting and difficulty tuning.
 */
export const GameConfig = {
  // Physics - very forgiving, gives player time to solve problems
  GRAVITY: 338, // pixels/sec^2 (very gentle, floaty)
  TERMINAL_VELOCITY: 263, // max fall speed (capped)
  FLAP_IMPULSE: -300, // upward velocity - tuned for web (shorter game area)

  // Pipe configuration
  PIPE_GAP_MULTIPLIER: 6.0, // gap height = bird height x this (generous)
  PIPE_WIDTH_RATIO: 0.15, // pipe width = screen width x this
  PIPE_SPACING: 550, // horizontal distance between pipes (legacy)
  PIPE_SPACING_RATIO: 0.51, // pipe spacing = screen width x this (responsive)
  MIN_PIPE_HEIGHT_RATIO: 0.1, // minimum pipe height as ratio of game area
  MAX_GAP_HEIGHT_RATIO: 0.45, // gap can be at most 45% of game area height

  // Scroll speed
  INITIAL_SCROLL_SPEED: 100, // pixels/sec at start (slow)
  MAX_SCROLL_SPEED: 250, // maximum scroll speed
  SPEED_INCREMENT_PER_SCORE: 1.5, // speed increase per pipe passed (gradual)

  // Bird configuration
  BIRD_X_POSITION_RATIO: 0.2, // bird X position = 20% from left edge
  BIRD_SIZE_RATIO: 0.08, // bird width = 8% of screen width (base/logical size)
  BIRD_ASPECT_RATIO: 1.0, // bird height/width ratio
  BIRD_SPRITE_SCALE: 2.0, // sprite renders at 2x logical size
  BIRD_HITBOX_RATIO: 0.754, // hitbox = 58% * 1.3 (30% larger)
  BIRD_HITBOX_Y_OFFSET_RATIO: -0.35, // shift hitbox center upward by 35% of radius

  // Timing
  TARGET_FPS: 60,
  FRAME_TIME_MS: Math.floor(1000 / 60),
  MAX_DELTA_TIME: 0.05, // cap delta time to prevent physics explosions

  // Background
  BACKGROUND_SCROLL_SPEED: 20, // pixels/sec (slow parallax)

  // Rotation
  MAX_ROTATION_DOWN: 45, // max downward rotation (degrees)
  MAX_ROTATION_UP: -20, // max upward rotation on flap (degrees)
  ROTATION_LERP_FACTOR: 0.1, // smoothing for rotation changes

  // Input
  MAX_INPUT_LENGTH: 6, // maximum digits for answer input

  // Game area
  GAME_AREA_RATIO: 0.6, // top 60% for game
  KEYPAD_AREA_RATIO: 0.4, // bottom 40% for keypad
} as const;
