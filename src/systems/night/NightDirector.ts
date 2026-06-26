import { NIGHT } from '@shared/constants/night';
import { damp } from '@shared/utils/math';

import { NightSequenceRunner } from './NightSequence';
import { NightState } from './NightState';
import { NightTimeline } from './NightTimeline';
import type {
  NightContext,
  NightDefinition,
  NightStateView,
  NightTimelineEntryView,
} from './night.types';

export interface NightDirectorOptions {
  /** Fired whenever debug-visible state changes (phase, event, objective). */
  readonly onChange?: () => void;
}

/**
 * The data-driven Night Director: it orchestrates a whole night's pacing,
 * tension and progression from a {@link NightDefinition} — advancing the six
 * phases on their configured durations, easing tension into the atmosphere,
 * enabling each phase's anomaly set, and driving timeline / random / sequenced
 * events through the {@link NightTimeline}. It contains **no night content and no
 * hardcoded values** — every knob is data — so it supports unlimited future
 * nights, and it only *coordinates* the existing systems through ports.
 */
export class NightDirector {
  private readonly state: NightState;
  private readonly timeline: NightTimeline;
  private readonly sequences: NightSequenceRunner;
  private started = false;

  constructor(
    definition: NightDefinition,
    private readonly context: NightContext,
    private readonly options: NightDirectorOptions = {},
  ) {
    this.state = new NightState(definition);
    this.timeline = new NightTimeline(definition.events);
    this.sequences = new NightSequenceRunner(definition.sequences ?? []);
  }

  public start(): void {
    if (this.started) return;
    this.started = true;
    this.enterPhase(0);
    for (const id of this.sequences.autoStartIds()) this.sequences.start(id);
  }

  public update(deltaSeconds: number): void {
    if (!this.started || this.state.complete) return;

    this.state.nightElapsed += deltaSeconds;
    this.state.phaseElapsed += deltaSeconds;

    this.state.tension = damp(
      this.state.tension,
      this.state.targetTension,
      NIGHT.TENSION_RATE,
      deltaSeconds,
    );
    this.context.atmosphere.setTension(this.state.tension);

    if (this.state.phaseDuration > 0 && this.state.phaseElapsed >= this.state.phaseDuration) {
      this.advancePhase();
    }

    this.timeline.update(deltaSeconds, this.context, this.state, this.handleFire);
    this.drainPendingSequences();
    this.sequences.update(deltaSeconds, this.fireStep);
  }

  // -- Debug API -------------------------------------------------------------

  public skipPhase(): void {
    if (!this.started || this.state.complete) return;
    this.advancePhase();
  }

  public triggerEvent(id: string): void {
    this.timeline.fireById(id, this.context, this.state, this.handleFire);
  }

  public getStateView(): NightStateView {
    return this.state.view(this.context.anomaly.activeCount());
  }

  public getTimelineView(): readonly NightTimelineEntryView[] {
    return this.timeline.timelineView(this.state);
  }

  public dispose(): void {
    this.sequences.clear();
    this.context.anomaly.setEnabledSet([]);
    this.context.atmosphere.setTension(0);
  }

  // -- Internals -------------------------------------------------------------

  private readonly handleFire = (_id: string): void => {
    this.options.onChange?.();
  };

  private readonly fireStep = (eventId: string): void => {
    this.timeline.fireById(eventId, this.context, this.state, this.handleFire);
  };

  private drainPendingSequences(): void {
    if (this.state.pendingSequences.size === 0) return;
    for (const id of this.state.pendingSequences) this.sequences.start(id);
    this.state.pendingSequences.clear();
  }

  private advancePhase(): void {
    if (this.state.phaseIndex + 1 >= this.state.phaseCount) {
      this.completeNight();
      return;
    }
    this.enterPhase(this.state.phaseIndex + 1);
  }

  private enterPhase(index: number): void {
    this.state.phaseIndex = index;
    this.state.phaseElapsed = 0;
    const phase = this.state.currentPhase;
    if (phase) {
      this.state.targetTension = phase.tension;
      this.context.anomaly.setEnabledSet(phase.anomalies ?? []);
    }
    this.options.onChange?.();
  }

  private completeNight(): void {
    this.state.complete = true;
    this.context.anomaly.setEnabledSet([]);
    this.options.onChange?.();
  }
}
