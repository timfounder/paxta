import { Color3, PointLight, Vector3, type Mesh, type Scene } from '@babylonjs/core';

import type { CompoundPalette } from './palette';
import { box, pillar } from './primitives';

export interface Machinery {
  /** The generator housing — wired as an Interactable by the scene. */
  readonly generator: Mesh;
  /** The generator's work-light — flickered each frame while powered. */
  readonly generatorLight: PointLight;
}

/** A diesel generator (the interactable power source) and a water pump. */
export const buildMachinery = (scene: Scene, palette: CompoundPalette): Machinery => {
  // -- Generator -------------------------------------------------------------
  const generator = box(
    scene,
    'generator',
    { w: 2.4, h: 1.4, d: 1.6, x: -4, y: 0.7, z: -8 },
    palette.metalRust,
  );
  box(
    scene,
    'generator-panel',
    { w: 0.1, h: 0.8, d: 1, x: -2.75, y: 0.9, z: -8 },
    palette.metalDark,
  );
  pillar(
    scene,
    'generator-exhaust',
    { diameter: 0.22, height: 1.8, x: -5, y: 1.7, z: -8 },
    palette.metalDark,
    true,
  );

  const generatorLight = new PointLight('generator-light', new Vector3(-4, 2.4, -8), scene);
  generatorLight.diffuse = new Color3(1, 0.78, 0.5);
  generatorLight.intensity = 1.2;
  generatorLight.range = 14;

  // -- Water pump ------------------------------------------------------------
  box(scene, 'pump-base', { w: 1, h: 0.6, d: 1, x: -12, y: 0.3, z: -16 }, palette.pipe);
  pillar(
    scene,
    'pump-column',
    { diameter: 0.24, height: 1.6, x: -12, y: 1.1, z: -16 },
    palette.pipe,
    true,
  );
  box(
    scene,
    'pump-spout',
    { w: 1, h: 0.18, d: 0.18, x: -11.3, y: 1.5, z: -16 },
    palette.pipe,
    false,
  );
  box(
    scene,
    'pump-handle',
    { w: 0.6, h: 0.12, d: 0.12, x: -12, y: 1.95, z: -16 },
    palette.metalDark,
    false,
  );

  return { generator, generatorLight };
};
