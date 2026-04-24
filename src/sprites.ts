// Back-compat re-export. Jellyfish-specific sprites now live under
// src/games/jellyfish/sprites; generic digit / BEST label / X char sprites
// (used by every game's HUD) live under src/shared/digits.
export * from './games/jellyfish/sprites';
export { DIGITS, BEST_LABEL, X_CHAR } from './shared/digits';
