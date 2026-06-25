import { MeshBuilder, Vector3, type Scene } from '@babylonjs/core';

import type { CompoundPalette } from './palette';

/**
 * The ground the player stands on (collidable, for gravity), plus the road and
 * the tilled field soil laid as thin overlays. Static — world matrices frozen.
 */
export const buildTerrain = (scene: Scene, palette: CompoundPalette): void => {
  const ground = MeshBuilder.CreateGround('ground', { width: 140, height: 140 }, scene);
  ground.material = palette.dirt;
  ground.checkCollisions = true;
  ground.freezeWorldMatrix();

  const road = MeshBuilder.CreateGround('road', { width: 6, height: 72 }, scene);
  road.position = new Vector3(0, 0.02, -4);
  road.material = palette.road;
  road.isPickable = false;
  road.freezeWorldMatrix();

  const field = MeshBuilder.CreateGround('field-soil', { width: 42, height: 54 }, scene);
  field.position = new Vector3(28, 0.01, 4);
  field.material = palette.soil;
  field.isPickable = false;
  field.freezeWorldMatrix();
};
