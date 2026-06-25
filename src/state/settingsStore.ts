import { create } from 'zustand';

import { appConfig } from '@app/config/env';
import { AudioChannel, type ChannelVolumes } from '@systems/audio/audio.types';

interface SettingsState {
  readonly volumes: ChannelVolumes;
  readonly muted: boolean;
  readonly hapticsEnabled: boolean;
  readonly debugOverlay: boolean;
  /** Look-speed multiplier applied on top of the base look sensitivity. */
  readonly lookSensitivity: number;
  /** Invert the vertical look axis. */
  readonly invertLook: boolean;

  setVolume: (channel: AudioChannel, value: number) => void;
  toggleMuted: () => void;
  setHaptics: (enabled: boolean) => void;
  setDebugOverlay: (enabled: boolean) => void;
  setLookSensitivity: (value: number) => void;
  setInvertLook: (enabled: boolean) => void;
}

/** Bounds for the look-sensitivity multiplier. */
const LOOK_SENSITIVITY_MIN = 0.25;
const LOOK_SENSITIVITY_MAX = 3;

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
  lookSensitivity: 1,
  invertLook: false,

  setVolume: (channel, value) =>
    set((state) => ({
      volumes: { ...state.volumes, [channel]: Math.min(1, Math.max(0, value)) },
    })),
  toggleMuted: () => set((state) => ({ muted: !state.muted })),
  setHaptics: (hapticsEnabled) => set({ hapticsEnabled }),
  setDebugOverlay: (debugOverlay) => set({ debugOverlay }),
  setLookSensitivity: (value) =>
    set({
      lookSensitivity: Math.min(LOOK_SENSITIVITY_MAX, Math.max(LOOK_SENSITIVITY_MIN, value)),
    }),
  setInvertLook: (invertLook) => set({ invertLook }),
}));
