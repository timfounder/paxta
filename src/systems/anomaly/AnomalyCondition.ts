import type { Vec3 } from '@shared/types/spatial';

import {
  boolParam,
  numberParam,
  stringParam,
  vec3Param,
  type AnomalyContext,
  type ConditionSpec,
  type Params,
} from './anomalyEngine.types';

/** A predicate over the world. Built once per definition, called each evaluation. */
export type Condition = (ctx: AnomalyContext) => boolean;
export type ConditionFactory = (params: Params) => Condition;

const registry = new Map<string, ConditionFactory>();

/** Register a new condition kind. Modular: a kind is one factory, nothing else. */
export const registerCondition = (type: string, factory: ConditionFactory): void => {
  registry.set(type, factory);
};

export const hasCondition = (type: string): boolean => registry.has(type);

export const buildCondition = (spec: ConditionSpec): Condition => {
  const factory = registry.get(spec.type);
  if (!factory) return () => false; // unknown kind never passes (fail-safe)
  const predicate = factory(spec.params ?? {});
  return spec.negate === true ? (ctx): boolean => !predicate(ctx) : predicate;
};

export const buildConditions = (
  specs: readonly ConditionSpec[] | undefined,
): readonly Condition[] => (specs ?? []).map(buildCondition);

export const conditionsMet = (conditions: readonly Condition[], ctx: AnomalyContext): boolean =>
  conditions.every((condition) => condition(ctx));

const distanceSquared = (a: Vec3, b: Vec3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

// -- Built-in condition kinds ------------------------------------------------

/** Player within `radius` of `center`. */
registerCondition('position', (p) => {
  const center = vec3Param(p, 'center');
  const radiusSquared = numberParam(p, 'radius', 3) ** 2;
  return (ctx): boolean => distanceSquared(ctx.world.playerPosition(), center) <= radiusSquared;
});

/** Night progress within `[min, max]`. */
registerCondition('time', (p) => {
  const min = numberParam(p, 'min', 0);
  const max = numberParam(p, 'max', 1);
  return (ctx): boolean => {
    const night = ctx.world.nightProgress();
    return night >= min && night <= max;
  };
});

/** A `Stateful` interactable's `field` equals `equals` (e.g. generator active=false). */
registerCondition('interactable', (p) => {
  const id = stringParam(p, 'id');
  const field = stringParam(p, 'field', 'active');
  const expected = p['equals'] ?? true;
  return (ctx): boolean => ctx.world.interactableState(id, field) === expected;
});

/** Whether the player holds (or does not hold) an item. */
registerCondition('inventory', (p) => {
  const item = stringParam(p, 'item');
  const has = boolParam(p, 'has', true);
  return (ctx): boolean => ctx.world.hasItem(item) === has;
});

/** A quest's status string matches. */
registerCondition('mission', (p) => {
  const quest = stringParam(p, 'quest');
  const status = stringParam(p, 'status');
  return (ctx): boolean => ctx.world.missionStatus(quest) === status;
});

/** Wind strength ("weather") within `[minWind, maxWind]`. */
registerCondition('weather', (p) => {
  const min = numberParam(p, 'minWind', 0);
  const max = numberParam(p, 'maxWind', 1);
  return (ctx): boolean => {
    const wind = ctx.world.windStrength();
    return wind >= min && wind <= max;
  };
});
