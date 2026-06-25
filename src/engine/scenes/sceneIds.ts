import { asBrand, type SceneId } from '@shared/types/branded';

/** The canonical set of scenes shipped with the game. */
export const SceneIds = {
  Hallway: asBrand<SceneId>('hallway'),
} as const;

export type SceneKey = keyof typeof SceneIds;
