import { describe, expect, it } from 'vitest';

import { chance, clamp, damp, lerp, pickRandom, remap } from './math';

describe('clamp', () => {
  it('returns the value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to the bounds', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(42, 0, 10)).toBe(10);
  });
});

describe('lerp', () => {
  it('interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe('remap', () => {
  it('maps between ranges', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
  });

  it('returns the output minimum for a zero-width input range', () => {
    expect(remap(5, 2, 2, 7, 9)).toBe(7);
  });
});

describe('pickRandom', () => {
  it('returns undefined for an empty array', () => {
    expect(pickRandom([])).toBeUndefined();
  });

  it('returns the only element of a singleton', () => {
    expect(pickRandom([42])).toBe(42);
  });
});

describe('chance', () => {
  it('is deterministic at the boundaries', () => {
    expect(chance(0)).toBe(false);
    expect(chance(1)).toBe(true);
  });
});

describe('damp', () => {
  it('moves toward the target without overshooting', () => {
    const next = damp(0, 10, 5, 0.1);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });

  it('stays put when already at the target', () => {
    expect(damp(7, 7, 20, 0.016)).toBeCloseTo(7, 10);
  });

  it('is frame-rate independent (one big step ≈ two half steps)', () => {
    const oneStep = damp(0, 1, 12, 0.1);
    const half = damp(0, 1, 12, 0.05);
    const twoSteps = damp(half, 1, 12, 0.05);
    expect(twoSteps).toBeCloseTo(oneStep, 6);
  });
});
