/// <reference types="vite/client" />

/**
 * Strongly-typed environment variables exposed to the client bundle.
 * Only `VITE_`-prefixed variables are available at runtime.
 */
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production';
  readonly VITE_DEBUG: string;
  readonly VITE_TELEGRAM_BOT_USERNAME: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
