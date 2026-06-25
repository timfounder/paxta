# GAMEPLAY

> Owner of: the core loop, balance constants, scoring, difficulty, anomaly
> taxonomy, and the rules for adding gameplay content.
>
> **Source of truth for numbers is the code**: `src/shared/constants/game.ts`.
> The tables below mirror it. **If you change a constant, update this file in the
> same pull request** (CODING_STANDARDS R-DOC-1).
>
> **Night-model note (design v1.0).** The detailed design suite
> ([design/GDD](./design/GDD.md)) defines the shipping session as a **Night**
> (10–15 min) and specifies **target tuning** (GDD §5) that supersedes the
> short-shift values mirrored below. Phase 1 implementation will retune
> `game.ts` to those targets; when it does, these mirror tables are updated in
> the same PR. Until then, the tables reflect the *current code*.

## 1. The core loop (within a Night)

A play **session** is a **Night** — the in-fiction night *shift* — a single
10–15 minute session of six in-game hours (00:00→06:00), owned by
[design/NIGHT_PROGRESSION](./design/NIGHT_PROGRESSION.md). The moment-to-moment
loop below is the seconds-long heartbeat *inside* that Night.

```
ENTER  → OBSERVE → DECIDE → REPORT → CONSEQUENCE → (repeat) → END
```

1. **Enter** — load into a location (e.g. the Hallway). Audio unlocks on the
   first touch. The Supervisor may issue a directive.
2. **Observe** — move/look in first person. Watch for anomalies.
3. **Decide** — is something wrong, or is that paranoia? Sanity loss makes you
   doubt (see §6).
4. **Report** — press **REPORT** to assert "an anomaly is present here, now."
5. **Consequence** — correct report = caught (score up, Sanity stabilises);
   false alarm or a missed anomaly = penalty (score down, Sanity drains).
6. **End** — the Night ends at **dawn (06:00)**, voluntary exit, or **death**
   (Sanity hits 0).

Target session length: **10–15 minutes** — one Night
([design/NIGHT_PROGRESSION](./design/NIGHT_PROGRESSION.md)). Spawn pacing follows
the Night's hour curve, not a flat rate (design/DIFFICULTY_CURVE).

## 2. Sanity — the core resource

Sanity is the player's hold on reality. It is the only failure axis in v1.

| Constant | Value | Code |
| --- | --- | --- |
| Minimum | `0` | `PLAYER.SANITY_MIN` |
| Maximum / start | `100` | `PLAYER.SANITY_MAX` |
| Drain per active anomaly per second | `1.5` | `PLAYER.SANITY_DRAIN_PER_ANOMALY` |
| Recovery per second when clean | `0.4` | `PLAYER.SANITY_RECOVERY` |

Rules:
- **R-SAN-1** Drain scales with the number of *currently active* anomalies:
  `drain = 1.5 × activeCount × dt`. Three anomalies drain at 4.5/s.
- **R-SAN-2** Sanity only recovers when **zero** anomalies are active. Recovery is
  deliberately slow (0.4/s) so a clean corridor is a relief, not a free heal.
- **R-SAN-3** Reaching `0` while `phase === Playing` ends the Shift (`player:died`,
  cause `sanity-depleted`). This is enforced in `gameStore.drainSanity`.
- **R-SAN-4** Sanity is **never** purchasable, giftable, or restorable with money
  (VISION R1). Narrative items may restore it; real currency may not.
- **R-SAN-5** Low Sanity changes *perception*, not *fairness* (see §6).

## 3. Anomalies

An anomaly is a localised deviation from the location's correct state. Three
**kinds** exist (`AnomalyKind` in `src/systems/anomaly/anomaly.types.ts`):

| Kind | Channel of perception | Examples |
| --- | --- | --- |
| `visual` | Sight | An object moved, duplicated, vanished, or watches you. |
| `audio` | Hearing | A sound with no source; a familiar sound, wrong. |
| `environmental` | Ambient state | Light, fog, temperature cue, or physics is wrong. |

Lifecycle constants (`ANOMALY`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `DEFAULT_LIFETIME` | `45` s | Time before an un-reported anomaly is **missed**. |
| `MAX_ACTIVE` | `3` | Hard cap on simultaneous anomalies per scene. |
| `SPAWN_INTERVAL` | `20` s | Seconds between spawn evaluations. |
| `SPAWN_CHANCE` | `0.35` | Probability a spawn evaluation yields an anomaly. |

How it works in code (`AnomalySystem`):
- Every `SPAWN_INTERVAL`, if `activeCount < MAX_ACTIVE`, roll `SPAWN_CHANCE`. On
  success, spawn at a random scene **anchor** with a random kind.
- A spawned anomaly is an ECS entity with a `LifetimeComponent(45)`. The
  `LifetimeSystem` expires it; expiry of an *unreported* anomaly = **missed**.

Authoring rules:
- **R-ANO-1** Every anomaly must be **perceivable from a position a player can
  reach** within its lifetime (P4). No anomaly behind a locked-off geometry.
- **R-ANO-2** Every anomaly must have a clear "correct" state the player could
  have known. The wrongness must be *knowable*, not arbitrary.
- **R-ANO-3** Anomalies must read on a small phone screen in dim light. If it
  needs a 4K display to notice, it is not an anomaly, it is a bug.
- **R-ANO-4** Audio anomalies must not depend on the player wearing headphones to
  be *winnable*, only to be *better*.

## 4. Reporting & scoring

Reporting (`AnomalySystem.report`) resolves the **longest-standing** active
anomaly as a catch; with none active it is a **false alarm**.

| Outcome | Score | Sanity | Event |
| --- | --- | --- | --- |
| Correct report (catch) | `+100` | stops that anomaly's drain | `anomaly:resolved` |
| Missed (lifetime expired) | `−50` (floored at 0) | drained for full lifetime | `anomaly:missed` |
| False alarm (report when clean) | `−50` (floored at 0) | — | `anomaly:reported {correct:false}` |

Scoring lives in `gameStore.recordHit` (`+100`) / `recordMiss` (`−50`, floored).

Rules:
- **R-RPT-1** A false alarm must cost something (−50) or "spam report" becomes
  optimal. It must **not** cost Sanity, or panic-spam becomes a death spiral the
  player can't read (P4).
- **R-RPT-2** Reporting resolves exactly **one** anomaly (the oldest). No
  area-clears. The player commits to "there is *a* wrong thing here."
- **R-RPT-3** Score is a soft pressure (leaderboards, rewards), **not** a life
  total. Death is governed only by Sanity (R-SAN-3).

## 5. Difficulty & progression

v1 ships with **authored** difficulty per location, expressed only through the
constants above (no separate difficulty engine yet — see ROADMAP).

- Difficulty is raised by, in order of preference: lower `SPAWN_INTERVAL`,
  higher `SPAWN_CHANCE`, higher `MAX_ACTIVE`, shorter `DEFAULT_LIFETIME`.
- **R-DIF-1** Never raise difficulty by making anomalies *less perceivable*
  (smaller, darker, faster-than-human). Raise *frequency and overlap*, not
  unfairness (P4).
- **R-DIF-2** Each new chapter may introduce **one** new anomaly behaviour, not five.
  Players learn PAXTA's vocabulary slowly; that learning *is* the horror.
- **R-DIF-3** The first five minutes of a new player's life use gentler-than-default
  values. Onboarding owns its own constants override; never ship the default
  curve as the tutorial.

## 6. Sanity-driven perception (the doubt system)

Low Sanity must make the player *doubt*, never make the game *lie about scoring*.

- **R-DBT-1** As Sanity drops, the world may present **false cues** (a flicker, a
  half-seen shape) that are **not** scoreable anomalies. Reporting them is a
  false alarm. This is the intended tension, and it is fair because a calm,
  high-Sanity player can tell the difference.
- **R-DBT-2** False cues are **cosmetic**: they never drain Sanity and never
  count as missed. Only real anomalies (entities with a `LifetimeComponent`) are
  scoreable. This invariant is testable and must stay true.
- **R-DBT-3** The HUD never tells the player whether a thing is "real." The HUD
  shows Sanity and score only (UI_GUIDELINES). Certainty is the player's job.

## 7. Win / lose / end states

- **Death** — Sanity `0`. Show the GameOver screen with score/caught/missed.
- **Shift complete** — active quest objectives done (`quest:completed`).
- **Abandon** — player exits via pause → returns to menu; progress is saved.
- There is no "high score wins"; survival + story completion is the goal. Score
  feeds leaderboards and rewards only (R-RPT-3).

## 8. How to add gameplay content (checklist)

Adding an **anomaly behaviour**:
1. Confirm it fits one `AnomalyKind`; if not, propose a new kind in a design doc
   first (it touches STORY/WORLD/AUDIO).
2. Implement presentation in the **scene/engine** layer; keep scoring in
   `AnomalySystem`. Presentation must not know about score.
3. Verify R-ANO-1..4 and R-DBT-2 (it is scoreable iff it has a `LifetimeComponent`).
4. Add a unit test for any new scoring/lifecycle branch.

Adding a **location**: see [WORLD](./WORLD.md) §"Authoring a scene".

Adding a **quest**: define it in `src/game/content/` and wire it through
`QuestSystem`; objectives advance via events, never by polling (TECH_ARCHITECTURE).

## 9. Balance change protocol

- All tuning lives in `src/shared/constants/game.ts`. No magic numbers in systems.
- Changing a constant requires: (a) a one-line rationale in the PR, (b) updating
  the mirror tables here, (c) re-running the loop manually for one full Shift.
- Constants are content, not config: they may differ per chapter via a future
  per-location override, but the *defaults* in this file are the baseline feel.
