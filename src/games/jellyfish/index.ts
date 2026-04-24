import {
  initState,
  tick,
  ACHIEVEMENT_IDS,
  type GameState,
  type GameInput,
  type AchievementId,
} from './engine';
import { draw } from './render';
import { SKINS, SKIN_IDS, type SkinId } from './skins';
import type { GameModule } from '../../shared/gameModule';
import type { RawInput } from '../../shared/types';

function adaptInput(raw: RawInput): GameInput {
  return { pulse: raw.primary, pulseEdge: raw.primaryEdge };
}

export const jellyfishGame: GameModule<GameState, SkinId, AchievementId> = {
  id: 'jellyfish',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: SKIN_IDS,
  defaultSkin: 'jellyfish',
  achievements: ACHIEVEMENT_IDS,

  init: (w, h, hi, ach) => initState(w, h, hi, ach),
  tick: (s, dt, input) => tick(s, dt, adaptInput(input)),
  draw,

  selectScore: (s) => s.score,
  selectHiScore: (s) => s.hiScore,
  selectPhase: (s) => s.phase,
  selectScreenShake: (s) => s.screenShake,
  selectDeathFlash: (s) => s.deathFlashTimer,
  selectAchievements: (s) => s.achievements,
  selectNewAchievements: (s) => s.newAchievements,
  selectCombo: (s) => ({ combo: s.combo, multiplier: s.comboMultiplier }),
  selectPickupTotal: (s) => s.pearlsCollected,

  idlePrompt: 'Hold space to swim up',
  deadPrompt: 'Stunned — press space to try again',
};

void SKINS;

// ── Re-exports for the public package surface and back-compat ──

export {
  initState,
  tick,
  ACHIEVEMENT_IDS,
  type GameState,
  type GameInput,
  type AchievementId,
} from './engine';
export type {
  Obstacle,
  ObstacleKind,
  ObstacleAnchor,
  PowerUpKind,
  PowerUpPickup,
  Pearl,
  Current,
  Bubble,
  BackgroundProp,
  PlayerState,
} from './engine';
export { draw } from './render';
export { SKINS, SKIN_IDS, type SkinId, type SkinFrames } from './skins';
