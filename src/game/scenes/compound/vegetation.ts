import { MeshBuilder, type Mesh, type Scene } from '@babylonjs/core';

import { randomRange } from '@shared/utils/math';

import type { CompoundPalette } from './palette';

/** Place a frozen, non-collidable instance (or the base mesh at index 0). */
const place = (
  base: Mesh,
  index: number,
  x: number,
  y: number,
  z: number,
  rotationY: number,
): void => {
  const target = index === 0 ? base : base.createInstance(`${base.name}-${index}`);
  target.position.set(x, y, z);
  target.rotation.y = rotationY;
  target.isPickable = false;
  target.freezeWorldMatrix();
};

const cottonField = (scene: Scene, palette: CompoundPalette): void => {
  const plant = MeshBuilder.CreateBox(
    'cotton-plant',
    { width: 0.35, height: 0.4, depth: 0.35 },
    scene,
  );
  plant.material = palette.cottonPlant;
  const boll = MeshBuilder.CreateSphere('cotton-boll', { diameter: 0.2, segments: 6 }, scene);
  boll.material = palette.cottonBoll;

  let index = 0;
  for (let gx = 11; gx <= 45; gx += 2.6) {
    for (let gz = -19; gz <= 27; gz += 2.6) {
      const x = gx + randomRange(-0.6, 0.6);
      const z = gz + randomRange(-0.6, 0.6);
      const rotation = randomRange(0, Math.PI);
      place(plant, index, x, 0.2, z, rotation);
      place(boll, index, x, 0.46, z, rotation);
      index += 1;
    }
  }
};

/** Perimeter and roadside tree positions (x, z). */
const TREE_SPOTS: ReadonlyArray<readonly [number, number]> = [
  [-34, 34],
  [-22, 36],
  [-8, 35],
  [6, 36],
  [20, 35],
  [34, 34],
  [44, 28],
  [-36, 12],
  [-36, -8],
  [-34, -22],
  [44, 8],
  [46, -10],
  [44, -24],
  [-18, -28],
  [-4, -30],
  [12, -30],
  [26, -28],
  [38, -30],
  [16, -12],
  [22, 6],
  [38, 14],
  [-30, 24],
  [10, -24],
  [30, -16],
  [-26, -16],
  [42, -2],
];

const treeLine = (scene: Scene, palette: CompoundPalette): void => {
  const trunk = MeshBuilder.CreateCylinder(
    'tree-trunk',
    { diameter: 0.45, height: 3.2, tessellation: 8 },
    scene,
  );
  trunk.material = palette.bark;
  const foliage = MeshBuilder.CreateCylinder(
    'tree-foliage',
    { diameterTop: 0, diameterBottom: 3, height: 4, tessellation: 8 },
    scene,
  );
  foliage.material = palette.foliage;

  TREE_SPOTS.forEach(([x, z], index) => {
    const rotation = randomRange(0, Math.PI);
    place(trunk, index, x, 1.6, z, rotation);
    place(foliage, index, x, 4.2, z, rotation);
  });
};

/** Build the cotton field and the surrounding tree line (instanced). */
export const buildVegetation = (scene: Scene, palette: CompoundPalette): void => {
  cottonField(scene, palette);
  treeLine(scene, palette);
};
