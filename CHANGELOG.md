# Changelog

All notable changes to **PAXTA** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are cut per engineering milestone (see
[`docs/IMPLEMENTATION_ROADMAP.md`](./docs/IMPLEMENTATION_ROADMAP.md)) and tagged
`vX.Y.Z-alpha` during the pre-1.0 alpha. Each milestone is independently playable.

## [Unreleased]

Milestone 9 — **First Playable Night**: the first complete, finishable night,
composed entirely from the existing systems (no new core systems). The player
works a first shift at the cotton compound — power up, check the pump, lock the
warehouse, find the fuel can, return to the guard house — across a handful of
subtle anomalies, then the night ends on a summary screen. Atmosphere only; no
monster, no chase, no jump scare.

### Added

- **Night One content** (`game/content/nightOne.ts`, data only):
  - Five **subtle environmental anomalies** — a brief light flicker, the wind
    dropping to nothing, the pump handle shifting position, a distant metallic
    sound and a thickening fog — each disabled by default and rotated in by the
    night's phases (`light` / `wind` / `moveObject` / `playSound` / `atmosphere`
    effects on the M6 engine).
  - A six-phase **`NightDefinition`** (Preparation → Calm → Suspicion → Escalation
    → Peak → Resolution) that raises tension and swaps the active anomaly subset,
    with diegetic supervisor lines at the start, midpoint and dawn.
  - A **`MissionDefinition`** (`First Shift`) whose five objectives form one
    sequence — `activate` the generator, `inspect` the water pump, `activate`
    (lock) the warehouse, `collect` the fuel can, `reach` the guard house —
    reusing existing interaction / inventory / position signals (no new logic).
- **Scenario glue** (minimal, reuses existing patterns): an `Examinable`
  interactable for the pump; a `Door` `initiallyOpen` flag (the warehouse starts
  open, the generator starts off, so both objectives are real tasks); a third
  `fuel-can` pickup.
- **Night ending + metrics**: the shift mission's completion drives the ending —
  the scene sums per-night metrics (completion time, objectives completed,
  anomaly activations, interaction count) and emits a typed `night:completed`
  event; `Game` freezes the run and shows a **Night Complete** screen
  (`nightSummaryStore` → `NightCompleteScreen`) with the summary and a choice of
  another night or the menu.

### Changed

- The compound scene now loads Night One (anomalies + night + shift mission) in
  place of the framework demo content; the demo `anomalies` / `nights` /
  `missions` content modules were removed.

## [0.8.0-alpha] — 2026-06-26

Milestone 8 — **Mission Framework**: a production, data-driven mission framework
supporting all future gameplay without engine changes, integrating the existing
systems with no duplicated logic. No story, no Night One — only the framework.

### Added

- **Mission framework** (`systems/mission/`, pure / Babylon-free):
  - `MissionManager` — compiles each definition once, then on a coarse tick starts
    eligible missions (trigger → start conditions), advances objectives, and
    resolves completion (rewards + chaining), failure and retry; owns shared flags
    and the save/load snapshot.
  - `MissionState` — per-mission objective runtime with dependencies, sequences
    (multi-step), and hidden / optional objectives.
  - Type-keyed registries: **objectives** (reach, interact, inspect, activate,
    collect, deliver, wait, survive), **conditions** (hasItem, phase, flag,
    generator, anomalies), **rewards** (setFlag, enable/trigger anomaly, flash,
    dialogue, startMission) and **triggers** (auto, onPhase, onFlag, afterMission,
    onSignal). Objectives detect progress by **reusing existing signals** through
    `MissionContext` ports — no duplicated logic.
- **Game-layer wiring** (`game/mission/`): a `CompoundMissionContext` feeding the
  ports from the player / inventory / interaction registry+event / night phase /
  anomaly count, and acting through the anomaly + atmosphere systems. Example
  missions in `game/content/missions.ts`; mission state persists in the per-scene save.
- **UI**: a current-mission widget + objective tracker (`MissionWidget`), start /
  complete / fail notifications with a completion animation (`MissionNotice`), and
  a developer panel (`MissionDebugPanel`: complete / skip-objective / restart /
  view conditions) — mirrored through `missionStore`.
- Unit tests for the manager (objectives, deps, optional, fail/retry, save/load;
  suite now 74 tests). Shared `shared/utils/params` accessors (de-duplicated).

### Changed

- `interaction:performed` now carries the interacted object's `id` (so mission
  objectives can detect specific interactions without new logic).
- The per-scene save (`sceneState`) now includes mission progress.

## [0.7.0-alpha] — 2026-06-26

Milestone 7 — **Night Director**: data-driven orchestration of the complete
night — pacing, tension and progression — with no hardcoded scripts. No monster,
no scripted scare; it coordinates the existing atmosphere and anomaly systems.

### Added

- **Night Director framework** (`systems/night/`, pure / Babylon-free):
  - `NightDirector` — advances the six phases (**Preparation, Calm, Suspicion,
    Escalation, Peak, Resolution**) on their configured durations, eases tension
    into the atmosphere, enables each phase's anomaly set, and drives events.
  - `NightState` (phase / elapsed / tension / objectives / fired bookkeeping),
    `NightTimeline` (timeline + weighted-random scheduling: mandatory / optional /
    cooldown / dependency / conditions), `NightSequence` runner.
  - Type-keyed `NightCondition` (generator, hasItem, objective, phase, mission,
    flag) and `NightAction` (trigger/enable/disable anomaly, setTension, flash,
    dialogue, start/complete objective, startSequence, setFlag) registries.
  - `NightContext` ports keep the engine decoupled; the night is pure data.
- **Game-layer wiring** (`game/night/`): a `CompoundNightContext` fulfilling the
  ports — anomalies via the `AnomalyManager`, tension folded into the atmosphere as
  a net bias, world facts and dialogue. The example night is `game/content/nights.ts`.
- **Developer panel** (`NightDirectorPanel`, debug-gated): current phase + tension,
  a clickable timeline visualisation (force-fire events), random/sequence chips,
  live objectives, and skip-phase — mirrored through `nightDebugStore`.
- Unit tests for the director (phases, timeline, skip, trigger; suite now 67 tests).

### Changed

- `AnomalyManager` exposes `activeCount()` for the director's state view.
- The compound now runs a paced night by default (atmosphere tension + the active
  anomaly set ramp through the phases) — environmental only.

## [0.6.0-alpha] — 2026-06-26

Milestone 6 — **Anomaly Engine**: a production, data-driven anomaly framework that
controls environmental change with no hardcoded gameplay logic. No gameplay, no
monster, no scripted horror — only the framework.

### Added

- **Anomaly framework** (`systems/anomaly/`, pure / Babylon-free):
  - `AnomalyManager` — compiles each definition once, then on a coarse tick
    resolves expired anomalies, fires chains, and evaluates idle ones
    (trigger → schedule → conditions → probability), activating at most one
    (weighted) per tick. Holds no anomaly logic itself.
  - `AnomalyScheduler` — random / weighted / cooldown / one-time / repeatable /
    chained / night-progression / dependency rules (pure, unit-tested).
  - Type-keyed registries for **conditions** (position, time, interactable,
    inventory, mission, weather), **effects** (fog, wind, light, lightning,
    atmosphere, moveObject, hideObject, showObject, spawnObject, playSound,
    dialogue) and **triggers** (scheduled, proximity) — a new kind is one factory.
  - `AnomalyContext` ports keep the engine decoupled from Babylon; `ObjectPool`
    backs pooled spawns.
- **Game-layer wiring** (`game/anomaly/`): a `CompoundAnomalyContext` fulfilling
  the ports from the player / interaction registry / inventory / atmosphere, and a
  pooled `SceneObjectController` (move / hide / show / reset / spawn). Atmosphere
  gained additive bias actuators (`addFogBias`/`addWindBias`/`addMoonBias`/
  `flashLightning`/`triggerSound`). Example definitions in
  `game/content/anomalies.ts`, shipped **disabled by default**.
- **Developer overlay** (`AnomalyDebugOverlay`, debug-gated): enable / disable /
  force-fire each anomaly, with live active-state and activation counts, mirrored
  through `anomalyDebugStore`.
- Unit tests for the scheduler and conditions (suite now 60 tests).

### Changed

- `InteractionRegistry` exposes `stateOf(id)` so conditions can read a Stateful
  interactable's field (generator running, door open, …).

## [0.5.0-alpha] — 2026-06-26

Milestone 5 — **Atmosphere Framework**: a reusable, data-driven system that
generates tension from the environment itself — no enemies, anomalies or scripted
scares.

### Added

- **`AtmosphereManager`** (`engine/atmosphere/`) — one reusable update seam tuned
  entirely by `shared/constants/atmosphere.ts`, composing:
  - **Wind**: a gusting strength scalar that sways the canopy and cotton via a GPU
    vertex shader (`WindMaterialPlugin` — no per-instance CPU; trunks stay rigid)
    and drives the wind audio layers.
  - **Sky**: drifting fog density and moonlight, plus rare **silent distant
    lightning** (a flash on the existing moon/ambient lights — no rain) with
    delayed thunder. Lightning respects `prefers-reduced-motion`.
  - **Ambience director**: a pure, tested scheduler for random event timing, long
    quiet periods, and brief **complete-silence** beats.
  - **Procedural ambience**: an asset-free Web-Audio bed (two wind layers, insect
    shimmer, power-line hum) with sparse one-shots (distant dog, metal creak,
    electrical buzz, thunder); folds into the Ambience channel, honours mute,
    suspends with the engine / on tab-hide, and no-ops without Web Audio.
- Unit tests for the `AmbienceDirector` and `WindField` (suite now 47 tests).

### Changed

- `compound/lighting` returns its two lights so the atmosphere can modulate them;
  `CompoundScene` builds, ticks, settings-wires and disposes the `AtmosphereManager`.
- No new lights and no per-frame allocations; the only added render cost is the
  GPU-side wind vertex shader.

## [0.4.0-alpha] — 2026-06-26

Milestone 4 — **Core Gameplay Loop**: the universal interaction + inventory
foundation every future mechanic plugs into, with no change to the foundation
itself. Built on the M3 compound and the M2 player.

### Added

- **Interaction framework** (`engine/interaction/`, fully generic): a common
  `Interactable` interface (with `Activatable` / `Stateful` / `Updatable`), an
  `InteractionRegistry` (mesh→object O(1) ray resolve + id index for save), an
  `InteractionSystem` (throttled camera forward-ray → focus → dispatch), and a
  per-mesh `HighlightController` (cheap `renderOutline`).
- **Reusable world objects** (`game/objects/`): `Door` (frame-independent hinge
  swing, collision-aware), `ToggleControl` → `Switch` / `Generator` (drive
  `Activatable` lights), `Lamp` (`Activatable` + flicker), `PickupItem`
  (pick up / drop into the inventory).
- **Inventory system** (`systems/inventory/`): a pure, framework-free store
  (capacity, uniqueness, carry order) emitting `inventory:changed`;
  `state/inventoryStore` mirrors it for the HUD.
- **Save interaction state**: per-scene interaction + inventory persistence
  (`game/persistence/sceneState`) over a new fail-safe `shared/utils/localStore`.
- **HUD**: a centred interaction prompt, an inventory bar, and a contextual Drop
  action (`Q`/`G` on desktop); `dropItem` added to the `ControllableScene`
  contract.
- **Compound interactives**: a hinged warehouse door, a generator that powers the
  warehouse work-light, a guard-house switch for the entrance light, and loose
  pickups (Rusted Key, Metal Tag).
- Tests for `Inventory` and `InteractionRegistry` (suite now 40 tests).

### Changed

- `PlayerController` is reduced to **locomotion only** and exposes its camera; the
  scene-level interaction system rays from it.
- `CompoundScene` wires the registry, objects, and persistence, and now holds the
  4-light budget via two switched lights (generator work-light + entrance light).
- The interaction framework stays free of gameplay systems: `InteractionContext`
  carries only the event bus, and game-layer objects inject the systems they need
  (`PickupItem` takes an `InventoryPort`) — preserving the inward-only dependency
  rule.

### Removed

- The M2 player-owned interaction probe (`engine/player/interaction/`),
  superseded by the scene-level interaction system.
- The retired `HallwayScene` (the compound is the canonical scene).

## [0.3.0-alpha] — Milestone 3: World & Environment

The explorable **PAXTA cotton compound** (guard house, open warehouse, generator,
pump, instanced cotton field and tree line, fog and moonlight), built on the M2
player as `CompoundScene` with small `compound/` builder modules.

## [0.2.0-alpha] — Milestone 2: Player Core

A production-grade first-person controller: gravity, collision, sprint, crouch,
smoothed look, and head-bob, decomposed under `engine/player/` and driven by the
mobile control layer.

## [0.1.0-alpha] — Milestone 1: Shell & Mobile Controls

The Telegram Mini App shell: loading screen, main menu and settings, a playable
empty level, mobile controls, and a lazily-loaded Babylon engine at a stable
60 FPS.

[0.8.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.8.0-alpha
[0.7.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.7.0-alpha
[0.6.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.6.0-alpha
[0.5.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.5.0-alpha
[0.4.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.4.0-alpha
