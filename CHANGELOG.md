# Changelog

All notable changes to **PAXTA** are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
the project aims to follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Releases are cut per engineering milestone (see
[`docs/IMPLEMENTATION_ROADMAP.md`](./docs/IMPLEMENTATION_ROADMAP.md)) and tagged
`vX.Y.Z-alpha` during the pre-1.0 alpha. Each milestone is independently playable.

## [Unreleased]

Milestone 6 — **Anomaly Engine**: a production, data-driven anomaly framework that
controls environmental change with no hardcoded gameplay logic. No gameplay, no
monster, no scripted horror — only the framework. Pending approval and tag.

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

[0.5.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.5.0-alpha
[0.4.0-alpha]: https://github.com/timfounder/paxta/releases/tag/v0.4.0-alpha
