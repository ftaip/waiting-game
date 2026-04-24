import type { Sprite } from '../../shared/pixel';

// ── Heart (life pip, 5×5) ────────────────────────────────────
export const HEART: Sprite = [
  [0,1,0,1,0],
  [1,1,1,1,1],
  [1,1,1,1,1],
  [0,1,1,1,0],
  [0,0,1,0,0],
];

/** Hollow heart, drawn instead of HEART for lost lives. */
export const HEART_EMPTY: Sprite = [
  [0,1,0,1,0],
  [1,0,1,0,1],
  [1,0,0,0,1],
  [0,1,0,1,0],
  [0,0,1,0,0],
];

// ── Hit ring (drawn at the cursor on a successful hit) ───────
export const HIT_RING: Sprite = [
  [0,1,1,1,0],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [0,1,1,1,0],
];

// ── Power-up icons (7×7) ─────────────────────────────────────
export const POWERUP_SHIELD: Sprite = [
  [0,1,1,1,1,1,0],
  [1,1,0,0,0,1,1],
  [1,0,1,1,1,0,1],
  [1,0,1,0,1,0,1],
  [1,0,1,1,1,0,1],
  [0,1,0,0,0,1,0],
  [0,0,1,1,1,0,0],
];

export const POWERUP_SLOWMO: Sprite = [
  [0,1,1,1,1,1,0],
  [1,0,0,1,0,0,1],
  [1,0,0,1,0,0,1],
  [1,0,0,1,1,0,1],
  [1,0,0,0,0,0,1],
  [1,0,0,0,0,0,1],
  [0,1,1,1,1,1,0],
];

/** "x2" double-score icon. */
export const POWERUP_DOUBLE: Sprite = [
  [1,0,0,1,0,1,1],
  [1,0,0,1,1,0,1],
  [1,1,0,1,0,1,0],
  [0,1,0,1,1,0,1],
  [0,0,1,1,0,1,1],
  [0,0,0,1,1,0,1],
  [0,0,0,1,0,1,1],
];

// ── Background star (for ambience) ───────────────────────────
export const STAR: Sprite = [
  [0,1,0],
  [1,1,1],
  [0,1,0],
];

export const STAR_TINY: Sprite = [[1]];
