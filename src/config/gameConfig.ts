/**
 * Game configuration constants
 * 
 * Centralized configuration for all game constants including colors, sizes,
 * speeds, positions, and game rules.
 */

// ============================================================================
// Colors
// ============================================================================
export const Colors = {
  PLAYER: 0x38bdf8,
  DOOR: 0x8B4513,
  ENEMY: 0x22c55e,
  ENEMY_HIT: 0xef4444,
  ENEMY_PURPLE: 0xa855f7, // Purple enemy that hunts the player
  TREASURE: 0xfacc15,
  ARROW: 0xfacc15,
  WALL: 0x1f2937,
  GAME_OVER: 0xf97316,
  TEXT_PRIMARY: "#e6edf3",
  TEXT_SECONDARY: "#94a3b8",
  TEXT_SCORE: "#e2e8f0",
  TEXT_GAME_OVER: "#fca5a5",
} as const;

// ============================================================================
// Sizes
// ============================================================================
export const Sizes = {
  ENEMY_RADIUS: 14,
  TREASURE_RADIUS: 12,
  ARROW_WIDTH: 6,
  ARROW_HEIGHT: 12,
  PLAYER_WIDTH: 12,
  PLAYER_HEIGHT: 16,
  WALL_THICKNESS: 24,
  DOOR_WIDTH: 90,
  TITLE_FONT: "20px",
  INSTRUCTION_FONT: "14px",
  SCORE_FONT: "16px",
  ROOM_FONT: "14px",
  GAME_OVER_FONT: "36px",
} as const;

// ============================================================================
// Speeds
// ============================================================================
export const Speeds = {
  PLAYER: 200,
  ARROW: 400,
  ENEMY: 140,
  DIAGONAL_MULTIPLIER: 0.7071,
} as const;

// ============================================================================
// Positions & Offsets
// ============================================================================
export const Positions = {
  // Safe area offset for iPhone 16: ~59 points (Dynamic Island + status bar)
  SAFE_AREA_TOP: 59,
  // Controls area offset: space needed for joystick (60px radius) + fire button (40px radius) + buffer
  // Controls are at height - 100 - 34 (safe area), so we need gameplay area to end above this
  CONTROLS_AREA_HEIGHT: 200,
  // Room top offset: position of top wall below the instruction text
  ROOM_TOP_OFFSET: 140, // Below instructions (107 + ~33 for spacing)
  TITLE_Y: 83, // 24 + 59 (safe area)
  INSTRUCTION_Y: 107, // 48 + 59 (safe area)
  PLAYER_OFFSET_Y: 80,
  UI_X: 16,
  UI_SCORE_Y: 75, // 16 + 59 (safe area)
  UI_ROOM_Y: 95, // 36 + 59 (safe area)
  PADDING: 80,
  PADDING_TREASURE_Y_OFFSET: 40,
  SPAWN_MIN_X: 100,
  SPAWN_MIN_Y: 120,
  SPAWN_MAX_Y_OFFSET: 160,
  CLEANUP_OFFSET: 50,
} as const;

// ============================================================================
// Game Configuration
// ============================================================================
export const GameConfig = {
  ENEMY_COUNT: 3,
  ENEMY_DIRECTION_CHANGE_DELAY: 2000,
  FIRE_RATE_DELAY: 200,
  WALL_HEIGHT_RATIO: 0.5,
  WALL_HEIGHT_MAX_RATIO: 0.5, // Maximum wall height as ratio of room height (safety cap)
  SCORE_TREASURE: 50,
  SCORE_ENEMY: 25,
  ANGLE_OFFSET: -90,
  UI_Z_DEPTH: 1000,
  // Timing constants
  ENEMY_SPAWN_CHECK_DELAY: 1000, // Check for enemy spawns every second (ms)
  GAME_OVER_TRANSITION_DELAY: 2000, // Delay before transitioning to main scene (ms)
  MILLISECONDS_PER_SECOND: 1000, // Conversion factor
  // Enemy spawn probability constants
  ENEMY_SPAWN_START_TIME: 5, // Start checking for spawns after 5 seconds
  ENEMY_SPAWN_BASE_CHANCE: 5, // Base spawn chance percentage
  ENEMY_SPAWN_CHANCE_INCREMENT: 5, // Increase spawn chance by this % per second
  ENEMY_SPAWN_TIME_OFFSET: 4, // Time offset for probability calculation
  ENEMY_SPAWN_MAX_CHANCE: 100, // Maximum spawn chance percentage
  ENEMY_SPAWN_ROLL_MIN: 0, // Minimum roll value for spawn chance
  ENEMY_SPAWN_ROLL_MAX: 100, // Maximum roll value for spawn chance
  // Purple enemy constants
  PURPLE_ENEMY_SPEED_MULTIPLIER: 1.05, // Purple enemy is 5% faster than player
  PURPLE_ENEMY_SPAWN_OFFSET: 10, // Vertical offset from top wall when spawning
  // Physics constants
  ENEMY_BOUNCE_X: 1, // Enemy bounce coefficient on X axis
  ENEMY_BOUNCE_Y: 1, // Enemy bounce coefficient on Y axis
} as const;

// ============================================================================
// Player Triangle Points
// ============================================================================
export const PlayerTrianglePoints = {
  x1: 0,
  y1: -8,
  x2: -6,
  y2: 8,
  x3: 6,
  y3: 8,
} as const;

// ============================================================================
// Direction Angles
// ============================================================================
export const DirectionAngles = [0, 45, 90, 135, 180, 225, 270, 315] as const;

// ============================================================================
// Mobile Controls Configuration
// ============================================================================
export const MobileControlsConfig = {
  // Safe area offsets
  BOTTOM_SAFE_AREA: 34, // Bottom safe area offset for iPhone 16 (points)
  // Fire button configuration
  FIRE_BUTTON_OFFSET_X: 100, // Distance from right edge
  FIRE_BUTTON_OFFSET_Y: 100, // Distance from bottom (before safe area)
  FIRE_BUTTON_RADIUS: 40,
  FIRE_BUTTON_COLOR: 0xff4444,
  FIRE_BUTTON_ALPHA: 0.7,
  FIRE_BUTTON_ALPHA_HOVER: 0.9,
  // Joystick configuration
  JOYSTICK_OFFSET_X: 100, // Distance from left edge
  JOYSTICK_OFFSET_Y: 100, // Distance from bottom (before safe area)
  JOYSTICK_BASE_RADIUS: 60,
  JOYSTICK_BASE_COLOR: 0x888888,
  JOYSTICK_BASE_ALPHA: 0.5,
  JOYSTICK_THUMB_RADIUS: 30,
  JOYSTICK_THUMB_COLOR: 0xcccccc,
  JOYSTICK_THUMB_ALPHA: 0.8,
  JOYSTICK_DIRECTION_MODE: '8dir' as const, // 8-directional movement
} as const;

// ============================================================================
// UI Layout Constants (MainScene)
// ============================================================================
export const UILayout = {
  HIGH_SCORE_LABEL_OFFSET_Y: 40, // Offset below instruction text
  HIGH_SCORE_START_OFFSET_Y: 30, // Offset below label
  HIGH_SCORE_LINE_HEIGHT: 20, // Line spacing for score list
  START_BUTTON_OFFSET_Y: 50, // Offset below high scores or center
  START_BUTTON_PADDING_LEFT: 20,
  START_BUTTON_PADDING_RIGHT: 20,
  START_BUTTON_PADDING_TOP: 10,
  START_BUTTON_PADDING_BOTTOM: 10,
} as const;
