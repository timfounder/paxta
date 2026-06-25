import type { AnomalyId, SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';

/** The sensory channel through which an anomaly manifests. */
export const AnomalyKind = {
  Visual: 'visual',
  Audio: 'audio',
  Environmental: 'environmental',
} as const;

export type AnomalyKind = (typeof AnomalyKind)[keyof typeof AnomalyKind];

/** A single active disturbance the player must notice and report. */
export interface Anomaly {
  readonly id: AnomalyId;
  readonly sceneId: SceneId;
  readonly kind: AnomalyKind;
  readonly position: Vec3;
  /** Engine time (seconds) at which the anomaly appeared. */
  readonly spawnedAt: number;
  /** Seconds the anomaly remains before it is considered missed. */
  readonly lifetime: number;
}

/** Sink for sanity changes — implemented by the game-state layer. */
export interface PlayerVitals {
  drainSanity(amount: number): void;
  recoverSanity(amount: number): void;
}

/** Sink for scoring outcomes — implemented by the game-state layer. */
export interface ScoreBoard {
  recordHit(): void;
  recordMiss(): void;
}

export interface AnomalySpawnConfig {
  readonly sceneId: SceneId;
  /** Candidate world positions at which anomalies may appear. */
  readonly anchors: readonly Vec3[];
}
