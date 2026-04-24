import {
  BASE_SPEED,
  SPEED_ACCELERATION,
  MAX_SPEED,
  PLAYER_X,
  NOTE_Y_RATIO,
  TAP_NOTE_WIDTH,
  HOLD_NOTE_MIN_WIDTH,
  HOLD_NOTE_MAX_WIDTH,
  HIT_WINDOW,
  PERFECT_WINDOW,
  MISS_GRACE,
  SPAWN_MIN_GAP,
  SPAWN_MAX_GAP,
  FIRST_SPAWN_DELAY,
  HOLD_NOTE_CHANCE,
  PATTERN_CHANCE,
  PATTERN_UNLOCK_SCORE,
  LIVES_START,
  SCORE_PER_DISTANCE,
  MILESTONE_SCORE,
  MILESTONE_FLASH_DURATION,
  TAP_NOTE_VALUE,
  PERFECT_BONUS,
  HOLD_NOTE_VALUE,
  COMBO_TIMEOUT,
  COMBO_MAX,
  TIER_INTERVAL,
  TIER_SPEED_BOOST,
  TIER_FLASH_DURATION,
  POWERUP_SPAWN_CHANCE,
  POWERUP_DURATION,
  SLOWMO_FACTOR,
  DOUBLE_FACTOR,
  STAR_COUNT,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_MAGNITUDE,
  DEATH_FLASH_DURATION,
  LIFE_LOST_FLASH_DURATION,
  LIFE_LOST_SHAKE_DURATION,
  LIFE_LOST_SHAKE_MAGNITUDE,
} from './constants';
import { decayShake, randomBetween } from '../../shared/feedback';
import type {
  Phase,
  ScreenShake,
  MilestoneFlash,
  ActivePowerUp,
  RawInput,
} from '../../shared/types';

// ── Types ────────────────────────────────────────────────────

export type RhythmPlayerState = 'idle' | 'tracking' | 'hit' | 'dead';

export type RhythmNoteKind = 'tap' | 'hold';

export type RhythmHitState =
  | 'pending'
  | 'perfect'
  | 'good'
  | 'missed'
  | 'holding'
  | 'completed';

export type RhythmPowerUpKind = 'shield' | 'slowmo' | 'double';

export type RhythmAchievementId =
  | 'rhythm_century'
  | 'rhythm_half_grand'
  | 'rhythm_survivor'
  | 'rhythm_virtuoso'
  | 'rhythm_perfectionist';

export const RHYTHM_ACHIEVEMENT_IDS: readonly RhythmAchievementId[] = [
  'rhythm_century',
  'rhythm_half_grand',
  'rhythm_survivor',
  'rhythm_virtuoso',
  'rhythm_perfectionist',
];

export interface RhythmNote {
  id: number;
  kind: RhythmNoteKind;
  /** Left edge of the note. */
  x: number;
  /** Width in px (tap notes are short, hold notes are long). */
  w: number;
  state: RhythmHitState;
  /** True for hold notes once the player has begun holding inside the window. */
  holdStarted?: boolean;
  /** True if the player released a hold note before its right edge cleared the zone. */
  holdBroken?: boolean;
}

export interface RhythmPowerUpPickup {
  id: number;
  kind: RhythmPowerUpKind;
  x: number;
  collected: boolean;
}

export interface RhythmStar {
  x: number;
  y: number;
  size: 'tiny' | 'small';
}

export interface RhythmState {
  phase: Phase;
  playerState: RhythmPlayerState;
  cursorY: number;

  speed: number;
  distance: number;
  score: number;
  bonusScore: number;
  hiScore: number;

  notes: RhythmNote[];
  powerUps: RhythmPowerUpPickup[];
  stars: RhythmStar[];
  nextSpawnDistance: number;

  width: number;
  height: number;

  /** True while the primary button is currently held (last seen). */
  holding: boolean;

  /** Lives remaining. Starts at LIVES_START; reaching 0 ends the run. */
  lives: number;
  /** Decreasing timer (ms). > 0 = render the "hit success" pose. */
  hitFlashTimer: number;
  /** Decreasing timer (ms). > 0 = render the life-lost overlay. */
  lifeLostFlashTimer: number;

  // Combo & quality tracking
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  perfectHits: number;
  notesHit: number;
  activePowerUp: ActivePowerUp<RhythmPowerUpKind> | null;

  // Tier & feedback
  tier: number;
  tierFlashTimer: number;
  milestoneFlash: MilestoneFlash | null;
  screenShake: ScreenShake;
  deathFlashTimer: number;

  // Achievements
  achievements: RhythmAchievementId[];
  newAchievements: RhythmAchievementId[];

  nextEntityId: number;
}

// ── Helpers ──────────────────────────────────────────────────

function noteCentre(n: RhythmNote): number {
  return n.x + n.w / 2;
}

function makeStar(width: number, height: number, anywhere = false): RhythmStar {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(0, width / 2),
    y: randomBetween(6, height - 6),
    size: Math.random() < 0.65 ? 'tiny' : 'small',
  };
}

// ── Init ─────────────────────────────────────────────────────

export function initState(
  width: number,
  height: number,
  hiScore = 0,
  achievements: RhythmAchievementId[] = [],
): RhythmState {
  const cursorY = Math.floor(height * NOTE_Y_RATIO);

  const stars: RhythmStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar(width, height, true));

  return {
    phase: 'idle',
    playerState: 'idle',
    cursorY,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    bonusScore: 0,
    hiScore,
    notes: [],
    powerUps: [],
    stars,
    nextSpawnDistance: FIRST_SPAWN_DELAY,
    width,
    height,
    holding: false,
    lives: LIVES_START,
    hitFlashTimer: 0,
    lifeLostFlashTimer: 0,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    perfectHits: 0,
    notesHit: 0,
    activePowerUp: null,
    tier: 0,
    tierFlashTimer: 0,
    milestoneFlash: null,
    screenShake: { remaining: 0, magnitude: 0 },
    deathFlashTimer: 0,
    achievements,
    newAchievements: [],
    nextEntityId: 1,
  };
}

// ── Tick ─────────────────────────────────────────────────────

export function tick(
  state: RhythmState,
  dt: number,
  input: RawInput,
): RhythmState {
  const startTrigger = input.primaryEdge ?? input.primary;

  if (state.phase === 'idle') {
    if (startTrigger) {
      return {
        ...state,
        phase: 'running',
        playerState: 'tracking',
        holding: input.primary,
      };
    }
    return state;
  }

  if (state.phase === 'dead') {
    const next = { ...state };
    next.screenShake = decayShake(state.screenShake, dt);
    next.deathFlashTimer = Math.max(0, state.deathFlashTimer - dt);
    next.lifeLostFlashTimer = Math.max(0, state.lifeLostFlashTimer - dt);
    next.newAchievements = [];
    if (startTrigger) {
      const restarted = initState(state.width, state.height, state.hiScore, state.achievements);
      return {
        ...restarted,
        phase: 'running',
        playerState: 'tracking',
        holding: input.primary,
      };
    }
    return next;
  }

  const next = { ...state };
  next.newAchievements = [];

  // ── World speed (with slow-mo) ─────────────────────────────
  const slowMo = state.activePowerUp?.kind === 'slowmo';
  const tierBonus = state.tier * TIER_SPEED_BOOST;
  next.speed = Math.min(state.speed + SPEED_ACCELERATION * dt, MAX_SPEED);
  const effectiveSpeed = (next.speed + tierBonus) * (slowMo ? SLOWMO_FACTOR : 1);
  const moveDist = effectiveSpeed * dt;
  next.distance = state.distance + moveDist;

  // ── Score = distance + bonus ───────────────────────────────
  next.bonusScore = state.bonusScore;
  next.score = Math.floor(next.distance * SCORE_PER_DISTANCE) + next.bonusScore;

  // ── Combo decay ────────────────────────────────────────────
  if (state.combo > 0) {
    next.comboTimer = state.comboTimer - dt;
    if (next.comboTimer <= 0) {
      next.combo = 0;
      next.comboMultiplier = 1;
      next.comboTimer = 0;
    }
  }

  // ── Power-up timer ─────────────────────────────────────────
  if (state.activePowerUp) {
    const remaining = state.activePowerUp.remaining - dt;
    next.activePowerUp =
      remaining > 0 ? { ...state.activePowerUp, remaining } : null;
  }

  // ── Carry forward player-feedback timers ───────────────────
  next.hitFlashTimer = Math.max(0, state.hitFlashTimer - dt);
  next.lifeLostFlashTimer = Math.max(0, state.lifeLostFlashTimer - dt);

  // ── Move notes + power-ups left ────────────────────────────
  const movedNotes: RhythmNote[] = state.notes.map((n) => ({
    ...n,
    x: n.x - moveDist,
  }));
  let movedPowerUps = state.powerUps
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);

  // Background stars (parallax)
  next.stars = state.stars.map((s) => {
    let nx = s.x - moveDist * 0.2;
    if (nx < -4) {
      const fresh = makeStar(state.width, state.height);
      fresh.x = state.width + randomBetween(0, 40);
      return fresh;
    }
    return { ...s, x: nx };
  });

  // ── Spawning ───────────────────────────────────────────────
  next.nextSpawnDistance = state.nextSpawnDistance - moveDist;
  if (next.nextSpawnDistance <= 0) {
    let idCounter = next.nextEntityId;
    const spawn = spawnSlot(state.width, next.score, idCounter);
    movedNotes.push(...spawn.notes);
    movedPowerUps = [...movedPowerUps, ...spawn.powerUps];
    next.nextEntityId = spawn.idCounter;
    next.nextSpawnDistance = randomBetween(SPAWN_MIN_GAP, SPAWN_MAX_GAP);
  }

  // ── Hit / hold resolution ──────────────────────────────────
  // 1) Edge tap: try to consume the closest unresolved tap note in the hit window.
  let livesLost = 0;
  let bonusGained = 0;
  let comboBroke = false;
  let hitThisTick = false;

  if (input.primaryEdge) {
    const window = HIT_WINDOW / 2;
    let bestIdx = -1;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < movedNotes.length; i++) {
      const n = movedNotes[i];
      if (n.kind !== 'tap' || n.state !== 'pending') continue;
      const c = noteCentre(n);
      const d = Math.abs(c - PLAYER_X);
      if (d <= window && d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    if (bestIdx >= 0) {
      const n = movedNotes[bestIdx];
      const isPerfect = bestDist <= PERFECT_WINDOW / 2;
      n.state = isPerfect ? 'perfect' : 'good';
      const baseAward = TAP_NOTE_VALUE + (isPerfect ? PERFECT_BONUS : 0);
      bonusGained += baseAward * next.comboMultiplier;
      next.combo = Math.min(COMBO_MAX, next.combo + 1);
      next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
      next.comboTimer = COMBO_TIMEOUT;
      next.notesHit = state.notesHit + 1;
      if (isPerfect) next.perfectHits = state.perfectHits + 1;
      else next.perfectHits = state.perfectHits;
      hitThisTick = true;
    } else {
      // No eligible tap note, but the player still tapped — only penalise if
      // they're not currently inside a hold note.
      let insideHold = false;
      for (const n of movedNotes) {
        if (n.kind !== 'hold' || n.state === 'completed' || n.state === 'missed') continue;
        const left = n.x;
        const right = n.x + n.w;
        if (left <= PLAYER_X && right >= PLAYER_X) {
          insideHold = true;
          break;
        }
      }
      if (!insideHold) {
        livesLost += 1;
        comboBroke = true;
      }
    }
  } else {
    next.notesHit = state.notesHit;
    next.perfectHits = state.perfectHits;
  }

  // 2) Hold note progression: while a hold note's body is over the cursor,
  //    track whether the player is holding through it.
  for (const n of movedNotes) {
    if (n.kind !== 'hold') continue;
    if (n.state === 'completed' || n.state === 'missed') continue;
    const left = n.x;
    const right = n.x + n.w;

    // Has the note's leading edge entered the window yet?
    const inWindow = left <= PLAYER_X && right >= PLAYER_X;
    if (inWindow) {
      if (input.primary && !n.holdBroken) {
        n.holdStarted = true;
        n.state = 'holding';
      } else if (n.holdStarted && !input.primary) {
        n.holdBroken = true;
      }
    }

    // Resolve when the trailing edge passes the player.
    if (right < PLAYER_X - MISS_GRACE) {
      if (n.holdStarted && !n.holdBroken) {
        n.state = 'completed';
        bonusGained += HOLD_NOTE_VALUE * next.comboMultiplier;
        next.combo = Math.min(COMBO_MAX, next.combo + 1);
        next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
        next.comboTimer = COMBO_TIMEOUT;
        next.notesHit += 1;
        hitThisTick = true;
      } else {
        n.state = 'missed';
        livesLost += 1;
        comboBroke = true;
      }
    }
  }

  // 3) Tap notes that scrolled past the window unhandled = miss + life lost.
  for (const n of movedNotes) {
    if (n.kind !== 'tap' || n.state !== 'pending') continue;
    if (noteCentre(n) < PLAYER_X - HIT_WINDOW / 2 - MISS_GRACE) {
      n.state = 'missed';
      livesLost += 1;
      comboBroke = true;
    }
  }

  // ── Power-up pickup (auto-grab when near the cursor) ───────
  for (const p of movedPowerUps) {
    if (!p.collected && Math.abs(p.x - PLAYER_X) < 8) {
      p.collected = true;
      next.activePowerUp = { kind: p.kind, remaining: POWERUP_DURATION };
    }
  }
  movedPowerUps = movedPowerUps.filter((p) => !p.collected);

  // ── Apply bonus + handle losses ────────────────────────────
  const doubleActive = next.activePowerUp?.kind === 'double';
  const totalBonus = bonusGained * (doubleActive ? DOUBLE_FACTOR : 1);
  if (totalBonus > 0) {
    next.bonusScore += totalBonus;
    next.score += totalBonus;
  }

  if (comboBroke) {
    next.combo = 0;
    next.comboMultiplier = 1;
    next.comboTimer = 0;
  }

  // Shield absorbs the first life loss this tick.
  if (livesLost > 0 && next.activePowerUp?.kind === 'shield') {
    livesLost -= 1;
    next.activePowerUp = null;
    next.screenShake = { remaining: 120, magnitude: 2 };
  }

  next.lives = Math.max(0, state.lives - livesLost);
  if (livesLost > 0) {
    next.lifeLostFlashTimer = LIFE_LOST_FLASH_DURATION;
    next.screenShake = {
      remaining: LIFE_LOST_SHAKE_DURATION,
      magnitude: LIFE_LOST_SHAKE_MAGNITUDE,
    };
  }

  if (hitThisTick) {
    next.hitFlashTimer = 120;
  }

  // Drop notes that are far off-screen left.
  next.notes = movedNotes.filter((n) => n.x + n.w > -10);
  next.powerUps = movedPowerUps;
  next.holding = input.primary;

  // ── Death (lives exhausted) ────────────────────────────────
  let died = false;
  if (next.lives <= 0) {
    died = true;
    next.phase = 'dead';
    next.playerState = 'dead';
    next.combo = 0;
    next.comboMultiplier = 1;
    next.deathFlashTimer = DEATH_FLASH_DURATION;
    next.screenShake = { remaining: SCREEN_SHAKE_DURATION, magnitude: SCREEN_SHAKE_MAGNITUDE };
    if (next.score > next.hiScore) next.hiScore = next.score;
  } else {
    next.playerState = 'tracking';
    if (next.score > next.hiScore) next.hiScore = next.score;
  }

  // ── Tier ramp ──────────────────────────────────────────────
  const newTier = Math.floor(next.score / TIER_INTERVAL);
  if (newTier > state.tier) {
    next.tier = newTier;
    next.tierFlashTimer = TIER_FLASH_DURATION;
  } else {
    next.tier = state.tier;
    next.tierFlashTimer = Math.max(0, state.tierFlashTimer - dt);
  }

  // ── Milestone flash ────────────────────────────────────────
  const prevMilestone = Math.floor(state.score / MILESTONE_SCORE);
  const newMilestone = Math.floor(next.score / MILESTONE_SCORE);
  if (newMilestone > prevMilestone && newMilestone > 0) {
    next.milestoneFlash = {
      score: newMilestone * MILESTONE_SCORE,
      remaining: MILESTONE_FLASH_DURATION,
    };
  } else if (state.milestoneFlash) {
    const remaining = state.milestoneFlash.remaining - dt;
    next.milestoneFlash = remaining > 0 ? { ...state.milestoneFlash, remaining } : null;
  }

  if (!died) {
    if (next.screenShake.remaining === state.screenShake.remaining) {
      next.screenShake = decayShake(state.screenShake, dt);
    }
    next.deathFlashTimer = Math.max(0, state.deathFlashTimer - dt);
  }

  // ── Achievements ───────────────────────────────────────────
  next.achievements = [...state.achievements];
  function unlock(id: RhythmAchievementId) {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      next.newAchievements.push(id);
    }
  }
  if (next.score >= 100) unlock('rhythm_century');
  if (next.score >= 500) unlock('rhythm_half_grand');
  if (next.notesHit >= 25) unlock('rhythm_virtuoso');
  if (next.perfectHits >= 5) unlock('rhythm_perfectionist');
  if (next.distance / BASE_SPEED >= 60_000) unlock('rhythm_survivor');

  return next;
}

// ── Spawning ─────────────────────────────────────────────────

interface SpawnResult {
  notes: RhythmNote[];
  powerUps: RhythmPowerUpPickup[];
  idCounter: number;
}

function makeTap(x: number, id: number): RhythmNote {
  return {
    id,
    kind: 'tap',
    x,
    w: TAP_NOTE_WIDTH,
    state: 'pending',
  };
}

function makeHold(x: number, w: number, id: number): RhythmNote {
  return {
    id,
    kind: 'hold',
    x,
    w,
    state: 'pending',
    holdStarted: false,
    holdBroken: false,
  };
}

function spawnSlot(width: number, score: number, idCounter: number): SpawnResult {
  const notes: RhythmNote[] = [];
  const powerUps: RhythmPowerUpPickup[] = [];

  const usePattern = Math.random() < PATTERN_CHANCE && score > PATTERN_UNLOCK_SCORE;
  if (usePattern) {
    const result = spawnPattern(width, idCounter);
    notes.push(...result.notes);
    idCounter = result.idCounter;
  } else if (Math.random() < HOLD_NOTE_CHANCE) {
    const w = randomBetween(HOLD_NOTE_MIN_WIDTH, HOLD_NOTE_MAX_WIDTH);
    notes.push(makeHold(width + 10, w, idCounter++));
  } else {
    notes.push(makeTap(width + 10, idCounter++));
  }

  if (Math.random() < POWERUP_SPAWN_CHANCE) {
    const kinds: RhythmPowerUpKind[] = ['shield', 'slowmo', 'double'];
    powerUps.push({
      id: idCounter++,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: width + randomBetween(80, 160),
      collected: false,
    });
  }

  return { notes, powerUps, idCounter };
}

function spawnPattern(
  width: number,
  idCounter: number,
): { notes: RhythmNote[]; idCounter: number } {
  const patterns = ['burst', 'tap_hold', 'hold_long', 'staircase'] as const;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const notes: RhythmNote[] = [];

  if (pattern === 'burst') {
    // 3 tap notes in tight succession.
    for (let i = 0; i < 3; i++) {
      notes.push(makeTap(width + 10 + i * 28, idCounter++));
    }
  } else if (pattern === 'tap_hold') {
    notes.push(makeTap(width + 10, idCounter++));
    notes.push(makeHold(width + 60, 36, idCounter++));
  } else if (pattern === 'hold_long') {
    notes.push(makeHold(width + 10, HOLD_NOTE_MAX_WIDTH, idCounter++));
  } else {
    // Staircase: tap-tap-tap with widening gaps.
    notes.push(makeTap(width + 10, idCounter++));
    notes.push(makeTap(width + 36, idCounter++));
    notes.push(makeTap(width + 72, idCounter++));
  }

  return { notes, idCounter };
}
