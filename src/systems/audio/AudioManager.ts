import { GAME } from '@shared/constants/game';
import type { AudioTrackId } from '@shared/types/branded';
import { clamp } from '@shared/utils/math';
import { logger } from '@shared/utils/logger';

import { AudioChannel, type ChannelVolumes, type TrackDefinition } from './audio.types';

interface LoadedTrack {
  readonly definition: TrackDefinition;
  readonly element: HTMLAudioElement;
}

const DEFAULT_VOLUMES: ChannelVolumes = {
  [AudioChannel.Master]: 1,
  [AudioChannel.Music]: 0.7,
  [AudioChannel.Sfx]: 0.9,
  [AudioChannel.Ambience]: 0.6,
};

/**
 * Central audio authority. It owns track registration, per-channel mixing and
 * mute, built on `HTMLAudioElement` for broad mobile-webview support. Mobile
 * browsers block playback until a user gesture, so {@link unlock} must be called
 * from the first interaction before ambience/music will start.
 */
export class AudioManager {
  private readonly log = logger.child('audio');
  private readonly tracks = new Map<AudioTrackId, LoadedTrack>();
  private readonly volumes: ChannelVolumes = { ...DEFAULT_VOLUMES };
  private muted = false;
  private unlocked = false;

  public register(definition: TrackDefinition): void {
    if (this.tracks.has(definition.id)) return;
    const element = new Audio();
    element.src = definition.src;
    element.preload = 'auto';
    element.loop = definition.loop ?? false;
    element.crossOrigin = 'anonymous';
    this.tracks.set(definition.id, { definition, element });
    this.applyVolume(definition.id);
  }

  /** Call once from a user gesture to satisfy mobile autoplay policies. */
  public unlock(): void {
    if (this.unlocked) return;
    this.unlocked = true;
    this.log.debug('Audio unlocked by user gesture');
  }

  public play(id: AudioTrackId): void {
    const track = this.tracks.get(id);
    if (!track) {
      this.log.warn(`Cannot play unknown track "${id}"`);
      return;
    }
    this.applyVolume(id);
    track.element.currentTime = 0;
    void track.element.play().catch((error: unknown) => {
      this.log.warn(`Playback blocked for "${id}"`, error);
    });
  }

  public stop(id: AudioTrackId): void {
    const track = this.tracks.get(id);
    if (!track) return;
    track.element.pause();
    track.element.currentTime = 0;
  }

  public stopAll(): void {
    for (const id of this.tracks.keys()) this.stop(id);
  }

  public setChannelVolume(channel: AudioChannel, value: number): void {
    this.volumes[channel] = clamp(value, 0, 1);
    this.refreshVolumes();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.refreshVolumes();
  }

  public getChannelVolume(channel: AudioChannel): number {
    return this.volumes[channel];
  }

  public dispose(): void {
    this.stopAll();
    for (const track of this.tracks.values()) {
      track.element.src = '';
    }
    this.tracks.clear();
  }

  private refreshVolumes(): void {
    for (const id of this.tracks.keys()) this.applyVolume(id);
  }

  private applyVolume(id: AudioTrackId): void {
    const track = this.tracks.get(id);
    if (!track) return;
    const channelVolume = this.volumes[track.definition.channel];
    const trackVolume = track.definition.volume ?? 1;
    const master = this.volumes[AudioChannel.Master];
    track.element.volume = this.muted ? 0 : clamp(master * channelVolume * trackVolume, 0, 1);
  }
}

/** Stable, namespaced storage key for persisted audio preferences. */
export const AUDIO_SETTINGS_KEY = `${GAME.STORAGE_PREFIX}:audio`;
