import type { AnomalyDebugEntry } from '@systems/anomaly/AnomalyManager';

export type { AnomalyDebugEntry };

/**
 * The narrow surface a scene exposes so the developer overlay can enable,
 * disable and force individual anomalies. Defined in the game layer (the scene
 * and `Game` are the only users) to keep the engine free of the anomaly system.
 */
export interface AnomalyDebuggable {
  listAnomalies(): readonly AnomalyDebugEntry[];
  setAnomalyEnabled(id: string, enabled: boolean): void;
  triggerAnomaly(id: string): void;
}

export const isAnomalyDebuggable = (value: unknown): value is AnomalyDebuggable => {
  const candidate = value as Partial<Record<keyof AnomalyDebuggable, unknown>> | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.listAnomalies === 'function' &&
    typeof candidate.setAnomalyEnabled === 'function' &&
    typeof candidate.triggerAnomaly === 'function'
  );
};
