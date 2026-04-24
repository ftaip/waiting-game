import {
  drawSprite,
  spriteSize,
  PIXEL_SCALE,
  type Sprite,
} from '../../shared/pixel';
import { drawNumber, BEST_LABEL, X_CHAR } from '../../shared/digits';
import {
  SPIKE_SMALL,
  SPIKE_TALL,
  SPIKE_CLUSTER,
  COIN,
  POWERUP_SHIELD,
  POWERUP_SHRINK,
  POWERUP_SLOWMO,
  STAR,
  STAR_TINY,
  ARROW_UP,
  ARROW_DOWN,
} from './sprites';
import {
  GRAVITY_SKINS,
  type GravitySkinId,
} from './skins';
import {
  PLAYER_X,
  PLAYER_HEIGHT,
  GRID_SPACING,
} from './constants';
import type {
  GravityPowerUpKind,
  GravitySpike,
  GravityState,
} from './engine';

function spikeSprite(s: GravitySpike): Sprite {
  switch (s.kind) {
    case 'small':
      return SPIKE_SMALL;
    case 'tall':
      return SPIKE_TALL;
    case 'cluster':
      return SPIKE_CLUSTER;
  }
}

function powerUpSprite(kind: GravityPowerUpKind): Sprite {
  switch (kind) {
    case 'shield':
      return POWERUP_SHIELD;
    case 'shrink':
      return POWERUP_SHRINK;
    case 'slowmo':
      return POWERUP_SLOWMO;
  }
}

/** Draw a sprite vertically mirrored (used for ceiling-anchored spikes). */
function drawSpriteFlipped(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale = PIXEL_SCALE,
) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col]) {
        const drawY = y + (sprite.length - 1 - row) * scale;
        ctx.fillRect(x + col * scale, drawY, scale, scale);
      }
    }
  }
}

function drawChannel(ctx: CanvasRenderingContext2D, state: GravityState) {
  const { width, ceilingY, floorY } = state;
  ctx.fillRect(0, ceilingY, width, 1);
  ctx.fillRect(0, floorY, width, 1);
  // Sparse mid-line dot grid for vertical reference.
  const phase = Math.floor(state.distance) % GRID_SPACING;
  ctx.globalAlpha = 0.15;
  for (let x = -phase; x < width; x += GRID_SPACING) {
    for (let y = ceilingY + 12; y < floorY; y += 12) {
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}

function drawStars(ctx: CanvasRenderingContext2D, state: GravityState) {
  ctx.globalAlpha = 0.35;
  for (const s of state.stars) {
    const sprite = s.size === 'tiny' ? STAR_TINY : STAR;
    drawSprite(ctx, sprite, s.x, s.y, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;
}

function drawCoins(ctx: CanvasRenderingContext2D, state: GravityState) {
  for (const c of state.coins) {
    drawSprite(ctx, COIN, c.x - 4, c.y - 4, PIXEL_SCALE);
  }
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: GravityState) {
  const bob = Math.sin(state.distance / 25) * 2;
  for (const p of state.powerUps) {
    const sprite = powerUpSprite(p.kind);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, p.x - w / 2, p.y - h / 2 + bob, PIXEL_SCALE);
  }
}

function drawTierFlash(ctx: CanvasRenderingContext2D, state: GravityState) {
  if (state.tierFlashTimer <= 0) return;
  const alpha = (state.tierFlashTimer / 500) * 0.25;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

function drawComboDisplay(ctx: CanvasRenderingContext2D, state: GravityState) {
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

function drawActivePowerUp(ctx: CanvasRenderingContext2D, state: GravityState) {
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

function drawMilestoneFlash(ctx: CanvasRenderingContext2D, state: GravityState) {
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

function drawScoreArea(ctx: CanvasRenderingContext2D, state: GravityState) {
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

function drawGravityIndicator(ctx: CanvasRenderingContext2D, state: GravityState) {
  const arrow = state.gravityDir === 1 ? ARROW_DOWN : ARROW_UP;
  ctx.globalAlpha = 0.55;
  drawSprite(ctx, arrow, 8, 28, 1);
  ctx.globalAlpha = 1;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GravityState,
  color: string,
  skin: GravitySkinId = 'cube',
) {
  const { width, height } = state;
  const skinFrames = GRAVITY_SKINS[skin] ?? GRAVITY_SKINS.cube;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;

  drawStars(ctx, state);
  drawChannel(ctx, state);

  // Spikes (mirror ceiling-anchored)
  for (const s of state.spikes) {
    const sprite = spikeSprite(s);
    if (s.anchor === 'ceiling') {
      drawSpriteFlipped(ctx, sprite, s.x, s.y, PIXEL_SCALE);
    } else {
      drawSprite(ctx, sprite, s.x, s.y, PIXEL_SCALE);
    }
  }

  drawCoins(ctx, state);
  drawPowerUps(ctx, state);

  // Player
  let playerSprite: Sprite;
  if (state.playerState === 'dead') playerSprite = skinFrames.dead;
  else if (state.playerState === 'flipping' || state.airborne) playerSprite = skinFrames.flip;
  else playerSprite = skinFrames.idle;

  const onCeiling = state.gravityDir === -1 && !state.airborne;
  const spriteW = playerSprite[0].length * PIXEL_SCALE;
  const spriteH = playerSprite.length * PIXEL_SCALE;
  const px = PLAYER_X - spriteW / 2;
  const py = state.playerY - PLAYER_HEIGHT / 2 + (PLAYER_HEIGHT - spriteH) / 2;

  if (state.activePowerUp?.kind === 'shield') {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.distance / 8);
    ctx.beginPath();
    ctx.arc(PLAYER_X, state.playerY, Math.max(spriteW, spriteH) / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  if (onCeiling && skinFrames.mirrorOnFlip) {
    drawSpriteFlipped(ctx, playerSprite, px, py, PIXEL_SCALE);
  } else {
    drawSprite(ctx, playerSprite, px, py, PIXEL_SCALE);
  }

  drawTierFlash(ctx, state);

  drawScoreArea(ctx, state);
  drawGravityIndicator(ctx, state);
  drawComboDisplay(ctx, state);
  drawActivePowerUp(ctx, state);
  drawMilestoneFlash(ctx, state);
}
