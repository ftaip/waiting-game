import type { Sprite } from '../../shared/pixel';

export type RhythmSkinId = 'bar' | 'dot' | 'arrow';

export interface RhythmSkinFrames {
  /** Resting cursor. */
  idle: Sprite;
  /** Brief flash when a note is hit (~120 ms). */
  hit: Sprite;
  /** Game-over cursor. */
  dead: Sprite;
}

// ── Bar (vertical line with a notched centre marker) ─────────
const BAR_IDLE: Sprite = [
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
  [1],
];

const BAR_HIT: Sprite = [
  [1,0,1],
  [0,1,0],
  [0,1,0],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [1,1,1],
  [0,1,0],
  [0,1,0],
  [1,0,1],
];

const BAR_DEAD: Sprite = [
  [1,0,0],
  [0,1,0],
  [0,0,1],
  [0,0,1],
  [0,1,0],
  [1,0,0],
  [1,0,0],
  [0,1,0],
  [0,0,1],
  [0,1,0],
  [1,0,0],
  [0,1,0],
  [0,0,1],
  [0,1,0],
];

// ── Dot (centred diamond, pulses on hit) ─────────────────────
const DOT_IDLE: Sprite = [
  [0,0,0,0,0],
  [0,0,0,0,0],
  [0,0,1,0,0],
  [0,1,1,1,0],
  [1,1,1,1,1],
  [1,1,0,1,1],
  [1,1,1,1,1],
  [0,1,1,1,0],
  [0,0,1,0,0],
  [0,0,0,0,0],
  [0,0,0,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
];

const DOT_HIT: Sprite = [
  [0,0,1,0,0],
  [0,1,1,1,0],
  [1,1,0,1,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,0,0,0,1],
  [1,1,0,1,1],
  [0,1,1,1,0],
  [0,0,1,0,0],
  [0,0,0,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
];

const DOT_DEAD: Sprite = [
  [0,0,0,0,0],
  [0,0,0,0,0],
  [1,0,1,0,1],
  [0,1,1,1,0],
  [1,1,0,1,1],
  [0,1,0,1,0],
  [1,1,0,1,1],
  [0,1,1,1,0],
  [1,0,1,0,1],
  [0,0,0,0,0],
  [0,0,0,0,0],
  [0,0,0,0,0],
  [0,0,1,0,0],
  [0,0,1,0,0],
];

// ── Arrow (triangle pointer, points at the hit zone) ─────────
const ARROW_IDLE: Sprite = [
  [0,0,0,0,1],
  [0,0,0,0,1],
  [0,0,0,1,1],
  [0,0,0,1,1],
  [0,0,1,1,1],
  [0,0,1,1,1],
  [0,1,1,1,1],
  [0,1,1,1,1],
  [0,0,1,1,1],
  [0,0,1,1,1],
  [0,0,0,1,1],
  [0,0,0,1,1],
  [0,0,0,0,1],
  [0,0,0,0,1],
];

const ARROW_HIT: Sprite = [
  [0,0,0,0,1],
  [0,0,0,1,1],
  [0,0,0,1,1],
  [0,0,1,1,1],
  [0,0,1,1,1],
  [0,1,1,1,1],
  [1,1,1,1,1],
  [1,1,1,1,1],
  [0,1,1,1,1],
  [0,0,1,1,1],
  [0,0,1,1,1],
  [0,0,0,1,1],
  [0,0,0,1,1],
  [0,0,0,0,1],
];

const ARROW_DEAD: Sprite = [
  [0,0,0,0,1],
  [0,0,1,0,1],
  [0,1,0,1,0],
  [1,0,1,0,1],
  [0,1,0,1,1],
  [1,0,1,0,1],
  [0,1,0,1,0],
  [1,0,1,0,1],
  [0,1,0,1,1],
  [1,0,1,0,1],
  [0,1,0,1,0],
  [1,0,0,1,1],
  [0,1,0,0,1],
  [0,0,1,0,1],
];

export const RHYTHM_SKINS: Record<RhythmSkinId, RhythmSkinFrames> = {
  bar: { idle: BAR_IDLE, hit: BAR_HIT, dead: BAR_DEAD },
  dot: { idle: DOT_IDLE, hit: DOT_HIT, dead: DOT_DEAD },
  arrow: { idle: ARROW_IDLE, hit: ARROW_HIT, dead: ARROW_DEAD },
};

export const RHYTHM_SKIN_IDS: RhythmSkinId[] = ['bar', 'dot', 'arrow'];
