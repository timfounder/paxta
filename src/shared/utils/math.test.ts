import { describe, expect, it } from 'vitest';

import { chance, clamp, lerp, pickRandom, remap } from './math';

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
