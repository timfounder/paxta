## Milestone M7 — Night Director (data-driven orchestration)

**Scope** (orchestrate pacing, tension and progression from data; no hardcoded
scripts; no monster, no scripted scare):

- Architecture: `NightDirector`, `NightState`, `NightTimeline`, `NightEvent`,
  `NightPhase`, `NightObjective`, `NightSequence`, `NightContext`.
- Features: timeline events, weighted random events, mandatory / optional events,
  cooldowns, dependencies, player + generator state, and anomaly / atmosphere /
  mission integration.
- Phases: Preparation, Calm, Suspicion, Escalation, Peak, Resolution — each with
  configurable parameters; no hardcoded values.
- Data-driven: nights are editable without engine changes.
- Debug: a Night Director panel — skip phase, trigger event, inspect state,
  visualise the timeline.
- Performance: mobile-first, minimal allocation; supports unlimited future nights.

**Plan recap** (Engineering Planning Phase first): read the M5/M6 public APIs and
the scene wiring; designed the director as a pure orchestrator over the existing
systems via ports (mirroring the M6 split); built the pure framework + tests, then
the game-layer context + example night + scene wiring, then the developer panel;
Phase C gates + headless smoke + docs + report.

**Reused** (no working system rewritten): M5 `AtmosphereManager` (tension → its
bias actuators), M6 `AnomalyManager` (enable/disable/trigger per phase), the
interaction registry, inventory, `damp`, the event bus, and the M6 patterns
verbatim — registries, ports, debug store, debug-gated panel, structural scene
guard, weighted-reservoir selection.

**New** (and why new was unavoidable): `systems/night/` (`night.types`,
`NightState`, `NightTimeline`, `NightSequence`, `NightCondition`, `NightAction`,
`NightDirector` + tests) — no existing system orchestrates a whole night;
`game/night/` (`CompoundNightContext`, `nightDebug`); `game/content/nights.ts`
(example data); `state/nightDebugStore`; `ui/components/NightDirectorPanel`;
`shared/constants/night`. `AnomalyManager.activeCount()` added.

**Key decisions:**

- *The director orchestrates; it owns no content.* Phases, durations, tension
  curve, events, sequences and objectives are all data in a `NightDefinition`; the
  director only advances time, eases tension, enables each phase's anomaly set, and
  fires events — so any number of future nights are pure data.
- *Integration through ports, not coupling.* `NightContext` exposes anomaly /
  atmosphere / world / dialogue ports the game layer fills, so `systems/night`
  stays Babylon- and system-free (the dependency rule, as with M6).
- *Tension is an idempotent atmosphere bias.* The context maps tension 0..1 to a
  net fog/moon/wind bias and applies only the delta, so easing tension never
  accumulates or fights the atmosphere's own drift.
- *Allocation-light.* Events compile once (conditions/actions built up front);
  the timeline advances a pointer for timeline events and a weighted-reservoir pass
  at 4 Hz for random ones; per-frame work is the tension ease + clock only.
- *Debuggable + visual.* The panel renders the timeline as a track with a "now"
  marker and clickable event markers (force-fire), plus skip-phase and live state.

**Performance:** per-frame cost is the tension ease + phase check; event
evaluation is a coarse 4 Hz weighted-reservoir pass (no per-tick allocation); the
director adds no lights and no new draw calls — it only flips anomaly enables and
nudges the atmosphere bias.

**Risks** (predicted → mitigation → outcome):

- Tension bias fighting the atmosphere drift → applied as a tracked net delta
  (idempotent setter) → smooth, no accumulation.
- Order-of-update races (director enabling anomalies vs. the anomaly tick) → the
  director runs before the atmosphere/anomaly systems each frame → enables and
  tension take effect coherently.
- Panel/runtime errors → headless smoke (debug build): the night auto-starts,
  skip advanced Preparation → Suspicion, the timeline rendered 5 markers + 6 chips,
  force-firing a marker and a chip worked → zero errors.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (67) · format ✓ ·
build ✓ (shell ≈ 54 KB gzip unchanged; Babylon a separate ~1.12 MB gzip lazy
chunk; the director adds ~4 KB gzip to the lazy `CompoundScene` chunk).
Runtime smoke (headless Chromium + SwiftShader, debug build): the night runs, the
panel skips phases and visualises + force-fires events, the anomaly sets ramp per
phase — **zero JS/page errors** (only the sandbox-blocked Telegram SDK).

**Docs updated:** `IMPLEMENTATION_ROADMAP` (M7 entry + banner), `TECH_ARCHITECTURE`
(folders, system table, stores), `docs/README` (status, v1.8), repo `README`
(folder map), `CHANGELOG` (Unreleased).

**Follow-ups / known limits:**

- The example night auto-starts and orchestrates *environmental* tension only; the
  authored, tuned horror content (and the report/scoring loop) is a later milestone.
- `missionStatus` is null until `QuestSystem` is wired; night objectives are
  tracked internally for now.
- The Night Director should become the authoritative night clock the anomaly
  engine's `nightProgress` reads (currently each keeps its own stand-in) — a small
  unification for a future milestone.
