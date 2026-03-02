/**
 * Profile Service
 *
 * Business logic layer for profile operations.
 * Wraps Supabase queries with validation, error handling, and structured responses.
 * Integrates with avatar upload service for profile picture updates.
 *
 * Features:
 * - Profile CRUD operations with validation
 * - Avatar upload with profile update
 * - Structured { success, data?, error? } responses
 * - User-friendly error messages
 *
 * @module services/profileService
 */

import { uploadAvatar } from './avatarService';
import {
  getProfile,
  getProfileWithStats,
  updateProfile as updateProfileQuery,
} from '@/lib/supabase/profiles';
import { validateDisplayName, validateBio } from '@/lib/validators/profileValidators';
import type {
  Profile,
  ProfileWithStats,
  ProfileUpdateData,
  ServiceResult,
  AvatarSource,
} from '@/types/profile';

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  NOT_FOUND: 'Profile not found',
  UPDATE_FAILED: 'Failed to update profile',
  AVATAR_UPLOAD_FAILED: 'Failed to upload avatar',
} as const;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Fetch profile by user ID
 *
 * Algorithm:
 * 1. Call getProfileWithStats(userId) from Supabase layer
 * 2. On success: Return { success: true, data: profile }
 * 3. On not found: Return { success: false, error: 'Profile not found' }
 * 4. On error: Return { success: false, error: error.message }
 *
 * @param userId - User ID to fetch profile for
 * @returns Promise<ServiceResult<ProfileWithStats>> with profile or error
 *
 * Example:
 *   const result = await fetchProfile('user-123');
 *   if (result.success && result.data) {
 *     console.log(result.data.display_name);
 *   } else {
 *     console.error(result.error);
 *   }
 */
export const fetchProfile = async (
  userId: string
): Promise<ServiceResult<ProfileWithStats>> => {
  try {
    const profile = await getProfileWithStats(userId);

    if (!profile) {
      return {
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (err) {
    console.error('Failed to fetch profile:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.NOT_FOUND,
    };
  }
};

/**
 * Update profile fields
 *
 * Algorithm:
 * 1. Validate inputs:
 *    - display_name max 50 chars, not empty after trim
 *    - bio max 500 chars
 * 2. Call updateProfile(userId, updates) from Supabase layer
 * 3. On success: Fetch updated profile and return with data
 * 4. On error: Return error result
 *
 * @param userId - User ID to update profile for
 * @param updates - Fields to update (display_name, bio)
 * @returns Promise<ServiceResult<Profile>> with updated profile or error
 *
 * Example:
 *   const result = await updateProfile('user-123', {
 *     display_name: 'Jane Doe',
 *     bio: 'Plant enthusiast',
 *   });
 *   if (result.success && result.data) {
 *     console.log('Updated:', result.data.display_name);
 *   }
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdateData
): Promise<ServiceResult<Profile>> => {
  // Validate display_name if provided
  if (updates.display_name !== undefined) {
    const nameValidation = validateDisplayName(updates.display_name);
    if (!nameValidation.valid) {
      return {
        success: false,
        error: nameValidation.error,
      };
    }
  }

  // Validate bio if provided
  if (updates.bio !== undefined) {
    const bioValidation = validateBio(updates.bio);
    if (!bioValidation.valid) {
      return {
        success: false,
        error: bioValidation.error,
      };
    }
  }

  try {
    await updateProfileQuery(userId, updates);

    // Fetch updated profile to return
    const updatedProfile = await getProfile(userId);

    if (!updatedProfile) {
      return {
        success: false,
        error: ERROR_MESSAGES.NOT_FOUND,
      };
    }

    return {
      success: true,
      data: updatedProfile,
    };
  } catch (err) {
    console.error('Failed to update profile:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.UPDATE_FAILED,
    };
  }
};

/**
 * Upload avatar and update profile
 *
 * Algorithm:
 * 1. Call uploadAvatar(userId, { source }) from avatarService
 * 2. If upload fails, return error result
 * 3. If upload returns null (user cancelled), return { success: true, data: '' }
 * 4. Call updateProfile(userId, { avatar_url: publicUrl })
 * 5. Return success with public URL
 *
 * @param userId - User ID to upload avatar for
 * @param source - Avatar source ('gallery' or 'camera')
 * @returns Promise<ServiceResult<string>> with public URL or error
 *
 * Example:
 *   const result = await uploadAvatarAndUpdateProfile('user-123', 'gallery');
 *   if (result.success && result.data) {
 *     console.log('Avatar uploaded:', result.data);
 *   } else if (result.error) {
 *     console.error('Failed:', result.error);
 *   } else {
 *     console.log('User cancelled');
 *   }
 */
export const uploadAvatarAndUpdateProfile = async (
  userId: string,
  source: AvatarSource
): Promise<ServiceResult<string>> => {
  try {
    // Upload avatar
    const publicUrl = await uploadAvatar(userId, { source });

    // If user cancelled, return success with empty URL
    if (publicUrl === null) {
      return {
        success: true,
        data: '',
      };
    }

    // Update profile with new avatar URL
    const updateResult = await updateProfile(userId, { avatar_url: publicUrl });

    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error || ERROR_MESSAGES.AVATAR_UPLOAD_FAILED,
      };
    }

    return {
      success: true,
      data: publicUrl,
    };
  } catch (err) {
    console.error('Failed to upload avatar:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.AVATAR_UPLOAD_FAILED,
    };
  }
};
