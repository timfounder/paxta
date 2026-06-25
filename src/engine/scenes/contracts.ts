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

/** A scene that accepts first-person movement and look input from the UI layer. */
export interface ControllableScene {
  /** Normalised movement intent: `x` = strafe, `z` = forward, each in −1..1. */
  setMoveInput(x: number, z: number): void;
  /** Apply a look delta in radians (`yaw`, `pitch`). */
  look(yaw: number, pitch: number): void;
}

export const isControllableScene = (value: unknown): value is ControllableScene =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { setMoveInput?: unknown }).setMoveInput === 'function' &&
  typeof (value as { look?: unknown }).look === 'function';
