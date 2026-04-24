# react-waiting-game

A tiny **one-button mini-arcade** for filling the void while a long task runs (LLMs, builds, uploads, you name it). Every game is monocolor, pure 1-bit pixel art, single canvas, **zero runtime dependencies**, and shares the same combo / power-up / high-score / achievement framework.

- Pick a game with a single prop: `<WaitingArcade game="runner" />`
- One button: keyboard, pointer, and touch all map to the same primary action
- Tints to any colour via the `color` prop (defaults to `currentColor`)
- SSR-safe; auto-pauses when the tab is hidden
- Optional `localStorage`-backed best score and achievements, namespaced per game
- Same component still ships as `<WaitingGame />` for backward compatibility

## The games

| Game | id | Mechanic | Skins |
|---|---|---|---|
| **Jellyfish Drift** | `jellyfish` | Hold to swim up, release to sink. Avoid coral & stalactites. | `jellyfish`, `octopus`, `paperBoat` |
| **Pixel Runner** | `runner` | Tap to jump, hold for higher jumps. Hop cacti, dodge birds. | `dino`, `ninja`, `frog` |
| **Gravity Flip** | `gravity` | Tap to invert gravity. Arc between floor and ceiling, dodge spikes. | `cube`, `triangle`, `diamond` |
| **Invaders** | `invaders` | Auto-fires bullets to the right. Tap to swap lane — be in the alien's lane to shoot it, out of it when it arrives. | `ship`, `fighter`, `saucer` |
| **Rhythm Tap** | `rhythm` | Notes scroll into a hit zone. Tap on the beat for short notes, hold for long ones. 3 lives. | `bar`, `dot`, `arrow` |

All five games share the same set of features: combo multiplier, near-miss bonus (or its game-specific equivalent), milestone flashes, tier ramp, screen shake, parallax background, three power-ups, and a five-achievement set. Death model varies: most games are one-hit, **rhythm** uses 3 lives.

## Install

```bash
npm install react-waiting-game
```

## Quick start

```tsx
import { WaitingArcade } from 'react-waiting-game';

function LoadingScreen() {
  return <WaitingArcade game="runner" autoStart />;
}
```

## Use it while waiting on an LLM

```tsx
import { useState } from 'react';
import { WaitingArcade } from 'react-waiting-game';

function Chat() {
  const [loading, setLoading] = useState(false);

  async function ask() {
    setLoading(true);
    await fetch('/api/chat', { method: 'POST', body: '...' });
    setLoading(false);
  }

  return (
    <div>
      <button onClick={ask} disabled={loading}>Ask</button>
      {loading && (
        <WaitingArcade
          game="runner"
          autoStart
          persistHighScore
          persistAchievements
        />
      )}
    </div>
  );
}
```

## Controls

Every game uses the **same single-button input**.

| Input | Action |
|-------|--------|
| Hold Space / Arrow Up / W / Touch | Primary action (game-specific) |
| Release | Stop |

- **Jellyfish** — hold to thrust upward, release to sink under gravity. Walls catch you gently; only obstacles end the run.
- **Runner** — tap to jump, hold to jump higher (variable height). Land before the next obstacle.
- **Gravity** — tap to flip gravity. The player accelerates toward the active surface; flip mid-arc to thread between floor and ceiling spikes.
- **Invaders** — your turret auto-fires bullets to the right at a fixed cadence. Tap to swap between the upper and lower lane. Aliens that escape past you break your combo; aliens that touch you while in your lane end the run.
- **Rhythm** — short tap notes scroll right-to-left into the hit zone; tap when one is centred. Long notes are *hold notes* — keep the button down while the bar passes through the cursor and release at the end. Missing a note, breaking a hold, or false-tapping costs one of your three lives.

## `<WaitingArcade />` props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `game` | `'jellyfish' \| 'runner' \| 'gravity' \| 'invaders' \| 'rhythm'` | `'jellyfish'` | Which mini-game to render |
| `width` | `number` | `600` | Canvas width in px |
| `height` | `number` | `150` | Canvas height in px |
| `color` | `string` | `'currentColor'` | Single colour for everything |
| `paused` | `boolean` | `false` | Pause externally (e.g. when the LLM responds) |
| `autoStart` | `boolean` | `false` | Skip the "tap to start" prompt |
| `skin` | `string` | game default | Skin id; must be valid for the selected game |
| `persistHighScore` | `boolean` | `false` | Store best score in `localStorage`, namespaced per game |
| `storageKey` | `string` | `'waiting-arcade:hi:<game>'` | Override key for the best score |
| `persistAchievements` | `boolean` | `false` | Store unlocked achievements in `localStorage`, namespaced per game |
| `achievementsStorageKey` | `string` | `'waiting-arcade:ach:<game>'` | Override key for achievements |
| `onScoreChange` | `(score, hi) => void` | — | Fired when the score changes |
| `onGameOver` | `(score) => void` | — | Fired when the player dies |
| `onComboChange` | `(combo, mult) => void` | — | Fired when the multiplier changes |
| `onPickup` | `(total) => void` | — | Fired when pearls/coins are collected |
| `onAchievement` | `(id) => void` | — | Fired when a new achievement is unlocked |
| `className` / `style` / `aria-label` | — | — | Standard wrapper props |

## Achievements

Every game unlocks five achievements per run.

**Jellyfish (`jellyfish`)**

| ID | How to earn |
|---|---|
| `century` | Reach 100 in a single run |
| `half_grand` | Reach 500 in a single run |
| `survivor` | Stay alive ~60 s |
| `pearl_diver` | Collect 10 pearls in a single run |
| `untouchable` | Pull off 5 near-misses |

**Runner (`runner`)**

| ID | How to earn |
|---|---|
| `runner_century` | Reach 100 in a single run |
| `runner_half_grand` | Reach 500 in a single run |
| `runner_survivor` | Stay alive ~60 s |
| `runner_coin_hoarder` | Collect 10 coins in a single run |
| `runner_dodger` | Pull off 5 near-misses |

**Gravity (`gravity`)**

| ID | How to earn |
|---|---|
| `gravity_century` | Reach 100 in a single run |
| `gravity_half_grand` | Reach 500 in a single run |
| `gravity_survivor` | Stay alive ~60 s |
| `gravity_collector` | Collect 10 coins in a single run |
| `gravity_dodger` | Pull off 5 near-misses |

**Invaders (`invaders`)**

| ID | How to earn |
|---|---|
| `invaders_century` | Reach 100 in a single run |
| `invaders_half_grand` | Reach 500 in a single run |
| `invaders_survivor` | Stay alive ~60 s |
| `invaders_sharpshooter` | Shoot down 10 aliens in a single run |
| `invaders_combo_master` | Pull off 5 close-range kills in a single run |

**Rhythm (`rhythm`)**

| ID | How to earn |
|---|---|
| `rhythm_century` | Reach 100 in a single run |
| `rhythm_half_grand` | Reach 500 in a single run |
| `rhythm_survivor` | Stay alive ~60 s |
| `rhythm_virtuoso` | Hit 25 notes in a single run |
| `rhythm_perfectionist` | Land 5 perfect-timing hits in a single run |

## Skins

```tsx
<WaitingArcade game="jellyfish" skin="octopus"  />
<WaitingArcade game="runner"    skin="ninja"    />
<WaitingArcade game="gravity"   skin="triangle" />
<WaitingArcade game="invaders"  skin="saucer"   />
<WaitingArcade game="rhythm"    skin="dot"      />
```

Use `GAMES[game].skins` for the full list at runtime, or import the per-game constants:

```ts
import {
  SKIN_IDS,
  RUNNER_SKIN_IDS,
  GRAVITY_SKIN_IDS,
  INVADERS_SKIN_IDS,
  RHYTHM_SKIN_IDS,
} from 'react-waiting-game';
```

## Backward compatibility — `<WaitingGame />`

The original `<WaitingGame />` jellyfish-only component still ships unchanged:

```tsx
import { WaitingGame } from 'react-waiting-game';

<WaitingGame autoStart skin="paperBoat" persistHighScore />
```

It uses the original storage key `waiting-game:hi`, so existing high scores carry over. New projects should prefer `<WaitingArcade game="jellyfish" />`.

## Adding a new game

Each game is just a `GameModule` registered in `src/games/index.ts`:

```ts
import type { GameModule } from 'react-waiting-game';

export const myGame: GameModule<MyState, MySkin, MyAch> = {
  id: 'mygame',
  defaultWidth: 600,
  defaultHeight: 150,
  skins: ['default'],
  defaultSkin: 'default',
  achievements: [...],
  init, tick, draw,
  selectScore, selectHiScore, selectPhase,
  selectScreenShake, selectDeathFlash,
  selectAchievements, selectNewAchievements,
  idlePrompt: 'Tap to start',
  deadPrompt: 'Press to retry',
};
```

The shared `useGameLoop`, input bus, persistence helpers, pixel/digit drawing, screen-shake decay, and feedback types all live under `src/shared/`.

## Development

```bash
npm install
npm test          # 151 unit tests across all five game engines
npm run lint      # tsc --noEmit
npm run build     # tsup → dist/ (ESM + CJS + .d.ts)
```

### Try the example

```bash
cd example
npm install
npm run dev
```

The example simulates an LLM call, lets you switch between games and skins live, shows combo/pickup callbacks, and lists unlocked achievements.

## License

MIT
