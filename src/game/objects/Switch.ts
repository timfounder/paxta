import { ToggleControl } from './ToggleControl';

/**
 * A wall switch: toggles its linked lights (or any {@link Activatable}) on and
 * off. Pure configuration over {@link ToggleControl} — the only thing specific to
 * a switch is the verb shown to the player.
 */
export class Switch extends ToggleControl {
  public getPrompt(): string {
    return this.active ? 'Turn Off Light' : 'Turn On Light';
  }
}
