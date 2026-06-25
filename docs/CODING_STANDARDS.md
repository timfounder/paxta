# CODING STANDARDS

> Owner of: TypeScript/lint/format conventions, naming, error handling, testing,
> and commit/PR rules. TECH_ARCHITECTURE owns *where* code lives; this owns *how*
> it is written. These rules are enforced by tooling and review.

## 1. Non-negotiable gates

Every PR must pass, locally and in CI:

```
npm run typecheck   # tsc -b, strict
npm run lint        # eslint, --max-warnings 0  (warnings fail)
npm run test        # vitest run
npm run build       # tsc -b && vite build
npm run format:check
```

**R-DOC-1** If a change alters gameplay constants
(`src/shared/constants/game.ts`), update the mirror tables in
[GAMEPLAY](./GAMEPLAY.md) in the **same** PR.

## 2. TypeScript rules

We run strict mode plus extra strictness (`tsconfig.app.json`). Consequences:

- **R-TS-1 No `any`.** Use `unknown` at boundaries and narrow. No `as any`, no
  non-null assertions (`!` is an error). Validate, then type.
- **R-TS-2 `exactOptionalPropertyTypes`.** Don't assign `undefined` to optional
  props; model absence with `T | null` and explicit checks (e.g. `engine: GameEngine | null`).
- **R-TS-3 `verbatimModuleSyntax`.** Type-only imports use `import type` /
  inline `type` (lint autofixes the style). Value vs type imports are explicit.
- **R-TS-4 Explicit public signatures.** Exported functions/methods declare
  return types. Internal inference is fine.
- **R-TS-5 `noUnusedLocals/Parameters`.** Prefix intentionally-unused params with
  `_` (e.g. `_deltaSeconds`). Dead code is deleted, not commented out.
- **R-TS-6 `noImplicitOverride`.** Subclass overrides (e.g. `BaseScene` hooks) use
  the `override` keyword.
- **R-TS-7 `noImplicitReturns` / no fallthrough.** Every path returns; `switch`
  cases break or return.

## 3. Domain typing patterns

- **R-DOM-1 Branded ids.** Identifiers use branded types (`EntityId`, `SceneId`,
  `QuestId`, `AnomalyId`, `SaveSlotId`, …) from `shared/types/branded`. Never pass
  a raw `string` where a branded id is expected; convert at trust boundaries with
  `asBrand` / `createBrandedId` only.
- **R-DOM-2 `Result` for expected failure.** Operations that can fail in normal
  flow (parse, persist, validate) return `Result<T, E>` and are narrowed with
  `.ok`. Reserve `throw` for truly exceptional/programmer errors.
- **R-DOM-3 Discriminated unions over flags.** Model states as unions (e.g.
  `GamePhase`, `Result`) and switch on the discriminant; avoid boolean soup.
- **R-DOM-4 `as const` enums.** Enumerations are `as const` objects + a derived
  union type (the `GamePhase`/`AnomalyKind`/`Screen` pattern), not TS `enum`.
- **R-DOM-5 Serialisable boundaries.** Anything crossing the event bus, a save, or
  the network is plain JSON (ids + primitives) — no class instances (TECH R-EVT-1).

## 4. Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Class / type / interface / React component | PascalCase | `AnomalySystem`, `SanityBar` |
| Variable / function / method | camelCase | `reportAnomaly`, `lastEmitted` |
| Constant group (tuning) | `as const` object, UPPER keys | `ANOMALY.SPAWN_CHANCE` |
| Event name | `domain:past-tense` | `anomaly:resolved`, `player:died` |
| Branded id type | PascalCase + `Id` | `EntityId` |
| File: class/component | PascalCase | `GameEngine.ts`, `Hud.tsx` |
| File: utils/modules | camelCase | `gameStore.ts`, `math.ts` |
| File: types / tests | `*.types.ts` / `*.test.ts` | `anomaly.types.ts` |

- **R-NAME-1** Names state intent, not type (`anomalies`, not `arr`). Booleans read
  as predicates (`isLoaded`, `running`).
- **R-NAME-2** Event names are facts (past tense), not commands (R-EVT-2).
- **R-NAME-3** Use the canonical domain terms (STORY §2). Code may keep neutral
  names (`Quest` ≈ player-facing "Directive"); don't rename code to flavour, but
  don't invent competing domain words either.

## 5. Modules & imports

- **R-IMP-1** Import via path aliases (`@core`, `@systems`, …), not deep relative
  chains across layers. Same-folder relative imports are fine.
- **R-IMP-2** No barrel `index.ts` hubs (TECH R-FLD-3). Import the exact module so
  bundlers tree-shake and dependencies stay explicit.
- **R-IMP-3** Respect the dependency rule (TECH §2). A lint/review failure here is
  an architecture bug, not a style nit.
- **R-IMP-4** Dynamic `import()` only for deliberate code-splitting seams
  (the engine — TECH R-LAZY); not for routine modules.

## 6. Error handling & logging

- **R-ERR-1** Expected failures → `Result` (R-DOM-2). Unexpected → throw an `Error`
  with a message that names the offending value/context.
- **R-ERR-2** Catch at the boundary that can do something about it (a repository,
  a service). Don't swallow errors silently; log via the namespaced `logger`.
- **R-ERR-3** Logging goes through `shared/utils/logger` (namespaced, level-gated),
  never bare `console.*`. `console.warn`/`console.error` are allowed only inside
  the logger. Debug logging is gated by the debug flag.
- **R-ERR-4** Fail safe at platform edges: `TelegramService`/`localStorage` access
  degrade to no-ops/defaults rather than crashing the app (TECH R-TG, save adapter).

## 7. Systems & SOLID in practice

- **R-SOLID-1 SRP:** one reason to change per module (TECH R-SYS-1).
- **R-SOLID-2 DIP:** systems depend on injected interfaces (`PlayerVitals`,
  `ScoreBoard`, `SaveRepository`, `EventBus`), constructed by `Game`. Systems do
  not `import` stores or singletons (TECH R-ST-1).
- **R-SOLID-3 OCP:** extend via new adapters/scenes/systems, not by editing stable
  cores (a cloud save is a new `SaveRepository`, not a `SaveSystem` edit).
- **R-SOLID-4 ISP:** expose the narrowest interface a consumer needs
  (`ReadonlyEventBus`, the `ReportingScene` contract).
- **R-SOLID-5 Constructor injection.** Dependencies arrive via the constructor as
  a typed bundle when there are several (the `AnomalySystemDeps` pattern), not via
  globals or service-locator lookups.

## 8. React rules

- **R-RX-1** Function components only; hooks for logic. No class components.
- **R-RX-2** `react-hooks` rules are errors; honour dependency arrays.
- **R-RX-3** `react-refresh/only-export-components`: a component file exports
  components (+ its props type) — no runtime constants exported from `.tsx`.
- **R-RX-4** No game logic in components (TECH R-ST-4); dispatch to `Game`/stores.
- **R-RX-5** Store action types are **function-property** declarations, not method
  shorthand, to stay `unbound-method`-safe when passed as callbacks.

## 9. Formatting (Prettier — do not hand-fight it)

Config (`.prettierrc.json`), for reference: single quotes, semicolons,
`trailingComma: all`, `printWidth: 100`, 2-space indent, always-parens arrows,
LF line endings. Run `npm run format`; never reformat by hand to a different style.

## 10. Comments & documentation

- **R-CMT-1** Comment the **why**, not the **what**. Explain non-obvious
  invariants (e.g. "remove from active before entity removal so the handler
  doesn't double-count a miss"), tuning rationale, and platform quirks.
- **R-CMT-2** Public classes/systems carry a short doc comment stating their single
  responsibility (match the existing style).
- **R-CMT-3** No commented-out code, no dead TODOs without an owner/issue.
- **R-CMT-4** Match surrounding density and idiom; don't narrate self-evident lines.

## 11. Testing

- **R-TEST-1** Pure logic (`core`, `systems`, `shared`) has Vitest unit tests
  co-located as `*.test.ts`. New scoring/lifecycle/state branches ship with a test.
- **R-TEST-2** Test behaviour through public APIs, with fakes for ports (the
  in-memory `SaveRepository` pattern), not internals.
- **R-TEST-3** Invariants get tests: e.g. "only entities with a `LifetimeComponent`
  score" (GAMEPLAY R-DBT-2), save version-mismatch is rejected.
- **R-TEST-4** Tests are deterministic — inject clocks/fakes; never depend on real
  time, randomness, network, or a real DOM/Babylon in unit tests.
- **R-TEST-5** Engine/Babylon and full UI flows are verified by a manual one-Shift
  play-through (TECH §12) until an integration harness exists (ROADMAP).

## 12. Git & pull requests

- **R-GIT-1** Small, focused PRs with a one-paragraph rationale and the pillar(s)
  /rule(s) they serve.
- **R-GIT-2** Conventional, imperative commit subjects (`Add stairwell scene`,
  `Fix double-count on anomaly resolve`). Body explains *why*.
- **R-GIT-3** A PR is mergeable only when all gates (§1) are green and any
  affected doc is updated in the same PR (single source of truth).
- **R-GIT-4** No secrets, keys, or `.env` committed; only `.env.example` is tracked.

## 13. Adding a module (checklist)

1. Correct layer/folder (TECH §11) and dependency direction (R-IMP-3)?
2. One responsibility, deps injected (R-SOLID-1/2)?
3. Strict-clean: no `any`, no `!`, explicit return types (R-TS-1/4)?
4. Branded ids, `Result` where it can fail (R-DOM-1/2)?
5. Tests for new logic branches (R-TEST-1)?
6. Owning doc updated if behaviour/constants changed (R-DOC-1, R-GIT-3)?
7. All gates green (§1)?
