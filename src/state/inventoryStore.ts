import { create } from 'zustand';

/** A carried item as the UI sees it (plain, serialisable). */
export interface InventoryEntry {
  readonly id: string;
  readonly name: string;
}

interface InventoryUiState {
  readonly items: readonly InventoryEntry[];

  setItems: (items: readonly InventoryEntry[]) => void;
  reset: () => void;
}

/**
 * A read-only mirror of the {@link Inventory} system for React. The simulation
 * remains the single writer — {@link Game} forwards `inventory:changed` here — so
 * the UI never reaches into gameplay state, it only renders this projection.
 */
export const useInventoryStore = create<InventoryUiState>((set) => ({
  items: [],

  setItems: (items) => set({ items }),
  reset: () => set({ items: [] }),
}));
