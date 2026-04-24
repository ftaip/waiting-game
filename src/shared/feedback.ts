import type { ScreenShake } from './types';

export function decayShake(shake: ScreenShake, dt: number): ScreenShake {
  const remaining = Math.max(0, shake.remaining - dt);
  return { remaining, magnitude: remaining > 0 ? shake.magnitude : 0 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
