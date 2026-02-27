/**
 * Lazy-initialized Supabase client for Plantid v2.0 Community
 *
 * This module provides a singleton Supabase client that initializes on first call.
 * Lazy initialization ensures the app launches immediately without waiting for
 * Supabase network calls, preserving the offline-first experience for v1.x features.
 *
 * Usage:
 *   import { getSupabaseClient } from '@/lib/supabase/client';
 *   const supabase = getSupabaseClient();
 *
 * The client is created once on first call and reused for subsequent calls.
 * Session tokens are stored securely using Expo SecureStore (see storageAdapter.ts).
 *
 * @module lib/supabase/client
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { secureAdapter } from './storageAdapter';

/**
 * Module-level singleton instance
 * Null until first call to getSupabaseClient()
 */
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create the Supabase client singleton
 *
 * Lazy initialization pattern:
 * - First call: Creates Supabase client with environment variables
 * - Subsequent calls: Returns cached instance (no-op)
 *
 * Environment variables required:
 * - EXPO_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - EXPO_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 *
 * Throws Error if environment variables are missing.
 *
 * @returns SupabaseClient instance
 * @throws Error if Supabase environment variables are not configured
 */
export const getSupabaseClient = (): SupabaseClient => {
  // Return cached instance if already initialized
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Read environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // Validate environment variables
  if (!supabaseUrl) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL environment variable. ' +
      'Add it to your .env file: EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Add it to your .env file: EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here'
    );
  }

  // Create Supabase client with auth configuration
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: secureAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Handle OAuth redirects manually in callback screen
    },
  });

  return supabaseInstance;
};

/**
 * Export SupabaseClient type for use in other modules
 */
export type { SupabaseClient } from '@supabase/supabase-js';
