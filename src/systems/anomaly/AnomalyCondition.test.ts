import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { vec3 } from '@shared/types/spatial';

import { buildCondition } from './AnomalyCondition';
import type { AnomalyContext, WorldQuery } from './anomalyEngine.types';

const makeContext = (world: Partial<WorldQuery>): AnomalyContext => ({
  world: {
    playerPosition: () => vec3(0, 0, 0),
    nightProgress: () => 0,
    interactableState: () => null,
    hasItem: () => false,
    windStrength: () => 0,
    missionStatus: () => null,
    ...world,
  },
  atmosphere: {
    addFogBias: () => undefined,
    addWindBias: () => undefined,
    addMoonBias: () => undefined,
    flashLightning: () => undefined,
  },
  objects: {
    move: () => undefined,
    hide: () => undefined,
    show: () => undefined,
    reset: () => undefined,
    spawn: () => null,
    despawn: () => undefined,
  },
  audio: { play: () => undefined },
  dialogue: { say: () => undefined },
  events: new TypedEventBus<GameEventMap>(),
  random: () => 0.5,
  now: () => 0,
});

describe('AnomalyCondition', () => {
  it('evaluates player proximity', () => {
    const ctx = makeContext({ playerPosition: () => vec3(1, 0, 1) });
    const near = buildCondition({ type: 'position', params: { center: vec3(0, 0, 0), radius: 3 } });
    const far = buildCondition({ type: 'position', params: { center: vec3(20, 0, 0), radius: 3 } });
    expect(near(ctx)).toBe(true);
    expect(far(ctx)).toBe(false);
  });

  it('evaluates the night-progress window', () => {
    const ctx = makeContext({ nightProgress: () => 0.5 });
    expect(buildCondition({ type: 'time', params: { min: 0.4, max: 0.6 } })(ctx)).toBe(true);
    expect(buildCondition({ type: 'time', params: { min: 0.6, max: 0.9 } })(ctx)).toBe(false);
  });

  it('evaluates inventory possession', () => {
    const ctx = makeContext({ hasItem: (id) => id === 'rusted-key' });
    expect(buildCondition({ type: 'inventory', params: { item: 'rusted-key' } })(ctx)).toBe(true);
    expect(
      buildCondition({ type: 'inventory', params: { item: 'rusted-key', has: false } })(ctx),
    ).toBe(false);
  });

  it('evaluates a Stateful interactable field', () => {
    const ctx = makeContext({
      interactableState: (id, field) => (id === 'generator' && field === 'active' ? false : null),
    });
    const off = buildCondition({
      type: 'interactable',
      params: { id: 'generator', field: 'active', equals: false },
    });
    expect(off(ctx)).toBe(true);
  });

  it('negates a predicate', () => {
    const ctx = makeContext({ playerPosition: () => vec3(0, 0, 0) });
    const outside = buildCondition({
      type: 'position',
      params: { center: vec3(0, 0, 0), radius: 3 },
      negate: true,
    });
    expect(outside(ctx)).toBe(false);
  });

  it('treats an unknown condition kind as never-true', () => {
    const ctx = makeContext({});
    expect(buildCondition({ type: 'does-not-exist' })(ctx)).toBe(false);
  });
});
