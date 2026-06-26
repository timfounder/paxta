import { vec3 } from '@shared/types/spatial';
import { ScheduleMode, type AnomalyDefinition } from '@systems/anomaly/anomalyEngine.types';
import { NightPhaseKind, type NightDefinition } from '@systems/night/night.types';
import type { MissionDefinition } from '@systems/mission/mission.types';

/**
 * **Night One — the first playable night.** This is *content*, not new systems:
 * it composes the Anomaly Engine, Night Director and Mission Framework into a
 * complete ~12–15 minute shift. The player arrives at the cotton compound, powers
 * the site, checks the pump, locks the warehouse, finds the missing fuel can and
 * returns to the guard house — then the night ends. Atmosphere only: a handful of
 * **subtle** anomalies that make the player *wonder* whether anything changed.
 * No monster, no chase, no jump scare.
 */

// -- The subtle anomalies (3–5, environmental only) --------------------------

export const NIGHT_ONE_ANOMALIES: readonly AnomalyDefinition[] = [
  {
    id: 'no1-flicker',
    description: 'The lights dim for a moment — the generator, surely.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.16, cooldownSeconds: 70 },
    effects: [{ type: 'light', params: { amount: -0.16 } }],
    durationSeconds: 1.4,
  },
  {
    id: 'no1-wind-stop',
    description: 'The wind drops to nothing. Then, after a while, it returns.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.14, cooldownSeconds: 90 },
    effects: [{ type: 'wind', params: { amount: -0.5 } }],
    durationSeconds: 6,
  },
  {
    id: 'no1-tool-move',
    description: 'The pump handle is not quite where you left it.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Once, probability: 0.25 },
    effects: [
      {
        type: 'moveObject',
        params: { id: 'pump-handle', to: vec3(-12, 1.95, -15.4), duration: 1.4 },
      },
    ],
    durationSeconds: 600,
  },
  {
    id: 'no1-metallic',
    description: 'A distant metallic sound from somewhere across the field.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.2, cooldownSeconds: 55 },
    effects: [{ type: 'playSound', params: { cue: 'creak' } }],
    durationSeconds: 1,
  },
  {
    id: 'no1-fog',
    description: 'The fog thickens a little, and the air goes still.',
    enabledByDefault: false,
    trigger: { type: 'scheduled' },
    schedule: { mode: ScheduleMode.Repeatable, probability: 0.12, cooldownSeconds: 100 },
    effects: [{ type: 'atmosphere', params: { fog: 0.005, wind: -0.15 } }],
    durationSeconds: 14,
  },
];

// -- The night's pacing (atmosphere only; the mission drives the ending) ------

export const NIGHT_ONE_NIGHT: NightDefinition = {
  id: 'night-one',
  phases: [
    { id: NightPhaseKind.Preparation, durationSeconds: 120, tension: 0.06, anomalies: [] },
    { id: NightPhaseKind.Calm, durationSeconds: 200, tension: 0.18, anomalies: ['no1-metallic'] },
    {
      id: NightPhaseKind.Suspicion,
      durationSeconds: 200,
      tension: 0.34,
      anomalies: ['no1-metallic', 'no1-flicker', 'no1-tool-move'],
    },
    {
      id: NightPhaseKind.Escalation,
      durationSeconds: 180,
      tension: 0.5,
      anomalies: ['no1-flicker', 'no1-wind-stop', 'no1-metallic'],
    },
    {
      id: NightPhaseKind.Peak,
      durationSeconds: 100,
      tension: 0.62,
      anomalies: ['no1-wind-stop', 'no1-fog', 'no1-metallic'],
    },
    { id: NightPhaseKind.Resolution, durationSeconds: 120, tension: 0.12, anomalies: [] },
  ],
  events: [
    {
      id: 'no1-intro',
      at: 1,
      mandatory: true,
      actions: [
        {
          type: 'dialogue',
          params: { line: 'First shift. Get the site running and walk the compound.' },
        },
      ],
    },
    {
      id: 'no1-mid',
      at: 420,
      actions: [{ type: 'dialogue', params: { line: 'Halfway through. Keep at it.' } }],
    },
    {
      id: 'no1-late',
      at: 800,
      actions: [{ type: 'dialogue', params: { line: 'Dawn is close now.' } }],
    },
  ],
};

// -- The shift objectives (the spine of the night; ends on completion) --------

export const NIGHT_ONE_MISSION: MissionDefinition = {
  id: 'night-one-shift',
  title: 'First Shift',
  summary: 'Get the compound through the night.',
  trigger: { type: 'auto' },
  objectives: [
    {
      id: 'power-up',
      type: 'activate',
      description: 'Turn on the generator',
      params: { id: 'generator', field: 'active', value: true },
    },
    {
      id: 'check-pump',
      type: 'inspect',
      description: 'Check the water pump',
      params: { id: 'water-pump' },
    },
    {
      id: 'lock-warehouse',
      type: 'activate',
      description: 'Lock the warehouse',
      params: { id: 'warehouse-door', field: 'open', value: false },
    },
    {
      id: 'find-fuel',
      type: 'collect',
      description: 'Find the missing fuel can',
      params: { item: 'fuel-can' },
    },
    {
      id: 'return-guard',
      type: 'reach',
      description: 'Return to the guard house',
      params: { target: vec3(8, 1.7, -22), radius: 6 },
    },
  ],
  sequences: [
    {
      id: 'shift',
      steps: ['power-up', 'check-pump', 'lock-warehouse', 'find-fuel', 'return-guard'],
    },
  ],
  rewards: [{ type: 'dialogue', params: { line: 'Back at the guard house. Shift over.' } }],
};
