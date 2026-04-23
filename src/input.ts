import type { GameInput } from './engine';

export function createInputHandler(canvas: HTMLCanvasElement): {
  getInput: () => GameInput;
  destroy: () => void;
} {
  let pulseHeld = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      pulseHeld = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      pulseHeld = false;
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    pulseHeld = true;
  };

  const onPointerUp = () => {
    pulseHeld = false;
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) pulseHeld = true;
  };

  const onTouchEnd = () => {
    pulseHeld = false;
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
  canvas.addEventListener('touchstart', onTouchStart, { passive: true });
  canvas.addEventListener('touchend', onTouchEnd);

  let prevHeld = false;

  return {
    getInput(): GameInput {
      // Continuous "thrust" while held; also expose the leading edge for
      // start/restart transitions.
      const pulseEdge = pulseHeld && !prevHeld;
      prevHeld = pulseHeld;
      return { pulse: pulseHeld, pulseEdge };
    },
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    },
  };
}
