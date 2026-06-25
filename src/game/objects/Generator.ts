import { ToggleControl } from './ToggleControl';

/**
 * The diesel generator: the power source for the lights wired to it. Mechanically
 * a {@link ToggleControl} — starting it activates its targets, stopping it cuts
 * them — but named and prompted as a generator so the world reads clearly and a
 * future "fuel" or "fault" mechanic has an obvious home.
 */
export class Generator extends ToggleControl {
  public getPrompt(): string {
    return this.active ? 'Stop Generator' : 'Start Generator';
  }
}
