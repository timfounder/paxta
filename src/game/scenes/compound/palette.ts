import { Color3, StandardMaterial, type Scene } from '@babylonjs/core';

/** The shared, matte material set for the compound — built once, reused and
 * frozen so the whole site stays within the mobile material/draw budget. */
export interface CompoundPalette {
  readonly dirt: StandardMaterial;
  readonly road: StandardMaterial;
  readonly soil: StandardMaterial;
  readonly concrete: StandardMaterial;
  readonly wood: StandardMaterial;
  readonly metalDark: StandardMaterial;
  readonly metalRust: StandardMaterial;
  readonly pipe: StandardMaterial;
  readonly bark: StandardMaterial;
  readonly foliage: StandardMaterial;
  readonly cottonPlant: StandardMaterial;
  readonly cottonBoll: StandardMaterial;
}

const matte = (scene: Scene, name: string, r: number, g: number, b: number): StandardMaterial => {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = new Color3(r, g, b);
  // Matte, security-camera look — no plastic highlights (WORLD R-PERF-14).
  material.specularColor = new Color3(0.02, 0.02, 0.02);
  return material;
};

/** Build and freeze the compound palette. */
export const createCompoundPalette = (scene: Scene): CompoundPalette => {
  const palette: CompoundPalette = {
    dirt: matte(scene, 'mat-dirt', 0.18, 0.15, 0.12),
    road: matte(scene, 'mat-road', 0.06, 0.06, 0.07),
    soil: matte(scene, 'mat-soil', 0.12, 0.1, 0.08),
    concrete: matte(scene, 'mat-concrete', 0.22, 0.22, 0.24),
    wood: matte(scene, 'mat-wood', 0.14, 0.1, 0.07),
    metalDark: matte(scene, 'mat-metal-dark', 0.1, 0.11, 0.12),
    metalRust: matte(scene, 'mat-metal-rust', 0.2, 0.1, 0.07),
    pipe: matte(scene, 'mat-pipe', 0.15, 0.16, 0.17),
    bark: matte(scene, 'mat-bark', 0.1, 0.08, 0.06),
    foliage: matte(scene, 'mat-foliage', 0.06, 0.12, 0.07),
    cottonPlant: matte(scene, 'mat-cotton-plant', 0.1, 0.16, 0.09),
    cottonBoll: matte(scene, 'mat-cotton-boll', 0.82, 0.82, 0.78),
  };
  // The bolls catch the dark; a touch of self-illumination keeps the field read.
  palette.cottonBoll.emissiveColor = new Color3(0.12, 0.12, 0.11);
  for (const material of Object.values(palette) as StandardMaterial[]) material.freeze();
  return palette;
};
