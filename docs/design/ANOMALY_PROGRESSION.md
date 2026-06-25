# ANOMALY PROGRESSION

> Owner of: the anomaly catalogue, subtlety tiers, and how the anomaly vocabulary
> grows over Nights. GAMEPLAY owns the *scoring/lifecycle*; DIFFICULTY_CURVE owns
> the *knob values*; this owns *what the wrong things are* and *the order players
> meet them*.

## 1. Anomaly design law

An anomaly is a **localised, knowable deviation** from a location's correct state
(GAMEPLAY R-ANO-2, WORLD R-WLD-2). PAXTA's horror is that the ordinary becomes
wrong — never that a monster appears.

- **R-ANOM-1 Knowable.** The player could have known the "correct" state. The
  anomaly is a *change to something established*, not a random spawn.
- **R-ANOM-2 Local and discrete.** One bounded thing is wrong, so it is
  reportable (GAMEPLAY R-ANO-1/2).
- **R-ANOM-3 Atmosphere, not assault.** Anomalies unsettle; they do not lunge.
  No anomaly's *primary* effect is a startle (HORROR_PACING R-PACE-1). The dread
  is "that wasn't like that a moment ago," held in the chest, not jolted.
- **R-ANOM-4 Readable on a phone, in the dark, muted.** If it needs a big screen,
  headphones, or sound to be *winnable*, it is mis-designed (WORLD R-ANO-3, STORY
  R-NAR-4, AUDIO R-AUD-7).

## 2. The three kinds (the channels of perception)

Matches code `AnomalyKind`. Each is a sense the player learns to trust and doubt.

| Kind | Sense | Canonical wrongs |
| --- | --- | --- |
| **Visual** | Sight | Moved / added / removed / duplicated object; a thing facing the wrong way; a figure at the edge of view, gone when regarded; a reflection that lags. |
| **Audio** | Hearing | A sound with no source; a familiar sound pitched/looped wrong; a silence where there should be hum; footsteps that aren't yours. |
| **Environmental** | Ambient state | A light that shouldn't be on/off; fog where there was none; a door open that was shut; a cold cue; gravity/decor subtly off. |

- **R-ANOM-5 Every anomaly belongs to exactly one kind** (for the doubt system
  and Case Files). Cross-kind "combo" anomalies are a FUTURE_EXPANSION idea, not v1.

## 3. Subtlety tiers (the perception ladder)

Within each kind, an anomaly sits at a **subtlety tier**. The tier is the main
fairness boundary (DIFFICULTY R-DIFF-3).

| Tier | Name | The player should… | Example (visual) |
| --- | --- | --- | --- |
| 1 | **Blatant** | notice immediately, even glancing | a chair flipped onto the ceiling |
| 2 | **Plain** | notice within a normal scan | a painting now crooked |
| 3 | **Quiet** | notice on a careful second look | one of six chairs turned 15° |
| 4 | **Faint** | notice only if attentive and calm | a shadow that falls the wrong way |

- **R-ANOM-6 Tier ≠ unfair.** Even a tier-4 anomaly is *fully perceivable* from a
  reachable node within its tell window by an attentive player (Pillar 4). Tier
  raises *attention required*, never *possibility*.
- **R-ANOM-7 Introduce each kind at tier 1–2** with a generous tell, then ramp
  tier over subsequent Nights (DIFFICULTY R-DIFF-7).

## 4. The unlock schedule (vocabulary growth)

Players meet the vocabulary slowly so each new wrongness *lands* (GAMEPLAY
R-DIF-2). Aligned to the Night curve (DIFFICULTY §3):

| First appears | Element | At tier |
| --- | --- | --- |
| Night 1 | **Visual** kind | 1 |
| Night 2 | Visual at tier 2; the **near-miss** lesson | 1–2 |
| Night 3 | **Audio** kind | 1 |
| Night 4 | **Environmental** kind | 1–2 |
| Night 5 | **Mixed-kind overlap** (two kinds at once) | 2–3 |
| Night 6 | First **tier-4 faint** anomaly; doubt cues thicken | up to 4 |
| Ch. 2+ | One **new behaviour** per chapter (see §5) | reset to low on debut |

- **R-ANOM-8 A new kind/behaviour debuts alone.** The Night it is introduced, it
  is the *only* new thing, presented clearly, so the player builds a clean mental
  model before it is hidden among others (DIFFICULTY R-DIFF-6).

## 5. Behavioural escalation (beyond static wrongs)

Later chapters add **behaviours** — anomalies that do more than sit wrong — one
per chapter (GAMEPLAY R-DIF-2). Each is still report-only (no new verb) and
atmosphere-first.

| Behaviour | What it adds | Earliest |
| --- | --- | --- |
| **Static** (v1 baseline) | A wrong state that persists until reported/expired | Ch. 0 |
| **Escalating** | Worsens in stages over its tell window (drives Containment) | Ch. 1 |
| **Reactive** | Responds to being *looked at* (stops, or worsens) | Ch. 1 finale |
| **Migratory** | Moves between nodes if not caught | Ch. 2 |
| **Mimic** | Imitates the correct state, then deviates when unobserved | Ch. 3 |

- **R-ANOM-9 Behaviour is presentation; scoring stays in `AnomalySystem`.** A
  behaviour changes how an anomaly *looks/acts*, never how it scores. Scoreable
  iff it has a lifetime entity (GAMEPLAY R-DBT-2). This invariant is tested.
- **R-ANOM-10 Reactive ≠ punishing.** "Responds to being looked at" creates dread
  but never an unwinnable state — looking is always the player's tool, never a trap
  that guarantees a loss (Pillar 4).

## 6. False cues vs anomalies (the doubt line)

The doubt system (CORE_LOOP §5) populates the world with **false cues** that
*look* like low-tier anomalies but are cosmetic. They scale with low Sanity.

- **R-ANOM-11** A false cue is never an entity with a lifetime; reporting it is a
  false alarm (score only). The real/false invariant is the spine of fairness and
  is unit-tested (GAMEPLAY R-DBT-2, CORE_LOOP R-LOOP-13).
- **R-ANOM-12** False cues mimic the *kinds and tiers the player has learned*, so
  doubt grows with vocabulary — the more you know, the more you can mistrust.

## 7. Authoring an anomaly (checklist)

1. One kind (§2), one subtlety tier (§3), one behaviour (§5).
2. Has a defined **correct state** the player could have known (R-ANOM-1).
3. Perceivable from a reachable node within its tell window — **walk-test it**
   (WORLD R-ANC-1, Pillar 4).
4. Readable on a phone, in the dark, muted (R-ANOM-4).
5. Its *primary* effect is unease, not startle (R-ANOM-3, HORROR_PACING).
6. Debuts at low tier if it introduces a new kind/behaviour (R-ANOM-7/8).
7. Scoreable only via its lifetime entity; add a test for any new behaviour
   branch (R-ANOM-9).
8. Add its dossier entry for the Case File (REWARD_SYSTEM).
