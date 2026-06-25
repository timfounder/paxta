import { create } from 'zustand';

/** The single screen currently presented to the player. */
export const Screen = {
  Loading: 'loading',
  Menu: 'menu',
  Game: 'game',
  Settings: 'settings',
  GameOver: 'game-over',
} as const;

export type Screen = (typeof Screen)[keyof typeof Screen];

/** Transient overlays layered above the active screen. */
export const Modal = {
  Pause: 'pause',
  Quests: 'quests',
} as const;

export type Modal = (typeof Modal)[keyof typeof Modal];

interface UiState {
  readonly screen: Screen;
  readonly modal: Modal | null;
  readonly hudVisible: boolean;
  readonly toast: string | null;
  /** Prompt for the interactable currently under the crosshair, or null. */
  readonly interactionPrompt: string | null;

  setScreen: (screen: Screen) => void;
  openModal: (modal: Modal) => void;
  closeModal: () => void;
  setHudVisible: (visible: boolean) => void;
  showToast: (message: string) => void;
  clearToast: () => void;
  setInteractionPrompt: (prompt: string | null) => void;
}

/**
 * Pure presentation state — what the player sees and which overlays are open.
 * It deliberately holds no gameplay data so navigation logic never reaches into
 * the simulation.
 */
export const useUiStore = create<UiState>((set) => ({
  screen: Screen.Loading,
  modal: null,
  hudVisible: false,
  toast: null,
  interactionPrompt: null,

  setScreen: (screen) => set({ screen }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  setHudVisible: (hudVisible) => set({ hudVisible }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  setInteractionPrompt: (interactionPrompt) => set({ interactionPrompt }),
}));
