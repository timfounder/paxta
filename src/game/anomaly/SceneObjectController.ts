import {
  Color3,
  MeshBuilder,
  StandardMaterial,
  Vector3,
  type AbstractMesh,
  type Mesh,
  type Scene,
} from '@babylonjs/core';

import type { Vec3 } from '@shared/types/spatial';
import type { ObjectActuator } from '@systems/anomaly/anomalyEngine.types';
import { ObjectPool } from '@systems/anomaly/ObjectPool';

interface Tween {
  readonly mesh: AbstractMesh;
  readonly from: Vector3;
  readonly to: Vector3;
  elapsed: number;
  readonly duration: number;
}

interface OriginalState {
  readonly position: Vector3;
  readonly visible: boolean;
}

/**
 * The scene-object {@link ObjectActuator}: it moves, hides, shows and resets
 * named meshes, and spawns transient props from a **pool** (no per-event mesh
 * allocation). Original transforms are captured the first time an object is
 * touched so `reset` restores it exactly. Moves are eased on the controller's
 * own tick. This is the game-layer bridge an anomaly effect drives through ports.
 */
export class SceneObjectController implements ObjectActuator {
  private readonly originals = new Map<string, OriginalState>();
  private readonly tweens: Tween[] = [];
  private readonly spawned = new Map<string, Mesh>();
  private readonly pool: ObjectPool<Mesh>;
  private counter = 0;

  constructor(private readonly scene: Scene) {
    const material = new StandardMaterial('anomaly-spawn', scene);
    material.diffuseColor = new Color3(0.5, 0.5, 0.55);
    material.emissiveColor = new Color3(0.12, 0.12, 0.14);
    material.specularColor = new Color3(0.02, 0.02, 0.02);
    this.pool = new ObjectPool<Mesh>(
      () => {
        const mesh = MeshBuilder.CreateBox(
          `anomaly-spawn-${(this.counter += 1)}`,
          { size: 0.4 },
          scene,
        );
        mesh.material = material;
        mesh.isPickable = false;
        mesh.isVisible = false;
        return mesh;
      },
      (mesh) => {
        mesh.isVisible = false;
        mesh.position.set(0, -1000, 0);
      },
    );
  }

  public move(id: string, to: Vec3, durationSeconds: number): void {
    const mesh = this.scene.getMeshByName(id);
    if (!mesh) return;
    this.capture(id, mesh);
    mesh.unfreezeWorldMatrix();
    this.removeTween(mesh);
    this.tweens.push({
      mesh,
      from: mesh.position.clone(),
      to: new Vector3(to.x, to.y, to.z),
      elapsed: 0,
      duration: Math.max(0.01, durationSeconds),
    });
  }

  public hide(id: string): void {
    const mesh = this.scene.getMeshByName(id);
    if (!mesh) return;
    this.capture(id, mesh);
    mesh.isVisible = false;
  }

  public show(id: string): void {
    const mesh = this.scene.getMeshByName(id);
    if (!mesh) return;
    this.capture(id, mesh);
    mesh.isVisible = true;
  }

  public reset(id: string): void {
    const mesh = this.scene.getMeshByName(id);
    const original = this.originals.get(id);
    if (!mesh || !original) return;
    this.removeTween(mesh);
    mesh.position.copyFrom(original.position);
    mesh.isVisible = original.visible;
  }

  public spawn(_prototype: string, at: Vec3): string | null {
    const mesh = this.pool.acquire();
    mesh.position.set(at.x, at.y, at.z);
    mesh.isVisible = true;
    const handle = `spawn-${(this.counter += 1)}`;
    this.spawned.set(handle, mesh);
    return handle;
  }

  public despawn(handle: string): void {
    const mesh = this.spawned.get(handle);
    if (!mesh) return;
    this.spawned.delete(handle);
    this.pool.release(mesh);
  }

  /** Advance active move tweens. Called by the scene each frame. */
  public tick(deltaSeconds: number): void {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      const tween = this.tweens[i];
      tween.elapsed += deltaSeconds;
      const k = Math.min(1, tween.elapsed / tween.duration);
      Vector3.LerpToRef(tween.from, tween.to, k, tween.mesh.position);
      if (k >= 1) {
        this.tweens[i] = this.tweens[this.tweens.length - 1];
        this.tweens.pop();
      }
    }
  }

  public dispose(): void {
    this.tweens.length = 0;
    this.spawned.clear();
    this.originals.clear();
    this.pool.clear((mesh) => mesh.dispose());
  }

  private capture(id: string, mesh: AbstractMesh): void {
    if (this.originals.has(id)) return;
    this.originals.set(id, { position: mesh.position.clone(), visible: mesh.isVisible });
  }

  private removeTween(mesh: AbstractMesh): void {
    for (let i = this.tweens.length - 1; i >= 0; i -= 1) {
      if (this.tweens[i].mesh === mesh) {
        this.tweens[i] = this.tweens[this.tweens.length - 1];
        this.tweens.pop();
      }
    }
  }
}
