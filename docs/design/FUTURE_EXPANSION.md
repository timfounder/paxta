# FUTURE EXPANSION

> Owner of: where PAXTA grows after launch, and the guardrails every expansion
> must pass. Sequencing lives in ROADMAP; this owns the *design space* and its
> limits. The point of writing this now is to keep v1 small while protecting room
> to grow.

## 1. Expansion philosophy

PAXTA grows by **deepening the same game**, not by bolting on genres. More PAXTA —
more Nights, more wrong things, more of the building — is the product (VISION §10).

- **R-EXP-1 Every expansion serves a pillar.** Cite the pillar in the proposal
  (docs/README). No feature earns a slot by being "cool."
- **R-EXP-2 Every expansion fits a 10–15 minute Night, one thumb, muted.** The
  session model (GDD §3) and verb set (GDD §4) are load-bearing; expansions extend
  *content and depth*, rarely *mechanics*.
- **R-EXP-3 Atmosphere-first, always.** No expansion may shift PAXTA toward action,
  gore, or jump-scare spectacle (Pillar 1, HORROR_PACING).

## 2. Near-term (Chapters 2–4, aligned to ROADMAP)

The strongest, lowest-risk growth: more authored content on the existing systems.

- **New chapters & locations** (STORY §6, WORLD §4): the Stairwell, Waiting Room,
  Records Office, and beyond — each a new patrol with its own correct state and
  dread.
- **One new anomaly behaviour per chapter** (ANOMALY §5: Migratory, Mimic, …) —
  the disciplined cadence that keeps the vocabulary fresh (GAMEPLAY R-DIF-2).
- **New Directive flavour** within the five archetypes (MISSION_DESIGN §3) — new
  framings, not new verbs.
- **Spatial audio** (AUDIO §8): positional anomaly sound behind the existing
  `AudioManager` API (Open/Closed) — pure depth, no new player input.

## 3. Mid-term (live service)

- **Daily Seed & Season Rotation** (REPLAYABILITY, VISION §7): recurring shared
  Nights and a free seasonal challenge track with an optional paid cosmetic/lore
  Dossier.
- **Cloud profile & leaderboards** (TECH R-BAK): the Supabase adapter, verified
  identity, weekly boards.
- **Supervisor push** (STORY R-NAR-3): opt-in between-Night messages as retention
  *and* story — never spam (VISION §8 caution).

## 4. Long-term (post-1.0, higher risk — gated)

These are **designed-for, not committed**. Each needs a dedicated design pass and
must clear §6 guardrails.

| Idea | Promise | Primary risk |
| --- | --- | --- |
| **Tenure (NG+)** & **The Long Night** | Endgame depth for veterans (REPLAYABILITY) | Content cost |
| **Async social ("ghost Nights")** | See a friend's failed/cleared seed; light competition | Scope; must not break solitude |
| **A second presence / co-watch** | Two Custodians, shared dread | Dilutes solitude (the core of dread) — high bar |
| **UGC anomaly authoring** | Player-made wrongs, curated | Moderation & safety burden |
| **New anomaly *classes*** (beyond visual/audio/environmental) | Fresh perception channels (e.g. *temporal*) | Could break the doubt model / readability |
| **Non-Telegram ports** | Reach | Only after Telegram product-market fit (VISION §9) |

- **R-EXP-4 Solitude is sacred.** Anything multiplayer/social must preserve the
  feeling of being *alone* in PAXTA. Co-presence is a high bar, not a default
  (Pillar 1).
- **R-EXP-5 UGC needs moderation *before* launch, not after.** Player-authored
  content ships only with safety/curation in place.

## 5. Deferred mechanics (the "not yet" list)

Mechanics intentionally **out** of v1 (GDD §4), parked here so future need is a
*decision*, not an accident:

- **An "interact/use" verb** (pick up / place / operate). The single most likely
  fourth verb. Deferred because the three-verb purity is a feature. Revisit only
  if a Directive archetype genuinely cannot be expressed by watch-and-report
  (MISSION_DESIGN R-MIS-5) — and even then, prefer redesign.
- **Resource management** (light/battery, stamina). Cut as unnecessary (GDD §4).
  Only reconsider if a *whole chapter's identity* depends on it (e.g. a deeper
  Blackout), and never as busywork.
- **Branching narrative trees** (REPLAYABILITY R-REPLAY-7): flavour-branching now;
  divergent content only if data proves players want it.

- **R-EXP-6 A new verb is a franchise-level decision.** Adding a fourth verb
  changes what PAXTA *is*; it requires Director sign-off, a pillar justification,
  and updates across GDD/CORE_LOOP/MISSION_DESIGN (TECH §11, CODING R-DOC).

## 6. Expansion guardrails (the gate every proposal passes)

1. **Serves a pillar** (cited) and doesn't violate another (R-EXP-1).
2. **Fits 10–15 min, one thumb, muted** (R-EXP-2).
3. **Atmosphere-first**; adds no gore/action/shock (R-EXP-3).
4. **Mechanic budget**: extends content/depth, not the verb set — or pays the
   franchise-level cost of a new verb (R-EXP-6).
5. **Fairness intact**: no new way to lose unfairly (FAILURE_CONDITIONS).
6. **Monetisation clean**: never sells power (VISION R1).
7. **Performance budget**: within PERFORMANCE §2 (chapter-lazy assets, R-PERF-2).

## 7. The 5-year shape (the north star)

PAXTA as the reference horror franchise on Telegram (VISION §10): a living
building players patrol nightly, a growing dossier of wrong things, a seasonal
cadence of shared Nights, and a story that remembers them — every addition still
a quiet, atmospheric, 10–15 minute descent into the same dread.
