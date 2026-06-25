# PAXTA

A commercial **Telegram Mini App horror game**. The player walks a dim corridor
and must notice and *report* anomalies before they expire — surviving as their
sanity drains.

Built with **React + TypeScript + Vite + Babylon.js + Zustand**, with the
**Supabase** persistence layer prepared but not yet wired in.

## Quick start

```bash
cp .env.example .env      # fill in values (all optional for local dev)
npm install
npm run dev               # http://localhost:5173
```

Telegram Mini Apps must be served over HTTPS. For local testing, expose the dev
server through a tunnel (e.g. `cloudflared`, `ngrok`) and set the resulting URL
as your bot's Mini App URL via @BotFather.

## Scripts

| Script                 | Purpose                                      |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start the Vite dev server                    |
| `npm run build`        | Type-check (`tsc -b`) and build for production |
| `npm run preview`      | Preview the production build                 |
| `npm run typecheck`    | Type-check without emitting                  |
| `npm run lint`         | ESLint (zero warnings allowed)               |
| `npm run lint:fix`     | ESLint with autofix                          |
| `npm run test`         | Run the Vitest unit suite once               |
| `npm run test:watch`   | Vitest in watch mode                         |
| `npm run format`       | Format with Prettier                         |
| `npm run format:check` | Verify formatting                            |

## Architecture

The codebase is layered so that dependencies only ever point **inward**: UI →
state/app → systems → engine → core → shared. Lower layers never import higher
ones.

```
src/
├── shared/        Framework-free primitives: types, math, logger, constants
├── core/          Engine-agnostic domain core
│   ├── events/      Typed publish/subscribe bus + the GameEventMap contract
│   └── ecs/         Entity · Component · System · World (data-oriented model)
├── engine/        Generic Babylon.js integration (no concrete game content)
│   ├── GameEngine   Render loop owning the world + scene manager
│   ├── scenes/      SceneManager, BaseScene lifecycle, scene contracts/ids
│   ├── player/      First-person PlayerController (locomotion; exposes camera)
│   └── interaction/ Generic interaction framework (registry, ray system, highlight)
├── systems/       Self-contained game systems (one responsibility each)
│   ├── audio/       AudioManager — channel mixing, mute, mobile unlock
│   ├── save/        SaveSystem + SaveRepository port (localStorage adapter)
│   ├── quest/       QuestSystem — quest/objective state machine
│   ├── anomaly/     AnomalySystem — spawn, sanity drain, report/miss scoring
│   └── inventory/   Inventory — pure carried-items store (capacity, carry order)
├── game/          Concrete game: composition root + content (uses engine+systems)
│   ├── Game         The façade React drives; wires every system together
│   ├── scenes/      Concrete locations (CompoundScene + compound/ builders)
│   ├── objects/     Reusable interactables (Door, Switch, Generator, Lamp, PickupItem)
│   ├── persistence/ Per-scene interaction + inventory state
│   └── content/     Quest/objective definitions
├── state/         Zustand stores: gameStore, uiStore, settingsStore, inventoryStore
├── telegram/      Fail-safe wrapper over the Telegram Mini Apps platform
├── services/      External integrations (Supabase client — prepared)
├── app/           App-wide configuration (validated environment)
└── ui/            React components, screens, hooks and styles
```

Pure-logic modules (`core`, `systems`, `shared`) are covered by a Vitest suite
(`*.test.ts` co-located with the code under test).

### Performance

The Babylon engine (~1.1 MB gzip) is **loaded on demand**: `Game.ensureEngine()`
dynamically imports the engine and the first scene only when a run starts, so
the menu and loading screens ship without the renderer. The HUD also selects
*rounded* derived state from the stores to avoid re-rendering every frame.

### Design principles

- **SOLID & Clean Architecture.** Systems depend on narrow interfaces, not
  concretions: the `AnomalySystem` drains sanity through an injected
  `PlayerVitals` sink, and `SaveSystem` persists through a `SaveRepository`
  port, so the local store can be swapped for Supabase without edits upstream.
- **Events over coupling.** Cross-system communication flows through the typed
  `gameEvents` bus carrying plain, serialisable payloads (ids + primitives),
  never live object references.
- **One composition root.** `src/app/Game.ts` wires every system together;
  nothing else needs to know how the pieces fit. React talks to it for commands
  and reads reactive state from the Zustand stores.

## Environment variables

Only `VITE_`-prefixed variables reach the client. See `.env.example`. All are
optional locally; the app degrades gracefully (e.g. it runs standalone outside
Telegram, and offline until Supabase is configured).

## Supabase (prepared)

`src/services/supabase/supabaseClient.ts` lazily creates a client only when
`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are present. The persistence
and leaderboard features will be implemented against this client and the
existing `SaveRepository` port.
