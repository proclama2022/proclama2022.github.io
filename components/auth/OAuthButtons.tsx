/**
 * OAuth Buttons Component
 *
 * Displays Google and Apple sign-in buttons for OAuth authentication.
 * Apple button only renders on iOS devices (App Store requirement).
 *
 * Features:
 * - Google OAuth button (always shown)
 * - Apple OAuth button (iOS only - Platform.OS === 'ios')
 * - Per-button loading states (one loading doesn't disable both)
 * - Error callback for parent component handling
 * - Disabled state during OAuth operations
 *
 * Usage:
 *   <OAuthButtons
 *     mode="signIn"
 *     onError={(error) => setError(error)}
 *   />
 *
 * @module components/auth/OAuthButtons
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { signInWithGoogle, signInWithApple } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/**
 * OAuth button props
 */
export interface OAuthButtonsProps {
  /** Current auth mode - affects button text (signIn vs signUp) */
  mode: 'signIn' | 'signUp';
  /** Error callback for parent component to display auth errors */
  onError?: (error: string) => void;
  /** Success callback - called after OAuth URL is opened */
  onSuccess?: () => void;
}

/**
 * OAuth provider type for loading state tracking
 */
type OAuthProvider = 'google' | 'apple' | null;

/**
 * OAuth sign-in buttons component
 *
 * Renders Google and Apple (iOS-only) sign-in buttons.
 * Opens OAuth URL in browser when tapped. Callback screen
 * (app/auth/callback.tsx) handles the redirect.
 */
export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  mode,
  onError,
  onSuccess,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Track which provider is currently loading (null = none loading)
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider>(null);

  /**
   * Handle Google sign-in button press
   *
   * Calls signInWithGoogle to get OAuth URL, then opens URL in browser.
   * Sets loading state during operation, calls error/success callbacks.
   */
  const handleGooglePress = async () => {
    setLoadingProvider('google');

    try {
      const result = await signInWithGoogle();

      if (result.success && result.url) {
        // Open OAuth URL in browser
        await Linking.openURL(result.url);
        onSuccess?.();
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (err) {
      // Catch any unexpected errors (network issues, Linking failures, etc.)
      const errorMessage = err instanceof Error ? err.message : 'Failed to open sign-in page';
      onError?.(errorMessage);
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Handle Apple sign-in button press (iOS only)
   *
   * Calls signInWithApple to get OAuth URL, then opens URL in browser.
   * Only shown on iOS devices due to App Store requirements.
   */
  const handleApplePress = async () => {
    setLoadingProvider('apple');

    try {
      const result = await signInWithApple();

      if (result.success && result.url) {
        // Open OAuth URL in browser
        await Linking.openURL(result.url);
        onSuccess?.();
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (err) {
      // Catch any unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to open sign-in page';
      onError?.(errorMessage);
    } finally {
      setLoadingProvider(null);
    }
  };

  /**
   * Check if any OAuth operation is in progress
   * Used to disable both buttons during loading
   */
  const isLoading = loadingProvider !== null;

  /**
   * Determine button text based on auth mode
   */
  const buttonText = mode === 'signIn' ? 'Sign in with' : 'Continue with';

  return (
    <View style={styles.container}>
      {/* Google OAuth Button */}
      <TouchableOpacity
        style={[
          styles.button,
          styles.googleButton,
          { backgroundColor: '#DB4437', opacity: isLoading ? 0.6 : 1 },
        ]}
        onPress={handleGooglePress}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {loadingProvider === 'google' ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Ionicons name="logo-google" size={24} color="#ffffff" />
        )}
        <Text style={styles.buttonText}>
          {buttonText} Google
        </Text>
      </TouchableOpacity>

      {/* Apple OAuth Button (iOS only) */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.appleButton,
            { backgroundColor: '#000000', opacity: isLoading ? 0.6 : 1 },
          ]}
          onPress={handleApplePress}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          {loadingProvider === 'apple' ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Ionicons name="logo-apple" size={24} color="#ffffff" />
          )}
          <Text style={styles.buttonText}>
            {buttonText} Apple
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  googleButton: {
    // Red background for Google
  },
  appleButton: {
    // Black background for Apple
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
