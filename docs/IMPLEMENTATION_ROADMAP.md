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
  `interaction/` (`Interactable` interface + `InteractionProbe` forward ray),
  orchestrated by a thin `PlayerController`. Extends the `ControllableScene`
  contract (sprint/crouch/interact); adds interaction events + `uiStore` focus;
  HUD gains a reticle + sprint/crouch/interact buttons; `damp` smoothing util.
- **Depends on:** M1 (controller, joystick/look UI, scene contract), GameEngine.
- **Playable:** walk the Hallway with gravity, wall collision, sprint, crouch,
  head-bob and a smoothed camera; examine a demo prop via the interaction ray.
- **DoD:** one-thumb portrait; allocation-free hot path (R-PERF-7); pure logic
  unit-tested; gates green. **No horror/AI/missions/inventory.**
- **Size:** L.

---

### M3 — Anomaly Presentation v1 (you can finally *see* it)
- **Goal:** anomalies become **perceivable** — real visual manifestations with
  subtlety tiers and report feedback. The first genuinely *playable horror loop*.
- **Architecture:** new **AnomalyPresentation** layer — a per-kind presenter that
  subscribes to `anomaly:spawned/resolved/missed` and renders/hides the Babylon
  manifestation at the anomaly's transform (scoring stays in `AnomalySystem`,
  R-ANOM-9). Visual kind + subtlety-tier data. Catch/false-alarm feedback (audio
  cue + haptic + HUD), reusing AudioManager + TelegramService.
- **Depends on:** M1 (anomaly lifecycle/events), M2 recommended (authored
  sightlines), AudioManager, TelegramService.
- **Playable:** spot real visual wrongs across tiers and report them in a Night —
  the core fun, end to end.
- **Flag/Release:** `features.presentation`; presenters register per kind so audio/
  env (M4) slot in without touching the seam.
- **DoD:** all visual tiers readable on a phone in the dark (R-ANOM-4); the
  real/false invariant holds (scoreable iff lifetime entity — tested); gates green.
- **Size:** XL (the central seam).

---

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
