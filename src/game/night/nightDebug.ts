import type { NightStateView, NightTimelineEntryView } from '@systems/night/night.types';

export type { NightStateView, NightTimelineEntryView };

/**
 * The narrow surface a scene exposes so the Night Director developer panel can
 * skip phases, force events, and read the live state / timeline. Game-layer
 * (the scene and `Game` are the only users) to keep the engine anomaly-free.
 */
export interface NightDebuggable {
  skipNightPhase(): void;
  triggerNightEvent(id: string): void;
  getNightState(): NightStateView | null;
  getNightTimeline(): readonly NightTimelineEntryView[];
}

export const isNightDebuggable = (value: unknown): value is NightDebuggable => {
  const candidate = value as Partial<Record<keyof NightDebuggable, unknown>> | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.skipNightPhase === 'function' &&
    typeof candidate.triggerNightEvent === 'function' &&
    typeof candidate.getNightState === 'function' &&
    typeof candidate.getNightTimeline === 'function'
  );
};
