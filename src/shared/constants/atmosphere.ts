/**
 * Data-driven tuning for the atmosphere system. Every dynamic of the
 * environment — how hard the wind gusts, how far the fog drifts, how often a
 * distant dog barks, how long a dead-silent beat lasts — is a number here, so
 * the *feel* of the night is auditable and adjustable without touching logic.
 *
 * The goal is sustained low-grade unease through slow, randomly-timed change —
 * never a scripted scare. See WORLD §"Atmosphere" and AUDIO_GUIDELINES.
 *
 * All durations are in seconds, intensities in their target unit's own scale.
 */
export const ATMOSPHERE = {
  /** How often the scheduler re-evaluates timed events (coarse tick, Hz). */
  TICK_HZ: 5,

  // -- Wind ------------------------------------------------------------------
  WIND: {
    /** Baseline gust strength bounds (0..1). */
    MIN: 0.08,
    MAX: 0.7,
    /** Seconds a gust target holds before a new one is chosen. */
    GUST_INTERVAL_MIN: 4,
    GUST_INTERVAL_MAX: 13,
    /** Smoothing toward the current gust target (higher = snappier). */
    CHANGE_RATE: 0.35,
    /** Radians/second the sway phase advances at full strength. */
    SWAY_SPEED: 1.6,
    /** Peak lateral vertex displacement (world units) at strength 1. */
    SWAY_AMPLITUDE: 0.16,
  },

  // -- Fog -------------------------------------------------------------------
  FOG: {
    MIN: 0.01,
    MAX: 0.02,
    DRIFT_INTERVAL_MIN: 9,
    DRIFT_INTERVAL_MAX: 22,
    CHANGE_RATE: 0.12,
  },

  // -- Moonlight -------------------------------------------------------------
  MOON: {
    MIN: 0.34,
    MAX: 0.56,
    DRIFT_INTERVAL_MIN: 7,
    DRIFT_INTERVAL_MAX: 18,
    CHANGE_RATE: 0.5,
  },

  // -- Distant lightning (no rain) ------------------------------------------
  LIGHTNING: {
    INTERVAL_MIN: 26,
    INTERVAL_MAX: 80,
    /** Added to moon/ambient intensity at the flash peak. */
    FLASH_INTENSITY: 1.3,
    /** Exponential decay rate of the flash envelope. */
    DECAY_RATE: 6,
    /** Chance a flash is a quick double-strike. */
    DOUBLE_CHANCE: 0.4,
    /** Delay before the thunder one-shot follows the flash. */
    THUNDER_DELAY_MIN: 2.5,
    THUNDER_DELAY_MAX: 7,
  },

  // -- Ambient audio scheduling ---------------------------------------------
  AMBIENCE: {
    /** Seconds between random one-shot events (dog, creak, buzz, swell). */
    EVENT_INTERVAL_MIN: 7,
    EVENT_INTERVAL_MAX: 21,
    /** Per-evaluation chance of opening a long, sparse "quiet" period. */
    QUIET_CHANCE: 0.06,
    QUIET_DURATION_MIN: 18,
    QUIET_DURATION_MAX: 40,
    /** Event interval is stretched by this factor during a quiet period. */
    QUIET_INTERVAL_FACTOR: 2.2,
    /** Per-evaluation chance of a brief, unnerving complete-silence beat. */
    SILENCE_CHANCE: 0.03,
    SILENCE_DURATION_MIN: 3.5,
    SILENCE_DURATION_MAX: 8,
    /** Relative weights for which one-shot fires (must be the full kind set). */
    EVENT_WEIGHTS: {
      dog: 0.28,
      creak: 0.34,
      buzz: 0.22,
      insectSwell: 0.16,
    },
  },

  // -- Procedural audio mix (0..1, folded into the ambience channel) --------
  AUDIO: {
    WIND_LOW: 0.5,
    WIND_HIGH: 0.32,
    INSECTS: 0.22,
    HUM: 0.16,
    DOG: 0.3,
    CREAK: 0.32,
    BUZZ: 0.26,
    THUNDER: 0.55,
    /** Bus gain held during a complete-silence beat. */
    SILENCE_DUCK: 0.05,
    /** Bus gain held during a long quiet period. */
    QUIET_DUCK: 0.55,
    /** Smoothing time-constant (s) for bus-gain transitions. */
    DUCK_GLIDE: 0.5,
  },
} as const;
