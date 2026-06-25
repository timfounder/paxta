/**
 * Central gameplay tuning constants. Keeping magic numbers here makes the
 * game's "feel" auditable and adjustable from a single place.
 */
export const GAME = {
  /** Persisted save format version. Bump when the save schema changes. */
  SAVE_VERSION: 1,

  /** localStorage key prefix for every persisted PAXTA value. */
  STORAGE_PREFIX: 'paxta',

  /** Fixed simulation step in seconds (60 Hz) for deterministic systems. */
  FIXED_TIMESTEP: 1 / 60,

  /** Upper bound on a single frame's delta to avoid spiral-of-death after stalls. */
  MAX_FRAME_DELTA: 0.25,
} as const;

export const PLAYER = {
  /** Movement speed in world units per second. */
  MOVE_SPEED: 3.2,

  /** Look sensitivity multiplier for touch / pointer input. */
  LOOK_SENSITIVITY: 0.0022,

  /** Eye height of the first-person camera in world units (standing). */
  EYE_HEIGHT: 1.7,

  // -- Movement & camera feel (Player Core) --------------------------------
  /** Sprint speed multiplier applied to MOVE_SPEED. */
  SPRINT_MULTIPLIER: 1.8,
  /** Crouch speed multiplier applied to MOVE_SPEED. */
  CROUCH_SPEED_MULTIPLIER: 0.5,
  /** Eye height while crouched, in world units. */
  CROUCH_EYE_HEIGHT: 1.0,
  /** Horizontal velocity smoothing rate (higher = snappier accel/stop). */
  MOVE_SMOOTHING: 14,
  /** Downward acceleration, world units per second squared. */
  GRAVITY: -20,
  /** Player collider horizontal radius, in world units. */
  COLLIDER_RADIUS: 0.35,
  /** Collider total height standing / crouched, in world units. */
  STANDING_HEIGHT: 1.8,
  CROUCH_HEIGHT: 1.2,
  /** Look smoothing rate (higher = snappier, less latency). */
  LOOK_SMOOTHING: 22,
  /** Head-bob oscillation rate at base walk speed, radians per second. */
  HEAD_BOB_FREQUENCY: 8.5,
  /** Head-bob vertical / lateral amplitude, in world units. */
  HEAD_BOB_AMPLITUDE: 0.05,
  HEAD_BOB_LATERAL: 0.03,
  /** Maximum interaction-ray reach, in world units. */
  INTERACT_DISTANCE: 2.6,

  /** Sanity bounds. Sanity is the core horror resource. */
  SANITY_MIN: 0,
  SANITY_MAX: 100,

  /** Sanity drained per second while an unresolved anomaly is present. */
  SANITY_DRAIN_PER_ANOMALY: 1.5,

  /** Sanity recovered per second in a clean, anomaly-free environment. */
  SANITY_RECOVERY: 0.4,
} as const;

export const ANOMALY = {
  /** Default seconds before an un-reported anomaly is considered "missed". */
  DEFAULT_LIFETIME: 45,

  /** Maximum number of simultaneously active anomalies per scene. */
  MAX_ACTIVE: 3,

  /** Seconds between anomaly spawn evaluations. */
  SPAWN_INTERVAL: 20,

  /** Base probability that a spawn evaluation produces an anomaly. */
  SPAWN_CHANCE: 0.35,
} as const;
