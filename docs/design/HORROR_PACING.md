# HORROR PACING

> Owner of: the rhythm of fear — tension and release, the anti-jump-scare
> doctrine, silence, and the dread budget. NIGHT_PROGRESSION owns the *clock
> structure*; this owns *how it is made to feel*. This is the most important
> design document in PAXTA.

## 1. Doctrine: dread, not shock

PAXTA frightens by **anticipation and wrongness**, not by ambush. The fear is the
*possibility* of a thing, the *implication* that you are watched, the second
glance that confirms what the first only suspected.

- **R-PACE-1 Atmosphere over jump scares (Pillar 1).** The default tool is
  unease. A "startle" beat (a sudden loud/visual hit) is rationed, never the
  point, and never a screamer.
- **R-PACE-2 The startle budget is ≤ 1 per Night, and even that is a *swell*,**
  not a scream — a presence that arrives, not a thing that lunges. Most Nights
  have **zero** startles. Over-using shock trains players to tune it out (and
  violates Pillar 1).
- **R-PACE-3 Every peak is followed by air.** Tension must fall after it rises, or
  it flatlines into noise. After each escalation, give a *real* quiet beat
  (NIGHT_PROGRESSION R-NIGHT-2/9).

## 2. The tension curve (the breathing pattern)

Fear is a waveform, not a ramp. Within a Night the amplitude climbs, but it
**oscillates** — tension, release, tension, release — with each crest higher than
the last until Dawn.

```
fear
 ▲        /\          /\              /\___ Dawn set-piece
 │   /\  /  \   /\   /  \    /\      /     \  ← then SILENCE
 │  /  \/    \ /  \ /    \  /  \    /       \____ 06:00 release
 │_/          v    v      \/    \  /
 └───────────────────────────────────────────▶ Night
   Settling  Unease  Creep  The Hour  Fray   Dawn
```

- **R-PACE-4 The valleys are designed, not gaps.** A quiet corridor that is
  *genuinely correct* is content — it restores Sanity (CORE_LOOP §4), lets a
  mobile player breathe and re-engage, and makes the next crest land.
- **R-PACE-5 Each crest is higher.** Release never returns fully to baseline after
  hour 2; the floor of tension rises across the Night.

## 3. Silence is the loudest instrument

- **R-PACE-6 Silence is a tool, used on purpose.** A sudden absence of the
  ambient hum is more frightening than any sound (AUDIO_GUIDELINES §1). Deploy it
  deliberately before a reveal or as the reveal.
- **R-PACE-7 The pre-dawn hush.** The last ~30–45 s before 06:00 go quiet after
  the Dawn set-piece, so daylight lands as *exhale*, not anticlimax
  (NIGHT_PROGRESSION R-NIGHT-3).
- **R-PACE-8 Never fill the quiet to seem "busy".** Empty, correct space is not
  unfinished content; it is the canvas the wrong things are painted on (R-LOOP-1).

## 4. The dread budget (finite, per Night)

A Night has a **dread budget**: a bounded number of escalation beats. Spend it;
do not exceed it. Unbounded escalation is the most common horror failure — it
becomes background.

| Beat type | Budget per Night | Notes |
| --- | --- | --- |
| Startle/swell | ≤ 1 (often 0) | R-PACE-2 |
| Major reveal (a *new* kind of wrong) | ≤ 1 | usually the Directive's focus |
| Reactive/escalating set-piece | 1 (Dawn) | the crescendo |
| Quiet "is it safe?" valleys | ≥ 3 | the breathing (R-PACE-3) |
| Ambient wrongs (standard anomalies) | per the curve | the body of play |

- **R-PACE-9 Variety beats volume.** Two *different* unsettling ideas frighten
  more than ten repeats of one. Rotate the channel (visual/audio/environmental)
  and the framing across a Night (ANOMALY_PROGRESSION).
- **R-PACE-10 Never repeat the exact scare in one Night.** A reused beat is a
  defused beat.

## 5. The player scares themselves (psychological core)

The strongest dread is self-inflicted. PAXTA loads the gun; the player's nerves
fire it.

- **R-PACE-11 Doubt over threat.** Low-Sanity false cues (CORE_LOOP §5) make the
  player suspect *everything*. Their paranoia does the work the engine doesn't.
- **R-PACE-12 Imply, don't show.** "It noticed you back" (NIGHT_PROGRESSION §2) is
  scarier than any model. Off-frame, already-happened, and almost-seen beat
  on-screen monsters every time (STORY tone).
- **R-PACE-13 The watched feeling.** PAXTA reacts to attention (WORLD R-WLD-5,
  ANOMALY reactive behaviour) so the player feels observed — the defining
  sensation of the game.

## 6. Mobile pacing constraints

Designed for short, glanceable, often-muted, interruptible phone play.

- **R-PACE-14 Dread must survive a glance away.** Tension is *persistent state*
  (a wrong thing that lingers, a falling Sanity), not a split-second event a
  distracted player misses. No fear beat depends on a frame-perfect moment.
- **R-PACE-15 Muted-safe terror.** Every scare reads without sound (STORY R-NAR-4);
  audio deepens but never gatekeeps.
- **R-PACE-16 Re-entry tension.** Returning mid-Night (SAVE_SYSTEM) drops the
  player into a breath beat, then re-escalates — never into a peak they didn't
  earn back.
- **R-PACE-17 Battery- and eye-kind.** Sustained dark with one warm light source
  (WORLD §7) is both the aesthetic and a power/eyestrain mercy (Pillar 5).

## 7. Anti-patterns (forbidden)

- ✗ Loud sting + monster face on a timer ("gotcha" scares). (R-PACE-1/2)
- ✗ Escalation with no release until the player is numb. (R-PACE-3)
- ✗ Filling silence because quiet "feels empty". (R-PACE-8)
- ✗ The same scare twice in a Night. (R-PACE-10)
- ✗ A fear beat that only works with sound, on a big screen, or in a frame-
  perfect window. (R-PACE-14/15)
- ✗ Unfair dread: a scare that also *kills* with no perceivable cause. (Pillar 4,
  FAILURE_CONDITIONS)

## 8. Pacing review (per Night, before merge)

1. Startle budget respected (≤1, usually 0)? (R-PACE-2)
2. At least three real quiet valleys; every peak has air? (R-PACE-3/4)
3. No repeated scare; channels varied? (R-PACE-9/10)
4. Pre-dawn hush present; Dawn lands as exhale? (R-PACE-7)
5. Every beat survives a glance-away and a mute? (R-PACE-14/15)
6. The scariest moment is *implied* or *silent*, not shown or loud? (R-PACE-6/12)
