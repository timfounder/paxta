import { asBrand, type ObjectiveId, type QuestId } from '@shared/types/branded';
import type { QuestDefinition } from '@systems/quest/quest.types';

/** Stable ids for the first chapter's quest and objectives. */
export const Quests = {
  Chapter1: asBrand<QuestId>('chapter-1'),
} as const;

export const Objectives = {
  FirstReport: asBrand<ObjectiveId>('first-report'),
  Endure: asBrand<ObjectiveId>('endure-three'),
} as const;

/** Number of correct reports required to clear the "endure" objective. */
export const ENDURE_TARGET = 3;

export const CHAPTER_ONE: QuestDefinition = {
  id: Quests.Chapter1,
  title: 'A Hole in the World',
  summary: 'Something in the corridor is wrong. Find the anomalies before they find you.',
  objectives: [
    { id: Objectives.FirstReport, description: 'Report your first anomaly.' },
    { id: Objectives.Endure, description: `Correctly report ${ENDURE_TARGET} anomalies.` },
  ],
};
