// ── Legacy single-game component (preserved API) ─────────────
export { WaitingGame } from './WaitingGame';
export type {
  WaitingGameProps,
  AchievementId,
  SkinId,
} from './WaitingGame';
export { SKIN_IDS } from './skins';

// ── Multi-game arcade ────────────────────────────────────────
export { WaitingArcade } from './WaitingArcade';
export type { WaitingArcadeProps } from './WaitingArcade';
export { GAMES, GAME_IDS, getGame } from './games';
export type { GameId } from './games';

// Per-game public types & skin lists
export {
  RUNNER_SKIN_IDS,
  RUNNER_ACHIEVEMENT_IDS,
} from './games/runner';
export type {
  RunnerSkinId,
  RunnerAchievementId,
  RunnerState,
} from './games/runner';

export {
  GRAVITY_SKIN_IDS,
  GRAVITY_ACHIEVEMENT_IDS,
} from './games/gravity';
export type {
  GravitySkinId,
  GravityAchievementId,
  GravityState,
} from './games/gravity';

export {
  INVADERS_SKIN_IDS,
  INVADERS_ACHIEVEMENT_IDS,
} from './games/invaders';
export type {
  InvadersSkinId,
  InvadersAchievementId,
  InvadersState,
} from './games/invaders';

export {
  RHYTHM_SKIN_IDS,
  RHYTHM_ACHIEVEMENT_IDS,
} from './games/rhythm';
export type {
  RhythmSkinId,
  RhythmAchievementId,
  RhythmState,
} from './games/rhythm';

// Shared types useful to consumers
export type { Phase, RawInput, ScreenShake } from './shared/types';
export type { GameModule } from './shared/gameModule';
