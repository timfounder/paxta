import { stringParam, type Params } from '@shared/utils/params';

import type { MissionContext, MissionTriggerSpec } from './mission.types';

/** Decides whether a mission may start this evaluation (before start conditions). */
export type MissionTrigger = (ctx: MissionContext, completed: ReadonlySet<string>) => boolean;
export type MissionTriggerFactory = (params: Params) => MissionTrigger;

const registry = new Map<string, MissionTriggerFactory>();

export const registerMissionTrigger = (type: string, factory: MissionTriggerFactory): void => {
  registry.set(type, factory);
};

export const buildMissionTrigger = (spec: MissionTriggerSpec): MissionTrigger => {
  const factory = registry.get(spec.type);
  return factory ? factory(spec.params ?? {}) : () => false;
};

// -- Built-in trigger kinds --------------------------------------------------

/** Start as soon as it is eligible (and start conditions pass). */
registerMissionTrigger('auto', () => () => true);

/** Start when the night reaches a phase. */
registerMissionTrigger('onPhase', (p) => {
  const phase = stringParam(p, 'phase');
  return (ctx): boolean => ctx.world.nightPhase() === phase;
});

/** Start when a shared flag is set. */
registerMissionTrigger('onFlag', (p) => {
  const name = stringParam(p, 'name');
  return (ctx): boolean => ctx.world.flag(name);
});

/** Start after another mission has completed (chaining / branching). */
registerMissionTrigger('afterMission', (p) => {
  const id = stringParam(p, 'id');
  return (_ctx, completed): boolean => completed.has(id);
});

/** Start once a named signal has fired. */
registerMissionTrigger('onSignal', (p) => {
  const name = stringParam(p, 'name');
  return (ctx): boolean => ctx.world.lastSignalAt(name) > Number.NEGATIVE_INFINITY;
});
