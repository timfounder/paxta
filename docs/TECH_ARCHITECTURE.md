# TECH ARCHITECTURE

> Owner of: layering, folder structure, system inventory, data flow, and the
> rules for where new code goes. CODING_STANDARDS owns *how* you write a line of
> code; this owns *where it lives and what it may depend on*.

## 1. Stack (authoritative)

| Concern | Choice | Notes |
| --- | --- | --- |
| UI | **React 18** + **TypeScript** (strict) | Function components only. |
| Build | **Vite 6** | Path aliases, lazy chunks. |
| 3D | **Babylon.js 7** (`@babylonjs/core`) | Loaded on demand (§7). |
| State | **Zustand 5** | `gameStore`, `uiStore`, `settingsStore`. |
| Platform | **Telegram Mini Apps** (official `telegram-web-app.js`) | Wrapped, fail-safe. |
| Backend | **Supabase** | *Prepared, not wired* (§8). |
| Tests | **Vitest** | Pure-logic units. |

No other UI framework, state library, or 3D engine may be added without an
architecture decision recorded in this file.

## 2. The dependency rule

Layers form a strict inward graph. **Imports point inward only.** An outer layer
may import an inner layer; an inner layer may never import an outer one.

```
ui ──▶ app ──▶ game ──▶ engine ──▶ core ──▶ shared
        │        │         │         ▲
        └─ state ┴─ systems ┴────────┘ (systems/state/telegram/services
                                         depend on core+shared only)
```

Precise rules (binding, enforced in review):

- **R-DEP-1** `shared` depends on **nothing** internal. Pure primitives only.
- **R-DEP-2** `core` (events, ecs) depends on `shared` only. **No Babylon, no
  React, no domain knowledge.** The event map carries ids + primitives, never
  live objects (§5).
- **R-DEP-3** `engine` (Babylon) depends on `core` + `shared`. It is **generic**:
  no concrete game content, no `@systems` imports.
- **R-DEP-4** `systems` (audio, save, quest, anomaly, inventory) depend on `core` +
  `shared`. Systems depend on **interfaces (ports)**, never on stores or each
  other's concretes. The `engine` interaction framework defines only its own
  `InteractionContext` (events) and never imports a system — game-layer objects
  inject the systems they need (e.g. `PickupItem` takes an `InventoryPort`).
- **R-DEP-5** `game` is the **concrete content + composition root**: scenes,
  content data, and `Game`. It may import `engine` + `systems` + `state`.
- **R-DEP-6** `state`, `telegram`, `services` depend on `core`/`shared`/`app`.
- **R-DEP-7** `ui` is the outermost layer: React only, talks to `Game` (commands)
  and to stores (reactive reads). UI never imports `engine`/`systems` directly.
- **R-DEP-8** `app` holds app-wide config (validated `env`). It has no UI and no
  Babylon.

If you need to break a rule, you have found a design problem — fix the design.

## 3. Folder map

```
src/
├── shared/      types (branded, spatial, function), utils (logger, result,
│                 id, math), constants  ── pure, framework-free
├── core/
│   ├── events/  EventBus<TMap>, gameEvents + GameEventMap (the contract)
│   └── ecs/     Entity · Component · System · World · LifetimeSystem
├── engine/      GameEngine (render loop), scenes/ (SceneManager, BaseScene,
│                 contracts, sceneIds), player/ (motor, look, head-bob),
│                 interaction/ (registry, system, highlight, interfaces),
│                 atmosphere/ (manager, wind, sky, ambience director + synth)
│                 ── generic Babylon
├── systems/     audio/ save/ quest/ inventory/, anomaly/ (data-driven engine:
│                 manager, scheduler, condition/effect/trigger registries, pool)
│                 ── game systems
├── game/        Game (composition root), scenes/ (CompoundScene + compound/
│                 builders), objects/ (Door, Switch, Generator, Lamp, PickupItem),
│                 anomaly/ (context + actuators wiring the engine to the scene),
│                 persistence/ (per-scene state), content/ (quests, anomalies)
├── state/       gameStore · uiStore · settingsStore · inventoryStore ·
│                 anomalyDebugStore (Zustand)
├── telegram/    TelegramService (+ typings)  ── fail-safe platform wrapper
├── services/    supabase/ (prepared client)
├── app/         config/env  ── validated environment
└── ui/          App, screens/, components/, hooks/, styles/
```

Path aliases (keep `vite.config.ts` and `tsconfig.app.json` in sync):
`@shared @core @engine @systems @game @state @telegram @services @app @ui`.

**R-FLD-1** A new file's folder is determined by its layer (§2), not by feature.
**R-FLD-2** Co-locate types with their module (`*.types.ts`) and tests (`*.test.ts`).
**R-FLD-3** No barrel `index.ts` re-export hubs; import the exact module (keeps
chunks tree-shakeable and dependencies explicit).

## 4. System inventory & responsibilities

| System | File | Single responsibility |
| --- | --- | --- |
| `GameEngine` | `engine/GameEngine.ts` | Owns Babylon engine + render loop; drives `World` + `SceneManager`. |
| `SceneManager` | `engine/scenes/SceneManager.ts` | Registers scenes; transitions (full unload → load). |
| `PlayerController` | `engine/player/` | Orchestrates the first-person player: composes `PlayerMotor` (gravity/collision/sprint/crouch), `LookController` (smoothed look), and `HeadBob`; keeps the player entity's transform in sync. **Locomotion only** — exposes its camera for the interaction system. |
| `InteractionSystem` | `engine/interaction/` | Throttled camera-ray probe: resolves the focused `Interactable` via the registry, drives highlight + prompt events, dispatches `interact`. Generic — knows no concrete object type. |
| `InteractionRegistry` | `engine/interaction/` | Per-scene catalogue: mesh→object (O(1) ray resolve) + id index for `Stateful` snapshot/restore. |
| `World` / ECS | `core/ecs/` | Entity registry + system scheduler + lifecycle events. |
| `AnomalySystem` | `systems/anomaly/` | Anomaly spawn, lifetime, report/miss scoring, Sanity sinks. |
| `AudioManager` | `systems/audio/` | Channel mixing, mute, mobile unlock. |
| `SaveSystem` | `systems/save/` | Versioned persistence via a `SaveRepository` port. |
| `QuestSystem` | `systems/quest/` | Directive/objective state machine. |
| `Inventory` | `systems/inventory/` | Pure carried-items store (capacity, uniqueness, carry order); emits `inventory:changed`. Framework-free. |
| `AtmosphereManager` | `engine/atmosphere/` | Reusable, data-driven environmental tension: wind (GPU vertex sway), fog/moonlight drift, silent lightning, and a procedural Web-Audio ambience bed. No enemies/anomalies/scares. |
| `AnomalyManager` | `systems/anomaly/` | Data-driven anomaly engine: compiles definitions, schedules (random/weighted/cooldown/once/chain/deps/night), and runs modular condition/effect/trigger kinds through injected ports. No hardcoded anomaly logic. |
| `Game` | `game/Game.ts` | Composition root + façade for React. |

**R-SYS-1** Each system has exactly one responsibility (SRP). If you can't name it
in one sentence, split it.

## 5. Communication: the event bus

Cross-system communication uses the typed bus `gameEvents`
(`core/events/gameEvents.ts`), an instance of `TypedEventBus<GameEventMap>`.

- **R-EVT-1 Payloads are plain, serialisable data**: branded ids + primitives.
  **Never** put a live `Entity`, Babylon object, or class instance on the bus.
- **R-EVT-2 Event names are `domain:past-tense-fact`** (`anomaly:resolved`,
  `player:died`). The name states something that *happened*, not a command.
- **R-EVT-3 Subscribe to the narrowest surface.** Consumers that only listen take
  `ReadonlyEventBus`; only owners get `emit`.
- **R-EVT-4 Handlers must be cheap and synchronous-safe.** No `await` in a
  handler that blocks the loop; schedule heavy work.
- **R-EVT-5** New events are added to `GameEventMap` (the single contract) with a
  documented payload. This keeps the event surface auditable.

Two communication channels exist and must not be confused:
- **The event bus** — facts broadcast between systems.
- **The stores** — reactive state React renders from (§6).

## 6. State management (Zustand)

Five stores (mirrors UI/gameplay split); the last two are read-only projections:

- `gameStore` — **game progression**: phase, Sanity, score, hits/misses, scene.
  It is the **only writer** of Sanity/score; it mirrors key facts to the bus.
- `uiStore` — **presentation**: current screen, modal, HUD visibility, toast,
  the focused interaction prompt. Holds no gameplay data.
- `settingsStore` — **preferences**: volumes, mute, haptics, debug. Survives resets.
- `inventoryStore` — **read-only mirror** of the `Inventory` system for the HUD.
  The simulation stays the single writer; `Game` forwards `inventory:changed`
  here (R-ST-1), so the UI renders a projection, never gameplay state.
- `anomalyDebugStore` — **read-only mirror** of the `AnomalyManager`'s debug view
  for the developer overlay; the manager pushes a snapshot on every change.

Rules:
- **R-ST-1** Systems read/write game state **through injected sinks**
  (`PlayerVitals`, `ScoreBoard`), not by importing stores. Only `Game` adapts
  stores to sinks. This keeps systems testable and store-agnostic (DIP).
- **R-ST-2** React selects **derived, minimal** values; never the whole store.
  Select rounded/coarse values for high-frequency state (the HUD's Sanity
  selector rounds — PERFORMANCE).
- **R-ST-3** Store action types are declared as function properties (not method
  shorthand) so references stay unbound-safe (CODING_STANDARDS).
- **R-ST-4** No business logic in components. Components dispatch and render.

## 7. Lazy engine loading (the performance-critical seam)

Babylon (~1.1 MB gzip) is **not** in the initial bundle. `Game` is constructed at
app start with **no engine**; `Game.ensureEngine()` dynamically imports
`@engine/GameEngine` and the first scene on the first `newGame()`.

- **R-LAZY-1** Nothing in the initial import graph (anything reachable from
  `main.tsx` → `App` → `useGame` → `Game` *statically*) may import Babylon. Use
  `import type` for engine types in `Game`; load runtime via `import()`.
- **R-LAZY-2** Scenes (which import Babylon) are loaded only inside
  `Game.createEngine`. Adding a scene must not add a static Babylon import to the
  shell.
- **R-LAZY-3** Verify after any change to `Game`/`useGame`: the production build
  must still emit a separate `babylon-*.js` chunk and a small entry chunk
  (PERFORMANCE has the budget).

## 8. Persistence & backend

- **Local first.** `SaveSystem` persists via the `SaveRepository` **port**; the
  shipped adapter is `LocalStorageSaveRepository`. Saves are versioned
  (`SAVE_VERSION`) and migrated on load.
- **R-BAK-1** A cloud/Supabase save is a **new adapter** implementing the same
  port — no changes to `SaveSystem` or callers (Open/Closed).
- **R-BAK-2** Supabase (`services/supabase`) is **prepared, not wired**: the client
  is created lazily only when env credentials exist. The game must run fully
  offline until persistence/leaderboards are implemented.
- **R-BAK-3** Telegram `initData` is the identity for any future server call and
  **must be verified server-side**; never trust client-reported identity.

## 9. Telegram integration

`TelegramService` (`telegram/`) is the **only** module that touches
`window.Telegram.WebApp`. It is fail-safe: every method degrades to a no-op or
sensible default outside Telegram (desktop dev).

- **R-TG-1** No other module reads `window.Telegram` directly.
- **R-TG-2** Theme → CSS variables flows through `TelegramService` (UI_GUIDELINES
  consumes the `--tg-*` tokens). 
- **R-TG-3** Haptics, back button, viewport, closing-confirmation are all routed
  through the service; story may use them (STORY R-NAR-3) but plumbing stays here.

## 10. Composition root

`Game` is the **only** place systems are constructed and wired. It:
constructs systems, builds sinks from stores (R-ST-1), defines content, wires
events → stores/UI/haptics, wires settings → audio, and lazily owns the engine.

- **R-COMP-1** New wiring goes in `Game`, not scattered across modules.
- **R-COMP-2** Global singletons are limited and documented: `gameEvents`,
  `telegram`, the three Zustand stores. No new ambient singletons without an entry
  here.

## 11. Adding code — decision guide

| You are adding… | Put it in… | Must obey |
| --- | --- | --- |
| A pure helper/type | `shared` | R-DEP-1 |
| A new event | `core/events/gameEvents` (`GameEventMap`) | R-EVT-1..5 |
| A reusable ECS behaviour | `core/ecs` (a `System`) | R-DEP-2 |
| Babylon-generic capability | `engine` | R-DEP-3, R-LAZY |
| A game system (one responsibility) | `systems/<name>` | R-DEP-4, R-SYS-1, ports |
| A location | `game/scenes` | WORLD §6 |
| Content (quests, anchors) | `game/content` | GAMEPLAY §8 |
| Reactive UI | `ui` | R-DEP-7, R-ST-* |
| Platform capability | `telegram` | R-TG-1 |

## 12. Quality gates (must pass before merge)

`npm run typecheck` · `npm run lint` (zero warnings) · `npm run test` ·
`npm run build`. Plus a manual one-Shift play-through for gameplay changes.
These gates are non-negotiable; CI enforces them (ROADMAP).
