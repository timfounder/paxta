# UI GUIDELINES

> Owner of: visual design tokens, screen/HUD structure, and interaction rules.
> Tokens here mirror `src/ui/styles/global.css`; keep them in sync.

## 1. Principles

- **Mobile-first, one-handed, in the dark.** Designed for a phone held in one
  hand, in a dark room, often muted (P3, STORY R-NAR-4).
- **The UI is a security terminal, not a game menu.** Cold, functional,
  institutional — PAXTA issued it (STORY tone).
- **The world is the content; the UI gets out of the way.** During a Shift, chrome
  is minimal: Sanity, score, one action. Diegetic where possible.
- **Telegram-themed, but PAXTA-flavoured.** Respect the user's Telegram theme via
  `--tg-*` tokens; overlay PAXTA's identity (the danger red) on top.

## 2. Design tokens (authoritative — mirror of `global.css`)

Theme tokens are driven by `TelegramService` at runtime (TECH_ARCHITECTURE R-TG-2)
with these fallbacks:

| Token | Fallback | Use |
| --- | --- | --- |
| `--tg-bg` | `#0a0a0c` | App background |
| `--tg-text` | `#f5f5f7` | Primary text |
| `--tg-hint` | `#8a8a92` | Secondary / hint text |
| `--tg-button` | `#b3122b` | Primary action |
| `--tg-button-text` | `#ffffff` | On primary |
| `--tg-secondary-bg` | `#15151a` | Surfaces, ghost buttons |

PAXTA semantic colours (do not theme away):

| Token | Value | Meaning |
| --- | --- | --- |
| `--danger` | `#b3122b` | PAXTA systems, alerts, REPORT. **Never** environmental "blood." |
| `--safe` | `#2f9e44` | Sanity healthy |
| `--warning` | `#e8a317` | Sanity caution |

Spacing scale: `--space-xs .25rem` · `sm .5` · `md 1` · `lg 1.5` · `xl 2.5rem`.
Radius: `--radius .75rem`. Font: system stack via `--font`.

**R-UI-1** Use tokens, never raw hex/px in component styles. New colours are added
to this table and `global.css` together.

## 3. Colour meaning (binding)

- **Red = PAXTA**, not gore (echoes WORLD §7). Reserve `--danger` for the report
  terminal and system alerts.
- **Green/amber/red Sanity ramp**: the `SanityBar` shows green > 50, amber > 25,
  red ≤ 25. This is the player's only health read; keep it unambiguous.

## 4. Screens

State lives in `uiStore.screen` (`Screen` enum). One screen renders at a time
over the persistent canvas.

| Screen | Purpose | Rules |
| --- | --- | --- |
| `Loading` | Engine/systems warming up | Spinner + one mood line. ≤ shown until `game` ready. |
| `Menu` | Title + entry | Title, greeting (uses Telegram first name), Enter, Settings. |
| `Game` | Active Shift | Renders only the HUD over the world (§5). |
| `Settings` | Audio/haptics/accessibility | Sliders + toggles; Back. |
| `GameOver` | End-of-Shift summary | Score / caught / missed; Return. |

**R-UI-2** Navigation is store-driven (`useUiStore`), never imperative DOM. A
screen is a pure function of `uiStore`.
**R-UI-3** Overlays (pause) are conditional within a screen, not new routes.

## 5. The HUD (during a Shift)

Layout (`Hud.tsx`): top row = Sanity bar (left) · score (centre) · pause (right);
bottom-centre = REPORT.

- **R-HUD-1** The HUD shows **only** Sanity, score, REPORT, pause. It must never
  reveal whether a perceived thing is a real anomaly (GAMEPLAY R-DBT-3).
- **R-HUD-2** REPORT is the single primary action: a large (≥ 84 px) circular
  `--danger` button, thumb-reachable at the bottom centre.
- **R-HUD-3** The HUD is `pointer-events: none` except its interactive controls,
  so taps fall through to the world for look/move.
- **R-HUD-4** High-frequency values (Sanity) are read via **rounded selectors** to
  avoid per-frame re-renders (TECH_ARCHITECTURE R-ST-2, PERFORMANCE).

## 6. Interaction & touch

- **R-INT-1 Touch targets ≥ 44 × 44 px** (icon buttons are 44; REPORT is 84).
- **R-INT-2** No hover-dependent affordances; design for touch, not mouse.
- **R-INT-3** Provide an `active` (pressed) state on every control (scale/opacity)
  — the only feedback a muted player gets besides haptics.
- **R-INT-4** Pair destructive/important actions with a haptic via
  `TelegramService` when `settings.hapticsEnabled` (catch = success, miss/death =
  error). Haptics are confirmation, never the sole signal.
- **R-INT-5** Respect safe-area insets (`env(safe-area-inset-*)`) on every
  full-screen surface; the notch and home indicator must never cover controls.

### 6a. World interaction (the M4 foundation)

The exploration HUD adds a thin layer driven by the engine's interaction system.
It is **state-mirrored, never authoritative**: components read `uiStore`
(focused prompt) and `inventoryStore` (carried items) projections only.

- **R-INT-6** The **reticle** marks where the interaction ray points and brightens
  on focus (`interaction:focus-changed` → `uiStore.interactionPrompt`). It is the
  single, always-centred focus cue.
- **R-INT-7** The **interaction prompt** (`InteractionPrompt.tsx`) shows the
  focused object's verb just below the reticle ("Open Door", "Pick Up Key"). It is
  `pointer-events: none` — informational only; the tap action is the action
  button. Hidden when nothing is focused.
- **R-INT-8** The contextual **Interact** action button appears only while
  something is focused; a **Drop** button appears only while carrying. Both sit in
  the right-hand thumb cluster with crouch/sprint and obey R-INT-1/3.
- **R-INT-9** The **inventory bar** (`InventoryBar.tsx`) is a small bottom-centre
  row of item chips, hidden while empty. Foundation only — no slots, weight, or
  use actions yet.
- **R-INT-10** Desktop parity (dev convenience): `E`/`F` interact, `Q`/`G` drop —
  but touch is the design target (R-INT-2).

## 7. Typography & copy

- One type scale; the title is the only display-size element. Body ≥ 0.85rem so
  it reads on a phone in the dark.
- Copy follows STORY voice (terse, second person). UI labels are
  institutional verbs: **Enter**, **Report**, **Resume**, **Abandon**.
- **R-TXT-1** No hard-coded user-facing strings in components long-term; route
  through the string layer (STORY §7). Short-term literals must still match voice.

## 8. Feedback patterns

- **Toast** (`uiStore.toast`): transient, non-blocking, auto-dismiss (~2.6 s).
  Use for ambient consequence ("Something slipped past you…"), never for critical
  choices.
- **Modal/overlay**: blocking, for deliberate decisions (pause → Resume/Abandon).
- **R-FB-1** Never block the player mid-perception with a modal triggered by
  gameplay; consequence is shown via toast/HUD so they keep watching.

## 9. Accessibility

- **R-A11Y-1** Never encode critical state in colour alone: the Sanity bar pairs
  colour with width; consider a numeric/iconic redundancy before launch.
- **R-A11Y-2** Comprehensible muted (R-NAR-4) and with reduced motion: gate
  non-essential animation behind `prefers-reduced-motion`.
- **R-A11Y-3** Maintain text contrast ≥ 4.5:1 against its surface using the tokens.
- **R-A11Y-4** Targets and spacing accommodate imprecise touch (R-INT-1).

## 10. Adding a UI element (checklist)

1. Is it needed during a Shift? If yes, justify against R-HUD-1 (minimalism).
2. Uses tokens only (R-UI-1)? Touch target ≥ 44 px (R-INT-1)? Pressed state (R-INT-3)?
3. Store-driven, no logic in the component (R-UI-2, TECH_ARCHITECTURE R-ST-4)?
4. Safe-area safe (R-INT-5)? Muted-safe (R-A11Y-2)?
5. No per-frame re-render from a hot selector (R-HUD-4)?
