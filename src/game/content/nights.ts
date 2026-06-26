import { NightPhaseKind, type NightDefinition } from '@systems/night/night.types';

/**
 * The example night for the compound — **pure data**. It paces tension across the
 * six phases, enabling escalating sets of the (environmental) example anomalies,
 * with timeline beats, phase-scoped random flavour, a peak sequence, conditions
 * and objectives. Everything is configurable here; the engine reads it and never
 * changes. No monster, no scripted scare — only orchestrated atmosphere.
 *
 * Authoring a different night is adding another {@link NightDefinition}.
 */
export const COMPOUND_NIGHT: NightDefinition = {
  id: 'compound-night-1',
  phases: [
    { id: NightPhaseKind.Preparation, durationSeconds: 90, tension: 0.08, anomalies: [] },
    { id: NightPhaseKind.Calm, durationSeconds: 150, tension: 0.22, anomalies: ['fog-roll'] },
    {
      id: NightPhaseKind.Suspicion,
      durationSeconds: 150,
      tension: 0.42,
      anomalies: ['fog-roll', 'warehouse-whisper', 'generator-shudder'],
    },
    {
      id: NightPhaseKind.Escalation,
      durationSeconds: 150,
      tension: 0.66,
      anomalies: ['distant-flash', 'warehouse-whisper', 'generator-shudder', 'displaced-tool'],
    },
    {
      id: NightPhaseKind.Peak,
      durationSeconds: 120,
      tension: 0.92,
      anomalies: ['distant-flash', 'phantom-crate', 'blackout', 'warehouse-whisper'],
    },
    { id: NightPhaseKind.Resolution, durationSeconds: 90, tension: 0.15, anomalies: [] },
  ],
  objectives: [
    { id: 'patrol', description: 'Patrol the compound until dawn.' },
    { id: 'keep-power', description: 'Keep the generator running.', optional: true },
  ],
  events: [
    // -- Timeline beats (mandatory unless noted) ------------------------------
    {
      id: 'shift-begin',
      at: 1,
      mandatory: true,
      actions: [
        { type: 'dialogue', params: { line: 'Shift start. Watch the compound.' } },
        { type: 'startObjective', params: { id: 'patrol' } },
        { type: 'startObjective', params: { id: 'keep-power' } },
      ],
    },
    {
      id: 'power-warning',
      at: 200,
      conditions: [{ type: 'generator', params: { equals: false } }],
      actions: [{ type: 'dialogue', params: { line: 'The generator has stopped.' } }],
    },
    { id: 'midnight', at: 390, actions: [{ type: 'dialogue', params: { line: 'Midnight.' } }] },
    {
      id: 'peak-onset',
      at: 545,
      mandatory: true,
      actions: [
        { type: 'dialogue', params: { line: 'Something is wrong out here.' } },
        { type: 'startSequence', params: { id: 'peak-crescendo' } },
      ],
    },
    {
      id: 'shift-end',
      at: 748,
      mandatory: true,
      actions: [
        { type: 'completeObjective', params: { id: 'patrol' } },
        { type: 'dialogue', params: { line: 'Dawn. Shift over.' } },
      ],
    },

    // -- Phase-scoped random flavour ------------------------------------------
    {
      id: 'rng-whisper',
      phase: NightPhaseKind.Suspicion,
      probability: 0.15,
      cooldownSeconds: 30,
      actions: [{ type: 'triggerAnomaly', params: { id: 'warehouse-whisper' } }],
    },
    {
      id: 'rng-generator',
      phase: NightPhaseKind.Suspicion,
      probability: 0.2,
      cooldownSeconds: 35,
      conditions: [{ type: 'generator', params: { equals: true } }],
      actions: [{ type: 'triggerAnomaly', params: { id: 'generator-shudder' } }],
    },
    {
      id: 'rng-flash',
      phase: NightPhaseKind.Escalation,
      probability: 0.2,
      cooldownSeconds: 40,
      weight: 2,
      actions: [{ type: 'triggerAnomaly', params: { id: 'distant-flash' } }],
    },

    // -- Sequence steps (fired only by the peak sequence) ---------------------
    {
      id: 'seq-flash',
      actions: [{ type: 'flash' }, { type: 'triggerAnomaly', params: { id: 'distant-flash' } }],
    },
    {
      id: 'seq-whisper',
      actions: [
        { type: 'triggerAnomaly', params: { id: 'warehouse-whisper' } },
        { type: 'dialogue', params: { line: "It's right behind the warehouse." } },
      ],
    },
    { id: 'seq-blackout', actions: [{ type: 'triggerAnomaly', params: { id: 'blackout' } }] },
  ],
  sequences: [
    {
      id: 'peak-crescendo',
      steps: ['seq-flash', 'seq-whisper', 'seq-blackout'],
      stepDelaySeconds: 8,
    },
  ],
};
