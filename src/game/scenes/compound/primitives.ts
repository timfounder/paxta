import { MeshBuilder, type Mesh, type Scene, type StandardMaterial } from '@babylonjs/core';

/** A positioned, frozen box. Static collidable geometry by default. */
export const box = (
  scene: Scene,
  name: string,
  spec: { w: number; h: number; d: number; x: number; y: number; z: number },
  material: StandardMaterial,
  collide = true,
): Mesh => {
  const mesh = MeshBuilder.CreateBox(name, { width: spec.w, height: spec.h, depth: spec.d }, scene);
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.material = material;
  mesh.checkCollisions = collide;
  mesh.freezeWorldMatrix();
  return mesh;
};

/** A positioned, frozen vertical cylinder (pipes, posts). */
export const pillar = (
  scene: Scene,
  name: string,
  spec: { diameter: number; height: number; x: number; y: number; z: number },
  material: StandardMaterial,
  collide = false,
): Mesh => {
  const mesh = MeshBuilder.CreateCylinder(
    name,
    { diameter: spec.diameter, height: spec.height, tessellation: 10 },
    scene,
  );
  mesh.position.set(spec.x, spec.y, spec.z);
  mesh.material = material;
  mesh.checkCollisions = collide;
  mesh.freezeWorldMatrix();
  return mesh;
};
