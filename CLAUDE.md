# PAXTA — project guide for Claude

PAXTA is a commercial **Telegram Mini App psychological-horror game** (React +
TypeScript + Vite + Babylon.js + Zustand; Supabase prepared). The **single
source of truth is [`/docs`](./docs/README.md)** — start at the docs index and
its ownership table. If code and docs disagree, fix one of them in the same change.

## Production Mode (mandatory workflow)

Every milestone and non-trivial change **must** follow
[`docs/PRODUCTION_WORKFLOW.md`](./docs/PRODUCTION_WORKFLOW.md). Do not skip it.

**Phase A — plan before coding:** (1) read all docs, (2) read all code related to
the milestone, (3) analyse architecture, (4) list existing systems to **reuse**,
(5) write an implementation plan, (6) estimate risks, (7) only then implement.

**Phase B — while coding:** never rewrite working systems; reuse existing
architecture; no duplicated logic; follow existing naming; keep files small; keep
responsibilities separated.

**Phase C — after coding, automatically:** self-review → refactor → optimize →
`npm run typecheck` → `npm run lint` (0 warnings) → `npm run test` →
`npm run format:check` → `npm run build` → update the owning docs → write a
concise milestone report (template in the workflow doc).

## Hard invariants (see docs for the full rules)

- **Layering** (TECH_ARCHITECTURE §2): imports point inward only —
  `ui → app → game → engine → core → shared`; `systems`/`state`/`telegram` depend
  on `core`/`shared`. UI never imports engine/systems directly.
- **Lazy engine** (R-LAZY / R-PERF-1): nothing in the initial graph statically
  imports Babylon; the engine loads via `Game.ensureEngine()`. The shell stays
  ~55 KB gzip; Babylon is its own chunk. Verify on every engine/`Game` change.
- **Events & state**: cross-system facts go on the typed `gameEvents` bus
  (`domain:past-tense`, serialisable payloads — ids + primitives). React reads
  Zustand stores with coarse selectors; systems use injected sinks/ports, never
  import stores.
- **Tuning** lives in `src/shared/constants/game.ts`; GAMEPLAY.md mirrors it —
  update both together (R-DOC-1).
- **Build sequence**: milestones follow `docs/IMPLEMENTATION_ROADMAP.md`
  (M0–M12); each is independently playable and lands behind a feature flag.

## Scope discipline

Implement only the requested milestone. Keep future-milestone systems in the
codebase but unwired until their milestone. Never sell or gate mechanics for
money (VISION R1). Atmosphere over jump scares (Pillar 1).

## Conventions

Strict TS (no `any`, no non-null `!`), branded ids, `Result` for expected
failures, `import type`, function-property store actions. Full rules in
[`docs/CODING_STANDARDS.md`](./docs/CODING_STANDARDS.md).
