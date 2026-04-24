// ── World scrolling ──────────────────────────────────────────
export const BASE_SPEED = 0.18;
export const SPEED_ACCELERATION = 0.0000040;
export const MAX_SPEED = 0.50;

// ── Layout ───────────────────────────────────────────────────
export const CEILING_Y_RATIO = 0.10;
export const FLOOR_Y_RATIO = 0.90;
export const PLAYER_X = 60;
export const PLAYER_WIDTH = 16;
export const PLAYER_HEIGHT = 16;

// ── Physics ──────────────────────────────────────────────────
/** Absolute gravity magnitude (px / ms²). Sign comes from gravityDir. */
export const GRAVITY = 0.0035;
/** Cap on speed in either direction (px / ms). */
export const MAX_TRAVERSAL_SPEED = 1.0;
/** When you flip mid-arc, give the velocity an extra kick so the flip feels
 *  responsive even if you were already moving the wrong way. */
export const FLIP_REVERSAL_BOOST = 0.35;

// ── Obstacles ────────────────────────────────────────────────
export const OBSTACLE_MIN_GAP = 200;
export const OBSTACLE_MAX_GAP = 360;
export const FIRST_OBSTACLE_DELAY = 240;
export const PATTERN_CHANCE = 0.35;
export const PATTERN_UNLOCK_SCORE = 60;

// ── Scoring ──────────────────────────────────────────────────
export const SCORE_PER_DISTANCE = 0.012;
export const MILESTONE_SCORE = 100;
export const MILESTONE_FLASH_DURATION = 900;
export const COIN_VALUE = 25;
export const NEAR_MISS_VALUE = 5;

// ── Combo ────────────────────────────────────────────────────
export const COMBO_TIMEOUT = 2400;
export const COMBO_MAX = 5;

// ── Near-miss detection ──────────────────────────────────────
export const NEAR_MISS_DISTANCE = 8;

// ── Tier ramp ────────────────────────────────────────────────
export const TIER_INTERVAL = 250;
export const TIER_SPEED_BOOST = 0.045;
export const TIER_FLASH_DURATION = 500;

// ── Coins ────────────────────────────────────────────────────
export const COIN_SPAWN_CHANCE = 0.55;
export const COIN_TRAIL_LENGTH = 3;

// ── Power-ups ────────────────────────────────────────────────
export const POWERUP_SPAWN_CHANCE = 0.07;
export const POWERUP_DURATION = 4500;
export const SHRINK_HITBOX_RATIO = 0.55;
export const SLOWMO_FACTOR = 0.65;

// ── Background ──────────────────────────────────────────────
export const STAR_COUNT = 14;
export const GRID_SPACING = 24;

// ── Death feedback ───────────────────────────────────────────
export const SCREEN_SHAKE_DURATION = 260;
export const SCREEN_SHAKE_MAGNITUDE = 5;
export const DEATH_FLASH_DURATION = 90;
