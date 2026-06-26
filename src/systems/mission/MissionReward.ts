import { stringParam, type Params } from '@shared/utils/params';

import type { MissionContext, MissionRewardSpec } from './mission.types';

/** A modular reward applied when a mission completes (drives the actuator). */
export type MissionReward = (ctx: MissionContext) => void;
export type MissionRewardFactory = (params: Params) => MissionReward;

const registry = new Map<string, MissionRewardFactory>();

export const registerMissionReward = (type: string, factory: MissionRewardFactory): void => {
  registry.set(type, factory);
};

export const buildMissionReward = (spec: MissionRewardSpec): MissionReward => {
  const factory = registry.get(spec.type);
  return factory ? factory(spec.params ?? {}) : () => undefined;
};

export const buildMissionRewards = (
  specs: readonly MissionRewardSpec[] | undefined,
): readonly MissionReward[] => (specs ?? []).map(buildMissionReward);

// -- Built-in reward kinds ---------------------------------------------------

registerMissionReward('setFlag', (p) => {
  const name = stringParam(p, 'name');
  return (ctx): void => ctx.actuator.setFlag(name);
});

registerMissionReward('enableAnomaly', (p) => {
  const id = stringParam(p, 'id');
  return (ctx): void => ctx.actuator.enableAnomaly(id);
});

registerMissionReward('triggerAnomaly', (p) => {
  const id = stringParam(p, 'id');
  return (ctx): void => ctx.actuator.triggerAnomaly(id);
});

registerMissionReward(
  'flash',
  () =>
    (ctx): void =>
      ctx.actuator.flash(),
);

registerMissionReward('dialogue', (p) => {
  const line = stringParam(p, 'line');
  return (ctx): void => ctx.actuator.dialogue(line);
});

registerMissionReward('startMission', (p) => {
  const id = stringParam(p, 'id');
  return (ctx): void => ctx.actuator.startMission(id);
});
