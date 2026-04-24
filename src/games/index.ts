import { jellyfishGame } from './jellyfish';
import { runnerGame } from './runner';
import { gravityGame } from './gravity';
import { invadersGame } from './invaders';
import { rhythmGame } from './rhythm';
import type { GameModule } from '../shared/gameModule';

export const GAMES = {
  jellyfish: jellyfishGame,
  runner: runnerGame,
  gravity: gravityGame,
  invaders: invadersGame,
  rhythm: rhythmGame,
} as const;

export type GameId = keyof typeof GAMES;

export const GAME_IDS: GameId[] = Object.keys(GAMES) as GameId[];

/** Lookup a game module by id with a defensive fallback. */
export function getGame(id: GameId): GameModule {
  return (GAMES[id] ?? GAMES.jellyfish) as unknown as GameModule;
}

export { jellyfishGame, runnerGame, gravityGame, invadersGame, rhythmGame };
