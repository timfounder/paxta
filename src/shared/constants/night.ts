/**
 * Engine-wide knobs for the Night Director. The *content* of a night (its phases,
 * timings, tension curve, events) is data in a {@link NightDefinition}; these are
 * only the director's own cadence and smoothing defaults — never night content.
 */
export const NIGHT = {
  /** Random-event evaluation rate (Hz); the night clock still advances per frame. */
  EVAL_HZ: 4,
  /** Tension easing responsiveness toward the phase/action target. */
  TENSION_RATE: 0.4,
  /** Default seconds between steps of a sequence when it omits its own delay. */
  DEFAULT_STEP_DELAY: 4,
} as const;
