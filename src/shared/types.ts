/**
 * Cross-game types shared by every game module + the WaitingArcade dispatcher.
 */

export type Phase = 'idle' | 'running' | 'dead';

export interface ScreenShake {
  remaining: number;
  magnitude: number;
}

export interface MilestoneFlash {
  score: number;
  remaining: number;
}

export interface ActivePowerUp<TKind extends string = string> {
  kind: TKind;
  remaining: number;
}

/** Raw input bus the dispatcher fills in from keyboard/pointer/touch. */
export interface RawInput {
  /** True while the primary action button is held. */
  primary: boolean;
  /** True only on the frame the primary button transitions from up→down. */
  primaryEdge: boolean;
}
