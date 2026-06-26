import { ATMOSPHERE } from '@shared/constants/atmosphere';

import type { AmbientEventKind } from './atmosphere.types';

const AUDIO = ATMOSPHERE.AUDIO;

/** Continuous voices built once and modulated; one-shots are created per event. */
interface ContinuousVoices {
  readonly master: GainNode;
  readonly bus: GainNode;
  readonly windLow: GainNode;
  readonly windHigh: GainNode;
  readonly insects: GainNode;
  readonly noise: AudioBuffer;
}

/**
 * Procedural night ambience — synthesised in the Web Audio graph, so it needs no
 * audio assets and is entirely **data-driven** from {@link ATMOSPHERE.AUDIO}.
 * Continuous beds (two wind layers, an insect shimmer, a power-line hum) are
 * built once and modulated; sparse one-shots (a distant dog, a metal creak, an
 * electrical buzz, thunder) are short-lived voices. Degrades to a silent no-op
 * where Web Audio is unavailable, and self-unlocks on the first user gesture.
 */
export class ProceduralAmbience {
  private readonly context: AudioContext | null;
  private readonly voices: ContinuousVoices | null;
  private volume = 0;
  private muted = false;
  private active = true;
  private unlockHandler: (() => void) | null = null;

  constructor() {
    const context = createContext();
    this.context = context;
    this.voices = context ? this.build(context) : null;
    if (context) this.installUnlock(context);
  }

  /** Resume the audio clock (call from a user gesture / on level entry). */
  public unlock(): void {
    const context = this.context;
    if (context && context.state === 'suspended') void context.resume();
  }

  /** Wind strength 0..1 drives the two wind layers' gain. */
  public setWindStrength(strength: number): void {
    const v = this.voices;
    if (!v || !this.context) return;
    const t = this.context.currentTime;
    v.windLow.gain.setTargetAtTime(AUDIO.WIND_LOW * (0.3 + 0.7 * strength), t, 0.4);
    v.windHigh.gain.setTargetAtTime(AUDIO.WIND_HIGH * strength * strength, t, 0.4);
  }

  /** Bus gain 0..1 — the silence/quiet duck. */
  public setDuck(level: number): void {
    const v = this.voices;
    if (!v || !this.context) return;
    v.bus.gain.setTargetAtTime(level, this.context.currentTime, AUDIO.DUCK_GLIDE);
  }

  public trigger(kind: AmbientEventKind): void {
    switch (kind) {
      case 'dog':
        this.bark();
        return;
      case 'creak':
        this.creak();
        return;
      case 'buzz':
        this.buzz();
        return;
      case 'insectSwell':
        this.insectSwell();
        return;
    }
  }

  public thunder(): void {
    const ctx = this.context;
    const v = this.voices;
    if (!ctx || !v) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = v.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(AUDIO.THUNDER, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);
    src.connect(filter).connect(gain).connect(v.bus);
    this.playFor(src, gain, now, 3.6);
  }

  public setVolume(volume: number): void {
    this.volume = volume;
    this.applyMaster();
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMaster();
  }

  /** Suspend/resume the whole graph (pause, exit-to-menu, tab hidden). */
  public setActive(active: boolean): void {
    if (active === this.active) return;
    this.active = active;
    const ctx = this.context;
    if (!ctx) return;
    if (active) void ctx.resume();
    else void ctx.suspend();
  }

  public dispose(): void {
    if (this.unlockHandler) {
      removeGestureUnlock(this.unlockHandler);
      this.unlockHandler = null;
    }
    const ctx = this.context;
    if (ctx) void ctx.close();
  }

  // -- Graph construction ----------------------------------------------------

  private build(ctx: AudioContext): ContinuousVoices {
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(master);

    const noise = makeNoise(ctx);
    const source = ctx.createBufferSource();
    source.buffer = noise;
    source.loop = true;

    const windLow = filteredLayer(ctx, source, bus, 'lowpass', 320, 0.7, AUDIO.WIND_LOW * 0.3);
    const windHigh = filteredLayer(ctx, source, bus, 'bandpass', 1200, 1.4, 0);
    const insects = filteredLayer(ctx, source, bus, 'highpass', 4200, 6, AUDIO.INSECTS);
    // A slow tremolo gives the insect bed life.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 7.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = AUDIO.INSECTS * 0.5;
    lfo.connect(lfoGain).connect(insects.gain);
    lfo.start();

    // Power-line hum: a 60 Hz fundamental plus its octave.
    this.hum(ctx, bus, 60);
    this.hum(ctx, bus, 120, 0.5);

    source.start();
    return { master, bus, windLow, windHigh, insects, noise };
  }

  private hum(ctx: AudioContext, bus: GainNode, frequency: number, scale = 1): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const gain = ctx.createGain();
    gain.gain.value = AUDIO.HUM * scale;
    osc.connect(gain).connect(bus);
    osc.start();
  }

  // -- One-shots -------------------------------------------------------------

  private bark(): void {
    const ctx = this.context;
    const v = this.voices;
    if (!ctx || !v) return;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.connect(v.bus);
    // Two short, distant "woofs".
    for (let i = 0; i < 2; i += 1) {
      const at = ctx.currentTime + i * 0.34;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, at);
      osc.frequency.exponentialRampToValueAtTime(180, at + 0.16);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(AUDIO.DOG, at + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
      osc.connect(gain).connect(filter);
      this.playFor(osc, gain, at, 0.24);
    }
  }

  private creak(): void {
    const ctx = this.context;
    const v = this.voices;
    if (!ctx || !v) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = v.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 14;
    filter.frequency.setValueAtTime(820, now);
    filter.frequency.exponentialRampToValueAtTime(430, now + 0.7);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(AUDIO.CREAK, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    src.connect(filter).connect(gain).connect(v.bus);
    this.playFor(src, gain, now, 0.9);
  }

  private buzz(): void {
    const ctx = this.context;
    const v = this.voices;
    if (!ctx || !v) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 118;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(AUDIO.BUZZ, now + 0.04);
    gain.gain.setValueAtTime(AUDIO.BUZZ, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
    osc.connect(filter).connect(gain).connect(v.bus);
    this.playFor(osc, gain, now, 0.8);
  }

  private insectSwell(): void {
    const ctx = this.context;
    const v = this.voices;
    if (!ctx || !v) return;
    const now = ctx.currentTime;
    v.insects.gain.cancelScheduledValues(now);
    v.insects.gain.setTargetAtTime(AUDIO.INSECTS * 2.4, now, 0.6);
    v.insects.gain.setTargetAtTime(AUDIO.INSECTS, now + 2.2, 1.2);
  }

  // -- Helpers ---------------------------------------------------------------

  private applyMaster(): void {
    const v = this.voices;
    if (!v || !this.context) return;
    const target = this.muted ? 0 : this.volume;
    v.master.gain.setTargetAtTime(target, this.context.currentTime, 0.2);
  }

  /** Start a transient voice and tear it down when it finishes. */
  private playFor(
    source: AudioScheduledSourceNode,
    gain: GainNode,
    at: number,
    duration: number,
  ): void {
    source.start(at);
    source.stop(at + duration);
    source.onended = (): void => {
      source.disconnect();
      gain.disconnect();
    };
  }

  private installUnlock(context: AudioContext): void {
    const handler = (): void => {
      if (context.state === 'suspended') void context.resume();
    };
    this.unlockHandler = handler;
    addGestureUnlock(handler);
  }
}

// -- Module helpers ----------------------------------------------------------

const GESTURE_EVENTS: readonly string[] = ['pointerdown', 'touchstart', 'keydown'];

const createContext = (): AudioContext | null => {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null;
  try {
    return new AudioContext();
  } catch {
    return null;
  }
};

const makeNoise = (ctx: AudioContext): AudioBuffer => {
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
};

const filteredLayer = (
  ctx: AudioContext,
  source: AudioNode,
  destination: AudioNode,
  type: BiquadFilterType,
  frequency: number,
  q: number,
  gainValue: number,
): GainNode => {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = q;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  source.connect(filter).connect(gain).connect(destination);
  return gain;
};

const addGestureUnlock = (handler: () => void): void => {
  for (const event of GESTURE_EVENTS) {
    window.addEventListener(event, handler, { once: true, passive: true });
  }
};

const removeGestureUnlock = (handler: () => void): void => {
  for (const event of GESTURE_EVENTS) window.removeEventListener(event, handler);
};
