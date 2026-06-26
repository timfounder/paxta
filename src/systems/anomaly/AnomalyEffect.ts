import {
  numberParam,
  stringParam,
  vec3Param,
  type AnomalyContext,
  type EffectSpec,
  type Params,
} from './anomalyEngine.types';

/**
 * A modular effect. `start` applies it; `stop` reverts it when the anomaly
 * resolves (instantaneous effects leave `stop` a no-op). One instance is built
 * per definition and reused — anomalies never overlap their own active window —
 * so activation costs no allocation.
 */
export interface Effect {
  start(ctx: AnomalyContext): void;
  stop(ctx: AnomalyContext): void;
}
export type EffectFactory = (params: Params) => Effect;

const noop = (): void => {
  // instantaneous effect — nothing to revert
};

const registry = new Map<string, EffectFactory>();

/** Register a new effect kind. Modular: a kind is one factory. */
export const registerEffect = (type: string, factory: EffectFactory): void => {
  registry.set(type, factory);
};

export const hasEffect = (type: string): boolean => registry.has(type);

export const buildEffect = (spec: EffectSpec): Effect => {
  const factory = registry.get(spec.type);
  if (!factory) return { start: noop, stop: noop }; // unknown kind does nothing
  return factory(spec.params ?? {});
};

export const buildEffects = (specs: readonly EffectSpec[]): readonly Effect[] =>
  specs.map(buildEffect);

// -- Built-in effect kinds ---------------------------------------------------

/** Additive, self-reverting atmosphere bias built from one delta accessor. */
const biasEffect = (
  apply: (ctx: AnomalyContext, delta: number) => void,
  amount: number,
): Effect => ({
  start: (ctx): void => apply(ctx, amount),
  stop: (ctx): void => apply(ctx, -amount),
});

registerEffect('fog', (p) =>
  biasEffect((ctx, d) => ctx.atmosphere.addFogBias(d), numberParam(p, 'amount', 0.008)),
);

registerEffect('wind', (p) =>
  biasEffect((ctx, d) => ctx.atmosphere.addWindBias(d), numberParam(p, 'amount', 0.3)),
);

registerEffect('light', (p) =>
  biasEffect((ctx, d) => ctx.atmosphere.addMoonBias(d), numberParam(p, 'amount', -0.2)),
);

registerEffect('lightning', () => ({
  start: (ctx): void => ctx.atmosphere.flashLightning(),
  stop: noop,
}));

/** A combined atmosphere nudge — fog + wind + moon together. */
registerEffect('atmosphere', (p) => {
  const fog = numberParam(p, 'fog', 0);
  const wind = numberParam(p, 'wind', 0);
  const moon = numberParam(p, 'moon', 0);
  return {
    start: (ctx): void => {
      ctx.atmosphere.addFogBias(fog);
      ctx.atmosphere.addWindBias(wind);
      ctx.atmosphere.addMoonBias(moon);
    },
    stop: (ctx): void => {
      ctx.atmosphere.addFogBias(-fog);
      ctx.atmosphere.addWindBias(-wind);
      ctx.atmosphere.addMoonBias(-moon);
    },
  };
});

registerEffect('moveObject', (p) => {
  const id = stringParam(p, 'id');
  const to = vec3Param(p, 'to');
  const duration = numberParam(p, 'duration', 2);
  return {
    start: (ctx): void => ctx.objects.move(id, to, duration),
    stop: (ctx): void => ctx.objects.reset(id),
  };
});

registerEffect('hideObject', (p) => {
  const id = stringParam(p, 'id');
  return {
    start: (ctx): void => ctx.objects.hide(id),
    stop: (ctx): void => ctx.objects.show(id),
  };
});

registerEffect('showObject', (p) => {
  const id = stringParam(p, 'id');
  return {
    start: (ctx): void => ctx.objects.show(id),
    stop: (ctx): void => ctx.objects.hide(id),
  };
});

registerEffect('spawnObject', (p) => {
  const prototype = stringParam(p, 'prototype');
  const at = vec3Param(p, 'at');
  let handle: string | null = null;
  return {
    start: (ctx): void => {
      handle = ctx.objects.spawn(prototype, at);
    },
    stop: (ctx): void => {
      if (handle !== null) {
        ctx.objects.despawn(handle);
        handle = null;
      }
    },
  };
});

registerEffect('playSound', (p) => {
  const cue = stringParam(p, 'cue', 'creak');
  return {
    start: (ctx): void => ctx.audio.play(cue),
    stop: noop,
  };
});

registerEffect('dialogue', (p) => {
  const line = stringParam(p, 'line');
  return {
    start: (ctx): void => ctx.dialogue.say(line),
    stop: noop,
  };
});
