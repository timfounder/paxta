import { describe, expect, it } from 'vitest';

import { MissionManager, type MissionNotification } from './MissionManager';
import {
  MissionStatus,
  ObjectiveState,
  type MissionContext,
  type MissionDefinition,
} from './mission.types';

interface World {
  pos: { x: number; y: number; z: number };
  items: Set<string>;
  interactedAt: Map<string, number>;
  signalAt: Map<string, number>;
  flags: Set<string>;
  now: number;
  phase: string;
}

const makeContext = (): { ctx: MissionContext; w: World } => {
  const w: World = {
    pos: { x: 0, y: 0, z: 0 },
    items: new Set(),
    interactedAt: new Map(),
    signalAt: new Map(),
    flags: new Set(),
    now: 0,
    phase: 'calm',
  };
  const ctx: MissionContext = {
    world: {
      playerPosition: () => w.pos,
      hasItem: (id) => w.items.has(id),
      interactableState: () => null,
      nightPhase: () => w.phase,
      anomalyActiveCount: () => 0,
      now: () => w.now,
      lastInteractedAt: (id) => w.interactedAt.get(id) ?? Number.NEGATIVE_INFINITY,
      lastSignalAt: (n) => w.signalAt.get(n) ?? Number.NEGATIVE_INFINITY,
      flag: (n) => w.flags.has(n),
    },
    actuator: {
      setFlag: (n) => w.flags.add(n),
      enableAnomaly: () => undefined,
      triggerAnomaly: () => undefined,
      flash: () => undefined,
      dialogue: () => undefined,
      startMission: () => undefined,
    },
    random: () => 0.5,
  };
  return { ctx, w };
};

const tick = (manager: MissionManager, w: World, seconds = 0.25): void => {
  w.now += seconds;
  manager.update(seconds);
};

const REACH: MissionDefinition = {
  id: 'reach-mission',
  title: 'Reach',
  trigger: { type: 'auto' },
  objectives: [
    {
      id: 'go',
      type: 'reach',
      description: 'Go',
      params: { target: { x: 5, y: 0, z: 0 }, radius: 2 },
    },
  ],
  rewards: [{ type: 'setFlag', params: { name: 'reached' } }],
};

const CHAIN: MissionDefinition = {
  id: 'chain-mission',
  title: 'Chain',
  trigger: { type: 'afterMission', params: { id: 'reach-mission' } },
  objectives: [{ id: 'grab', type: 'collect', description: 'Grab key', params: { item: 'key' } }],
};

describe('MissionManager', () => {
  it('auto-starts, completes a reach objective and applies the reward', () => {
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.register(REACH);
    tick(manager, w);
    expect(manager.getViews()[0].status).toBe(MissionStatus.Active);
    w.pos = { x: 5, y: 0, z: 0 };
    tick(manager, w);
    expect(manager.getViews()[0].status).toBe(MissionStatus.Complete);
    expect(w.flags.has('reached')).toBe(true);
  });

  it('chains the next mission after one completes', () => {
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.registerAll([REACH, CHAIN]);
    w.pos = { x: 5, y: 0, z: 0 };
    tick(manager, w);
    tick(manager, w);
    const chain = manager.getViews().find((m) => m.id === 'chain-mission');
    expect(chain?.status).toBe(MissionStatus.Active);
    w.items.add('key');
    tick(manager, w);
    expect(manager.getViews().find((m) => m.id === 'chain-mission')?.status).toBe(
      MissionStatus.Complete,
    );
  });

  it('locks objectives until their dependencies complete (multi-step)', () => {
    const def: MissionDefinition = {
      id: 'multi',
      title: 'Multi',
      trigger: { type: 'auto' },
      objectives: [
        { id: 'a', type: 'collect', description: 'A', params: { item: 'a' } },
        { id: 'b', type: 'collect', description: 'B', params: { item: 'b' }, dependsOn: ['a'] },
      ],
    };
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.register(def);
    tick(manager, w);
    const b = () => manager.getViews()[0].objectives.find((o) => o.id === 'b');
    expect(b()?.state).toBe(ObjectiveState.Locked);
    w.items.add('a');
    tick(manager, w);
    expect(b()?.state).toBe(ObjectiveState.Active);
  });

  it('treats optional objectives as non-blocking', () => {
    const def: MissionDefinition = {
      id: 'opt',
      title: 'Opt',
      trigger: { type: 'auto' },
      objectives: [
        { id: 'req', type: 'collect', description: 'Req', params: { item: 'r' } },
        {
          id: 'bonus',
          type: 'collect',
          description: 'Bonus',
          params: { item: 'x' },
          optional: true,
        },
      ],
    };
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.register(def);
    w.items.add('r');
    tick(manager, w);
    expect(manager.getViews()[0].status).toBe(MissionStatus.Complete);
  });

  it('fails on a fail condition and can be restarted', () => {
    const def: MissionDefinition = {
      id: 'fragile',
      title: 'Fragile',
      trigger: { type: 'auto' },
      failConditions: [{ type: 'flag', params: { name: 'boom' } }],
      objectives: [
        { id: 'survive', type: 'survive', description: 'Survive', params: { seconds: 10 } },
      ],
      retryable: true,
    };
    const { ctx, w } = makeContext();
    const notes: MissionNotification[] = [];
    const manager = new MissionManager(ctx, { onNotify: (n) => notes.push(n) });
    manager.register(def);
    tick(manager, w);
    w.flags.add('boom');
    tick(manager, w);
    expect(manager.getViews()[0].status).toBe(MissionStatus.Failed);
    expect(notes.some((n) => n.kind === 'failed')).toBe(true);
    w.flags.delete('boom');
    manager.restartMission('fragile');
    expect(manager.getViews()[0].status).toBe(MissionStatus.Active);
  });

  it('round-trips through snapshot and restore', () => {
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.register(REACH);
    w.pos = { x: 5, y: 0, z: 0 };
    tick(manager, w);
    tick(manager, w);
    const snapshot = manager.snapshot();

    const restored = new MissionManager(makeContext().ctx);
    restored.register(REACH);
    restored.restore(snapshot);
    expect(restored.getViews()[0].status).toBe(MissionStatus.Complete);
  });

  it('supports debug complete / skip', () => {
    const { ctx, w } = makeContext();
    const manager = new MissionManager(ctx);
    manager.register(REACH);
    tick(manager, w);
    manager.forceComplete('reach-mission');
    expect(manager.getViews()[0].status).toBe(MissionStatus.Complete);
  });
});
