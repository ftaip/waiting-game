import {
  BASE_SPEED,
  SPEED_ACCELERATION,
  MAX_SPEED,
  CEILING_Y_RATIO,
  FLOOR_Y_RATIO,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GRAVITY,
  MAX_TRAVERSAL_SPEED,
  FLIP_REVERSAL_BOOST,
  OBSTACLE_MIN_GAP,
  OBSTACLE_MAX_GAP,
  FIRST_OBSTACLE_DELAY,
  PATTERN_CHANCE,
  PATTERN_UNLOCK_SCORE,
  SCORE_PER_DISTANCE,
  MILESTONE_SCORE,
  MILESTONE_FLASH_DURATION,
  COIN_VALUE,
  NEAR_MISS_VALUE,
  COMBO_TIMEOUT,
  COMBO_MAX,
  NEAR_MISS_DISTANCE,
  TIER_INTERVAL,
  TIER_SPEED_BOOST,
  TIER_FLASH_DURATION,
  COIN_SPAWN_CHANCE,
  COIN_TRAIL_LENGTH,
  POWERUP_SPAWN_CHANCE,
  POWERUP_DURATION,
  SHRINK_HITBOX_RATIO,
  SLOWMO_FACTOR,
  STAR_COUNT,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_MAGNITUDE,
  DEATH_FLASH_DURATION,
} from './constants';
import {
  SPIKE_SMALL,
  SPIKE_TALL,
  SPIKE_CLUSTER,
} from './sprites';
import { spriteSize } from '../../shared/pixel';
import {
  decayShake,
  randomBetween,
  clamp,
} from '../../shared/feedback';
import type {
  Phase,
  ScreenShake,
  MilestoneFlash,
  ActivePowerUp,
  RawInput,
} from '../../shared/types';

// ── Types ────────────────────────────────────────────────────

/** +1 = gravity pulls toward floor (down). -1 = pulls toward ceiling (up). */
export type GravityDir = 1 | -1;

export type GravityPlayerState = 'idle' | 'grounded' | 'flipping' | 'dead';

export type GravitySpikeKind = 'small' | 'tall' | 'cluster';

export type GravityAnchor = 'floor' | 'ceiling';

export type GravityPowerUpKind = 'shield' | 'shrink' | 'slowmo';

export type GravityAchievementId =
  | 'gravity_century'
  | 'gravity_half_grand'
  | 'gravity_survivor'
  | 'gravity_collector'
  | 'gravity_dodger';

export const GRAVITY_ACHIEVEMENT_IDS: readonly GravityAchievementId[] = [
  'gravity_century',
  'gravity_half_grand',
  'gravity_survivor',
  'gravity_collector',
  'gravity_dodger',
];

export interface GravitySpike {
  id: number;
  kind: GravitySpikeKind;
  anchor: GravityAnchor;
  x: number;
  y: number;
  w: number;
  h: number;
  passed: boolean;
}

export interface GravityCoin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface GravityPowerUpPickup {
  id: number;
  kind: GravityPowerUpKind;
  x: number;
  y: number;
  collected: boolean;
}

export interface GravityStar {
  x: number;
  y: number;
  size: 'tiny' | 'small';
  drift: number;
}

export interface GravityState {
  phase: Phase;
  playerState: GravityPlayerState;
  /** y of the player's centre. */
  playerY: number;
  playerVelocity: number;
  /** Current gravity direction. */
  gravityDir: GravityDir;
  ceilingY: number;
  floorY: number;
  speed: number;
  distance: number;
  score: number;
  bonusScore: number;
  hiScore: number;
  spikes: GravitySpike[];
  coins: GravityCoin[];
  powerUps: GravityPowerUpPickup[];
  stars: GravityStar[];
  nextObstacleDistance: number;
  /** True while not glued to either surface. */
  airborne: boolean;
  /** Time since the most recent flip (ms). Used by render for the flip pose. */
  flipAnimTimer: number;
  width: number;
  height: number;

  // Combo / near-miss
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  nearMissCount: number;

  // Pickups & power-ups
  coinsCollected: number;
  activePowerUp: ActivePowerUp<GravityPowerUpKind> | null;

  // Tier & feedback
  tier: number;
  tierFlashTimer: number;
  milestoneFlash: MilestoneFlash | null;
  screenShake: ScreenShake;
  deathFlashTimer: number;

  // Achievements
  achievements: GravityAchievementId[];
  newAchievements: GravityAchievementId[];

  nextEntityId: number;
}

// ── Helpers ──────────────────────────────────────────────────

function spikeSize(kind: GravitySpikeKind): { w: number; h: number } {
  switch (kind) {
    case 'small':
      return spriteSize(SPIKE_SMALL);
    case 'tall':
      return spriteSize(SPIKE_TALL);
    case 'cluster':
      return spriteSize(SPIKE_CLUSTER);
  }
}

function makeStar(width: number, height: number, anywhere = false): GravityStar {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(0, width / 2),
    y: randomBetween(height * 0.12, height * 0.88),
    size: Math.random() < 0.6 ? 'tiny' : 'small',
    drift: randomBetween(-0.01, 0.01),
  };
}

// ── Init ─────────────────────────────────────────────────────

export function initState(
  width: number,
  height: number,
  hiScore = 0,
  achievements: GravityAchievementId[] = [],
): GravityState {
  const ceilingY = Math.floor(height * CEILING_Y_RATIO);
  const floorY = Math.floor(height * FLOOR_Y_RATIO);
  const playerY = floorY - PLAYER_HEIGHT / 2;

  const stars: GravityStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar(width, height, true));

  return {
    phase: 'idle',
    playerState: 'idle',
    playerY,
    playerVelocity: 0,
    gravityDir: 1,
    ceilingY,
    floorY,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    bonusScore: 0,
    hiScore,
    spikes: [],
    coins: [],
    powerUps: [],
    stars,
    nextObstacleDistance: FIRST_OBSTACLE_DELAY,
    airborne: false,
    flipAnimTimer: 0,
    width,
    height,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    nearMissCount: 0,
    coinsCollected: 0,
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
  state: GravityState,
  dt: number,
  input: RawInput,
): GravityState {
  const startTrigger = input.primaryEdge ?? input.primary;

  if (state.phase === 'idle') {
    if (startTrigger) {
      // First tap also triggers the first flip — gives the player feedback.
      return {
        ...state,
        phase: 'running',
        playerState: 'flipping',
        gravityDir: -1,
        airborne: true,
        playerVelocity: -FLIP_REVERSAL_BOOST,
        flipAnimTimer: 250,
      };
    }
    return state;
  }

  if (state.phase === 'dead') {
    const next = { ...state };
    next.screenShake = decayShake(state.screenShake, dt);
    next.deathFlashTimer = Math.max(0, state.deathFlashTimer - dt);
    next.newAchievements = [];
    if (startTrigger) {
      const restarted = initState(state.width, state.height, state.hiScore, state.achievements);
      return {
        ...restarted,
        phase: 'running',
        playerState: 'flipping',
        gravityDir: -1,
        airborne: true,
        playerVelocity: -FLIP_REVERSAL_BOOST,
        flipAnimTimer: 250,
      };
    }
    return next;
  }

  const next = { ...state };
  next.newAchievements = [];

  // ── World speed ────────────────────────────────────────────
  const slowMo = state.activePowerUp?.kind === 'slowmo';
  const tierBonus = state.tier * TIER_SPEED_BOOST;
  next.speed = Math.min(state.speed + SPEED_ACCELERATION * dt, MAX_SPEED);
  const effectiveSpeed = (next.speed + tierBonus) * (slowMo ? SLOWMO_FACTOR : 1);
  const moveDist = effectiveSpeed * dt;
  next.distance = state.distance + moveDist;

  // ── Score ──────────────────────────────────────────────────
  next.bonusScore = state.bonusScore;
  next.score = Math.floor(next.distance * SCORE_PER_DISTANCE) + next.bonusScore;

  // ── Combo timer ────────────────────────────────────────────
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

  // ── Gravity flip on edge tap ───────────────────────────────
  let gravityDir: GravityDir = state.gravityDir;
  let velocity = state.playerVelocity;
  let flipAnimTimer = Math.max(0, state.flipAnimTimer - dt);
  if (input.primaryEdge) {
    gravityDir = (gravityDir === 1 ? -1 : 1) as GravityDir;
    // If we were already moving in the new gravity direction (e.g. mid-fall),
    // give a small boost in the *new* direction so the flip feels snappy.
    velocity = velocity * 0.4 + gravityDir * FLIP_REVERSAL_BOOST;
    flipAnimTimer = 250;
  }
  next.gravityDir = gravityDir;
  next.flipAnimTimer = flipAnimTimer;

  // Apply gravity (signed by direction).
  velocity = clamp(
    velocity + GRAVITY * gravityDir * dt,
    -MAX_TRAVERSAL_SPEED,
    MAX_TRAVERSAL_SPEED,
  );
  next.playerVelocity = velocity;
  next.playerY = state.playerY + velocity * dt;

  // Snap to surfaces. Floor and ceiling are non-lethal walls; only spikes hurt.
  const floorRest = state.floorY - PLAYER_HEIGHT / 2;
  const ceilingRest = state.ceilingY + PLAYER_HEIGHT / 2;
  let grounded: 'floor' | 'ceiling' | null = null;
  if (next.playerY >= floorRest) {
    next.playerY = floorRest;
    next.playerVelocity = 0;
    grounded = 'floor';
  } else if (next.playerY <= ceilingRest) {
    next.playerY = ceilingRest;
    next.playerVelocity = 0;
    grounded = 'ceiling';
  }
  next.airborne = grounded === null;
  if (next.airborne) {
    next.playerState = 'flipping';
  } else {
    next.playerState = flipAnimTimer > 0 ? 'flipping' : 'grounded';
  }

  // ── Move world entities ────────────────────────────────────
  next.spikes = state.spikes
    .map((s) => ({ ...s, x: s.x - moveDist }))
    .filter((s) => s.x + s.w > -50);
  next.coins = state.coins
    .map((c) => ({ ...c, x: c.x - moveDist }))
    .filter((c) => c.x > -20 && !c.collected);
  next.powerUps = state.powerUps
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);

  // Background stars drift slowly with the world.
  next.stars = state.stars.map((s) => {
    let nx = s.x - moveDist * 0.25 + s.drift * dt;
    if (nx < -4) {
      const fresh = makeStar(state.width, state.height);
      fresh.x = state.width + randomBetween(0, 40);
      return fresh;
    }
    return { ...s, x: nx };
  });

  // ── Spawning ───────────────────────────────────────────────
  next.nextObstacleDistance = state.nextObstacleDistance - moveDist;
  if (next.nextObstacleDistance <= 0) {
    let idCounter = next.nextEntityId;
    const spawn = spawnSlot(
      state.width,
      state.ceilingY,
      state.floorY,
      next.score,
      idCounter,
    );
    next.spikes = [...next.spikes, ...spawn.spikes];
    next.coins = [...next.coins, ...spawn.coins];
    next.powerUps = [...next.powerUps, ...spawn.powerUps];
    next.nextEntityId = spawn.idCounter;
    next.nextObstacleDistance = randomBetween(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
  }

  // ── Coin pickup ────────────────────────────────────────────
  const pickup = collectCoins(next.coins, next.playerY, next.comboMultiplier);
  next.coins = pickup.coins;
  if (pickup.collected > 0) {
    next.coinsCollected = state.coinsCollected + pickup.collected;
    next.bonusScore += pickup.score;
    next.score += pickup.score;
    next.combo = Math.min(COMBO_MAX, next.combo + pickup.collected);
    next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
    next.comboTimer = COMBO_TIMEOUT;
  }

  // ── Power-up pickup ────────────────────────────────────────
  for (const p of next.powerUps) {
    if (
      !p.collected &&
      circlesOverlap(p.x, p.y, 8, PLAYER_X, next.playerY, PLAYER_HEIGHT / 2)
    ) {
      p.collected = true;
      next.activePowerUp = { kind: p.kind, remaining: POWERUP_DURATION };
    }
  }
  next.powerUps = next.powerUps.filter((p) => !p.collected);

  // ── Collision + near-miss ──────────────────────────────────
  const hitboxRatio = state.activePowerUp?.kind === 'shrink' ? SHRINK_HITBOX_RATIO : 1;
  const halfH = (PLAYER_HEIGHT / 2) * hitboxRatio - 1;
  const halfW = (PLAYER_WIDTH / 2) * hitboxRatio - 1;
  const playerLeft = PLAYER_X - halfW;
  const playerRight = PLAYER_X + halfW;
  const playerTop = next.playerY - halfH;
  const playerBottom = next.playerY + halfH;

  let died = false;
  for (const o of next.spikes) {
    const oLeft = o.x + 2;
    const oRight = o.x + o.w - 2;
    const oTop = o.y + 2;
    const oBottom = o.y + o.h - 2;
    const colliding =
      playerRight > oLeft &&
      playerLeft < oRight &&
      playerBottom > oTop &&
      playerTop < oBottom;

    if (colliding) {
      if (state.activePowerUp?.kind === 'shield') {
        next.activePowerUp = null;
        o.passed = true;
        next.screenShake = { remaining: 120, magnitude: 2 };
      } else {
        died = true;
        break;
      }
    }

    if (!o.passed && oRight < playerLeft) {
      o.passed = true;
      const verticalGap = Math.min(
        Math.abs(playerBottom - oTop),
        Math.abs(playerTop - oBottom),
      );
      if (verticalGap <= NEAR_MISS_DISTANCE) {
        const award = NEAR_MISS_VALUE * next.comboMultiplier;
        next.bonusScore += award;
        next.score += award;
        next.combo = Math.min(COMBO_MAX, next.combo + 1);
        next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
        next.comboTimer = COMBO_TIMEOUT;
        next.nearMissCount = state.nearMissCount + 1;
      }
    }
  }

  if (died) {
    next.phase = 'dead';
    next.playerState = 'dead';
    next.combo = 0;
    next.comboMultiplier = 1;
    next.deathFlashTimer = DEATH_FLASH_DURATION;
    next.screenShake = { remaining: SCREEN_SHAKE_DURATION, magnitude: SCREEN_SHAKE_MAGNITUDE };
    if (next.score > next.hiScore) next.hiScore = next.score;
  } else if (next.score > next.hiScore) {
    next.hiScore = next.score;
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
  function unlock(id: GravityAchievementId) {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      next.newAchievements.push(id);
    }
  }
  if (next.score >= 100) unlock('gravity_century');
  if (next.score >= 500) unlock('gravity_half_grand');
  if (next.coinsCollected >= 10) unlock('gravity_collector');
  if (next.nearMissCount >= 5) unlock('gravity_dodger');
  if (next.distance / BASE_SPEED >= 60_000) unlock('gravity_survivor');

  return next;
}

// ── Helpers ──────────────────────────────────────────────────

function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy <= (ar + br) * (ar + br);
}

interface CoinPickupResult {
  coins: GravityCoin[];
  collected: number;
  score: number;
}

function collectCoins(
  coins: GravityCoin[],
  playerY: number,
  multiplier: number,
): CoinPickupResult {
  let collected = 0;
  let score = 0;
  const remaining: GravityCoin[] = [];
  for (const c of coins) {
    if (
      !c.collected &&
      circlesOverlap(c.x, c.y, 4, PLAYER_X, playerY, PLAYER_HEIGHT / 2)
    ) {
      collected++;
      score += COIN_VALUE * multiplier;
    } else {
      remaining.push(c);
    }
  }
  return { coins: remaining, collected, score };
}

// ── Spawning ─────────────────────────────────────────────────

interface SpawnResult {
  spikes: GravitySpike[];
  coins: GravityCoin[];
  powerUps: GravityPowerUpPickup[];
  idCounter: number;
}

function makeSpike(
  kind: GravitySpikeKind,
  anchor: GravityAnchor,
  x: number,
  ceilingY: number,
  floorY: number,
  id: number,
): GravitySpike {
  const size = spikeSize(kind);
  const y = anchor === 'floor' ? floorY - size.h : ceilingY;
  return { id, kind, anchor, x, y, w: size.w, h: size.h, passed: false };
}

function spawnSlot(
  width: number,
  ceilingY: number,
  floorY: number,
  score: number,
  idCounter: number,
): SpawnResult {
  const spikes: GravitySpike[] = [];
  const coins: GravityCoin[] = [];
  const powerUps: GravityPowerUpPickup[] = [];

  const usePattern = Math.random() < PATTERN_CHANCE && score > PATTERN_UNLOCK_SCORE;
  if (usePattern) {
    const result = spawnPattern(width, ceilingY, floorY, idCounter);
    spikes.push(...result.spikes);
    idCounter = result.idCounter;
  } else {
    const r = Math.random();
    let kind: GravitySpikeKind;
    if (r < 0.55) kind = 'small';
    else if (r < 0.85) kind = 'tall';
    else kind = 'cluster';
    const anchor: GravityAnchor = Math.random() < 0.5 ? 'floor' : 'ceiling';
    spikes.push(makeSpike(kind, anchor, width + 10, ceilingY, floorY, idCounter++));
  }

  // Coins float in the channel between the surfaces.
  if (Math.random() < COIN_SPAWN_CHANCE) {
    const baseY = randomBetween(ceilingY + 14, floorY - 14);
    for (let i = 0; i < COIN_TRAIL_LENGTH; i++) {
      coins.push({
        id: idCounter++,
        x: width + 50 + i * 14,
        y: baseY + Math.sin(i * 0.7) * 6,
        collected: false,
      });
    }
  }

  if (Math.random() < POWERUP_SPAWN_CHANCE) {
    const kinds: GravityPowerUpKind[] = ['shield', 'shrink', 'slowmo'];
    powerUps.push({
      id: idCounter++,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: width + randomBetween(80, 160),
      y: randomBetween(ceilingY + 16, floorY - 16),
      collected: false,
    });
  }

  return { spikes, coins, powerUps, idCounter };
}

function spawnPattern(
  width: number,
  ceilingY: number,
  floorY: number,
  idCounter: number,
): { spikes: GravitySpike[]; idCounter: number } {
  const patterns = ['stagger', 'pillar', 'tunnel', 'gauntlet'] as const;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const spikes: GravitySpike[] = [];

  if (pattern === 'stagger') {
    // Floor-ceiling-floor: forces two flips.
    const seq: GravityAnchor[] = ['floor', 'ceiling', 'floor'];
    seq.forEach((anchor, i) => {
      spikes.push(
        makeSpike('small', anchor, width + 10 + i * 56, ceilingY, floorY, idCounter++),
      );
    });
  } else if (pattern === 'pillar') {
    // Floor + ceiling spikes vertically aligned with a narrow middle gap.
    spikes.push(makeSpike('tall', 'floor', width + 10, ceilingY, floorY, idCounter++));
    spikes.push(makeSpike('tall', 'ceiling', width + 10, ceilingY, floorY, idCounter++));
  } else if (pattern === 'tunnel') {
    // Long ceiling cluster — must be on the floor to pass.
    spikes.push(
      makeSpike('cluster', 'ceiling', width + 10, ceilingY, floorY, idCounter++),
    );
  } else {
    // Gauntlet: 3 ceiling spikes — must be on floor; a single stray floor
    // spike at the end forces a flip.
    for (let i = 0; i < 3; i++) {
      spikes.push(
        makeSpike('small', 'ceiling', width + 10 + i * 28, ceilingY, floorY, idCounter++),
      );
    }
    spikes.push(
      makeSpike('small', 'floor', width + 10 + 3 * 28 + 30, ceilingY, floorY, idCounter++),
    );
  }

  return { spikes, idCounter };
}
