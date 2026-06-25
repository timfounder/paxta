/**
 * A single carried item. Plain, serialisable data (id + display name) so it can
 * cross the event bus and round-trip through a save without any live reference.
 */
export interface InventoryItem {
  readonly id: string;
  readonly name: string;
}

/**
 * The narrow surface an interactable needs to put things into / take things out
 * of the player's inventory. Concrete pickups depend on this port, not on the
 * {@link Inventory} class, so the storage strategy can change freely.
 */
export interface InventoryPort {
  /** Add an item. Returns false if it is already held or the bag is full. */
  add(item: InventoryItem): boolean;
  /** Remove the item with this id. Returns false if it was not held. */
  remove(id: string): boolean;
  /** Whether an item with this id is currently held. */
  has(id: string): boolean;
  /** True when no further items can be added. */
  readonly isFull: boolean;
}

/** A serialisable snapshot of the inventory's contents, in carry order. */
export interface InventorySnapshot {
  readonly items: readonly InventoryItem[];
}
