import type { GameEngine } from '@engine/GameEngine';
import { isControllableScene, type ControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import { gameEvents } from '@core/events/gameEvents';
import type { Unsubscribe } from '@core/events/EventBus';
import { GamePhase, useGameStore } from '@state/gameStore';
import { useInventoryStore } from '@state/inventoryStore';
import { Screen, useUiStore } from '@state/uiStore';
import { useSettingsStore } from '@state/settingsStore';
import { useAnomalyDebugStore } from '@state/anomalyDebugStore';
import { isAnomalyDebuggable, type AnomalyDebuggable } from './anomaly/anomalyDebug';
import { AudioChannel } from '@systems/audio/audio.types';
import { AudioManager } from '@systems/audio/AudioManager';
import { PLAYER } from '@shared/constants/game';
import { logger } from '@shared/utils/logger';

/**
 * The composition root and façade React talks to. It boots the shell, lazily
 * loads the Babylon engine on first entry, drives the playable level, and
 * forwards the mobile player controls (move / look / sprint / crouch / interact)
 * to the active scene. Horror systems exist in the codebase but are intentionally
 * not wired here yet.
 *
 * The engine (and its large bundle) is created lazily on the first
 * {@link enterLevel} call, so the menu and loading screens ship without the
 * renderer in the initial payload.
 */
export class Game {
  private readonly log = logger.child('game');
  private readonly canvas: HTMLCanvasElement;
  private readonly audio = new AudioManager();
  private readonly subscriptions: Unsubscribe[] = [];

  private engine: GameEngine | null = null;
  private enginePromise: Promise<GameEngine> | null = null;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.wireSettings();
    // Mirror simulation facts into the UI stores (engine/systems stay UI-free).
    this.subscriptions.push(
      gameEvents.on('interaction:focus-changed', ({ prompt }) => {
        useUiStore.getState().setInteractionPrompt(prompt);
      }),
      gameEvents.on('inventory:changed', ({ items }) => {
        useInventoryStore.getState().setItems(items);
      }),
    );
  }

  // -- Commands --------------------------------------------------------------

  /** Enter the playable level from the menu, loading the engine on first use. */
  public async enterLevel(): Promise<void> {
    this.audio.unlock();
    useGameStore.getState().reset();
    useGameStore.getState().setPhase(GamePhase.Playing);

    const firstLoad = this.engine === null;
    if (firstLoad) useUiStore.getState().setScreen(Screen.Loading);

    const engine = await this.ensureEngine();
    if (this.disposed) return;

    if (engine.scenes.activeScene === null) {
      await engine.scenes.transitionTo(SceneIds.Compound);
      useGameStore.getState().setScene(SceneIds.Compound);
    }
    engine.resume('manual');
    engine.start();
    this.controllable?.setHeadBobEnabled(useSettingsStore.getState().headBob);

    useUiStore.getState().setScreen(Screen.Game);
    useUiStore.getState().setHudVisible(true);
  }

  /** The active scene if it accepts player control, else null. */
  private get controllable(): ControllableScene | null {
    const scene = this.engine?.scenes.activeScene;
    return scene && isControllableScene(scene) ? scene : null;
  }

  /** Forward normalised movement intent (x = strafe, z = forward) to the scene. */
  public setMoveInput(x: number, z: number): void {
    this.controllable?.setMoveInput(x, z);
  }

  /** Forward a raw pointer look delta (pixels); applies sensitivity + inversion. */
  public look(deltaXPixels: number, deltaYPixels: number): void {
    const scene = this.controllable;
    if (!scene) return;
    const settings = useSettingsStore.getState();
    const sensitivity = PLAYER.LOOK_SENSITIVITY * settings.lookSensitivity;
    scene.look(
      deltaXPixels * sensitivity,
      deltaYPixels * sensitivity * (settings.invertLook ? -1 : 1),
    );
  }

  public setSprint(active: boolean): void {
    this.controllable?.setSprint(active);
  }

  public setCrouch(active: boolean): void {
    this.controllable?.setCrouch(active);
  }

  public interact(): void {
    this.controllable?.interact();
  }

  public dropItem(): void {
    this.controllable?.dropItem();
  }

  /** The active scene if it exposes the anomaly debug surface, else null. */
  private get anomalyDebuggable(): AnomalyDebuggable | null {
    const scene = this.engine?.scenes.activeScene;
    return scene && isAnomalyDebuggable(scene) ? scene : null;
  }

  /** Developer overlay: enable/disable an anomaly by id. */
  public setAnomalyEnabled(id: string, enabled: boolean): void {
    this.anomalyDebuggable?.setAnomalyEnabled(id, enabled);
  }

  /** Developer overlay: force-fire an anomaly by id. */
  public triggerAnomaly(id: string): void {
    this.anomalyDebuggable?.triggerAnomaly(id);
  }

  public pause(): void {
    this.setMoveInput(0, 0);
    this.controllable?.setSprint(false);
    this.engine?.pause('manual');
    useGameStore.getState().setPhase(GamePhase.Paused);
  }

  public resume(): void {
    this.engine?.resume('manual');
    useGameStore.getState().setPhase(GamePhase.Playing);
  }

  /** Leave the level back to the menu, freezing the engine. */
  public exitToMenu(): void {
    this.setMoveInput(0, 0);
    this.controllable?.setSprint(false);
    this.controllable?.setCrouch(false);
    this.engine?.pause('manual');
    useGameStore.getState().reset();
    useInventoryStore.getState().reset();
    useAnomalyDebugStore.getState().reset();
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setInteractionPrompt(null);
    useUiStore.getState().setScreen(Screen.Menu);
  }

  public resize(): void {
    this.engine?.resize();
  }

  public getFps(): number {
    return this.engine?.getFps() ?? 0;
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions.length = 0;
    this.audio.dispose();
    this.engine?.dispose();
    this.log.info('Game disposed');
  }

  // -- Lazy engine -----------------------------------------------------------

  private ensureEngine(): Promise<GameEngine> {
    return (this.enginePromise ??= this.createEngine());
  }

  private async createEngine(): Promise<GameEngine> {
    const [{ GameEngine }, { CompoundScene }] = await Promise.all([
      import('@engine/GameEngine'),
      import('./scenes/CompoundScene'),
    ]);
    const engine = new GameEngine({ canvas: this.canvas, events: gameEvents });
    engine.scenes.register(SceneIds.Compound, (ctx) => new CompoundScene(ctx));
    this.engine = engine;
    this.log.info('Engine initialised (Babylon loaded)');
    return engine;
  }

  // -- Wiring ----------------------------------------------------------------

  private wireSettings(): void {
    const apply = (state: ReturnType<typeof useSettingsStore.getState>): void => {
      this.audio.setMuted(state.muted);
      this.audio.setChannelVolume(AudioChannel.Master, state.volumes[AudioChannel.Master]);
      this.audio.setChannelVolume(AudioChannel.Music, state.volumes[AudioChannel.Music]);
      this.audio.setChannelVolume(AudioChannel.Sfx, state.volumes[AudioChannel.Sfx]);
      this.audio.setChannelVolume(AudioChannel.Ambience, state.volumes[AudioChannel.Ambience]);
      this.controllable?.setHeadBobEnabled(state.headBob);
    };
    apply(useSettingsStore.getState());
    this.subscriptions.push(useSettingsStore.subscribe(apply));
  }
}
