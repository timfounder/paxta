import {
  Color3,
  MeshBuilder,
  PointLight,
  StandardMaterial,
  TransformNode,
  Vector3,
  type Mesh,
  type Scene,
} from '@babylonjs/core';

import type { CompoundPalette } from './palette';
import { box } from './primitives';

/** A loose prop the player can pick up: its mesh plus the item it represents. */
export interface PickupSpec {
  readonly mesh: Mesh;
  readonly id: string;
  readonly name: string;
  readonly label: string;
}

/** Everything in the compound the player can interact with, plus its lights. */
export interface CompoundInteractives {
  /** The warehouse door: a leaf parented to a hinge node the scene rotates. */
  readonly door: { readonly hinge: TransformNode; readonly leaf: Mesh };
  /** The guard-house wall switch (toggles the entrance light). */
  readonly switchMesh: Mesh;
  /** Warehouse work-light, powered by the generator (flickers while lit). */
  readonly generatorLight: PointLight;
  /** Entrance flood-light, toggled by the wall switch. */
  readonly exteriorLight: PointLight;
  /** Loose objects scattered for the pick-up / drop loop. */
  readonly pickups: readonly PickupSpec[];
}

/** A small, slightly self-lit prop mesh — visible at night, never frozen (it can be dropped). */
const prop = (scene: Scene, name: string, material: StandardMaterial, position: Vector3): Mesh => {
  const mesh = MeshBuilder.CreateBox(name, { width: 0.34, height: 0.16, depth: 0.12 }, scene);
  mesh.position.copyFrom(position);
  mesh.material = material;
  return mesh;
};

/**
 * Builds the compound's interactive props and the two point lights they drive.
 * Geometry only — the *behaviour* (open/close, toggle, pick up) is attached by
 * the scene through the engine's interaction objects. Keeping the two switched
 * lights here (and removing the static ones) holds the scene to four lights.
 */
export const buildInteractives = (scene: Scene, palette: CompoundPalette): CompoundInteractives => {
  // -- Warehouse door (hinged leaf in the front doorway, z ∈ [4,8]) ----------
  const hinge = new TransformNode('wh-door-hinge', scene);
  hinge.position.set(-9, 2.6, 4);
  const leaf = MeshBuilder.CreateBox('wh-door-leaf', { width: 0.22, height: 5, depth: 3.7 }, scene);
  leaf.material = palette.wood;
  leaf.parent = hinge;
  leaf.position.set(0, 0, 1.9);

  // -- Guard-house wall switch (east face, by the entrance) ------------------
  const switchMesh = box(
    scene,
    'guard-switch',
    { w: 0.12, h: 0.4, d: 0.26, x: 10.06, y: 1.4, z: -23 },
    palette.metalDark,
    false,
  );

  // -- Lights (intensity is owned by the Lamp wrappers) ----------------------
  const generatorLight = new PointLight('wh-work-light', new Vector3(-14, 5, 6), scene);
  generatorLight.diffuse = new Color3(1, 0.82, 0.55);
  generatorLight.intensity = 0;
  generatorLight.range = 20;

  const exteriorLight = new PointLight('entrance-light', new Vector3(8, 4, -22), scene);
  exteriorLight.diffuse = new Color3(0.85, 0.9, 1);
  exteriorLight.intensity = 0;
  exteriorLight.range = 16;

  // -- Loose pickups ---------------------------------------------------------
  const propMaterial = new StandardMaterial('mat-prop', scene);
  propMaterial.diffuseColor = new Color3(0.65, 0.62, 0.3);
  propMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
  propMaterial.emissiveColor = new Color3(0.18, 0.16, 0.08);
  propMaterial.freeze();

  const pickups: readonly PickupSpec[] = [
    {
      mesh: prop(scene, 'pickup-key', propMaterial, new Vector3(6.2, 0.2, -21)),
      id: 'rusted-key',
      name: 'Rusted Key',
      label: 'Pick Up Key',
    },
    {
      mesh: prop(scene, 'pickup-tag', propMaterial, new Vector3(-3, 0.2, -9.6)),
      id: 'metal-tag',
      name: 'Metal Tag',
      label: 'Pick Up Tag',
    },
    {
      // The "missing" fuel can — tucked in the warehouse interior to be found.
      mesh: prop(scene, 'pickup-fuel', propMaterial, new Vector3(-23, 0.2, 10)),
      id: 'fuel-can',
      name: 'Fuel Can',
      label: 'Pick Up Fuel Can',
    },
  ];

  return { door: { hinge, leaf }, switchMesh, generatorLight, exteriorLight, pickups };
};
