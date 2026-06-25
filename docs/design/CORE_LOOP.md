# CORE GAMEPLAY LOOP

> Owner of: the moment-to-moment loop, the mobile control scheme, the in-Night
> HUD, and the Sanity economy. Session structure is owned by NIGHT_PROGRESSION;
> this owns what the player *does each second*.

## 1. The loop, at three scales

**Micro (seconds) — the heartbeat:**

```
SCAN ──▶ DOUBT ──▶ DECIDE ──▶ ACT ──▶ FEEL
 look    "is that   report or   tap     consequence
 around   wrong?"    move on    REPORT   (relief / chill)
```

This 5–20 second cycle repeats continuously. It is the entire game in miniature
and it must be satisfying on its own (Pillar 2).

**Meso (≈2 min) — the patrol round:** walk the corridor, scanning, reporting
what is wrong, returning. One round ≈ one in-game hour (NIGHT_PROGRESSION).

**Macro (10–15 min) — the Night:** rounds escalate hour by hour until dawn or
collapse (GDD §3).

**R-LOOP-1** The micro loop must be playable and tense with *zero* anomalies
present — the threat of one is enough. Empty, correct corridors are content.

## 2. Mobile control scheme (portrait, one thumb)

> **Revised in Milestone 2 (Player Core).** The earlier node-based patrol was
> replaced by a full first-person controller — free virtual-joystick movement
> with gravity, collision, sprint, crouch, smoothed look, head-bob and an
> interaction ray. This is the foundation all later systems build on. The table
> below is what ships; it supersedes the node-patrol design (GDD §4).

All controls are one-thumb in portrait, in the dark, possibly muted.

| Verb | Input | Notes |
| --- | --- | --- |
| **LOOK** | Drag the look surface | Free 360°, smoothed. Sensitivity + invert in Settings. |
| **MOVE** | Left virtual **joystick** | Free walk under gravity + wall collision. |
| **SPRINT** | Hold the Sprint button (desktop: Shift) | Faster locomotion. |
| **CROUCH** | Toggle the Crouch button (desktop: C) | Lower stance, slower, shorter collider. |
| **INTERACT** | Contextual Interact button (desktop: E) | Appears when the centre reticle is on an Interactable. |
| **REPORT** | *(horror milestone)* | The anomaly-report action; not wired yet. |

Design decisions and rules:
- **R-LOOP-2 Free first-person movement.** A left virtual joystick drives
  gravity-and-collision movement; sprint and crouch are thumb buttons. The
  controller is decomposed into a motor (physics), look, head-bob and an
  interaction probe (TECH_ARCHITECTURE). Movement is allocation-free for 60 FPS.
- **R-LOOP-3 Look is always free, always available.** The look surface spans the
  screen beneath the controls; dread lives in where you choose to look.
- **R-LOOP-4 Interaction is a first-class verb.** A forward ray from the centre
  reticle resolves the focused {@link Interactable}; the contextual Interact
  button triggers it. (Horror's committal REPORT action arrives later.)
- **R-LOOP-5 Light is atmosphere, not a mechanic.** The view is lit by the world;
  **no flashlight battery to manage** — that remains an unnecessary mechanic.
- **R-LOOP-6 Handedness & comfort.** Joystick (lower-left) and actions
  (lower-right) sit in the thumb-arc; respect safe areas (UI_GUIDELINES R-INT-5).
  Head-bob has a Settings toggle (motion-sickness accessibility).

## 3. The in-Night HUD

The HUD adds **one element** to the existing minimal set: the **Night clock**.

```
┌───────────────────────────────────────┐
│  [Sanity ▮▮▮▮▯]        02:14      ⏸    │  ← top: Sanity · clock · pause
│                                         │
│             (the world)                 │
│                                         │
│                 ◉ advance               │  ← node prompt in the world
│                                         │
│                [ REPORT ]               │  ← bottom-centre, thumb-reachable
└───────────────────────────────────────┘
```

- **R-LOOP-7 The clock is sacred and subtle.** A small `HH:MM` toward 06:00 is
  the player's only progress read and a constant, quiet pressure. It is never
  hidden during play and never flashy.
- **R-LOOP-8 Score is secondary.** Score may live behind the pause/summary
  rather than on the play HUD if it distracts from dread; survival, not score, is
  the felt goal (REWARD_SYSTEM).
- **R-LOOP-9 The HUD never adjudicates reality.** It shows Sanity, clock,
  REPORT, pause — never whether a perceived thing is "really" an anomaly
  (GAMEPLAY R-DBT-3). Certainty is the player's burden.
- **R-LOOP-10** High-frequency values (Sanity) use rounded selectors
  (PERFORMANCE R-PERF-10). The clock updates at most once per in-game minute.

## 4. The Sanity economy (the felt stakes)

Sanity is the single resource (GDD §4). Target tuning is owned by GDD §5; here is
how it *plays* and why it survives a 10–15 minute Night.

**The four Sanity events:**
1. **Active anomaly (unaddressed):** drains **0.6/s**, per anomaly, while it
   lives. Up to 3 at once late in the Night ⇒ up to 1.8/s peak.
2. **Catch (correct report):** **+4** Sanity relief, stops that drain, +score.
3. **Miss (anomaly expires):** **−8** sting (the dawning realisation) *on top of*
   the drain it already caused. Catching early is always cheaper than missing.
4. **Clean recovery:** with **zero** active anomalies, **+0.25/s** — slow relief,
   never a full heal. A quiet corridor is mercy, not a reset.

**False alarm** (REPORT with nothing active): score penalty only, **no Sanity
cost** — panic must never spiral Sanity to death (Pillar 4, GAMEPLAY R-RPT-1).

**Survivability math (why 10–15 min works):**
- *Careful player* catches each anomaly ~8–12 s after it appears: cost ≈
  10×0.6 − 4 ≈ **−2 Sanity net**, recovered by clean-gap recovery. Sanity hovers
  **70–95** all Night; dawn is reached comfortably.
- *Sloppy player* lets anomalies live or miss them: a full miss late-Night ≈
  25 s × 0.6 + 8 ≈ **−23 Sanity** each. **~4–5 misses = death.** Tense, fair.
- The economy is tuned so a *clean Night is survivable but not trivial* and a
  *careless Night collapses around hours 4–5* — the designed peak (HORROR_PACING).

**R-LOOP-11** Sanity is only ever moved by play (anomalies, reports, recovery).
**No passive "timer" drain** — the clock pressures via escalation, not by bleeding
you for existing. This keeps every loss legible (Pillar 4).

**R-LOOP-12** All Sanity numbers are content (GDD §5), tunable per Night/chapter
via the difficulty knobs (DIFFICULTY_CURVE). Systems read them from constants,
never hard-code (CODING_STANDARDS, GAMEPLAY balance protocol).

## 5. The doubt layer (perception under pressure)

As Sanity falls, the world presents **false cues** — flickers, half-seen shapes,
a sound that may or may not be there (GAMEPLAY §6). Reporting one is a false
alarm. This is the psychological core: *a calm, high-Sanity player can tell real
from false; a frayed one cannot.* The player's own fear becomes the difficulty.

- **R-LOOP-13** False cues are **cosmetic**: never drain Sanity, never count as a
  miss, never scoreable. Only true anomalies (entities with a lifetime) score.
  This invariant is tested (GAMEPLAY R-DBT-2).
- **R-LOOP-14** False-cue frequency scales **inversely with Sanity**, not with
  time — the game punishes panic with doubt, not the clock with noise.

## 6. The loop's promise (acceptance criteria)

A correct implementation of this loop means:
1. A new player understands LOOK / MOVE / INTERACT within the first round, with
   no tutorial text wall (NIGHT_PROGRESSION §2).
2. The micro loop is tense with no anomaly present (R-LOOP-1).
3. A careful player survives a full Night; a careless one dies around hours 4–5
   (§4 math).
4. Every Sanity loss is traceable to a perceivable cause (R-LOOP-11, Pillar 4).
5. It is fully playable one-thumb, portrait, muted (R-LOOP-2..6, R-NAR-4).
