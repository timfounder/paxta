/**
 * Parses and validates `import.meta.env` once at startup and exposes a typed,
 * immutable configuration object to the rest of the application. Fail-fast on
 * malformed configuration rather than discovering it deep inside a system.
 */
export type AppEnvironment = 'development' | 'staging' | 'production';

export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly environment: AppEnvironment;
  readonly debug: boolean;
  readonly telegramBotUsername: string;
  readonly supabase: {
    readonly url: string;
    readonly anonKey: string;
    /** True only when both URL and key are present and look usable. */
    readonly isConfigured: boolean;
  };
}

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

const parseEnvironment = (value: string | undefined): AppEnvironment => {
  if (value === 'staging' || value === 'production') return value;
  return 'development';
};

const requireString = (value: string | undefined, key: string, fallback?: string): string => {
  if (value !== undefined && value.length > 0) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
};

const buildConfig = (): AppConfig => {
  const env = import.meta.env;
  const supabaseUrl = env.VITE_SUPABASE_URL ?? '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY ?? '';

  return {
    appName: requireString(env.VITE_APP_NAME, 'VITE_APP_NAME', 'PAXTA'),
    appVersion: requireString(env.VITE_APP_VERSION, 'VITE_APP_VERSION', '0.0.0'),
    environment: parseEnvironment(env.VITE_APP_ENV),
    debug: parseBoolean(env.VITE_DEBUG, import.meta.env.DEV),
    telegramBotUsername: env.VITE_TELEGRAM_BOT_USERNAME ?? '',
    supabase: {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
      isConfigured: supabaseUrl.length > 0 && supabaseAnonKey.length > 0,
    },
  };
};

/** Immutable, validated application configuration. */
export const appConfig: AppConfig = buildConfig();
