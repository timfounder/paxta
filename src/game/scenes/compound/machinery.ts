import type { Mesh, Scene } from '@babylonjs/core';

import type { CompoundPalette } from './palette';
import { box, pillar } from './primitives';

export interface Machinery {
  /** The generator housing — wired as the power-source Interactable by the scene. */
  readonly generator: Mesh;
}

/**
 * The site's static machinery geometry: a diesel generator housing (the
 * interactable power source) and a hand pump. The generator's *light* and
 * behaviour live with the other interactives — this module only builds the
 * frozen, collidable shells.
 */
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

  return { generator };
};
