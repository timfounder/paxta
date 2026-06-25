## Milestone M4 — Core Gameplay Loop (interaction foundation)

**Scope** (the interaction foundation every future mechanic plugs into):

- Universal interaction system — throttled camera-ray probe → focus → dispatch.
- Interactive-objects framework — one common `Interactable` interface for all.
- Object highlighting — cheap per-mesh outline on the focused object.
- Interaction prompt UI — contextual verb below the reticle.
- Door system — hinged, openable/closable, collision-aware.
- Generator system — power source driving lights.
- Switches — toggle linked lights.
- Pick up / drop objects — world props ↔ inventory.
- Simple inventory (foundation only).
- Save interaction state — interaction + inventory persisted per scene.

**Plan recap** (Engineering Planning Phase, then build):

1. Read all M2–M4 docs + the player/scene/event code; mapped the layering.
2. Designed a *generic* framework in `engine/interaction/` and *concrete*
   reusable objects in `game/objects/`, with interaction lifted out of the
   player into a scene-level system.
3. Built inventory (pure system) → interaction framework → game objects →
   persistence → engine/player refactor → scene integration → UI.
4. Phase C: self-review, gates, headless smoke, docs, ROADMAP, report.

**Reused** (no working system rewritten):

- M2 `PlayerController` (now locomotion-only; exposes its camera) — the M2
  motor/look/head-bob are untouched.
- M3 `CompoundScene` and its `compound/` builders, palette, and `box`/`pillar`
  primitives; the generator/warehouse geometry.
- `EventBus`/`GameEventMap`, `uiStore` focus mirror, `damp`, `Result`, branded
  ids, the `ControllableScene` contract, and the Zustand store patterns.
- `shared/utils/localStore` for persistence (added in this milestone, reused by
  the per-scene state store).

**New** (and why new was unavoidable):

- `engine/interaction/` — `types` (interfaces), `InteractionRegistry`,
  `InteractionSystem`, `HighlightController`: the generic framework; nothing
  existing offered a reusable, object-agnostic interaction seam.
- `systems/inventory/` — `Inventory` (+ `inventory.types`): a new gameplay system.
- `game/objects/` — `ToggleControl`→`Switch`/`Generator`, `Door`, `Lamp`,
  `PickupItem`: concrete reusable behaviours implementing the framework.
- `game/scenes/compound/interactives.ts` — interactive geometry + the two
  switched lights.
- `game/persistence/sceneState.ts`, `state/inventoryStore.ts`,
  `ui/components/InteractionPrompt.tsx`, `ui/components/InventoryBar.tsx`,
  `shared/utils/localStore.ts`.
- Removed: the M2 `engine/player/interaction/` probe and the retired
  `HallwayScene` (superseded).

**Key decisions:**

- *Interaction lives at scene level, not in the player.* The player is pure
  locomotion and exposes its camera; the `InteractionSystem` rays from it. This
  keeps the player reusable and lets any scene host interaction.
- *Engine framework stays free of gameplay systems.* `InteractionContext` carries
  only the event bus; game-layer objects (e.g. `PickupItem`) inject the
  `InventoryPort` themselves — honouring the dependency rule (engine → core).
- *Behaviour in objects, not scenes/geometry.* The scene only wires registry +
  targets; `Switch`/`Generator` share a `ToggleControl` base (no duplicated
  logic); `Door`/`Lamp` are `Updatable`, ticked generically.
- *Persistence composed in the game layer* (`sceneState`), joining the engine's
  interaction snapshot with the inventory snapshot, keyed per scene.

**Performance:**

- Optimised raycasting: 10 Hz throttle, a reused forward ray bounded to
  `INTERACT_DISTANCE`, `isPickable` predicate (vegetation excluded), and O(1)
  registry resolve. No per-frame allocations on the probe path.
- Highlight uses per-mesh `renderOutline` (no full-screen post-process).
- The door stops all per-frame work once its swing settles.
- Light budget held at 4 (hemi + moon + generator lamp + entrance lamp); the
  old static generator/door point-lights were removed.

**Risks** (predicted → mitigation → outcome):

- Rotating-door collision traps the player → toggle leaf collision off the moment
  it opens; non-frozen leaf so the world matrix tracks → no trap observed.
- Engine importing a system (layer break) → moved the inventory dependency out of
  `InteractionContext` into game-layer objects → dependency rule intact.
- Save/world divergence for carried items → single carried truth reflected in both
  the pickup state and the inventory snapshot; restore order made consistent → OK.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (40) · format ✓ ·
build ✓ (shell ≈ 54 KB gzip; Babylon a separate ~1.12 MB gzip lazy chunk).
Runtime smoke (headless Chromium + SwiftShader): app boots, engine loads lazily,
the compound renders, reticle/HUD initialise, **zero JS/page errors** (only the
sandbox-blocked external Telegram SDK script fails to load).

**Docs updated:** `docs/README` (status, version 1.5), `IMPLEMENTATION_ROADMAP`
(M4 entry + horror-track provisional-numbering banner + M2 note),
`TECH_ARCHITECTURE` (folders, system table, stores, dependency rule), `WORLD`
(compound interactables; removed deleted `HallwayScene`), `UI_GUIDELINES`
(§6a world-interaction HUD), and the repo `README` (folder map).

**Follow-ups / known limits:**

- Inventory is foundation-only: no slots, weight, stacking, or item *use*.
- Persistence writes on each interaction (small, user-paced); a future Save v2
  may fold scene state into the unified save (IMPLEMENTATION_ROADMAP M7-track).
- The `interaction:performed` payload uses the post-action prompt (empty for a
  just-collected pickup) — cosmetic only.
- No haptics on interact yet (R-INT-4) — deferred until the Telegram action pass.
