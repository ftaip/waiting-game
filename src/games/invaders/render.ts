import {
  drawSprite,
  PIXEL_SCALE,
  type Sprite,
} from '../../shared/pixel';
import { drawNumber, BEST_LABEL, X_CHAR } from '../../shared/digits';
import {
  BULLET,
  MUZZLE_FLASH,
  ALIEN_GRUNT_A,
  ALIEN_GRUNT_B,
  ALIEN_DRONE_A,
  ALIEN_DRONE_B,
  ALIEN_TANK_A,
  ALIEN_TANK_B,
  ALIEN_TANK_DAMAGED,
  POWERUP_SHIELD,
  POWERUP_RAPID,
  POWERUP_SLOWMO,
  STAR,
  STAR_TINY,
} from './sprites';
import {
  INVADERS_SKINS,
  type InvadersSkinId,
} from './skins';
import {
  PLAYER_X,
  PLAYER_WIDTH,
  ALIEN_TANK_HP,
} from './constants';
import type {
  Alien,
  InvadersPowerUpKind,
  InvadersState,
} from './engine';

function alienSprite(a: Alien): Sprite {
  const second = (a.flap % 1) > 0.5;
  switch (a.kind) {
    case 'grunt':
      return second ? ALIEN_GRUNT_B : ALIEN_GRUNT_A;
    case 'drone':
      return second ? ALIEN_DRONE_B : ALIEN_DRONE_A;
    case 'tank':
      if (a.hp < ALIEN_TANK_HP) return ALIEN_TANK_DAMAGED;
      return second ? ALIEN_TANK_B : ALIEN_TANK_A;
  }
}

function powerUpSprite(kind: InvadersPowerUpKind): Sprite {
  switch (kind) {
    case 'shield':
      return POWERUP_SHIELD;
    case 'rapid':
      return POWERUP_RAPID;
    case 'slowmo':
      return POWERUP_SLOWMO;
  }
}

function drawStars(ctx: CanvasRenderingContext2D, state: InvadersState) {
  ctx.globalAlpha = 0.35;
  for (const s of state.stars) {
    drawSprite(ctx, s.size === 'tiny' ? STAR_TINY : STAR, s.x, s.y, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;
}

function drawLanes(ctx: CanvasRenderingContext2D, state: InvadersState) {
  // Faint dotted lines at each lane to make spawn rows readable.
  ctx.globalAlpha = 0.18;
  const phase = Math.floor(state.distance) % 8;
  for (const ly of state.laneY) {
    for (let x = -phase; x < state.width; x += 8) {
      ctx.fillRect(x, ly + 12, 2, 1);
      ctx.fillRect(x, ly - 12, 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function drawAliens(ctx: CanvasRenderingContext2D, state: InvadersState) {
  for (const a of state.aliens) {
    const sprite = alienSprite(a);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, a.x, state.laneY[a.lane] - h / 2, PIXEL_SCALE);
    void w;
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, state: InvadersState) {
  for (const b of state.bullets) {
    drawSprite(ctx, BULLET, b.x, b.y - 1, PIXEL_SCALE);
  }
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: InvadersState) {
  const bob = Math.sin(state.distance / 25) * 2;
  for (const p of state.powerUps) {
    const sprite = powerUpSprite(p.kind);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, p.x - w / 2, state.laneY[p.lane] - h / 2 + bob, PIXEL_SCALE);
  }
}

function drawTierFlash(ctx: CanvasRenderingContext2D, state: InvadersState) {
  if (state.tierFlashTimer <= 0) return;
  const alpha = (state.tierFlashTimer / 500) * 0.25;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

function drawComboDisplay(ctx: CanvasRenderingContext2D, state: InvadersState) {
  if (state.comboMultiplier <= 1) return;
  const x = 8;
  const y = 8;
  const xCharW = X_CHAR[0].length + 2;
  drawSprite(ctx, X_CHAR, x, y, 1);
  drawNumber(ctx, state.comboMultiplier, x + xCharW, y, 1, 1);
  if (state.comboTimer > 0) {
    const total = 2400;
    const ratio = state.comboTimer / total;
    const barW = 18;
    ctx.fillRect(x, y + 9, Math.max(1, Math.floor(barW * ratio)), 1);
  }
}

function drawActivePowerUp(ctx: CanvasRenderingContext2D, state: InvadersState) {
  if (!state.activePowerUp) return;
  const sprite = powerUpSprite(state.activePowerUp.kind);
  const x = 8;
  const y = state.height - sprite.length - 8;
  drawSprite(ctx, sprite, x, y, 1);
  const total = 4500;
  const ratio = Math.max(0, state.activePowerUp.remaining / total);
  const barW = sprite[0].length;
  ctx.fillRect(x, y + sprite.length + 1, Math.max(1, Math.floor(barW * ratio)), 1);
}

function drawMilestoneFlash(ctx: CanvasRenderingContext2D, state: InvadersState) {
  if (!state.milestoneFlash) return;
  const total = 900;
  const t = state.milestoneFlash.remaining / total;
  const alpha = Math.min(1, t * 1.4);
  const scale = 2 + (1 - t) * 0.5;
  ctx.globalAlpha = alpha;
  const digitsCount = String(state.milestoneFlash.score).length;
  const digitW = 5 * scale + 2;
  const totalW = digitsCount * digitW;
  drawNumber(
    ctx,
    state.milestoneFlash.score,
    state.width / 2 - totalW / 2,
    state.height / 2 - 7 * scale,
    digitsCount,
    scale,
  );
  ctx.globalAlpha = 1;
}

function drawScoreArea(ctx: CanvasRenderingContext2D, state: InvadersState) {
  const scoreScale = 1;
  const digitW = 5 * scoreScale + 2;
  const scoreDigits = 5;
  const scoreBlock = scoreDigits * digitW;
  const scoreY = 13;
  drawNumber(ctx, state.score, state.width - scoreBlock - 10, scoreY, scoreDigits, scoreScale);
  if (state.hiScore > 0) {
    const labelW = BEST_LABEL[0].length * scoreScale + 4;
    const hiX = state.width - scoreBlock - 10 - scoreBlock - labelW - 6;
    ctx.globalAlpha = 0.45;
    drawSprite(ctx, BEST_LABEL, hiX, scoreY, scoreScale);
    drawNumber(ctx, state.hiScore, hiX + labelW, scoreY, scoreDigits, scoreScale);
    ctx.globalAlpha = 1;
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: InvadersState,
  skin: InvadersSkinId,
) {
  const skinFrames = INVADERS_SKINS[skin] ?? INVADERS_SKINS.ship;
  let sprite: Sprite;
  if (state.playerState === 'dead') sprite = skinFrames.dead;
  else if (state.muzzleFlashTimer > 0) sprite = skinFrames.firing;
  else sprite = skinFrames.idle;

  const w = sprite[0].length * PIXEL_SCALE;
  const h = sprite.length * PIXEL_SCALE;
  const py = state.laneY[state.playerLane] - h / 2;
  const px = PLAYER_X - PLAYER_WIDTH / 2;

  if (state.activePowerUp?.kind === 'shield') {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.distance / 8);
    ctx.beginPath();
    ctx.arc(PLAYER_X, state.laneY[state.playerLane], Math.max(w, h) / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Subtle flash trail while the lane swap is animating.
  if (state.laneSwitchTimer > 0) {
    const otherLaneY = state.laneY[state.playerLane === 0 ? 1 : 0];
    ctx.globalAlpha = (state.laneSwitchTimer / 110) * 0.35;
    drawSprite(ctx, sprite, px, otherLaneY - h / 2, PIXEL_SCALE);
    ctx.globalAlpha = 1;
  }

  drawSprite(ctx, sprite, px, py, PIXEL_SCALE);

  // Muzzle flash just past the cannon tip.
  if (state.muzzleFlashTimer > 0 && state.playerState !== 'dead') {
    drawSprite(
      ctx,
      MUZZLE_FLASH,
      PLAYER_X + PLAYER_WIDTH / 2 + 1,
      state.laneY[state.playerLane] - 3,
      PIXEL_SCALE,
    );
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: InvadersState,
  color: string,
  skin: InvadersSkinId = 'ship',
) {
  const { width, height } = state;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  drawStars(ctx, state);
  drawLanes(ctx, state);

  drawAliens(ctx, state);
  drawBullets(ctx, state);
  drawPowerUps(ctx, state);
  drawPlayer(ctx, state, skin);

  drawTierFlash(ctx, state);

  drawScoreArea(ctx, state);
  drawComboDisplay(ctx, state);
  drawActivePowerUp(ctx, state);
  drawMilestoneFlash(ctx, state);
}
