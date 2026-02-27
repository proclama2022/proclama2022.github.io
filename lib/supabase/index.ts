/**
 * Supabase integration for Plantid v2.0 Community
 *
 * This module exports the lazy-initialized Supabase client and secure storage adapter.
 * All auth and database operations should use getSupabaseClient() to access the client.
 *
 * Usage:
 *   import { getSupabaseClient } from '@/lib/supabase';
 *   const supabase = getSupabaseClient();
 *
 * @module lib/supabase
 */

// Client exports
export { getSupabaseClient } from './client';
export type { SupabaseClient } from './client';

// Storage adapter exports
export { secureAdapter } from './storageAdapter';
