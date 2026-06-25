import { GameEngine } from '@engine/GameEngine';
import { isReportingScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import { HallwayScene } from '@engine/scenes/locations/HallwayScene';
import { gameEvents } from '@core/events/gameEvents';
import type { Unsubscribe } from '@core/events/EventBus';
import { GamePhase, useGameStore } from '@state/gameStore';
import { Screen, useUiStore } from '@state/uiStore';
import { useSettingsStore } from '@state/settingsStore';
import type { PlayerVitals, ScoreBoard } from '@systems/anomaly/anomaly.types';
import { AudioChannel } from '@systems/audio/audio.types';
import { AudioManager } from '@systems/audio/AudioManager';
import { LocalStorageSaveRepository } from '@systems/save/LocalStorageSaveRepository';
import { SaveSystem, type SaveDraft } from '@systems/save/SaveSystem';
import { QuestSystem } from '@systems/quest/QuestSystem';
import { telegram } from '@telegram/TelegramService';
import { asBrand, type SaveSlotId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';
import { ZERO_VEC3 } from '@shared/types/spatial';
import { type Result } from '@shared/utils/result';
import { logger } from '@shared/utils/logger';

import { CHAPTER_ONE, ENDURE_TARGET, Objectives, Quests } from './content/quests';
import type { GameServices } from './services/GameServices';

const DEFAULT_SLOT = asBrand<SaveSlotId>('autosave');

/**
 * The composition root and façade for the entire runtime. React talks to this
 * object for commands (new game, report, pause, save); everything reactive
 * flows back through the Zustand stores. It owns construction and wiring of
 * every system so no other module needs to know how they fit together.
 */
export class Game {
  private readonly log = logger.child('game');
  private readonly engine: GameEngine;
  private readonly audio = new AudioManager();
  private readonly quests = new QuestSystem(gameEvents);
  private readonly saves: SaveSystem;
  private readonly subscriptions: Unsubscribe[] = [];

  private lastPlayerPosition: Vec3 = ZERO_VEC3;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new GameEngine({ canvas, events: gameEvents });
    this.saves = new SaveSystem(new LocalStorageSaveRepository(), gameEvents);

    const services: GameServices = {
      audio: this.audio,
      quests: this.quests,
      vitals: this.createVitals(),
      score: this.createScoreBoard(),
    };

    this.quests.define(CHAPTER_ONE);
    this.engine.scenes.register(SceneIds.Hallway, (ctx) => new HallwayScene(ctx, services));

    this.wireEvents();
    this.wireSettings();
  }

  // -- Commands --------------------------------------------------------------

  /** Begin a fresh play session from the menu. */
  public async newGame(): Promise<void> {
    this.audio.unlock();
    useGameStore.getState().reset();
    useGameStore.getState().setPhase(GamePhase.Playing);
    this.quests.start(Quests.Chapter1);

    await this.engine.scenes.transitionTo(SceneIds.Hallway);
    useGameStore.getState().setScene(SceneIds.Hallway);

    this.engine.start();
    useUiStore.getState().setScreen(Screen.Game);
    useUiStore.getState().setHudVisible(true);
  }

  /** The player asserts an anomaly is present in the current scene. */
  public reportAnomaly(): void {
    const scene = this.engine.scenes.activeScene;
    if (scene && isReportingScene(scene)) {
      scene.report();
    }
  }

  public pause(): void {
    this.engine.pause('manual');
    useGameStore.getState().setPhase(GamePhase.Paused);
  }

  public resume(): void {
    this.engine.resume('manual');
    useGameStore.getState().setPhase(GamePhase.Playing);
  }

  public resize(): void {
    this.engine.resize();
  }

  // -- Persistence -----------------------------------------------------------

  public save(slotId: SaveSlotId = DEFAULT_SLOT): Promise<Result<void>> {
    const game = useGameStore.getState();
    const sceneId = game.currentSceneId ?? SceneIds.Hallway;
    const draft: SaveDraft = {
      slotId,
      currentSceneId: sceneId,
      player: { position: this.lastPlayerPosition, sanity: game.sanity },
      progress: { score: game.score, hits: game.hits, misses: game.misses },
      quests: this.quests.snapshot().map((snapshot) => ({
        questId: snapshot.questId,
        status: snapshot.status === 'inactive' ? 'active' : snapshot.status,
        completedObjectives: [...snapshot.completedObjectives],
      })),
    };
    return this.saves.save(draft);
  }

  public dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions.length = 0;
    this.audio.dispose();
    this.engine.dispose();
    this.log.info('Game disposed');
  }

  // -- Wiring ----------------------------------------------------------------

  private createVitals(): PlayerVitals {
    return {
      drainSanity: (amount) => useGameStore.getState().drainSanity(amount),
      recoverSanity: (amount) => useGameStore.getState().recoverSanity(amount),
    };
  }

  private createScoreBoard(): ScoreBoard {
    return {
      recordHit: () => useGameStore.getState().recordHit(),
      recordMiss: () => useGameStore.getState().recordMiss(),
    };
  }

  private wireEvents(): void {
    this.subscriptions.push(
      gameEvents.on('player:moved', ({ position }) => {
        this.lastPlayerPosition = position;
      }),

      gameEvents.on('player:spawned', ({ position }) => {
        this.lastPlayerPosition = position;
      }),

      gameEvents.on('anomaly:resolved', () => {
        this.advanceQuestOnCatch();
        this.haptic('success');
      }),

      gameEvents.on('anomaly:missed', () => {
        useUiStore.getState().showToast('Something slipped past you…');
        this.haptic('error');
      }),

      gameEvents.on('quest:completed', () => {
        useUiStore.getState().showToast('Chapter complete.');
      }),

      gameEvents.on('player:died', () => {
        useUiStore.getState().setHudVisible(false);
        useUiStore.getState().setScreen(Screen.GameOver);
        this.haptic('error');
      }),
    );
  }

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

  private advanceQuestOnCatch(): void {
    this.quests.completeObjective(Quests.Chapter1, Objectives.FirstReport);
    if (useGameStore.getState().hits >= ENDURE_TARGET) {
      this.quests.completeObjective(Quests.Chapter1, Objectives.Endure);
    }
  }

  private haptic(type: 'success' | 'error'): void {
    if (!useSettingsStore.getState().hapticsEnabled) return;
    telegram.hapticNotification(type);
  }
}
