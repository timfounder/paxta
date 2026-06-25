import type { Mesh } from '@babylonjs/core';

import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import type { InteractableId } from '@shared/types/branded';

/** Plain, serialisable snapshot of one interactable's state (for saving). */
export type InteractableState = Record<string, string | number | boolean>;

/**
 * Services handed to an interactable when it acts. Deliberately minimal — only
 * the event bus, which the engine already owns — so the interaction framework
 * stays free of any gameplay system (the dependency rule keeps engine → core).
 * Game-layer objects that need more (e.g. an inventory) capture it themselves.
 */
export interface InteractionContext {
  readonly events: EventBus<GameEventMap>;
}

/**
 * The common interface **every** interactable implements. Behaviour lives in the
 * implementer; the interaction system only finds it (by ray), prompts for it,
 * highlights it, and dispatches to it. Future mechanics (a door, a ritual, an
 * anomaly) plug in by implementing this — the system needs no change.
 */
export interface Interactable {
  readonly id: InteractableId;
  /** Meshes the ray may hit and the highlight outlines. */
  readonly targetMeshes: readonly Mesh[];
  /** The contextual prompt (e.g. "Open Door"), or null when not interactable now. */
  getPrompt(): string | null;
  /** Perform the interaction. Called only when {@link getPrompt} is non-null. */
  interact(context: InteractionContext): void;
}

/** Something a switch or generator can turn on/off (a light, a powered door). */
export interface Activatable {
  setActive(active: boolean): void;
}

/** An interactable whose state must survive save/load. */
export interface Stateful {
  saveState(): InteractableState;
  loadState(state: InteractableState): void;
}

/** An object that animates each frame (door swing, generator flicker). */
export interface Updatable {
  update(deltaSeconds: number): void;
}

export const isActivatable = (value: object): value is Activatable =>
  typeof (value as { setActive?: unknown }).setActive === 'function';

export const isStateful = (value: object): value is Stateful =>
  typeof (value as { saveState?: unknown }).saveState === 'function';

export const isUpdatable = (value: object): value is Updatable =>
  typeof (value as { update?: unknown }).update === 'function';
