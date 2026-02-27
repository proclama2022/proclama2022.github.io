/**
 * Authentication Service
 *
 * Core authentication operations for Plantid v2.0 Community features.
 * Integrates with Supabase Auth for email/password and OAuth sign-in.
 *
 * All functions return structured { success, error?, data? } responses
 * for consistent error handling in UI components.
 *
 * Usage:
 *   import { signUpWithEmail, signInWithEmail } from '@/services/authService';
 *
 *   const result = await signUpWithEmail('user@example.com', 'password123');
 *   if (result.success) {
 *     // Navigate to home or show confirmation message
 *   } else {
 *     // Display result.error to user
 *   }
 *
 * @module services/authService
 */
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

/**
 * Auth operation result type
 *
 * All auth functions return this structure for consistent error handling.
 * success: true if operation succeeded, false if failed
 * error: User-friendly error message (only present if success=false)
 */
type AuthResult = {
  success: boolean;
  error?: string;
};

/**
 * Sign up result with session
 *
 * Returned by signUpWithEmail when email confirmation is not required
 * or when user clicks confirmation link and is redirected to app.
 */
type SignUpResult = AuthResult & {
  requiresConfirmation?: boolean;
  message?: string;
  session?: object; // Supabase Session — using object to avoid circular type import
};

/**
 * Sign in result with session
 *
 * Returned by signInWithEmail on successful authentication.
 */
type SignInResult = AuthResult & {
  session?: object; // Supabase Session
};

/**
 * OAuth sign in result
 *
 * Returned by signInWithGoogle and signInWithApple.
 * URL is the OAuth authorization URL that opens in browser.
 */
type OAuthResult = AuthResult & {
  url?: string;
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Translate Supabase auth errors to user-friendly messages
 *
 * Converts raw Supabase error messages into clear, actionable text
 * for display in the UI. Use this in all auth functions before
 * returning errors.
 *
 * @param error - Error object from Supabase or Error instance
 * @returns User-friendly error message
 *
 * Example:
 *   const message = getAuthErrorMessage(error);
 *   // "Invalid email or password" instead of "Invalid login credentials"
 */
export const getAuthErrorMessage = (error: unknown): string => {
  // Extract error message
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Translate common Supabase errors to user-friendly messages
  switch (errorMessage) {
    case 'Invalid login credentials':
      return 'Invalid email or password';

    case 'Email not confirmed':
      return 'Please check your email for confirmation link';

    case 'User already registered':
      return 'An account with this email already exists';

    case 'Network request failed':
    case 'Failed to fetch':
      return 'Unable to connect. Check your internet connection.';

    case 'Invalid email':
      return 'Please enter a valid email address';

    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters';

    case 'Signups not allowed':
      return 'Account creation is currently disabled';

    case 'Email rate limit exceeded':
      return 'Too many attempts. Please try again later.';

    default:
      // Return original message if no match, or generic error
      return errorMessage || 'An unknown error occurred';
  }
};

/**
 * Clear error state from auth store
 *
 * Removes the current error message from the auth store.
 * Call this before starting a new auth operation or when
 * user dismisses an error message.
 *
 * Example:
 *   clearError(); // Clear previous error before sign in
 *   const result = await signInWithEmail(email, password);
 */
export const clearError = (): void => {
  const { setError } = useAuthStore.getState();
  setError(null);
};

// ============================================================================
// Email/Password Authentication
// ============================================================================

/**
 * Sign up with email and password
 *
 * Creates a new user account with email/password authentication.
 * If email confirmation is enabled in Supabase, user must click link
 * in confirmation email before signing in.
 *
 * @param email - User's email address
 * @param password - User's password (min 6 characters enforced by Supabase)
 * @returns SignUpResult with success status, session (if no confirmation required), or confirmation message
 *
 * Example:
 *   const result = await signUpWithEmail('user@example.com', 'password123');
 *   if (result.success) {
 *     if (result.requiresConfirmation) {
 *       // Show "Check your email for confirmation link" message
 *     } else {
 *       // User is signed in, navigate to home
 *     }
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<SignUpResult> => {
  const supabase = getSupabaseClient();
  const { setLoading, setError } = useAuthStore.getState();

  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'plantidtemp://auth/callback',
      },
    });

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    // Email confirmation required
    if (data.session === null) {
      return {
        success: true,
        requiresConfirmation: true,
        message: 'Check your email for confirmation link',
      };
    }

    // Auto-sign-in successful (email confirmation disabled)
    if (data.session) {
      const { setSession } = useAuthStore.getState();
      setSession(data.session as any); // Cast to avoid circular import
      return { success: true, session: data.session };
    }

    // Fallback (should not happen)
    return {
      success: true,
      requiresConfirmation: true,
      message: 'Account created. Please check your email for confirmation link.',
    };
  } catch (err) {
    const userMessage = getAuthErrorMessage(err);
    setError(userMessage);
    return { success: false, error: userMessage };
  } finally {
    setLoading(false);
  }
};

/**
 * Sign in with email and password
 *
 * Authenticates an existing user with email and password.
 * User must have confirmed their email if confirmation is enabled.
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns SignInResult with success status and session (if successful)
 *
 * Example:
 *   const result = await signInWithEmail('user@example.com', 'password123');
 *   if (result.success) {
 *     // User is signed in, navigate to home
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<SignInResult> => {
  const supabase = getSupabaseClient();
  const { setLoading, setError } = useAuthStore.getState();

  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    if (data.session) {
      const { setSession } = useAuthStore.getState();
      setSession(data.session as any); // Cast to avoid circular import
      return { success: true, session: data.session };
    }

    // Fallback (should not happen)
    return { success: false, error: 'Sign in failed. Please try again.' };
  } catch (err) {
    const userMessage = getAuthErrorMessage(err);
    setError(userMessage);
    return { success: false, error: userMessage };
  } finally {
    setLoading(false);
  }
};

/**
 * Reset password via email
 *
 * Sends a password reset email to the user. User clicks link in email
 * to set a new password. Link redirects to app with deep link.
 *
 * @param email - User's email address
 * @returns AuthResult with success status and message
 *
 * Example:
 *   const result = await resetPassword('user@example.com');
 *   if (result.success) {
 *     // Show "Password reset email sent. Check your inbox." message
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const resetPassword = async (email: string): Promise<AuthResult> => {
  const supabase = getSupabaseClient();
  const { setError } = useAuthStore.getState();

  setError(null);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'plantidtemp://auth/reset-password',
    });

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    return {
      success: true,
    };
  } catch (err) {
    const userMessage = getAuthErrorMessage(err);
    setError(userMessage);
    return { success: false, error: userMessage };
  }
};

/**
 * Sign out current user
 *
 * Signs out the current user and clears auth state.
 * Session is removed from Supabase and local secure storage.
 *
 * @returns AuthResult with success status
 *
 * Example:
 *   const result = await signOut();
 *   if (result.success) {
 *     // Navigate to sign in screen or show signed out message
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const signOut = async (): Promise<AuthResult> => {
  const supabase = getSupabaseClient();
  const { clearAuth, setError } = useAuthStore.getState();

  setError(null);

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    // Clear auth state from store
    clearAuth();

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    setError(errorMessage);
    return { success: false, error: errorMessage };
  }
};

// ============================================================================
// OAuth Authentication
// ============================================================================

/**
 * Sign in with Google OAuth
 *
 * Initiates Google OAuth sign-in flow. User is redirected to Google's
 * authorization page in browser, then redirected back to app with session.
 *
 * OAuth flow:
 * 1. User taps "Sign in with Google" button
 * 2. This function returns Google OAuth URL
 * 3. App opens URL in browser (user completes sign-in on Google's page)
 * 4. Google redirects to plantidtemp://auth/callback
 * 5. Callback screen (app/auth/callback.tsx) calls getSession() to retrieve session
 *
 * @returns OAuthResult with authorization URL for browser redirect
 *
 * Example:
 *   const result = await signInWithGoogle();
 *   if (result.success && result.url) {
 *     // Open result.url in browser
 *     WebBrowser.openAuthSessionAsync(result.url);
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const signInWithGoogle = async (): Promise<OAuthResult> => {
  const supabase = getSupabaseClient();
  const { setLoading, setError } = useAuthStore.getState();

  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'plantidtemp://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    // Return OAuth URL for browser redirect
    return { success: true, url: data.url };
  } catch (err) {
    const userMessage = getAuthErrorMessage(err);
    setError(userMessage);
    return { success: false, error: userMessage };
  } finally {
    setLoading(false);
  }
};

/**
 * Sign in with Apple OAuth (iOS only)
 *
 * Initiates Apple Sign-In flow. User is redirected to Apple's
 * authorization page, then redirected back to app with session.
 *
 * IMPORTANT: Apple Sign In is required for iOS App Store approval
 * when offering third-party sign-in options (like Google).
 *
 * Only show this button on iOS devices (check Platform.OS === 'ios').
 * Requires Apple Developer account and Supabase Apple provider configuration.
 *
 * OAuth flow:
 * 1. User taps "Sign in with Apple" button (iOS only)
 * 2. This function returns Apple OAuth URL
 * 3. App opens URL in browser (user completes sign-in on Apple's page)
 * 4. Apple redirects to plantidtemp://auth/callback
 * 5. Callback screen (app/auth/callback.tsx) calls getSession() to retrieve session
 *
 * @returns OAuthResult with authorization URL for browser redirect
 *
 * Example:
 *   const result = await signInWithApple();
 *   if (result.success && result.url) {
 *     // Open result.url in browser
 *     WebBrowser.openAuthSessionAsync(result.url);
 *   } else {
 *     // Show error: result.error
 *   }
 */
export const signInWithApple = async (): Promise<OAuthResult> => {
  const supabase = getSupabaseClient();
  const { setLoading, setError } = useAuthStore.getState();

  setLoading(true);
  setError(null);

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'plantidtemp://auth/callback',
      },
    });

    if (error) {
      const userMessage = getAuthErrorMessage(error);
      setError(userMessage);
      return { success: false, error: userMessage };
    }

    // Return OAuth URL for browser redirect
    return { success: true, url: data.url };
  } catch (err) {
    const userMessage = getAuthErrorMessage(err);
    setError(userMessage);
    return { success: false, error: userMessage };
  } finally {
    setLoading(false);
  }
};

/**
 * Get current session from Supabase
 *
 * Retrieves the current active session from Supabase.
 * Used by OAuth callback screen to get session after browser redirect.
 *
 * Also useful for checking if user is authenticated without relying on store.
 *
 * @returns Session object or null if not authenticated, plus error if any
 *
 * Example:
 *   const { session, error } = await getSession();
 *   if (session) {
 *     // User is signed in, update store
 *     useAuthStore.getState().setSession(session);
 *   } else if (error) {
 *     // Handle error
 *   }
 */
export const getSession = async (): Promise<{
  session: object | null;
  error: string | null;
}> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: getAuthErrorMessage(error) };
    }

    return { session: data.session, error: null };
  } catch (err) {
    return { session: null, error: getAuthErrorMessage(err) };
  }
};

// ============================================================================
// Session State Management
// ============================================================================

/**
 * Auth state change listener subscription
 *
 * Returned by initializeAuth() for cleanup. Call unsubscribe() when
 * component unmounts to prevent memory leaks.
 */
type AuthSubscription = {
  unsubscribe: () => void;
};

/**
 * Initialize auth state on app launch
 *
 * Checks for existing session and sets up auth state change listener.
 * Call this in app root layout (app/_layout.tsx) to restore session
 * when app launches and listen for auth changes.
 *
 * Auth state change events:
 * - INITIAL_SESSION: First session check on app launch
 * - SIGNED_IN: User signed in (email/password or OAuth)
 * - SIGNED_OUT: User signed out
 * - TOKEN_REFRESHED: JWT token refreshed automatically
 * - USER_UPDATED: User metadata updated
 *
 * @returns Unsubscribe function for cleanup (call on app unmount)
 *
 * Example:
 *   // In app/_layout.tsx
 *   useEffect(() => {
 *     const unsubscribe = initializeAuth();
 *     return () => unsubscribe?.();
 *   }, []);
 */
export const initializeAuth = (): (() => void) | null => {
  try {
    const supabase = getSupabaseClient();
    const { setSession, clearAuth, setUser } = useAuthStore.getState();

    // Check for existing session on app launch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session as any);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'INITIAL_SESSION':
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            // Set session in store (also updates user from session.user)
            if (session) {
              setSession(session as any);
            }
            break;

          case 'SIGNED_OUT':
            // Clear all auth state
            clearAuth();
            break;

          case 'USER_UPDATED':
            // Update user metadata without changing session
            if (session?.user) {
              setUser(session.user as any);
            }
            break;
        }
      }
    );

    // Return unsubscribe function for cleanup
    return () => {
      subscription.unsubscribe();
    };
  } catch (err) {
    // Supabase not configured or unreachable
    // Continue without auth — v1.x features remain functional
    console.warn('Auth initialization skipped:', err);
    return null;
  }
};

/**
 * Get current authenticated user
 *
 * Convenience getter that returns the current user from auth store.
 * Use this to access user metadata without accessing store directly.
 *
 * @returns User object or null if not authenticated
 *
 * Example:
 *   const user = getCurrentUser();
 *   if (user) {
 *     console.log('Signed in as:', user.email);
 *   }
 */
export const getCurrentUser = (): object | null => {
  return useAuthStore.getState().user;
};

/**
 * Check if user is authenticated
 *
 * Convenience checker that returns true if user has an active session.
 * Use this to gate auth-required features (like community posting).
 *
 * @returns true if user is authenticated, false otherwise
 *
 * Example:
 *   if (isAuthenticated()) {
 *     // Show community features
 *   } else {
 *     // Show sign in prompt
 *   }
 */
export const isAuthenticated = (): boolean => {
  return Boolean(useAuthStore.getState().session);
};
