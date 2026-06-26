import type { MissionConditionState } from '@systems/mission/MissionManager';
import type { MissionDebugEntry } from '@systems/mission/mission.types';

export type { MissionDebugEntry, MissionConditionState };

/**
 * The narrow surface a scene exposes so the mission developer tools can complete,
 * skip, restart and inspect missions. Game-layer (the scene and `Game` are the
 * only users) to keep the engine mission-free.
 */
export interface MissionDebuggable {
  listMissions(): readonly MissionDebugEntry[];
  completeMissionDebug(id: string): void;
  skipObjectiveDebug(missionId: string, objectiveId: string): void;
  restartMissionDebug(id: string): void;
  missionConditions(id: string): readonly MissionConditionState[];
}

export const isMissionDebuggable = (value: unknown): value is MissionDebuggable => {
  const candidate = value as Partial<Record<keyof MissionDebuggable, unknown>> | null;
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    typeof candidate.listMissions === 'function' &&
    typeof candidate.completeMissionDebug === 'function' &&
    typeof candidate.skipObjectiveDebug === 'function' &&
    typeof candidate.restartMissionDebug === 'function' &&
    typeof candidate.missionConditions === 'function'
  );
};
