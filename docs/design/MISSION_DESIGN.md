# MISSION DESIGN

> Owner of: Directives (one mission per Night), their archetypes, and objective
> structure. A Directive is the Supervisor's reason for tonight's shift — it
> gives a Night shape and story without adding mechanics.

## 1. What a Directive is

Each Night has exactly **one Directive** — the Supervisor's instruction
(player-facing "mission"; the code `Quest`/objective, STORY R-NAME-3). It frames
the patrol, supplies a narrative spine, and ends the Night with a sense of *a job
done* rather than just *a clock survived*.

- **R-MIS-1 One Directive per Night.** No mission stacking, no side quests. The
  Night is short; one clear purpose keeps it legible on mobile (Pillar 3).
- **R-MIS-2 Directives are built only from the player verbs.** LOOK, MOVE,
  INTERACT, REPORT (GDD §4). A Directive recombines and *frames* them; it never
  introduces a brand-new verb (R-MIS-5).
- **R-MIS-3 The Directive never overrides survival.** Reaching dawn alive is
  always the meta-goal; the Directive layers meaning on top. Failing the Directive
  ≠ dying (FAILURE_CONDITIONS R-FAIL-4) unless explicitly a "critical" objective.

## 2. Objective structure

A Directive has **1–3 objectives**, shown terse (STORY R-NAR-2) and advanced by
**events, never polling** (TECH R-EVT, the existing `QuestSystem`).

| Field | Rule |
| --- | --- |
| Count | 1 primary; up to 2 supporting. Never more (R-MIS-1). |
| Text | ≤ ~60 chars, second person ("Report what's wrong on the east round."). |
| Advance | On a game event (`anomaly:resolved`, `scene:loaded`, clock beat). |
| Optionality | Supporting objectives may be **optional** (bonus reward), never blocking. |
| Feedback | A quiet Supervisor line + a Case-File/score nudge on completion. |

- **R-MIS-4 Objectives describe perception, not chores.** "Confirm the waiting
  room is correct," not "press 5 buttons." If an objective can't be expressed via
  watch-and-report, it doesn't belong (Pillar 2).
- **R-MIS-5 No brand-new-verb objectives.** Objectives use the established player
  verbs (look / move / interact / report). One that needs a *new* verb (pick-up,
  placement, a tool) is **redesigned**, or deferred to FUTURE_EXPANSION. Guard the
  mechanic whitelist (GDD §4).

## 3. Directive archetypes (the templates)

Five archetypes cover all v1 Nights. Each is a *frame* over the same loop.

### A. **Standby Watch** (default)
> "Complete your rounds. Report what drifts."

Pure core loop across the full Night. The baseline; most Nights are this. Teaches
and reinforces vigilance. Win = reach dawn with acceptable misses.

### B. **Containment**
> "Something in [location] is getting worse. Stop it."

One **featured anomaly** escalates in stages at a fixed location; the player must
REPORT it (catching it at the right stage) before it reaches its final stage.
Built from REPORT only — escalation stages are presentation, not new verbs. Adds
a focal dread object to the Night.

### C. **Inventory** (the careful-observation set-piece)
> "Confirm [location] matches the record."

A dense, static scene the player must scan thoroughly: several things *might* be
wrong; REPORT each true deviation, ignore the false cues. A test of patience and
nerve, not speed. The quietest, most psychological archetype.

### D. **Search**
> "Find the source of [the sound / the cold]."

ADVANCE-led: follow a worsening cue (audio/environmental) across nodes to its
origin, then REPORT it. Uses movement and the audio language (AUDIO_GUIDELINES
§4) to pull the player somewhere they don't want to go.

### E. **Blackout** (special, rare)
> "Power's failing. Reach 06:00."

Reduced visibility and a heightened reliance on audio anomalies; the Night
becomes about composure in the dark. Used sparingly (≤ once per chapter) as a
peak. Visibility is *reduced and authored*, never pitch-black-unfair (R-DIFF-1).

| Archetype | Primary verb stress | Mood | Frequency |
| --- | --- | --- | --- |
| Standby Watch | balanced | baseline dread | most Nights |
| Containment | REPORT (timing) | focal threat | 1 per chapter |
| Inventory | LOOK (thoroughness) | held breath | 1–2 per chapter |
| Search | ADVANCE (approach) | dread of arrival | 1 per chapter |
| Blackout | composure | peak strain | ≤ 1 per chapter |

- **R-MIS-6 Vary the archetype, not the verbs.** Across a chapter, rotate
  archetypes so Nights feel distinct while the controls never change. Two
  identical archetypes back-to-back is a content smell.
- **R-MIS-7 The archetype sets the pacing emphasis** but still obeys the Night
  curve (NIGHT_PROGRESSION) and pacing rules (HORROR_PACING).

## 4. Authoring a Directive (checklist)

1. Pick an archetype (§3) that hasn't run recently (R-MIS-6).
2. Write 1 primary + ≤2 supporting objectives, each ≤60 chars, event-advanced
   (R-MIS-2/4).
3. Confirm it needs **no fourth verb** (R-MIS-5).
4. Tie it to the Night's location(s) and the chapter's new anomaly element
   (DIFFICULTY_CURVE §3).
5. Write the Supervisor's brief (1 line) and sign-off (1 line) in the string
   layer (STORY §7).
6. Define the per-Night difficulty knobs in the Night's content (DIFFICULTY R-DIFF-8).
7. Verify: completable via watch-and-report, comprehensible muted (STORY R-NAR-4),
   and survival-independent unless explicitly critical (R-MIS-3).

## 5. How Directives serve the story

The sequence of Directives *is* the chapter's narrative escalation: Standby
Watches establish normalcy; Containment/Search Nights reveal PAXTA reaching for
the Custodian; the chapter finale is usually a Blackout or a heightened
Containment (STORY §6). A Directive's *text* is one of the cheapest, highest-
impact story surfaces in the game (STORY R-NAR-5) — write it like it matters.
