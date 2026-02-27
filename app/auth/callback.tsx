/**
 * OAuth Callback Screen
 *
 * Handles OAuth redirect from Google/Apple sign-in flows.
 * After user completes OAuth in browser, they're redirected to
 * this screen via deep link (plantidtemp://auth/callback).
 *
 * Flow:
 * 1. User taps "Sign in with Google/Apple" in AuthModal
 * 2. Browser opens OAuth provider page (Google/Apple)
 * 3. User completes sign-in on provider's page
 * 4. Provider redirects to plantidtemp://auth/callback
 * 5. This screen extracts session from URL parameters
 * 6. Session is stored in authStore and SecureStore
 * 7. User is redirected to main app tabs
 *
 * If error occurs, displays error message and redirects to settings.
 *
 * @module app/auth/callback
 */
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/**
 * OAuth callback screen component
 *
 * Renders loading state while processing OAuth callback,
 * then redirects to appropriate screen based on result.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Local state for error display
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    /**
     * Handle OAuth callback
     *
     * In React Native, Supabase handles OAuth sessions via URL hash fragments.
     * The auth state change listener will capture the session automatically.
     * We just need to wait for the session to be available.
     */
    const handleCallback = async () => {
      try {
        // Get URL from params or Linking
        // When deep link opens app, URL is in params
        // When app is already open, URL is from Linking.getInitialURL()
        const url = params.url
          ? decodeURIComponent(params.url as string)
          : await Linking.getInitialURL();

        if (!url) {
          throw new Error('No callback URL found');
        }

        // Get Supabase client (lazy initialization)
        const supabase = getSupabaseClient();

        // Wait for session - Supabase auto-detects OAuth callback URL
        // In React Native with detectSessionInUrl: false, we need to check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // Success: Store session in authStore
          const { setSession } = useAuthStore.getState();
          setSession(session);

          // Redirect to main app tabs after short delay
          // (allows user to see "Signing you in..." message)
          timeoutId = setTimeout(() => {
            router.replace('/(tabs)');
          }, 1000);
        } else {
          // No session yet - listen for auth state change
          // This handles the case where session isn't immediately available
          const { setSession: setSessionInStore } = useAuthStore.getState();
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
              if (newSession) {
                setSessionInStore(newSession);
                timeoutId = setTimeout(() => {
                  router.replace('/(tabs)');
                }, 1000);
              } else {
                // No session after auth state change
                throw new Error('No session found in callback');
              }
            }
          );

          // Cleanup listener after delay
          setTimeout(() => {
            subscription.unsubscribe();
          }, 5000);
        }
      } catch (err) {
        // Error handling
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to complete sign-in';

        console.error('OAuth callback error:', err);
        setError(errorMessage);

        // Redirect to settings after delay (shows error message)
        timeoutId = setTimeout(() => {
          router.replace('/(tabs)/settings');
        }, 3000);
      } finally {
        setProcessing(false);
      }
    };

    handleCallback();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [params, router]);

  /**
   * Render loading or error state
   *
   * Screen displays while processing OAuth callback.
   * User is automatically redirected when complete.
   */
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {processing ? (
          // Loading state
          <>
            <ActivityIndicator
              size="large"
              color={colors.tint}
              style={styles.spinner}
            />
            <Text style={[styles.message, { color: colors.text }]}>
              Signing you in...
            </Text>
          </>
        ) : error ? (
          // Error state
          <>
            <Text style={[styles.errorTitle, { color: colors.text }]}>
              Sign-in Failed
            </Text>
            <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <Text style={[styles.redirectNote, { color: colors.textMuted }]}>
              Redirecting to settings...
            </Text>
          </>
        ) : (
          // Success state (before redirect)
          <>
            <ActivityIndicator
              size="large"
              color={colors.tint}
              style={styles.spinner}
            />
            <Text style={[styles.message, { color: colors.text }]}>
              Sign-in successful!
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  redirectNote: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
