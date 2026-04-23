// ── Physics — gentle "underwater drift" feel ──────────────────
// Hold the button to thrust upward; release to sink under gravity.
export const GRAVITY = 0.0008;
export const THRUST = -0.0018;
export const MAX_FALL_SPEED = 0.28;
export const MAX_RISE_SPEED = -0.32;
export const VELOCITY_DAMPING = 0.985;

// ── World scrolling ──────────────────────────────────────────
export const BASE_SPEED = 0.16;
export const SPEED_ACCELERATION = 0.000003;
export const MAX_SPEED = 0.5;

// Vertical channel
export const CEILING_Y_RATIO = 0.06;
export const FLOOR_Y_RATIO = 0.94;

// ── Obstacles ────────────────────────────────────────────────
export const OBSTACLE_MIN_GAP = 180;
export const OBSTACLE_MAX_GAP = 320;
export const FIRST_OBSTACLE_DELAY = 220;
export const CEILING_OBSTACLE_UNLOCK_SCORE = 0;
export const CEILING_OBSTACLE_CHANCE = 0.5;
/** Chance that an obstacle spawn slot becomes a multi-piece pattern. */
export const PATTERN_CHANCE = 0.35;

// ── Player ───────────────────────────────────────────────────
export const PLAYER_X = 60;
export const PLAYER_WIDTH = 18;
export const PLAYER_HEIGHT = 22;

// ── Bubbles ──────────────────────────────────────────────────
export const BUBBLE_COUNT = 8;
export const BUBBLE_RISE_SPEED = 0.05;

// ── Background parallax ──────────────────────────────────────
export const KELP_COUNT = 4;
export const ROCK_COUNT = 3;
export const KELP_PARALLAX = 0.55;
export const ROCK_PARALLAX = 0.3;

// ── Score ────────────────────────────────────────────────────
export const SCORE_PER_DISTANCE = 0.01;
export const MILESTONE_SCORE = 100;
export const MILESTONE_FLASH_DURATION = 900; // ms
export const PEARL_VALUE = 25;
export const NEAR_MISS_VALUE = 5;

// ── Combo ────────────────────────────────────────────────────
export const COMBO_TIMEOUT = 2400; // ms before combo resets
export const COMBO_MAX = 5;

// ── Near-miss detection ──────────────────────────────────────
export const NEAR_MISS_DISTANCE = 8;

// ── Speed tiers ──────────────────────────────────────────────
export const TIER_INTERVAL = 250; // points per tier
export const TIER_SPEED_BOOST = 0.04;
export const TIER_FLASH_DURATION = 500; // ms

// ── Currents ─────────────────────────────────────────────────
export const CURRENT_SPAWN_CHANCE = 0.18; // per obstacle slot
export const CURRENT_FORCE = 0.00075;
export const CURRENT_MIN_LENGTH = 220;
export const CURRENT_MAX_LENGTH = 380;
export const CURRENT_HEIGHT = 36;

// ── Pearls ───────────────────────────────────────────────────
export const PEARL_SPAWN_CHANCE = 0.55; // per obstacle gap
export const PEARL_TRAIL_LENGTH = 3; // small line of pearls

// ── Power-ups ────────────────────────────────────────────────
export const POWERUP_SPAWN_CHANCE = 0.07; // per obstacle gap
export const POWERUP_DURATION = 4500; // ms
export const SHRINK_HITBOX_RATIO = 0.55;
export const SLOWMO_FACTOR = 0.65; // world runs at 65% speed

// ── Death feedback ───────────────────────────────────────────
export const SCREEN_SHAKE_DURATION = 260; // ms
export const SCREEN_SHAKE_MAGNITUDE = 5; // px
export const DEATH_FLASH_DURATION = 90; // ms
