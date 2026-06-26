import type { Mesh } from '@babylonjs/core';

import type { Interactable } from '@engine/interaction/types';
import { asBrand, type InteractableId } from '@shared/types/branded';

/**
 * A look-at-and-examine interactable: it has a prompt and a stable identity but no
 * behaviour of its own. The interaction system's `interaction:performed` event
 * (carrying this id) is the signal — used, for example, by a mission "inspect"
 * objective. Reuses the interaction framework; adds no new system.
 */
export class Examinable implements Interactable {
  public readonly id: InteractableId;
  private readonly meshes: readonly Mesh[];

  constructor(
    id: string,
    meshes: readonly Mesh[],
    private readonly prompt: string,
  ) {
    this.id = asBrand<InteractableId>(id);
    this.meshes = meshes;
  }

  public get targetMeshes(): readonly Mesh[] {
    return this.meshes;
  }

  public getPrompt(): string {
    return this.prompt;
  }

  public interact(): void {
    // Examining does nothing to the world; the emitted interaction is the signal.
  }
}
