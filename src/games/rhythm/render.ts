import {
  drawSprite,
  PIXEL_SCALE,
  type Sprite,
} from '../../shared/pixel';
import { drawNumber, BEST_LABEL, X_CHAR } from '../../shared/digits';
import {
  HEART,
  HEART_EMPTY,
  POWERUP_SHIELD,
  POWERUP_SLOWMO,
  POWERUP_DOUBLE,
  STAR,
  STAR_TINY,
} from './sprites';
import {
  RHYTHM_SKINS,
  type RhythmSkinId,
} from './skins';
import {
  PLAYER_X,
  HIT_WINDOW,
  PERFECT_WINDOW,
  TAP_NOTE_HEIGHT,
  HOLD_NOTE_HEIGHT,
  LIVES_START,
  PULSE_LINE_INTERVAL,
} from './constants';
import type {
  RhythmNote,
  RhythmPowerUpKind,
  RhythmState,
} from './engine';

function powerUpSprite(kind: RhythmPowerUpKind): Sprite {
  switch (kind) {
    case 'shield':
      return POWERUP_SHIELD;
    case 'slowmo':
      return POWERUP_SLOWMO;
    case 'double':
      return POWERUP_DOUBLE;
  }
}

function drawStars(ctx: CanvasRenderingContext2D, state: RhythmState) {
  ctx.globalAlpha = 0.3;
  for (const s of state.stars) {
    drawSprite(ctx, s.size === 'tiny' ? STAR_TINY : STAR, s.x, s.y, PIXEL_SCALE);
  }
  ctx.globalAlpha = 1;
}

function drawTrack(ctx: CanvasRenderingContext2D, state: RhythmState) {
  // Faint horizontal scroll-line that indicates the track.
  ctx.globalAlpha = 0.15;
  ctx.fillRect(0, state.cursorY, state.width, 1);
  // Periodic ticks scrolling left to give a rhythmic "metronome" backdrop.
  const phase = Math.floor(state.distance) % PULSE_LINE_INTERVAL;
  for (let x = state.width - phase; x > -8; x -= PULSE_LINE_INTERVAL) {
    ctx.fillRect(x, state.cursorY - 14, 1, 28);
  }
  ctx.globalAlpha = 1;
}

function drawHitZone(ctx: CanvasRenderingContext2D, state: RhythmState) {
  const half = HIT_WINDOW / 2;
  const perfHalf = PERFECT_WINDOW / 2;
  // Outer "good" window (faint).
  ctx.globalAlpha = 0.18;
  ctx.fillRect(PLAYER_X - half, state.cursorY - 16, HIT_WINDOW, 32);
  // Inner "perfect" window (a hair stronger).
  ctx.globalAlpha = 0.32;
  ctx.fillRect(PLAYER_X - perfHalf, state.cursorY - 16, PERFECT_WINDOW, 32);
  ctx.globalAlpha = 1;
  // Cursor centre marker.
  ctx.fillRect(PLAYER_X, state.cursorY - 18, 1, 36);
}

function drawNote(
  ctx: CanvasRenderingContext2D,
  state: RhythmState,
  n: RhythmNote,
) {
  if (n.state === 'completed') {
    return;
  }
  const cy = state.cursorY;
  if (n.kind === 'tap') {
    const h = TAP_NOTE_HEIGHT;
    if (n.state === 'missed') {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(n.x, cy - h / 2, n.w, h);
      ctx.globalAlpha = 1;
      return;
    }
    if (n.state === 'perfect' || n.state === 'good') {
      // Already counted; render a brief flash that fades in the next frames.
      ctx.globalAlpha = 0.55;
      ctx.fillRect(n.x - 2, cy - h / 2 - 2, n.w + 4, h + 4);
      ctx.globalAlpha = 1;
      return;
    }
    ctx.fillRect(n.x, cy - h / 2, n.w, h);
    return;
  }
  // Hold note: outline + stripes for visual distinction.
  const h = HOLD_NOTE_HEIGHT;
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  if (n.state === 'missed') {
    ctx.globalAlpha = 0.3;
  } else if (n.state === 'holding') {
    ctx.globalAlpha = 0.85;
  }
  // Outer rectangle (frame).
  ctx.fillRect(n.x, top, n.w, 1);
  ctx.fillRect(n.x, bottom - 1, n.w, 1);
  ctx.fillRect(n.x, top, 2, h);
  ctx.fillRect(n.x + n.w - 2, top, 2, h);
  // Diagonal stripes inside, scrolling slightly.
  const stripeStep = 6;
  const phase = Math.floor(state.distance) % stripeStep;
  for (let x = n.x + 2 + phase; x < n.x + n.w - 2; x += stripeStep) {
    ctx.fillRect(x, top + 2, 1, h - 4);
  }
  ctx.globalAlpha = 1;
}

function drawNotes(ctx: CanvasRenderingContext2D, state: RhythmState) {
  for (const n of state.notes) drawNote(ctx, state, n);
}

function drawPowerUps(ctx: CanvasRenderingContext2D, state: RhythmState) {
  const bob = Math.sin(state.distance / 25) * 2;
  for (const p of state.powerUps) {
    const sprite = powerUpSprite(p.kind);
    const w = sprite[0].length * PIXEL_SCALE;
    const h = sprite.length * PIXEL_SCALE;
    drawSprite(ctx, sprite, p.x - w / 2, state.cursorY - h / 2 + bob, PIXEL_SCALE);
  }
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  state: RhythmState,
  skin: RhythmSkinId,
) {
  const skinFrames = RHYTHM_SKINS[skin] ?? RHYTHM_SKINS.bar;
  let sprite: Sprite;
  if (state.playerState === 'dead') sprite = skinFrames.dead;
  else if (state.hitFlashTimer > 0) sprite = skinFrames.hit;
  else sprite = skinFrames.idle;

  const w = sprite[0].length * PIXEL_SCALE;
  const h = sprite.length * PIXEL_SCALE;
  const px = PLAYER_X - w / 2;
  const py = state.cursorY - h / 2;

  if (state.activePowerUp?.kind === 'shield') {
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(state.distance / 8);
    ctx.beginPath();
    ctx.arc(PLAYER_X, state.cursorY, Math.max(w, h) / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawSprite(ctx, sprite, px, py, PIXEL_SCALE);
}

function drawLives(ctx: CanvasRenderingContext2D, state: RhythmState) {
  const heartW = HEART[0].length;
  const gap = 2;
  const x = 8;
  const y = 8;
  for (let i = 0; i < LIVES_START; i++) {
    const filled = i < state.lives;
    drawSprite(ctx, filled ? HEART : HEART_EMPTY, x + i * (heartW + gap), y, 1);
  }
}

function drawTierFlash(ctx: CanvasRenderingContext2D, state: RhythmState) {
  if (state.tierFlashTimer <= 0) return;
  const alpha = (state.tierFlashTimer / 500) * 0.25;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

function drawComboDisplay(ctx: CanvasRenderingContext2D, state: RhythmState) {
  if (state.comboMultiplier <= 1) return;
  const x = 8;
  const y = 18;
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

function drawActivePowerUp(ctx: CanvasRenderingContext2D, state: RhythmState) {
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

function drawMilestoneFlash(ctx: CanvasRenderingContext2D, state: RhythmState) {
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

function drawScoreArea(ctx: CanvasRenderingContext2D, state: RhythmState) {
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

function drawLifeLostFlash(ctx: CanvasRenderingContext2D, state: RhythmState) {
  if (state.lifeLostFlashTimer <= 0) return;
  const alpha = (state.lifeLostFlashTimer / 180) * 0.3;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, state.width, state.height);
  ctx.globalAlpha = 1;
}

export function draw(
  ctx: CanvasRenderingContext2D,
  state: RhythmState,
  color: string,
  skin: RhythmSkinId = 'bar',
) {
  const { width, height } = state;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;

  drawStars(ctx, state);
  drawTrack(ctx, state);
  drawHitZone(ctx, state);

  drawNotes(ctx, state);
  drawPowerUps(ctx, state);
  drawCursor(ctx, state, skin);

  drawTierFlash(ctx, state);
  drawLifeLostFlash(ctx, state);

  drawScoreArea(ctx, state);
  drawLives(ctx, state);
  drawComboDisplay(ctx, state);
  drawActivePowerUp(ctx, state);
  drawMilestoneFlash(ctx, state);
}
