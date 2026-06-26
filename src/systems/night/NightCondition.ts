import type { NightState } from './NightState';
import {
  nightBool,
  nightString,
  type NightConditionSpec,
  type NightContext,
  type NightParams,
} from './night.types';

/** A predicate over the night context + state. */
export type NightCondition = (ctx: NightContext, state: NightState) => boolean;
export type NightConditionFactory = (params: NightParams) => NightCondition;

const registry = new Map<string, NightConditionFactory>();

export const registerNightCondition = (type: string, factory: NightConditionFactory): void => {
  registry.set(type, factory);
};

export const buildNightCondition = (spec: NightConditionSpec): NightCondition => {
  const factory = registry.get(spec.type);
  if (!factory) return () => false;
  const predicate = factory(spec.params ?? {});
  return spec.negate === true ? (ctx, state): boolean => !predicate(ctx, state) : predicate;
};

export const buildNightConditions = (
  specs: readonly NightConditionSpec[] | undefined,
): readonly NightCondition[] => (specs ?? []).map(buildNightCondition);

export const nightConditionsMet = (
  conditions: readonly NightCondition[],
  ctx: NightContext,
  state: NightState,
): boolean => conditions.every((condition) => condition(ctx, state));

// -- Built-in condition kinds ------------------------------------------------

registerNightCondition('generator', (p) => {
  const equals = nightBool(p, 'equals', true);
  return (ctx): boolean => ctx.world.generatorActive() === equals;
});

registerNightCondition('hasItem', (p) => {
  const item = nightString(p, 'item');
  const has = nightBool(p, 'has', true);
  return (ctx): boolean => ctx.world.hasItem(item) === has;
});

registerNightCondition('objective', (p) => {
  const id = nightString(p, 'id');
  const status = nightString(p, 'status', 'complete');
  return (_ctx, state): boolean => state.objectiveStatus(id) === status;
});

registerNightCondition('phase', (p) => {
  const is = nightString(p, 'is');
  return (_ctx, state): boolean => state.phase === is;
});

registerNightCondition('mission', (p) => {
  const quest = nightString(p, 'quest');
  const status = nightString(p, 'status');
  return (ctx): boolean => ctx.world.missionStatus(quest) === status;
});

registerNightCondition('flag', (p) => {
  const name = nightString(p, 'name');
  return (_ctx, state): boolean => state.flags.has(name);
});
