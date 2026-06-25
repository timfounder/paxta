import type { ObjectiveId, QuestId } from '@shared/types/branded';

export const QuestStatus = {
  Inactive: 'inactive',
  Active: 'active',
  Completed: 'completed',
  Failed: 'failed',
} as const;

export type QuestStatus = (typeof QuestStatus)[keyof typeof QuestStatus];

/**
 * The status of a quest that has actually been started. A quest only exists in
 * the progress map once started, so its runtime status is never `'inactive'` —
 * encoding that in the type removes impossible cases from save/restore code.
 */
export type StartedQuestStatus = Exclude<QuestStatus, 'inactive'>;

export interface ObjectiveDefinition {
  readonly id: ObjectiveId;
  readonly description: string;
  /** Optional objectives do not block quest completion. */
  readonly optional?: boolean;
}

export interface QuestDefinition {
  readonly id: QuestId;
  readonly title: string;
  readonly summary: string;
  readonly objectives: readonly ObjectiveDefinition[];
}

/** Runtime progress for a single quest. */
export interface QuestProgress {
  readonly definition: QuestDefinition;
  status: StartedQuestStatus;
  readonly completedObjectives: Set<ObjectiveId>;
}
