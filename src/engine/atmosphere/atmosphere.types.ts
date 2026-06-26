import type { DirectionalLight, HemisphericLight, Scene, StandardMaterial } from '@babylonjs/core';

/** The random one-shot ambient events the scheduler can fire. */
export type AmbientEventKind = 'dog' | 'creak' | 'buzz' | 'insectSwell';

/** A pluggable random source (`Math.random` by default) — injectable for tests. */
export type RandomSource = () => number;

/**
 * Live wind parameters shared (by reference) with the vegetation vertex shader.
 * The {@link WindField} mutates it each frame; the {@link WindMaterialPlugin}
 * reads it at bind time. One small object, never reallocated — so wind costs no
 * per-instance CPU work at all.
 */
export interface WindState {
  /** Ever-advancing sway phase (radians). */
  phase: number;
  /** Lateral displacement amplitude on X / Z (world units). */
  amplitudeX: number;
  amplitudeZ: number;
}

/**
 * The scene objects the atmosphere drives. It only *modulates* what the scene
 * already owns (fog, the two ambient lights, the canopy materials); it never
 * creates lights, so the four-light budget is untouched.
 */
export interface AtmosphereBindings {
  readonly scene: Scene;
  readonly moon: DirectionalLight;
  readonly ambient: HemisphericLight;
  /** Canopy materials that receive the wind vertex displacement. */
  readonly windMaterials: readonly StandardMaterial[];
}
