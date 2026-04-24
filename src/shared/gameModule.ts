import type { Phase, RawInput, ScreenShake } from './types';

/**
 * Contract every mini-game implements so the WaitingArcade dispatcher can
 * drive it without knowing anything game-specific. Every game owns its own
 * state shape; the dispatcher only reads via the supplied selectors.
 */
export interface GameModule<TState = unknown, TSkin extends string = string, TAch extends string = string> {
  /** Stable id used as the WaitingArcade `game` prop value and for storage keys. */
  id: string;
  /** Suggested canvas size — the user can override via props. */
  defaultWidth: number;
  defaultHeight: number;
  /** All available skin ids; first entry is the default if `skin` prop is omitted. */
  skins: readonly TSkin[];
  defaultSkin: TSkin;
  /** All achievement ids this game can emit (for typing / docs). */
  achievements: readonly TAch[];

  init(width: number, height: number, hiScore: number, achievements: TAch[]): TState;
  tick(state: TState, dt: number, input: RawInput): TState;
  draw(ctx: CanvasRenderingContext2D, state: TState, color: string, skin: TSkin): void;

  selectScore(s: TState): number;
  selectHiScore(s: TState): number;
  selectPhase(s: TState): Phase;
  selectScreenShake(s: TState): ScreenShake;
  selectDeathFlash(s: TState): number;
  selectAchievements(s: TState): readonly TAch[];
  selectNewAchievements(s: TState): readonly TAch[];

  /** Optional: combo display in the dispatcher overlay (e.g. for callbacks). */
  selectCombo?(s: TState): { combo: number; multiplier: number };
  /** Optional: pickup count for callback purposes. */
  selectPickupTotal?(s: TState): number;

  /** Idle / dead overlay text. */
  idlePrompt: string;
  deadPrompt: string;
}
