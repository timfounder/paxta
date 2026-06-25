import { Color3, type Mesh } from '@babylonjs/core';

import type { Interactable } from './types';

const OUTLINE_COLOR = new Color3(0.95, 0.85, 0.5);
const OUTLINE_WIDTH = 0.04;

/**
 * Outlines the focused interactable. Uses each mesh's cheap per-mesh
 * `renderOutline` rather than a full-screen highlight post-process, so it costs
 * almost nothing on mobile and only ever touches the one focused object.
 */
export class HighlightController {
  private current: readonly Mesh[] = [];

  public focus(interactable: Interactable | null): void {
    const next = interactable?.targetMeshes ?? [];
    if (next === this.current) return;
    for (const mesh of this.current) mesh.renderOutline = false;
    for (const mesh of next) {
      mesh.outlineColor = OUTLINE_COLOR;
      mesh.outlineWidth = OUTLINE_WIDTH;
      mesh.renderOutline = true;
    }
    this.current = next;
  }

  public clear(): void {
    this.focus(null);
  }
}
