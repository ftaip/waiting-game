import type { Sprite } from '../../shared/pixel';

// ── Spikes (anchor: floor → point up; ceiling → flipped at draw time) ──
export const SPIKE_SMALL: Sprite = [
  [0,0,1,0,0],
  [0,1,1,1,0],
  [0,1,1,1,0],
  [1,1,1,1,1],
  [1,1,1,1,1],
];

export const SPIKE_TALL: Sprite = [
  [0,0,1,0,0],
  [0,0,1,0,0],
  [0,1,1,1,0],
  [0,1,1,1,0],
  [1,1,1,1,1],
  [1,1,1,1,1],
];

/** Cluster of three small spikes side by side. */
export const SPIKE_CLUSTER: Sprite = [
  [0,0,1,0,0,0,1,0,0,0,1,0,0],
  [0,1,1,1,0,1,1,1,0,1,1,1,0],
  [0,1,1,1,0,1,1,1,0,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ── Coin (small spinning collectible) ────────────────────────
export const COIN: Sprite = [
  [0,1,1,0],
  [1,0,0,1],
  [1,0,0,1],
  [0,1,1,0],
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

export const POWERUP_SHRINK: Sprite = [
  [1,0,0,0,0,0,1],
  [0,1,1,1,1,1,0],
  [0,1,0,0,0,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,0,0,1,0],
  [0,1,1,1,1,1,0],
  [1,0,0,0,0,0,1],
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

// ── Background star ──────────────────────────────────────────
export const STAR: Sprite = [
  [0,1,0],
  [1,1,1],
  [0,1,0],
];

export const STAR_TINY: Sprite = [
  [1],
];

// ── Gravity arrow indicator (3×5) ────────────────────────────
export const ARROW_DOWN: Sprite = [
  [0,1,0],
  [0,1,0],
  [0,1,0],
  [1,1,1],
  [0,1,0],
];

export const ARROW_UP: Sprite = [
  [0,1,0],
  [1,1,1],
  [0,1,0],
  [0,1,0],
  [0,1,0],
];
