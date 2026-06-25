import type { AbstractMesh } from '@babylonjs/core';

/**
 * Something the player can look at and interact with. Behaviour-only — what an
 * interaction *does* is decided by the implementer (a scene prop, a future door,
 * etc.); the player layer only finds it and triggers it.
 */
export interface Interactable {
  /** Short verb shown in the HUD prompt while focused (e.g. "Examine"). */
  readonly prompt: string;
  /** Whether the interaction is currently available. */
  canInteract(): boolean;
  /** Perform the interaction. Called only when {@link canInteract} is true. */
  interact(): void;
}

/** Metadata key under which an {@link Interactable} is attached to a mesh. */
const INTERACTABLE_KEY = 'paxtaInteractable';

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};

const isInteractable = (value: unknown): value is Interactable =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as { interact?: unknown }).interact === 'function';

/** Attach an {@link Interactable} to a mesh so the probe can discover it by ray. */
export const attachInteractable = (mesh: AbstractMesh, interactable: Interactable): void => {
  mesh.metadata = { ...asRecord(mesh.metadata), [INTERACTABLE_KEY]: interactable };
};

/** Read the {@link Interactable} attached to a mesh, if any. */
export const readInteractable = (mesh: AbstractMesh | null | undefined): Interactable | null => {
  const found = asRecord(mesh?.metadata)[INTERACTABLE_KEY];
  return isInteractable(found) ? found : null;
};
