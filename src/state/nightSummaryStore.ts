import { create } from 'zustand';

/** The gameplay metrics collected over one night, shown on the complete screen. */
export interface NightSummary {
  readonly completionMs: number;
  readonly objectivesCompleted: number;
  readonly objectivesTotal: number;
  readonly anomalyTriggers: number;
  readonly interactionCount: number;
}

interface NightSummaryState {
  readonly summary: NightSummary | null;
  setSummary: (summary: NightSummary) => void;
  reset: () => void;
}

/**
 * Holds the latest night's metrics for the Night Complete screen. The simulation
 * (the scene) is the single writer via `Game`; the screen only renders it.
 */
export const useNightSummaryStore = create<NightSummaryState>((set) => ({
  summary: null,
  setSummary: (summary) => set({ summary }),
  reset: () => set({ summary: null }),
}));
