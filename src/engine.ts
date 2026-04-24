// Back-compat re-export. The jellyfish engine now lives under
// src/games/jellyfish/. Existing imports from `react-waiting-game/engine`
// or relative `../src/engine` (used by the test suite) keep working.
export * from './games/jellyfish/engine';
