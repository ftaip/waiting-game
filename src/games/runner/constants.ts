// ── World scrolling ──────────────────────────────────────────
export const BASE_SPEED = 0.20;
export const SPEED_ACCELERATION = 0.0000045;
export const MAX_SPEED = 0.55;

// ── Layout ───────────────────────────────────────────────────
export const GROUND_Y_RATIO = 0.78; // top edge of ground line
export const PLAYER_X = 60;
export const PLAYER_WIDTH = 18;
export const PLAYER_HEIGHT = 22;

// ── Physics ──────────────────────────────────────────────────
// Tuned so a tap-jump peaks at ~36px above the ground (clears the 28px-tall
// cactus with a small margin) and a fully-held jump peaks at ~60px (clears
// any obstacle with room to grab the top of the coin arc), while still
// leaving a comfortable gap below the score HUD at the top of the canvas.
/** Strong gravity for a snappy, "platformer-y" fall. */
export const GRAVITY = 0.0045;
/** Initial upward velocity injected on the first tap of a jump. */
export const JUMP_IMPULSE = -0.8;
/** Reduced gravity while the button is still held mid-jump → variable height. */
export const HOLD_GRAVITY = 0.0030;
/** Max time after lift-off during which holding still reduces gravity (ms). */
export const HOLD_BOOST_WINDOW = 200;
/** Cap on fall speed (pixels per ms). */
export const MAX_FALL_SPEED = 1.0;

// ── Obstacles ────────────────────────────────────────────────
export const OBSTACLE_MIN_GAP = 180;
export const OBSTACLE_MAX_GAP = 340;
export const FIRST_OBSTACLE_DELAY = 240;
export const BIRD_UNLOCK_SCORE = 60;
export const BIRD_CHANCE = 0.32;
export const PATTERN_CHANCE = 0.30;

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
export const MAGNET_RADIUS = 70;
export const MAGNET_PULL = 0.18;

// ── Background parallax ──────────────────────────────────────
export const CLOUD_COUNT = 4;
export const HILL_COUNT = 3;
export const CLOUD_PARALLAX = 0.18;
export const HILL_PARALLAX = 0.45;

// ── Death feedback ───────────────────────────────────────────
export const SCREEN_SHAKE_DURATION = 260;
export const SCREEN_SHAKE_MAGNITUDE = 5;
export const DEATH_FLASH_DURATION = 90;
