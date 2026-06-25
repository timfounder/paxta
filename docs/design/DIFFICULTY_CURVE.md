# DIFFICULTY CURVE

> Owner of: how hard PAXTA gets — the difficulty **knobs**, the within-Night
> curve values, and the across-Nights progression. NIGHT_PROGRESSION owns the
> hour *structure*; this owns the *numbers* that ride it and how they grow.

## 1. The difficulty knobs (the only levers)

Difficulty is expressed through exactly these knobs. We never make anomalies
*less perceivable* to add difficulty (Pillar 4, GAMEPLAY R-DIF-1).

| Knob | Effect | Range (design) |
| --- | --- | --- |
| **Spawn interval** | Time between spawn rolls | 60 s (easy) → 22 s (hard) |
| **Spawn chance** | P(roll yields an anomaly) | 0.30 → 0.55 |
| **Max active** | Simultaneous anomalies | 1 → 3 |
| **Tell window** | Time to catch before "missed" | 60 s → 22 s |
| **Subtlety tier** | How obvious the wrongness is | 1 (blatant) → 4 (faint) |
| **False-cue density** | Doubt cues at a given Sanity | low → high |
| **Kind mix** | Which anomaly kinds are in play | unlocks over chapters |

These are the **full design ranges** across all content. The *baseline* Night
curve uses the gentler end of each (the standard Dawn tell bottoms at ~25 s, per
GDD §5 / NIGHT_PROGRESSION §1); only **Overtime** and late chapters push toward
the hard floor (~22 s) — §5.

- **R-DIFF-1 Raise frequency and overlap, never unfairness.** Prefer shorter
  intervals, more overlap, higher subtlety tier — never invisible, instant, or
  faster-than-human anomalies (GAMEPLAY R-DIF-1, Pillar 4).
- **R-DIFF-2 Onboarding overrides the curve.** The first Night and the first five
  minutes of any new player's life use the gentlest column, regardless of the
  per-Night table (GAMEPLAY R-DIF-3, NIGHT_PROGRESSION R-NIGHT-7).
- **R-DIFF-3 Subtlety is the *last* knob turned.** Reach for frequency/overlap
  first; raise the subtlety tier only once the player has demonstrably learned a
  kind (ANOMALY_PROGRESSION). Subtlety is the most fragile fairness boundary.

## 2. Within a Night (the intra-Night ramp)

The knobs scale across the six hours per NIGHT_PROGRESSION §1. The shape is fixed
for every Night; the **starting point and slope** shift per Night (§3).

```
intensity
  ▲                                   ┌── Dawn set-piece
  │                          ┌────────┘        ┐ release
  │                 ┌────────┘  Fray            ▼
  │        ┌────────┘ The Hour              ____
  │  ┌─────┘ Creep
  │__┘ Settling / Unease
  └────────────────────────────────────────────▶ hours 00→06
```

- **R-DIFF-4** Difficulty is **monotonic within the Night up to Dawn**, then
  drops to zero at 06:00 (the exhale — NIGHT_PROGRESSION R-NIGHT-3).
- **R-DIFF-5** Peak intra-Night intensity is reached at **Fray (04–05)**, not at
  the very end; Dawn is a single curated spike, then quiet.

## 3. Across Nights (the inter-Night progression)

Each Night nudges the **baseline** up and the **floor** of subtlety up, and
periodically unlocks a new anomaly behaviour (one per chapter — GAMEPLAY R-DIF-2,
ANOMALY_PROGRESSION). Target curve for the free Chapters 0–1 (Nights 1–7):

| Night | Chapter | Base spawn int. | Base chance | Max active (late) | Top subtlety | New element |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 Induction | 60 s | 0.30 | 1 | 1 | Teach loop; **visual** kind only |
| 2 | 0 Induction | 52 s | 0.32 | 2 | 2 | Teach the **miss** (let one nearly expire) |
| 3 | 1 | 46 s | 0.36 | 2 | 2 | Introduce **audio** kind |
| 4 | 1 | 40 s | 0.40 | 2 | 3 | Introduce **environmental** kind |
| 5 | 1 | 34 s | 0.44 | 3 | 3 | First **overlap of mixed kinds** |
| 6 | 1 | 30 s | 0.48 | 3 | 4 | First **subtlety-4** anomaly; doubt cues rise |
| 7 | 1 finale | 28 s | 0.50 | 3 | 4 | Chapter set-piece Night |

- **R-DIFF-6 One new idea per Night, at most.** A Night introduces a new kind, a
  new behaviour, OR a difficulty step — not several. Players learn PAXTA's
  vocabulary slowly; that learning *is* the horror (GAMEPLAY R-DIF-2).
- **R-DIFF-7 New kinds enter at low subtlety.** When a kind (e.g. audio) is first
  introduced, it appears at subtlety tier 1–2 with a generous tell, even if the
  Night's general difficulty is higher (R-DIFF-2 applies per-kind).
- **R-DIFF-8 The curve is content, not code-fixed.** Per-Night knob values live
  in each Night's content definition (parallel to anchors/quests), read from
  constants. Re-tuning a Night is data, not a code change (TECH R-FLD, GAMEPLAY
  balance protocol).

## 4. Skill expression & the difficulty *feel*

Difficulty in PAXTA is **cognitive load**, not reflex. The player gets harder
work, never twitchier work.

- More to watch (overlap), in more places (nodes), more subtly wrong (tier), with
  less time (tell) — while a frayed mind throws false cues (CORE_LOOP §5).
- **R-DIFF-9** The hardest legitimate skill ask is "track three subtle, mixed-kind
  anomalies across your sightlines under time pressure while doubting yourself."
  Never "react within 300 ms." PAXTA has no reflex check.
- **R-DIFF-10** Mastery shows as *calm*: a skilled player moves deliberately,
  doubts less, and keeps Sanity high. The game must reward that composure
  (REWARD_SYSTEM Clean-Night).

## 5. Optional difficulty (post-tutorial, opt-in)

- **Overtime** (REPLAYABILITY): replay a cleared Night with the knobs pushed a
  full tier and richer rewards. Opt-in only.
- **Accessibility easing:** a documented "longer tells / fewer overlaps" assist
  toggle that never disables failure but widens the windows — for players who want
  the atmosphere without the strain (Pillar 5, UI_GUIDELINES A11Y).
- **R-DIFF-11** No difficulty tier, assist, or Overtime modifier may be sold or
  tied to currency (VISION R1). Difficulty is never a monetisation surface.

## 6. Tuning protocol

- Every knob value is content per Night (R-DIFF-8); changes follow the GAMEPLAY
  balance protocol (rationale + one full-Night manual play-through).
- The target tables here are starting points to be validated by playtest against
  the survivability math (CORE_LOOP §4) and the metrics (VISION §8) before launch.
