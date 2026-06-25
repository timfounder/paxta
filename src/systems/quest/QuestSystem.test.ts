import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { asBrand, type ObjectiveId, type QuestId } from '@shared/types/branded';

import { QuestSystem } from './QuestSystem';
import type { QuestDefinition } from './quest.types';

const QUEST = asBrand<QuestId>('q1');
const OBJ_A = asBrand<ObjectiveId>('a');
const OBJ_B = asBrand<ObjectiveId>('b');

const definition: QuestDefinition = {
  id: QUEST,
  title: 'Test Quest',
  summary: 'A quest for tests.',
  objectives: [
    { id: OBJ_A, description: 'First' },
    { id: OBJ_B, description: 'Second', optional: true },
  ],
};

const makeSystem = (): QuestSystem => {
  const system = new QuestSystem(new TypedEventBus<GameEventMap>());
  system.define(definition);
  return system;
};

describe('QuestSystem', () => {
  it('reports inactive status before a quest starts', () => {
    expect(makeSystem().getStatus(QUEST)).toBe('inactive');
  });

  it('completes once all required objectives are done', () => {
    const system = makeSystem();
    system.start(QUEST);
    expect(system.getStatus(QUEST)).toBe('active');

    // The optional objective alone must not complete the quest.
    system.completeObjective(QUEST, OBJ_B);
    expect(system.getStatus(QUEST)).toBe('active');

    system.completeObjective(QUEST, OBJ_A);
    expect(system.getStatus(QUEST)).toBe('completed');
  });

  it('round-trips through snapshot and restore', () => {
    const system = makeSystem();
    system.start(QUEST);
    system.completeObjective(QUEST, OBJ_A);

    const snapshot = system.snapshot();
    const restored = makeSystem();
    restored.restore(snapshot);

    expect(restored.getStatus(QUEST)).toBe('completed');
  });
});
