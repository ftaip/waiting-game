// ── World scrolling ──────────────────────────────────────────
export const BASE_SPEED = 0.22;
export const SPEED_ACCELERATION = 0.0000045;
export const MAX_SPEED = 0.55;

// ── Layout ───────────────────────────────────────────────────
/** x of the cursor / hit-zone centre. */
export const PLAYER_X = 60;
export const PLAYER_WIDTH = 4;
export const PLAYER_HEIGHT = 28;
/** Notes scroll along this vertical centre line. */
export const NOTE_Y_RATIO = 0.5;
/** Tap notes use this height; hold notes use a slimmer one for visual variety. */
export const TAP_NOTE_HEIGHT = 24;
export const HOLD_NOTE_HEIGHT = 16;
export const TAP_NOTE_WIDTH = 6;
export const HOLD_NOTE_MIN_WIDTH = 26;
export const HOLD_NOTE_MAX_WIDTH = 56;

// ── Hit window ───────────────────────────────────────────────
/** Total width of the "good or better" hit window, centred on PLAYER_X. */
export const HIT_WINDOW = 18;
/** Total width of the "perfect" sub-window, centred on PLAYER_X. */
export const PERFECT_WINDOW = 6;
/** A tap note that scrolls this many px past the player without a tap is a miss. */
export const MISS_GRACE = 2;

// ── Spawning ─────────────────────────────────────────────────
export const SPAWN_MIN_GAP = 70;
export const SPAWN_MAX_GAP = 160;
export const FIRST_SPAWN_DELAY = 220;
export const HOLD_NOTE_CHANCE = 0.25;
export const PATTERN_CHANCE = 0.32;
export const PATTERN_UNLOCK_SCORE = 60;

// ── Lives ────────────────────────────────────────────────────
export const LIVES_START = 3;

// ── Scoring ──────────────────────────────────────────────────
export const SCORE_PER_DISTANCE = 0.005;
export const MILESTONE_SCORE = 100;
export const MILESTONE_FLASH_DURATION = 900;
export const TAP_NOTE_VALUE = 25;
export const PERFECT_BONUS = 25;
export const HOLD_NOTE_VALUE = 50;

// ── Combo ────────────────────────────────────────────────────
export const COMBO_TIMEOUT = 2400;
export const COMBO_MAX = 5;

// ── Tier ramp ────────────────────────────────────────────────
export const TIER_INTERVAL = 250;
export const TIER_SPEED_BOOST = 0.045;
export const TIER_FLASH_DURATION = 500;

// ── Power-ups ────────────────────────────────────────────────
export const POWERUP_SPAWN_CHANCE = 0.07;
export const POWERUP_DURATION = 4500;
export const SLOWMO_FACTOR = 0.65;
export const DOUBLE_FACTOR = 2;

// ── Background ──────────────────────────────────────────────
export const STAR_COUNT = 12;
export const PULSE_LINE_INTERVAL = 60;

// ── Death feedback ───────────────────────────────────────────
export const SCREEN_SHAKE_DURATION = 260;
export const SCREEN_SHAKE_MAGNITUDE = 5;
export const DEATH_FLASH_DURATION = 90;
export const LIFE_LOST_FLASH_DURATION = 180;
export const LIFE_LOST_SHAKE_DURATION = 120;
export const LIFE_LOST_SHAKE_MAGNITUDE = 3;
