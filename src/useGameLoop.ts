import { useEffect, useRef, useCallback } from 'react';

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

  // Pause on visibility change
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
