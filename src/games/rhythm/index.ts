import {
  initState,
  tick,
  RHYTHM_ACHIEVEMENT_IDS,
  type RhythmState,
  type RhythmAchievementId,
} from './engine';
import { draw } from './render';
import { RHYTHM_SKIN_IDS, type RhythmSkinId } from './skins';
import type { GameModule } from '../../shared/gameModule';

export const rhythmGame: GameModule<RhythmState, RhythmSkinId, RhythmAchievementId> = {
  id: 'rhythm',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: RHYTHM_SKIN_IDS,
  defaultSkin: 'bar',
  achievements: RHYTHM_ACHIEVEMENT_IDS,

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
  selectPickupTotal: (s) => s.notesHit,

  idlePrompt: 'Tap on the beat — hold for long notes',
  deadPrompt: 'Off-beat — press space to retry',
};

export type {
  RhythmState,
  RhythmAchievementId,
  RhythmNote,
  RhythmNoteKind,
  RhythmHitState,
  RhythmPowerUpKind,
} from './engine';
export type { RhythmSkinId } from './skins';
export { RHYTHM_SKIN_IDS } from './skins';
export { RHYTHM_ACHIEVEMENT_IDS } from './engine';
