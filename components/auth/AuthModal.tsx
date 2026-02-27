/**
 * Authentication Modal Component
 *
 * Full-screen modal with Sign In / Create Account tabs.
 * Provides complete authentication UI with OAuth buttons and email form.
 *
 * Features:
 * - Full-screen presentation (presentationStyle="fullScreen")
 * - Tab switcher for Sign In / Create Account
 * - OAuth buttons prominent at top
 * - Email form below with "or" divider
 * - Close button top-right
 * - Error message display
 * - Terms and Privacy Policy footer
 *
 * Usage:
 *   const [showAuth, setShowAuth] = useState(false);
 *   <AuthModal
 *     visible={showAuth}
 *     onClose={() => setShowAuth(false)}
 *     initialMode="signIn"
 *   />
 *
 * @module components/auth/AuthModal
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import { OAuthButtons } from './OAuthButtons';
import { EmailAuthForm } from './EmailAuthForm';
import { MigrationScreen } from './MigrationScreen';
import Colors from '@/constants/Colors';
import { usePlantsStore } from '@/stores/plantsStore';
import { hasMigrated } from '@/services/authService';

/**
 * Auth modal props
 */
export interface AuthModalProps {
  /** Modal visibility state */
  visible: boolean;
  /** Close handler - called when user taps close button */
  onClose: () => void;
  /** Initial auth mode - defaults to signIn */
  initialMode?: 'signIn' | 'signUp';
  /** Success callback - called after successful authentication */
  onSuccess?: () => void;
  /** Callback after auth success and optional migration - for parent navigation */
  onSignedIn?: () => void;
}

/**
 * Full-screen authentication modal
 *
 * Displays Sign In / Create Account UI with OAuth and email/password options.
 * Modal covers full screen with tab switcher at top.
 */
export const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onClose,
  initialMode = 'signIn',
  onSuccess,
  onSignedIn,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Current auth mode (signIn or signUp)
  const [mode, setMode] = useState<'signIn' | 'signUp'>(initialMode);

  // Error state - displays at top of modal
  const [error, setError] = useState<string | null>(null);

  // Migration prompt state
  const [showMigration, setShowMigration] = useState(false);

  // Get local plants for migration check
  const localPlants = usePlantsStore((state) => state.plants);

  /**
   * Handle successful authentication
   *
   * Closes modal and calls onSuccess callback.
   * Checks for local plants and migration status, shows migration prompt if needed.
   * Parent component should handle navigation (e.g., to Settings or Community).
   */
  const handleSuccess = async () => {
    setError(null);
    onClose();
    onSuccess?.();

    // Check if user has local plants and hasn't migrated yet
    const hasLocalPlants = localPlants.length > 0;
    const migrated = await hasMigrated();

    if (hasLocalPlants && !migrated) {
      // Show migration prompt
      setShowMigration(true);
    }

    // Call onSignedIn callback for parent navigation
    onSignedIn?.();
  };

  /**
   * Handle authentication errors
   *
   * Displays error message at top of modal.
   * Clears existing error before showing new one.
   */
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  /**
   * Switch between Sign In and Create Account modes
   *
   * Clears error state when switching modes.
   */
  const switchMode = () => {
    setError(null);
    setMode((prev) => (prev === 'signIn' ? 'signUp' : 'signIn'));
  };

  /**
   * Clear error when user dismisses it
   */
  const clearError = () => {
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: colors.background },
        ]}
      >
        {/* Header with close button */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo/Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.tint }]}>
              Plantid
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {mode === 'signIn'
                ? 'Welcome back'
                : 'Join our community of plant lovers'}
            </Text>
          </View>

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}15` }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </Text>
              <TouchableOpacity onPress={clearError} style={styles.errorDismiss}>
                <Ionicons name="close-circle" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}

          {/* Tab switcher */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'signIn' && [
                  styles.activeTab,
                  { borderBottomColor: colors.tint },
                ],
              ]}
              onPress={mode === 'signUp' ? switchMode : undefined}
              disabled={mode === 'signIn'}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'signIn' ? colors.tint : colors.textSecondary },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                mode === 'signUp' && [
                  styles.activeTab,
                  { borderBottomColor: colors.tint },
                ],
              ]}
              onPress={mode === 'signIn' ? switchMode : undefined}
              disabled={mode === 'signUp'}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: mode === 'signUp' ? colors.tint : colors.textSecondary },
                ]}
              >
                Create Account
              </Text>
            </TouchableOpacity>
          </View>

          {/* OAuth Buttons */}
          <View style={styles.section}>
            <OAuthButtons
              mode={mode}
              onError={handleError}
              onSuccess={handleSuccess}
            />
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              or
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Email Form */}
          <View style={styles.section}>
            <EmailAuthForm
              mode={mode}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </View>

          {/* Footer - Terms & Privacy */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              By continuing, you agree to our{' '}
              <Text style={[styles.footerLink, { color: colors.tint }]}>
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={[styles.footerLink, { color: colors.tint }]}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Migration Screen (shown after successful sign-up if user has plants) */}
      <MigrationScreen
        visible={showMigration}
        onComplete={() => {
          setShowMigration(false);
          onSignedIn?.();
        }}
        onSkip={() => {
          setShowMigration(false);
          onSignedIn?.();
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  errorDismiss: {
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    // borderBottomColor set dynamically
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
