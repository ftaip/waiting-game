import { describe, it, expect } from 'vitest';
import {
  initState,
  tick,
  type InvadersState,
} from '../src/games/invaders/engine';
import {
  PLAYER_X,
  PLAYER_WIDTH,
  ALIEN_GRUNT_SCORE,
  ALIEN_TANK_SCORE,
  FIRE_INTERVAL,
  RAPID_FIRE_INTERVAL,
} from '../src/games/invaders/constants';
import type { RawInput } from '../src/shared/types';

const NO_INPUT: RawInput = { primary: false, primaryEdge: false };
const HOLD: RawInput = { primary: true, primaryEdge: false };
const TAP: RawInput = { primary: true, primaryEdge: true };

function running(overrides?: Partial<InvadersState>): InvadersState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'piloting';
  return { ...s, ...overrides };
}

describe('invaders: initState', () => {
  it('starts idle in the lower lane', () => {
    const s = initState(600, 150);
    expect(s.phase).toBe('idle');
    expect(s.playerLane).toBe(1);
    expect(s.bullets.length).toBe(0);
    expect(s.aliens.length).toBe(0);
  });

  it('preserves hi score', () => {
    const s = initState(600, 150, 99);
    expect(s.hiScore).toBe(99);
  });
});

describe('invaders: idle phase', () => {
  it('does nothing without input', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, NO_INPUT);
    expect(next.phase).toBe('idle');
  });

  it('first tap launches the run AND swaps lane', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.playerLane).toBe(0);
  });
});

describe('invaders: lane switching', () => {
  it('toggles the lane on each edge tap', () => {
    let s = running();
    expect(s.playerLane).toBe(1);
    s = tick(s, 16, TAP);
    expect(s.playerLane).toBe(0);
    s = tick(s, 16, TAP);
    expect(s.playerLane).toBe(1);
  });

  it('does not switch lane on a held button (must release between taps)', () => {
    let s = running();
    s = tick(s, 16, TAP);
    const after = s.playerLane;
    s = tick(s, 16, HOLD);
    s = tick(s, 16, HOLD);
    expect(s.playerLane).toBe(after);
  });
});

describe('invaders: auto-fire', () => {
  it('fires a bullet when the fire timer expires', () => {
    let s = running({ fireTimer: 5 });
    s = tick(s, 16, NO_INPUT);
    expect(s.bullets.length).toBe(1);
    // The fired bullet starts roughly at the cannon tip.
    expect(s.bullets[0].x).toBeGreaterThan(PLAYER_X);
  });

  it('does not fire while the timer is still positive', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s = tick(s, 16, NO_INPUT);
    expect(s.bullets.length).toBe(0);
  });

  it('rapid-fire shortens the next fire interval', () => {
    let s = running({
      fireTimer: 5,
      activePowerUp: { kind: 'rapid', remaining: 4500 },
    });
    s = tick(s, 16, NO_INPUT);
    expect(s.fireTimer).toBeLessThanOrEqual(RAPID_FIRE_INTERVAL);
    expect(s.fireTimer).toBeGreaterThan(0);
  });

  it('bullets travel rightward over time', () => {
    let s = running();
    s.bullets = [{ id: 1, x: 100, y: s.laneY[1] }];
    s.fireTimer = FIRE_INTERVAL;
    const startX = s.bullets[0].x;
    s = tick(s, 16, NO_INPUT);
    expect(s.bullets[0].x).toBeGreaterThan(startX);
  });
});

describe('invaders: bullet vs alien collision', () => {
  it('kills a grunt and awards score', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    const startScore = s.score;
    s.aliens = [
      { id: 1, kind: 'grunt', lane: 1, x: 110, hp: 1, flap: 0, escaped: false },
    ];
    s.bullets = [{ id: 2, x: 108, y: s.laneY[1] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBe(0);
    expect(s.bullets.length).toBe(0);
    expect(s.killsTotal).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(startScore + ALIEN_GRUNT_SCORE);
    expect(s.combo).toBe(1);
  });

  it('a tank takes two bullets to kill', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      { id: 1, kind: 'tank', lane: 1, x: 110, hp: 2, flap: 0, escaped: false },
    ];
    s.bullets = [{ id: 2, x: 108, y: s.laneY[1] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBe(1);
    expect(s.aliens[0].hp).toBe(1);

    s.bullets = [{ id: 3, x: 108, y: s.laneY[1] }];
    s.fireTimer = FIRE_INTERVAL;
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBe(0);
    expect(s.score).toBeGreaterThanOrEqual(ALIEN_TANK_SCORE);
  });

  it('a bullet in a different y row does not hit the alien', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      { id: 1, kind: 'grunt', lane: 0, x: 110, hp: 1, flap: 0, escaped: false },
    ];
    s.bullets = [{ id: 2, x: 108, y: s.laneY[1] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBe(1);
  });
});

describe('invaders: alien vs player collision', () => {
  it('kills the player when an alien reaches the same lane', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 1,
        x: PLAYER_X - 4,
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.playerState).toBe('dead');
  });

  it('survives an alien in the opposite lane', () => {
    let s = running({ fireTimer: FIRE_INTERVAL, playerLane: 0 });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 1,
        x: PLAYER_X - 4,
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
  });
});

describe('invaders: shield power-up', () => {
  it('absorbs one alien collision', () => {
    let s = running({
      fireTimer: FIRE_INTERVAL,
      activePowerUp: { kind: 'shield', remaining: 4500 },
    });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 1,
        x: PLAYER_X - 4,
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.activePowerUp).toBeNull();
  });
});

describe('invaders: alien escape', () => {
  it('breaks the combo when an alien passes the player', () => {
    let s = running({
      fireTimer: FIRE_INTERVAL,
      combo: 3,
      comboMultiplier: 2,
      comboTimer: 1000,
    });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 0, // opposite lane so it just walks past
        x: PLAYER_X - 50,
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.combo).toBe(0);
    expect(s.comboMultiplier).toBe(1);
  });
});

describe('invaders: close kill (near-miss equivalent)', () => {
  it('counts and awards bonus when the alien is killed close to the player', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 1,
        x: PLAYER_X + 10, // very close to the player
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s.bullets = [{ id: 2, x: PLAYER_X + 10, y: s.laneY[1] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.closeKills).toBe(1);
  });
});

describe('invaders: scoring + speed', () => {
  it('increases score with distance', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.distance = 10_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.score).toBeGreaterThan(0);
  });

  it('updates hi score when current score exceeds it', () => {
    let s = running({ fireTimer: FIRE_INTERVAL, hiScore: 0 });
    s.distance = 20_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.hiScore).toBe(s.score);
    expect(s.hiScore).toBeGreaterThan(0);
  });

  it('speed accelerates over time', () => {
    let s = running();
    const initial = s.speed;
    for (let i = 0; i < 1500; i++) {
      s = tick(s, 16, NO_INPUT);
    }
    expect(s.speed).toBeGreaterThan(initial);
  });
});

describe('invaders: slow-mo power-up', () => {
  it('reduces world scroll distance', () => {
    const baseline = running({ fireTimer: FIRE_INTERVAL });
    const slow = running({
      fireTimer: FIRE_INTERVAL,
      activePowerUp: { kind: 'slowmo', remaining: 4500 },
    });
    const a = tick(baseline, 16, NO_INPUT);
    const b = tick(slow, 16, NO_INPUT);
    expect(b.distance).toBeLessThan(a.distance);
  });
});

describe('invaders: restart', () => {
  it('restarts from dead state on tap', () => {
    let s = running({ phase: 'dead', playerState: 'dead', score: 50, hiScore: 50 });
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.score).toBe(0);
    expect(next.hiScore).toBe(50);
  });

  it('does not restart on a held button', () => {
    const s = running({ phase: 'dead', playerState: 'dead' });
    const next = tick(s, 16, HOLD);
    expect(next.phase).toBe('dead');
  });
});

describe('invaders: spawning', () => {
  it('spawns aliens as distance accumulates', () => {
    let s = running({ nextSpawnDistance: 1, fireTimer: FIRE_INTERVAL });
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBeGreaterThan(0);
  });

  it('removes aliens that escape past the screen edge', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      { id: 1, kind: 'grunt', lane: 0, x: -100, hp: 1, flap: 0, escaped: true },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.aliens.length).toBe(0);
  });

  it('removes bullets that fly off the right edge', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.bullets = [{ id: 1, x: s.width + 20, y: s.laneY[0] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.bullets.length).toBe(0);
  });
});

describe('invaders: achievements', () => {
  it('unlocks invaders_century at 100', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.distance = 13_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('invaders_century');
    expect(s.newAchievements).toContain('invaders_century');
  });

  it('unlocks invaders_sharpshooter after 10 kills', () => {
    let s = running({ fireTimer: FIRE_INTERVAL, killsTotal: 9 });
    s.aliens = [
      { id: 1, kind: 'grunt', lane: 1, x: 200, hp: 1, flap: 0, escaped: false },
    ];
    s.bullets = [{ id: 2, x: 198, y: s.laneY[1] }];
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('invaders_sharpshooter');
  });

  it('does not re-emit an unlocked achievement', () => {
    let s = running({ fireTimer: FIRE_INTERVAL, achievements: ['invaders_century'] });
    s.distance = 13_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.newAchievements).not.toContain('invaders_century');
  });
});

describe('invaders: tier ramp', () => {
  it('increases the tier when crossing the threshold', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.distance = 40_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.tier).toBeGreaterThanOrEqual(1);
    expect(s.tierFlashTimer).toBeGreaterThan(0);
  });
});

describe('invaders: death feedback', () => {
  it('triggers screen shake and death flash on collision', () => {
    let s = running({ fireTimer: FIRE_INTERVAL });
    s.aliens = [
      {
        id: 1,
        kind: 'grunt',
        lane: 1,
        x: PLAYER_X - 4,
        hp: 1,
        flap: 0,
        escaped: false,
      },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.screenShake.remaining).toBeGreaterThan(0);
    expect(s.deathFlashTimer).toBeGreaterThan(0);
  });
});

void PLAYER_WIDTH;
