import { describe, it, expect } from 'vitest';
import {
  initState,
  tick,
  type RunnerState,
} from '../src/games/runner/engine';
import {
  PLAYER_X,
  COIN_VALUE,
  NEAR_MISS_VALUE,
  JUMP_IMPULSE,
} from '../src/games/runner/constants';
import type { RawInput } from '../src/shared/types';

const NO_INPUT: RawInput = { primary: false, primaryEdge: false };
const HOLD: RawInput = { primary: true, primaryEdge: false };
const TAP: RawInput = { primary: true, primaryEdge: true };

function running(overrides?: Partial<RunnerState>): RunnerState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'running';
  return { ...s, ...overrides };
}

describe('runner: initState', () => {
  it('starts in idle with the player on the ground', () => {
    const s = initState(600, 150);
    expect(s.phase).toBe('idle');
    expect(s.airborne).toBe(false);
    expect(s.playerY).toBeGreaterThan(0);
    expect(s.playerY).toBeLessThan(150);
  });

  it('preserves hi score', () => {
    const s = initState(600, 150, 123);
    expect(s.hiScore).toBe(123);
  });
});

describe('runner: idle phase', () => {
  it('does nothing without input', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, NO_INPUT);
    expect(next.phase).toBe('idle');
  });

  it('starts on first press and launches a jump', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.airborne).toBe(true);
    expect(next.playerVelocity).toBeLessThan(0);
  });
});

describe('runner: jump physics', () => {
  it('jumps on tap and lands again', () => {
    let s = running();
    s = tick(s, 16, TAP);
    expect(s.airborne).toBe(true);
    // Tick applies gravity after the impulse, so velocity should be slightly
    // less negative than the raw impulse but still strongly upward.
    expect(s.playerVelocity).toBeLessThan(0);
    expect(s.playerVelocity).toBeGreaterThan(JUMP_IMPULSE);

    for (let i = 0; i < 200; i++) {
      s = tick(s, 16, NO_INPUT);
      if (!s.airborne) break;
    }
    expect(s.airborne).toBe(false);
    expect(s.playerVelocity).toBe(0);
  });

  it('holding the button extends the jump (variable height)', () => {
    function peakY(input: RawInput, holdFrames: number): number {
      let s = running();
      s = tick(s, 16, TAP);
      let minY = s.playerY;
      for (let i = 0; i < 200; i++) {
        const useInput = i < holdFrames ? input : NO_INPUT;
        s = tick(s, 16, useInput);
        if (s.playerY < minY) minY = s.playerY;
        if (!s.airborne) break;
      }
      return minY;
    }
    const tappedPeak = peakY(NO_INPUT, 0);
    const heldPeak = peakY(HOLD, 60);
    expect(heldPeak).toBeLessThan(tappedPeak);
  });

  it('does not double jump while airborne', () => {
    let s = running();
    s = tick(s, 16, TAP);
    const v1 = s.playerVelocity;
    // Re-tap mid-air should not re-trigger impulse.
    s = tick(s, 16, TAP);
    expect(s.playerVelocity).toBeGreaterThan(v1);
  });
});

describe('runner: scoring', () => {
  it('increases score with distance', () => {
    let s = running();
    s.distance = 5000;
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

describe('runner: collision', () => {
  it('kills the player on contact with a cactus', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'cactus_med',
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

  it('survives when clear of obstacles', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'cactus_small',
        x: 400,
        y: s.groundY - 18,
        w: 10,
        h: 18,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
  });
});

describe('runner: coin pickup', () => {
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

describe('runner: near-miss', () => {
  it('awards bonus when a bird just passes the player', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'bird',
        // Already past the player so it qualifies on this tick.
        x: PLAYER_X - 30,
        y: s.playerY - 24,
        w: 18,
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

describe('runner: shield power-up', () => {
  it('absorbs one cactus hit', () => {
    let s = running({ activePowerUp: { kind: 'shield', remaining: 4500 } });
    s.obstacles = [
      {
        id: 1,
        kind: 'cactus_med',
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

describe('runner: slow-mo power-up', () => {
  it('reduces world scroll distance', () => {
    const baseline = running();
    const slow = running({ activePowerUp: { kind: 'slowmo', remaining: 4500 } });
    const a = tick(baseline, 16, NO_INPUT);
    const b = tick(slow, 16, NO_INPUT);
    expect(b.distance).toBeLessThan(a.distance);
  });
});

describe('runner: restart', () => {
  it('restarts from dead state on tap', () => {
    let s = running();
    s.phase = 'dead';
    s.playerState = 'dead';
    s.score = 50;
    s.hiScore = 50;
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.score).toBe(0);
    expect(next.hiScore).toBe(50);
  });

  it('does not restart on a held button (must release first)', () => {
    let s = running({ phase: 'dead', playerState: 'dead' });
    const next = tick(s, 16, HOLD);
    expect(next.phase).toBe('dead');
  });
});

describe('runner: spawning', () => {
  it('spawns obstacles as distance accumulates', () => {
    let s = running({ nextObstacleDistance: 1 });
    s = tick(s, 16, NO_INPUT);
    expect(s.obstacles.length).toBeGreaterThan(0);
  });

  it('removes obstacles that scroll off screen', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'cactus_small',
        x: -100,
        y: s.groundY - 18,
        w: 10,
        h: 18,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.obstacles.length).toBe(0);
  });
});

describe('runner: achievements', () => {
  it('unlocks runner_century at 100', () => {
    let s = running();
    s.distance = 9_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('runner_century');
    expect(s.newAchievements).toContain('runner_century');
  });

  it('unlocks runner_coin_hoarder after 10 coins', () => {
    let s = running({ coinsCollected: 9 });
    s.coins = [{ id: 1, x: PLAYER_X, y: s.playerY, collected: false }];
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('runner_coin_hoarder');
  });

  it('does not re-emit an unlocked achievement', () => {
    let s = running({ achievements: ['runner_century'] });
    s.distance = 9_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.newAchievements).not.toContain('runner_century');
  });
});

describe('runner: tier ramp', () => {
  it('increases the tier when crossing the threshold', () => {
    let s = running();
    s.distance = 25_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.tier).toBeGreaterThanOrEqual(1);
    expect(s.tierFlashTimer).toBeGreaterThan(0);
  });
});

describe('runner: death feedback', () => {
  it('triggers screen shake and death flash on collision', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'cactus_med',
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
