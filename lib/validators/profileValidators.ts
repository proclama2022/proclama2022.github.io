/**
 * Profile Validators
 *
 * Validation functions for profile data.
 * Used by profileService to ensure data integrity before database updates.
 *
 * Features:
 * - Display name validation (max 50 chars, not empty)
 * - Bio validation (max 500 chars, can be empty)
 * - User-friendly error messages
 *
 * @module lib/validators/profileValidators
 */

import type { ValidationResult } from '@/types/profile';

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  DISPLAY_NAME_EMPTY: 'Display name is required',
  DISPLAY_NAME_TOO_LONG: 'Display name must be 50 characters or less',
  BIO_TOO_LONG: 'Bio must be 500 characters or less',
} as const;

// ============================================================================
// Validators
// ============================================================================

/**
 * Validate display name
 *
 * Checks that display name:
 * - Is not empty after trimming whitespace
 * - Is 50 characters or less
 *
 * No uniqueness validation — display name is only for display,
 * not a unique handle/username.
 *
 * @param name - Display name to validate
 * @returns ValidationResult with valid flag and optional error message
 *
 * Example:
 *   const result = validateDisplayName('Jane Doe');
 *   if (result.valid) {
 *     console.log('Valid display name');
 *   } else {
 *     console.error(result.error); // "Display name must be 50 characters or less"
 *   }
 */
export const validateDisplayName = (name: string): ValidationResult => {
  const trimmed = name.trim();

  // Check if empty after trimming
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: ERROR_MESSAGES.DISPLAY_NAME_EMPTY,
    };
  }

  // Check max length
  if (trimmed.length > 50) {
    return {
      valid: false,
      error: ERROR_MESSAGES.DISPLAY_NAME_TOO_LONG,
    };
  }

  return {
    valid: true,
  };
};

/**
 * Validate bio
 *
 * Checks that bio is 500 characters or less.
 * Bio can be empty or null — not a required field.
 *
 * @param bio - Bio text to validate
 * @returns ValidationResult with valid flag and optional error message
 *
 * Example:
 *   const result = validateBio('Plant enthusiast from Italy');
 *   if (result.valid) {
 *     console.log('Valid bio');
 *   } else {
 *     console.error(result.error); // "Bio must be 500 characters or less"
 *   }
 */
export const validateBio = (bio: string): ValidationResult => {
  // Bio can be empty
  if (!bio || bio.length === 0) {
    return {
      valid: true,
    };
  }

  // Check max length
  if (bio.length > 500) {
    return {
      valid: false,
      error: ERROR_MESSAGES.BIO_TOO_LONG,
    };
  }

  return {
    valid: true,
  };
};
