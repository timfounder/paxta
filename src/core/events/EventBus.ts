/**
 * A generic, strongly-typed publish/subscribe bus. It has zero domain
 * knowledge — the concrete event map is supplied by the consumer — which keeps
 * the core decoupled from any specific game system (Dependency Inversion).
 */
export type EventHandler<TPayload> = (payload: TPayload) => void;

export type Unsubscribe = () => void;

/** The read/subscribe surface, handed to consumers that must not emit. */
export interface ReadonlyEventBus<TEventMap> {
  on<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): Unsubscribe;
  once<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): Unsubscribe;
  off<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): void;
}

/** The full bus surface, including emission. */
export interface EventBus<TEventMap> extends ReadonlyEventBus<TEventMap> {
  emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void;
  clear(): void;
}

export class TypedEventBus<TEventMap> implements EventBus<TEventMap> {
  private readonly handlers = new Map<keyof TEventMap, Set<EventHandler<unknown>>>();

  public on<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): Unsubscribe {
    const set = this.handlers.get(event) ?? new Set<EventHandler<unknown>>();
    set.add(handler as EventHandler<unknown>);
    this.handlers.set(event, set);
    return () => this.off(event, handler);
  }

  public once<K extends keyof TEventMap>(
    event: K,
    handler: EventHandler<TEventMap[K]>,
  ): Unsubscribe {
    const wrapped: EventHandler<TEventMap[K]> = (payload) => {
      this.off(event, wrapped);
      handler(payload);
    };
    return this.on(event, wrapped);
  }

  public off<K extends keyof TEventMap>(event: K, handler: EventHandler<TEventMap[K]>): void {
    const set = this.handlers.get(event);
    if (!set) return;
    set.delete(handler as EventHandler<unknown>);
    if (set.size === 0) this.handlers.delete(event);
  }

  public emit<K extends keyof TEventMap>(event: K, payload: TEventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    // Iterate a copy so handlers can safely unsubscribe during dispatch.
    for (const handler of [...set]) {
      (handler as EventHandler<TEventMap[K]>)(payload);
    }
  }

  public clear(): void {
    this.handlers.clear();
  }
}
