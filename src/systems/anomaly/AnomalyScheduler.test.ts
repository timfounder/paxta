import { describe, expect, it } from 'vitest';

import { AnomalyScheduler } from './AnomalyScheduler';
import { ScheduleMode, type AnomalyDefinition, type ScheduleSpec } from './anomalyEngine.types';

const def = (id: string, schedule: ScheduleSpec): AnomalyDefinition => ({
  id,
  trigger: { type: 'scheduled' },
  schedule,
  effects: [],
});

const REPEAT = { mode: ScheduleMode.Repeatable } as const;

describe('AnomalyScheduler', () => {
  it('blocks a one-time anomaly after its first activation', () => {
    const s = new AnomalyScheduler(() => 0.5);
    const once = def('o', { mode: ScheduleMode.Once });
    expect(s.isEligible(once, 0, 0)).toBe(true);
    s.recordActivation(once, 0);
    expect(s.isEligible(once, 100, 0)).toBe(false);
  });

  it('honours cooldowns', () => {
    const s = new AnomalyScheduler(() => 0.5);
    const d = def('c', { ...REPEAT, cooldownSeconds: 10 });
    s.recordActivation(d, 0);
    expect(s.isEligible(d, 9, 0)).toBe(false);
    expect(s.isEligible(d, 10, 0)).toBe(true);
  });

  it('caps lifetime activations', () => {
    const s = new AnomalyScheduler(() => 0.5);
    const d = def('m', { ...REPEAT, maxActivations: 2 });
    s.recordActivation(d, 0);
    s.recordActivation(d, 1);
    expect(s.isEligible(d, 100, 0)).toBe(false);
  });

  it('gates on the night-progress window', () => {
    const s = new AnomalyScheduler(() => 0.5);
    const d = def('n', { ...REPEAT, minNight: 0.5, maxNight: 0.8 });
    expect(s.isEligible(d, 0, 0.3)).toBe(false);
    expect(s.isEligible(d, 0, 0.6)).toBe(true);
    expect(s.isEligible(d, 0, 0.9)).toBe(false);
  });

  it('enforces dependency rules', () => {
    const s = new AnomalyScheduler(() => 0.5);
    const dependency = def('a', REPEAT);
    const dependent = def('b', { ...REPEAT, dependsOn: ['a'] });
    expect(s.isEligible(dependent, 0, 0)).toBe(false);
    s.recordActivation(dependency, 0);
    expect(s.isEligible(dependent, 0, 0)).toBe(true);
  });

  it('rolls per-tick probability', () => {
    const always = new AnomalyScheduler(() => 0.9);
    expect(always.rollProbability(def('x', REPEAT))).toBe(true); // no probability ⇒ always
    expect(always.rollProbability(def('y', { ...REPEAT, probability: 0.5 }))).toBe(false); // 0.9 ≥ 0.5
    const lucky = new AnomalyScheduler(() => 0.1);
    expect(lucky.rollProbability(def('z', { ...REPEAT, probability: 0.5 }))).toBe(true); // 0.1 < 0.5
  });

  it('picks weighted among candidates', () => {
    const low = new AnomalyScheduler(() => 0.1);
    const high = new AnomalyScheduler(() => 0.9);
    const candidates = [def('a', { ...REPEAT, weight: 1 }), def('b', { ...REPEAT, weight: 3 })];
    expect(low.pickWeighted(candidates)).toBe(0); // roll 0.4 of 4 → first bucket
    expect(high.pickWeighted(candidates)).toBe(1); // roll 3.6 of 4 → second bucket
    expect(low.pickWeighted([])).toBe(-1);
  });
});
