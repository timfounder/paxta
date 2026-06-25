# PAXTA — Game Design Document (master)

> This `docs/design/` suite is the **detailed game design**, sitting beneath the
> pillar docs in `/docs`. The pillar docs own *principles*; this suite owns the
> *complete designed game*: loop, structure, numbers, and beats.
>
> Authored by the Game Director. Status: **design-complete, pre-implementation.**
> Last reviewed: 2026-06-25 · Design version: 1.0

## 0. What PAXTA is, in one paragraph

You are a **Custodian** working the **night shift** inside PAXTA — a building
that exists in the places reality forgets. For one **Night** (a 10–15 minute
session) you patrol authored vantage points, watch for **anomalies** (things that
have drifted from how they should be), and **report** them before they spread.
Every wrong thing you miss erodes your **Sanity**. Survive until **06:00** and
you clock out. Let your Sanity reach zero and PAXTA keeps you. There is no
combat, no inventory, no puzzle box — only attention, doubt, and nerve.

## 1. This suite owns (ownership table)

| Detailed design of… | Document |
| --- | --- |
| The moment-to-moment loop, controls, the HUD clock | [CORE_LOOP](./CORE_LOOP.md) |
| What the player earns and unlocks across Nights | [PLAYER_PROGRESSION](./PLAYER_PROGRESSION.md) |
| How hard it gets, within and across Nights | [DIFFICULTY_CURVE](./DIFFICULTY_CURVE.md) |
| The 6-hour Night structure and the 3-minute hook | [NIGHT_PROGRESSION](./NIGHT_PROGRESSION.md) |
| Mission/Directive archetypes and objective design | [MISSION_DESIGN](./MISSION_DESIGN.md) |
| The anomaly catalogue and how it escalates | [ANOMALY_PROGRESSION](./ANOMALY_PROGRESSION.md) |
| Tension/release rhythm, the anti-jump-scare rules | [HORROR_PACING](./HORROR_PACING.md) |
| Rewards and the feedback economy | [REWARD_SYSTEM](./REWARD_SYSTEM.md) |
| Save/resume/checkpoint design for mobile | [SAVE_SYSTEM](./SAVE_SYSTEM.md) |
| Losing, and what losing costs | [FAILURE_CONDITIONS](./FAILURE_CONDITIONS.md) |
| Why players come back | [REPLAYABILITY](./REPLAYABILITY.md) |
| Where PAXTA grows after launch | [FUTURE_EXPANSION](./FUTURE_EXPANSION.md) |

This suite **defers to the pillar docs** for principles (VISION pillars,
GAMEPLAY rules, STORY terminology) and **supersedes** them only where noted (the
session model — §3 — replaces the earlier "3–7 minute" framing across all docs).

## 2. The design brief (constraints this design satisfies)

- **Mobile players, portrait, one thumb.** Designed for a phone in a dark room,
  often muted. (VISION P3, P5.)
- **One session = 10–15 minutes.** A full Night. (§3.)
- **The first Night hooks within 3 minutes.** (NIGHT_PROGRESSION §2.)
- **Avoid unnecessary mechanics.** Three verbs, one resource. (§4.)
- **Psychological horror, atmosphere over jump scares.** (HORROR_PACING.)

## 3. The session model — the **Night** (canonical, supersedes "3–7 min")

> **Reconciliation note.** Earlier docs described 3–7 minute "Shifts." The
> shipping unit is the **Night**: a single 10–15 minute session. "Shift" remains
> the in-fiction word for the duty — *one Shift = one Night*. The fast
> observe→report loop is still seconds-long; the Night is the container.

| Property | Value |
| --- | --- |
| Session = one **Night** | 10–15 minutes real time |
| In-game span | **00:00 → 06:00** (six in-game "hours") |
| Real time per hour | ~2.0–2.5 minutes |
| Floor (rushed/early death) | ~10 min |
| Win condition | Reach **06:00** alive (dawn) |
| Lose condition | **Sanity → 0** (see FAILURE_CONDITIONS) |
| Hook deadline | Dread + agency established by **03:00 real-clock** (NIGHT §2) |

The Night is the unit of: structure (NIGHT_PROGRESSION), difficulty
(DIFFICULTY_CURVE), missions (MISSION_DESIGN), reward (REWARD_SYSTEM), and save
(SAVE_SYSTEM). One Night fits one commute, one coffee, one before-bed sitting.

## 4. The mechanic whitelist (everything the player can do)

PAXTA is deliberately tiny. The complete verb and system set is:

**Verbs (3):**
1. **LOOK** — drag to look freely (360°). The primary act of horror.
2. **ADVANCE** — tap the next authored vantage **node** to walk the patrol. No
   joystick; movement is on authored rails so sightlines stay readable on a phone.
3. **REPORT** — one button: "an anomaly is present, here, now."

**Systems (4):**
- **Sanity** — the single resource and failure axis (CORE_LOOP §4).
- **The Night clock** — the spine; advances tension (NIGHT_PROGRESSION).
- **Directives** — one mission per Night, built only from the three verbs
  (MISSION_DESIGN).
- **Case Files** — a passive collectible/knowledge log (REWARD_SYSTEM).

**Explicitly NOT in the game** (each would be an "unnecessary mechanic"):
combat, inventory, crafting, stamina, a flashlight battery to manage, hunger,
manual save slots, skill trees, currency earned through grind. Adding any of
these requires a Director sign-off and a pillar justification.

## 5. Target tuning (the Night-model economy)

These are the **design targets** for the Night model. They **supersede the
short-shift constants** currently in `src/shared/constants/game.ts`; Phase 1
implementation retunes the code to these, after which GAMEPLAY's mirror is
updated (CODING_STANDARDS R-DOC-1). Owned here; referenced by the other design
docs.

| Quantity | Target | Was (short-shift) |
| --- | --- | --- |
| Sanity range / start | 0–100 / 100 | same |
| Drain per active unaddressed anomaly | **0.6 / s** | 1.5 / s |
| Discrete "miss sting" when an anomaly expires | **−8** | — |
| Correct report: Sanity relief | **+4** | — |
| Correct report: score | **+100** | +100 |
| False alarm: Sanity | **0** (score only) | 0 |
| False alarm: score | **−50** | −50 |
| Missed anomaly: score | **−50** | −50 |
| Clean-environment recovery (0 active) | **+0.25 / s** | 0.4 / s |
| Anomaly "tell" duration (catch window) | **60 s → 25 s** by hour (curve) | flat 45 s |
| Max simultaneous anomalies | **1 → 3** by hour (curve) | flat 3 |

Rationale and the survivability math live in CORE_LOOP §4 and DIFFICULTY_CURVE.
False alarms never cost Sanity (preserves GAMEPLAY R-RPT-1, Pillar 4).

## 6. Design pillars → this game (traceability)

- **P1 Dread over gore** → HORROR_PACING caps startle beats; the loudest moment is silence.
- **P2 Perception is the mechanic** → every system presents something to perceive
  or measures perception (§4).
- **P3 Telegram-native** → 10–15 min Nights, one-thumb, daily-seed sharing (REPLAYABILITY).
- **P4 Fair but unforgiving** → every loss is a perceivable, addressable cause
  (FAILURE_CONDITIONS); false alarms never spiral Sanity.
- **P5 Persistent unease, low friction** → resume mid-Night, autosave, battery-aware (SAVE_SYSTEM).

## 7. How to read this suite

Read CORE_LOOP and NIGHT_PROGRESSION first — they define the play. Then
DIFFICULTY_CURVE, ANOMALY_PROGRESSION, and HORROR_PACING (the three that shape
the curve together). Then the supporting systems. Every design doc references
this GDD for the session model (§3), the verb set (§4), and target tuning (§5).
