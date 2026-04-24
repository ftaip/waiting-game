import {
  initState,
  tick,
  RUNNER_ACHIEVEMENT_IDS,
  type RunnerState,
  type RunnerAchievementId,
} from './engine';
import { draw } from './render';
import { RUNNER_SKIN_IDS, type RunnerSkinId } from './skins';
import type { GameModule } from '../../shared/gameModule';

export const runnerGame: GameModule<RunnerState, RunnerSkinId, RunnerAchievementId> = {
  id: 'runner',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: RUNNER_SKIN_IDS,
  defaultSkin: 'dino',
  achievements: RUNNER_ACHIEVEMENT_IDS,

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

  idlePrompt: 'Tap space to jump',
  deadPrompt: 'Wiped out — press space to try again',
};

export type {
  RunnerState,
  RunnerAchievementId,
} from './engine';
export type { RunnerSkinId } from './skins';
export { RUNNER_SKIN_IDS } from './skins';
export { RUNNER_ACHIEVEMENT_IDS } from './engine';
