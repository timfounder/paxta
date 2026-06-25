# VISION

> Owner of: product vision, design pillars, target audience, commercial model,
> success metrics. Other docs reference this; do not restate these here.

## 1. One-line pitch

**PAXTA is a first-person psychological horror game about noticing what is
wrong — played in 5-minute shifts inside Telegram.**

You are a **Custodian**: a night-shift observer assigned to PAXTA, a building
that exists in the places reality forgets. Your job is to walk its corridors,
spot **anomalies** (things that have drifted from how they should be), and
**report** them before they spread. Each missed wrong thing erodes your
**Sanity**. When your Sanity is gone, so are you.

## 2. Why this game, why now

- **Telegram Mini Apps are an under-served, high-distribution platform.** ~1B
  users, native payments (Stars/TON), instant launch, viral chat distribution,
  zero app-store friction. Horror is virtually absent there. PAXTA owns that gap.
- **The anomaly-spotting loop is mobile-perfect.** It is stationary-friendly,
  glanceable, pausable, and tense in seconds — ideal for a chat-embedded
  micro-session.
- **Horror travels in chat.** Fear is the most shareable emotion. A scare clip,
  a referral, a "did you survive Shift 7?" challenge is native to Telegram.

## 3. Design pillars

The five pillars live in [docs/README](./README.md#design-pillars-verbatim-referenced-everywhere).
Concrete consequences for this product:

- **P1 Dread over gore** → No dismemberment, no torture, no blood-as-spectacle.
  Budget for atmosphere (light, sound, silence) before assets.
- **P2 Perception is the mechanic** → Every system either presents information
  to perceive, or measures the player's perception. If it does neither, question it.
- **P3 Telegram-native** → If a feature needs an app-store build, a 50 MB
  download, or a 10-minute session to make sense, it does not ship in PAXTA.
- **P4 Fair but unforgiving** → We never cheat the player; the player can lose.
- **P5 Persistent unease, low friction** → The game must open to a playable
  state in under 2 seconds and survive being closed mid-shift.

## 4. Target audience

- **Primary:** 18–34, plays horror/atmospheric games, lives in Telegram, plays in
  short bursts (commute, bed, breaks). Comfortable with text-forward narrative.
- **Secondary:** horror-content viewers/streamers who clip and share scares.
- **Explicitly not targeting:** players seeking action, gore, fast reflex combat,
  or long uninterrupted sessions. We do not chase them with features.

## 5. The experience we promise

| When | The player should feel |
| --- | --- |
| First 10 seconds | Calm, then a small wrongness they can't place. |
| First shift | "I think I missed something" — productive paranoia. |
| First loss | "That was my fault" — never "that was unfair." |
| Hour 1 | A creeping understanding that PAXTA is aware of them. |
| Return next day | Compulsion to check what changed while they were gone. |

**The 10-second dread rule:** a new player must feel unease within 10 seconds of
their first shift, without a single jump-scare. Onboarding is judged against this.

## 6. What PAXTA is / is not

| PAXTA is | PAXTA is not |
| --- | --- |
| A perception & nerve game | A reflex or combat game |
| Slow, deliberate, atmospheric | Frantic or gory |
| Episodic, live-serviced | A one-and-done premium title |
| Offline-first, cloud-synced | Always-online |
| Free to start, paid to go deeper | Pay-to-win or energy-gated |

## 7. Commercial model

Free entry; revenue from depth and identity, never from advantage. See
[GAMEPLAY](./GAMEPLAY.md) for why mechanics stay non-monetised (P4).

1. **Episodic chapters (primary).** The opening chapters (the Induction and
   Chapter 1) are free and form a complete arc; the exact free set is owned by
   [STORY](./STORY.md) §6. Later chapters unlock with **Telegram Stars**
   (one-time). Owning a chapter is permanent.
2. **Custodian Kit cosmetics.** Flashlight tints, report-terminal skins, HUD
   themes. Purely visual. Stars or TON.
3. **Season Rotation (live-ops).** A free seasonal track of anomaly challenges
   with an optional paid "Supervisor's Dossier" cosmetic/lore track.
4. **Referral & gifting.** `start_param` invites grant a cosmetic to both
   parties (fiction in [STORY](./STORY.md) R-NAR-3; delivery in
   [ROADMAP](./ROADMAP.md) Phase 3).

**Monetisation rules (binding):**
- R1 — Never sell Sanity, score, anomaly visibility, time, or any mechanical edge.
- R2 — Never gate a *shift* behind energy/lives/timers. PAXTA is always playable.
- R3 — A free player must be able to experience a complete, satisfying horror arc.
- R4 — No ads inside a shift. Optional rewarded moments only outside the fiction.
- R5 — Every purchase is restorable from the player's Telegram identity.

## 8. Success metrics (what we optimise)

These are the only metrics that override "make it scarier":

| Metric | Target at soft launch | Why it matters |
| --- | --- | --- |
| Time-to-first-dread | ≤ 10 s | Pillar 1 + onboarding works |
| D1 retention | ≥ 35 % | The loop is compelling |
| D7 retention | ≥ 12 % | Live-ops / story pull works |
| Median session length | 3–7 min | Telegram-native pacing (P3) |
| Sessions/day/active | ≥ 2 | Habit, not chore |
| Free→paid conversion | ≥ 3 % | Model viable without coercion |
| Crash-free sessions | ≥ 99.5 % | Trust, on low-end devices |

If a feature improves a vanity number (DAU spikes from notifications spam) while
hurting retention or dread, it is rejected.

## 9. Non-goals for v1

We will be asked for these. The answer for v1 is **no**, with reasons:

- Multiplayer / co-op watch — huge scope, dilutes solitude (the core of dread).
- User-generated anomalies — moderation + safety burden before product-market fit.
- Procedural infinite mode — undermines authored dread and story; consider post-launch.
- Native (non-Telegram) ports — revisit only after Telegram product-market fit.

## 10. The long bet

PAXTA becomes the reference horror franchise on Telegram: a living, episodic
world that players check into nightly, share when it scares them, and pay into
because they want *more of the same world* — not because they were squeezed.
Every decision is measured against that bet and the five pillars.
