import type { PlayerVitals, ScoreBoard } from '@systems/anomaly/anomaly.types';
import type { AudioManager } from '@systems/audio/AudioManager';
import type { QuestSystem } from '@systems/quest/QuestSystem';

/**
 * The bundle of high-level game systems handed to scenes so they can compose
 * gameplay (start anomalies, play audio, advance quests) without each scene
 * reaching into the composition root or global singletons.
 */
export interface GameServices {
  readonly audio: AudioManager;
  readonly quests: QuestSystem;
  readonly vitals: PlayerVitals;
  readonly score: ScoreBoard;
}
