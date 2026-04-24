import type { RawInput } from './types';

/**
 * Generic single-button input source. Captures Space / Arrow Up / W and any
 * pointer/touch as the "primary" action and exposes both held + edge state.
 */
export function createInputHandler(canvas: HTMLCanvasElement): {
  getInput: () => RawInput;
  destroy: () => void;
} {
  let held = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      held = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      held = false;
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    held = true;
  };

  const onPointerUp = () => {
    held = false;
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) held = true;
  };

  const onTouchEnd = () => {
    held = false;
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
    getInput(): RawInput {
      const primaryEdge = held && !prevHeld;
      prevHeld = held;
      return { primary: held, primaryEdge };
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
