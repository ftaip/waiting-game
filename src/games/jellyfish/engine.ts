import {
  GRAVITY,
  THRUST,
  MAX_FALL_SPEED,
  MAX_RISE_SPEED,
  VELOCITY_DAMPING,
  BASE_SPEED,
  SPEED_ACCELERATION,
  MAX_SPEED,
  CEILING_Y_RATIO,
  FLOOR_Y_RATIO,
  OBSTACLE_MIN_GAP,
  OBSTACLE_MAX_GAP,
  FIRST_OBSTACLE_DELAY,
  CEILING_OBSTACLE_UNLOCK_SCORE,
  CEILING_OBSTACLE_CHANCE,
  PATTERN_CHANCE,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  BUBBLE_COUNT,
  BUBBLE_RISE_SPEED,
  KELP_COUNT,
  ROCK_COUNT,
  KELP_PARALLAX,
  ROCK_PARALLAX,
  SCORE_PER_DISTANCE,
  MILESTONE_SCORE,
  MILESTONE_FLASH_DURATION,
  PEARL_VALUE,
  NEAR_MISS_VALUE,
  COMBO_TIMEOUT,
  COMBO_MAX,
  NEAR_MISS_DISTANCE,
  TIER_INTERVAL,
  TIER_SPEED_BOOST,
  TIER_FLASH_DURATION,
  CURRENT_SPAWN_CHANCE,
  CURRENT_FORCE,
  CURRENT_MIN_LENGTH,
  CURRENT_MAX_LENGTH,
  CURRENT_HEIGHT,
  PEARL_SPAWN_CHANCE,
  PEARL_TRAIL_LENGTH,
  POWERUP_SPAWN_CHANCE,
  POWERUP_DURATION,
  SHRINK_HITBOX_RATIO,
  SLOWMO_FACTOR,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_MAGNITUDE,
  DEATH_FLASH_DURATION,
} from './constants';
import {
  CORAL_SHORT,
  CORAL_TALL,
  CORAL_FAN,
  STALACTITE_SHORT,
  STALACTITE_TALL,
} from './sprites';
import { spriteSize } from '../../shared/pixel';
import { decayShake, randomBetween } from '../../shared/feedback';
import type {
  Phase,
  ScreenShake,
  MilestoneFlash,
  ActivePowerUp,
} from '../../shared/types';

// ── Types ────────────────────────────────────────────────────

export type PlayerState = 'idle' | 'drifting' | 'pulsing' | 'stunned';

export type ObstacleKind =
  | 'coral_short'
  | 'coral_tall'
  | 'coral_fan'
  | 'stalactite_short'
  | 'stalactite_tall';

export type ObstacleAnchor = 'floor' | 'ceiling';

export type PowerUpKind = 'shield' | 'shrink' | 'slowmo';

export type AchievementId =
  | 'century'
  | 'half_grand'
  | 'survivor'
  | 'pearl_diver'
  | 'untouchable';

export const ACHIEVEMENT_IDS: readonly AchievementId[] = [
  'century',
  'half_grand',
  'survivor',
  'pearl_diver',
  'untouchable',
];

export interface Obstacle {
  id: number;
  kind: ObstacleKind;
  anchor: ObstacleAnchor;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Has the player already passed it? Avoids double-counting near-misses. */
  passed: boolean;
}

export interface Pearl {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface PowerUpPickup {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  collected: boolean;
}

export interface Current {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Negative = pushes up, positive = pushes down. */
  force: number;
}

export interface Bubble {
  x: number;
  y: number;
  size: 'small' | 'tiny';
  drift: number;
}

export interface BackgroundProp {
  x: number;
  y: number;
  variant: number;
}

/**
 * Jellyfish-specific input shape. The dispatcher's RawInput is mapped onto
 * this in `../jellyfish/index.ts` (pulse = primary, pulseEdge = primaryEdge).
 */
export interface GameInput {
  pulse: boolean;
  pulseEdge?: boolean;
}

export interface GameState {
  phase: Phase;
  playerState: PlayerState;
  playerY: number;
  playerVelocity: number;
  ceilingY: number;
  floorY: number;
  speed: number;
  distance: number;
  score: number;
  /** Score awarded by pearls + near-misses (not derived from distance). */
  bonusScore: number;
  hiScore: number;
  obstacles: Obstacle[];
  pearls: Pearl[];
  powerUps: PowerUpPickup[];
  currents: Current[];
  bubbles: Bubble[];
  kelp: BackgroundProp[];
  rocks: BackgroundProp[];
  nextObstacleDistance: number;
  pulseAnimTimer: number;
  width: number;
  height: number;

  // Combo & near-miss
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  nearMissCount: number;

  // Pickups & power-ups
  pearlsCollected: number;
  activePowerUp: ActivePowerUp<PowerUpKind> | null;

  // Tier & feedback
  tier: number;
  tierFlashTimer: number;
  milestoneFlash: MilestoneFlash | null;
  screenShake: ScreenShake;
  deathFlashTimer: number;

  // Achievements
  achievements: AchievementId[];
  newAchievements: AchievementId[];

  // Internal id counters
  nextEntityId: number;
}

// ── Helpers ──────────────────────────────────────────────────

function obstacleSize(kind: ObstacleKind): { w: number; h: number } {
  switch (kind) {
    case 'coral_short':
      return spriteSize(CORAL_SHORT);
    case 'coral_tall':
      return spriteSize(CORAL_TALL);
    case 'coral_fan':
      return spriteSize(CORAL_FAN);
    case 'stalactite_short':
      return spriteSize(STALACTITE_SHORT);
    case 'stalactite_tall':
      return spriteSize(STALACTITE_TALL);
  }
}

function makeBubble(width: number, height: number, anywhere = false): Bubble {
  const ceiling = height * CEILING_Y_RATIO;
  const floor = height * FLOOR_Y_RATIO;
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(0, width / 2),
    y: randomBetween(ceiling + 8, floor - 8),
    size: Math.random() < 0.6 ? 'tiny' : 'small',
    drift: randomBetween(-0.02, 0.02),
  };
}

function makeKelp(width: number, anywhere = false): BackgroundProp {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(40, width),
    y: 0,
    variant: Math.floor(Math.random() * 3),
  };
}

function makeRock(width: number, anywhere = false): BackgroundProp {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(40, width),
    y: 0,
    variant: Math.floor(Math.random() * 3),
  };
}

// ── Init ─────────────────────────────────────────────────────

export function initState(
  width: number,
  height: number,
  hiScore = 0,
  achievements: AchievementId[] = [],
): GameState {
  const ceilingY = Math.floor(height * CEILING_Y_RATIO);
  const floorY = Math.floor(height * FLOOR_Y_RATIO);

  const bubbles: Bubble[] = [];
  for (let i = 0; i < BUBBLE_COUNT; i++) bubbles.push(makeBubble(width, height, true));

  const kelp: BackgroundProp[] = [];
  for (let i = 0; i < KELP_COUNT; i++) kelp.push(makeKelp(width, true));

  const rocks: BackgroundProp[] = [];
  for (let i = 0; i < ROCK_COUNT; i++) rocks.push(makeRock(width, true));

  return {
    phase: 'idle',
    playerState: 'idle',
    playerY: (ceilingY + floorY) / 2,
    playerVelocity: 0,
    ceilingY,
    floorY,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    bonusScore: 0,
    hiScore,
    obstacles: [],
    pearls: [],
    powerUps: [],
    currents: [],
    bubbles,
    kelp,
    rocks,
    nextObstacleDistance: FIRST_OBSTACLE_DELAY,
    pulseAnimTimer: 0,
    width,
    height,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    nearMissCount: 0,
    pearlsCollected: 0,
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

export function tick(state: GameState, dt: number, input: GameInput): GameState {
  const startTrigger = input.pulseEdge ?? input.pulse;

  if (state.phase === 'idle') {
    if (startTrigger) {
      return {
        ...state,
        phase: 'running',
        playerState: 'pulsing',
        playerVelocity: THRUST * 100,
        pulseAnimTimer: 200,
      };
    }
    return state;
  }

  if (state.phase === 'dead') {
    // Decay screen shake + death flash even while dead so they're visible.
    const next = { ...state };
    next.screenShake = decayShake(state.screenShake, dt);
    next.deathFlashTimer = Math.max(0, state.deathFlashTimer - dt);
    next.newAchievements = [];

    if (startTrigger) {
      const restarted = initState(state.width, state.height, state.hiScore, state.achievements);
      return {
        ...restarted,
        phase: 'running',
        playerState: 'pulsing',
        playerVelocity: THRUST * 100,
        pulseAnimTimer: 200,
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

  // ── Score = distance score + bonus score (pearls / near-miss) ─
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

  // ── Pulse animation ────────────────────────────────────────
  next.pulseAnimTimer = Math.max(0, state.pulseAnimTimer - dt);
  if (input.pulseEdge) next.pulseAnimTimer = 200;

  // ── Apply current force (if player is inside one) ──────────
  let currentForce = 0;
  for (const c of state.currents) {
    if (
      PLAYER_X >= c.x &&
      PLAYER_X <= c.x + c.w &&
      state.playerY >= c.y &&
      state.playerY <= c.y + c.h
    ) {
      currentForce += c.force;
    }
  }

  // ── Player physics ─────────────────────────────────────────
  const acceleration = (input.pulse ? THRUST + GRAVITY : GRAVITY) + currentForce;
  let velocity = state.playerVelocity + acceleration * dt;
  velocity *= Math.pow(VELOCITY_DAMPING, dt / 16);
  velocity = Math.max(MAX_RISE_SPEED, Math.min(MAX_FALL_SPEED, velocity));
  next.playerVelocity = velocity;
  next.playerY = state.playerY + velocity * dt;

  next.playerState =
    input.pulse || next.pulseAnimTimer > 0 ? 'pulsing' : 'drifting';

  // Walls clamp the player (not lethal — only obstacles are)
  const minY = state.ceilingY + PLAYER_HEIGHT / 2;
  const maxY = state.floorY - PLAYER_HEIGHT / 2;
  if (next.playerY < minY) {
    next.playerY = minY;
    if (next.playerVelocity < 0) next.playerVelocity = 0;
  } else if (next.playerY > maxY) {
    next.playerY = maxY;
    if (next.playerVelocity > 0) next.playerVelocity = 0;
  }

  // ── Move world entities ────────────────────────────────────
  next.obstacles = state.obstacles
    .map((o) => ({ ...o, x: o.x - moveDist }))
    .filter((o) => o.x + o.w > -50);
  next.pearls = state.pearls
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);
  next.powerUps = state.powerUps
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);
  next.currents = state.currents
    .map((c) => ({ ...c, x: c.x - moveDist }))
    .filter((c) => c.x + c.w > -20);

  // Background parallax: slower than world
  next.kelp = scrollProps(state.kelp, moveDist * KELP_PARALLAX, state.width, makeKelp);
  next.rocks = scrollProps(state.rocks, moveDist * ROCK_PARALLAX, state.width, makeRock);

  // ── Spawning ───────────────────────────────────────────────
  next.nextObstacleDistance = state.nextObstacleDistance - moveDist;
  if (next.nextObstacleDistance <= 0) {
    let idCounter = next.nextEntityId;
    const spawn = spawnObstacleSlot(state.width, state.ceilingY, state.floorY, next.score, idCounter);
    next.obstacles = [...next.obstacles, ...spawn.obstacles];
    next.pearls = [...next.pearls, ...spawn.pearls];
    next.powerUps = [...next.powerUps, ...spawn.powerUps];
    next.currents = [...next.currents, ...spawn.currents];
    next.nextEntityId = spawn.idCounter;
    next.nextObstacleDistance = randomBetween(OBSTACLE_MIN_GAP, OBSTACLE_MAX_GAP);
  }

  // ── Bubbles ────────────────────────────────────────────────
  next.bubbles = state.bubbles.map((b) => {
    const nx = b.x - moveDist * 0.4 + b.drift * dt;
    const ny = b.y - BUBBLE_RISE_SPEED * dt;
    if (ny < state.ceilingY || nx < -10) return makeBubble(state.width, state.height);
    return { ...b, x: nx, y: ny };
  });

  // ── Pearl pickup ───────────────────────────────────────────
  const pickup = collectPearls(next.pearls, next.playerY, next.combo, next.comboMultiplier);
  next.pearls = pickup.pearls;
  if (pickup.collected > 0) {
    next.pearlsCollected = state.pearlsCollected + pickup.collected;
    next.bonusScore += pickup.score;
    next.score += pickup.score;
    next.combo = Math.min(COMBO_MAX, next.combo + pickup.collected);
    next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
    next.comboTimer = COMBO_TIMEOUT;
  }

  // ── Power-up pickup ────────────────────────────────────────
  for (const p of next.powerUps) {
    if (!p.collected && circlesOverlap(p.x, p.y, 8, PLAYER_X, next.playerY, PLAYER_HEIGHT / 2)) {
      p.collected = true;
      next.activePowerUp = { kind: p.kind, remaining: POWERUP_DURATION };
    }
  }
  next.powerUps = next.powerUps.filter((p) => !p.collected);

  // ── Collision + near-miss ──────────────────────────────────
  const hitboxRatio = state.activePowerUp?.kind === 'shrink' ? SHRINK_HITBOX_RATIO : 1;
  const halfH = (PLAYER_HEIGHT / 2) * hitboxRatio;
  const halfW = (PLAYER_WIDTH / 2) * hitboxRatio;
  const playerLeft = PLAYER_X - halfW;
  const playerRight = PLAYER_X + halfW;
  const playerTop = next.playerY - halfH;
  const playerBottom = next.playerY + halfH;

  let died = false;
  for (const o of next.obstacles) {
    const oLeft = o.x + 3;
    const oRight = o.x + o.w - 3;
    const oTop = o.y + 3;
    const oBottom = o.y + o.h - 3;

    const colliding =
      playerRight > oLeft &&
      playerLeft < oRight &&
      playerBottom > oTop &&
      playerTop < oBottom;

    if (colliding) {
      // Shield consumes one hit
      if (state.activePowerUp?.kind === 'shield') {
        next.activePowerUp = null;
        o.passed = true; // prevent re-collision next frame
        next.screenShake = { remaining: 120, magnitude: 2 };
      } else {
        died = true;
        break;
      }
    }

    // Near-miss: obstacle has just moved past the player without colliding
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
    next.playerState = 'stunned';
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

  // ── Screen shake & death flash decay (skipped on the death tick
  // so the values just set above survive into the next frame) ───
  if (!died) {
    if (next.screenShake.remaining === state.screenShake.remaining) {
      next.screenShake = decayShake(state.screenShake, dt);
    }
    next.deathFlashTimer = Math.max(0, state.deathFlashTimer - dt);
  }

  // ── Achievements ───────────────────────────────────────────
  next.achievements = [...state.achievements];
  function unlock(id: AchievementId) {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      next.newAchievements.push(id);
    }
  }
  if (next.score >= 100) unlock('century');
  if (next.score >= 500) unlock('half_grand');
  if (next.pearlsCollected >= 10) unlock('pearl_diver');
  if (next.nearMissCount >= 5) unlock('untouchable');
  if (next.distance / BASE_SPEED >= 60_000) unlock('survivor'); // ~60s of game time

  return next;
}

// ── Helpers ──────────────────────────────────────────────────

function scrollProps(
  props: BackgroundProp[],
  moveDist: number,
  width: number,
  factory: (width: number) => BackgroundProp,
): BackgroundProp[] {
  return props.map((p) => {
    const nx = p.x - moveDist;
    if (nx < -40) {
      const fresh = factory(width);
      fresh.x = width + randomBetween(20, 80);
      return fresh;
    }
    return { ...p, x: nx };
  });
}

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

interface PearlPickupResult {
  pearls: Pearl[];
  collected: number;
  score: number;
}

function collectPearls(
  pearls: Pearl[],
  playerY: number,
  combo: number,
  multiplier: number,
): PearlPickupResult {
  let collected = 0;
  let score = 0;
  const remaining: Pearl[] = [];
  for (const p of pearls) {
    if (
      !p.collected &&
      circlesOverlap(p.x, p.y, 4, PLAYER_X, playerY, PLAYER_HEIGHT / 2)
    ) {
      collected++;
      score += PEARL_VALUE * multiplier;
    } else {
      remaining.push(p);
    }
  }
  void combo;
  return { pearls: remaining, collected, score };
}

// ── Spawning ─────────────────────────────────────────────────

interface SpawnResult {
  obstacles: Obstacle[];
  pearls: Pearl[];
  powerUps: PowerUpPickup[];
  currents: Current[];
  idCounter: number;
}

function spawnObstacleSlot(
  width: number,
  ceilingY: number,
  floorY: number,
  score: number,
  idCounter: number,
): SpawnResult {
  const obstacles: Obstacle[] = [];
  const pearls: Pearl[] = [];
  const powerUps: PowerUpPickup[] = [];
  const currents: Current[] = [];

  // 1. Obstacle (single or pattern)
  const usePattern = Math.random() < PATTERN_CHANCE && score > 60;
  if (usePattern) {
    const patternResult = spawnPattern(width, ceilingY, floorY, idCounter);
    obstacles.push(...patternResult.obstacles);
    idCounter = patternResult.idCounter;
  } else {
    const o = spawnObstacle(width, ceilingY, floorY, score, idCounter++);
    obstacles.push(o);
  }

  // 2. Pearls (in the safe gap)
  if (Math.random() < PEARL_SPAWN_CHANCE) {
    const baseY = randomBetween(ceilingY + 20, floorY - 20);
    for (let i = 0; i < PEARL_TRAIL_LENGTH; i++) {
      pearls.push({
        id: idCounter++,
        x: width + 60 + i * 14,
        y: baseY + Math.sin(i * 0.6) * 6,
        collected: false,
      });
    }
  }

  // 3. Power-up
  if (Math.random() < POWERUP_SPAWN_CHANCE) {
    const kinds: PowerUpKind[] = ['shield', 'shrink', 'slowmo'];
    powerUps.push({
      id: idCounter++,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: width + randomBetween(80, 160),
      y: randomBetween(ceilingY + 20, floorY - 20),
      collected: false,
    });
  }

  // 4. Current
  if (Math.random() < CURRENT_SPAWN_CHANCE) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    const length = randomBetween(CURRENT_MIN_LENGTH, CURRENT_MAX_LENGTH);
    currents.push({
      id: idCounter++,
      x: width + 20,
      y: randomBetween(ceilingY + 10, floorY - 10 - CURRENT_HEIGHT),
      w: length,
      h: CURRENT_HEIGHT,
      force: CURRENT_FORCE * direction,
    });
  }

  return { obstacles, pearls, powerUps, currents, idCounter };
}

function spawnObstacle(
  width: number,
  ceilingY: number,
  floorY: number,
  score: number,
  id: number,
): Obstacle {
  const allowCeiling = score >= CEILING_OBSTACLE_UNLOCK_SCORE;
  const fromCeiling = allowCeiling && Math.random() < CEILING_OBSTACLE_CHANCE;

  if (fromCeiling) {
    const kind: ObstacleKind =
      Math.random() < 0.6 ? 'stalactite_short' : 'stalactite_tall';
    const size = obstacleSize(kind);
    return {
      id,
      kind,
      anchor: 'ceiling',
      x: width + 10,
      y: ceilingY,
      w: size.w,
      h: size.h,
      passed: false,
    };
  }

  const r = Math.random();
  let kind: ObstacleKind;
  if (r < 0.45) kind = 'coral_short';
  else if (r < 0.8) kind = 'coral_tall';
  else kind = 'coral_fan';

  const size = obstacleSize(kind);
  return {
    id,
    kind,
    anchor: 'floor',
    x: width + 10,
    y: floorY - size.h,
    w: size.w,
    h: size.h,
    passed: false,
  };
}

function spawnPattern(
  width: number,
  ceilingY: number,
  floorY: number,
  idCounter: number,
): { obstacles: Obstacle[]; idCounter: number } {
  const patterns = ['narrow_gate', 'zig_zag', 'pulse_then_glide'] as const;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const obstacles: Obstacle[] = [];

  if (pattern === 'narrow_gate') {
    // Stalactite + coral overlapping x to form a narrow vertical gap
    const stKind: ObstacleKind = 'stalactite_short';
    const stSize = obstacleSize(stKind);
    obstacles.push({
      id: idCounter++,
      kind: stKind,
      anchor: 'ceiling',
      x: width + 10,
      y: ceilingY,
      w: stSize.w,
      h: stSize.h,
      passed: false,
    });
    const coKind: ObstacleKind = 'coral_short';
    const coSize = obstacleSize(coKind);
    obstacles.push({
      id: idCounter++,
      kind: coKind,
      anchor: 'floor',
      x: width + 10 + (stSize.w - coSize.w) / 2,
      y: floorY - coSize.h,
      w: coSize.w,
      h: coSize.h,
      passed: false,
    });
  } else if (pattern === 'zig_zag') {
    // 3 obstacles alternating ceiling/floor with spacing
    for (let i = 0; i < 3; i++) {
      const ceiling = i % 2 === 0;
      const kind: ObstacleKind = ceiling ? 'stalactite_short' : 'coral_short';
      const size = obstacleSize(kind);
      obstacles.push({
        id: idCounter++,
        kind,
        anchor: ceiling ? 'ceiling' : 'floor',
        x: width + 10 + i * 80,
        y: ceiling ? ceilingY : floorY - size.h,
        w: size.w,
        h: size.h,
        passed: false,
      });
    }
  } else {
    // pulse_then_glide: tall coral, then gap, then stalactite
    const c1: ObstacleKind = 'coral_tall';
    const c1Size = obstacleSize(c1);
    obstacles.push({
      id: idCounter++,
      kind: c1,
      anchor: 'floor',
      x: width + 10,
      y: floorY - c1Size.h,
      w: c1Size.w,
      h: c1Size.h,
      passed: false,
    });
    const s1: ObstacleKind = 'stalactite_tall';
    const s1Size = obstacleSize(s1);
    obstacles.push({
      id: idCounter++,
      kind: s1,
      anchor: 'ceiling',
      x: width + 10 + c1Size.w + 90,
      y: ceilingY,
      w: s1Size.w,
      h: s1Size.h,
      passed: false,
    });
  }

  return { obstacles, idCounter };
}
