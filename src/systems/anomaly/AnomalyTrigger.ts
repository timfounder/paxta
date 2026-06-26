import type { Vec3 } from '@shared/types/spatial';

import {
  numberParam,
  vec3Param,
  type AnomalyContext,
  type Params,
  type TriggerSpec,
} from './anomalyEngine.types';

/**
 * A trigger gates *whether an anomaly is even considered* this evaluation. It is
 * the cheap first filter before schedule/conditions: `scheduled` is always
 * eligible (the schedule's probability/cooldown do the work), `proximity` only
 * when the player is near. New trigger kinds are one registered factory.
 */
export type Trigger = (ctx: AnomalyContext) => boolean;
export type TriggerFactory = (params: Params) => Trigger;

const registry = new Map<string, TriggerFactory>();

export const registerTrigger = (type: string, factory: TriggerFactory): void => {
  registry.set(type, factory);
};

export const hasTrigger = (type: string): boolean => registry.has(type);

export const buildTrigger = (spec: TriggerSpec): Trigger => {
  const factory = registry.get(spec.type);
  if (!factory) return () => false;
  return factory(spec.params ?? {});
};

const distanceSquared = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

// -- Built-in trigger kinds --------------------------------------------------

/** Always eligible; the schedule decides via probability / cooldown. */
registerTrigger('scheduled', () => () => true);

/** Eligible only while the player is within `radius` of `center`. */
registerTrigger('proximity', (p) => {
  const center = vec3Param(p, 'center');
  const radiusSquared = numberParam(p, 'radius', 6) ** 2;
  return (ctx): boolean => distanceSquared(ctx.world.playerPosition(), center) <= radiusSquared;
});
