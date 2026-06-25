import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { appConfig } from '@app/config/env';
import { logger } from '@shared/utils/logger';

/**
 * Supabase access point. The backend is *prepared* but intentionally not yet
 * wired into gameplay — the client is created lazily and only when valid
 * credentials are configured, so the app runs fully offline until the
 * persistence/leaderboard layer is implemented against this client.
 */
let client: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => appConfig.supabase.isConfigured;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!appConfig.supabase.isConfigured) {
    return null;
  }
  if (client === null) {
    client = createClient(appConfig.supabase.url, appConfig.supabase.anonKey, {
      auth: { persistSession: false },
    });
    logger.child('supabase').info('Client initialised');
  }
  return client;
};
