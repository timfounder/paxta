import { vec3 } from '@shared/types/spatial';
import type { MissionDefinition } from '@systems/mission/mission.types';

/**
 * Example missions for the compound — **pure data**, exercising the objective
 * types (reach / activate / interact / inspect / collect / deliver / survive),
 * multi-step sequences, dependencies, hidden + optional objectives, chaining
 * (startMission reward / onPhase trigger), conditions and rewards. They are
 * framework fixtures, **not story** — adding a real mission is adding another
 * {@link MissionDefinition}. None of it touches the engine.
 */
export const COMPOUND_MISSIONS: readonly MissionDefinition[] = [
  {
    id: 'demo-patrol',
    title: 'Night Patrol',
    summary: 'Secure the compound.',
    trigger: { type: 'auto' },
    objectives: [
      {
        id: 'reach-guard',
        type: 'reach',
        description: 'Reach the guard house',
        params: { target: vec3(8, 1.7, -22), radius: 5 },
      },
      {
        id: 'lights-on',
        type: 'activate',
        description: 'Switch on the entrance light',
        params: { id: 'entrance-switch', field: 'active', value: true },
      },
      {
        id: 'check-door',
        type: 'interact',
        description: 'Check the warehouse door',
        params: { id: 'warehouse-door' },
      },
      {
        id: 'hidden-look',
        type: 'inspect',
        description: 'Inspect the generator',
        params: { id: 'generator' },
        hidden: true,
        optional: true,
      },
    ],
    sequences: [{ id: 'patrol', steps: ['reach-guard', 'lights-on', 'check-door'] }],
    rewards: [
      { type: 'dialogue', params: { line: 'Patrol complete. Stay alert.' } },
      { type: 'setFlag', params: { name: 'patrol-done' } },
      { type: 'startMission', params: { id: 'demo-errand' } },
    ],
  },
  {
    id: 'demo-errand',
    title: 'The Key',
    summary: 'Find the key and bring it to the generator.',
    // Never auto-starts; started by the patrol's `startMission` reward.
    trigger: { type: 'onFlag', params: { name: 'never' } },
    objectives: [
      {
        id: 'find-key',
        type: 'collect',
        description: 'Find the rusted key',
        params: { item: 'rusted-key' },
      },
      {
        id: 'deliver-key',
        type: 'deliver',
        description: 'Bring the key to the generator',
        params: { item: 'rusted-key', id: 'generator' },
        dependsOn: ['find-key'],
      },
      {
        id: 'bonus-tag',
        type: 'collect',
        description: 'Also grab the metal tag',
        params: { item: 'metal-tag' },
        optional: true,
      },
    ],
    rewards: [{ type: 'dialogue', params: { line: 'Good. The generator is keyed.' } }],
  },
  {
    id: 'demo-vigil',
    title: 'Hold Position',
    summary: 'Survive the suspicion phase.',
    trigger: { type: 'onPhase', params: { phase: 'suspicion' } },
    failConditions: [{ type: 'flag', params: { name: 'abandoned' } }],
    objectives: [
      {
        id: 'wait-it-out',
        type: 'survive',
        description: 'Hold position for 45s',
        params: { seconds: 45 },
      },
      {
        id: 'stay-lit',
        type: 'activate',
        description: 'Keep the generator running',
        params: { id: 'generator', field: 'active', value: true },
        optional: true,
      },
    ],
    retryable: true,
    rewards: [{ type: 'dialogue', params: { line: 'It passed. For now.' } }],
  },
];
