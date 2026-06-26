import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';

import { NightDirector } from './NightDirector';
import {
  NightPhaseKind,
  ObjectiveStatus,
  type NightContext,
  type NightDefinition,
} from './night.types';

interface Calls {
  enabledSets: string[][];
  triggered: string[];
  lines: string[];
  tensions: number[];
}

const makeContext = (random: () => number = () => 0.5): { ctx: NightContext; calls: Calls } => {
  const calls: Calls = { enabledSets: [], triggered: [], lines: [], tensions: [] };
  const ctx: NightContext = {
    anomaly: {
      enable: () => undefined,
      disable: () => undefined,
      trigger: (id) => calls.triggered.push(id),
      setEnabledSet: (ids) => calls.enabledSets.push([...ids]),
      activeCount: () => 0,
    },
    atmosphere: { setTension: (v) => calls.tensions.push(v), flash: () => undefined },
    world: {
      generatorActive: () => false,
      hasItem: () => false,
      missionStatus: () => null,
      playerPosition: () => ({ x: 0, y: 0, z: 0 }),
    },
    dialogue: { say: (line) => calls.lines.push(line) },
    events: new TypedEventBus<GameEventMap>(),
    random,
    now: () => 0,
  };
  return { ctx, calls };
};

const definition: NightDefinition = {
  id: 'test-night',
  phases: [
    { id: NightPhaseKind.Preparation, durationSeconds: 2, tension: 0.2, anomalies: ['a1'] },
    { id: NightPhaseKind.Calm, durationSeconds: 2, tension: 0.4, anomalies: ['a2'] },
    { id: NightPhaseKind.Resolution, durationSeconds: 2, tension: 0 },
  ],
  events: [
    {
      id: 'intro',
      at: 0.5,
      mandatory: true,
      actions: [{ type: 'dialogue', params: { line: 'hello' } }],
    },
    {
      id: 'finish',
      at: 1,
      mandatory: true,
      actions: [{ type: 'completeObjective', params: { id: 'survive' } }],
    },
    {
      id: 'rng',
      phase: NightPhaseKind.Calm,
      probability: 1,
      actions: [{ type: 'triggerAnomaly', params: { id: 'x' } }],
    },
  ],
  objectives: [{ id: 'survive', description: 'Survive the night' }],
};

const advance = (director: NightDirector, seconds: number, step = 0.25): void => {
  for (let t = 0; t < seconds - 1e-9; t += step) director.update(step);
};

describe('NightDirector', () => {
  it('starts in the first phase and enables its anomaly set', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    const view = director.getStateView();
    expect(view.phase).toBe(NightPhaseKind.Preparation);
    expect(calls.enabledSets[0]).toEqual(['a1']);
  });

  it('fires mandatory timeline events as their time passes', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    advance(director, 1.25);
    expect(calls.lines).toContain('hello');
    expect(director.getStateView().objectives[0].status).toBe(ObjectiveStatus.Complete);
  });

  it('advances phases on their configured durations and re-enables sets', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    advance(director, 2.25);
    expect(director.getStateView().phase).toBe(NightPhaseKind.Calm);
    expect(calls.enabledSets.some((set) => set.length === 1 && set[0] === 'a2')).toBe(true);
    // The phase-scoped random event fires during Calm.
    expect(calls.triggered).toContain('x');
  });

  it('eases tension toward the phase target', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    advance(director, 1);
    const last = calls.tensions[calls.tensions.length - 1];
    expect(last).toBeGreaterThan(0);
    expect(last).toBeLessThanOrEqual(0.2 + 1e-6);
  });

  it('skips phases and completes after the last one (debug)', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    director.skipPhase(); // → Calm
    director.skipPhase(); // → Resolution
    director.skipPhase(); // → complete
    const view = director.getStateView();
    expect(view.complete).toBe(true);
    expect(calls.enabledSets[calls.enabledSets.length - 1]).toEqual([]);
  });

  it('force-triggers an event by id, bypassing eligibility (debug)', () => {
    const { ctx, calls } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    director.triggerEvent('finish');
    expect(director.getStateView().objectives[0].status).toBe(ObjectiveStatus.Complete);
    expect(calls.lines).not.toContain('hello'); // only 'finish' fired
  });

  it('exposes a timeline view for visualisation', () => {
    const { ctx } = makeContext();
    const director = new NightDirector(definition, ctx);
    director.start();
    director.triggerEvent('intro');
    const entry = director.getTimelineView().find((e) => e.id === 'intro');
    expect(entry?.mandatory).toBe(true);
    expect(entry?.at).toBe(0.5);
    expect(entry?.fires).toBe(1);
  });
});
