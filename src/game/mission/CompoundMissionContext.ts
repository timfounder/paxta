import type { AtmosphereManager } from '@engine/atmosphere/AtmosphereManager';
import type { InteractionRegistry } from '@engine/interaction/InteractionRegistry';
import type { PlayerController } from '@engine/player/PlayerController';
import type { EventBus, Unsubscribe } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { asBrand, type InteractableId } from '@shared/types/branded';
import type { AnomalyManager } from '@systems/anomaly/AnomalyManager';
import type { Inventory } from '@systems/inventory/Inventory';
import type { MissionManager } from '@systems/mission/MissionManager';
import type { MissionActuator, MissionContext, MissionWorld } from '@systems/mission/mission.types';
import { useUiStore } from '@state/uiStore';

export interface MissionContextDeps {
  readonly player: PlayerController;
  readonly registry: InteractionRegistry;
  readonly inventory: Inventory;
  readonly anomalies: AnomalyManager;
  readonly atmosphere: AtmosphereManager;
  readonly events: EventBus<GameEventMap>;
  /** The current night phase (read from the Night Director). */
  readonly nightPhase: () => string;
}

/**
 * The compound's {@link MissionContext}: the game-layer bridge that lets missions
 * detect progress by **reusing existing signals** — player position, inventory,
 * the interaction registry/event, the night phase and the anomaly count — and act
 * through the anomaly/atmosphere systems. It owns no detection logic of its own; a
 * single interaction subscription feeds the "last interacted / last signal"
 * latch every objective reads. Flags and mission-start route to the manager
 * (bound after construction), keeping save/load centralised there.
 */
export class CompoundMissionContext implements MissionContext {
  public readonly world: MissionWorld;
  public readonly actuator: MissionActuator;
  public readonly random: () => number = () => Math.random();

  private manager: MissionManager | null = null;
  private readonly interactedAt = new Map<string, number>();
  private readonly signalAt = new Map<string, number>();
  private readonly subscriptions: Unsubscribe[] = [];

  constructor(deps: MissionContextDeps) {
    const { player, registry, inventory, anomalies, atmosphere, events, nightPhase } = deps;

    this.world = {
      playerPosition: () => {
        const p = player.position;
        return { x: p.x, y: p.y, z: p.z };
      },
      hasItem: (item) => inventory.has(item),
      interactableState: (id, field) =>
        registry.stateOf(asBrand<InteractableId>(id))?.[field] ?? null,
      nightPhase,
      anomalyActiveCount: () => anomalies.activeCount(),
      now: () => this.now(),
      lastInteractedAt: (id) => this.interactedAt.get(id) ?? Number.NEGATIVE_INFINITY,
      lastSignalAt: (name) => this.signalAt.get(name) ?? Number.NEGATIVE_INFINITY,
      flag: (name) => this.manager?.hasFlag(name) ?? false,
    };

    this.actuator = {
      setFlag: (name) => this.manager?.setFlag(name),
      enableAnomaly: (id) => anomalies.setEnabled(id, true),
      triggerAnomaly: (id) => anomalies.forceTrigger(id),
      flash: () => atmosphere.flashLightning(),
      dialogue: (line) => useUiStore.getState().showToast(line),
      startMission: (id) => this.manager?.requestStart(id),
    };

    this.subscriptions.push(
      events.on('interaction:performed', ({ id }) => {
        this.interactedAt.set(id, this.now());
        this.signalAt.set('interaction', this.now());
      }),
      events.on('inventory:changed', () => this.signalAt.set('inventory', this.now())),
    );
  }

  /** Bind the manager so flags and mission-start route through it (save/load). */
  public bind(manager: MissionManager): void {
    this.manager = manager;
  }

  public dispose(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions.length = 0;
  }

  private now(): number {
    return performance.now() / 1000;
  }
}
