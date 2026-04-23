import type { GameState, Obstacle, PowerUpKind } from './engine';
import {
  PIXEL_SCALE,
  CORAL_SHORT,
  CORAL_TALL,
  CORAL_FAN,
  STALACTITE_SHORT,
  STALACTITE_TALL,
  BUBBLE_SMALL,
  BUBBLE_TINY,
  DIGITS,
  BEST_LABEL,
  PEARL,
  POWERUP_SHIELD,
  POWERUP_SHRINK,
  POWERUP_SLOWMO,
  KELP,
  BG_ROCK,
  CURRENT_ARROW_UP,
  CURRENT_ARROW_DOWN,
  X_CHAR,
  type Sprite,
} from './sprites';
import { SKINS, type SkinId } from './skins';

// ── Sprite drawing ───────────────────────────────────────────

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  x: number,
  y: number,
  scale = PIXEL_SCALE,
) {
  for (let row = 0; row < sprite.length; row++) {
    for (let col = 0; col < sprite[row].length; col++) {
      if (sprite[row][col]) {
        ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
      }
    }
  }
}

function drawNumber(
  ctx: CanvasRenderingContext2D,
  n: number,
  x: number,
  y: number,
  digits: number,
  scale: number,
) {
  const str = String(n).padStart(digits, '0');
  const charW = 5 * scale + 2;
  for (let i = 0; i < str.length; i++) {
    const d = parseInt(str[i], 10);
    drawSprite(ctx, DIGITS[d], x + i * charW, y, scale);
  }
}

function obstacleSprite(o: Obstacle): Sprite {
  switch (o.kind) {
    case 'coral_short':
      return CORAL_SHORT;
    case 'coral_tall':
      return CORAL_TALL;
    case 'coral_fan':
      return CORAL_FAN;
    case 'stalactite_short':
      return STALACTITE_SHORT;
    case 'stalactite_tall':
      return STALACTITE_TALL;
  }
}

function powerUpSprite(kind: PowerUpKind): Sprite {
  switch (kind) {
    case 'shield':
      return POWERUP_SHIELD;
    case 'shrink':
      return POWERUP_SHRINK;
    case 'slowmo':
      return POWERUP_SLOWMO;
  }
}

// ── Channel walls ────────────────────────────────────────────

function drawChannel(ctx: CanvasRenderingContext2D, state: GameState) {
  const { width, ceilingY, floorY } = state;
  ctx.fillRect(0, ceilingY, width, 1);
  ctx.fillRect(0, floorY, width, 1);

  const phase = Math.floor(state.distance) % 16;
  for (let x = -phase; x < width; x += 16) {
    ctx.fillRect(x, floorY + 3, 4, 1);
    ctx.fillRect(x + 8, floorY + 6, 2, 1);
    ctx.fillRect(x + 12, floorY + 4, 1, 1);
  }
  for (let x = -phase; x < width; x += 18) {
    ctx.fillRect(x + 4, ceilingY - 3, 3, 1);
    ctx.fillRect(x + 12, ceilingY - 5, 2, 1);
  }
}

// ── Background parallax ──────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, state: GameState) {
  const { floorY } = state;
  ctx.globalAlpha = 0.15;
  for (const r of state.rocks) {
    drawSprite(ctx, BG_ROCK, r.x, floorY - 8, PIXEL_SCALE);
  }
  ctx.globalAlpha = 0.22;
  for (const k of state.kelp) {
    const h = KELP.length * PIXEL_SCALE;
    drawSprite(ctx, KELP, k.x, floorY - h, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;
}

// ── Currents (faint flow indicators) ─────────────────────────

function drawCurrents(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.globalAlpha = 0.18;
  for (const c of state.currents) {
    const arrow = c.force < 0 ? CURRENT_ARROW_UP : CURRENT_ARROW_DOWN;
    const aw = arrow[0].length * PIXEL_SCALE;
    const ah = arrow.length * PIXEL_SCALE;
    const stepX = aw + 8;
    const stepY = ah + 4;
    for (let y = c.y + 2; y + ah < c.y + c.h; y += stepY) {
      const phase = Math.floor((state.distance + y * 7) / 12) % stepX;
      for (let x = c.x - phase; x < c.x + c.w; x += stepX) {
        if (x + aw < c.x || x > c.x + c.w) continue;
        drawSprite(ctx, arrow, x, y, PIXEL_SCALE);
      }
    }
  }
  ctx.globalAlpha = 1;
}

// ── Pearls ───────────────────────────────────────────────────

function drawPearls(ctx: CanvasRenderingContext2D, state: GameState) {
  for (const p of state.pearls) {
    drawSprite(ctx, PEARL, p.x - 4, p.y - 4, PIXEL_SCALE);
  }
}

// ── Power-ups in world ───────────────────────────────────────

function drawPowerUps(ctx: CanvasRenderingContext2D, state: GameState) {
  // Subtle bobbing
  const bob = Math.sin(state.distance / 25) * 2;
  for (const p of state.powerUps) {
    const sprite = powerUpSprite(p.kind);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, p.x - w / 2, p.y - h / 2 + bob, PIXEL_SCALE);
  }
}

// ── Tier dimming overlay ─────────────────────────────────────

function drawTierFlash(ctx: CanvasRenderingContext2D, state: GameState) {
  if (state.tierFlashTimer <= 0) return;
  const alpha = (state.tierFlashTimer / 500) * 0.25;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

// ── Combo & multiplier display ───────────────────────────────

function drawComboDisplay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
) {
  if (state.comboMultiplier <= 1) return;
  const x = 8;
  const y = 8;
  const xCharW = X_CHAR[0].length + 2;
  drawSprite(ctx, X_CHAR, x, y, 1);
  drawNumber(ctx, state.comboMultiplier, x + xCharW, y, 1, 1);
  // Combo timer bar
  if (state.comboTimer > 0) {
    const total = 2400;
    const ratio = state.comboTimer / total;
    const barW = 18;
    ctx.fillRect(x, y + 9, Math.max(1, Math.floor(barW * ratio)), 1);
  }
}

// ── Active power-up HUD ──────────────────────────────────────

function drawActivePowerUp(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.activePowerUp) return;
  const sprite = powerUpSprite(state.activePowerUp.kind);
  const x = 8;
  const y = state.height - sprite.length - 8;
  drawSprite(ctx, sprite, x, y, 1);
  // Time bar underneath
  const total = 4500;
  const ratio = Math.max(0, state.activePowerUp.remaining / total);
  const barW = sprite[0].length;
  ctx.fillRect(x, y + sprite.length + 1, Math.max(1, Math.floor(barW * ratio)), 1);
}

// ── Milestone flash ──────────────────────────────────────────

function drawMilestoneFlash(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!state.milestoneFlash) return;
  const total = 900;
  const t = state.milestoneFlash.remaining / total;
  // Pulse: scale up briefly, then fade.
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

// ── Score area ───────────────────────────────────────────────

function drawScoreArea(ctx: CanvasRenderingContext2D, state: GameState) {
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

// ── Main draw ────────────────────────────────────────────────

export function draw(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  color: string,
  skin: SkinId = 'jellyfish',
) {
  const { width, height } = state;
  const skinFrames = SKINS[skin] ?? SKINS.jellyfish;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;

  // Bubbles (ambient)
  ctx.globalAlpha = 0.35;
  for (const b of state.bubbles) {
    drawSprite(ctx, b.size === 'small' ? BUBBLE_SMALL : BUBBLE_TINY, b.x, b.y, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;

  // Parallax background
  drawBackground(ctx, state);

  // Channel
  drawChannel(ctx, state);

  // Currents (behind obstacles for depth)
  drawCurrents(ctx, state);

  // Obstacles
  for (const o of state.obstacles) {
    drawSprite(ctx, obstacleSprite(o), o.x, o.y, PIXEL_SCALE);
  }

  // Pearls + power-ups
  drawPearls(ctx, state);
  drawPowerUps(ctx, state);

  // Player
  let playerSprite: Sprite;
  if (state.playerState === 'stunned') playerSprite = skinFrames.stunned;
  else if (state.playerState === 'pulsing') playerSprite = skinFrames.pulse;
  else playerSprite = skinFrames.relaxed;

  const spriteW = playerSprite[0].length * PIXEL_SCALE;
  const spriteH = playerSprite.length * PIXEL_SCALE;
  // Shield active = draw a faint ring around the player
  if (state.activePowerUp?.kind === 'shield') {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.distance / 8);
    ctx.beginPath();
    ctx.arc(60, state.playerY, Math.max(spriteW, spriteH) / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  drawSprite(ctx, playerSprite, 60 - spriteW / 2, state.playerY - spriteH / 2, PIXEL_SCALE);

  // Tier dim flash (over the world)
  drawTierFlash(ctx, state);

  // HUD
  drawScoreArea(ctx, state);
  drawComboDisplay(ctx, state);
  drawActivePowerUp(ctx, state);
  drawMilestoneFlash(ctx, state);
}
