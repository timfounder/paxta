## Milestone M6 — Anomaly Engine (data-driven framework)

**Scope** (a production anomaly framework; no gameplay, no monster, no scripted
horror):

- Architecture: `AnomalyManager`, `AnomalyDefinition`, `AnomalyScheduler`,
  `AnomalyCondition`, `AnomalyTrigger`, `AnomalyEffect` — every anomaly data-driven;
  no anomaly requires an engine change.
- Scheduling: random, weighted, cooldowns, one-time, repeatable, chained, night
  progression, dependency rules.
- Conditions: player position, time, generator/door (interactable) state, weather,
  inventory, mission progress.
- Effects: move / hide / spawn objects, play sounds, change lighting / fog / wind,
  modify atmosphere, trigger dialogue — all modular.
- Debugging: a developer overlay to enable, disable and test individual anomalies.
- Performance: mobile-first, minimal allocations, object pooling.

**Plan recap** (Engineering Planning Phase first):

1. Read the M3–M5 scene/interaction/atmosphere code and the legacy M0
   `AnomalySystem`; confirmed the latter is unwired scaffold, so M6 builds the real
   framework fresh without clobbering it.
2. Pure framework (types/ports → conditions/effects/triggers registries →
   scheduler → manager → pool) with tests, then game-layer actuators + context +
   demo data, then the dev overlay + plumbing.
3. Phase C: gates, headless smoke (force-fire every effect kind), docs, report.

**Reused** (no working system rewritten):

- M3 scene meshes, M4 `InteractionRegistry` / `Inventory`, M5 `AtmosphereManager`
  and its procedural one-shots, the event bus, `damp`/`clamp`, the Zustand +
  structural-scene-guard patterns (mirrors `isControllableScene`).

**New** (and why new was unavoidable):

- `systems/anomaly/`: `anomalyEngine.types` (specs + ports + param helpers),
  `AnomalyCondition` / `AnomalyEffect` / `AnomalyTrigger` (registries + built-in
  kinds), `AnomalyScheduler`, `AnomalyManager`, `ObjectPool`, plus scheduler +
  condition tests. The legacy `AnomalySystem` is a different (spawn/score) concept.
- `game/anomaly/`: `CompoundAnomalyContext` (port impls) and a pooled
  `SceneObjectController`; `anomalyDebug` (debuggable interface + guard).
- `game/content/anomalies.ts` (example data), `state/anomalyDebugStore`,
  `ui/components/AnomalyDebugOverlay`, `shared/constants/anomalyEngine`.
- Additive bias actuators on `AtmosphereManager`/`WindField`/`SkyMood`;
  `InteractionRegistry.stateOf`.

**Key decisions:**

- *Data over code.* Conditions/effects/triggers are referenced by `{ type, params }`
  and resolved through registries, so a new anomaly is pure data and a new *kind*
  is one registered factory — the manager never changes.
- *Ports keep the engine pure.* The framework (`systems/anomaly`) is Babylon-free;
  it acts through `AnomalyContext` ports the game layer implements — honouring the
  dependency rule (systems → core/shared) exactly as the interaction split did.
- *Compile-once, allocation-light hot path.* Each definition's trigger/conditions/
  effects are built once; evaluation is a single weighted-reservoir pass (no
  candidate array), spawns are pooled, and scheduling runs at 4 Hz, not per frame.
- *Debuggable by construction.* The manager exposes enable/disable/force-fire and a
  snapshot; the overlay is a thin projection. Examples ship **disabled** — the
  milestone delivers the engine, not gameplay.

**Performance:** compile-once definitions; weighted-reservoir candidate selection
(no per-tick allocation); pooled spawn meshes; 4 Hz evaluation split from the
frame; atmosphere effects are additive biases (no new lights). Per-frame work on
the scene path is the object-tween + clock tick only.

**Risks** (predicted → mitigation → outcome):

- Two "anomaly" systems confusing the codebase → built the framework under the
  user's distinct class names, left the M0 scaffold untouched, documented the
  supersession → no collisions, clean separation.
- Moving frozen scene meshes wouldn't animate → the object actuator unfreezes on
  move and captures originals for exact `reset` → verified in the smoke.
- Effects erroring at runtime → headless smoke force-fired move / spawn (pooled) /
  atmosphere+chain / dialogue / fog+wind / lightning with the overlay → zero
  errors, 4 concurrent (the `MAX_ACTIVE` cap), correct resolve.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (60) · format ✓ ·
build ✓ (shell ≈ 54 KB gzip unchanged; Babylon a separate ~1.12 MB gzip lazy
chunk; the engine adds ~4 KB gzip to the lazy `CompoundScene` chunk).
Runtime smoke (headless Chromium + SwiftShader, debug build): app boots, the
overlay lists all 8 example anomalies, force-firing every effect kind runs and
resolves cleanly, enable/disable works — **zero JS/page errors** (only the
sandbox-blocked Telegram SDK).

**Docs updated:** `IMPLEMENTATION_ROADMAP` (M6 entry + banner), `TECH_ARCHITECTURE`
(folders, system table, stores), `WORLD` (§5 anomaly engine), `docs/README`
(status, v1.7), repo `README` (folder map), `CHANGELOG` (Unreleased).

**Follow-ups / known limits:**

- The night clock is a stand-in (elapsed / `NIGHT_LENGTH`) until the Night Spine;
  `nightProgress` swaps to the real clock then with no API change.
- `missionStatus` returns null until `QuestSystem` is wired into the compound.
- The legacy M0 `AnomalySystem` should be retired or folded into this engine in a
  future milestone.
- Example anomalies are disabled by default by design; authored, tuned horror
  content is a later milestone.
