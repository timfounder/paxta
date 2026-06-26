import type { Vec3 } from '@shared/types/spatial';
import { clamp } from '@shared/utils/math';
import { numberParam, stringParam, vec3Param, type Params } from '@shared/utils/params';

import type { MissionContext } from './mission.types';

/** Reports an objective's progress 0..1 (1 = complete). Built once per objective. */
export type MissionTracker = (ctx: MissionContext, startedAt: number) => number;
export type MissionTrackerFactory = (params: Params) => MissionTracker;

const registry = new Map<string, MissionTrackerFactory>();

/** Register a new objective kind. Modular: a kind is one factory. */
export const registerObjectiveType = (type: string, factory: MissionTrackerFactory): void => {
  registry.set(type, factory);
};

export const hasObjectiveType = (type: string): boolean => registry.has(type);

export const buildTracker = (type: string, params: Params): MissionTracker => {
  const factory = registry.get(type);
  return factory ? factory(params) : () => 0;
};

const distanceSquared = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

// -- Built-in objective kinds (each reuses an existing signal) ----------------

/** Reach a location. */
registerObjectiveType('reach', (p) => {
  const target = vec3Param(p, 'target');
  const radiusSquared = numberParam(p, 'radius', 3) ** 2;
  return (ctx): number =>
    distanceSquared(ctx.world.playerPosition(), target) <= radiusSquared ? 1 : 0;
});

/** Interact with / inspect an object (via the interaction event). */
const interactTracker: MissionTrackerFactory = (p) => {
  const id = stringParam(p, 'id');
  return (ctx, startedAt): number => (ctx.world.lastInteractedAt(id) >= startedAt ? 1 : 0);
};
registerObjectiveType('interact', interactTracker);
registerObjectiveType('inspect', interactTracker);

/** Activate a device (a Stateful interactable reaching a value). */
registerObjectiveType('activate', (p) => {
  const id = stringParam(p, 'id');
  const field = stringParam(p, 'field', 'active');
  const value = p['value'] ?? true;
  return (ctx): number => (ctx.world.interactableState(id, field) === value ? 1 : 0);
});

/** Collect an item into the inventory. */
registerObjectiveType('collect', (p) => {
  const item = stringParam(p, 'item');
  return (ctx): number => (ctx.world.hasItem(item) ? 1 : 0);
});

/** Deliver an item: interact with the target while still holding it. */
registerObjectiveType('deliver', (p) => {
  const item = stringParam(p, 'item');
  const id = stringParam(p, 'id');
  return (ctx, startedAt): number =>
    ctx.world.lastInteractedAt(id) >= startedAt && ctx.world.hasItem(item) ? 1 : 0;
});

/** Wait for a named event/signal to fire. */
registerObjectiveType('wait', (p) => {
  const signal = stringParam(p, 'signal');
  return (ctx, startedAt): number => (ctx.world.lastSignalAt(signal) >= startedAt ? 1 : 0);
});

/** Survive for a duration. */
registerObjectiveType('survive', (p) => {
  const seconds = numberParam(p, 'seconds', 60);
  return (ctx, startedAt): number => clamp((ctx.world.now() - startedAt) / seconds, 0, 1);
});
