import type { Sprite } from '../../shared/pixel';

export type GravitySkinId = 'cube' | 'triangle' | 'diamond';

export interface GravitySkinFrames {
  /** Resting (gravity stable). */
  idle: Sprite;
  /** Mid-flip (in transit between surfaces). */
  flip: Sprite;
  /** Game-over pose. */
  dead: Sprite;
  /**
   * If true the renderer will mirror the sprite vertically when the player is
   * pinned to the ceiling — useful for asymmetric skins like the triangle.
   */
  mirrorOnFlip: boolean;
}

// ── Cube (chunky face, two-pixel "eyes") ─────────────────────
const CUBE_IDLE: Sprite = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,0,0,1,0,1],
  [1,0,1,0,0,1,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1],
];

const CUBE_FLIP: Sprite = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,0,1,1,0,0,1],
  [1,1,0,0,0,0,1,1],
  [1,1,0,0,0,0,1,1],
  [1,0,0,1,1,0,0,1],
  [1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1],
];

const CUBE_DEAD: Sprite = [
  [1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,0,0,1,0,1],
  [1,0,0,1,1,0,0,1],
  [1,0,1,0,0,1,0,1],
  [1,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1],
  [1,1,1,1,1,1,1,1],
];

// ── Triangle (point faces away from gravity) ─────────────────
const TRIANGLE_IDLE: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,1,1,0,0],
  [0,0,1,1,1,0,0],
  [0,1,1,0,1,1,0],
  [0,1,1,0,1,1,0],
  [1,1,0,0,0,1,1],
  [1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1],
];

const TRIANGLE_FLIP: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,0,1,0,0],
  [0,1,1,0,1,1,0],
  [0,1,0,1,0,1,0],
  [0,1,0,1,0,1,0],
  [1,1,0,1,0,1,1],
  [1,0,0,1,0,0,1],
  [1,1,1,1,1,1,1],
];

const TRIANGLE_DEAD: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,0,1,0,0],
  [0,0,1,0,1,0,0],
  [0,1,0,1,0,1,0],
  [0,1,0,0,0,1,0],
  [1,0,1,0,1,0,1],
  [1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1],
];

// ── Diamond (rotated square) ─────────────────────────────────
const DIAMOND_IDLE: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,1,1,0,0],
  [0,1,1,0,1,1,0],
  [1,1,0,0,0,1,1],
  [1,1,0,0,0,1,1],
  [0,1,1,0,1,1,0],
  [0,0,1,1,1,0,0],
  [0,0,0,1,0,0,0],
];

const DIAMOND_FLIP: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,0,1,0,0],
  [0,1,0,1,0,1,0],
  [1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1],
  [0,1,0,1,0,1,0],
  [0,0,1,0,1,0,0],
  [0,0,0,1,0,0,0],
];

const DIAMOND_DEAD: Sprite = [
  [0,0,0,1,0,0,0],
  [0,0,1,0,1,0,0],
  [0,1,0,0,0,1,0],
  [1,0,1,0,1,0,1],
  [1,0,1,0,1,0,1],
  [0,1,0,0,0,1,0],
  [0,0,1,0,1,0,0],
  [0,0,0,1,0,0,0],
];

export const GRAVITY_SKINS: Record<GravitySkinId, GravitySkinFrames> = {
  cube: {
    idle: CUBE_IDLE,
    flip: CUBE_FLIP,
    dead: CUBE_DEAD,
    mirrorOnFlip: false,
  },
  triangle: {
    idle: TRIANGLE_IDLE,
    flip: TRIANGLE_FLIP,
    dead: TRIANGLE_DEAD,
    mirrorOnFlip: true,
  },
  diamond: {
    idle: DIAMOND_IDLE,
    flip: DIAMOND_FLIP,
    dead: DIAMOND_DEAD,
    mirrorOnFlip: false,
  },
};

export const GRAVITY_SKIN_IDS: GravitySkinId[] = ['cube', 'triangle', 'diamond'];
