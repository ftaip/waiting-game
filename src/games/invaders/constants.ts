// ── World scrolling ──────────────────────────────────────────
export const BASE_SPEED = 0.18;
export const SPEED_ACCELERATION = 0.0000040;
export const MAX_SPEED = 0.50;

// ── Layout ───────────────────────────────────────────────────
export const PLAYER_X = 60;
export const PLAYER_WIDTH = 22;
export const PLAYER_HEIGHT = 16;
/** y position of the upper lane (centre line). */
export const LANE_UPPER_RATIO = 0.34;
/** y position of the lower lane (centre line). */
export const LANE_LOWER_RATIO = 0.74;
/** ms it takes the turret sprite to fade between lanes (visual only). */
export const LANE_SWITCH_DURATION = 110;

// ── Firing ───────────────────────────────────────────────────
/** Default time between auto-shots (ms). */
export const FIRE_INTERVAL = 320;
/** Rapid-fire time between auto-shots (ms). */
export const RAPID_FIRE_INTERVAL = 140;
/** Visual flash on the muzzle after each shot (ms). */
export const MUZZLE_FLASH_DURATION = 70;
/** Pixels per ms a bullet travels rightward. */
export const BULLET_SPEED = 0.65;

// ── Aliens ───────────────────────────────────────────────────
export const ALIEN_GRUNT_HP = 1;
export const ALIEN_DRONE_HP = 1;
export const ALIEN_TANK_HP = 2;
/** Per-kind speed multiplier on top of the world speed. */
export const ALIEN_GRUNT_SPEED_MULT = 0.9;
export const ALIEN_DRONE_SPEED_MULT = 1.4;
export const ALIEN_TANK_SPEED_MULT = 0.55;

// ── Spawning ─────────────────────────────────────────────────
export const SPAWN_MIN_GAP = 180;
export const SPAWN_MAX_GAP = 320;
export const FIRST_SPAWN_DELAY = 220;
export const PATTERN_CHANCE = 0.32;
export const PATTERN_UNLOCK_SCORE = 60;

// ── Scoring ──────────────────────────────────────────────────
export const SCORE_PER_DISTANCE = 0.008;
export const MILESTONE_SCORE = 100;
export const MILESTONE_FLASH_DURATION = 900;
export const ALIEN_GRUNT_SCORE = 10;
export const ALIEN_DRONE_SCORE = 20;
export const ALIEN_TANK_SCORE = 50;
export const NEAR_MISS_VALUE = 5;

// ── Combo ────────────────────────────────────────────────────
export const COMBO_TIMEOUT = 2400;
export const COMBO_MAX = 5;

// ── "Close kill" (the invaders equivalent of a near-miss) ────
/** Killing an alien within this many px of the player counts as a close kill. */
export const CLOSE_KILL_DISTANCE = 50;

// ── Tier ramp ────────────────────────────────────────────────
export const TIER_INTERVAL = 250;
export const TIER_SPEED_BOOST = 0.045;
export const TIER_FLASH_DURATION = 500;

// ── Power-ups ────────────────────────────────────────────────
export const POWERUP_SPAWN_CHANCE = 0.07;
export const POWERUP_DURATION = 4500;
export const SLOWMO_FACTOR = 0.65;

// ── Background ──────────────────────────────────────────────
export const STAR_COUNT = 18;

// ── Death feedback ───────────────────────────────────────────
export const SCREEN_SHAKE_DURATION = 260;
export const SCREEN_SHAKE_MAGNITUDE = 5;
export const DEATH_FLASH_DURATION = 90;
