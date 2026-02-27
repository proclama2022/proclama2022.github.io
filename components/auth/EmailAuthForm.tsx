/**
 * Email Authentication Form Component
 *
 * Handles email/password sign-in and sign-up with inline validation.
 * Supports both authentication modes with appropriate button text and
 * forgot password link (sign-in mode only).
 *
 * Features:
 * - Email format validation (RFC 5322 regex)
 * - Password length validation (min 6 characters)
 * - Inline error messages for each field
 * - Loading state with disabled inputs during auth operation
 * - KeyboardAvoidingView for keyboard handling
 * - Forgot password link (sign-in mode)
 *
 * Usage:
 *   <EmailAuthForm
 *     mode="signIn"
 *     onSuccess={() => router.back()}
 *     onError={(error) => setError(error)}
 *   />
 *
 * @module components/auth/EmailAuthForm
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { signUpWithEmail, signInWithEmail, resetPassword } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

/**
 * Email auth form props
 */
export interface EmailAuthFormProps {
  /** Current auth mode - affects button text and forgot password link */
  mode: 'signIn' | 'signUp';
  /** Success callback - called after successful sign-in/sign-up */
  onSuccess?: () => void;
  /** Error callback for parent component to display auth errors */
  onError?: (error: string) => void;
}

/**
 * Form errors object
 */
interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Email and password authentication form
 *
 * Provides sign-in and sign-up functionality with client-side validation.
 * Validates email format and password length before calling auth service.
 */
export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({
  mode,
  onSuccess,
  onError,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Validate email format using RFC 5322-compliant regex
   *
   * Checks for valid email structure (local@domain.tld).
   * Returns true if valid, false otherwise.
   */
  const validateEmail = (email: string): boolean => {
    // RFC 5322-compliant email regex (simplified for practical use)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Validate password length
   *
   * Supabase requires minimum 6 characters.
   * Returns true if valid, false otherwise.
   */
  const validatePassword = (password: string): boolean => {
    return password.length >= 6;
  };

  /**
   * Validate all form fields
   *
   * Runs validation on email and password, sets error messages,
   * returns true if all fields are valid.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate email
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   *
   * Validates form, calls appropriate auth service method based on mode,
   * handles success/error callbacks.
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return; // Don't submit if validation fails
    }

    setIsLoading(true);

    try {
      let result;

      if (mode === 'signUp') {
        // Sign up with email/password
        result = await signUpWithEmail(email.trim(), password);

        if (result.success) {
          if (result.requiresConfirmation) {
            // Email confirmation required - show message
            onError?.(result.message || 'Check your email for confirmation link');
            // Clear form
          } else {
            // Auto-sign-in successful (email confirmation disabled)
            onSuccess?.();
            // Clear form on success
            setEmail('');
            setPassword('');
          }
        } else if (result.error) {
          onError?.(result.error);
        }
      } else {
        // Sign in with email/password
        result = await signInWithEmail(email.trim(), password);

        if (result.success) {
          onSuccess?.();
          // Clear form on success
          setEmail('');
          setPassword('');
        } else if (result.error) {
          onError?.(result.error);
        }
      }
    } catch (err) {
      // Catch any unexpected errors
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle forgot password
   *
   * Sends password reset email to the entered email address.
   * Only available in sign-in mode.
   */
  const handleForgotPassword = async () => {
    // Validate email before sending reset link
    if (!email.trim() || !validateEmail(email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await resetPassword(email.trim());

      if (result.success) {
        // Show success message (parent should display toast/banner)
        onError?.('Password reset email sent. Check your inbox.');
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Determine submit button text based on mode
   */
  const buttonText = mode === 'signIn' ? 'Sign In' : 'Create Account';

  /**
   * Determine if email input has error (for border color)
   */
  const hasEmailError = Boolean(errors.email);
  const hasPasswordError = Boolean(errors.password);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Email Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: hasEmailError ? colors.danger : colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
            },
          ]}
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
          onSubmitEditing={handleSubmit}
        />
        {hasEmailError && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.email}
          </Text>
        )}
      </View>

      {/* Password Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: hasPasswordError ? colors.danger : colors.border,
              backgroundColor: colors.surface,
              color: colors.text,
            },
          ]}
          placeholder="Password (min 6 characters)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoComplete={mode === 'signUp' ? 'password-new' : 'password'}
          textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
          value={password}
          onChangeText={setPassword}
          editable={!isLoading}
          onSubmitEditing={handleSubmit}
        />
        {hasPasswordError && (
          <Text style={[styles.errorText, { color: colors.danger }]}>
            {errors.password}
          </Text>
        )}
      </View>

      {/* Forgot Password Link (sign-in mode only) */}
      {mode === 'signIn' && (
        <TouchableOpacity
          onPress={handleForgotPassword}
          disabled={isLoading}
          style={styles.forgotPasswordContainer}
        >
          <Text style={[styles.forgotPasswordText, { color: colors.tint }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor: isLoading ? colors.textMuted : colors.tint,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 4,
  },
  inputContainer: {
    width: '100%',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
