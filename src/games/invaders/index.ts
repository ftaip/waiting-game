import {
  initState,
  tick,
  INVADERS_ACHIEVEMENT_IDS,
  type InvadersState,
  type InvadersAchievementId,
} from './engine';
import { draw } from './render';
import { INVADERS_SKIN_IDS, type InvadersSkinId } from './skins';
import type { GameModule } from '../../shared/gameModule';

export const invadersGame: GameModule<InvadersState, InvadersSkinId, InvadersAchievementId> = {
  id: 'invaders',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: INVADERS_SKIN_IDS,
  defaultSkin: 'ship',
  achievements: INVADERS_ACHIEVEMENT_IDS,

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
  selectPickupTotal: (s) => s.killsTotal,

  idlePrompt: 'Tap space to swap lane',
  deadPrompt: 'Boom — press space to redeploy',
};

export type {
  InvadersState,
  InvadersAchievementId,
  Alien,
  AlienKind,
  Bullet,
  InvadersLane,
  InvadersPowerUpKind,
} from './engine';
export type { InvadersSkinId } from './skins';
export { INVADERS_SKIN_IDS } from './skins';
export { INVADERS_ACHIEVEMENT_IDS } from './engine';
