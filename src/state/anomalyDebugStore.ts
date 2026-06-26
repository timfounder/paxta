import { create } from 'zustand';

import type { AnomalyDebugEntry } from '@systems/anomaly/AnomalyManager';

interface AnomalyDebugState {
  readonly entries: readonly AnomalyDebugEntry[];
  setEntries: (entries: readonly AnomalyDebugEntry[]) => void;
  reset: () => void;
}

/**
 * A read-only mirror of the {@link AnomalyManager}'s debug view for the developer
 * overlay. The manager (the single writer) pushes a fresh snapshot on every
 * enable / activate / resolve; the overlay only renders this projection and
 * dispatches commands back through {@link Game}.
 */
export const useAnomalyDebugStore = create<AnomalyDebugState>((set) => ({
  entries: [],
  setEntries: (entries) => set({ entries }),
  reset: () => set({ entries: [] }),
}));
