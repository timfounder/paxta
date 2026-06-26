# WORLD

> Owner of: locations, the physical/logical rules of the PAXTA world, scale and
> spatial conventions, and **how to author a scene**. STORY.md owns meaning;
> this owns space and consistency.

## 1. The setting

PAXTA ( *paxta* — Uzbek for **cotton** ) is an isolated **cotton-plantation
compound** worked at night: a guard house at the gate, a warehouse, a diesel
generator, a water pump, a dirt road, and a vast **cotton field** ringed by
trees — all under fog and a thin moon. The world is **mundane rural-industrial
materials** (concrete, rusted metal, timber, soil) in oppressive dark.

The unifying aesthetic: *a place that was built to be worked, at an hour when no
one should be there.* Generator hum, fog-thick air, distant tree lines, the
white of cotton bolls catching what little light there is.

> **Established in Milestone 3.** Earlier drafts framed the world as liminal
> interior corridors; the shipped setting is the outdoor cotton compound above.
> Interiors (the warehouse, the guard house) exist *within* it.

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
| Camera eye height | **1.7** units (crouched **1.0**) | `PLAYER.EYE_HEIGHT` / `CROUCH_EYE_HEIGHT` |
| Walk speed | **3.2** units/s | `PLAYER.MOVE_SPEED` |
| Sprint / crouch speed | ×**1.8** / ×**0.5** | `PLAYER.SPRINT_MULTIPLIER` / `CROUCH_SPEED_MULTIPLIER` |
| Player collider | radius **0.35**, height **1.8** (crouch **1.2**) | `PLAYER.COLLIDER_RADIUS` / `STANDING_HEIGHT` |
| Gravity | **−20** units/s² | `PLAYER.GRAVITY` |
| Interaction reach | **2.6** units | `PLAYER.INTERACT_DISTANCE` |
| Ground plane | y = 0 | `compound/terrain` |
| Warehouse doorway (reference) | ~4 wide × ~5.5 tall units | `compound/buildings` |
| Open-site depth budget | ~26 units per segment | `compound` extents |
| Camera near plane | 0.1 | `PlayerController` |

Rules:
- **R-SCL-1** Build to human scale. A doorway is ~1×2 units; a corridor lets the
  player pass without precision steering at 3.2 u/s.
- **R-SCL-2** Eye height is 1.7. Place "notice me" details and anomalies in the
  **1.2–2.2 unit** vertical band where a standing Custodian looks. The compound's
  interactables (switch, generator, door handle) sit in this band.
- **R-SCL-3** Keep playable areas within a **~26-unit** depth budget per scene
  segment (matches the compound) to bound draw distance and fog (PERFORMANCE).

## 4. Locations

| Location | Code | Status | Role |
| --- | --- | --- | --- |
| **The Compound** | `CompoundScene` / `SceneIds.Compound` | Built | The primary explorable site (below). |
| ↳ Guard house | `compound/buildings` | Built | Wooden hut at the road entrance. |
| ↳ Warehouse | `compound/buildings` | Built | Large open-fronted shell you can enter, with a hinged door. |
| ↳ Warehouse door | `objects/Door` | Built | Hinged, openable/closable; blocks the doorway when closed. |
| ↳ Generator | `objects/Generator` | Built | Power source: starts/stops the warehouse work-light. |
| ↳ Entrance switch | `objects/Switch` | Built | Guard-house wall switch; toggles the entrance flood-light. |
| ↳ Loose pickups | `objects/PickupItem` | Built | Small props (Rusted Key, Metal Tag) you can pick up / drop. |
| ↳ Water pump | `compound/machinery` | Built | Roadside prop. |
| ↳ Cotton field | `compound/vegetation` | Built | Instanced rows of cotton (plants + bolls). |
| ↳ Tree line | `compound/vegetation` | Built | Instanced perimeter/roadside trees. |

Every location is a `BaseScene` subclass in `src/game/scenes/` and is registered
under a `SceneId` (`src/engine/scenes/sceneIds.ts`). `CompoundScene` is the
canonical template: a thin scene orchestrating small builder modules under
`game/scenes/compound/` (palette · terrain · buildings · machinery · interactives
· vegetation · lighting), with vegetation **instanced** for the mobile draw-call
budget. The scene only *wires* behaviour: the `interactives` builder makes the
door / switch / pickup geometry and the two switched lights, then the scene
registers reusable `game/objects/` interactables (`Door`, `Switch`, `Generator`,
`Lamp`, `PickupItem`) with the engine's `InteractionRegistry`. No gameplay logic
lives in the scene or the geometry.

### 4a. Atmosphere

The compound is driven by a reusable, data-driven `AtmosphereManager`
(`engine/atmosphere/`, tuned by `shared/constants/atmosphere.ts`). It modulates
what the scene already owns — it never adds lights or geometry:

- **Wind** gusts a strength scalar that (a) sways the canopy and cotton via a GPU
  vertex shader (`WindMaterialPlugin`, zero per-instance CPU; trunks stay rigid)
  and (b) drives the wind audio layers.
- **Sky** drifts fog density and moonlight, and fires rare, **silent distant
  lightning** (a flash on the moon + ambient lights — no rain), with delayed
  thunder.
- **Ambience** is a procedural Web-Audio bed (wind, insects, power-line hum) plus
  randomly-timed one-shots (a far dog, a metal creak, an electrical buzz),
  punctuated by **long quiet periods** and brief **complete-silence beats**.

The intent is sustained low-grade unease from the environment itself —
**no enemies, anomalies or scripted scares** (those arrive with the horror
track). Authoring tension is a matter of editing the atmosphere constants, not
code.

## 5. Anomaly placement: anchors

Anomalies are now produced by the **data-driven anomaly engine** (`AnomalyManager`,
TECH_ARCHITECTURE): each anomaly is a definition (trigger · schedule · conditions ·
effects) in `game/content/anomalies.ts`, with positions carried as condition/effect
params (`position`, `proximity`, `spawnObject.at`) rather than a separate anchor
list. The compound wires the engine but ships its examples **disabled** — the
framework is in place; authored horror content arrives with the horror track
(IMPLEMENTATION_ROADMAP). The legacy spawn/score `AnomalySystem` (anchors) remains
as M0 scaffold, unwired.

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
1. Create `src/game/scenes/<Name>Scene.ts` extending `BaseScene` (copy `CompoundScene`).
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
