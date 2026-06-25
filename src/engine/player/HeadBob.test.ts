import { describe, expect, it } from 'vitest';

import { PLAYER } from '@shared/constants/game';

import { HeadBob } from './HeadBob';

const MAX_VERTICAL = PLAYER.HEAD_BOB_AMPLITUDE * PLAYER.SPRINT_MULTIPLIER;

describe('HeadBob', () => {
  it('stays neutral while stationary', () => {
    const bob = new HeadBob();
    for (let i = 0; i < 20; i += 1) bob.update(0.016, 0, true, true);
    expect(bob.verticalOffset).toBeCloseTo(0, 3);
    expect(bob.lateralOffset).toBeCloseTo(0, 3);
  });

  it('produces no bob when disabled, even while moving', () => {
    const bob = new HeadBob();
    for (let i = 0; i < 20; i += 1) bob.update(0.016, PLAYER.MOVE_SPEED, true, false);
    expect(bob.verticalOffset).toBeCloseTo(0, 3);
  });

  it('produces no bob while airborne', () => {
    const bob = new HeadBob();
    for (let i = 0; i < 20; i += 1) bob.update(0.016, PLAYER.MOVE_SPEED, false, true);
    expect(bob.verticalOffset).toBeCloseTo(0, 3);
  });

  it('oscillates within the amplitude bound while walking', () => {
    const bob = new HeadBob();
    let peak = 0;
    for (let i = 0; i < 240; i += 1) {
      bob.update(0.016, PLAYER.MOVE_SPEED, true, true);
      peak = Math.max(peak, Math.abs(bob.verticalOffset));
    }
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThanOrEqual(MAX_VERTICAL + 1e-6);
  });
});
