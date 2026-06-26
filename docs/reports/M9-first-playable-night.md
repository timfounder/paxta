## Milestone M9 — First Playable Night (the first complete shift)

**Scope** (the first complete, finishable night, built from **only the existing
systems** — no new core systems; subtle atmosphere only, no monster / chase /
jump scare; metrics collected; ends on a summary screen):

- Scenario: the player arrives at the cotton compound for a first night shift.
- Five objectives (one sequence): turn on the generator → check the water pump →
  lock the warehouse → find the missing fuel can → return to the guard house.
- Duration ~12–15 min, fully winnable.
- 3–5 simple anomalies that make the player *wonder* whether anything changed.
- Ending: returning to the guard house completes the shift; the night ends and a
  **Night Complete** screen reports the metrics.
- Metrics: completion time, mission completion, anomaly triggers, interaction count.

**Plan recap** (Engineering Planning Phase first): confirmed M9 is *content +
thin integration*, not new systems. Mapped each objective to an existing mission
objective type (`activate` / `inspect` / `collect` / `reach`); mapped each anomaly
to an existing M6 effect (`light` / `wind` / `moveObject` / `playSound` /
`atmosphere`); expressed pacing as an existing M7 `NightDefinition`. Identified the
only genuine gaps — a "checkable" prop, a door that can *start open*, a third
pickup, and a way to end the night + show a summary — and filled them with minimal
glue reusing established patterns. Then Phase C: gates + headless smoke + docs +
report.

**Reused** (no working system rewritten, no duplicated logic): the Player core,
World + `compound/` builders, the Interaction system (registry + `Door` /
`Generator` / `Switch` / `PickupItem` / `Lamp`), M5 Atmosphere (`light` / `wind` /
`fog` biases, sound cues), the M6 Anomaly Engine (definitions, scheduler, effects,
`getDebugSnapshot` activation counts), the M7 Night Director (`NightDefinition`,
phases, dialogue events), the M8 Mission Framework (objectives reusing existing
signals, sequences, rewards, the widget / tracker / notices / debug), the per-scene
persistence, the typed event bus and every UI screen pattern.

**New** (and why new was unavoidable):

- `game/content/nightOne.ts` — **content data**: five subtle anomalies, a six-phase
  night, and the `First Shift` mission. (Replaces the framework demo content; the
  old `game/content/{anomalies,nights,missions}.ts` fixtures were removed.)
- `game/objects/Examinable.ts` — a tiny no-op interactable so the pump can be
  *checked* (the `inspect` objective); no existing object was "look-at only".
- `game/objects/Door.ts` — added an `initiallyOpen` flag so the warehouse can
  **start open** (locking it is then a real task), with collision off while open.
- `compound/machinery.ts` / `compound/interactives.ts` — exposed the pump meshes
  and added the `fuel-can` pickup (scenario geometry).
- `night:completed` event + `state/nightSummaryStore` + `ui/screens/
  NightCompleteScreen` (+ `Screen.NightComplete`, styles) — there was no
  end-of-night flow; the scene collects metrics and `Game` freezes the run and
  shows the summary.

**Key decisions:**

- *The mission drives the ending, not a timer.* The night's Resolution phase is
  atmosphere; **completing the shift mission** is what ends the night. The scene
  listens for the mission's `completed` notice, sums metrics and emits
  `night:completed`; `Game` pauses the engine and shows the screen. This keeps the
  ending tied to the player finishing, not the clock.
- *Make the objectives real by changing initial state.* The generator starts
  **off** and the warehouse door starts **open**, so "turn on the generator" and
  "lock the warehouse" are genuine actions, and the warehouse stays dark until
  powered — atmosphere and task reinforce each other.
- *Anomalies stay subtle and ambiguous.* Small, brief, mostly environmental
  effects (a flicker, the wind dropping, a one-time tool move, a distant sound, a
  little more fog), disabled by default and rotated in by the night's phases —
  enough to make the player doubt, never a scare.
- *Metrics without a new system.* The scene times with `performance.now()`, counts
  interactions from one `interaction:performed` subscription, sums anomaly
  activations from the existing debug snapshot, and reads objective completion from
  the mission view — all existing signals.
- *Replay is clean.* A `nightFinished` flag makes the next `enterLevel` transition
  to a fresh `CompoundScene`, so "Another Night" starts from a clean state.

**Performance:** no new per-frame cost — the night/anomaly/mission frameworks keep
their compile-once 4 Hz evaluation; metrics are O(1) on the completion event; the
interaction counter is one subscription. The shell stays small and Babylon remains
a separate lazy chunk (content adds only data + a thin scene/screen).

**Risks** (predicted → mitigation → outcome):

- A 12–15 min walkthrough is not headless-feasible → drive the end-state via the
  mission debug **complete** button in the smoke → verified the full
  completion → Night Complete + metrics flow.
- The ending could fire from the wrong mission / twice → guard on the specific
  mission id and a `nightEnded` latch → single, correct fire.
- "Lock the warehouse" trivially satisfied if the door started closed → the door
  starts **open** via the new flag → the objective requires the player's action.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (74) · format ✓ ·
build ✓ (shell unchanged ≈ 10 KB gzip entry / ~54 KB initial; Babylon a separate
~1.12 MB gzip lazy chunk; Night One adds only data + a thin screen to the lazy
`CompoundScene` chunk ≈ 20.6 KB gzip). Runtime smoke (headless Chromium +
SwiftShader, debug build): Enter → the **First Shift** widget renders with **5**
objectives → completing the shift via the debug panel fired `night:completed` → the
**Night Complete** screen showed Time / Objectives 5 / 5 / Anomalies noticed /
Interactions — **zero JS/page errors** (only the sandbox-blocked Telegram SDK).

**Docs updated:** `IMPLEMENTATION_ROADMAP` (M9 entry + shipped-sequence banner),
`WORLD` (interactables table, anomaly placement → Night One), `TECH_ARCHITECTURE`
(stores: +`nightSummaryStore`), `docs/README` (status, v2.0), repo `README`
(folder map, objects, stores), `CHANGELOG` (Unreleased — M9).

**Follow-ups / known limits:**

- Night One is the **first** authored night; tuning (anomaly cadence, phase
  lengths, objective spacing) will be refined against playtests in later milestones.
- The summary screen reports the four required metrics; a richer Night Report
  (per-anomaly, composure, standing) is a later horror-track milestone.
- The legacy M0 `QuestSystem` and `AnomalySystem` scaffolds remain unwired and
  should be retired or folded into the data-driven frameworks.
