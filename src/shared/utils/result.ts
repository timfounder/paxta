/**
 * A lightweight `Result` type for operations that can fail in expected ways
 * (parsing, persistence, validation). Reserving thrown exceptions for truly
 * exceptional conditions keeps control flow explicit and type-safe.
 */
export type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

/** Narrowing helper for the success branch. */
export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok;

/** Narrowing helper for the failure branch. */
export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => !result.ok;
