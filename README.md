# react-waiting-game

A monocolor React mini-game to distract users while waiting for an LLM (or any long task) to finish.

You play a tiny jellyfish drifting through an underwater channel. Hold the button to thrust upward; release to sink. Avoid the coral and stalactites. Collect pearls, time near-misses, grab power-ups, chase milestones — all in a single canvas, single colour, zero asset files.

- One `<WaitingGame />` component, **zero runtime dependencies**
- One `color` prop (defaults to `currentColor`) tints everything
- Canvas-rendered, all sprites are pure 1-bit pixel art
- Keyboard, pointer, and touch input
- SSR-safe; auto-pauses when the tab is hidden
- Optional `localStorage`-backed best score and achievements

## Install

```bash
npm install react-waiting-game
```

## Quick start

```tsx
import { WaitingGame } from 'react-waiting-game';

function LoadingScreen() {
  return <WaitingGame autoStart />;
}
```

## Use it while waiting on an LLM

```tsx
import { useState } from 'react';
import { WaitingGame } from 'react-waiting-game';

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
      {loading && <WaitingGame autoStart persistHighScore persistAchievements />}
    </div>
  );
}
```

## Controls

| Input | Action |
|-------|--------|
| Hold Space / Arrow Up / W / Touch | Thrust upward |
| Release | Sink under gravity |

One button. The walls are non-lethal — they just gently catch you. Only the coral and stalactites end the run.

## Gameplay features

- **Pearls** — small collectibles in safe gaps between obstacles. Each pearl awards points and builds your combo.
- **Combo multiplier** — chain pearls and near-misses to earn an x2…x5 multiplier on bonuses. The combo decays after ~2.4 s without action.
- **Near-miss bonus** — squeak past an obstacle within ~8 px to score extra points without breaking your combo.
- **Power-ups** (rare):
  - **Shield** — absorbs one obstacle hit, then breaks
  - **Shrink** — your hitbox shrinks for 4.5 s
  - **Slow-mo** — the world runs at 65 % speed for 4.5 s
- **Currents** — translucent flow zones push you up or down; anticipate them.
- **Patterns** — once you're warmed up, obstacles arrive in pre-designed sets (narrow gates, zig-zags, pulse-then-glide).
- **Speed tiers** — every 250 points the world ramps up a notch with a brief screen flash.
- **Milestones** — every 100 points the score pulses big in the centre.
- **Screen shake & flash** on death.
- **Parallax background** — kelp and rocks scroll at ~55 % / 30 % of world speed.
- **Achievements & skins** — unlock skins by clearing achievements (see below).

## Achievements

| ID | How to earn |
|-----|-----|
| `century` | Reach a score of 100 in a single run |
| `half_grand` | Reach a score of 500 in a single run |
| `survivor` | Stay alive for ~60 s |
| `pearl_diver` | Collect 10 pearls in a single run |
| `untouchable` | Pull off 5 near-misses in a single run |

Pass `persistAchievements` to remember unlocks across sessions, and listen via `onAchievement`.

## Skins

Three monocolor skins are bundled (all share the same hitbox):

```tsx
<WaitingGame skin="jellyfish" />
<WaitingGame skin="octopus" />
<WaitingGame skin="paperBoat" />
```

Use `SKIN_IDS` for the full list at runtime.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `width` | `number` | `600` | Canvas width in pixels |
| `height` | `number` | `150` | Canvas height in pixels |
| `color` | `string` | `'currentColor'` | Single color for all elements |
| `paused` | `boolean` | `false` | Pause externally (e.g. when the LLM responds) |
| `autoStart` | `boolean` | `false` | Skip the "hold space" prompt |
| `skin` | `SkinId` | `'jellyfish'` | One of `jellyfish`, `octopus`, `paperBoat` |
| `persistHighScore` | `boolean` | `false` | Store best score in `localStorage` |
| `storageKey` | `string` | `'waiting-game:hi'` | Key for the best score |
| `persistAchievements` | `boolean` | `false` | Store unlocked achievements in `localStorage` |
| `achievementsStorageKey` | `string` | `'waiting-game:achievements'` | Key for achievements |
| `onScoreChange` | `(score, hi) => void` | — | Fired when the score changes |
| `onGameOver` | `(score) => void` | — | Fired when the player is stunned |
| `onComboChange` | `(combo, multiplier) => void` | — | Fired when the multiplier changes |
| `onPearlCollect` | `(totalThisRun) => void` | — | Fired when a pearl is collected |
| `onAchievement` | `(id) => void` | — | Fired when a new achievement is unlocked |
| `className` | `string` | — | Wrapper class |
| `style` | `CSSProperties` | — | Wrapper inline styles |
| `aria-label` | `string` | `'Waiting game'` | Accessibility label |

## Development

```bash
npm install
npm test          # 37 unit tests for the pure game engine
npm run build     # tsup → dist/ (ESM + CJS + .d.ts)
```

### Try the example

```bash
cd example
npm install
npm run dev
```

The example simulates an LLM call and shows the game while waiting. You can switch skins, see live combo/pearl counts, and the unlocked-achievements list.

## License

MIT
