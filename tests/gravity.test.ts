import { describe, it, expect } from 'vitest';
import {
  initState,
  tick,
  type GravityState,
} from '../src/games/gravity/engine';
import {
  PLAYER_X,
  COIN_VALUE,
  NEAR_MISS_VALUE,
} from '../src/games/gravity/constants';
import type { RawInput } from '../src/shared/types';

const NO_INPUT: RawInput = { primary: false, primaryEdge: false };
const HOLD: RawInput = { primary: true, primaryEdge: false };
const TAP: RawInput = { primary: true, primaryEdge: true };

function running(overrides?: Partial<GravityState>): GravityState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'grounded';
  return { ...s, ...overrides };
}

describe('gravity: initState', () => {
  it('starts idle, glued to the floor, gravity pointing down', () => {
    const s = initState(600, 150);
    expect(s.phase).toBe('idle');
    expect(s.gravityDir).toBe(1);
    expect(s.airborne).toBe(false);
    expect(s.playerY).toBeGreaterThan(s.ceilingY);
    expect(s.playerY).toBeLessThan(s.floorY);
  });

  it('preserves hi score', () => {
    const s = initState(600, 150, 99);
    expect(s.hiScore).toBe(99);
  });
});

describe('gravity: idle phase', () => {
  it('does nothing without input', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, NO_INPUT);
    expect(next.phase).toBe('idle');
  });

  it('first tap starts the run and inverts gravity', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.gravityDir).toBe(-1);
    expect(next.airborne).toBe(true);
  });
});

describe('gravity: flip mechanic', () => {
  it('reverses gravity sign on each edge tap', () => {
    let s = running();
    expect(s.gravityDir).toBe(1);
    s = tick(s, 16, TAP);
    expect(s.gravityDir).toBe(-1);
    s = tick(s, 16, TAP);
    expect(s.gravityDir).toBe(1);
  });

  it('does not flip on a held button (must release between flips)', () => {
    let s = running();
    s = tick(s, 16, TAP);
    const flippedTo = s.gravityDir;
    s = tick(s, 16, HOLD);
    s = tick(s, 16, HOLD);
    expect(s.gravityDir).toBe(flippedTo);
  });

  it('a flipped player traverses to the opposite surface', () => {
    let s = running();
    s = tick(s, 16, TAP);
    for (let i = 0; i < 200; i++) {
      s = tick(s, 16, NO_INPUT);
      if (!s.airborne) break;
    }
    expect(s.airborne).toBe(false);
    expect(s.playerY).toBeLessThan(s.floorY); // landed on the ceiling
    expect(s.playerY).toBeCloseTo(s.ceilingY + 8, -1);
  });
});

describe('gravity: scoring', () => {
  it('increases score with distance', () => {
    let s = running();
    s.distance = 5_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.score).toBeGreaterThan(0);
  });

  it('updates hi score when current score exceeds it', () => {
    let s = running({ hiScore: 0 });
    s.distance = 10_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.hiScore).toBe(s.score);
    expect(s.hiScore).toBeGreaterThan(0);
  });
});

describe('gravity: collision', () => {
  it('kills the player on contact with a spike', () => {
    let s = running();
    s.spikes = [
      {
        id: 1,
        kind: 'tall',
        anchor: 'floor',
        x: PLAYER_X - 4,
        y: s.playerY - 4,
        w: 14,
        h: 24,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.playerState).toBe('dead');
  });

  it('survives when clear of spikes', () => {
    let s = running();
    s.spikes = [
      {
        id: 1,
        kind: 'small',
        anchor: 'floor',
        x: 400,
        y: s.floorY - 12,
        w: 10,
        h: 12,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
  });
});

describe('gravity: coin pickup', () => {
  it('awards score and increments combo', () => {
    let s = running();
    s.coins = [{ id: 1, x: PLAYER_X, y: s.playerY, collected: false }];
    s = tick(s, 16, NO_INPUT);
    expect(s.coinsCollected).toBe(1);
    expect(s.coins.length).toBe(0);
    expect(s.score).toBeGreaterThanOrEqual(COIN_VALUE);
    expect(s.combo).toBe(1);
  });

  it('boosts the multiplier after enough combo', () => {
    let s = running();
    s.coins = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      x: PLAYER_X,
      y: s.playerY,
      collected: false,
    }));
    s = tick(s, 16, NO_INPUT);
    expect(s.coinsCollected).toBe(4);
    expect(s.comboMultiplier).toBeGreaterThan(1);
  });
});

describe('gravity: near-miss', () => {
  it('awards bonus when a spike just passes the player', () => {
    let s = running();
    s.spikes = [
      {
        id: 1,
        kind: 'small',
        anchor: 'ceiling',
        x: PLAYER_X - 30,
        y: s.playerY - 18,
        w: 10,
        h: 10,
        passed: false,
      },
    ];
    const start = s.score;
    s = tick(s, 16, NO_INPUT);
    expect(s.nearMissCount).toBeGreaterThanOrEqual(1);
    expect(s.score).toBeGreaterThanOrEqual(start + NEAR_MISS_VALUE);
  });
});

describe('gravity: shield power-up', () => {
  it('absorbs one spike hit', () => {
    let s = running({ activePowerUp: { kind: 'shield', remaining: 4500 } });
    s.spikes = [
      {
        id: 1,
        kind: 'tall',
        anchor: 'floor',
        x: PLAYER_X - 4,
        y: s.playerY - 4,
        w: 14,
        h: 24,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.activePowerUp).toBeNull();
  });
});

describe('gravity: shrink power-up', () => {
  it('lets the player squeak past a tight spike', () => {
    function setup(withShrink: boolean): GravityState {
      const s = running();
      if (withShrink) {
        s.activePowerUp = { kind: 'shrink', remaining: 4500 };
      }
      s.spikes = [
        {
          id: 1,
          kind: 'small',
          anchor: 'floor',
          x: PLAYER_X - 8,
          y: s.playerY + 3,
          w: 14,
          h: 14,
          passed: false,
        },
      ];
      return s;
    }
    const without = tick(setup(false), 16, NO_INPUT);
    const withShrink = tick(setup(true), 16, NO_INPUT);
    expect(without.phase).toBe('dead');
    expect(withShrink.phase).toBe('running');
  });
});

describe('gravity: slow-mo power-up', () => {
  it('reduces world scroll distance', () => {
    const baseline = running();
    const slow = running({ activePowerUp: { kind: 'slowmo', remaining: 4500 } });
    const a = tick(baseline, 16, NO_INPUT);
    const b = tick(slow, 16, NO_INPUT);
    expect(b.distance).toBeLessThan(a.distance);
  });
});

describe('gravity: restart', () => {
  it('restarts from dead state on tap', () => {
    let s = running({ phase: 'dead', playerState: 'dead', score: 50, hiScore: 50 });
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.score).toBe(0);
    expect(next.hiScore).toBe(50);
  });

  it('does not restart on a held button', () => {
    let s = running({ phase: 'dead', playerState: 'dead' });
    const next = tick(s, 16, HOLD);
    expect(next.phase).toBe('dead');
  });
});

describe('gravity: spawning', () => {
  it('spawns spikes as distance accumulates', () => {
    let s = running({ nextObstacleDistance: 1 });
    s = tick(s, 16, NO_INPUT);
    expect(s.spikes.length).toBeGreaterThan(0);
  });

  it('removes spikes that scroll off screen', () => {
    let s = running();
    s.spikes = [
      {
        id: 1,
        kind: 'small',
        anchor: 'floor',
        x: -100,
        y: s.floorY - 12,
        w: 10,
        h: 12,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.spikes.length).toBe(0);
  });
});

describe('gravity: achievements', () => {
  it('unlocks gravity_century at 100', () => {
    let s = running();
    s.distance = 9_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('gravity_century');
    expect(s.newAchievements).toContain('gravity_century');
  });

  it('unlocks gravity_collector after 10 coins', () => {
    let s = running({ coinsCollected: 9 });
    s.coins = [{ id: 1, x: PLAYER_X, y: s.playerY, collected: false }];
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('gravity_collector');
  });

  it('does not re-emit an unlocked achievement', () => {
    let s = running({ achievements: ['gravity_century'] });
    s.distance = 9_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.newAchievements).not.toContain('gravity_century');
  });
});

describe('gravity: tier ramp', () => {
  it('increases the tier when crossing the threshold', () => {
    let s = running();
    s.distance = 25_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.tier).toBeGreaterThanOrEqual(1);
    expect(s.tierFlashTimer).toBeGreaterThan(0);
  });
});

describe('gravity: death feedback', () => {
  it('triggers screen shake and death flash on collision', () => {
    let s = running();
    s.spikes = [
      {
        id: 1,
        kind: 'tall',
        anchor: 'floor',
        x: PLAYER_X - 4,
        y: s.playerY - 4,
        w: 14,
        h: 24,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.screenShake.remaining).toBeGreaterThan(0);
    expect(s.deathFlashTimer).toBeGreaterThan(0);
  });
});
