import { create } from 'zustand';

import type { MissionView } from '@systems/mission/mission.types';

export interface MissionNotice {
  readonly kind: 'started' | 'completed' | 'failed';
  readonly title: string;
  /** Increments per notice so the UI can re-trigger its animation. */
  readonly seq: number;
}

interface MissionUiState {
  readonly missions: readonly MissionView[];
  readonly notice: MissionNotice | null;
  setMissions: (missions: readonly MissionView[]) => void;
  pushNotice: (kind: MissionNotice['kind'], title: string) => void;
  clearNotice: () => void;
  reset: () => void;
}

/**
 * A read-only mirror of the {@link MissionManager}'s views for the mission widget
 * / objective tracker, plus the latest notice that drives the start/complete
 * notifications and the completion animation. The simulation stays the single
 * writer; the UI only renders this projection.
 */
export const useMissionStore = create<MissionUiState>((set) => ({
  missions: [],
  notice: null,
  setMissions: (missions) => set({ missions }),
  pushNotice: (kind, title) =>
    set((state) => ({ notice: { kind, title, seq: (state.notice?.seq ?? 0) + 1 } })),
  clearNotice: () => set({ notice: null }),
  reset: () => set({ missions: [], notice: null }),
}));
