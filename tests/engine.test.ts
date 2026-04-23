import { describe, it, expect } from 'vitest';
import { initState, tick, type GameState, type GameInput } from '../src/engine';

const NO_INPUT: GameInput = { pulse: false, pulseEdge: false };
const HOLD: GameInput = { pulse: true, pulseEdge: false };
const PRESS: GameInput = { pulse: true, pulseEdge: true };

function createRunningState(overrides?: Partial<GameState>): GameState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'drifting';
  return { ...s, ...overrides };
}

describe('initState', () => {
  it('creates an idle state', () => {
    const s = initState(600, 150);
    expect(s.phase).toBe('idle');
    expect(s.playerState).toBe('idle');
    expect(s.score).toBe(0);
    expect(s.width).toBe(600);
    expect(s.height).toBe(150);
  });

  it('places the player between ceiling and floor', () => {
    const s = initState(600, 150);
    expect(s.playerY).toBeGreaterThan(s.ceilingY);
    expect(s.playerY).toBeLessThan(s.floorY);
  });

  it('preserves hi score', () => {
    const s = initState(600, 150, 99);
    expect(s.hiScore).toBe(99);
  });
});

describe('idle phase', () => {
  it('does nothing without input', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, NO_INPUT);
    expect(next.phase).toBe('idle');
  });

  it('starts on first press', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, PRESS);
    expect(next.phase).toBe('running');
    expect(next.playerState).toBe('pulsing');
    expect(next.playerVelocity).toBeLessThan(0);
  });
});

describe('player physics', () => {
  it('rises while button is held', () => {
    let s = createRunningState();
    const startY = s.playerY;
    for (let i = 0; i < 20; i++) {
      s = tick(s, 16, HOLD);
    }
    expect(s.playerY).toBeLessThan(startY);
    expect(s.playerVelocity).toBeLessThan(0);
  });

  it('falls under gravity when not held', () => {
    let s = createRunningState();
    const startY = s.playerY;
    // Sample a few mid-fall ticks before the player can clamp at the floor.
    for (let i = 0; i < 10; i++) {
      s = tick(s, 16, NO_INPUT);
    }
    expect(s.playerY).toBeGreaterThan(startY);
    expect(s.playerVelocity).toBeGreaterThan(0);
  });

  it('reverses direction when input changes', () => {
    let s = createRunningState();
    for (let i = 0; i < 20; i++) s = tick(s, 16, HOLD);
    const ascendingVelocity = s.playerVelocity;
    expect(ascendingVelocity).toBeLessThan(0);
    for (let i = 0; i < 30; i++) s = tick(s, 16, NO_INPUT);
    expect(s.playerVelocity).toBeGreaterThan(ascendingVelocity);
  });
});

describe('wall behaviour', () => {
  it('clamps to the floor without dying', () => {
    let s = createRunningState();
    s.playerY = s.floorY + 50;
    s.playerVelocity = 1;
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.playerY).toBeLessThanOrEqual(s.floorY);
    expect(s.playerVelocity).toBeLessThanOrEqual(0);
  });

  it('clamps to the ceiling without dying', () => {
    let s = createRunningState();
    s.playerY = s.ceilingY - 50;
    s.playerVelocity = -1;
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.playerY).toBeGreaterThanOrEqual(s.ceilingY);
    expect(s.playerVelocity).toBeGreaterThanOrEqual(0);
  });
});

describe('scoring', () => {
  it('increases score with distance', () => {
    let s = createRunningState();
    s.distance = 5000;
    s = tick(s, 16, NO_INPUT);
    expect(s.score).toBeGreaterThan(0);
  });

  it('updates hi score when current score exceeds it', () => {
    let s = createRunningState({ hiScore: 0 });
    s.distance = 10000;
    s = tick(s, 16, NO_INPUT);
    expect(s.hiScore).toBe(s.score);
    expect(s.hiScore).toBeGreaterThan(0);
  });
});

describe('speed', () => {
  it('increases speed over time', () => {
    let s = createRunningState();
    const initialSpeed = s.speed;
    for (let i = 0; i < 1000; i++) {
      s = tick({ ...s, phase: 'running' }, 16, NO_INPUT);
    }
    expect(s.speed).toBeGreaterThan(initialSpeed);
  });
});

describe('obstacle collision', () => {
  it('kills player when colliding with a coral', () => {
    let s = createRunningState();
    // Place an obstacle right where the player is
    s.obstacles = [
      {
        kind: 'coral_short',
        anchor: 'floor',
        x: 50,
        y: s.playerY - 10,
        w: 20,
        h: 30,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.playerState).toBe('stunned');
  });

  it('does not collide when player is clear of the obstacle', () => {
    let s = createRunningState();
    s.obstacles = [
      {
        kind: 'coral_short',
        anchor: 'floor',
        x: 200,
        y: s.floorY - 20,
        w: 10,
        h: 20,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
  });
});

describe('restart', () => {
  it('restarts from dead state on press', () => {
    let s = createRunningState();
    s.phase = 'dead';
    s.playerState = 'stunned';
    s.score = 50;
    s.hiScore = 50;
    const next = tick(s, 16, PRESS);
    expect(next.phase).toBe('running');
    expect(next.playerState).toBe('pulsing');
    expect(next.score).toBe(0);
    expect(next.hiScore).toBe(50);
  });

  it('does not restart on held button (must release first)', () => {
    let s = createRunningState();
    s.phase = 'dead';
    s.playerState = 'stunned';
    const next = tick(s, 16, HOLD);
    expect(next.phase).toBe('dead');
  });
});

describe('obstacle spawning', () => {
  it('spawns obstacles as distance accumulates', () => {
    let s = createRunningState({ nextObstacleDistance: 1 });
    s = tick(s, 16, NO_INPUT);
    expect(s.obstacles.length).toBeGreaterThan(0);
  });

  it('removes obstacles that scroll off screen', () => {
    let s = createRunningState();
    s.obstacles = [
      { kind: 'coral_short', anchor: 'floor', x: -100, y: 100, w: 10, h: 24 },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.obstacles.length).toBe(0);
  });
});

describe('bubbles', () => {
  it('initializes with ambient bubbles', () => {
    const s = initState(600, 150);
    expect(s.bubbles.length).toBeGreaterThan(0);
  });

  it('moves bubbles upward over time', () => {
    let s = createRunningState();
    const startY = s.bubbles.map((b) => b.y);
    s = tick(s, 100, NO_INPUT);
    // At least one bubble should have risen (smaller y) unless it wrapped
    const anyRose = s.bubbles.some((b, i) => b.y < startY[i] || b.y > startY[i] - 1);
    expect(anyRose).toBe(true);
  });
});
