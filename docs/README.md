# PAXTA — Documentation

This directory is the **single source of truth** for PAXTA. If code and docs
disagree, that is a bug: fix one of them in the same pull request. If two
documents disagree, the **owner** of the disputed fact (see table) wins.

> Status: Foundation complete (engine, systems skeletons, tooling).
> Next milestone: gameplay systems (see [ROADMAP](./ROADMAP.md)).
> Last reviewed: 2026-06-25 · Doc set version: 1.0

## Read order

New contributors read in this order:

1. [VISION](./VISION.md) — what PAXTA is and why it exists.
2. [GAMEPLAY](./GAMEPLAY.md) — the core loop and every tunable number.
3. [STORY](./STORY.md) & [WORLD](./WORLD.md) — fiction, tone, and setting rules.
4. [TECH_ARCHITECTURE](./TECH_ARCHITECTURE.md) — how the code is organised.
5. [CODING_STANDARDS](./CODING_STANDARDS.md) — how we write that code.
6. [UI_GUIDELINES](./UI_GUIDELINES.md), [AUDIO_GUIDELINES](./AUDIO_GUIDELINES.md),
   [PERFORMANCE](./PERFORMANCE.md) — craft constraints.
7. [ROADMAP](./ROADMAP.md) — sequence of work.

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
| Milestones, sequencing, definition of done | [ROADMAP](./ROADMAP.md) |
| TS/lint/test conventions, naming, commits | [CODING_STANDARDS](./CODING_STANDARDS.md) |

**The one exception:** gameplay tuning numbers are owned by the *code*
(`src/shared/constants/game.ts`). GAMEPLAY.md mirrors them and must be updated in
the same PR that changes the constants.

## Design pillars (verbatim, referenced everywhere)

1. **Dread over gore** — sustained unease, not shock or violence.
2. **Perception is the mechanic** — the game is noticing, doubting, deciding.
3. **Telegram-native** — micro-sessions, instant load, social hooks, no install.
4. **Fair but unforgiving** — every anomaly is perceivable; failure is the
   player's, never the engine's.
5. **Persistent unease, low friction** — offline-first, resumable, battery-aware.

Any feature that does not serve a pillar is cut. Cite the pillar number in
design proposals.
