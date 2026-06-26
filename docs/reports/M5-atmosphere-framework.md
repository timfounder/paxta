## Milestone M5 — Atmosphere Framework (dynamic tension)

**Scope** (tension from the environment itself — no enemies, anomalies or scares):

- Environment: dynamic wind intensity, fog-density changes, moonlight variation,
  distant lightning (no rain), power-line humming, tree movement, cotton movement.
- Audio: wind layers, insects, distant dogs, metal creaks, electrical buzzing,
  random ambient events, complete-silence events.
- Psychology: random ambient timing, long quiet periods, small unexpected
  environmental changes, no obvious horror.
- Architecture: a reusable `AtmosphereManager`; every system data-driven.
- Performance: stable 60 FPS on mobile, no unnecessary allocations, optimised
  update frequency.

**Plan recap** (Engineering Planning Phase first, then build):

1. Read the M3/M4 scene, lighting, vegetation, audio and engine-loop code; found
   the constraints that shaped the design (≈550 frozen instances → wind must be
   GPU; no audio assets → synthesise; `engine:paused/resumed` + visibility for
   audio suspend).
2. Data-driven config → pure tested scheduler → GPU wind → sky mood → procedural
   synth → orchestrator → scene wiring.
3. Phase C: gates, headless smoke (shader compile), docs, ROADMAP, report.

**Reused** (no working system rewritten):

- M3 compound verbatim: its two lights, fog, and canopy/cotton **materials** are
  what the atmosphere modulates — it adds no lights or geometry.
- `damp` / `clamp` / `randomRange`, the typed event bus (`engine:paused/resumed`),
  the `Ambience` audio channel + `settingsStore` mute/volume, the `BaseScene`
  update seam, and the M3 vegetation instancing.

**New** (and why new was unavoidable):

- `engine/atmosphere/`: `AtmosphereManager` (orchestrator), `WindField` +
  `WindMaterialPlugin` (GPU vertex sway), `SkyMood` (fog/moon/lightning),
  `AmbienceDirector` (pure scheduler), `ProceduralAmbience` (Web-Audio synth),
  `atmosphere.types`. No existing system offered environmental tension.
- `shared/constants/atmosphere.ts` — the single data-driven tuning surface.
- Tests: `AmbienceDirector.test.ts`, `WindField.test.ts`.
- `compound/lighting` now returns its lights (one-line shape change).

**Key decisions:**

- *Wind is a GPU vertex shader, not CPU.* A `MaterialPluginBase` displaces canopy
  vertices from one shared `WindState` uniform — so all ~550 instances animate for
  free, with zero per-instance CPU and zero per-frame allocation. Per-instance
  phase comes from the `world3` instance attribute under `#ifdef INSTANCES`.
- *Audio is synthesised, not sampled.* No assets exist; `ProceduralAmbience` builds
  the bed from Web-Audio primitives, which also kills loop-fatigue and is fully
  data-driven. It degrades to a silent no-op where Web Audio is unavailable.
- *Psychology is a pure, testable unit.* `AmbienceDirector` owns all timing (random
  events, long quiet periods, dead-silence beats) with an injectable random source
  — deterministic under test, reusable by any scene.
- *Split update frequency.* Cheap eases run per frame; scheduling runs on a 5 Hz
  coarse tick (R-PERF-18a). The audio graph suspends with the engine and on tab
  hide via `engine:paused/resumed` + `visibilitychange` (covers pause and
  exit-to-menu, which don't unload the scene).
- *Engine stays gameplay-free.* The atmosphere lives in `engine/` (generic
  Babylon); the scene injects bindings + settings, mirroring the interaction split.

**Performance:**

- GPU wind (no per-instance CPU); one shared uniform updated per frame.
- No per-frame allocations; audio one-shots are sparse, short-lived, self-cleaning.
- No new lights (modulates the existing two) → light budget held at 4.
- Lightning gated by `prefers-reduced-motion`; audio suspends when hidden (battery).

**Risks** (predicted → mitigation → outcome):

- Vegetation wind too costly on mobile → moved it to the GPU vertex shader →
  allocation-free, scales to any instance count.
- Shader fails to compile → caught by the headless SwiftShader smoke: the first
  attempt used `finalWorld` (undeclared at that injection point); switched to the
  `world3` instance attribute under `#ifdef INSTANCES` → compiles cleanly.
- Web Audio unavailable / autoplay-blocked → graceful no-op + one-time gesture
  unlock + suspend/resume → no errors in any environment.

**Gates:** typecheck ✓ · lint ✓ (0 warn) · test ✓ (47) · format ✓ ·
build ✓ (shell ≈ 54 KB gzip unchanged; Babylon a separate ~1.12 MB gzip lazy
chunk; atmosphere adds ~4 KB gzip to the lazy `CompoundScene` chunk).
Runtime smoke (headless Chromium + SwiftShader): app boots, **the wind vertex
shader compiles**, the scene renders, the atmosphere runs for several seconds and
the audio graph initialises — **zero JS/page/shader errors** (only the
sandbox-blocked external Telegram SDK fails to load).

**Docs updated:** `IMPLEMENTATION_ROADMAP` (M5 entry + banner), `TECH_ARCHITECTURE`
(folders, system table), `WORLD` (§4a Atmosphere), `PERFORMANCE` (R-PERF-18a),
`AUDIO_GUIDELINES` (§5a procedural ambience), `docs/README` (status, v1.6),
repo `README` (folder map), `CHANGELOG` (Unreleased).

**Follow-ups / known limits:**

- The atmosphere is not yet behind a feature flag (no flag system exists yet); it
  is wired directly into the compound, consistent with M3/M4.
- Procedural voices are intentionally simple (a foundation); richer wind/insect
  timbres and a reverb send can come with the audio polish pass.
- Future horror systems can read atmosphere facts once they need them (no
  atmosphere events were added to `GameEventMap` yet — YAGNI).
- Wind sway is kept on under reduced-motion (it is very subtle); only the
  photosensitive lightning is disabled. Revisit if play-testing flags it.
