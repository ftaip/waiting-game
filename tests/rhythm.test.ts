import { describe, it, expect } from 'vitest';
import {
  initState,
  tick,
  type RhythmState,
} from '../src/games/rhythm/engine';
import {
  PLAYER_X,
  TAP_NOTE_VALUE,
  PERFECT_BONUS,
  HOLD_NOTE_VALUE,
  LIVES_START,
  HIT_WINDOW,
  PERFECT_WINDOW,
} from '../src/games/rhythm/constants';
import type { RawInput } from '../src/shared/types';

const NO_INPUT: RawInput = { primary: false, primaryEdge: false };
const HOLD: RawInput = { primary: true, primaryEdge: false };
const TAP: RawInput = { primary: true, primaryEdge: true };

function running(overrides?: Partial<RhythmState>): RhythmState {
  const s = initState(600, 150);
  s.phase = 'running';
  s.playerState = 'tracking';
  return { ...s, ...overrides };
}

describe('rhythm: initState', () => {
  it('starts idle with full lives', () => {
    const s = initState(600, 150);
    expect(s.phase).toBe('idle');
    expect(s.lives).toBe(LIVES_START);
    expect(s.notes.length).toBe(0);
  });

  it('preserves hi score', () => {
    const s = initState(600, 150, 99);
    expect(s.hiScore).toBe(99);
  });
});

describe('rhythm: idle phase', () => {
  it('does nothing without input', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, NO_INPUT);
    expect(next.phase).toBe('idle');
  });

  it('first press starts the run', () => {
    const s = initState(600, 150);
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
  });
});

describe('rhythm: tap note hits', () => {
  it('a perfect tap awards full bonus and increments perfectHits', () => {
    // speed=0 so the note doesn't drift during the tick we're measuring.
    let s = running({ speed: 0 });
    s.notes = [{ id: 1, kind: 'tap', x: PLAYER_X - 3, w: 6, state: 'pending' }];
    s = tick(s, 16, TAP);
    expect(s.notesHit).toBe(1);
    expect(s.perfectHits).toBe(1);
    expect(s.score).toBeGreaterThanOrEqual(TAP_NOTE_VALUE + PERFECT_BONUS);
    expect(s.combo).toBe(1);
  });

  it('a "good" tap awards the base value but no perfect bonus', () => {
    let s = running();
    // Centre offset puts us in HIT_WINDOW but outside PERFECT_WINDOW.
    const offset = HIT_WINDOW / 2 - 1;
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 3 + offset, w: 6, state: 'pending' },
    ];
    s = tick(s, 16, TAP);
    expect(s.notesHit).toBe(1);
    expect(s.perfectHits).toBe(0);
    expect(s.score).toBeGreaterThanOrEqual(TAP_NOTE_VALUE);
  });

  it('the hit window threshold is symmetric (perfect on the boundary)', () => {
    let s = running({ speed: 0 });
    const offset = PERFECT_WINDOW / 2;
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 3 + offset, w: 6, state: 'pending' },
    ];
    s = tick(s, 16, TAP);
    expect(s.perfectHits).toBe(1);
  });
});

describe('rhythm: missed tap notes', () => {
  it('a tap note that scrolls past unhit costs a life', () => {
    let s = running();
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 50, w: 6, state: 'pending' },
    ];
    const startLives = s.lives;
    s = tick(s, 16, NO_INPUT);
    expect(s.lives).toBe(startLives - 1);
    expect(s.combo).toBe(0);
  });

  it('three missed notes in a row ends the run', () => {
    let s = running();
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 60, w: 6, state: 'pending' },
      { id: 2, kind: 'tap', x: PLAYER_X - 70, w: 6, state: 'pending' },
      { id: 3, kind: 'tap', x: PLAYER_X - 80, w: 6, state: 'pending' },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.lives).toBe(0);
    expect(s.phase).toBe('dead');
  });
});

describe('rhythm: false tap', () => {
  it('tapping with no note in the hit window costs a life and breaks combo', () => {
    let s = running({ combo: 3, comboMultiplier: 2, comboTimer: 1000 });
    const startLives = s.lives;
    s = tick(s, 16, TAP);
    expect(s.lives).toBe(startLives - 1);
    expect(s.combo).toBe(0);
    expect(s.comboMultiplier).toBe(1);
  });

  it('tapping while inside a hold note window does NOT count as a false tap', () => {
    let s = running();
    s.notes = [
      { id: 1, kind: 'hold', x: PLAYER_X - 10, w: 30, state: 'pending' },
    ];
    const startLives = s.lives;
    // Edge tap during hold-window: not a tap-note, but the player is inside a
    // hold so we shouldn't penalise them.
    s = tick(s, 16, TAP);
    expect(s.lives).toBe(startLives);
  });
});

describe('rhythm: hold notes', () => {
  function withHoldAtCursor(overrides?: Partial<RhythmState>): RhythmState {
    const s = running(overrides);
    s.notes = [
      {
        id: 1,
        kind: 'hold',
        x: PLAYER_X - 10,
        w: 30,
        state: 'pending',
        holdStarted: false,
        holdBroken: false,
      },
    ];
    return s;
  }

  it('starts the hold when the player holds while the note is in the zone', () => {
    let s = withHoldAtCursor();
    s = tick(s, 16, HOLD);
    const note = s.notes[0];
    expect(note.holdStarted).toBe(true);
    expect(note.state).toBe('holding');
  });

  it('completes the hold and awards points when held throughout', () => {
    let s = withHoldAtCursor();
    // March it through the cursor with primary held.
    for (let i = 0; i < 200; i++) {
      s = tick(s, 16, HOLD);
      const stillThere = s.notes.find((n) => n.id === 1);
      if (!stillThere) break;
      if (stillThere.state === 'completed' || stillThere.state === 'missed') break;
    }
    expect(s.notesHit).toBeGreaterThanOrEqual(1);
    expect(s.score).toBeGreaterThanOrEqual(HOLD_NOTE_VALUE);
  });

  it('breaking the hold mid-way costs a life and counts as a miss', () => {
    let s = withHoldAtCursor();
    s = tick(s, 16, HOLD);
    expect(s.notes[0].holdStarted).toBe(true);
    // Release while still inside the hold.
    s = tick(s, 16, NO_INPUT);
    // Then march to the end without holding.
    for (let i = 0; i < 200; i++) {
      s = tick(s, 16, NO_INPUT);
      const stillThere = s.notes.find((n) => n.id === 1);
      if (!stillThere || stillThere.state === 'missed' || stillThere.state === 'completed') break;
    }
    expect(s.lives).toBe(LIVES_START - 1);
    expect(s.notesHit).toBe(0);
  });

  it('never starting the hold counts as a miss', () => {
    let s = withHoldAtCursor();
    for (let i = 0; i < 200; i++) {
      s = tick(s, 16, NO_INPUT);
      const stillThere = s.notes.find((n) => n.id === 1);
      if (!stillThere || stillThere.state === 'missed' || stillThere.state === 'completed') break;
    }
    expect(s.lives).toBe(LIVES_START - 1);
    expect(s.notesHit).toBe(0);
  });
});

describe('rhythm: shield power-up', () => {
  it('absorbs the first life loss in a tick', () => {
    let s = running({ activePowerUp: { kind: 'shield', remaining: 4500 } });
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 50, w: 6, state: 'pending' },
    ];
    const startLives = s.lives;
    s = tick(s, 16, NO_INPUT);
    expect(s.lives).toBe(startLives);
    expect(s.activePowerUp).toBeNull();
  });
});

describe('rhythm: slow-mo power-up', () => {
  it('reduces world scroll distance', () => {
    const baseline = running();
    const slow = running({ activePowerUp: { kind: 'slowmo', remaining: 4500 } });
    const a = tick(baseline, 16, NO_INPUT);
    const b = tick(slow, 16, NO_INPUT);
    expect(b.distance).toBeLessThan(a.distance);
  });
});

describe('rhythm: double power-up', () => {
  it('doubles the points awarded for a tap hit', () => {
    function setup(withDouble: boolean): RhythmState {
      const s = running();
      if (withDouble) {
        s.activePowerUp = { kind: 'double', remaining: 4500 };
      }
      s.notes = [{ id: 1, kind: 'tap', x: PLAYER_X - 3, w: 6, state: 'pending' }];
      return s;
    }
    const single = tick(setup(false), 16, TAP).score;
    const doubled = tick(setup(true), 16, TAP).score;
    expect(doubled).toBeGreaterThanOrEqual(single * 2);
  });
});

describe('rhythm: restart', () => {
  it('restarts from dead state on tap', () => {
    let s = running({ phase: 'dead', playerState: 'dead', lives: 0, score: 50, hiScore: 50 });
    const next = tick(s, 16, TAP);
    expect(next.phase).toBe('running');
    expect(next.lives).toBe(LIVES_START);
    expect(next.score).toBe(0);
    expect(next.hiScore).toBe(50);
  });

  it('does not restart on a held button', () => {
    const s = running({ phase: 'dead', playerState: 'dead', lives: 0 });
    const next = tick(s, 16, HOLD);
    expect(next.phase).toBe('dead');
  });
});

describe('rhythm: spawning', () => {
  it('spawns a note as distance accumulates', () => {
    let s = running({ nextSpawnDistance: 1 });
    s = tick(s, 16, NO_INPUT);
    expect(s.notes.length).toBeGreaterThan(0);
  });

  it('drops notes that scroll far off-screen left', () => {
    let s = running();
    s.notes = [
      { id: 1, kind: 'tap', x: -200, w: 6, state: 'missed' },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.notes.length).toBe(0);
  });
});

describe('rhythm: scoring + speed', () => {
  it('increases score with distance', () => {
    let s = running();
    s.distance = 30_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.score).toBeGreaterThan(0);
  });

  it('updates hi score when current score exceeds it', () => {
    let s = running({ hiScore: 0 });
    s.distance = 50_000;
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

describe('rhythm: achievements', () => {
  it('unlocks rhythm_century at 100', () => {
    let s = running();
    s.distance = 25_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.achievements).toContain('rhythm_century');
    expect(s.newAchievements).toContain('rhythm_century');
  });

  it('unlocks rhythm_perfectionist after 5 perfect hits', () => {
    let s = running({ speed: 0, perfectHits: 4 });
    s.notes = [{ id: 1, kind: 'tap', x: PLAYER_X - 3, w: 6, state: 'pending' }];
    s = tick(s, 16, TAP);
    expect(s.achievements).toContain('rhythm_perfectionist');
  });

  it('unlocks rhythm_virtuoso after 25 notes hit', () => {
    let s = running({ speed: 0, notesHit: 24 });
    s.notes = [{ id: 1, kind: 'tap', x: PLAYER_X - 3, w: 6, state: 'pending' }];
    s = tick(s, 16, TAP);
    expect(s.achievements).toContain('rhythm_virtuoso');
  });

  it('does not re-emit an unlocked achievement', () => {
    let s = running({ achievements: ['rhythm_century'] });
    s.distance = 25_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.newAchievements).not.toContain('rhythm_century');
  });
});

describe('rhythm: tier ramp', () => {
  it('increases the tier when crossing the threshold', () => {
    let s = running();
    s.distance = 60_000;
    s = tick(s, 16, NO_INPUT);
    expect(s.tier).toBeGreaterThanOrEqual(1);
    expect(s.tierFlashTimer).toBeGreaterThan(0);
  });
});

describe('rhythm: death feedback', () => {
  it('triggers screen shake and death flash when lives reach zero', () => {
    let s = running({ lives: 1 });
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 50, w: 6, state: 'pending' },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('dead');
    expect(s.lives).toBe(0);
    expect(s.screenShake.remaining).toBeGreaterThan(0);
    expect(s.deathFlashTimer).toBeGreaterThan(0);
  });

  it('triggers a life-lost flash on a non-fatal miss', () => {
    let s = running();
    s.notes = [
      { id: 1, kind: 'tap', x: PLAYER_X - 50, w: 6, state: 'pending' },
    ];
    s = tick(s, 16, NO_INPUT);
    expect(s.phase).toBe('running');
    expect(s.lifeLostFlashTimer).toBeGreaterThan(0);
  });
});
