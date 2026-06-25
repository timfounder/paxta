# NIGHT PROGRESSION

> Owner of: the structure of a single Night (the 10–15 min session), the
> hour-by-hour tension spine, and the **first-Night 3-minute hook**. Difficulty
> *values* are owned by DIFFICULTY_CURVE; pacing *rhythm* by HORROR_PACING; this
> owns the **clock-driven structure** they hang on.

## 1. The Night as a six-hour arc

Every Night runs **00:00 → 06:00**, six in-game hours of ~2.0–2.5 real minutes
each (GDD §3). The hours are fixed-name **phases** with a deliberate tension
shape: a slow climb, a first peak, a sustained strain, a crescendo, and release.

| Hour | Phase | Real time | Felt state | Anomaly cadence (target) | Max active | Tell window |
| --- | --- | --- | --- | --- | --- | --- |
| 00–01 | **Settling** | ~2.0 m | Calm; learn "normal"; the hook | 1 anomaly, signposted | 1 | ~60 s |
| 01–02 | **Unease** | ~2.0 m | First true doubt | spawn ~ every 45 s | 1 | ~50 s |
| 02–03 | **Creep** | ~2.5 m | Subtler, more often | ~ every 38 s | 2 | ~40 s |
| 03–04 | **The Hour** | ~2.5 m | First peak; overlap | ~ every 32 s | 2 | ~32 s |
| 04–05 | **Fray** | ~2.5 m | Sustained pressure | ~ every 28 s | 3 | ~28 s |
| 05–06 | **Dawn** | ~2.0 m | Crescendo → release | a set-piece, then quiet | 3→0 | ~25 s |

These cadence/tell values are the **structural targets**; DIFFICULTY_CURVE owns
how they shift per Night and chapter, and the constants that encode them.

- **R-NIGHT-1 The clock only moves forward.** No going back an hour. Dread
  accumulates; the player feels time being spent (CORE_LOOP R-LOOP-7).
- **R-NIGHT-2 Every peak is followed by air.** After "The Hour" (03–04) and
  before "Dawn", insert a quiet beat — a corridor that is simply correct
  (HORROR_PACING R-PACE-3). Escalation without release becomes noise.
- **R-NIGHT-3 The last five minutes are the show.** Hour 05–06 holds the Night's
  single set-piece, then goes *quiet* right before 06:00, so dawn lands as relief,
  not anticlimax (HORROR_PACING R-PACE-7).
- **R-NIGHT-4 The Night is winnable clean.** A perfect-attention player reaches
  06:00 with high Sanity (CORE_LOOP §4). The curve threatens; it does not cheat
  (Pillar 4).

## 2. The first Night — the 3-minute hook (beat sheet)

The first Night (Chapter 0, "Induction") is the most important three minutes in
PAXTA. It must teach all three verbs, deliver dread without a jump scare, and
leave the player *wanting the next anomaly* — all by **03:00 on the real clock**
(VISION 10-second-dread rule; brief mandate).

| Real time | Beat | What happens | Teaches |
| --- | --- | --- | --- |
| 0:00–0:20 | **Clock in** | Black. The Supervisor's first line (text + a single haptic). Fade into a still, humming corridor as audio unlocks on first touch. | Tone; that you are *expected*. |
| 0:20–0:50 | **Look** | A soft prompt invites looking around. The corridor is mundane and *correct*. Nothing is wrong — on purpose. | **LOOK**; what "normal" is. |
| 0:50–1:20 | **Walk the round** | The next vantage **node** glows. The player ADVANCEs through two more correct nodes. Still nothing wrong. The calm is the trap. | **ADVANCE**; the patrol rhythm. |
| 1:20–2:10 | **The first wrong thing** | At a node, one unmistakable-once-seen anomaly: a door that was shut is open (or a chair turned to face you). Generous ~60 s tell. The Supervisor: *"Something's wrong here. Report it."* | Noticing; that the world drifts. |
| 2:10–2:35 | **The catch** | The player taps REPORT. Institutional confirmation tone + a success haptic; Sanity ticks; the door quietly returns to correct. | **REPORT**; agency; the feedback loop. |
| 2:35–2:55 | **The implication** | A beat of silence. The Supervisor: *"Good. It noticed you back."* No monster — just the idea of one. | Stakes; that PAXTA is aware (WORLD R-WLD-5). |
| 2:55–3:00+ | **The hook** | A second, *subtler* wrongness begins at the edge of view — not signposted this time. The player leans in. The Night is real now. | Self-directed vigilance. |

**R-NIGHT-5** The hook uses **zero startle beats** (no scream, no slam). The
chill is the *open door* and the line *"it noticed you back."* Atmosphere, not
shock (Pillar 1, HORROR_PACING).
**R-NIGHT-6** All teaching is **diegetic and embedded** — Supervisor lines and
the world, never a tutorial overlay or a wall of text (STORY R-NAR-1/2).
**R-NIGHT-7** The first Night uses **gentler-than-default** values (longer tells,
fewer overlaps) — onboarding owns its own tuning (DIFFICULTY_CURVE R-DIFF-2,
GAMEPLAY R-DIF-3).
**R-NIGHT-8** If the player does nothing at 1:20, the Supervisor escalates the
nudge once at ~1:50; the hook never stalls on inaction.

## 3. Between hours — the breath beats

At each hour boundary the game inserts a **breath**: ~5–10 s of authored calm
(an empty correct stretch, a Supervisor line, the clock ticking over). These:
- give the autosave a checkpoint (SAVE_SYSTEM R-SAVE-2),
- let Sanity recover slightly (CORE_LOOP §4),
- pace the horror (HORROR_PACING R-PACE-3),
- and let a mobile player glance away and back without losing the thread.

**R-NIGHT-9** A breath beat is never the moment of a scare. Safety must
sometimes be *real*, or the player stops believing in safety and tunes out.

## 4. Ending a Night

| Ending | Trigger | Result |
| --- | --- | --- |
| **Dawn (win)** | Clock reaches 06:00 alive | Night complete → summary → rewards (REWARD_SYSTEM); story advances. |
| **Consumed (loss)** | Sanity reaches 0 | GameOver → the Night may be retried (FAILURE_CONDITIONS); meta progress kept. |
| **Clocked out early (abandon)** | Player exits via pause | Resume later from the last hour checkpoint (SAVE_SYSTEM). |

**R-NIGHT-10** Dawn is a designed *exhale*: light rises, the hum fades, the
Supervisor signs you off. The reward for surviving is, first, **relief** — then
the numbers (REWARD_SYSTEM R-REW-1).

## 5. Structural rules (summary)

- A Night is six forward-only hours with a climb→peak→strain→crescendo→release
  shape (§1).
- The first Night hooks by 3:00 with no startle (§2).
- Every peak is followed by air; every hour boundary is a breath (R-NIGHT-2/3/9).
- A Night is always winnable clean and always retriable (R-NIGHT-4,
  FAILURE_CONDITIONS).
