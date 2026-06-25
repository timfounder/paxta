# STORY

> Owner of: fiction, canonical terminology, tone, narrative-delivery rules, and
> chapter structure. WORLD.md owns the *places*; this owns the *meaning*.

## 1. Premise

There are corridors that only exist after midnight, in buildings that have been
lived in too long. The people who built **PAXTA** — a department whose full name
no one will say — learned to find these places, and to keep them stable by
*watching*. A watched corridor stays a corridor. An unwatched one... drifts.

You are a new **Custodian**. You clock in for a **Shift**. A voice — the
**Supervisor** — gives you a place and a single instruction: *notice what is
wrong, and report it.* You are not told what happens to corridors that drift.
You are not told why your hands shake more each night. You are told to come back
tomorrow.

The horror is bureaucratic and intimate: an ordinary night job, in an
extraordinary building, that is slowly spending you.

## 2. Canonical terminology

These terms are **binding** across code, UI, and docs. Do not introduce synonyms.

| Term | Meaning | Player-facing? |
| --- | --- | --- |
| **PAXTA** | The department/program and, colloquially, the building it watches. Always all-caps. | Yes |
| **Custodian** | The player's role/title. | Yes |
| **Night** | One play session = the canonical session unit (10–15 min; design/GDD §3). | Yes |
| **Shift** | The in-fiction name for the night's duty. **One Shift = one Night.** | Yes |
| **The Supervisor** | The off-screen handler who issues directives. | Yes |
| **Anomaly** | A localised wrongness to report. Matches code `Anomaly`. | Yes |
| **The Drift** | The force of decay anomalies are symptoms of. | Yes (sparingly) |
| **Sanity** | The Custodian's hold on reality (the resource). Matches the HUD label. | Yes |
| **Directive** | A Supervisor instruction = an in-game quest/objective. | Yes |
| **The Premises** | The total, growing structure PAXTA watches. | Rare |

> Code already uses `Anomaly`, `Sanity` (HUD), `QuestSystem`. Player-facing
> "Directive" maps to a code `Quest`/objective. Keep that mapping; do not rename
> the code to match flavour.

## 3. Tone

- **Mundane horror.** The terror is in normalcy bent slightly. A timesheet. A
  too-long hallway. A coworker who is almost right.
- **Second person, present tense, sparse.** The Supervisor talks *to* you,
  briefly. PAXTA never explains itself.
- **Dread, not gore (Pillar 1).** No on-screen violence, no body horror as
  spectacle. The worst things are implied, off-frame, or already over.
- **The player is complicit.** You keep PAXTA running. The discomfort is that the
  job might be the monster.

Forbidden tonally: winking humour, fourth-wall jokes, edgelord shock, explained
lore-dumps. One earned ambiguity beats ten answered questions.

## 4. Narrative delivery rules

PAXTA is played in 10–15-minute Nights on a phone, often muted, and often
interrupted. Story must survive that.

- **R-NAR-1 No blocking cutscenes.** Story is delivered through the environment,
  short Supervisor lines, and found text. The player can always move.
- **R-NAR-2 Glanceable text.** A single Supervisor line ≤ 90 characters, readable
  in ≤ 4 seconds. Found notes ≤ 3 short sentences. Reading is optional to *survive*,
  rewarding to *understand* (mirrors the gameplay's perceive-to-win, read-to-know split).
- **R-NAR-3 Telegram is diegetic.** The Supervisor may message the player via
  Telegram between Shifts (push), and `start_param` deep-links are "summons" back
  to a specific corridor. Haptics are PAXTA's "presence." Use these as story, not
  just plumbing (see TECH_ARCHITECTURE for the channels).
- **R-NAR-4 Mute-safe.** No story beat is *only* audio. Audio deepens; it never
  gatekeeps comprehension (echoes AUDIO_GUIDELINES and GAMEPLAY R-ANO-4).
- **R-NAR-5 Continuity is cheap, payoff is earned.** Track player choices/misses
  in the save (`SaveData`) and reference them later. The Supervisor noticing your
  Shift-7 mistake costs one string and buys enormous dread.

## 5. Cast

- **The Custodian (you).** Unvoiced, ungendered, barely characterised — a vessel
  for the player. Characterised only by *what they notice* and *what they miss*.
- **The Supervisor.** The only consistent voice. Calm, procedural, never cruel,
  never warm. Knows more than they say. May not be a person.
- **PAXTA itself.** The antagonist is the institution/building. It is patient. It
  is grateful for your work. That gratitude is the horror.
- **The Drifted.** What corridors and people become when unwatched. Seen rarely,
  never fully, never fought — only avoided or reported.

## 6. Chapter structure

The narrative ships in **Chapters** (the monetisation unit, VISION §7). Each
Chapter is a themed set of locations + Directives + one new anomaly behaviour
(GAMEPLAY R-DIF-2).

| Chapter | Codename | Premise hook | New element |
| --- | --- | --- | --- |
| 0 (free) | **Induction** | Your first nights. Learn to watch. | Core loop, the Hallway |
| 1 (free) | **A Hole in the World** | The corridor remembers more than it should. | First reactive anomaly (matches code quest `chapter-1`) |
| 2 (paid) | **Overtime** | The Shifts stop ending when you clock out. | Persistence between Shifts |
| 3 (paid) | **The Other Custodian** | Someone else is reporting your corridors. | A second presence |
| 4 (paid) | **Tenure** | What you become if you keep coming back. | Endgame |

> Code currently implements the **Hallway** scene and quest `chapter-1`
> ("A Hole in the World"). Keep doc and content names in lockstep (docs/README).

Chapter rules:
- **R-CHP-1** Chapter 0–1 are free and form a **complete, satisfying arc** on
  their own (VISION R3). A non-paying player must reach a real ending.
- **R-CHP-2** Each Chapter introduces exactly one new mechanic/anomaly and one
  escalation of what PAXTA wants from the Custodian.
- **R-CHP-3** A Chapter is "done" only when it can be played start-to-finish with
  audio off and still be understood (R-NAR-4).

## 7. Localisation

- All player-facing strings are authored in **English (en)** as the source, in a
  central string table (no hard-coded UI/story copy — CODING_STANDARDS).
- Keep lines short (R-NAR-2) and idiom-light to ease translation. Telegram tells
  us `language_code`; the string layer keys off it.
- Priority languages post-launch: ru, es, pt-BR, id (Telegram's largest markets).
- Never bake text into textures; anomaly readability must not depend on a locale.

## 8. Writing checklist (per line)

Before any string ships:
1. ≤ 90 chars (Supervisor) / ≤ 3 sentences (note)? (R-NAR-2)
2. Second person, present tense, no jokes? (§3)
3. Comprehensible muted? (R-NAR-4)
4. Uses canonical terms only? (§2)
5. Implies more than it states? (§3)
