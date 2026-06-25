import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import type { ObjectiveId, QuestId } from '@shared/types/branded';
import { logger } from '@shared/utils/logger';

import {
  QuestStatus,
  type QuestDefinition,
  type QuestProgress,
  type StartedQuestStatus,
} from './quest.types';

/** Immutable read-model of a quest's progress for the UI / persistence. */
export interface QuestSnapshot {
  readonly questId: QuestId;
  readonly status: StartedQuestStatus;
  readonly completedObjectives: readonly ObjectiveId[];
}

/**
 * Tracks quest definitions and their progress. It enforces the quest state
 * machine (inactive → active → completed/failed) and reports transitions on the
 * bus; what those quests *mean* is decided by the content registry that feeds
 * it, keeping this system reusable across chapters.
 */
export class QuestSystem {
  private readonly log = logger.child('quest');
  private readonly definitions = new Map<QuestId, QuestDefinition>();
  private readonly progress = new Map<QuestId, QuestProgress>();

  constructor(private readonly events: EventBus<GameEventMap>) {}

  public define(definition: QuestDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  public start(questId: QuestId): void {
    const definition = this.definitions.get(questId);
    if (!definition) {
      this.log.warn(`Cannot start unknown quest "${questId}"`);
      return;
    }
    if (this.progress.has(questId)) return;

    this.progress.set(questId, {
      definition,
      status: QuestStatus.Active,
      completedObjectives: new Set<ObjectiveId>(),
    });
    this.events.emit('quest:started', { questId });
    this.log.info(`Started quest "${definition.title}"`);
  }

  public completeObjective(questId: QuestId, objectiveId: ObjectiveId): void {
    const quest = this.progress.get(questId);
    if (!quest || quest.status !== QuestStatus.Active) return;
    const known = quest.definition.objectives.some((o) => o.id === objectiveId);
    if (!known || quest.completedObjectives.has(objectiveId)) return;

    quest.completedObjectives.add(objectiveId);
    this.events.emit('quest:objective-completed', { questId, objectiveId });

    if (this.allRequiredComplete(quest)) {
      quest.status = QuestStatus.Completed;
      this.events.emit('quest:completed', { questId });
      this.log.info(`Completed quest "${quest.definition.title}"`);
    }
  }

  public fail(questId: QuestId): void {
    const quest = this.progress.get(questId);
    if (!quest || quest.status !== QuestStatus.Active) return;
    quest.status = QuestStatus.Failed;
    this.events.emit('quest:failed', { questId });
  }

  public getStatus(questId: QuestId): QuestStatus {
    return this.progress.get(questId)?.status ?? QuestStatus.Inactive;
  }

  public snapshot(): readonly QuestSnapshot[] {
    return [...this.progress.values()].map((quest) => ({
      questId: quest.definition.id,
      status: quest.status,
      completedObjectives: [...quest.completedObjectives],
    }));
  }

  /** Rehydrate progress from a persisted snapshot (used on load). */
  public restore(snapshots: readonly QuestSnapshot[]): void {
    this.progress.clear();
    for (const snap of snapshots) {
      const definition = this.definitions.get(snap.questId);
      if (!definition) continue;
      this.progress.set(snap.questId, {
        definition,
        status: snap.status,
        completedObjectives: new Set(snap.completedObjectives),
      });
    }
  }

  private allRequiredComplete(quest: QuestProgress): boolean {
    return quest.definition.objectives
      .filter((objective) => objective.optional !== true)
      .every((objective) => quest.completedObjectives.has(objective.id));
  }
}
