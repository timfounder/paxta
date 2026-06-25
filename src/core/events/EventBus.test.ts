import { describe, expect, it } from 'vitest';

import { TypedEventBus } from './EventBus';

interface TestEventMap {
  ping: { readonly value: number };
}

describe('TypedEventBus', () => {
  it('delivers payloads to subscribers in order', () => {
    const bus = new TypedEventBus<TestEventMap>();
    const received: number[] = [];
    bus.on('ping', (payload) => received.push(payload.value));

    bus.emit('ping', { value: 1 });
    bus.emit('ping', { value: 2 });

    expect(received).toEqual([1, 2]);
  });

  it('stops delivery after unsubscribe', () => {
    const bus = new TypedEventBus<TestEventMap>();
    const received: number[] = [];
    const off = bus.on('ping', (payload) => received.push(payload.value));

    bus.emit('ping', { value: 1 });
    off();
    bus.emit('ping', { value: 2 });

    expect(received).toEqual([1]);
  });

  it('fires once-handlers a single time', () => {
    const bus = new TypedEventBus<TestEventMap>();
    let calls = 0;
    bus.once('ping', () => {
      calls += 1;
    });

    bus.emit('ping', { value: 1 });
    bus.emit('ping', { value: 2 });

    expect(calls).toBe(1);
  });

  it('allows a handler to unsubscribe another during dispatch', () => {
    const bus = new TypedEventBus<TestEventMap>();
    const received: string[] = [];
    const offSecond = bus.on('ping', () => received.push('second'));
    bus.on('ping', () => {
      received.push('first');
      offSecond();
    });

    bus.emit('ping', { value: 1 });
    bus.emit('ping', { value: 2 });

    // First fires twice; second was removed during the first dispatch but its
    // already-scheduled call in round one still ran.
    expect(received).toEqual(['second', 'first', 'first']);
  });

  it('drops all handlers on clear', () => {
    const bus = new TypedEventBus<TestEventMap>();
    let calls = 0;
    bus.on('ping', () => {
      calls += 1;
    });

    bus.clear();
    bus.emit('ping', { value: 1 });

    expect(calls).toBe(0);
  });
});
