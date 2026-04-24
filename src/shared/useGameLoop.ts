import { useEffect, useRef, useCallback } from 'react';

/**
 * requestAnimationFrame loop that auto-pauses when the tab is hidden and
 * supplies a clamped (≤ 100ms) dt. Re-export of the original loop hook so
 * games and the dispatcher share one implementation.
 */
export function useGameLoop(
  callback: (dt: number) => void,
  active: boolean,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const loop = useCallback((time: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = time;
    }
    const dt = Math.min(time - lastTimeRef.current, 100);
    lastTimeRef.current = time;
    callbackRef.current(dt);
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  useEffect(() => {
    if (!active) {
      lastTimeRef.current = 0;
      return;
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, loop]);

  useEffect(() => {
    const onVisChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
        lastTimeRef.current = 0;
      } else if (active) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', onVisChange);
    return () => document.removeEventListener('visibilitychange', onVisChange);
  }, [active, loop]);
}
