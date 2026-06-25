import type { Scene } from '@babylonjs/core';

import type { CompoundPalette } from './palette';
import { box } from './primitives';

/**
 * The two landmark structures: a small wooden guard house by the road entrance,
 * and a large open-fronted warehouse you can walk into. Lighting for the
 * doorway is provided by the generator-powered work-light in `interactives`, so
 * the scene stays within its four-light budget.
 */
export const buildStructures = (scene: Scene, palette: CompoundPalette): void => {
  // -- Guard house (solid hut by the entrance) -------------------------------
  box(scene, 'guard-body', { w: 4, h: 3, d: 4, x: 8, y: 1.5, z: -24 }, palette.wood);
  box(
    scene,
    'guard-roof',
    { w: 4.6, h: 0.3, d: 4.6, x: 8, y: 3.15, z: -24 },
    palette.metalDark,
    false,
  );

  // -- Warehouse (open-fronted shell, x ∈ [-27,-9], z ∈ [-1,13], front faces +x)
  box(scene, 'wh-back', { w: 0.4, h: 7, d: 14, x: -27, y: 3.5, z: 6 }, palette.concrete);
  box(scene, 'wh-side-s', { w: 18, h: 7, d: 0.4, x: -18, y: 3.5, z: -1 }, palette.concrete);
  box(scene, 'wh-side-n', { w: 18, h: 7, d: 0.4, x: -18, y: 3.5, z: 13 }, palette.concrete);
  // Front wall split around a 4-wide doorway (z ∈ [4,8]).
  box(scene, 'wh-front-s', { w: 0.4, h: 7, d: 5, x: -9, y: 3.5, z: 1.5 }, palette.concrete);
  box(scene, 'wh-front-n', { w: 0.4, h: 7, d: 5, x: -9, y: 3.5, z: 10.5 }, palette.concrete);
  box(scene, 'wh-lintel', { w: 0.4, h: 1.5, d: 4, x: -9, y: 6.25, z: 6 }, palette.concrete);
  box(scene, 'wh-roof', { w: 18.4, h: 0.4, d: 14.4, x: -18, y: 7, z: 6 }, palette.metalDark, false);
};
