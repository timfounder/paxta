import { Color3, DirectionalLight, HemisphericLight, Vector3, type Scene } from '@babylonjs/core';

export interface CompoundLighting {
  /** Hemispheric moon-ambient — its intensity flickers under lightning. */
  readonly ambient: HemisphericLight;
  /** Directional moonlight — the atmosphere drifts and flashes its brightness. */
  readonly moon: DirectionalLight;
}

/**
 * Night lighting: a cool hemispheric moon-ambient plus a soft directional
 * moonlight. The generator and warehouse contribute the only point lights, so
 * the scene stays within the 4-light budget (no real-time shadows on mobile).
 * Both lights are returned so the atmosphere can modulate them (it never adds
 * lights of its own).
 */
export const buildLighting = (scene: Scene): CompoundLighting => {
  const ambient = new HemisphericLight('moon-ambient', new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.36;
  ambient.diffuse = new Color3(0.52, 0.57, 0.72);
  ambient.groundColor = new Color3(0.06, 0.06, 0.08);

  const moon = new DirectionalLight('moonlight', new Vector3(-0.4, -1, 0.3), scene);
  moon.intensity = 0.5;
  moon.diffuse = new Color3(0.6, 0.66, 0.85);
  moon.specular = new Color3(0, 0, 0);

  return { ambient, moon };
};
