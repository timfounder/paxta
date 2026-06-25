import { create } from 'zustand';

import { gameEvents } from '@core/events/gameEvents';
import { PLAYER } from '@shared/constants/game';
import type { SceneId } from '@shared/types/branded';
import { clamp } from '@shared/utils/math';

/** High-level lifecycle of a play session. */
export const GamePhase = {
  Boot: 'boot',
  Menu: 'menu',
  Playing: 'playing',
  Paused: 'paused',
  GameOver: 'game-over',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

interface GameState {
  readonly phase: GamePhase;
  readonly sanity: number;
  readonly score: number;
  readonly hits: number;
  readonly misses: number;
  readonly currentSceneId: SceneId | null;

  setPhase: (phase: GamePhase) => void;
  setScene: (sceneId: SceneId) => void;
  drainSanity: (amount: number) => void;
  recoverSanity: (amount: number) => void;
  recordHit: () => void;
  recordMiss: () => void;
  reset: () => void;
}

const INITIAL = {
  phase: GamePhase.Boot,
  sanity: PLAYER.SANITY_MAX,
  score: 0,
  hits: 0,
  misses: 0,
  currentSceneId: null,
} satisfies Omit<
  GameState,
  'setPhase' | 'setScene' | 'drainSanity' | 'recoverSanity' | 'recordHit' | 'recordMiss' | 'reset'
>;

/**
 * Canonical game-progression state. It is the only writer of sanity/score and
 * the bridge between systems (which call its actions) and React (which selects
 * from it). Cross-cutting facts are mirrored onto the event bus.
 */
export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL,

  setPhase: (phase) => set({ phase }),

  setScene: (currentSceneId) => set({ currentSceneId }),

  drainSanity: (amount) => {
    const next = clamp(get().sanity - Math.abs(amount), PLAYER.SANITY_MIN, PLAYER.SANITY_MAX);
    const delta = next - get().sanity;
    if (delta === 0) return;
    set({ sanity: next });
    gameEvents.emit('player:sanity-changed', { value: next, delta });
    if (next <= PLAYER.SANITY_MIN && get().phase === GamePhase.Playing) {
      set({ phase: GamePhase.GameOver });
      gameEvents.emit('player:died', { cause: 'sanity-depleted' });
    }
  },

  recoverSanity: (amount) => {
    const next = clamp(get().sanity + Math.abs(amount), PLAYER.SANITY_MIN, PLAYER.SANITY_MAX);
    const delta = next - get().sanity;
    if (delta === 0) return;
    set({ sanity: next });
    gameEvents.emit('player:sanity-changed', { value: next, delta });
  },

  recordHit: () => set((state) => ({ hits: state.hits + 1, score: state.score + 100 })),

  recordMiss: () =>
    set((state) => ({ misses: state.misses + 1, score: Math.max(0, state.score - 50) })),

  reset: () => set({ ...INITIAL, phase: GamePhase.Menu }),
}));
