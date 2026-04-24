import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type CSSProperties,
} from 'react';
import { useGameLoop } from './shared/useGameLoop';
import { createInputHandler } from './shared/input';
import {
  loadHiScore,
  saveHiScore,
  loadAchievements,
  saveAchievements,
} from './shared/persistence';
import type { Phase } from './shared/types';
import { GAMES, type GameId } from './games';
import type { GameModule } from './shared/gameModule';

export type { GameId } from './games';

export interface WaitingArcadeProps {
  /** Which mini-game to render. Default: 'jellyfish'. */
  game?: GameId;
  width?: number;
  height?: number;
  color?: string;
  paused?: boolean;
  autoStart?: boolean;
  /** Skin id; must be valid for the selected game (defaults to that game's default). */
  skin?: string;
  persistHighScore?: boolean;
  storageKey?: string;
  persistAchievements?: boolean;
  achievementsStorageKey?: string;
  onScoreChange?: (score: number, hi: number) => void;
  onGameOver?: (score: number) => void;
  onComboChange?: (combo: number, multiplier: number) => void;
  onPickup?: (totalThisRun: number) => void;
  onAchievement?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
}

const DEFAULT_STORAGE_KEY = (gameId: string) => `waiting-arcade:hi:${gameId}`;
const DEFAULT_ACH_KEY = (gameId: string) => `waiting-arcade:ach:${gameId}`;

export const WaitingArcade: React.FC<WaitingArcadeProps> = ({
  game = 'jellyfish',
  width,
  height,
  color = 'currentColor',
  paused = false,
  autoStart = false,
  skin,
  persistHighScore = false,
  storageKey,
  persistAchievements = false,
  achievementsStorageKey,
  onScoreChange,
  onGameOver,
  onComboChange,
  onPickup,
  onAchievement,
  className,
  style,
  'aria-label': ariaLabel,
}) => {
  const mod = ((GAMES as Record<string, unknown>)[game] ??
    GAMES.jellyfish) as GameModule;
  const w = width ?? mod.defaultWidth;
  const h = height ?? mod.defaultHeight;
  const resolvedSkin = (skin ?? mod.defaultSkin) as string;
  const hiKey = storageKey ?? DEFAULT_STORAGE_KEY(mod.id);
  const achKey = achievementsStorageKey ?? DEFAULT_ACH_KEY(mod.id);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<ReturnType<typeof createInputHandler> | null>(null);
  const stateRef = useRef<unknown>(null);
  const prevPhaseRef = useRef<Phase>('idle');
  const prevScoreRef = useRef<number>(0);
  const prevMultiplierRef = useRef<number>(1);
  const prevPickupsRef = useRef<number>(0);

  const [resolvedColor, setResolvedColor] = useState(
    color === 'currentColor' ? '#535353' : color,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    if (color === 'currentColor' && wrapperRef.current) {
      const computed = getComputedStyle(wrapperRef.current).color;
      if (computed) setResolvedColor(computed);
    } else if (color !== 'currentColor') {
      setResolvedColor(color);
    }
  }, [color]);

  const loadHi = useCallback((): number => {
    if (!persistHighScore) return 0;
    return loadHiScore(hiKey);
  }, [persistHighScore, hiKey]);

  const saveHi = useCallback(
    (hi: number) => {
      if (!persistHighScore) return;
      saveHiScore(hiKey, hi);
    },
    [persistHighScore, hiKey],
  );

  const loadAch = useCallback((): string[] => {
    if (!persistAchievements) return [];
    return loadAchievements<string>(achKey);
  }, [persistAchievements, achKey]);

  const saveAch = useCallback(
    (ids: readonly string[]) => {
      if (!persistAchievements) return;
      saveAchievements<string>(achKey, [...ids]);
    },
    [persistAchievements, achKey],
  );

  // Initialise game state when the game id, dimensions, or autoStart change.
  useEffect(() => {
    const hi = loadHi();
    const ach = loadAch() as never[];
    const s = mod.init(w, h, hi, ach) as Record<string, unknown>;
    if (autoStart) {
      s.phase = 'running';
    }
    stateRef.current = s;
    prevScoreRef.current = 0;
    prevMultiplierRef.current = 1;
    prevPickupsRef.current = 0;
    prevPhaseRef.current = (s.phase as Phase) ?? 'idle';
    setPhase((s.phase as Phase) ?? 'idle');
  }, [mod, w, h, autoStart, loadHi, loadAch]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    inputRef.current = createInputHandler(canvas);
    return () => inputRef.current?.destroy();
  }, []);

  const loopActive = !paused && stateRef.current !== null;

  useGameLoop((dt) => {
    if (!stateRef.current || !inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const input = inputRef.current.getInput();
    const nextState = mod.tick(stateRef.current, dt, input);

    const score = mod.selectScore(nextState);
    const hiScore = mod.selectHiScore(nextState);
    if (score !== prevScoreRef.current) {
      prevScoreRef.current = score;
      onScoreChange?.(score, hiScore);
    }

    if (mod.selectCombo) {
      const { combo, multiplier } = mod.selectCombo(nextState);
      if (multiplier !== prevMultiplierRef.current) {
        prevMultiplierRef.current = multiplier;
        onComboChange?.(combo, multiplier);
      }
    }

    if (mod.selectPickupTotal) {
      const pickups = mod.selectPickupTotal(nextState);
      if (pickups !== prevPickupsRef.current) {
        prevPickupsRef.current = pickups;
        onPickup?.(pickups);
      }
    }

    const newAch = mod.selectNewAchievements(nextState);
    if (newAch.length > 0) {
      for (const id of newAch) onAchievement?.(id);
      saveAch(mod.selectAchievements(nextState));
    }

    const nextPhase = mod.selectPhase(nextState);
    if (nextPhase === 'dead' && prevPhaseRef.current !== 'dead') {
      onGameOver?.(score);
      saveHi(hiScore);
    }
    if (nextPhase !== prevPhaseRef.current) {
      setPhase(nextPhase);
    }
    prevPhaseRef.current = nextPhase;

    const shake = mod.selectScreenShake(nextState);
    if (shake.remaining > 0) {
      const m = shake.magnitude;
      setShakeOffset({
        x: (Math.random() - 0.5) * 2 * m,
        y: (Math.random() - 0.5) * 2 * m,
      });
    } else if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
      setShakeOffset({ x: 0, y: 0 });
    }

    const deathFlash = mod.selectDeathFlash(nextState);
    const flash = deathFlash > 0 ? Math.min(1, deathFlash / 90) : 0;
    if (flash !== flashAlpha) setFlashAlpha(flash);

    stateRef.current = nextState;

    const ctx = canvas.getContext('2d');
    if (ctx) mod.draw(ctx, nextState, resolvedColor, resolvedSkin);
  }, loopActive);

  // Draw the idle frame once on mount and on cosmetic changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext('2d');
    if (ctx) mod.draw(ctx, stateRef.current, resolvedColor, resolvedSkin);
  }, [mod, resolvedColor, resolvedSkin, w, h]);

  const overlayStyle: CSSProperties = {
    position: 'absolute',
    bottom: '12px',
    left: 0,
    right: 0,
    textAlign: 'center',
    color: resolvedColor,
    fontFamily: 'monospace',
    fontSize: '12px',
    letterSpacing: '1px',
    pointerEvents: 'none',
    userSelect: 'none',
  };

  const showIdlePrompt = phase === 'idle' && !autoStart;
  const showDeadPrompt = phase === 'dead';

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{
        position: 'relative',
        width: w,
        height: h,
        overflow: 'hidden',
        ...style,
      }}
      aria-label={ariaLabel ?? `${mod.id} waiting game`}
    >
      <canvas
        ref={canvasRef}
        width={w}
        height={h}
        style={{
          display: 'block',
          width: w,
          height: h,
          transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
          transition: 'transform 16ms linear',
        }}
        tabIndex={0}
      />
      {flashAlpha > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: resolvedColor,
            opacity: flashAlpha * 0.4,
            mixBlendMode: 'difference',
            pointerEvents: 'none',
          }}
        />
      )}
      {showIdlePrompt && <div style={overlayStyle}>{mod.idlePrompt}</div>}
      {showDeadPrompt && <div style={overlayStyle}>{mod.deadPrompt}</div>}
    </div>
  );
};
