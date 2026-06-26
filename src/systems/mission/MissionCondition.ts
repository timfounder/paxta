import { boolParam, numberParam, stringParam, type Params } from '@shared/utils/params';

import type { MissionConditionSpec, MissionContext } from './mission.types';

/** A predicate over the mission context (start / fail gating). */
export type MissionCondition = (ctx: MissionContext) => boolean;
export type MissionConditionFactory = (params: Params) => MissionCondition;

const registry = new Map<string, MissionConditionFactory>();

export const registerMissionCondition = (type: string, factory: MissionConditionFactory): void => {
  registry.set(type, factory);
};

export const buildMissionCondition = (spec: MissionConditionSpec): MissionCondition => {
  const factory = registry.get(spec.type);
  if (!factory) return () => false;
  const predicate = factory(spec.params ?? {});
  return spec.negate === true ? (ctx): boolean => !predicate(ctx) : predicate;
};

export const buildMissionConditions = (
  specs: readonly MissionConditionSpec[] | undefined,
): readonly MissionCondition[] => (specs ?? []).map(buildMissionCondition);

export const missionConditionsMet = (
  conditions: readonly MissionCondition[],
  ctx: MissionContext,
): boolean => conditions.every((condition) => condition(ctx));

export const anyMissionCondition = (
  conditions: readonly MissionCondition[],
  ctx: MissionContext,
): boolean => conditions.some((condition) => condition(ctx));

// -- Built-in condition kinds ------------------------------------------------

registerMissionCondition('hasItem', (p) => {
  const item = stringParam(p, 'item');
  const has = boolParam(p, 'has', true);
  return (ctx): boolean => ctx.world.hasItem(item) === has;
});

registerMissionCondition('phase', (p) => {
  const is = stringParam(p, 'is');
  return (ctx): boolean => ctx.world.nightPhase() === is;
});

registerMissionCondition('flag', (p) => {
  const name = stringParam(p, 'name');
  const value = boolParam(p, 'value', true);
  return (ctx): boolean => ctx.world.flag(name) === value;
});

registerMissionCondition('generator', (p) => {
  const equals = boolParam(p, 'equals', true);
  return (ctx): boolean => (ctx.world.interactableState('generator', 'active') === true) === equals;
});

registerMissionCondition('anomalies', (p) => {
  const min = numberParam(p, 'min', 0);
  const max = numberParam(p, 'max', Number.POSITIVE_INFINITY);
  return (ctx): boolean => {
    const count = ctx.world.anomalyActiveCount();
    return count >= min && count <= max;
  };
});
