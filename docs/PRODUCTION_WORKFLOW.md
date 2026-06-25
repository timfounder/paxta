# PRODUCTION WORKFLOW

> Owner of: the **mandatory per-milestone engineering process** ("Production
> Mode"). Every milestone in [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md)
> — and any non-trivial change — passes through this workflow. It orchestrates
> the other docs; it does not restate their rules.
>
> In force from 2026-06-25. Never skipped.

## Scope

Applies to every milestone and every substantive code change. Trivial one-line
fixes skip Phase A but still pass the Phase C gates. When in doubt, run the full
workflow.

## Phase A — Engineering Planning (before any code)

Produce the outputs below **before** touching implementation. They become the
"Plan" and "Risks" sections of the milestone report (Phase C).

1. **Read all documentation.** Enter at [docs/README](./README.md) (the index +
   ownership table), then the pillar docs, the [design suite](./design/GDD.md),
   and the roadmaps. **Output:** the specific constraints that bind this
   milestone (pillars, rules, target tuning, budgets).
2. **Read all existing code related to the milestone.** The systems the
   IMPLEMENTATION_ROADMAP names for it, their `*.types.ts`, and their `*.test.ts`.
   **Output:** a map of the touch-points.
3. **Analyze architecture.** Confirm the layer/placement (TECH_ARCHITECTURE §2,
   §11), the seams it hangs off (events, contracts, ports, stores), and the data
   flow. **Output:** where the work lives and what it depends on.
4. **Look for existing reusable systems.** Explicitly list what already exists
   that this milestone will **reuse** (e.g. `EventBus`, `World`/ECS, the
   `SaveRepository` port, the stores, scene contracts, `RngService` once it
   exists). **Output:** reuse list — prefer extension over new code.
5. **Create an implementation plan.** Ordered, small steps; the exact files to
   add/change (each small and single-responsibility); the feature flag; the tests
   to add; the docs to update. **Output:** the plan.
6. **Estimate risks.** Start from IMPLEMENTATION_ROADMAP §9, add milestone-specific
   risks, each with a mitigation. **Output:** the risk register.
7. **Only then implement.**

## Phase B — Implementation discipline

Six binding rules during coding (they refine, and defer to, CODING_STANDARDS and
TECH_ARCHITECTURE):

- **Never rewrite working systems.** Extend via new adapters / scenes / systems /
  contracts (Open-Closed; TECH R-SOLID-3). Touch a working file only to
  *integrate*, never to rebuild it.
- **Reuse existing architecture.** Depend on the established seams (the typed
  event bus, ports, stores, scene contracts, the composition root). Do not
  reinvent infrastructure that exists.
- **Avoid duplicated logic.** One home per responsibility; lift shared logic to
  the correct layer rather than copying it.
- **Follow existing naming conventions.** CODING_STANDARDS §4 — PascalCase types/
  components, camelCase values, `domain:past-tense` events, branded ids,
  `*.types.ts` / `*.test.ts`.
- **Keep files small.** One responsibility per file; split a file the moment it
  does more than one thing.
- **Keep responsibilities separated.** SRP per module (TECH R-SYS-1). Presentation
  ≠ scoring ≠ state ≠ persistence; cross them only through the documented seams.

## Phase C — After implementation (automatic, never skipped)

Run **in order**, every time:

1. **Self-review** the diff — correctness, reuse, scope creep, leftover dead code.
2. **Refactor** — apply what the review found.
3. **Optimize** — hot-path allocations, coarse selectors, lazy-load seam, the
   PERFORMANCE budgets (shell gzip, Babylon split, 60 FPS).
4. **Type check** — `npm run typecheck`.
5. **Lint** — `npm run lint` (zero warnings).
6. **Test** — `npm run test`. **Format** — `npm run format:check`.
7. **Verify build** — `npm run build` (and confirm the chunk budget held).
8. **Update documentation** — the owning doc(s) in the **same change** (SSOT); the
   GAMEPLAY constant mirror if tuning changed (R-DOC-1); the roadmap status.
9. **Generate a concise milestone report** (template below).

A milestone is not done until 1–9 are green and the report is written.

## Milestone report template

```
## Milestone <id> — <name>

Scope: <goals, one line each>
Plan recap: <the ordered steps actually taken>
Reused: <existing systems/seams reused>
New: <files/systems added — and why new was unavoidable>
Key decisions: <notable architectural choices + rationale>
Risks: <predicted risk → mitigation → actual outcome>
Gates: typecheck ✓ · lint ✓ (0 warn) · test ✓ (<n>) · format ✓ · build ✓ (<shell gzip>)
Docs updated: <which docs>
Follow-ups / known limits: <deferred items, flagged>
```

## Relationship to the other docs

- [IMPLEMENTATION_ROADMAP](./IMPLEMENTATION_ROADMAP.md) defines *which* milestone,
  its dependencies, its DoD, and its feature flag. This defines *how* each is
  executed.
- [CODING_STANDARDS](./CODING_STANDARDS.md) owns the line-level conventions and
  the gate commands; this requires them on every change.
- The quality gates are owned by CODING_STANDARDS §1 / TECH_ARCHITECTURE §12 —
  this workflow mandates running them as Phase C.
