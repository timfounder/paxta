# IMPLEMENTATION ROADMAP

> Owner of: the **engineering milestone breakdown**, the **system dependency
> graph**, and the **continuous-release strategy**. The product-phase roadmap
> ([ROADMAP](./ROADMAP.md)) owns the *phases and exit metrics*; this owns *the
> order we actually build systems and how each increment ships*.
>
> Architecture-only. Nothing here is implemented yet. Last reviewed: 2026-06-25.

## 0. How to read this

- **Milestones (M0…M12)** are vertical slices. **Each is independently playable**
  — it ends in a build a tester can hold and play, not internal plumbing.
- Every milestone preserves the **dependency rule** (TECH_ARCHITECTURE §2) and the
  **lazy-load seam** (R-LAZY); new systems enter behind **feature flags** so
  half-built work ships dark and the trunk is always releasable (§7).
- Sizes are **relative** complexity (S < M < L < XL), not time.
- Milestones map onto the product phases (§8) — they refine, not replace, them.

## 1. Current state (the review)

**Built (M0 — the foundation, shipped):** the layered architecture; `EventBus`,
ECS `World`, `GameEngine` + render loop, `SceneManager`/`BaseScene`,
`PlayerController` (free-walk), `AnomalySystem` (logical spawn/lifetime/score),
`AudioManager`, `SaveSystem` + `SaveRepository` port, `QuestSystem`, three Zustand
stores, `TelegramService`, prepared Supabase client, the Hallway scene, the UI
shell, lazy engine loading, and a Vitest suite. The loop *runs*.

**The gap to the designed game (GDD suite).** The foundation models the loop
*logically*; the designed game needs the systems that make it *perceivable,
structured, and persistent*:

| Gap | Today | GDD requires |
| --- | --- | --- |
| **Anomalies are invisible** | logical entities, no mesh/sound | seen/heard manifestations, tiers, behaviours (ANOMALY_PROGRESSION) |
| **No Night structure** | flat, endless spawn | a 6-hour Night with a tension curve (NIGHT_PROGRESSION) |
| **Non-deterministic** | `Math.random` spawns | seeded re-rolls + Daily Seed (REPLAYABILITY) |
| **Free-walk control** | WASD/drag camera | node-based patrol for authored sightlines (CORE_LOOP) |
| **No doubt** | only real anomalies | Sanity-scaled false cues (CORE_LOOP §5) |
| **Thin economy** | flat drain | the Night Sanity economy (GDD §5) |
| **No missions/onboarding** | one static quest | Directives + the 3-minute hook (MISSION/NIGHT) |
| **No meta/knowledge** | per-run score only | Case Files, standing, Night Report (REWARD) |
| **No resume/meta-save** | single flat save | hour checkpoints + meta split (SAVE_SYSTEM) |
| **No cloud/commerce** | local only, prepared | Daily Seed, leaderboards, Stars (VISION §7) |

The roadmap closes these gaps in dependency order, each step playable.

## 2. Target system inventory

| System | State | Layer | Introduced |
| --- | --- | --- | --- |
| EventBus, World/ECS | ✅ exists | core | M0 |
| GameEngine, SceneManager, BaseScene | ✅ exists | engine | M0 |
| PlayerController | ✅ → refactor to patrol | engine | M0/M2 |
| AnomalySystem | ✅ → retune + presentation hook | systems | M0/M1/M3 |
| AudioManager, SaveSystem(+port), QuestSystem | ✅ exists | systems | M0 |
| Stores, TelegramService, Supabase(prepared) | ✅ exists | state/telegram/services | M0 |
| **RngService** (deterministic seed) | 🔜 new | shared | **M1** |
| **NightDirector** (clock + hour phases) | 🔜 new | systems | **M1** |
| **PatrolSystem** (node movement) | 🔜 new | engine | **M2** |
| **AnomalyPresentation** (per-kind presenters) | 🔜 new | game | **M3** |
| **DoubtSystem** (false cues) | 🔜 new | systems | **M4** |
| **DirectiveSystem** (missions on QuestSystem) | 🔜 new | game/systems | **M5** |
| **StringService** (localization) | 🔜 new | shared/services | **M5** |
| **CaseFileSystem** (knowledge) | 🔜 new | systems/state | **M6** |
| **Reward/NightReport/Standing** | 🔜 new | systems/state | **M6** |
| **Save v2** (meta vs Night checkpoint) | 🔜 new | systems/save | **M7** |
| **FailureSequence** | 🔜 new | game/ui | **M7** |
| **Content pipeline** (per-Night/chapter data) | 🔜 new | game/content | **M8** |
| **CloudSaveRepository, Leaderboard, DailySeed** | 🔜 new | services | **M9** |
| **Entitlement (Stars), Cosmetics** | 🔜 new | telegram/services | **M10** |
| **Telemetry, LiveConfig** | 🔜 new | services | **M11** |

## 3. System dependency graph (the estimate)

Arrows mean "depends on / is driven by". Foundation (M0) systems are the roots;
new systems hang off them. No arrow ever points outward against the layer rule.

```
RngService ─────────────┐                         (pure; no deps)
                        ▼
EventBus ──▶ NightDirector ──▶ AnomalySystem(retuned) ──▶ AnomalyPresentation
   │             │   ▲              │   ▲                       │   │
   │             │   └── RngService─┘   └── World/ECS           │   ▼
   ▼             ▼                                              │ AudioManager
 stores      gameStore(Sanity/score) ◀── vitals/score sinks    │
   ▲             ▲                                              ▼
   │             └────────────── DoubtSystem ◀── RngService ── (cues)
   │                                  ▲
PatrolSystem ──▶ GameEngine/Scene      │ (Sanity)
   │                                   │
DirectiveSystem ──▶ QuestSystem        │
   │   └──▶ StringService ──▶ TelegramService(language)
   ▼
CaseFileSystem ──▶ SaveSystem(meta) ──▶ SaveRepository ──▶ {Local | Cloud}
   │                    ▲                                       ▲
Reward/NightReport ─────┘                                      │
   │                                                    TelegramService(initData)
Save v2 checkpoint ──▶ NightDirector(hours) + RngService(seed)
DailySeed/Leaderboard ──▶ RngService + CloudSave
Entitlement(Stars) ──▶ TelegramService(payments) + Content gating + CloudSave
Telemetry/LiveConfig ──▶ (cross-cutting) Supabase
```

Key dependency facts the build order must respect:
1. **RngService before** AnomalySystem-retune, DoubtSystem, Save-checkpoint,
   DailySeed (determinism is foundational — build it first).
2. **NightDirector before** the Night economy, Directives, checkpoints, rewards
   (it is the spine everything time-based hangs on).
3. **AnomalyPresentation before** DoubtSystem (false cues reuse the presenters)
   and before Case Files (you catch what you can see).
4. **Save v2 before** Cloud sync, Daily Seed leaderboards, and Entitlement
   (identity + durable meta underpin all commerce).
5. **Content pipeline before** scaling chapters, Daily Seed, and monetised gating.

## 4. The milestones

Each milestone: **Goal** (player-facing) · **Architecture** (systems) · **Depends
on** · **Playable** (the testable build) · **Flag/Release** · **DoD** · **Size**.

---

### M0 — Foundation ✅ (shipped)
- **Goal:** a production skeleton with the loop running.
- **Playable:** walk the Hallway; logical anomalies spawn; report; Sanity; menu→game→over.
- **DoD:** ✅ gates green; one loop runs; shell loads without Babylon.

---

### M1 — Night Spine (clock, hours, seed, economy)
- **Goal:** the loop becomes a **Night**: a 00:00→06:00 timed shift with the GDD
  Sanity economy and a HUD clock; dawn wins, Sanity-0 loses.
- **Architecture:** new **RngService** (seeded, injectable — replaces `Math.random`
  in spawns); new **NightDirector** (drives the clock, emits `night:hour-changed`,
  `night:dawn`; owns the per-hour difficulty knobs); retune `game.ts` constants to
  GDD §5 and update GAMEPLAY's mirror (R-DOC-1); add the clock to the HUD; add
  `night:*` events to `GameEventMap` (additive).
- **Depends on:** EventBus, gameStore, GameEngine loop. *(RngService: none.)*
- **Playable:** a full timed Night in the Hallway with the real economy and clock,
  ending at dawn or collapse. Anomalies still logical (invisible) — but *timed*.
- **Flag/Release:** `features.night` — when off, falls back to M0 endless loop.
- **DoD:** a Night runs 10–15 min; survivability matches CORE_LOOP §4 math in a
  manual play-test; gates green; seed reproduces a spawn sequence (unit test).
- **Size:** L.

---

### M2 — Player Core (first-person controller) ✅
> **Redefined from "Node Patrol".** The Director scoped M2 as a production-grade
> free-movement first-person controller — the foundation all future systems build
> on — superseding the node-patrol control model (reconciled in CORE_LOOP / GDD §4).
- **Goal:** a responsive, natural mobile first-person controller.
- **Architecture:** decomposed `engine/player/` — `PlayerMotor` (gravity +
  collision via an invisible ellipsoid collider + `moveWithCollisions`, sprint,
  crouch), `LookController` (smoothed yaw/pitch), `HeadBob` (pure), and
  `interaction/` (`Interactable` interface + `InteractionProbe` forward ray —
  **relocated to the scene-level interaction system in M4**; the player now only
  exposes its camera), orchestrated by a thin `PlayerController`. Extends the
  `ControllableScene` contract (sprint/crouch/interact); adds interaction events
  + `uiStore` focus;
  HUD gains a reticle + sprint/crouch/interact buttons; `damp` smoothing util.
- **Depends on:** M1 (controller, joystick/look UI, scene contract), GameEngine.
- **Playable:** walk the Hallway with gravity, wall collision, sprint, crouch,
  head-bob and a smoothed camera; examine a demo prop via the interaction ray.
- **DoD:** one-thumb portrait; allocation-free hot path (R-PERF-7); pure logic
  unit-tested; gates green. **No horror/AI/missions/inventory.**
- **Size:** L.

---

### M3 — World & Environment: the PAXTA compound ✅
> **Redefined from "Anomaly Presentation".** The Director scoped M3 as the game's
> real setting — the night-time cotton compound — building the explorable world
> on the M2 player before any horror. The milestone numbering has diverged from
> the original plan; Anomaly Presentation and the later horror milestones (M4+
> below) shift accordingly and will be resequenced when reached.
- **Goal:** a believable, explorable PAXTA compound (the actual setting).
- **Architecture:** `CompoundScene` (a `BaseScene`/`ControllableScene`) reusing
  the M2 `PlayerController` unchanged, orchestrating small builders under
  `game/scenes/compound/` — palette, terrain (collidable ground + road + field),
  buildings (guard house, open warehouse), machinery (generator + pump; the
  generator is an `Interactable`), vegetation (cotton + trees, **InstancedMesh**),
  lighting (moon + 2 point lights). Fog; the generator work-light flickers.
- **Depends on:** M2 (player + interaction), SceneManager, BaseScene.
- **Playable:** walk the compound — road, guard house, enter the warehouse,
  examine/toggle the generator, cross the cotton field, under fog and moonlight.
- **DoD:** renders within the mobile budget (instanced vegetation ≈4 draw calls,
  ≤4 lights, frozen statics); reuses the player verbatim; gates green.
  **No horror/AI/missions/inventory.**
- **Size:** L.

---

### M4 — Core Gameplay Loop (interaction foundation) ✅
> **Inserted before the horror track.** The Director scoped M4 as the universal
> interaction + inventory foundation every future mechanic plugs into, built on
> the M3 world. The horror milestones below keep their provisional numbers
> (the M4–M12 there are planning placeholders, flagged by the banner) and will be
> resequenced when reached.
- **Goal:** one reusable interaction system every future mechanic plugs into
  **without modification**.
- **Architecture:** generic `engine/interaction/` — `Interactable` / `Activatable`
  / `Stateful` / `Updatable` interfaces, an `InteractionRegistry` (mesh→object,
  O(1) resolve), an `InteractionSystem` (throttled camera forward-ray, focus,
  dispatch) and a per-mesh `HighlightController` (cheap `renderOutline`). Concrete
  reusable objects live in `game/objects/` — `Door` (frame-independent hinge
  swing), `ToggleControl` → `Switch` / `Generator` (drive `Activatable` lights via
  `Lamp`), `PickupItem` (inventory add / drop). A pure `Inventory`
  (`systems/inventory/`) emits `inventory:changed`; `inventoryStore` mirrors it
  for React. Interaction + inventory state persists per scene
  (`game/persistence/sceneState` over `shared/utils/localStore`).
  `PlayerController` is reduced to locomotion and exposes its camera; the
  scene-level interaction system replaces the M2 player-owned probe. HUD gains a
  centred interaction prompt, an inventory bar and a Drop action; `dropItem` is
  added to the `ControllableScene` contract.
- **Depends on:** M2 (player camera), M3 (the compound to populate), EventBus,
  SceneManager.
- **Playable:** in the compound — open / close the warehouse door, start / stop
  the generator (its warehouse work-light), flip the entrance switch, and pick up
  / drop loose objects; the whole interaction + inventory state survives a reload.
- **DoD:** a common interface for every interactable; **no gameplay logic in scene
  objects**; allocation-free probe (10 Hz throttle, reused ray, registered-mesh
  resolve); ≤4 lights held; reuses the M3 world + M2 player unchanged; gates green
  (40 unit tests). **No horror/AI/missions.**
- **Size:** L.

---

### M5 — Atmosphere Framework (dynamic tension) ✅
> **Inserted before the horror track.** The Director scoped M5 as a reusable,
> data-driven atmosphere system — tension from the *environment itself*, with no
> enemy, anomaly or scripted scare — the bed the later horror systems sit on. The
> provisional horror numbers below are unchanged.
- **Goal:** make the night feel alive and uneasy through slow, randomly-timed
  environmental change; the atmosphere becomes a core, reusable gameplay system.
- **Architecture:** a reusable `AtmosphereManager` (`engine/atmosphere/`) composing
  four data-driven units behind one update seam: a `WindField` (gusting strength +
  a GPU `WindMaterialPlugin` that sways the canopy/cotton on the vertex shader — no
  per-instance CPU), a `SkyMood` (drifting fog density + moonlight, rare silent
  distant lightning that only modulates the two existing lights), a **pure**
  `AmbienceDirector` (random event timing, long quiet periods, complete-silence
  beats), and a `ProceduralAmbience` Web-Audio synth (wind layers, insects,
  power-line hum, one-shot dog / creak / buzz / thunder — **no audio assets**). All
  tuning lives in `shared/constants/atmosphere.ts`. Cheap per-frame eases are split
  from a 5 Hz scheduling tick; the audio graph suspends with the engine and on tab
  hide; lightning respects reduced-motion.
- **Depends on:** M3 (the compound: lights, fog, vegetation materials), GameEngine
  loop, EventBus (`engine:paused`/`resumed`).
- **Playable:** stand in the compound — the trees and cotton stir in shifting wind,
  fog and moonlight breathe, a far-off dog or a metal creak punctuates long quiet
  stretches, the power lines hum, and every so often the world goes utterly silent
  or a soundless flash lights the sky. Nothing is hunting you.
- **DoD:** reusable + fully data-driven; no monsters / anomalies / scripted scares;
  allocation-free per-frame path; GPU wind (zero per-instance CPU); ≤4 lights held;
  audio degrades to a silent no-op without Web Audio; gates green (47 unit tests;
  wind shader verified compiling under headless SwiftShader). **No horror systems.**
- **Size:** L.

---

### M6 — Anomaly Engine (data-driven framework) ✅
> **Inserted before the horror track.** The Director scoped M6 as the production
> anomaly *framework* — the data-driven engine the horror milestones below will
> express their content through — superseding the M0 spawn/score `AnomalySystem`
> scaffold (left in place, unwired). Provisional horror numbers unchanged.
- **Goal:** control environmental change with **no hardcoded gameplay logic** —
  every anomaly is data; no anomaly requires an engine change.
- **Architecture:** a pure framework in `systems/anomaly/` — `AnomalyManager`
  (compile-once definitions, coarse evaluate → activate/resolve lifecycle, debug
  API), `AnomalyScheduler` (random / weighted / cooldown / one-time / repeatable /
  chained / night-gating / dependencies — pure, tested), and type-keyed registries
  for `AnomalyCondition` (position / time / interactable / inventory / mission /
  weather), `AnomalyEffect` (fog / wind / light / lightning / atmosphere / move /
  hide / show / spawn / sound / dialogue) and `AnomalyTrigger` (scheduled /
  proximity). Conditions/effects act through injected **ports** (`AnomalyContext`)
  so the framework stays Babylon-free; the game layer (`game/anomaly/`) fulfils
  them — atmosphere bias on `AtmosphereManager`, a pooled `SceneObjectController`,
  ambience one-shots, toast dialogue. A developer overlay (debug-gated) enables /
  disables / force-fires each anomaly. Example definitions live in
  `game/content/anomalies.ts`, shipped **disabled** (framework, not gameplay).
- **Depends on:** M3 (scene objects), M5 (atmosphere actuators), the interaction
  registry, the inventory, EventBus.
- **Playable:** nothing changes for the player by default; with the debug overlay
  on, every example anomaly can be toggled and fired — fog rolls, lights dim,
  objects move/spawn (pooled), a far bark or whisper, a chained blackout.
- **DoD:** every anomaly is pure data; new kinds are one registered factory;
  minimal allocation (compile-once, weighted-reservoir pick, pooled spawns); the
  developer overlay enables/disables/tests each; gates green (60 unit tests;
  runtime-verified firing effects under headless SwiftShader). **No monster, no
  scripted horror — only the framework.**
- **Size:** XL.

---

### M7 — Night Director (data-driven orchestration) ✅
> **Inserted before the horror track.** The Director scoped M7 as the top-level
> pacing brain that orchestrates the whole night — phases, tension, progression —
> by coordinating M5 (atmosphere) and M6 (anomalies) from data, with no hardcoded
> scripts. Provisional horror numbers unchanged.
- **Goal:** orchestrate the complete experience — pacing, tension, progression —
  from data; the architecture supports unlimited future nights.
- **Architecture:** a pure framework in `systems/night/` — `NightDirector`
  (advances the six phases on their configured durations, eases tension into the
  atmosphere, enables each phase's anomaly set, drives events), `NightState`
  (phase / elapsed / tension / objectives / fired bookkeeping), `NightTimeline`
  (timeline + weighted-random scheduling: mandatory / optional / cooldown /
  dependency / conditions), `NightSequence` runner, and type-keyed `NightCondition`
  (generator / hasItem / objective / phase / mission / flag) and `NightAction`
  (trigger/enable/disable anomaly, setTension, flash, dialogue, start/complete
  objective, startSequence, setFlag) registries. The six phases — **Preparation,
  Calm, Suspicion, Escalation, Peak, Resolution** — are pure data with per-phase
  tension, duration and anomaly set. `NightContext` ports keep it Babylon-free; the
  game layer (`game/night/`) wires them to the anomaly manager, the atmosphere
  (tension → net bias), the world and dialogue. The example night lives in
  `game/content/nights.ts`. A developer panel (debug-gated) skips phases, force-
  fires events, inspects live state and visualises the timeline.
- **Depends on:** M5 (atmosphere), M6 (anomaly engine), the interaction registry,
  the inventory.
- **Playable:** the compound now runs a paced night — tension and the active
  anomaly set ramp through the phases, with timeline beats, random flavour and a
  peak sequence; the debug panel drives and visualises it.
- **DoD:** fully data-driven (no hardcoded night content/values); supports
  unlimited nights; minimal allocation (compile-once events, coarse evaluation);
  the panel skips/triggers/inspects/visualises; gates green (67 unit tests;
  runtime-verified phase advance + event firing under headless SwiftShader).
  **No monster, no scripted scare — only orchestration.**
- **Size:** XL.

---

### M8 — Mission Framework (data-driven objectives) ✅
> **Inserted before the horror track.** The Director scoped M8 as the production
> mission framework — objectives / progress / branching / rewards / save — every
> future night and chapter expresses its goals through, integrating the existing
> systems with no duplicated logic. Provisional horror numbers unchanged.
- **Goal:** support all future gameplay (objectives, progression, branching) from
  data, with no engine changes per mission, and unlimited missions.
- **Architecture:** a pure framework in `systems/mission/` — `MissionManager`
  (compile-once defs, coarse evaluation: trigger → start conditions → objective
  tracking → completion/rewards/fail/retry, owns flags + the save/load snapshot),
  `MissionState` (per-mission objective runtime with dependencies, sequences,
  hidden/optional), and type-keyed registries for **objectives** (reach, interact,
  inspect, activate, collect, deliver, wait, survive), **conditions** (hasItem,
  phase, flag, generator, anomalies), **rewards** (setFlag, enable/trigger anomaly,
  flash, dialogue, startMission) and **triggers** (auto, onPhase, onFlag,
  afterMission, onSignal). Objectives detect progress by **reusing existing
  signals** — the interaction event (enriched with the object id), inventory,
  the interaction registry, the night phase, the anomaly count — through
  `MissionContext` ports (no duplicated logic). The game layer (`game/mission/`)
  fulfils them; missions are data in `game/content/missions.ts`; state persists in
  the per-scene save. UI: a current-mission widget + objective tracker, start/
  complete/fail notifications with a completion animation, and a developer panel
  (complete / skip-objective / restart / view conditions).
- **Depends on:** the interaction system, inventory, M5 (atmosphere), M6 (anomaly),
  M7 (night phase), the per-scene persistence.
- **Playable:** the compound runs an example patrol → key-errand → vigil chain —
  reach / activate / interact / collect / deliver / survive objectives tracked in
  the widget, with notifications, a completion flourish, and full debug tools.
- **DoD:** fully data-driven (no hardcoded missions); unlimited missions; no
  duplicated detection logic (reuses existing signals); save/load; no per-frame
  allocation (compile-once, 4 Hz evaluation); the developer tools complete / skip /
  restart / inspect; gates green (74 unit tests; runtime-verified objective
  completion + debug + chaining under headless SwiftShader). **No story, no Night
  One — only the framework.**
- **Size:** XL.

---

> **Horror track — provisional numbering.** The milestones below (still labelled
> M4–M12) predate the Director's M2–M4 reseries and are **planning placeholders**;
> their numbers, build-order and dependency references will be reassigned when
> reached. The shipped sequence to date is M0 → M2 (Player) → M3 (Compound) →
> M4 (Core Gameplay Loop) → M5 (Atmosphere Framework) → M6 (Anomaly Engine) →
> M7 (Night Director) → M8 (Mission Framework, above).

### M4 — Doubt + Audio & Environmental kinds
- **Goal:** the full three-kind perception game with **psychological doubt**.
- **Architecture:** **DoubtSystem** (spawns cosmetic false cues whose frequency
  scales inversely with Sanity; never scoreable — R-LOOP-13); add **audio** and
  **environmental** presenters behind the M3 seam; wire env cues (fog/light) and
  audio anomaly playback.
- **Depends on:** M3 (presenter seam), gameStore (Sanity), AudioManager, RngService.
- **Playable:** a Night where you doubt your senses across all three channels.
- **Flag/Release:** `features.doubt`, `features.kinds.audio/env`.
- **DoD:** false cues never drain Sanity/score (invariant test); muted-winnable
  (R-NAR-4); gates green.
- **Size:** L.

---

### M5 — Directives + the 3-Minute Hook (onboarding)
- **Goal:** a Night has a **mission**, and the **first Night hooks in 3 minutes**.
- **Architecture:** **DirectiveSystem** (mission archetypes on `QuestSystem`,
  event-advanced); **StringService** (localized copy, keyed off Telegram
  `language_code`); Supervisor line channel (diegetic toasts); the scripted
  onboarding Night with gentler tuning overrides (NIGHT_PROGRESSION §2).
- **Depends on:** M1 (clock), M3/M4 (anomalies to report), QuestSystem, Telegram.
- **Playable:** the **vertical slice** — a complete, frightening onboarding Night
  with a Directive that teaches the three verbs without a tutorial wall.
- **Flag/Release:** `features.directives`; ships as **closed alpha**.
- **DoD:** dread + agency by 3:00 with zero startles (playtest); comprehensible
  muted; gates green. **← End of Phase 1.**
- **Size:** L.

---

### M6 — Case Files + Night Report (knowledge & reward)
- **Goal:** catching things **means** something across Nights.
- **Architecture:** **CaseFileSystem** + a knowledge store (unlock a dossier entry
  on first correct catch of a variant); **NightReport** summary (caught/missed,
  Sanity-at-dawn, Clean Night); **Standing** meta. Persisted as **meta** (needs
  M7's split, or an interim meta blob).
- **Depends on:** M3/M4 (variants to catalogue), SaveSystem (meta), NightDirector
  (night end).
- **Playable:** finish a Night → see your Report; fill Case Files over several Nights.
- **Flag/Release:** `features.caseFiles`, `features.report`.
- **DoD:** entries unlock only on correct catch (R-REW-5); Report celebrates
  composure (R-REW-4); gates green.
- **Size:** M.

---

### M7 — Save v2: resume + meta split (mobile durability)
- **Goal:** **interruption is never failure**; meta persists across deaths.
- **Architecture:** **SaveData v2** (durable *meta* vs transient *Night
  checkpoint*) + migration + `SAVE_VERSION` bump; hour-boundary autosave (driven by
  NightDirector); background/blur write; **resume** restores the hour and
  **re-rolls** contents from the seed (anti-save-scum); **FailureSequence** (the
  Consumed beat) + retry-from-start.
- **Depends on:** M1 (hours/seed), M6 (meta shape), SaveSystem + port.
- **Playable:** close mid-Night and resume; die and keep all meta; retry freely.
- **Flag/Release:** `features.resume`; migration is mandatory, not flagged.
- **DoD:** resume to the hour, contents re-roll (test); meta survives death;
  corrupt/newer save fails safe (test); gates green. **← End of Phase 2 core.**
- **Size:** L.

---

### M8 — Content Pipeline + Chapters 0–1 (the free arc)
- **Goal:** a **complete free multi-Night chapter arc** across multiple locations.
- **Architecture:** **Content pipeline** — per-Night config (knobs, Directive,
  anchors/nodes, seed policy) as data (DIFFICULTY R-DIFF-8); 2–3 new locations
  (Stairwell, Waiting Room) as `BaseScene`s; **escalating/reactive** anomaly
  behaviours behind the M3 seam; chapter/Night **progression gating** (completion,
  not score).
- **Depends on:** M2 (node authoring), M3–M5 (presentation/missions), M6
  (progression/rewards), M7 (save/resume).
- **Playable:** play Chapters 0–1 start-to-finish — a real, replayable, free arc.
- **Flag/Release:** content flags per chapter; ships as **open beta**.
- **DoD:** Chapters 0–1 completable, comprehensible muted (R-CHP-3); each Night
  obeys the pacing review (HORROR_PACING §8); chapter assets lazy (R-PERF-2);
  gates green. **← End of Phase 2.**
- **Size:** XL (mostly content on stable systems).

---

### M9 — Cloud Profile + Daily Seed + Leaderboards
- **Goal:** social, competitive, synced.
- **Architecture:** **CloudSaveRepository** (the Supabase adapter for the existing
  port — no `SaveSystem` change, R-BAK-1); server-side **initData verification**;
  **DailySeed** (one shared seed/day) + **LeaderboardService**; one-tap Telegram
  share.
- **Depends on:** RngService (seed), M7 (meta/identity), Supabase client.
- **Playable:** a daily shared Night + leaderboard; meta syncs across devices.
- **Flag/Release:** `features.cloud`, `features.daily`; offline play unaffected
  (R-BAK-2). **← Phase 3.**
- **DoD:** equal seed for all (R-REPLAY-4); offline still works; identity verified
  server-side (R-BAK-3); gates green.
- **Size:** L.

---

### M10 — Monetisation (Stars chapters + cosmetics)
- **Goal:** the business, without touching fairness.
- **Architecture:** **EntitlementService** (Telegram Stars purchase + restore);
  **content gating** by entitlement (gates *content*, never mechanics — VISION R1);
  **CosmeticsService** (purely visual).
- **Depends on:** M8 (chapters to sell), M9 (cloud identity/restore), Telegram
  payments.
- **Playable:** buy Chapter 2; equip a cosmetic; restore after reinstall.
- **Flag/Release:** `features.iap`, `features.cosmetics`.
- **DoD:** purchases restore from identity (R5); free vs paid face identical
  difficulty (R-REW-10); gates green.
- **Size:** L.

---

### M11 — Telemetry, Live Config & Hardening
- **Goal:** prove and tune on real devices (soft launch).
- **Architecture:** privacy-respecting **Telemetry** (the VISION §8 metrics);
  **LiveConfig** (remote-tunable knobs; code-owned defaults); device-matrix perf
  hardening to PERFORMANCE budgets; crash hardening.
- **Depends on:** most systems; M9 (backend).
- **Playable:** the same game, instrumented and tuned; soft-launch cohort.
- **Flag/Release:** telemetry opt-in; live-config rollout staged.
- **DoD:** metrics flowing; crash-free ≥ 99.5 %; budgets met on reference device.
  **← Phase 4 / gate to 1.0.**
- **Size:** L.

---

### M12+ — Live Service (continuous stream, post-1.0)
Paid Chapters 2–4 (one new behaviour each), **Season Rotation**, **spatial audio**
(behind the AudioManager API), **NG+/The Long Night**, opt-in Supervisor push,
and (gated) async-social. Each is its own small milestone on stable systems,
shipped continuously (§7). **← Phase 5.**

## 5. Build order (topological)

```
M0 ✅
 └▶ M1 (night+seed+economy)
     ├▶ M2 (node patrol) ─┐
     └▶ M3 (presentation) ┘─▶ M4 (doubt + audio/env)
                                └▶ M5 (directives + hook)  ── Phase 1 done
                                    └▶ M6 (case files + report)
                                        └▶ M7 (save v2 + resume + failure)
                                            └▶ M8 (content pipeline + Ch.0–1)  ── Phase 2 done
                                                └▶ M9 (cloud + daily + boards)
                                                    └▶ M10 (Stars + cosmetics)
                                                        └▶ M11 (telemetry + hardening)
                                                            └▶ M12+ (live service)
```

## 6. Parallelisation (independent tracks)

The architecture lets these run concurrently once their prerequisite lands:

- **M2 (Patrol) ∥ M3 (Presentation)** — both depend only on M1; presentation hangs
  off `AnomalySystem` events, patrol off the camera. Different devs, no conflict.
- **StringService (in M5)** can start right after M0 (no gameplay deps).
- **Content authoring (M8)** can begin (greyboxing locations, writing Directives)
  as soon as M3/M5 seams are stable, in parallel with M6/M7 system work.
- **CloudSaveRepository (M9)** can be built against the `SaveRepository` port in
  parallel with M7/M8, then wired when meta (M7) lands.
- **Telemetry scaffolding (M11)** is cross-cutting and can be threaded in early
  behind a flag.

The serial spine that everything waits on: **M1 → M3 → M7**. Protect it.

## 7. Continuous-release strategy

The trunk is **always releasable**; milestones flip on when their DoD is met.

- **R-REL-1 Trunk-based, gated.** Short-lived branches; every merge passes
  typecheck · lint(0-warn) · test · build (TECH §12). CI enforces it (an M-early
  task).
- **R-REL-2 Feature flags.** New systems land behind a `features` config (env now;
  LiveConfig from M11). Incomplete work ships **dark**; releasing a milestone =
  flipping its flag. Flags are removed once a milestone is fully adopted.
- **R-REL-3 Additive contracts.** `GameEventMap` and store shapes grow by
  **addition**; never break an existing event/field. Old subscribers keep working.
- **R-REL-4 Forward-only saves.** Every persisted-shape change bumps
  `SAVE_VERSION` and ships a migration (R-BAK); a live player's save must survive
  every release. Migrations are never flagged off.
- **R-REL-5 Lazy by chapter.** As content grows, chapters/assets stay
  lazy-loaded (R-PERF-2) so the shell budget (PERFORMANCE §2) never regresses.
- **R-REL-6 Each milestone is a tag.** Cut a `0.x` tag + CHANGELOG entry per
  milestone; the build at that tag is demonstrably playable (its DoD).
- **R-REL-7 Dark-launch backends.** Cloud/IAP (M9/M10) deploy behind flags and
  server checks before exposure; offline-first means a backend outage never
  bricks play (R-BAK-2).
- **R-REL-8 Reversible.** Any milestone can be flagged **off** in a hotfix without
  a redeploy of the whole app if it regresses in the field.

## 8. Milestone → product phase mapping

| Phase (ROADMAP) | Milestones | Releasable as |
| --- | --- | --- |
| 0 Foundation ✅ | M0 | internal |
| 1 Vertical slice | M1–M5 | closed alpha (after M5) |
| 2 Content & story | M6–M8 | open beta (after M8) |
| 3 Commercial foundation | M9–M10 | monetised beta |
| 4 Soft launch | M11 | soft launch → 1.0 gate |
| 5 Live service | M12+ | continuous |

## 9. Architectural risks & mitigations

| Risk | Where | Mitigation |
| --- | --- | --- |
| Presentation seam leaks scoring into the renderer | M3 | Keep scoring in `AnomalySystem`; presenters are event subscribers only (R-ANOM-9), tested. |
| Determinism breaks under resume/re-roll | M1/M7 | Single `RngService`, seed persisted in the checkpoint; no `Math.random`/`Date.now` in sim paths; tests. |
| Node patrol regresses immersion/perf | M2 | Flagged; free-look retained; walk-test sightlines; perf budget gate. |
| Save migration corrupts live meta | M7+ | Versioned + migration + fail-safe load (R-BAK); migration tests before release. |
| Babylon bundle creeps back into the shell | all | R-LAZY guard + per-PR chunk-size review (R-PERF-1/20). |
| Backend coupling sneaks into systems | M9/M10 | Cloud is a `SaveRepository` adapter + services behind ports; systems never import Supabase (R-DEP-4). |
| Monetisation pressure to sell power | M10 | VISION R1 is binding; entitlement gates content only; reviewed. |

## 10. Definition of Done (every milestone)

1. All four gates green (typecheck · lint 0-warn · test · build) — TECH §12.
2. The milestone's **Playable** deliverable is demonstrable on the reference
   low-end device, one-thumb, portrait (where gameplay).
3. New invariants have tests (determinism, real/false anomaly, save migration).
4. Performance budgets intact (shell gzip, lazy Babylon, frame rate) — PERFORMANCE.
5. Behind a feature flag; the trunk still ships with the flag off (R-REL-2).
6. Owning design/pillar docs updated in the same PR (single source of truth).
7. Tagged `0.x` with a CHANGELOG entry (R-REL-6).
