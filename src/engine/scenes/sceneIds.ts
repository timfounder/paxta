import { asBrand, type SceneId } from '@shared/types/branded';

/** The canonical set of scenes shipped with the game. */
export const SceneIds = {
  /** The PAXTA cotton compound — the primary explorable location. */
  Compound: asBrand<SceneId>('compound'),
  /** Early test corridor (kept for reference; not the default level). */
  Hallway: asBrand<SceneId>('hallway'),
} as const;

export type SceneKey = keyof typeof SceneIds;
