# WORLD

> Owner of: locations, the physical/logical rules of the PAXTA world, scale and
> spatial conventions, and **how to author a scene**. STORY.md owns meaning;
> this owns space and consistency.

## 1. The setting

PAXTA is experienced as a sequence of **liminal interiors**: the parts of
ordinary buildings you pass through but never linger in — night corridors,
stairwells, service hallways, waiting rooms — rendered slightly too long, too
quiet, too symmetrical. The world is **mundane materials, wrong proportions**.

The unifying aesthetic: *a place that was designed for people, at an hour when no
people should be there.* Fluorescent hum, fog-thick air, doors that imply rooms.

## 2. World rules (the "physics" of PAXTA)

These rules make anomalies legible. They are the contract the player learns.

- **R-WLD-1 The correct state is stable and learnable.** A location has a
  canonical, "right" configuration. Players must be able to internalise it. We
  never change the baseline mid-Shift except as a scored anomaly.
- **R-WLD-2 Wrongness is local and discrete.** An anomaly affects a bounded thing
  (an object, a sound, a light), not "the whole room vibes off." This is what
  makes it reportable (GAMEPLAY R-ANO-2).
- **R-WLD-3 The world does not punish movement.** No fall damage, no instant
  death traps, no missable timed corridors. Threat comes from *perception load*
  and Sanity, not platforming.
- **R-WLD-4 Light is information and mercy.** Lit areas are readable and safer;
  darkness hides anomalies and frays nerves. Lighting is a design tool, never
  pure obstruction (P4, GAMEPLAY R-DIF-1).
- **R-WLD-5 PAXTA is aware.** The building reacts to *being watched* and to the
  Custodian's history. Reactions are subtle and earned (STORY R-NAR-5).
- **R-WLD-6 No exit is free.** Leaving a Shift is a choice with weight (the
  Telegram closing-confirmation is diegetic — STORY R-NAR-3).

## 3. Scale & spatial conventions

All authored to match the engine and player controller. **These are binding.**

| Convention | Value | Source |
| --- | --- | --- |
| Unit | 1 world unit = **1 metre** | Engine convention |
| Camera eye height | **1.7** units | `PLAYER.EYE_HEIGHT` |
| Walk speed | **3.2** units/s | `PLAYER.MOVE_SPEED` |
| Ground plane | y = 0 | `HallwayScene` |
| Corridor width (reference) | ~6 units | `HallwayScene` floor width |
| Ceiling height (reference) | ~3 units | `HallwayScene` ceiling |
| Camera near plane | 0.1 | `PlayerController` |

Rules:
- **R-SCL-1** Build to human scale. A doorway is ~1×2 units; a corridor lets the
  player pass without precision steering at 3.2 u/s.
- **R-SCL-2** Eye height is 1.7. Place "notice me" details and anomalies in the
  **1.2–2.2 unit** vertical band where a standing Custodian looks. The Hallway
  anchors already sit in this band (y 0.6–2.4).
- **R-SCL-3** Keep playable corridors within a **~26-unit** depth budget per scene
  segment (matches the Hallway) to bound draw distance and fog (PERFORMANCE).

## 4. Locations

| Location | Code | Status | Role |
| --- | --- | --- | --- |
| **The Hallway** | `HallwayScene` / `SceneIds.Hallway` | Built | Tutorial corridor; the reference implementation. |
| The Stairwell | — | Planned (Ch.1) | Vertical space; tests audio anomalies. |
| The Waiting Room | — | Planned (Ch.2) | Static seating; tests "something moved." |
| The Records Office | — | Planned (Ch.3) | Dense props; high perception load. |

Every location is a `BaseScene` subclass in `src/game/scenes/` and is registered
under a `SceneId` (`src/engine/scenes/sceneIds.ts`). The Hallway is the canonical
template; copy its structure.

## 5. Anomaly placement: anchors

Anomalies spawn at **anchors** — authored `Vec3` positions a scene passes to
`AnomalySystem.start({ sceneId, anchors })`. The Hallway defines four.

Anchor rules:
- **R-ANC-1** Every anchor must be **visible from a reachable standing position**
  within the anomaly lifetime (GAMEPLAY R-ANO-1). Walk-test every anchor.
- **R-ANC-2** Anchors sit in the 1.2–2.2 vertical band unless the anomaly is
  explicitly floor/ceiling (R-SCL-2).
- **R-ANC-3** Spread anchors so that with `MAX_ACTIVE = 3` the player must turn or
  walk to verify them — perception load is the difficulty (GAMEPLAY R-DIF-1).
- **R-ANC-4** No anchor inside geometry, behind a wall, or beyond fog cull
  distance. If fog hides it, it is unfair.

## 6. Authoring a scene (checklist)

To add a location:
1. Create `src/game/scenes/<Name>Scene.ts` extending `BaseScene` (copy `HallwayScene`).
2. Add its id to `SceneIds` (`src/engine/scenes/sceneIds.ts`).
3. Register it in the composition root (`Game.createEngine`) via a factory.
4. In `onLoad`: build geometry, lighting, fog; spawn the `PlayerController`;
   construct an `AnomalySystem` with the scene's `vitals`/`score`; `start` it with
   the scene's **anchors**.
5. In `onUnload`: `stop` anomalies and `dispose` the player (prevent leaks —
   TECH_ARCHITECTURE owns the lifecycle rule).
6. Honour scale (§3) and anchor (§5) rules.
7. Implement `report()` (the `ReportingScene` contract) so the HUD button reaches it.
8. Validate against PERFORMANCE budgets (draw calls, materials) before merge.

## 7. Visual identity of the world

- **Palette:** near-black bases (`#0a0a0c`), cold greys, one sickly warm light
  source per space. The brand danger red (`#b3122b`, see UI_GUIDELINES) belongs to
  PAXTA's *systems* (the report terminal, alerts), never to the environment —
  red means "PAXTA," not "blood."
- **Materials:** matte, low-spec; the world should look photographed by a cheap
  security camera, not ray-traced.
- **Fog is mandatory** in interiors (atmosphere + draw-distance control). The
  Hallway uses exponential fog; match its density band (~0.06–0.10).
- **Negative space is content.** An empty, correct corridor is a deliberate beat,
  not unfinished work.

## 8. Consistency guardrails

- A returning player must recognise a location instantly (R-WLD-1). Re-skinning a
  location for a new Chapter requires a STORY reason, not a whim.
- New props added to an existing location become part of its *correct* state and
  must be documented as such, or they read as permanent false cues.
- The world never contradicts STORY terminology or GAMEPLAY rules; when a level
  idea needs a new mechanic, it goes through GAMEPLAY §8 first.
