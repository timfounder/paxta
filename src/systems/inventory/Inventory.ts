import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';

import type { InventoryItem, InventoryPort, InventorySnapshot } from './inventory.types';

/** Default carry capacity. The foundation is intentionally small. */
const DEFAULT_CAPACITY = 6;

/**
 * The player's carried items — a pure, framework-agnostic store. It enforces
 * capacity and uniqueness, preserves carry order (a `Map` iterates by insertion),
 * and announces every change on the bus so the UI and persistence layers stay in
 * sync without reaching into it. It holds no Babylon or React references, so it
 * is trivially testable and reusable by any future mechanic.
 */
export class Inventory implements InventoryPort {
  private readonly items = new Map<string, InventoryItem>();

  constructor(
    private readonly events: EventBus<GameEventMap>,
    private readonly capacity: number = DEFAULT_CAPACITY,
  ) {}

  public get isFull(): boolean {
    return this.items.size >= this.capacity;
  }

  public get size(): number {
    return this.items.size;
  }

  public add(item: InventoryItem): boolean {
    if (this.isFull || this.items.has(item.id)) return false;
    this.items.set(item.id, item);
    this.emitChanged();
    return true;
  }

  public remove(id: string): boolean {
    if (!this.items.delete(id)) return false;
    this.emitChanged();
    return true;
  }

  public has(id: string): boolean {
    return this.items.has(id);
  }

  public list(): readonly InventoryItem[] {
    return [...this.items.values()];
  }

  /** The id of the most recently added item still held, or null when empty. */
  public lastId(): string | null {
    let last: string | null = null;
    for (const id of this.items.keys()) last = id;
    return last;
  }

  public snapshot(): InventorySnapshot {
    return { items: this.list() };
  }

  /** Replace all contents from a snapshot (used on load). Emits once. */
  public restore(snapshot: InventorySnapshot): void {
    this.items.clear();
    for (const item of snapshot.items) {
      if (this.items.size >= this.capacity) break;
      this.items.set(item.id, item);
    }
    this.emitChanged();
  }

  private emitChanged(): void {
    this.events.emit('inventory:changed', { items: this.list() });
  }
}
