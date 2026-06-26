# PERFORMANCE

> Owner of: performance budgets, frame-timing rules, asset budgets, and
> profiling practice. Targets assume a **low-end Android phone in the Telegram
> in-app webview over 4G** — that is the device we optimise for, not a desktop.

## 1. Why this is a first-class concern

PAXTA runs inside a chat app's webview, not a native game. The hostile case —
a 3-year-old Android, a throttled CPU, a cold cache, mobile data — is the
*common* case. Performance is a feature and a pillar (P3, P5). A 5-second load or
a 20 fps corridor kills dread faster than any design mistake.

## 2. Budgets (binding)

### Load / bundle

| Budget | Target | Current | Rule |
| --- | --- | --- | --- |
| Interactive shell (entry + vendor + css, gzip) | ≤ **120 KB** | ~55 KB | Menu must open without Babylon. |
| Babylon engine chunk (gzip) | isolated, lazy | ~1.1 MB | Loaded on first Shift only (R-PERF-1). |
| Time to interactive (4G, cold) | ≤ **2 s** | — | The Menu is usable in 2 s. |
| Time to first Shift (engine fetch, warm) | ≤ **3 s** | — | Acceptable because it is a deliberate "Enter". |

### Runtime

| Budget | Target | Floor |
| --- | --- | --- |
| Frame rate (mid-range) | **60 fps** | — |
| Frame rate (low-end) | 30 fps | **never < 30 sustained** |
| Frame time (mid-range) | ≤ 16.6 ms | — |
| Draw calls per scene | ≤ **150** | hard cap 250 |
| Active materials per scene | ≤ 20 | — |
| JS heap during a Shift | ≤ **200 MB** | — |
| Crash/ANR-free sessions | ≥ 99.5 % | (VISION metric) |

**R-PERF-0** A change that pushes any metric past its budget does not merge until
it is back under, or the budget is renegotiated in this file with rationale.

## 3. Loading strategy

- **R-PERF-1 Engine is lazy.** Babylon and scenes load via `Game.ensureEngine()`
  on the first `newGame()` (TECH_ARCHITECTURE §7). The shell must never statically
  import Babylon. Verify the build emits a separate `babylon-*.js` chunk + a small
  entry chunk after any `Game`/`useGame`/scene change.
- **R-PERF-2 Content is chapter-lazy.** A chapter's scenes, audio, and assets load
  with that chapter, never in the initial payload. Initial download ships only
  Chapter 0.
- **R-PERF-3 Split by route of need.** Use dynamic `import()` for anything not
  needed to render the Menu. Manual chunks isolate `babylon` and `vendor`.
- **R-PERF-4 Cache-friendly.** Large, stable chunks (Babylon) are emitted with
  content hashes so they cache across sessions/updates.

## 4. Frame-loop rules

The loop lives in `GameEngine.tick` and `World.update`.

- **R-PERF-5 Bounded delta.** Frame delta is clamped to `MAX_FRAME_DELTA` (0.25 s)
  to avoid a spiral of death after a stall/tab-resume. Never feed an unclamped dt
  to a system.
- **R-PERF-6 Fixed-step for determinism.** Systems that must be deterministic use
  `FIXED_TIMESTEP` (1/60 s). Don't tie gameplay logic to render rate.
- **R-PERF-7 No per-frame allocation in hot paths.** No `new` objects, array
  literals, or closures created every tick in `update`/handlers. (E.g.
  `LifetimeSystem` lazily allocates its removal list only when something expires;
  the event bus copies a handler set only on emit — keep these patterns tight.)
- **R-PERF-8 Pause when hidden.** On visibility loss the engine pauses (no
  render/update); resume on return. Background frames are wasted battery (P5).
- **R-PERF-9 One active scene.** `SceneManager` fully unloads the previous scene
  before loading the next; never keep two Babylon scenes resident.

## 5. React rendering rules

- **R-PERF-10 Coarse selectors for hot state.** High-frequency store values
  (Sanity changes every frame while anomalies are active) are selected as
  **rounded/derived** values so components re-render only on visible change. The
  `SanityBar` selects a rounded percentage — follow that pattern (UI R-HUD-4).
- **R-PERF-11 No game logic in render.** Components read and dispatch; the loop
  runs in the engine, not in React effects.
- **R-PERF-12 Stable subscriptions.** Subscribe with narrow selectors; avoid
  subscribing whole stores or creating new selector identities each render.

## 6. 3D / Babylon rules

- **R-PERF-13 Dispose everything.** Meshes, materials, lights, and the player
  camera are disposed on scene unload. Leaks accumulate across Shifts and OOM
  low-end devices. `BaseScene.unload` disposes the Babylon scene; systems clean
  their own resources.
- **R-PERF-14 Cheap materials.** Matte, low-spec, unlit-where-possible materials
  (matches WORLD §7). No PBR/ray-traced look. Share materials across meshes.
- **R-PERF-15 Fog as a culler.** Interior fog (WORLD §7) both sets mood and bounds
  draw distance; keep corridor depth within the ~26-unit budget (WORLD R-SCL-3).
- **R-PERF-16 Few, cheap lights.** Prefer 1 ambient + 1 local light per space
  (the Hallway pattern). Real-time shadows are off by default; justify any shadow.
- **R-PERF-17 Texture budget.** Per scene ≤ 8 MB of GPU textures; power-of-two,
  compressed where the webview supports it; atlas small props.
- **R-PERF-18a Atmosphere is cheap by construction.** Vegetation wind is a GPU
  vertex shader fed one shared uniform per frame — **never** per-instance CPU work.
  The `AtmosphereManager` splits cheap per-frame eases from a 5 Hz scheduling tick,
  allocates nothing on the per-frame path (audio one-shots are sparse and
  short-lived), adds **no** lights (it modulates the existing two), and suspends
  the Web-Audio graph with the engine and on tab-hide (R-PERF-8).

## 7. Asset budgets (per chapter)

| Asset class | Budget per chapter |
| --- | --- |
| Audio (compressed) | ≤ 4 MB (AUDIO R-AUD-9) |
| Textures (compressed) | ≤ 16 MB |
| Models/geometry | ≤ 6 MB |
| Chapter total download | ≤ **25 MB** |

**R-PERF-18** Assets are lazy per chapter (R-PERF-2). A chapter that exceeds its
total download budget must be split or compressed before release.

## 8. Profiling & verification

- **R-PERF-19 Measure on the target.** Profile on a real low-end Android in the
  Telegram webview before claiming a perf win. Desktop fps is not evidence.
- **R-PERF-20 Watch the build report.** Every PR that touches code review the
  Vite chunk sizes; the entry and the babylon split are the canary (R-PERF-1).
- **R-PERF-21 Track, don't guess.** Add lightweight perf logging (frame time, draw
  calls, heap) behind the debug flag; use it, don't eyeball.
- **R-PERF-22 Regression budget.** A feature may spend at most **+5 %** frame time
  or **+10 KB** shell gzip without an explicit budget update here.

## 9. Definition of "performant" (merge checklist)

1. Shell still < 120 KB gzip; Babylon still a separate lazy chunk (R-PERF-1).
2. One full Shift sustains ≥ 30 fps on the reference low-end device (R-PERF-19).
3. No new per-frame allocations in `update`/handlers (R-PERF-7).
4. New 3D resources are disposed on unload (R-PERF-13).
5. Hot React state uses coarse selectors (R-PERF-10).
6. Chapter asset budgets respected (R-PERF-18).
