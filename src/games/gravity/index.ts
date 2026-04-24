import {
  initState,
  tick,
  GRAVITY_ACHIEVEMENT_IDS,
  type GravityState,
  type GravityAchievementId,
} from './engine';
import { draw } from './render';
import { GRAVITY_SKIN_IDS, type GravitySkinId } from './skins';
import type { GameModule } from '../../shared/gameModule';

export const gravityGame: GameModule<GravityState, GravitySkinId, GravityAchievementId> = {
  id: 'gravity',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: GRAVITY_SKIN_IDS,
  defaultSkin: 'cube',
  achievements: GRAVITY_ACHIEVEMENT_IDS,

  init: (w, h, hi, ach) => initState(w, h, hi, ach),
  tick,
  draw,

  selectScore: (s) => s.score,
  selectHiScore: (s) => s.hiScore,
  selectPhase: (s) => s.phase,
  selectScreenShake: (s) => s.screenShake,
  selectDeathFlash: (s) => s.deathFlashTimer,
  selectAchievements: (s) => s.achievements,
  selectNewAchievements: (s) => s.newAchievements,
  selectCombo: (s) => ({ combo: s.combo, multiplier: s.comboMultiplier }),
  selectPickupTotal: (s) => s.coinsCollected,

  idlePrompt: 'Tap space to flip gravity',
  deadPrompt: 'Splat — press space to try again',
};

export type { GravityState, GravityAchievementId } from './engine';
export type { GravitySkinId } from './skins';
export { GRAVITY_SKIN_IDS } from './skins';
export { GRAVITY_ACHIEVEMENT_IDS } from './engine';
