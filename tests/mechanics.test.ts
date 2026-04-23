import { describe, it, expect } from 'vitest';
import { initState, tick, type GameState, type GameInput } from '../src/engine';
import { PLAYER_X, PEARL_VALUE, NEAR_MISS_VALUE } from '../src/constants';

const NO_INPUT: GameInput = { pulse: false, pulseEdge: false };

function running(overrides?: Partial<GameState>): GameState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'drifting';
  return { ...s, ...overrides };
}

describe('pearl pickup', () => {
  it('awards score and increments combo', () => {
    let s = running();
    s.pearls = [{ id: 1, x: PLAYER_X, y: s.playerY, collected: false }];
    s = tick(s, 16, NO_INPUT);
    expect(s.pearlsCollected).toBe(1);
    expect(s.pearls.length).toBe(0);
    expect(s.score).toBeGreaterThanOrEqual(PEARL_VALUE);
    expect(s.combo).toBe(1);
  });

  it('boosts multiplier after enough combo', () => {
    let s = running();
    // Drop 4 pearls right on the player
    s.pearls = Array.from({ length: 4 }, (_, i) => ({
      id: i + 1,
      x: PLAYER_X,
      y: s.playerY,
      collected: false,
    }));
    s = tick(s, 16, NO_INPUT);
    expect(s.pearlsCollected).toBe(4);
    expect(s.comboMultiplier).toBeGreaterThan(1);
  });
});

describe('near-miss', () => {
  it('awards score when an obstacle just passes the player', () => {
    let s = running();
    // Place obstacle directly above the player so its bottom edge ends near
    // the player top — close vertical gap, no horizontal overlap.
    const obstacleY = s.playerY - 30;
    s.obstacles = [
      {
        id: 1,
        kind: 'stalactite_short',
        anchor: 'ceiling',
        // Already past the player's left edge so on this tick it qualifies
        x: PLAYER_X - 30,
        y: obstacleY,
        w: 14,
        h: 16,
        passed: false,
      },
    ];
    const startScore = s.score;
    s = tick(s, 16, NO_INPUT);
    // It should have registered as a near-miss
    expect(s.nearMissCount).toBeGreaterThanOrEqual(1);
    expect(s.score).toBeGreaterThanOrEqual(startScore + NEAR_MISS_VALUE);
    expect(s.combo).toBeGreaterThanOrEqual(1);
  });
});

describe('combo decay', () => {
  it('resets the combo after the timeout', () => {
    let s = running({ combo: 3, comboMultiplier: 2, comboTimer: 100 });
    s = tick(s, 200, NO_INPUT);
    expect(s.combo).toBe(0);
    expect(s.comboMultiplier).toBe(1);
  });
});

describe('shield power-up', () => {
  it('absorbs one obstacle hit and clears the shield', () => {
    let s = running({
      activePowerUp: { kind: 'shield', remaining: 4500 },
    });
    s.obstacles = [
      {
        id: 1,
        kind: 'coral_short',
        anchor: 'floor',
        x: PLAYER_X - 4,
        y: s.playerY - 4,
        w: 12,
        h: 24,
        passed: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.activePowerUp).toBeNull();
  });
});

describe('shrink power-up', () => {
  it('lets the player squeak past a tight obstacle', () => {
    // Compare collision with and without shrink, given an obstacle that
    // grazes the normal hitbox but not the shrunk one.
    function setup(withShrink: boolean): GameState {
      const s = running();
      if (withShrink) {
        s.activePowerUp = { kind: 'shrink', remaining: 4500 };
      }
      s.obstacles = [
        {
          id: 1,
          kind: 'coral_short',
          anchor: 'floor',
          x: PLAYER_X - 8,
          y: s.playerY + 6, // just below the player
          w: 14,
          h: 30,
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

describe('slow-mo power-up', () => {
  it('reduces world scroll distance per tick', () => {
    const baseline = running();
    const slow = running({
      activePowerUp: { kind: 'slowmo', remaining: 4500 },
    });
    const baselineNext = tick(baseline, 16, NO_INPUT);
    const slowNext = tick(slow, 16, NO_INPUT);
    expect(slowNext.distance).toBeLessThan(baselineNext.distance);
  });
});

describe('current force', () => {
  it('pushes the player upward when inside an upward current', () => {
    const a = running();
    const b = running();
    b.currents = [
      {
        id: 1,
        x: PLAYER_X - 50,
        y: b.playerY - 30,
        w: 200,
        h: 60,
        force: -0.001,
      },
    ];
    const aNext = tick(a, 16, NO_INPUT);
    const bNext = tick(b, 16, NO_INPUT);
    expect(bNext.playerVelocity).toBeLessThan(aNext.playerVelocity);
  });
});

describe('milestone flash', () => {
  it('triggers when crossing a milestone score', () => {
    let s = running();
    s.distance = 9999;
    s.score = 99;
    s = tick(s, 16, NO_INPUT);
    expect(s.score).toBeGreaterThanOrEqual(100);
    expect(s.milestoneFlash).not.toBeNull();
    expect(s.milestoneFlash?.score).toBe(100);
  });
});

describe('tier ramping', () => {
  it('increases the tier when crossing the threshold', () => {
    let s = running();
    s.distance = 25_000; // → score 250
    s = tick(s, 16, NO_INPUT);
    expect(s.tier).toBeGreaterThanOrEqual(1);
    expect(s.tierFlashTimer).toBeGreaterThan(0);
  });
});

describe('death feedback', () => {
  it('triggers screen shake and death flash on collision', () => {
    let s = running();
    s.obstacles = [
      {
        id: 1,
        kind: 'coral_short',
        anchor: 'floor',
        x: PLAYER_X - 4,
        y: s.playerY - 4,
        w: 12,
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

describe('achievements', () => {
  it('unlocks "century" at score 100', () => {
    let s = running();
    s.distance = 10_500;
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('century');
    expect(s.newAchievements).toContain('century');
  });

  it('unlocks "pearl_diver" after 10 pearls', () => {
    let s = running({ pearlsCollected: 9 });
    s.pearls = [{ id: 1, x: PLAYER_X, y: s.playerY, collected: false }];
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('pearl_diver');
  });

  it('does not re-emit an already unlocked achievement', () => {
    let s = running({ achievements: ['century'] });
    s.distance = 10_500;
    s = tick(s, 16, NO_INPUT);
    expect(s.newAchievements).not.toContain('century');
  });
});

describe('power-up pickup', () => {
  it('activates the power-up when the player collides with it', () => {
    let s = running();
    s.powerUps = [
      {
        id: 1,
        kind: 'shield',
        x: PLAYER_X,
        y: s.playerY,
        collected: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.activePowerUp?.kind).toBe('shield');
    expect(s.powerUps.length).toBe(0);
  });
});
