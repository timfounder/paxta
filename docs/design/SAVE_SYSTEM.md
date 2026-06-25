# SAVE SYSTEM (design)

> Owner of: the *design* of saving — when, what, and the resume experience for
> mobile. The *implementation* (the `SaveSystem`, `SaveRepository` port,
> versioning) is owned by TECH_ARCHITECTURE §8; this owns *what the player
> experiences and what persists*.

## 1. The mobile reality this serves

A phone player is interrupted — a call, a notification, the app backgrounded,
the screen locked. PAXTA must **never punish an interruption** and must let a
player put it down and pick it up inside a Night (Pillar 5).

- **R-SAVE-1 Interruption is not failure.** Backgrounding or closing mid-Night
  never costs the player a life or progress. They resume.

## 2. Two kinds of state

| State | Examples | Persistence |
| --- | --- | --- |
| **Meta** (durable) | Completed Nights, chapter progress, **Case Files**, Custodian standing, cosmetics, settings, leaderboard sync, failure tally | Always saved; survives forever |
| **Night** (transient) | Current hour/clock, Sanity, active Directive + objectives, score-so-far, RNG seed | Saved as a resumable checkpoint; cleared on Night end |

- **R-SAVE-2 Checkpoint at every hour boundary.** The Night autosaves at each
  in-game hour (and on background/blur). Resume restores the **last hour
  checkpoint** — not the exact second.
- **R-SAVE-3 Resume to the hour, re-roll the contents.** On resume, the clock,
  Sanity, and Directive restore, but **anomalies re-roll from the checkpoint
  seed**. You cannot scrub back two seconds to dodge a specific anomaly, and you
  cannot memorise an exact layout — preserving tension and fairness
  (anti-save-scum; HORROR_PACING R-PACE-16).

## 3. The resume experience

- **R-SAVE-4 Resume drops into a breath beat.** Returning mid-Night lands the
  player in an authored calm at the restored hour, then re-escalates — never into
  an un-earned peak (HORROR_PACING R-PACE-16, NIGHT_PROGRESSION R-NIGHT-9).
- **R-SAVE-5 One tap back in.** From the menu, a resumable Night shows a single
  "Resume Night — [HH:MM]" action. No save-slot menus (R-SAVE-8).
- **R-SAVE-6 Background-safe.** On blur/visibility loss the engine pauses
  (PERFORMANCE R-PERF-8) and the Night checkpoint is written; on return the player
  is on the pause/resume screen, never mid-anomaly.

## 4. Autosave only, single profile

- **R-SAVE-7 No manual saves.** PAXTA autosaves; the player never thinks about it
  (Pillar 5). This matches the existing `SaveSystem` design (autosave slot).
- **R-SAVE-8 One profile per Telegram identity.** No save slots to choose. Identity
  is the Telegram user; cloud sync (Phase 3) keys off verified `initData` (TECH
  R-BAK-3). Local-first; cloud is an additive adapter (TECH R-BAK-1/2).
- **R-SAVE-9 Versioned & migrated.** Any change to saved state bumps `SAVE_VERSION`
  and ships a migration; corrupt/newer saves fail safe (TECH R-BAK, GAMEPLAY save
  protocol). A failed load never bricks the app — it degrades to a fresh profile
  with a clear message.

## 5. Failure & the save (how losing interacts with persistence)

- **R-SAVE-10 Death clears the Night, keeps the Meta.** On Sanity 0, the transient
  Night state is discarded; **all Meta is kept** (Case Files, standing, story).
  The Night is **retried from its start**, not from a checkpoint (FAILURE_CONDITIONS
  R-FAIL-5) — death has weight, but costs only the Night, never your progress.
- **R-SAVE-11 PAXTA remembers (soft persistence).** A per-profile **failure tally**
  is saved and may be referenced by the Supervisor as a quiet narrative beat
  (STORY R-NAR-5). It is *flavour only* — it never raises difficulty or punishes
  mechanically (Pillar 4).

## 6. What is saved, precisely

```
Meta (durable, synced):
  profile: { telegramId, standing, failureTally, settings }
  progress: { chaptersUnlocked, nightsCompleted[], currentNight }
  caseFiles: { unlockedVariants[] }
  cosmetics: { owned[], equipped }

Night checkpoint (transient, local):
  { nightId, hour, clock, sanity, directiveState, scoreSoFar, seed }
```

- **R-SAVE-12** The Night checkpoint is **small and serialisable** (ids +
  primitives — TECH R-DOM-5) so it writes instantly on background without a hitch
  (PERFORMANCE).

## 7. Save design checklist

1. Does interrupting mid-Night cost the player nothing (R-SAVE-1)?
2. Resume restores to the hour and re-rolls contents (no save-scum) (R-SAVE-3)?
3. Resume lands in a breath beat (R-SAVE-4)?
4. Meta survives death; the Night restarts, not the run (R-SAVE-10)?
5. One-tap resume, no slot menus, autosave only (R-SAVE-5/7/8)?
6. State is small, versioned, migration-safe, fail-safe (R-SAVE-9/12)?
