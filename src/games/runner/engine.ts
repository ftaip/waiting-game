import {
  BASE_SPEED,
  SPEED_ACCELERATION,
  MAX_SPEED,
  GROUND_Y_RATIO,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  GRAVITY,
  HOLD_GRAVITY,
  HOLD_BOOST_WINDOW,
  JUMP_IMPULSE,
  MAX_FALL_SPEED,
  OBSTACLE_MIN_GAP,
  OBSTACLE_MAX_GAP,
  FIRST_OBSTACLE_DELAY,
  BIRD_UNLOCK_SCORE,
  BIRD_CHANCE,
  PATTERN_CHANCE,
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
  MAGNET_RADIUS,
  MAGNET_PULL,
  CLOUD_COUNT,
  HILL_COUNT,
  CLOUD_PARALLAX,
  HILL_PARALLAX,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_MAGNITUDE,
  DEATH_FLASH_DURATION,
} from './constants';
import {
  CACTUS_SMALL,
  CACTUS_MED,
  CACTUS_TALL,
  BIRD_UP,
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

export type RunnerPlayerState = 'idle' | 'running' | 'jumping' | 'dead';

export type RunnerObstacleKind =
  | 'cactus_small'
  | 'cactus_med'
  | 'cactus_tall'
  | 'bird';

export type RunnerPowerUpKind = 'shield' | 'magnet' | 'slowmo';

export type RunnerAchievementId =
  | 'runner_century'
  | 'runner_half_grand'
  | 'runner_survivor'
  | 'runner_coin_hoarder'
  | 'runner_dodger';

export const RUNNER_ACHIEVEMENT_IDS: readonly RunnerAchievementId[] = [
  'runner_century',
  'runner_half_grand',
  'runner_survivor',
  'runner_coin_hoarder',
  'runner_dodger',
];

export interface RunnerObstacle {
  id: number;
  kind: RunnerObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  passed: boolean;
  /** Bird flap animation phase (0..1). */
  flap?: number;
}

export interface RunnerCoin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface RunnerPowerUpPickup {
  id: number;
  kind: RunnerPowerUpKind;
  x: number;
  y: number;
  collected: boolean;
}

export interface RunnerBackgroundProp {
  x: number;
  y: number;
  variant: number;
}

export interface RunnerState {
  phase: Phase;
  playerState: RunnerPlayerState;
  /** y of the player's centre. */
  playerY: number;
  playerVelocity: number;
  /** True while the player is in the air. */
  airborne: boolean;
  /** Time since the most recent jump initiation (ms). Used for variable jump. */
  jumpHoldTimer: number;
  groundY: number;
  speed: number;
  distance: number;
  score: number;
  bonusScore: number;
  hiScore: number;
  obstacles: RunnerObstacle[];
  coins: RunnerCoin[];
  powerUps: RunnerPowerUpPickup[];
  clouds: RunnerBackgroundProp[];
  hills: RunnerBackgroundProp[];
  nextObstacleDistance: number;
  /** Animation phase for legs (0..1, wraps). */
  runCycle: number;
  width: number;
  height: number;

  // Combo / near-miss
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  nearMissCount: number;

  // Pickups & power-ups
  coinsCollected: number;
  activePowerUp: ActivePowerUp<RunnerPowerUpKind> | null;

  // Tier & feedback
  tier: number;
  tierFlashTimer: number;
  milestoneFlash: MilestoneFlash | null;
  screenShake: ScreenShake;
  deathFlashTimer: number;

  // Achievements
  achievements: RunnerAchievementId[];
  newAchievements: RunnerAchievementId[];

  nextEntityId: number;
}

// ── Helpers ──────────────────────────────────────────────────

function obstacleSize(kind: RunnerObstacleKind): { w: number; h: number } {
  switch (kind) {
    case 'cactus_small':
      return spriteSize(CACTUS_SMALL);
    case 'cactus_med':
      return spriteSize(CACTUS_MED);
    case 'cactus_tall':
      return spriteSize(CACTUS_TALL);
    case 'bird':
      return spriteSize(BIRD_UP);
  }
}

function makeCloud(width: number, height: number, anywhere = false): RunnerBackgroundProp {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(40, width),
    y: randomBetween(8, Math.max(10, height * 0.35)),
    variant: 0,
  };
}

function makeHill(width: number, anywhere = false): RunnerBackgroundProp {
  return {
    x: anywhere ? randomBetween(0, width) : width + randomBetween(40, width),
    y: 0,
    variant: Math.floor(Math.random() * 2),
  };
}

// ── Init ─────────────────────────────────────────────────────

export function initState(
  width: number,
  height: number,
  hiScore = 0,
  achievements: RunnerAchievementId[] = [],
): RunnerState {
  const groundY = Math.floor(height * GROUND_Y_RATIO);
  const playerY = groundY - PLAYER_HEIGHT / 2;

  const clouds: RunnerBackgroundProp[] = [];
  for (let i = 0; i < CLOUD_COUNT; i++) clouds.push(makeCloud(width, height, true));

  const hills: RunnerBackgroundProp[] = [];
  for (let i = 0; i < HILL_COUNT; i++) hills.push(makeHill(width, true));

  return {
    phase: 'idle',
    playerState: 'idle',
    playerY,
    playerVelocity: 0,
    airborne: false,
    jumpHoldTimer: 0,
    groundY,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    bonusScore: 0,
    hiScore,
    obstacles: [],
    coins: [],
    powerUps: [],
    clouds,
    hills,
    nextObstacleDistance: FIRST_OBSTACLE_DELAY,
    runCycle: 0,
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

export function tick(state: RunnerState, dt: number, input: RawInput): RunnerState {
  const startTrigger = input.primaryEdge ?? input.primary;

  if (state.phase === 'idle') {
    if (startTrigger) {
      return {
        ...state,
        phase: 'running',
        playerState: 'jumping',
        playerVelocity: JUMP_IMPULSE,
        airborne: true,
        jumpHoldTimer: 0,
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
        playerState: 'jumping',
        playerVelocity: JUMP_IMPULSE,
        airborne: true,
        jumpHoldTimer: 0,
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

  // ── Score = distance + bonus ───────────────────────────────
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

  // ── Player physics ─────────────────────────────────────────
  // Jump initiation: only when grounded and primary edge fires.
  if (input.primaryEdge && !state.airborne) {
    next.playerVelocity = JUMP_IMPULSE;
    next.airborne = true;
    next.jumpHoldTimer = 0;
    next.playerState = 'jumping';
  } else {
    next.airborne = state.airborne;
    next.jumpHoldTimer = state.airborne ? state.jumpHoldTimer + dt : 0;
    next.playerVelocity = state.playerVelocity;
  }

  // Apply gravity (reduced while ascending and still holding for a brief window).
  const ascending = next.playerVelocity < 0;
  const stillBoosting =
    ascending && input.primary && next.jumpHoldTimer < HOLD_BOOST_WINDOW;
  const g = stillBoosting ? HOLD_GRAVITY : GRAVITY;
  next.playerVelocity = clamp(next.playerVelocity + g * dt, JUMP_IMPULSE * 1.2, MAX_FALL_SPEED);
  next.playerY = state.playerY + next.playerVelocity * dt;

  // Land if we hit the ground line.
  const restingY = state.groundY - PLAYER_HEIGHT / 2;
  if (next.playerY >= restingY) {
    next.playerY = restingY;
    next.playerVelocity = 0;
    next.airborne = false;
    next.jumpHoldTimer = 0;
    next.playerState = 'running';
  } else {
    next.playerState = 'jumping';
  }

  // Run cycle (only animates while grounded).
  if (!next.airborne) {
    next.runCycle = (state.runCycle + moveDist * 0.04) % 1;
  } else {
    next.runCycle = state.runCycle;
  }

  // ── Move world entities ────────────────────────────────────
  next.obstacles = state.obstacles
    .map((o) => ({
      ...o,
      x: o.x - moveDist,
      flap: o.kind === 'bird' ? ((o.flap ?? 0) + dt * 0.005) % 1 : o.flap,
    }))
    .filter((o) => o.x + o.w > -50);

  // Magnet pulls coins toward the player.
  const magnetActive = state.activePowerUp?.kind === 'magnet';
  next.coins = state.coins
    .map((c) => {
      let nx = c.x - moveDist;
      let ny = c.y;
      if (magnetActive) {
        const dx = PLAYER_X - nx;
        const dy = next.playerY - ny;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAGNET_RADIUS && dist > 0.5) {
          const pull = MAGNET_PULL * dt;
          nx += (dx / dist) * pull * dist * 0.06;
          ny += (dy / dist) * pull * dist * 0.06;
        }
      }
      return { ...c, x: nx, y: ny };
    })
    .filter((c) => c.x > -20 && !c.collected);

  next.powerUps = state.powerUps
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);

  // Background parallax
  next.clouds = scrollProps(
    state.clouds,
    moveDist * CLOUD_PARALLAX,
    state.width,
    () => makeCloud(state.width, state.height),
  );
  next.hills = scrollProps(
    state.hills,
    moveDist * HILL_PARALLAX,
    state.width,
    () => makeHill(state.width),
  );

  // ── Spawning ───────────────────────────────────────────────
  next.nextObstacleDistance = state.nextObstacleDistance - moveDist;
  if (next.nextObstacleDistance <= 0) {
    let idCounter = next.nextEntityId;
    const spawn = spawnSlot(
      state.width,
      state.height,
      state.groundY,
      next.score,
      idCounter,
    );
    next.obstacles = [...next.obstacles, ...spawn.obstacles];
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
  const hitboxRatio = state.activePowerUp?.kind === 'shield' ? 1 : 1;
  // (shrink isn't a power-up here; shield handled separately)
  const halfH = (PLAYER_HEIGHT / 2) * hitboxRatio - 1;
  const halfW = (PLAYER_WIDTH / 2) * hitboxRatio - 1;
  const playerLeft = PLAYER_X - halfW;
  const playerRight = PLAYER_X + halfW;
  const playerTop = next.playerY - halfH;
  const playerBottom = next.playerY + halfH;

  let died = false;
  for (const o of next.obstacles) {
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
  function unlock(id: RunnerAchievementId) {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      next.newAchievements.push(id);
    }
  }
  if (next.score >= 100) unlock('runner_century');
  if (next.score >= 500) unlock('runner_half_grand');
  if (next.coinsCollected >= 10) unlock('runner_coin_hoarder');
  if (next.nearMissCount >= 5) unlock('runner_dodger');
  if (next.distance / BASE_SPEED >= 60_000) unlock('runner_survivor');

  return next;
}

// ── Helpers ──────────────────────────────────────────────────

function scrollProps(
  props: RunnerBackgroundProp[],
  moveDist: number,
  width: number,
  factory: () => RunnerBackgroundProp,
): RunnerBackgroundProp[] {
  return props.map((p) => {
    const nx = p.x - moveDist;
    if (nx < -40) {
      const fresh = factory();
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

interface CoinPickupResult {
  coins: RunnerCoin[];
  collected: number;
  score: number;
}

function collectCoins(
  coins: RunnerCoin[],
  playerY: number,
  multiplier: number,
): CoinPickupResult {
  let collected = 0;
  let score = 0;
  const remaining: RunnerCoin[] = [];
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
  obstacles: RunnerObstacle[];
  coins: RunnerCoin[];
  powerUps: RunnerPowerUpPickup[];
  idCounter: number;
}

function spawnSlot(
  width: number,
  height: number,
  groundY: number,
  score: number,
  idCounter: number,
): SpawnResult {
  const obstacles: RunnerObstacle[] = [];
  const coins: RunnerCoin[] = [];
  const powerUps: RunnerPowerUpPickup[] = [];

  const usePattern = Math.random() < PATTERN_CHANCE && score > 60;
  if (usePattern) {
    const result = spawnPattern(width, height, groundY, score, idCounter);
    obstacles.push(...result.obstacles);
    idCounter = result.idCounter;
  } else {
    const o = spawnObstacle(width, groundY, score, idCounter++);
    obstacles.push(o);
  }

  // Coins arc above an obstacle, encouraging the player to time jumps to grab them.
  if (Math.random() < COIN_SPAWN_CHANCE) {
    const baseY = groundY - randomBetween(30, 50);
    for (let i = 0; i < COIN_TRAIL_LENGTH; i++) {
      const t = (i + 1) / (COIN_TRAIL_LENGTH + 1);
      coins.push({
        id: idCounter++,
        x: width + 40 + i * 14,
        y: baseY - Math.sin(t * Math.PI) * 12,
        collected: false,
      });
    }
  }

  if (Math.random() < POWERUP_SPAWN_CHANCE) {
    const kinds: RunnerPowerUpKind[] = ['shield', 'magnet', 'slowmo'];
    powerUps.push({
      id: idCounter++,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: width + randomBetween(80, 160),
      y: groundY - randomBetween(28, 46),
      collected: false,
    });
  }

  return { obstacles, coins, powerUps, idCounter };
}

function spawnObstacle(
  width: number,
  groundY: number,
  score: number,
  id: number,
): RunnerObstacle {
  const allowBird = score >= BIRD_UNLOCK_SCORE;
  const useBird = allowBird && Math.random() < BIRD_CHANCE;
  if (useBird) {
    const size = obstacleSize('bird');
    // Birds at "must short-jump under" height: top of bird above ground enough
    // to be hit during a long jump but cleared by a short tap.
    const yChoices = [groundY - 28, groundY - 38];
    const y = yChoices[Math.floor(Math.random() * yChoices.length)] - size.h;
    return {
      id,
      kind: 'bird',
      x: width + 10,
      y,
      w: size.w,
      h: size.h,
      passed: false,
      flap: 0,
    };
  }
  const r = Math.random();
  let kind: RunnerObstacleKind;
  if (r < 0.5) kind = 'cactus_small';
  else if (r < 0.85) kind = 'cactus_med';
  else kind = 'cactus_tall';
  const size = obstacleSize(kind);
  return {
    id,
    kind,
    x: width + 10,
    y: groundY - size.h,
    w: size.w,
    h: size.h,
    passed: false,
  };
}

function spawnPattern(
  width: number,
  _height: number,
  groundY: number,
  score: number,
  idCounter: number,
): { obstacles: RunnerObstacle[]; idCounter: number } {
  const patterns = ['cluster', 'cactus_then_bird', 'bird_then_cactus'] as const;
  const allowBird = score >= BIRD_UNLOCK_SCORE;
  const pool = allowBird ? patterns : (['cluster'] as const);
  const pattern = pool[Math.floor(Math.random() * pool.length)];
  const obstacles: RunnerObstacle[] = [];

  if (pattern === 'cluster') {
    // 3 cacti close together — a single wider hop.
    const size = obstacleSize('cactus_small');
    for (let i = 0; i < 3; i++) {
      obstacles.push({
        id: idCounter++,
        kind: 'cactus_small',
        x: width + 10 + i * size.w,
        y: groundY - size.h,
        w: size.w,
        h: size.h,
        passed: false,
      });
    }
  } else if (pattern === 'cactus_then_bird') {
    const cSize = obstacleSize('cactus_small');
    obstacles.push({
      id: idCounter++,
      kind: 'cactus_small',
      x: width + 10,
      y: groundY - cSize.h,
      w: cSize.w,
      h: cSize.h,
      passed: false,
    });
    const bSize = obstacleSize('bird');
    obstacles.push({
      id: idCounter++,
      kind: 'bird',
      x: width + 10 + cSize.w + 70,
      y: groundY - 36 - bSize.h,
      w: bSize.w,
      h: bSize.h,
      passed: false,
      flap: 0,
    });
  } else {
    const bSize = obstacleSize('bird');
    obstacles.push({
      id: idCounter++,
      kind: 'bird',
      x: width + 10,
      y: groundY - 32 - bSize.h,
      w: bSize.w,
      h: bSize.h,
      passed: false,
      flap: 0,
    });
    const cSize = obstacleSize('cactus_med');
    obstacles.push({
      id: idCounter++,
      kind: 'cactus_med',
      x: width + 10 + bSize.w + 80,
      y: groundY - cSize.h,
      w: cSize.w,
      h: cSize.h,
      passed: false,
    });
  }

  return { obstacles, idCounter };
}

// suppress unused import — SHRINK_HITBOX_RATIO retained for future variants
void SHRINK_HITBOX_RATIO;
