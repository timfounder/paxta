import type { AtmosphereManager } from '@engine/atmosphere/AtmosphereManager';
import type { InteractionRegistry } from '@engine/interaction/InteractionRegistry';
import type { PlayerController } from '@engine/player/PlayerController';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { asBrand, type InteractableId } from '@shared/types/branded';
import type { AnomalyManager } from '@systems/anomaly/AnomalyManager';
import type { Inventory } from '@systems/inventory/Inventory';
import type {
  NightAnomalyPort,
  NightAtmospherePort,
  NightContext,
  NightDialoguePort,
  NightWorldPort,
} from '@systems/night/night.types';
import { useUiStore } from '@state/uiStore';

export interface NightContextDeps {
  readonly anomalies: AnomalyManager;
  readonly atmosphere: AtmosphereManager;
  readonly player: PlayerController;
  readonly registry: InteractionRegistry;
  readonly inventory: Inventory;
  readonly events: EventBus<GameEventMap>;
}

/** Tension → atmosphere bias mapping (a calm night is dim, foggy and breezy). */
const TENSION_FOG = 0.012;
const TENSION_MOON = -0.3;
const TENSION_WIND = 0.3;

/**
 * The compound's {@link NightContext}: the game-layer bridge fulfilling the Night
 * Director's ports with real systems — anomalies enabled/triggered through the
 * {@link AnomalyManager}, tension folded into the {@link AtmosphereManager} as an
 * absolute (net-delta) bias, world facts from the player / interaction registry /
 * inventory, and dialogue as a toast. The framework stays Babylon-free; this is
 * where a night meets the engine.
 */
export class CompoundNightContext implements NightContext {
  public readonly anomaly: NightAnomalyPort;
  public readonly atmosphere: NightAtmospherePort;
  public readonly world: NightWorldPort;
  public readonly dialogue: NightDialoguePort;
  public readonly events: EventBus<GameEventMap>;
  public readonly random: () => number = () => Math.random();

  private appliedFog = 0;
  private appliedMoon = 0;
  private appliedWind = 0;

  constructor(deps: NightContextDeps) {
    const { anomalies, atmosphere, player, registry, inventory, events } = deps;
    this.events = events;

    this.anomaly = {
      enable: (id) => anomalies.setEnabled(id, true),
      disable: (id) => anomalies.setEnabled(id, false),
      trigger: (id) => anomalies.forceTrigger(id),
      setEnabledSet: (ids) => {
        for (const entry of anomalies.getDebugSnapshot()) {
          anomalies.setEnabled(entry.id, ids.includes(entry.id));
        }
      },
      activeCount: () => anomalies.activeCount(),
    };

    this.atmosphere = {
      setTension: (value) => this.applyTension(atmosphere, value),
      flash: () => atmosphere.flashLightning(),
    };

    this.world = {
      generatorActive: () =>
        registry.stateOf(asBrand<InteractableId>('generator'))?.['active'] === true,
      hasItem: (item) => inventory.has(item),
      missionStatus: () => null,
      playerPosition: () => {
        const p = player.position;
        return { x: p.x, y: p.y, z: p.z };
      },
    };

    this.dialogue = { say: (line) => useUiStore.getState().showToast(line) };
  }

  public now(): number {
    return performance.now() / 1000;
  }

  /** Apply tension as a net change to the atmosphere biases (idempotent setter). */
  private applyTension(atmosphere: AtmosphereManager, value: number): void {
    const fog = value * TENSION_FOG;
    const moon = value * TENSION_MOON;
    const wind = value * TENSION_WIND;
    atmosphere.addFogBias(fog - this.appliedFog);
    atmosphere.addMoonBias(moon - this.appliedMoon);
    atmosphere.addWindBias(wind - this.appliedWind);
    this.appliedFog = fog;
    this.appliedMoon = moon;
    this.appliedWind = wind;
  }
}
