import {
  BASE_SPEED,
  SPEED_ACCELERATION,
  MAX_SPEED,
  PLAYER_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  LANE_UPPER_RATIO,
  LANE_LOWER_RATIO,
  LANE_SWITCH_DURATION,
  FIRE_INTERVAL,
  RAPID_FIRE_INTERVAL,
  MUZZLE_FLASH_DURATION,
  BULLET_SPEED,
  ALIEN_GRUNT_HP,
  ALIEN_DRONE_HP,
  ALIEN_TANK_HP,
  ALIEN_GRUNT_SPEED_MULT,
  ALIEN_DRONE_SPEED_MULT,
  ALIEN_TANK_SPEED_MULT,
  SPAWN_MIN_GAP,
  SPAWN_MAX_GAP,
  FIRST_SPAWN_DELAY,
  PATTERN_CHANCE,
  PATTERN_UNLOCK_SCORE,
  SCORE_PER_DISTANCE,
  MILESTONE_SCORE,
  MILESTONE_FLASH_DURATION,
  ALIEN_GRUNT_SCORE,
  ALIEN_DRONE_SCORE,
  ALIEN_TANK_SCORE,
  NEAR_MISS_VALUE,
  COMBO_TIMEOUT,
  COMBO_MAX,
  CLOSE_KILL_DISTANCE,
  TIER_INTERVAL,
  TIER_SPEED_BOOST,
  TIER_FLASH_DURATION,
  POWERUP_SPAWN_CHANCE,
  POWERUP_DURATION,
  SLOWMO_FACTOR,
  STAR_COUNT,
  SCREEN_SHAKE_DURATION,
  SCREEN_SHAKE_MAGNITUDE,
  DEATH_FLASH_DURATION,
} from './constants';
import {
  ALIEN_GRUNT_A,
  ALIEN_DRONE_A,
  ALIEN_TANK_A,
} from './sprites';
import { spriteSize } from '../../shared/pixel';
import { decayShake, randomBetween } from '../../shared/feedback';
import type {
  Phase,
  ScreenShake,
  MilestoneFlash,
  ActivePowerUp,
  RawInput,
} from '../../shared/types';

// ── Types ────────────────────────────────────────────────────

export type InvadersLane = 0 | 1; // 0 = upper, 1 = lower

export type InvadersPlayerState = 'idle' | 'piloting' | 'dead';

export type AlienKind = 'grunt' | 'drone' | 'tank';

export type InvadersPowerUpKind = 'shield' | 'rapid' | 'slowmo';

export type InvadersAchievementId =
  | 'invaders_century'
  | 'invaders_half_grand'
  | 'invaders_survivor'
  | 'invaders_sharpshooter'
  | 'invaders_combo_master';

export const INVADERS_ACHIEVEMENT_IDS: readonly InvadersAchievementId[] = [
  'invaders_century',
  'invaders_half_grand',
  'invaders_survivor',
  'invaders_sharpshooter',
  'invaders_combo_master',
];

export interface Bullet {
  id: number;
  x: number;
  y: number;
}

export interface Alien {
  id: number;
  kind: AlienKind;
  lane: InvadersLane;
  x: number;
  hp: number;
  /** 0..1 wraps; used by the renderer to choose between the two flap sprites. */
  flap: number;
  /** True once the alien has escaped past the player (avoids double-counting). */
  escaped: boolean;
}

export interface InvadersPowerUpPickup {
  id: number;
  kind: InvadersPowerUpKind;
  x: number;
  /** Lane the pickup floats in. */
  lane: InvadersLane;
  collected: boolean;
}

export interface InvadersStar {
  x: number;
  y: number;
  size: 'tiny' | 'small';
}

export interface InvadersState {
  phase: Phase;
  playerState: InvadersPlayerState;
  playerLane: InvadersLane;
  /** Decreasing timer (ms). > 0 = the lane swap is still animating. */
  laneSwitchTimer: number;
  /** ms until the next auto-shot is fired. */
  fireTimer: number;
  /** Decreasing timer (ms). > 0 = render the firing pose. */
  muzzleFlashTimer: number;

  laneY: [number, number];

  speed: number;
  distance: number;
  score: number;
  bonusScore: number;
  hiScore: number;

  bullets: Bullet[];
  aliens: Alien[];
  powerUps: InvadersPowerUpPickup[];
  stars: InvadersStar[];
  nextSpawnDistance: number;

  width: number;
  height: number;

  // Combo / close-kill
  combo: number;
  comboMultiplier: number;
  comboTimer: number;
  closeKills: number;

  // Stats / power-ups
  killsTotal: number;
  activePowerUp: ActivePowerUp<InvadersPowerUpKind> | null;

  // Tier & feedback
  tier: number;
  tierFlashTimer: number;
  milestoneFlash: MilestoneFlash | null;
  screenShake: ScreenShake;
  deathFlashTimer: number;

  // Achievements
  achievements: InvadersAchievementId[];
  newAchievements: InvadersAchievementId[];

  nextEntityId: number;
}

// ── Helpers ──────────────────────────────────────────────────

function alienSize(kind: AlienKind): { w: number; h: number } {
  switch (kind) {
    case 'grunt':
      return spriteSize(ALIEN_GRUNT_A);
    case 'drone':
      return spriteSize(ALIEN_DRONE_A);
    case 'tank':
      return spriteSize(ALIEN_TANK_A);
  }
}

function alienHp(kind: AlienKind): number {
  switch (kind) {
    case 'grunt':
      return ALIEN_GRUNT_HP;
    case 'drone':
      return ALIEN_DRONE_HP;
    case 'tank':
      return ALIEN_TANK_HP;
  }
}

function alienSpeedMult(kind: AlienKind): number {
  switch (kind) {
    case 'grunt':
      return ALIEN_GRUNT_SPEED_MULT;
    case 'drone':
      return ALIEN_DRONE_SPEED_MULT;
    case 'tank':
      return ALIEN_TANK_SPEED_MULT;
  }
}

function alienScore(kind: AlienKind): number {
  switch (kind) {
    case 'grunt':
      return ALIEN_GRUNT_SCORE;
    case 'drone':
      return ALIEN_DRONE_SCORE;
    case 'tank':
      return ALIEN_TANK_SCORE;
  }
}

function makeStar(width: number, height: number, anywhere = false): InvadersStar {
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
  achievements: InvadersAchievementId[] = [],
): InvadersState {
  const laneY: [number, number] = [
    Math.floor(height * LANE_UPPER_RATIO),
    Math.floor(height * LANE_LOWER_RATIO),
  ];

  const stars: InvadersStar[] = [];
  for (let i = 0; i < STAR_COUNT; i++) stars.push(makeStar(width, height, true));

  return {
    phase: 'idle',
    playerState: 'idle',
    playerLane: 1,
    laneSwitchTimer: 0,
    fireTimer: FIRE_INTERVAL,
    muzzleFlashTimer: 0,
    laneY,
    speed: BASE_SPEED,
    distance: 0,
    score: 0,
    bonusScore: 0,
    hiScore,
    bullets: [],
    aliens: [],
    powerUps: [],
    stars,
    nextSpawnDistance: FIRST_SPAWN_DELAY,
    width,
    height,
    combo: 0,
    comboMultiplier: 1,
    comboTimer: 0,
    closeKills: 0,
    killsTotal: 0,
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
  state: InvadersState,
  dt: number,
  input: RawInput,
): InvadersState {
  const startTrigger = input.primaryEdge ?? input.primary;

  if (state.phase === 'idle') {
    if (startTrigger) {
      // First tap launches the run AND switches lane (visible feedback).
      return {
        ...state,
        phase: 'running',
        playerState: 'piloting',
        playerLane: state.playerLane === 0 ? 1 : 0,
        laneSwitchTimer: LANE_SWITCH_DURATION,
        fireTimer: FIRE_INTERVAL,
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
        playerState: 'piloting',
        playerLane: restarted.playerLane === 0 ? 1 : 0,
        laneSwitchTimer: LANE_SWITCH_DURATION,
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

  // ── Lane switch on edge tap ────────────────────────────────
  if (input.primaryEdge) {
    next.playerLane = state.playerLane === 0 ? 1 : 0;
    next.laneSwitchTimer = LANE_SWITCH_DURATION;
  } else {
    next.playerLane = state.playerLane;
    next.laneSwitchTimer = Math.max(0, state.laneSwitchTimer - dt);
  }

  // ── Auto-fire ──────────────────────────────────────────────
  next.muzzleFlashTimer = Math.max(0, state.muzzleFlashTimer - dt);
  next.fireTimer = state.fireTimer - dt;
  let bullets = state.bullets.map((b) => ({ ...b, x: b.x + BULLET_SPEED * dt }));
  // Drop off-screen
  bullets = bullets.filter((b) => b.x < state.width + 8);
  if (next.fireTimer <= 0) {
    const interval =
      next.activePowerUp?.kind === 'rapid' ? RAPID_FIRE_INTERVAL : FIRE_INTERVAL;
    next.fireTimer += interval;
    if (next.fireTimer < 0) next.fireTimer = interval;
    next.muzzleFlashTimer = MUZZLE_FLASH_DURATION;
    bullets.push({
      id: next.nextEntityId++,
      x: PLAYER_X + PLAYER_WIDTH / 2,
      y: state.laneY[next.playerLane],
    });
  }

  // ── Move aliens left ───────────────────────────────────────
  let aliens = state.aliens.map((a) => ({
    ...a,
    x: a.x - moveDist * alienSpeedMult(a.kind),
    flap: (a.flap + dt * 0.004) % 1,
  }));

  // ── Move power-ups left at world speed ─────────────────────
  let powerUps = state.powerUps
    .map((p) => ({ ...p, x: p.x - moveDist }))
    .filter((p) => p.x > -20 && !p.collected);

  // ── Stars (slow parallax drift) ────────────────────────────
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
    aliens = [...aliens, ...spawn.aliens];
    powerUps = [...powerUps, ...spawn.powerUps];
    next.nextEntityId = spawn.idCounter;
    next.nextSpawnDistance = randomBetween(SPAWN_MIN_GAP, SPAWN_MAX_GAP);
  }

  // ── Bullet vs alien collisions ─────────────────────────────
  const hitBulletIds = new Set<number>();
  let killsThisTick = 0;
  let killScoreThisTick = 0;
  let closeKillsThisTick = 0;

  for (const a of aliens) {
    if (a.hp <= 0) continue;
    const sz = alienSize(a.kind);
    const aLeft = a.x;
    const aRight = a.x + sz.w;
    const aTop = state.laneY[a.lane] - sz.h / 2;
    const aBottom = state.laneY[a.lane] + sz.h / 2;
    for (const b of bullets) {
      if (hitBulletIds.has(b.id)) continue;
      // Bullet is a 4×1 right-moving sliver — keep collision generous.
      if (
        b.x + 4 >= aLeft &&
        b.x <= aRight &&
        b.y >= aTop - 2 &&
        b.y <= aBottom + 2
      ) {
        hitBulletIds.add(b.id);
        a.hp -= 1;
        if (a.hp <= 0) {
          killsThisTick += 1;
          killScoreThisTick += alienScore(a.kind);
          if (a.x - PLAYER_X <= CLOSE_KILL_DISTANCE) {
            closeKillsThisTick += 1;
          }
        }
        break;
      }
    }
  }
  bullets = bullets.filter((b) => !hitBulletIds.has(b.id));
  aliens = aliens.filter((a) => a.hp > 0);

  if (killsThisTick > 0) {
    const award = killScoreThisTick * next.comboMultiplier;
    next.bonusScore += award;
    next.score += award;
    next.combo = Math.min(COMBO_MAX, next.combo + killsThisTick);
    next.comboMultiplier = Math.min(COMBO_MAX, 1 + Math.floor(next.combo / 2));
    next.comboTimer = COMBO_TIMEOUT;
    next.killsTotal = state.killsTotal + killsThisTick;
  } else {
    next.killsTotal = state.killsTotal;
  }
  if (closeKillsThisTick > 0) {
    next.bonusScore += closeKillsThisTick * NEAR_MISS_VALUE * next.comboMultiplier;
    next.score += closeKillsThisTick * NEAR_MISS_VALUE * next.comboMultiplier;
    next.closeKills = state.closeKills + closeKillsThisTick;
  } else {
    next.closeKills = state.closeKills;
  }

  // ── Power-up pickup (any lane along the path) ──────────────
  for (const p of powerUps) {
    const py = state.laneY[p.lane];
    const onSameLane = p.lane === next.playerLane;
    if (
      !p.collected &&
      onSameLane &&
      Math.abs(p.x - PLAYER_X) < 12 &&
      Math.abs(py - state.laneY[next.playerLane]) < 4
    ) {
      p.collected = true;
      next.activePowerUp = { kind: p.kind, remaining: POWERUP_DURATION };
      // If we just picked up rapid, reset fireTimer so it fires soon.
      if (p.kind === 'rapid') next.fireTimer = Math.min(next.fireTimer, RAPID_FIRE_INTERVAL);
    }
  }
  powerUps = powerUps.filter((p) => !p.collected);

  // ── Alien vs player collision ──────────────────────────────
  let died = false;
  const playerLeft = PLAYER_X - PLAYER_WIDTH / 2;
  const playerRight = PLAYER_X + PLAYER_WIDTH / 2;
  for (const a of aliens) {
    if (a.lane !== next.playerLane) continue;
    const sz = alienSize(a.kind);
    const aLeft = a.x;
    const aRight = a.x + sz.w;
    if (aRight >= playerLeft && aLeft <= playerRight) {
      if (state.activePowerUp?.kind === 'shield') {
        next.activePowerUp = null;
        a.hp = 0;
        next.screenShake = { remaining: 120, magnitude: 2 };
      } else {
        died = true;
        break;
      }
    }
  }
  aliens = aliens.filter((a) => a.hp > 0);

  // ── Aliens that escape past the player break the combo ─────
  next.aliens = [];
  for (const a of aliens) {
    if (!a.escaped && a.x + alienSize(a.kind).w < playerLeft) {
      // Mark as escaped (still keep so we can render it for one tick if visible),
      // but penalise the player.
      next.combo = 0;
      next.comboMultiplier = 1;
      next.comboTimer = 0;
      a.escaped = true;
    }
    if (a.x + alienSize(a.kind).w > -20) {
      next.aliens.push(a);
    }
  }

  next.bullets = bullets;
  next.powerUps = powerUps;

  if (died) {
    next.phase = 'dead';
    next.playerState = 'dead';
    next.combo = 0;
    next.comboMultiplier = 1;
    next.deathFlashTimer = DEATH_FLASH_DURATION;
    next.screenShake = { remaining: SCREEN_SHAKE_DURATION, magnitude: SCREEN_SHAKE_MAGNITUDE };
    if (next.score > next.hiScore) next.hiScore = next.score;
  } else {
    next.playerState = 'piloting';
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
  function unlock(id: InvadersAchievementId) {
    if (!next.achievements.includes(id)) {
      next.achievements.push(id);
      next.newAchievements.push(id);
    }
  }
  if (next.score >= 100) unlock('invaders_century');
  if (next.score >= 500) unlock('invaders_half_grand');
  if (next.killsTotal >= 10) unlock('invaders_sharpshooter');
  if (next.closeKills >= 5) unlock('invaders_combo_master');
  if (next.distance / BASE_SPEED >= 60_000) unlock('invaders_survivor');

  return next;
}

// ── Spawning ─────────────────────────────────────────────────

interface SpawnResult {
  aliens: Alien[];
  powerUps: InvadersPowerUpPickup[];
  idCounter: number;
}

function makeAlien(
  kind: AlienKind,
  lane: InvadersLane,
  x: number,
  id: number,
): Alien {
  return {
    id,
    kind,
    lane,
    x,
    hp: alienHp(kind),
    flap: Math.random(),
    escaped: false,
  };
}

function spawnSlot(width: number, score: number, idCounter: number): SpawnResult {
  const aliens: Alien[] = [];
  const powerUps: InvadersPowerUpPickup[] = [];

  const usePattern = Math.random() < PATTERN_CHANCE && score > PATTERN_UNLOCK_SCORE;
  if (usePattern) {
    const result = spawnPattern(width, idCounter);
    aliens.push(...result.aliens);
    idCounter = result.idCounter;
  } else {
    const r = Math.random();
    let kind: AlienKind;
    if (r < 0.6) kind = 'grunt';
    else if (r < 0.9) kind = 'drone';
    else kind = 'tank';
    const lane: InvadersLane = Math.random() < 0.5 ? 0 : 1;
    aliens.push(makeAlien(kind, lane, width + 10, idCounter++));
  }

  if (Math.random() < POWERUP_SPAWN_CHANCE) {
    const kinds: InvadersPowerUpKind[] = ['shield', 'rapid', 'slowmo'];
    powerUps.push({
      id: idCounter++,
      kind: kinds[Math.floor(Math.random() * kinds.length)],
      x: width + randomBetween(80, 160),
      lane: Math.random() < 0.5 ? 0 : 1,
      collected: false,
    });
  }

  return { aliens, powerUps, idCounter };
}

function spawnPattern(
  width: number,
  idCounter: number,
): { aliens: Alien[]; idCounter: number } {
  const patterns = ['wave', 'wedge', 'tank_escort', 'drone_swarm'] as const;
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const aliens: Alien[] = [];

  if (pattern === 'wave') {
    // 4 grunts in a single lane, evenly spaced — easy line to mow down.
    const lane: InvadersLane = Math.random() < 0.5 ? 0 : 1;
    for (let i = 0; i < 4; i++) {
      aliens.push(makeAlien('grunt', lane, width + 10 + i * 28, idCounter++));
    }
  } else if (pattern === 'wedge') {
    // Alternating-lane grunts: must switch between shots.
    for (let i = 0; i < 4; i++) {
      const lane: InvadersLane = (i % 2) as InvadersLane;
      aliens.push(makeAlien('grunt', lane, width + 10 + i * 36, idCounter++));
    }
  } else if (pattern === 'tank_escort') {
    // Tank flanked by two drones in the opposite lane.
    const tankLane: InvadersLane = Math.random() < 0.5 ? 0 : 1;
    const escortLane: InvadersLane = (1 - tankLane) as InvadersLane;
    aliens.push(makeAlien('tank', tankLane, width + 10, idCounter++));
    aliens.push(makeAlien('drone', escortLane, width + 10, idCounter++));
    aliens.push(makeAlien('drone', escortLane, width + 50, idCounter++));
  } else {
    // 3 drones in one lane in tight succession.
    const lane: InvadersLane = Math.random() < 0.5 ? 0 : 1;
    for (let i = 0; i < 3; i++) {
      aliens.push(makeAlien('drone', lane, width + 10 + i * 22, idCounter++));
    }
  }

  return { aliens, idCounter };
}
