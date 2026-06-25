import type { AudioTrackId } from '@shared/types/branded';

/** Mixing channels. Each has an independent volume folded into the master. */
export const AudioChannel = {
  Master: 'master',
  Music: 'music',
  Sfx: 'sfx',
  Ambience: 'ambience',
} as const;

export type AudioChannel = (typeof AudioChannel)[keyof typeof AudioChannel];

/** Declarative description of a playable track. */
export interface TrackDefinition {
  readonly id: AudioTrackId;
  readonly src: string;
  readonly channel: Exclude<AudioChannel, 'master'>;
  readonly loop?: boolean;
  /** Per-track gain (0..1) applied on top of the channel volume. */
  readonly volume?: number;
}

export type ChannelVolumes = Record<AudioChannel, number>;
