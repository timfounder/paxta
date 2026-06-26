/**
 * Engine-wide knobs for the mission framework. Mission *content* is data in a
 * {@link MissionDefinition}; this is only the manager's own evaluation cadence.
 */
export const MISSION = {
  /** Objective/trigger evaluation rate (Hz); missions needn't tick every frame. */
  EVAL_HZ: 4,
} as const;
