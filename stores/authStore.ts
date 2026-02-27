/**
 * Auth State Management with Zustand
 *
 * Centralized authentication state following Plantid's existing store pattern.
 * Manages user session, loading states, and auth errors across the app.
 *
 * Session persistence is handled by Supabase with Expo SecureStore (see lib/supabase/storageAdapter.ts).
 * This store does NOT use persist middleware — session tokens are stored securely by Supabase client.
 *
 * Usage:
 *   import { useAuthStore } from '@/stores/authStore';
 *
 *   const { user, session, isLoading, error } = useAuthStore();
 *   const { setSession, clearAuth, setError } = useAuthStore();
 *
 * @module stores/authStore
 */
import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthState } from '@/types';

/**
 * Auth store hook
 *
 * Provides reactive auth state and actions for authentication management.
 * Components using this hook will re-render when auth state changes.
 *
 * State:
 *   user: Current authenticated user (null if signed out)
 *   session: Supabase session containing JWT and user metadata (null if signed out)
 *   isLoading: Loading state for async auth operations (sign in, sign up, etc.)
 *   error: User-friendly error message (null if no error)
 *
 * Actions:
 *   setUser: Update user state (typically used internally by setSession)
 *   setSession: Update session state and sync user from session.user
 *   setLoading: Set loading state for async operations
 *   setError: Set error message for display in UI
 *   clearAuth: Reset all auth state (used on sign out)
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state — user is not signed in
  user: null,
  session: null,
  isLoading: false,
  error: null,

  /**
   * Set the current user
   *
   * Typically called internally by setSession to sync session.user.
   * Can be used directly when user metadata updates without session change.
   *
   * @param user - Supabase User object or null if signed out
   */
  setUser: (user: User | null) => set({ user }),

  /**
   * Set the current session
   *
   * Updates session state and syncs user from session.user.
   * Call this after successful sign in, sign up, or OAuth callback.
   *
   * @param session - Supabase Session object or null if signed out
   */
  setSession: (session: Session | null) =>
    set({
      session,
      // Sync user from session — session.user contains current user data
      user: session?.user ?? null,
    }),

  /**
   * Set loading state for async operations
   *
   * Set to true before calling auth service (signIn, signUp, etc.).
   * Set to false after operation completes (success or failure).
   *
   * @param isLoading - Loading state (true during auth operations)
   */
  setLoading: (isLoading: boolean) => set({ isLoading }),

  /**
   * Set error message for display in UI
   *
   * Call this when auth operation fails. Error should be user-friendly
   * (not raw Supabase error messages — see authService.getAuthErrorMessage).
   *
   * @param error - Error message string or null to clear error
   */
  setError: (error: string | null) => set({ error }),

  /**
   * Clear all auth state
   *
   * Resets user, session, and error to null.
   * Called on sign out to remove authenticated state.
   */
  clearAuth: () =>
    set({
      user: null,
      session: null,
      error: null,
    }),
}));
