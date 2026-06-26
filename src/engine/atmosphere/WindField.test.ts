import { describe, expect, it } from 'vitest';

import { ATMOSPHERE } from '@shared/constants/atmosphere';

import { WindField } from './WindField';

const TWO_PI = Math.PI * 2;
const DT = 1 / 60;

describe('WindField', () => {
  it('keeps strength, sway phase and amplitude within bounds', () => {
    const field = new WindField(() => 0.5);
    for (let i = 0; i < 2000; i += 1) {
      field.tick(DT);
      field.update(DT);
      const { phase, amplitudeX, amplitudeZ } = field.windState;
      expect(field.strength).toBeGreaterThanOrEqual(0);
      expect(field.strength).toBeLessThanOrEqual(1);
      expect(phase).toBeGreaterThanOrEqual(0);
      expect(phase).toBeLessThan(TWO_PI);
      expect(Math.abs(amplitudeX)).toBeLessThanOrEqual(ATMOSPHERE.WIND.SWAY_AMPLITUDE + 1e-6);
      expect(Math.abs(amplitudeZ)).toBeLessThanOrEqual(ATMOSPHERE.WIND.SWAY_AMPLITUDE + 1e-6);
    }
  });

  it('eases toward the gust target over time', () => {
    const field = new WindField(() => 0.5);
    for (let i = 0; i < 600; i += 1) {
      field.tick(DT);
      field.update(DT);
    }
    // With a constant 0.5 source the target is MIN + 0.5*(MAX-MIN); strength settles near it.
    const expected = ATMOSPHERE.WIND.MIN + 0.5 * (ATMOSPHERE.WIND.MAX - ATMOSPHERE.WIND.MIN);
    expect(field.strength).toBeCloseTo(expected, 1);
  });
});
