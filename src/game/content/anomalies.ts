import { vec3 } from '@shared/types/spatial';
import { ScheduleMode, type AnomalyDefinition } from '@systems/anomaly/anomalyEngine.types';

/**
 * Example anomaly definitions for the compound — **pure data**, exercising every
 * condition / effect / scheduling feature so the framework (and the developer
 * overlay) has something to drive. They are environmental only — no monster, no
 * scripted scare — and ship **disabled by default**: this milestone delivers the
 * engine, not gameplay. Enable or fire them from the anomaly debug overlay.
 *
 * Adding an anomaly is editing this list. None of it touches the engine.
 */
export const COMPOUND_ANOMALIES: readonly AnomalyDefinition[] = [
  {
    id: 'fog-roll',
    description: 'A cold bank of fog rolls in and the wind picks up.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.2, cooldownSeconds: 30, weight: 2 },
    effects: [
      { type: 'fog', params: { amount: 0.01 } },
      { type: 'wind', params: { amount: 0.35 } },
    ],
    durationSeconds: 14,
  },
  {
    id: 'distant-flash',
    description: 'A soundless flash on the horizon, then a far rumble.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.15, cooldownSeconds: 40 },
    effects: [{ type: 'lightning' }, { type: 'playSound', params: { cue: 'creak' } }],
    durationSeconds: 1,
  },
  {
    id: 'generator-shudder',
    description: 'While the generator runs, the lights dim and something buzzes.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.25, cooldownSeconds: 25 },
    conditions: [
      { type: 'interactable', params: { id: 'generator', field: 'active', equals: true } },
    ],
    effects: [
      { type: 'light', params: { amount: -0.18 } },
      { type: 'playSound', params: { cue: 'buzz' } },
    ],
    durationSeconds: 6,
  },
  {
    id: 'warehouse-whisper',
    description: 'Near the warehouse door, a whisper and a dragged-metal creak.',
    enabledByDefault: false,
    trigger: { type: 'proximity', params: { center: vec3(-9, 1.7, 6), radius: 7 } },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.4, cooldownSeconds: 20 },
    effects: [
      { type: 'playSound', params: { cue: 'creak' } },
      { type: 'dialogue', params: { line: 'Did you hear that?' } },
    ],
    durationSeconds: 4,
  },
  {
    id: 'displaced-tool',
    description: 'The pump handle is not where you left it.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Once, probability: 0.3 },
    effects: [
      {
        type: 'moveObject',
        params: { id: 'pump-handle', to: vec3(-12, 1.95, -15), duration: 1.5 },
      },
    ],
    durationSeconds: 20,
  },
  {
    id: 'phantom-crate',
    description: 'Something is standing in the cotton that was not there before.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.2, cooldownSeconds: 45, weight: 1 },
    conditions: [{ type: 'time', params: { min: 0.3 } }],
    effects: [{ type: 'spawnObject', params: { prototype: 'marker', at: vec3(18, 0.4, 4) } }],
    durationSeconds: 12,
  },
  {
    id: 'blackout',
    description: 'A creeping dark — then the dark deepens further.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: {
      mode: ScheduleMode.Repeatable,
      probability: 0.1,
      cooldownSeconds: 60,
      chainTo: ['blackout-after'],
    },
    effects: [{ type: 'atmosphere', params: { moon: -0.2, fog: 0.006 } }],
    durationSeconds: 8,
  },
  {
    id: 'blackout-after',
    description: 'The aftermath of the dark: a single distant bark. (Chained.)',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, dependsOn: ['blackout'] },
    effects: [{ type: 'playSound', params: { cue: 'dog' } }],
    durationSeconds: 1,
  },
];
