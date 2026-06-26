# PAXTA — Documentation

This directory is the **single source of truth** for PAXTA. If code and docs
disagree, that is a bug: fix one of them in the same pull request. If two
documents disagree, the **owner** of the disputed fact (see table) wins.

> Status: shipped — M1 (shell + mobile controls), M2 (Player Core), M3 (the
> PAXTA cotton compound — explorable world), M4 (Core Gameplay Loop — the
> universal interaction + inventory foundation), M5 (Atmosphere Framework — a
> reusable, data-driven environmental tension system: dynamic wind, fog and
> moonlight, silent lightning, and a procedural ambience bed), M6 (Anomaly
> Engine — a data-driven anomaly framework with a developer overlay), M7 (Night
> Director — data-driven orchestration of the six-phase night: pacing, tension and
> progression), M8 (Mission Framework — data-driven objectives / progression /
> rewards / save, integrating every system with no duplicated logic; widget,
> tracker, notifications and developer tools). Game design complete (see
> [design/GDD](./design/GDD.md)). **Production Mode is in force** — every milestone
> follows [PRODUCTION_WORKFLOW](./PRODUCTION_WORKFLOW.md).
> Next: horror systems (see [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md)).
> Last reviewed: 2026-06-26 · Doc set version: 1.9

> **Two layers of docs.** The files in this folder are the **pillar docs**
> (principles, standards, constraints). The detailed **game design** lives in
> [`docs/design/`](./design/GDD.md) — the GDD suite. Pillar docs own principles;
> the GDD suite owns the fully-designed game. Where they touch the session model,
> the GDD supersedes (it defines the 10–15 min **Night**).

## Read order

New contributors read in this order:

1. [VISION](./VISION.md) — what PAXTA is and why it exists.
2. [GAMEPLAY](./GAMEPLAY.md) — the core loop and every tunable number.
3. [STORY](./STORY.md) & [WORLD](./WORLD.md) — fiction, tone, and setting rules.
4. [TECH_ARCHITECTURE](./TECH_ARCHITECTURE.md) — how the code is organised.
5. [CODING_STANDARDS](./CODING_STANDARDS.md) — how we write that code.
6. [UI_GUIDELINES](./UI_GUIDELINES.md), [AUDIO_GUIDELINES](./AUDIO_GUIDELINES.md),
   [PERFORMANCE](./PERFORMANCE.md) — craft constraints.
7. [ROADMAP](./ROADMAP.md) — product phases and exit metrics.
8. [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md) — the engineering
   milestone plan (M0–M12), system dependency graph, and continuous-release
   strategy. Each milestone is independently playable.
8b. [PRODUCTION_WORKFLOW](./PRODUCTION_WORKFLOW.md) — the mandatory per-milestone
   engineering process (plan → implement → review/refactor/optimize → gates →
   docs → report). Read before building any milestone.
9. [design/GDD](./design/GDD.md) — the full Game Design Document suite (the
   designed game in detail: loop, Night, difficulty, missions, anomalies,
   pacing, rewards, save, failure, replay, progression, expansion).

## Ownership of canonical facts

Every shared fact has exactly one owning document. Reference it; never restate
a number that another document owns.

| Fact | Owner |
| --- | --- |
| Product vision, pillars, commercial model | [VISION](./VISION.md) |
| Balance constants, loop, scoring, difficulty | [GAMEPLAY](./GAMEPLAY.md) |
| Fiction, terminology, tone, chapter structure | [STORY](./STORY.md) |
| Locations, world rules, scene authoring | [WORLD](./WORLD.md) |
| Layers, folders, systems, data flow | [TECH_ARCHITECTURE](./TECH_ARCHITECTURE.md) |
| Visual tokens, screens, HUD, interaction | [UI_GUIDELINES](./UI_GUIDELINES.md) |
| Audio channels, mixing, formats | [AUDIO_GUIDELINES](./AUDIO_GUIDELINES.md) |
| Budgets, frame timing, profiling | [PERFORMANCE](./PERFORMANCE.md) |
| Product phases, exit metrics, phase DoD | [ROADMAP](./ROADMAP.md) |
| Engineering milestones, system dependency graph, release strategy | [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md) |
| The per-milestone production workflow (plan → build → verify → report) | [PRODUCTION_WORKFLOW](./PRODUCTION_WORKFLOW.md) |
| TS/lint/test conventions, naming, commits | [CODING_STANDARDS](./CODING_STANDARDS.md) |
| **Session model (the Night), detailed design, target tuning** | [design/GDD](./design/GDD.md) + suite |

Detailed design facts (loop, Night structure, difficulty values, mission
archetypes, anomaly catalogue, pacing, rewards, save UX, failure, replay,
progression, expansion) are owned by the matching file in
[`docs/design/`](./design/GDD.md) — see that suite's own ownership table.

**The one exception:** gameplay tuning numbers are owned by the *code*
(`src/shared/constants/game.ts`). GAMEPLAY.md mirrors them and must be updated in
the same PR that changes the constants.

## Design pillars (verbatim, referenced everywhere)

1. **Dread over gore** — sustained unease, not shock or violence.
2. **Perception is the mechanic** — the game is noticing, doubting, deciding.
3. **Telegram-native** — short nightly sessions (10–15 min), instant load,
   social hooks, no install.
4. **Fair but unforgiving** — every anomaly is perceivable; failure is the
   player's, never the engine's.
5. **Persistent unease, low friction** — offline-first, resumable, battery-aware.

Any feature that does not serve a pillar is cut. Cite the pillar number in
design proposals.
