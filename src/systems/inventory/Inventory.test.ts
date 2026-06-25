import { describe, expect, it, vi } from 'vitest';

import { TypedEventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';

import { Inventory } from './Inventory';
import type { InventoryItem } from './inventory.types';

const KEY: InventoryItem = { id: 'key', name: 'Rusted Key' };
const NOTE: InventoryItem = { id: 'note', name: 'Torn Note' };

const makeInventory = (capacity = 6): Inventory =>
  new Inventory(new TypedEventBus<GameEventMap>(), capacity);

describe('Inventory', () => {
  it('adds an item and reports it held', () => {
    const inventory = makeInventory();
    expect(inventory.add(KEY)).toBe(true);
    expect(inventory.has('key')).toBe(true);
    expect(inventory.size).toBe(1);
  });

  it('rejects duplicates', () => {
    const inventory = makeInventory();
    inventory.add(KEY);
    expect(inventory.add(KEY)).toBe(false);
    expect(inventory.size).toBe(1);
  });

  it('rejects additions once full', () => {
    const inventory = makeInventory(1);
    inventory.add(KEY);
    expect(inventory.isFull).toBe(true);
    expect(inventory.add(NOTE)).toBe(false);
  });

  it('removes a held item and frees a slot', () => {
    const inventory = makeInventory(1);
    inventory.add(KEY);
    expect(inventory.remove('key')).toBe(true);
    expect(inventory.has('key')).toBe(false);
    expect(inventory.add(NOTE)).toBe(true);
  });

  it('reports the most recently added item via lastId', () => {
    const inventory = makeInventory();
    expect(inventory.lastId()).toBeNull();
    inventory.add(KEY);
    inventory.add(NOTE);
    expect(inventory.lastId()).toBe('note');
    inventory.remove('note');
    expect(inventory.lastId()).toBe('key');
  });

  it('emits inventory:changed on every mutation', () => {
    const events = new TypedEventBus<GameEventMap>();
    const handler = vi.fn();
    events.on('inventory:changed', handler);
    const inventory = new Inventory(events);

    inventory.add(KEY);
    inventory.remove('key');
    inventory.add(NOTE);

    expect(handler).toHaveBeenCalledTimes(3);
    expect(handler).toHaveBeenLastCalledWith({ items: [NOTE] });
  });

  it('round-trips through snapshot and restore in carry order', () => {
    const inventory = makeInventory();
    inventory.add(KEY);
    inventory.add(NOTE);

    const snapshot = inventory.snapshot();
    const restored = makeInventory();
    restored.restore(snapshot);

    expect(restored.list()).toEqual([KEY, NOTE]);
    expect(restored.lastId()).toBe('note');
  });
});
