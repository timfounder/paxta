# FAILURE CONDITIONS

> Owner of: how the player loses, the fairness contract around losing, and what
> a loss costs. Pillar 4 ("fair but unforgiving") lives or dies here.

## 1. The one true failure: Sanity 0

- **R-FAIL-1 Sanity depletion is the primary (and usually only) failure.** When
  Sanity reaches 0 during play, the Custodian is **Consumed** — the GameOver state
  (`player:died`, cause `sanity-depleted`, already in code). Everything else is a
  variant or a non-failure.
- **R-FAIL-2 Death is always self-explanatory.** A player who dies can name *why*:
  anomalies they let live, misses they took. The Sanity bar is a visible, slow,
  legible countdown (CORE_LOOP §4) — never a surprise (Pillar 4).

## 2. Secondary failure: critical Directive failure (rare)

Some Directives (e.g. Containment) have a **critical objective** that can fail —
the featured anomaly reaches its final escalation stage uncaught.

- **R-FAIL-3 Critical failures are rare and signposted.** Used at most once per
  chapter, with the escalation *visible and audible* the whole time (the player
  watches it worsen). It is never a silent timer.
- **R-FAIL-4 Most Directive failure is *not* death.** Failing a normal objective
  costs reward/score and a Supervisor reproach, and the Night continues. Only an
  explicitly-marked *critical* objective ends the Night (MISSION_DESIGN R-MIS-3).

## 3. Non-failures (things that must never end a run badly)

- **Interruptions** — background/close mid-Night → resume (SAVE_SYSTEM R-SAVE-1).
- **Abandoning** — exiting via pause is a clean stop, not a death; resume later
  (NIGHT_PROGRESSION §4).
- **False alarms** — cost score only, **never Sanity** (GAMEPLAY R-RPT-1,
  CORE_LOOP §4). Panic must never spiral into death.
- **A single missed anomaly** — a wound (−8 + drain), not a death sentence; the
  economy tolerates several misses (CORE_LOOP §4 math).

## 4. The fairness contract (binding)

Every loss must satisfy **all** of these, or it is a bug:

- **R-FAIL-5 Perceivable cause.** The loss traces to anomalies the player could
  have perceived from a reachable node within the tell window (Pillar 4,
  ANOMALY R-ANOM-6).
- **R-FAIL-6 Addressable cause.** The player had the means to prevent it (look,
  reach the node, report). No loss from a thing you could not have acted on.
- **R-FAIL-7 No instant death.** No anomaly, scare, or event removes the run in one
  blow. Sanity is a gradient; death is the *end* of accumulated loss, never a
  single hit (R-FAIL-2). The "miss sting" (−8) is a wound, never a kill on its own.
- **R-FAIL-8 No death during forced no-input.** Sanity never drains to 0 during a
  cutscene-line, a transition, a breath beat, or while the app is backgrounded.
- **R-FAIL-9 No hidden-information death.** Nothing the player *could not have
  known* causes a loss (anomalies are knowable — ANOMALY R-ANOM-1).

## 5. What a loss costs (and doesn't)

| Lost on death | Kept on death |
| --- | --- |
| The current Night's transient progress | **All Meta**: Case Files, standing, story, cosmetics, settings (SAVE_SYSTEM R-SAVE-10) |
| The Night Score for this attempt | Chapter progress, completed Nights |
| — | The right to retry immediately |

- **R-FAIL-10 Retry from the Night's start, not a checkpoint.** Death restarts the
  Night fresh, with a **re-rolled** anomaly seed (SAVE_SYSTEM R-SAVE-3) — no
  memorising, no save-scumming, but no lost meta-progress.
- **R-FAIL-11 No retry wall.** No lives, no energy, no timer, no fee to try again
  (VISION R2). The player may immediately re-enter the Night.

## 6. The feel of failure (it must still sting)

Failure is fair, but **not** consequence-free — or the threat is hollow.

- **R-FAIL-12 Consumed is a designed beat, not just a screen.** Sanity-0 triggers a
  short, quiet, atmospheric collapse (vision fails, the hum swells then cuts) and a
  Supervisor line — dread, not gore (Pillar 1, HORROR_PACING). The GameOver summary
  follows.
- **R-FAIL-13 PAXTA notices.** The failure tally increments (SAVE_SYSTEM R-SAVE-11);
  the Supervisor may reference repeated failures in later Nights — flavour that
  makes loss *mean* something without mechanically punishing it (STORY R-NAR-5).
- **R-FAIL-14 The lesson is legible.** The GameOver summary shows what was
  missed/let-live, so the player leaves understanding *how* to do better — turning
  a loss into a reason to retry, not rage-quit (Pillar 4).

## 7. Failure design checklist

1. Is Sanity-0 the cause, or a rare *signposted* critical objective (R-FAIL-1/3)?
2. Is the cause perceivable, addressable, gradual, and known (R-FAIL-5/6/7/9)?
3. Could it happen during forced no-input or background? It must not (R-FAIL-8).
4. Does the loss keep all Meta and allow immediate, fee-free retry (R-FAIL-10/11)?
5. Does failure *sting* atmospherically and teach (R-FAIL-12/14)?
