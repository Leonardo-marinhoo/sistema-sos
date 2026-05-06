/**
 * Logger Instance - Singleton
 * Provides a global logger instance for the entire application
 */

import { SystemLogger } from "./system-logger";

let loggerInstance: SystemLogger | null = null;

export function initializeLogger(): SystemLogger {
  if (!loggerInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
    }

    loggerInstance = new SystemLogger(supabaseUrl, supabaseKey);
  }

  return loggerInstance;
}

export function getLogger(): SystemLogger {
  if (!loggerInstance) {
    return initializeLogger();
  }
  return loggerInstance;
}

export { SystemLogger };
export { useLogger } from "./use-logger";
