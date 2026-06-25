# REWARD SYSTEM

> Owner of: what the player earns and why. Rewards reinforce **careful
> perception and composure**, never speed or grind, and never sell an advantage
> (VISION R1).

## 1. Reward philosophy

- **R-REW-1 Relief first, numbers second.** The primary reward for surviving a
  Night is the *exhale* of dawn (NIGHT_PROGRESSION R-NIGHT-10). Scores and unlocks
  are presented after, never competing with the felt moment.
- **R-REW-2 Reward care, not speed.** Every reward favours the deliberate,
  attentive, high-Sanity player. Nothing rewards rushing, spamming REPORT, or
  reflexes (DIFFICULTY R-DIFF-9/10).
- **R-REW-3 No grind, no loot RNG, no pay-to-win.** No XP treadmill, no random
  loot, no purchasable power (GDD §4, VISION R1). Rewards are knowledge, prestige,
  cosmetics, and story.

## 2. The four reward layers

| Layer | Cadence | Currency of reward |
| --- | --- | --- |
| **Survival** | per Night | Reaching dawn; the Night Report card |
| **Knowledge** | per anomaly type | **Case Files** (lore + reference) |
| **Prestige** | accumulating | Custodian **standing/rank**; leaderboards |
| **Story** | per Night/chapter | Narrative progression; chapter unlocks |

### A. Survival — the Night Report

On reaching 06:00, a terse summary (institutional, in-fiction):

- **Caught / Missed** counts and **Night Score** (catches − penalties; GDD §5).
- **Sanity at dawn** — the headline number; high Sanity is the mark of mastery
  (R-REW-2).
- **Clean Night** badge — zero misses *and* zero false alarms. The prestige
  achievement composure earns.
- **R-REW-4** The Report celebrates *composure* (Sanity, Clean Night) above raw
  score, so the game teaches the behaviour it wants (calm vigilance).

### B. Knowledge — Case Files (the signature reward)

The first time the player **correctly reports** a given anomaly *variant*, its
**Case File** entry unlocks: a short dossier with its "correct vs wrong"
reference, a line of PAXTA lore, and where it tends to appear.

Case Files are simultaneously: a **teaching tool** (reinforces the correct
state), a **horror collectible** (the lore deepens dread), and a **completion
goal** (REPLAYABILITY). They are passive — no management, no inventory (GDD §4).

- **R-REW-5** A Case File unlocks only on a *correct catch*, never on a miss —
  knowledge is earned by seeing clearly.
- **R-REW-6** Rare variants/behaviours (ANOMALY_PROGRESSION §5) have rarer entries,
  giving completionists a reason to return without any grind (REPLAYABILITY).
- **R-REW-7** Case File text obeys STORY voice and length rules (R-NAR-2) and is
  comprehensible muted (R-NAR-4).

### C. Prestige — standing & leaderboards

- **Custodian standing**: a seniority track that rises with **clean Nights** and
  chapter completion. Purely prestige (a title, a HUD flourish) — **never** a
  mechanical buff (R-REW-3, VISION R1).
- **Leaderboards** (Phase 3+, Supabase): weekly Night Score and the **Daily Seed**
  challenge (REPLAYABILITY). Social, shareable, the Telegram-native hook (P3).
- **R-REW-8** Leaderboards rank *score and composure on equal seeds*, so they
  measure skill, not time spent or money.

### D. Story — the real reward

- Each completed Night advances the chapter; chapters unlock the next
  (STORY §6). The strongest pull to return is *what happens next in PAXTA*.
- **R-REW-9** Story is gated by **completion, not score** — a struggling player
  who survives still sees the story (Pillar 4, VISION R3).

## 3. Cosmetics (the monetised layer)

Per VISION §7: Custodian Kit cosmetics (flashlight tints, terminal/HUD skins) via
Telegram Stars/TON. **Purely visual.**

- **R-REW-10** Cosmetics never affect Sanity, anomaly visibility, score, or any
  mechanic (VISION R1). A paying player and a free player face identical difficulty.
- **R-REW-11** Some cosmetics are *earned* (e.g. a Clean-Chapter title), some
  *bought* — both purely visual, so achievement and purchase coexist without the
  earned ones feeling cheapened.

## 4. Feedback economy (micro-rewards)

The smallest rewards keep the loop satisfying second-to-second:

- **Catch feedback**: institutional confirmation tone + success haptic + Sanity
  relief + the anomaly resolving (CORE_LOOP, AUDIO §4, UI R-INT-4).
- **R-REW-12 Feedback is calm, not celebratory.** No confetti, no big "+100"
  splash — a quiet, professional acknowledgement that fits the dread (Pillar 1).
  The reward is *the wrongness going away*, which is its own relief.
- **R-REW-13 No feedback on false alarm beyond the quiet "wrong" tone** — the
  player learns from the absence of relief, not from punishment theatrics.

## 5. What we deliberately do NOT reward

- ✗ Speed / fast clears (no time bonus). (R-REW-2)
- ✗ Report-spam (false alarms cost score; catching needs a real target). (GAMEPLAY R-RPT-1)
- ✗ Daily-login streaks that punish absence — invitations, never guilt (VISION §8 caution).
- ✗ Anything purchasable that changes difficulty or outcomes. (R-REW-10)

## 6. Reward design checklist

1. Does it reward care/composure over speed/reflex (R-REW-2)?
2. Is it knowledge, prestige, cosmetic, or story — never power (R-REW-3)?
3. Is story/progress gated by completion, not score (R-REW-9)?
4. Is the feedback calm and in-tone (R-REW-12)?
5. If monetised: purely visual, zero mechanical effect (R-REW-10)?
