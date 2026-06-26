import { create } from 'zustand';

import type { NightStateView, NightTimelineEntryView } from '@systems/night/night.types';

interface NightDebugState {
  readonly state: NightStateView | null;
  readonly timeline: readonly NightTimelineEntryView[];
  set: (state: NightStateView, timeline: readonly NightTimelineEntryView[]) => void;
  reset: () => void;
}

/**
 * A read-only mirror of the {@link NightDirector}'s state and timeline for the
 * developer panel. The director (single writer) pushes a fresh snapshot on every
 * phase change / event / objective; the panel renders this and dispatches
 * skip/trigger commands back through {@link Game}.
 */
export const useNightDebugStore = create<NightDebugState>((set) => ({
  state: null,
  timeline: [],
  set: (state, timeline) => set({ state, timeline }),
  reset: () => set({ state: null, timeline: [] }),
}));
