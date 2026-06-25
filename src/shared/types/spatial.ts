/**
 * Plain, serialisable spatial primitives. These intentionally do not depend on
 * Babylon.js so they can travel through events, save files and the network
 * without dragging the renderer into non-rendering layers.
 */
export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const ZERO_VEC3: Vec3 = { x: 0, y: 0, z: 0 };

export const vec3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });
