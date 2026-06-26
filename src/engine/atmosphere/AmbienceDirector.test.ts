import { describe, expect, it } from 'vitest';

import { ATMOSPHERE } from '@shared/constants/atmosphere';

import { AmbienceDirector } from './AmbienceDirector';
import type { AmbientEventKind } from './atmosphere.types';

const A = ATMOSPHERE.AMBIENCE;
const DT = 1 / ATMOSPHERE.TICK_HZ;

/** A constant random source — handy for steering the weighted/chance branches. */
const constant =
  (value: number): (() => number) =>
  () =>
    value;

/** Run `seconds` worth of ticks, collecting every fired event with its time. */
const run = (
  director: AmbienceDirector,
  seconds: number,
): { events: { kind: AmbientEventKind; at: number }[]; silentTicks: number } => {
  const events: { kind: AmbientEventKind; at: number }[] = [];
  let silentTicks = 0;
  const ticks = Math.round(seconds / DT);
  for (let i = 0; i < ticks; i += 1) {
    const tick = director.update(DT);
    if (tick.silence) silentTicks += 1;
    if (tick.event !== null) events.push({ kind: tick.event, at: i * DT });
  }
  return { events, silentTicks };
};

describe('AmbienceDirector', () => {
  it('fires no event before the first interval elapses', () => {
    // 0.1 never trips the silence/quiet chances (< chance*dt) and yields the
    // shortest possible first interval well above EVENT_INTERVAL_MIN.
    const director = new AmbienceDirector(constant(0.1));
    const early = run(director, A.EVENT_INTERVAL_MIN - DT);
    expect(early.events).toHaveLength(0);
  });

  it('fires weighted one-shots spaced by at least the min interval', () => {
    const director = new AmbienceDirector(constant(0.1));
    const { events, silentTicks } = run(director, 120);

    expect(silentTicks).toBe(0); // 0.1 never opens a silence beat
    expect(events.length).toBeGreaterThan(3);
    for (const { kind } of events) expect(kind).toBe('dog'); // roll 0.1 → first bucket
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i].at - events[i - 1].at).toBeGreaterThanOrEqual(A.EVENT_INTERVAL_MIN - 1e-6);
    }
  });

  it('selects the last weighted bucket at the top of the roll', () => {
    const director = new AmbienceDirector(constant(0.99));
    const { events } = run(director, 200);
    expect(events.length).toBeGreaterThan(0);
    for (const { kind } of events) expect(kind).toBe('insectSwell');
  });

  it('holds dead air and suppresses events during a silence beat', () => {
    // 0.001 < SILENCE_CHANCE*dt, so silence opens on the first tick and events
    // are suppressed while it holds.
    const director = new AmbienceDirector(constant(0.001));
    for (let i = 0; i < 5; i += 1) {
      const tick = director.update(DT);
      expect(tick.silence).toBe(true);
      expect(tick.event).toBeNull();
    }
  });

  it('opens a long quiet period without a silence beat at the right chance band', () => {
    // 0.008 fails the silence roll (> SILENCE_CHANCE*dt) but trips quiet.
    const director = new AmbienceDirector(constant(0.008));
    const tick = director.update(DT);
    expect(tick.silence).toBe(false);
    expect(tick.quiet).toBe(true);
  });
});
