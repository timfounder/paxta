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
