import { create } from 'zustand';

import { appConfig } from '@app/config/env';
import { AudioChannel, type ChannelVolumes } from '@systems/audio/audio.types';

interface SettingsState {
  readonly volumes: ChannelVolumes;
  readonly muted: boolean;
  readonly hapticsEnabled: boolean;
  readonly debugOverlay: boolean;

  setVolume: (channel: AudioChannel, value: number) => void;
  toggleMuted: () => void;
  setHaptics: (enabled: boolean) => void;
  setDebugOverlay: (enabled: boolean) => void;
}

const DEFAULT_VOLUMES: ChannelVolumes = {
  [AudioChannel.Master]: 1,
  [AudioChannel.Music]: 0.7,
  [AudioChannel.Sfx]: 0.9,
  [AudioChannel.Ambience]: 0.6,
};

/**
 * Player-facing preferences. Kept separate from {@link useGameStore} so that
 * settings survive across runs and resets, and so the {@link AudioManager} can
 * subscribe to volume changes without touching gameplay state.
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  volumes: { ...DEFAULT_VOLUMES },
  muted: false,
  hapticsEnabled: true,
  debugOverlay: appConfig.debug,

  setVolume: (channel, value) =>
    set((state) => ({
      volumes: { ...state.volumes, [channel]: Math.min(1, Math.max(0, value)) },
    })),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
  setDebugOverlay: (debugOverlay) => set({ debugOverlay }),
}));
