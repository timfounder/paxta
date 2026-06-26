## Milestone M8 — Mission Framework (data-driven objectives)

**Scope** (a production mission framework supporting all future gameplay without
engine changes; integrates with the existing systems; no duplicated logic; no
story, no Night One — only the framework):

- Architecture: `MissionManager`, `MissionDefinition`, `MissionState`,
  `MissionObjective`, `MissionTrigger`, `MissionReward`, `MissionSequence`,
  `MissionCondition`.
- Mission types: reach location, interact, collect, deliver, wait for event,
  survive for time, activate device, inspect — plus multi-step, hidden and
  optional objectives.
- Flow: start conditions, progress tracking, objective completion, dependencies,
  branching, failure conditions, retry, save/load.
- UI: current-mission widget, objective tracker, notifications, completion animation.
- Integration: Night Director, Atmosphere, Anomaly Engine, Interaction System.
- Debug: complete mission, skip objective, restart mission, view active conditions.
- Performance: mobile-first, no per-frame allocations, unlimited missions.

**Plan recap** (Engineering Planning Phase first): mapped each objective type to an
*existing* signal so detection is reused, not duplicated (interaction event,
inventory, registry, night phase, anomaly count); enriched `interaction:performed`
with the object id; built the pure framework + tests, then the game-layer context +
example missions + scene wiring + save/load, then the UI + debug tools; Phase C
gates + headless smoke + docs + report.

**Reused** (no working system rewritten, no duplicated logic): the interaction
event/registry, inventory, the night phase (read), the anomaly manager
(enable/trigger/count), the atmosphere (flash), the per-scene persistence, the
event bus, and every established pattern — registries, ports, debug store + panel,
structural scene guard, weighted/compile-once design. Param accessors were
**de-duplicated** into `shared/utils/params`.

**New** (and why new was unavoidable): `systems/mission/` (`mission.types`,
`MissionObjective` / `MissionCondition` / `MissionReward` / `MissionTrigger`
registries, `MissionState`, `MissionManager` + tests) — no existing system tracks
objectives; `game/mission/` (`CompoundMissionContext`, `missionDebug`);
`game/content/missions.ts`; `state/missionStore`; UI (`MissionWidget`,
`MissionNotice`, `MissionDebugPanel`); `shared/constants/mission`,
`shared/utils/params`.

**Key decisions:**

- *Detect by reusing signals, never re-implement.* Objective trackers read player
  position, inventory, the interaction registry, an interaction "last-touched"
  latch (one subscription), the night phase and the anomaly count — so "interact
  with X", "collect", "activate", "reach", "survive", "deliver" share the systems
  that already produce those facts. `interaction:performed` gained an `id` so a
  specific interaction is detectable without new logic.
- *Pure framework, ports to the world.* `systems/mission` is Babylon- and
  system-free; the game layer fulfils `MissionContext`, exactly as anomaly/night.
- *Flags + save/load centralised in the manager.* The context delegates flags and
  mission-start to the manager (bound post-construction), so one snapshot covers
  missions + flags; objective survive-timers persist via stored elapsed.
- *Compile-once, allocation-light.* Trackers/conditions/rewards build at register
  time; evaluation is a 4 Hz pass over active missions; the UI is a projection.

**Performance:** per-frame cost is nil beyond the 4 Hz evaluation; objective
detection is O(active objectives); one interaction subscription feeds all trackers;
no per-frame allocation; supports unlimited missions (each is data).

**Risks** (predicted → mitigation → outcome):

- Duplicating detection logic across objective types → every tracker reads an
  existing signal through the ports → no duplication, integration by reuse.
- Mission-start reward needing the manager (cycle) → the context binds the manager
  after construction; flags/start route through it → clean, centralised save/load.
- UI/runtime errors → headless smoke (debug build): the patrol auto-started, the
  widget showed 3 objectives (hidden filtered), debug complete fired the completion
  notice and chained the next mission, skip-objective worked → zero errors.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (74) · format ✓ ·
build ✓ (shell ≈ 54 KB gzip unchanged; Babylon a separate ~1.12 MB gzip lazy
chunk; the framework adds ~3 KB gzip to the lazy `CompoundScene` chunk).
Runtime smoke (headless Chromium + SwiftShader, debug build): missions run, the
widget + tracker render, the debug tools complete / skip / restart, completion
notifies + animates, chaining works — **zero JS/page errors** (only the
sandbox-blocked Telegram SDK).

**Docs updated:** `IMPLEMENTATION_ROADMAP` (M8 entry + banner), `TECH_ARCHITECTURE`
(folders, system table, stores), `docs/README` (status, v1.9), repo `README`
(folder map), `CHANGELOG` (Unreleased).

**Follow-ups / known limits:**

- Example missions are framework fixtures (a demo patrol chain); authored,
  balanced mission content and Night One are later milestones.
- `wait` objectives currently key off the `interaction`/`inventory` signal latch;
  more named signals can be mapped in the context as systems emit them.
- The legacy M0 `QuestSystem` overlaps conceptually and should be retired or folded
  into this framework in a future milestone.
