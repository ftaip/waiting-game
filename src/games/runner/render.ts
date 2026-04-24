import {
  drawSprite,
  spriteSize,
  PIXEL_SCALE,
  type Sprite,
} from '../../shared/pixel';
import {
  drawNumber,
  BEST_LABEL,
  X_CHAR,
} from '../../shared/digits';
import {
  CACTUS_SMALL,
  CACTUS_MED,
  CACTUS_TALL,
  BIRD_UP,
  BIRD_DOWN,
  COIN,
  POWERUP_SHIELD,
  POWERUP_MAGNET,
  POWERUP_SLOWMO,
  CLOUD,
  HILL,
} from './sprites';
import {
  RUNNER_SKINS,
  type RunnerSkinId,
} from './skins';
import {
  PLAYER_X,
  PLAYER_HEIGHT,
} from './constants';
import type {
  RunnerObstacle,
  RunnerPowerUpKind,
  RunnerState,
} from './engine';

function obstacleSprite(o: RunnerObstacle): Sprite {
  switch (o.kind) {
    case 'cactus_small':
      return CACTUS_SMALL;
    case 'cactus_med':
      return CACTUS_MED;
    case 'cactus_tall':
      return CACTUS_TALL;
    case 'bird':
      // Two-frame flap.
      return ((o.flap ?? 0) < 0.5) ? BIRD_UP : BIRD_DOWN;
  }
}

function powerUpSprite(kind: RunnerPowerUpKind): Sprite {
  switch (kind) {
    case 'shield':
      return POWERUP_SHIELD;
    case 'magnet':
      return POWERUP_MAGNET;
    case 'slowmo':
      return POWERUP_SLOWMO;
  }
}

function drawGround(ctx: CanvasRenderingContext2D, state: RunnerState) {
  const { width, groundY } = state;
  ctx.fillRect(0, groundY, width, 1);
  // Tick marks scrolling for parallax sense
  const phase = Math.floor(state.distance) % 16;
  for (let x = -phase; x < width; x += 16) {
    ctx.fillRect(x, groundY + 3, 4, 1);
    ctx.fillRect(x + 8, groundY + 6, 2, 1);
    ctx.fillRect(x + 12, groundY + 4, 1, 1);
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, state: RunnerState) {
  ctx.globalAlpha = 0.18;
  for (const c of state.clouds) {
    drawSprite(ctx, CLOUD, c.x, c.y, PIXEL_SCALE);
  }
  ctx.globalAlpha = 0.25;
  const hillSize = spriteSize(HILL);
  for (const h of state.hills) {
    drawSprite(ctx, HILL, h.x, state.groundY - hillSize.h + 1, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;
}

function drawCoins(ctx: CanvasRenderingContext2D, state: RunnerState) {
  for (const c of state.coins) {
    drawSprite(ctx, COIN, c.x - 4, c.y - 4, PIXEL_SCALE);
  }
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: RunnerState) {
  const bob = Math.sin(state.distance / 25) * 2;
  for (const p of state.powerUps) {
    const sprite = powerUpSprite(p.kind);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, p.x - w / 2, p.y - h / 2 + bob, PIXEL_SCALE);
  }
}

function drawTierFlash(ctx: CanvasRenderingContext2D, state: RunnerState) {
  if (state.tierFlashTimer <= 0) return;
  const alpha = (state.tierFlashTimer / 500) * 0.25;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

function drawComboDisplay(ctx: CanvasRenderingContext2D, state: RunnerState) {
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

function drawActivePowerUp(ctx: CanvasRenderingContext2D, state: RunnerState) {
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

function drawMilestoneFlash(ctx: CanvasRenderingContext2D, state: RunnerState) {
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

function drawScoreArea(ctx: CanvasRenderingContext2D, state: RunnerState) {
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

export function draw(
  ctx: CanvasRenderingContext2D,
  state: RunnerState,
  color: string,
  skin: RunnerSkinId = 'dino',
) {
  const { width, height } = state;
  const skinFrames = RUNNER_SKINS[skin] ?? RUNNER_SKINS.dino;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;

  drawBackground(ctx, state);
  drawGround(ctx, state);

  for (const o of state.obstacles) {
    drawSprite(ctx, obstacleSprite(o), o.x, o.y, PIXEL_SCALE);
  }

  drawCoins(ctx, state);
  drawPowerUps(ctx, state);

  // Player
  let playerSprite: Sprite;
  if (state.playerState === 'dead') playerSprite = skinFrames.dead;
  else if (state.playerState === 'jumping') playerSprite = skinFrames.jump;
  else playerSprite = state.runCycle < 0.5 ? skinFrames.run1 : skinFrames.run2;

  const spriteW = playerSprite[0].length * PIXEL_SCALE;
  const spriteH = playerSprite.length * PIXEL_SCALE;
  if (state.activePowerUp?.kind === 'shield') {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.distance / 8);
    ctx.beginPath();
    ctx.arc(PLAYER_X, state.playerY, Math.max(spriteW, spriteH) / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  drawSprite(
    ctx,
    playerSprite,
    PLAYER_X - spriteW / 2,
    state.playerY - PLAYER_HEIGHT / 2 + (PLAYER_HEIGHT - spriteH) / 2,
    PIXEL_SCALE,
  );

  drawTierFlash(ctx, state);

  drawScoreArea(ctx, state);
  drawComboDisplay(ctx, state);
  drawActivePowerUp(ctx, state);
  drawMilestoneFlash(ctx, state);
}
