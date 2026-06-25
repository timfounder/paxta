import type { GameEngine } from '@engine/GameEngine';
import { isControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import { gameEvents } from '@core/events/gameEvents';
import type { Unsubscribe } from '@core/events/EventBus';
import { GamePhase, useGameStore } from '@state/gameStore';
import { Screen, useUiStore } from '@state/uiStore';
import { useSettingsStore } from '@state/settingsStore';
import { AudioChannel } from '@systems/audio/audio.types';
import { AudioManager } from '@systems/audio/AudioManager';
import { PLAYER } from '@shared/constants/game';
import { logger } from '@shared/utils/logger';

/**
 * The composition root and façade React talks to. For Milestone 1 it boots the
 * shell, lazily loads the Babylon engine on first entry, drives the empty
 * playable level, and forwards mobile movement/look input to the active scene.
 * Horror systems exist in the codebase but are intentionally not wired here yet.
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
      await engine.scenes.transitionTo(SceneIds.Hallway);
      useGameStore.getState().setScene(SceneIds.Hallway);
    }
    engine.resume('manual');
    engine.start();

    useUiStore.getState().setScreen(Screen.Game);
    useUiStore.getState().setHudVisible(true);
  }

  /** Forward normalised movement intent (x = strafe, z = forward) to the scene. */
  public setMoveInput(x: number, z: number): void {
    const scene = this.engine?.scenes.activeScene;
    if (scene && isControllableScene(scene)) scene.setMoveInput(x, z);
  }

  /** Forward a raw pointer look delta (pixels); applies sensitivity + inversion. */
  public look(deltaXPixels: number, deltaYPixels: number): void {
    const scene = this.engine?.scenes.activeScene;
    if (!scene || !isControllableScene(scene)) return;
    const settings = useSettingsStore.getState();
    const sensitivity = PLAYER.LOOK_SENSITIVITY * settings.lookSensitivity;
    const yaw = deltaXPixels * sensitivity;
    const pitch = deltaYPixels * sensitivity * (settings.invertLook ? -1 : 1);
    scene.look(yaw, pitch);
  }

  public pause(): void {
    this.setMoveInput(0, 0);
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
    this.engine?.pause('manual');
    useGameStore.getState().reset();
    useUiStore.getState().setHudVisible(false);
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
    const [{ GameEngine }, { HallwayScene }] = await Promise.all([
      import('@engine/GameEngine'),
      import('./scenes/HallwayScene'),
    ]);
    const engine = new GameEngine({ canvas: this.canvas, events: gameEvents });
    engine.scenes.register(SceneIds.Hallway, (ctx) => new HallwayScene(ctx));
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
    };
    apply(useSettingsStore.getState());
    this.subscriptions.push(useSettingsStore.subscribe(apply));
  }
}
