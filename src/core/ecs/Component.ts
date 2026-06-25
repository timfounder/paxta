import type { Vec3 } from '@shared/types/spatial';

/**
 * Components are plain data containers identified by a string `type`. Behaviour
 * lives in {@link System}s, never on the component itself — this is the core of
 * the data-oriented entity model and keeps entities composable.
 */
export interface Component {
  readonly type: string;
}

/** Spatial placement of an entity. Mutable so movement systems can update it. */
export class TransformComponent implements Component {
  public readonly type = 'transform' as const;

  public x: number;
  public y: number;
  public z: number;
  /** Yaw in radians; the only rotation axis the game needs for now. */
  public rotationY: number;

  constructor(position: Vec3 = { x: 0, y: 0, z: 0 }, rotationY = 0) {
    this.x = position.x;
    this.y = position.y;
    this.z = position.z;
    this.rotationY = rotationY;
  }

  /** Immutable snapshot suitable for events and persistence. */
  public toVec3(): Vec3 {
    return { x: this.x, y: this.y, z: this.z };
  }

  public setPosition(position: Vec3): void {
    this.x = position.x;
    this.y = position.y;
    this.z = position.z;
  }
}

/** Free-form labels used by queries (`'player'`, `'anomaly'`, `'interactable'`). */
export class TagComponent implements Component {
  public readonly type = 'tag' as const;

  private readonly tags: Set<string>;

  constructor(initial: readonly string[] = []) {
    this.tags = new Set(initial);
  }

  public add(tag: string): void {
    this.tags.add(tag);
  }

  public has(tag: string): boolean {
    return this.tags.has(tag);
  }
}

/** A countdown, in seconds, after which the owning entity is removed. */
export class LifetimeComponent implements Component {
  public readonly type = 'lifetime' as const;

  constructor(public remaining: number) {}

  public get expired(): boolean {
    return this.remaining <= 0;
  }
}
