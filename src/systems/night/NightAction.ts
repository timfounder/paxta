import { clamp } from '@shared/utils/math';

import type { NightState } from './NightState';
import {
  nightNumber,
  nightString,
  type NightActionSpec,
  type NightContext,
  type NightParams,
} from './night.types';

/** A modular night action — drives the world through ports / mutates state. */
export type NightAction = (ctx: NightContext, state: NightState) => void;
export type NightActionFactory = (params: NightParams) => NightAction;

const registry = new Map<string, NightActionFactory>();

export const registerNightAction = (type: string, factory: NightActionFactory): void => {
  registry.set(type, factory);
};

export const buildNightAction = (spec: NightActionSpec): NightAction => {
  const factory = registry.get(spec.type);
  if (!factory) return () => undefined;
  return factory(spec.params ?? {});
};

export const buildNightActions = (specs: readonly NightActionSpec[]): readonly NightAction[] =>
  specs.map(buildNightAction);

export const runNightActions = (
  actions: readonly NightAction[],
  ctx: NightContext,
  state: NightState,
): void => {
  for (const action of actions) action(ctx, state);
};

// -- Built-in action kinds ---------------------------------------------------

registerNightAction('triggerAnomaly', (p) => {
  const id = nightString(p, 'id');
  return (ctx): void => ctx.anomaly.trigger(id);
});

registerNightAction('enableAnomaly', (p) => {
  const id = nightString(p, 'id');
  return (ctx): void => ctx.anomaly.enable(id);
});

registerNightAction('disableAnomaly', (p) => {
  const id = nightString(p, 'id');
  return (ctx): void => ctx.anomaly.disable(id);
});

registerNightAction('setTension', (p) => {
  const value = clamp(nightNumber(p, 'value', 0.5), 0, 1);
  return (_ctx, state): void => {
    state.targetTension = value;
  };
});

registerNightAction(
  'flash',
  () =>
    (ctx): void =>
      ctx.atmosphere.flash(),
);

registerNightAction('dialogue', (p) => {
  const line = nightString(p, 'line');
  return (ctx): void => ctx.dialogue.say(line);
});

registerNightAction('startObjective', (p) => {
  const id = nightString(p, 'id');
  return (_ctx, state): void => state.startObjective(id);
});

registerNightAction('completeObjective', (p) => {
  const id = nightString(p, 'id');
  return (_ctx, state): void => state.completeObjective(id);
});

registerNightAction('startSequence', (p) => {
  const id = nightString(p, 'id');
  return (_ctx, state): void => {
    state.pendingSequences.add(id);
  };
});

registerNightAction('setFlag', (p) => {
  const name = nightString(p, 'name');
  return (_ctx, state): void => {
    state.flags.add(name);
  };
});
