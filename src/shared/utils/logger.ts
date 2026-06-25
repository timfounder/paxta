/**
 * Minimal, dependency-free logger with level gating and namespacing.
 *
 * In production only warnings and errors are emitted; debug/info logging is
 * controlled by the `VITE_DEBUG` flag so that verbose tracing can be enabled
 * without a rebuild during QA.
 */
export const LogLevel = {
  Debug: 10,
  Info: 20,
  Warn: 30,
  Error: 40,
  Silent: 100,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  child(namespace: string): Logger;
}

let globalLevel: LogLevel = LogLevel.Info;

/** Set the minimum level emitted by every logger created from this module. */
export const setLogLevel = (level: LogLevel): void => {
  globalLevel = level;
};

const format = (namespace: string, message: string): string => `[PAXTA:${namespace}] ${message}`;

const createLogger = (namespace: string): Logger => ({
  debug(message, ...args) {
    if (globalLevel <= LogLevel.Debug) {
      // eslint-disable-next-line no-console
      console.debug(format(namespace, message), ...args);
    }
  },
  info(message, ...args) {
    if (globalLevel <= LogLevel.Info) {
      // eslint-disable-next-line no-console
      console.info(format(namespace, message), ...args);
    }
  },
  warn(message, ...args) {
    if (globalLevel <= LogLevel.Warn) {
      console.warn(format(namespace, message), ...args);
    }
  },
  error(message, ...args) {
    if (globalLevel <= LogLevel.Error) {
      console.error(format(namespace, message), ...args);
    }
  },
  child(child) {
    return createLogger(`${namespace}:${child}`);
  },
});

/** Root application logger. Create namespaced children via `logger.child(...)`. */
export const logger: Logger = createLogger('app');
