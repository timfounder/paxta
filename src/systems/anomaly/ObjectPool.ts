/**
 * A tiny generic object pool. Spawn effects reuse pooled instances instead of
 * allocating (and disposing) every time, which keeps anomaly activations cheap
 * and GC-quiet on mobile. Framework-agnostic — the concrete actuator supplies a
 * `factory` and a `reset`, so it pools meshes, audio voices, or anything.
 */
export class ObjectPool<T> {
  private readonly free: T[] = [];
  private readonly inUse = new Set<T>();

  constructor(
    private readonly factory: () => T,
    private readonly reset: (item: T) => void,
    prewarm = 0,
  ) {
    for (let i = 0; i < prewarm; i += 1) this.free.push(factory());
  }

  /** Take an instance from the pool (creating one if the pool is empty). */
  public acquire(): T {
    const item = this.free.pop() ?? this.factory();
    this.inUse.add(item);
    return item;
  }

  /** Return an instance to the pool, resetting it for reuse. */
  public release(item: T): void {
    if (!this.inUse.delete(item)) return;
    this.reset(item);
    this.free.push(item);
  }

  public get activeCount(): number {
    return this.inUse.size;
  }

  /** Release everything still out, then run `dispose` over every instance. */
  public clear(dispose: (item: T) => void): void {
    for (const item of this.inUse) dispose(item);
    for (const item of this.free) dispose(item);
    this.inUse.clear();
    this.free.length = 0;
  }
}
