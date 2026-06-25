# ROADMAP

> Owner of: milestone sequencing, deliverables, and definition of done. This is
> the order we build PAXTA. Scope is fixed by the pillars; only sequence is
> negotiable.

## Versioning & cadence

- **SemVer-ish:** `0.x` until the public soft launch (`1.0`). Minor = a Phase.
- **Save compatibility:** any change to `SaveData` bumps `SAVE_VERSION` and ships
  a migration (TECH_ARCHITECTURE R-BAK; GAMEPLAY save protocol).
- **Every merge passes the quality gates** (typecheck · lint 0-warn · test ·
  build) — TECH_ARCHITECTURE §12. CI enforcing this is a Phase 1 deliverable.

## Status legend

✅ done · 🔜 next · ⏳ planned

---

## Phase 0 — Foundation ✅

**Goal:** a production-grade skeleton the whole team can build on.

Delivered:
- Layered architecture (`shared/core/engine/systems/game/state/telegram/services/app/ui`)
  with the dependency rule enforced (TECH_ARCHITECTURE §2).
- System skeletons: `GameEngine`, `SceneManager`, `PlayerController`, ECS `World`,
  `AnomalySystem`, `AudioManager`, `SaveSystem`, `QuestSystem`, typed event bus.
- The Hallway scene + Chapter-1 directive wired end-to-end (loop is playable).
- Tooling: strict TS, ESLint (0-warn), Prettier, path aliases, Vitest suite.
- Lazy engine loading; shell ~55 KB gzip (PERFORMANCE R-PERF-1).

**DoD:** ✅ builds, lints, types, tests green; one full Shift runs; menu loads
without Babylon.

---

## Phase 1 — Gameplay vertical slice 🔜 (current focus)

**Goal:** the core loop is genuinely *fun and frightening* in one location. This
is the "gameplay systems" work the foundation was built for.

Deliverables:
- **Anomaly presentation** for all three kinds (`visual`/`audio`/`environmental`)
  in the Hallway — real, perceivable manifestations (GAMEPLAY R-ANO-*).
- **The doubt system:** low-Sanity false cues that are cosmetic and non-scoring
  (GAMEPLAY §6); the real/false invariant covered by tests (R-DBT-2).
- **Report feedback:** audio + haptic + HUD response on catch / miss / false
  alarm (UI R-INT-4, AUDIO §4).
- **Audio pass:** ambience loop + report/anomaly SFX through `AudioManager`,
  mobile-unlock verified (AUDIO §3).
- **Onboarding:** the 10-second-dread first Shift with gentler constants
  (VISION §5, GAMEPLAY R-DIF-3).
- **CI** running the four quality gates on every PR.

**DoD / exit criteria:**
1. A new player feels dread within 10 s, no jump-scare (VISION 10-s rule).
2. A full Shift sustains ≥ 30 fps on the reference low-end device (PERFORMANCE).
3. All anomaly kinds are catchable and the false-cue invariant holds (tested).
4. Playtest: testers say a loss felt fair (Pillar 4), not arbitrary.

---

## Phase 2 — Content & story (Chapters 0–1) ⏳

**Goal:** a complete, free, satisfying horror arc (VISION R3, STORY R-CHP-1).

Deliverables:
- **String layer** (localisable, no hard-coded copy — STORY §7, UI R-TXT-1).
- **Supervisor voice:** glanceable directives and between-beat lines (STORY R-NAR-1/2).
- **Second & third locations** (Stairwell, Waiting Room) authored to WORLD §6,
  each adding one new anomaly behaviour (GAMEPLAY R-DIF-2).
- **Save/resume between Shifts**, including progress and quest snapshots.
- **Settings persistence** (volumes/haptics survive restarts).

**DoD:** Chapters 0–1 are playable start-to-finish, **comprehensible muted**
(STORY R-CHP-3), with a real ending for non-paying players.

---

## Phase 3 — Commercial foundation ⏳

**Goal:** the systems that make PAXTA a business, without touching fairness.

Deliverables:
- **Cloud sync & leaderboards:** Supabase wired as a `SaveRepository` adapter +
  a leaderboard service; server-side `initData` verification (TECH R-BAK-1/3).
- **Telegram Stars purchases:** permanent chapter unlocks; restore from identity
  (VISION R5). Entitlement checks gate *content*, never mechanics (VISION R1).
- **Referral & gifting** via `start_param` (VISION §7, STORY R-NAR-3).
- **Cosmetics** (Custodian Kit) plumbing — purely visual (VISION R1).

**DoD:** a player can buy Chapter 2, lose their device, reinstall via Telegram,
and recover everything; offline play still works for owned content (TECH R-BAK-2).

---

## Phase 4 — Soft launch & hardening ⏳

**Goal:** prove the loop and the model with real players on real devices.

Deliverables:
- **Telemetry** for the VISION §8 metrics (privacy-respecting, aggregate).
- **Device matrix testing** + perf hardening to budgets (PERFORMANCE §2).
- **Crash-free ≥ 99.5 %**; graceful degradation in poor webviews.
- **Balance pass** driven by data (GAMEPLAY balance protocol).
- **Live config** for tuning constants without a redeploy (still code-owned defaults).

**DoD / exit criteria (gate to 1.0):** D1 ≥ 35 %, D7 ≥ 12 %, median session
10–15 min (one Night), crash-free ≥ 99.5 % on the soft-launch cohort (VISION §8).

---

## Phase 5 — Live service & paid chapters ⏳ (1.0+)

**Goal:** a living franchise players return to nightly (VISION §10).

Deliverables:
- **Season Rotation:** recurring free anomaly challenges + optional paid Dossier.
- **Paid Chapters 2–4** on the established cadence (STORY §6), one new mechanic each.
- **Handler push:** Supervisor messages between Shifts as retention + story
  (STORY R-NAR-3) — opt-in, never spam (VISION §8 caution).
- **Spatial audio** upgrade behind the existing `AudioManager` API (AUDIO §8).

**DoD:** a sustainable content cadence with retention holding or rising
season-over-season; each release passes all gates and budgets.

---

## Continuous, every phase

- Docs stay the source of truth: any behaviour change updates the owning doc in
  the same PR (docs/README ownership).
- Budgets (PERFORMANCE) and pillars (VISION) are checked at review, not at release.
- No phase ships with a known fairness regression (Pillar 4) or a perf budget
  breach (PERFORMANCE R-PERF-0).

## Explicitly later (not on this roadmap yet)

Multiplayer, UGC anomalies, procedural infinite mode, non-Telegram ports — see
VISION §9. Revisit only after Phase 4 proves product-market fit.
