import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  type CSSProperties,
} from 'react';
import {
  initState,
  tick,
  type GameState,
  type AchievementId,
} from './engine';
import { draw } from './render';
import { createInputHandler } from './input';
import { useGameLoop } from './useGameLoop';
import { type SkinId } from './skins';

export type { AchievementId, SkinId };

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

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 150;
const DEFAULT_STORAGE_KEY = 'waiting-game:hi';
const DEFAULT_ACHIEVEMENT_STORAGE_KEY = 'waiting-game:achievements';

export const WaitingGame: React.FC<WaitingGameProps> = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  color = 'currentColor',
  paused = false,
  autoStart = false,
  persistHighScore = false,
  storageKey = DEFAULT_STORAGE_KEY,
  skin = 'jellyfish',
  persistAchievements = false,
  achievementsStorageKey = DEFAULT_ACHIEVEMENT_STORAGE_KEY,
  onScoreChange,
  onGameOver,
  onComboChange,
  onPearlCollect,
  onAchievement,
  className,
  style,
  'aria-label': ariaLabel = 'Waiting game',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<ReturnType<typeof createInputHandler> | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const prevPhaseRef = useRef<string>('idle');
  const prevScoreRef = useRef<number>(0);
  const prevMultiplierRef = useRef<number>(1);
  const prevPearlsRef = useRef<number>(0);

  // Resolve "currentColor" → actual computed color
  const [resolvedColor, setResolvedColor] = useState(
    color === 'currentColor' ? '#535353' : color,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Visual feedback state (drives CSS overlay + transform)
  const [shakeOffset, setShakeOffset] = useState({ x: 0, y: 0 });
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [phase, setPhase] = useState<GameState['phase']>('idle');

  useEffect(() => {
    if (color === 'currentColor' && wrapperRef.current) {
      const computed = getComputedStyle(wrapperRef.current).color;
      if (computed) setResolvedColor(computed);
    } else if (color !== 'currentColor') {
      setResolvedColor(color);
    }
  }, [color]);

  // Persistence helpers
  const loadHiScore = useCallback((): number => {
    if (!persistHighScore) return 0;
    try {
      const val = localStorage.getItem(storageKey);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch {
      return 0;
    }
  }, [persistHighScore, storageKey]);

  const saveHiScore = useCallback(
    (hi: number) => {
      if (!persistHighScore) return;
      try {
        localStorage.setItem(storageKey, String(hi));
      } catch {
        /* ignore */
      }
    },
    [persistHighScore, storageKey],
  );

  const loadAchievements = useCallback((): AchievementId[] => {
    if (!persistAchievements) return [];
    try {
      const raw = localStorage.getItem(achievementsStorageKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? (arr as AchievementId[]) : [];
    } catch {
      return [];
    }
  }, [persistAchievements, achievementsStorageKey]);

  const saveAchievements = useCallback(
    (ids: AchievementId[]) => {
      if (!persistAchievements) return;
      try {
        localStorage.setItem(achievementsStorageKey, JSON.stringify(ids));
      } catch {
        /* ignore */
      }
    },
    [persistAchievements, achievementsStorageKey],
  );

  // Initialize state
  useEffect(() => {
    const hiScore = loadHiScore();
    const achievements = loadAchievements();
    const s = initState(width, height, hiScore, achievements);
    if (autoStart) {
      s.phase = 'running';
      s.playerState = 'drifting';
    }
    stateRef.current = s;
    prevScoreRef.current = 0;
    prevMultiplierRef.current = 1;
    prevPearlsRef.current = 0;
  }, [width, height, autoStart, loadHiScore, loadAchievements]);

  // Set up input handler
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
    const nextState = tick(stateRef.current, dt, input);

    // ── Callbacks ──────────────────────────────────────────
    if (nextState.score !== prevScoreRef.current) {
      prevScoreRef.current = nextState.score;
      onScoreChange?.(nextState.score, nextState.hiScore);
    }

    if (nextState.comboMultiplier !== prevMultiplierRef.current) {
      prevMultiplierRef.current = nextState.comboMultiplier;
      onComboChange?.(nextState.combo, nextState.comboMultiplier);
    }

    if (nextState.pearlsCollected !== prevPearlsRef.current) {
      prevPearlsRef.current = nextState.pearlsCollected;
      onPearlCollect?.(nextState.pearlsCollected);
    }

    if (nextState.newAchievements.length > 0) {
      for (const id of nextState.newAchievements) onAchievement?.(id);
      saveAchievements(nextState.achievements);
    }

    if (nextState.phase === 'dead' && prevPhaseRef.current !== 'dead') {
      onGameOver?.(nextState.score);
      saveHiScore(nextState.hiScore);
    }
    if (nextState.phase !== prevPhaseRef.current) {
      setPhase(nextState.phase);
    }
    prevPhaseRef.current = nextState.phase;

    // ── Visual feedback ────────────────────────────────────
    if (nextState.screenShake.remaining > 0) {
      const m = nextState.screenShake.magnitude;
      setShakeOffset({
        x: (Math.random() - 0.5) * 2 * m,
        y: (Math.random() - 0.5) * 2 * m,
      });
    } else if (shakeOffset.x !== 0 || shakeOffset.y !== 0) {
      setShakeOffset({ x: 0, y: 0 });
    }

    const flash =
      nextState.deathFlashTimer > 0
        ? Math.min(1, nextState.deathFlashTimer / 90)
        : 0;
    if (flash !== flashAlpha) setFlashAlpha(flash);

    stateRef.current = nextState;

    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, nextState, resolvedColor, skin);
  }, loopActive);

  // Draw the idle frame once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current) return;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx, stateRef.current, resolvedColor, skin);
  }, [resolvedColor, width, height, skin]);

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
        width,
        height,
        overflow: 'hidden',
        ...style,
      }}
      aria-label={ariaLabel}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          width,
          height,
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
      {showIdlePrompt && (
        <div style={overlayStyle}>Hold space to swim up</div>
      )}
      {showDeadPrompt && (
        <div style={overlayStyle}>Stunned — press space to try again</div>
      )}
    </div>
  );
};
