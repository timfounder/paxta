/**
 * Optional capabilities a scene may expose. Keeping them as narrow interfaces
 * (rather than baking everything into {@link BaseScene}) lets the composition
 * root interact with scenes structurally, honouring Interface Segregation.
 */
export interface ReportingScene {
  /** The player asserts an anomaly is currently present. */
  report(): void;
}

export const isReportingScene = (value: unknown): value is ReportingScene =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { report?: unknown }).report === 'function';

/** A scene that accepts first-person player control from the UI layer. */
export interface ControllableScene {
  /** Normalised movement intent: `x` = strafe, `z` = forward, each in −1..1. */
  setMoveInput(x: number, z: number): void;
  /** Apply a look delta in radians (`yaw`, `pitch`). */
  look(yaw: number, pitch: number): void;
  /** Hold-to-sprint state. */
  setSprint(active: boolean): void;
  /** Crouch state. */
  setCrouch(active: boolean): void;
  /** Enable/disable head-bob (accessibility). */
  setHeadBobEnabled(enabled: boolean): void;
  /** Trigger the focused interaction, if any. */
  interact(): void;
}

export const isControllableScene = (value: unknown): value is ControllableScene => {
  const candidate = value as Partial<Record<keyof ControllableScene, unknown>> | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.setMoveInput === 'function' &&
    typeof candidate.look === 'function' &&
    typeof candidate.setSprint === 'function' &&
    typeof candidate.setCrouch === 'function' &&
    typeof candidate.setHeadBobEnabled === 'function' &&
    typeof candidate.interact === 'function'
  );
};
