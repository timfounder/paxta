/**
 * Tuning for the anomaly framework. The framework itself is data-driven (each
 * anomaly is a definition); these are the engine-wide knobs — how often it
 * evaluates, how long effects linger by default, how the stand-in night clock
 * ramps, and the safety caps on atmosphere biases and pooling.
 */
export const ANOMALY_ENGINE = {
  /** Coarse evaluation rate (Hz) — scheduling needn't run every frame. */
  EVAL_HZ: 4,
  /** Seconds effects stay active when a definition omits `durationSeconds`. */
  DEFAULT_DURATION: 8,
  /** Most anomalies active at once (older ones are left to resolve naturally). */
  MAX_ACTIVE: 4,
  /**
   * Stand-in night length (seconds) the night-progress clock ramps 0→1 over,
   * until the dedicated Night Spine (IMPLEMENTATION_ROADMAP) lands.
   */
  NIGHT_LENGTH: 600,
  /** Per-prototype spawn-pool capacity (object pooling for `spawn` effects). */
  POOL_SIZE: 6,
} as const;
