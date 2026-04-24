import React, { type CSSProperties } from 'react';
import { WaitingArcade } from './WaitingArcade';
import type { SkinId, AchievementId } from './games/jellyfish';

export type { AchievementId, SkinId };

/**
 * Backward-compatible jellyfish-only component. Internally delegates to
 * `<WaitingArcade game="jellyfish" />` so all of the engine, render and HUD
 * code is shared with the rest of the games. The public prop surface is
 * preserved exactly so existing consumers don't need to change anything.
 */
export interface WaitingGameProps {
  width?: number;
  height?: number;
  color?: string;
  paused?: boolean;
  autoStart?: boolean;
  persistHighScore?: boolean;
  storageKey?: string;
  /** Player skin (cosmetic). Default: jellyfish. */
  skin?: SkinId;
  /** Persist achievements list in localStorage. */
  persistAchievements?: boolean;
  achievementsStorageKey?: string;
  onScoreChange?: (score: number, hi: number) => void;
  onGameOver?: (score: number) => void;
  /** Fired when the player's combo multiplier changes. */
  onComboChange?: (combo: number, multiplier: number) => void;
  /** Fired when the total pearl count changes. */
  onPearlCollect?: (totalThisRun: number) => void;
  /** Fired when an achievement is newly unlocked. */
  onAchievement?: (id: AchievementId) => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

/** Pre-existing default keys are kept so previously-saved scores survive. */
const DEFAULT_STORAGE_KEY = 'waiting-game:hi';
const DEFAULT_ACHIEVEMENT_STORAGE_KEY = 'waiting-game:achievements';

export const WaitingGame: React.FC<WaitingGameProps> = ({
  width,
  height,
  color,
  paused,
  autoStart,
  persistHighScore,
  storageKey = DEFAULT_STORAGE_KEY,
  skin,
  persistAchievements,
  achievementsStorageKey = DEFAULT_ACHIEVEMENT_STORAGE_KEY,
  onScoreChange,
  onGameOver,
  onComboChange,
  onPearlCollect,
  onAchievement,
  className,
  style,
  'aria-label': ariaLabel = 'Waiting game',
}) => (
  <WaitingArcade
    game="jellyfish"
    width={width}
    height={height}
    color={color}
    paused={paused}
    autoStart={autoStart}
    skin={skin}
    persistHighScore={persistHighScore}
    storageKey={storageKey}
    persistAchievements={persistAchievements}
    achievementsStorageKey={achievementsStorageKey}
    onScoreChange={onScoreChange}
    onGameOver={onGameOver}
    onComboChange={onComboChange}
    onPickup={onPearlCollect}
    onAchievement={
      onAchievement ? (id) => onAchievement(id as AchievementId) : undefined
    }
    className={className}
    style={style}
    aria-label={ariaLabel}
  />
);
