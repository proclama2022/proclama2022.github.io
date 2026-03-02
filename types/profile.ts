/**
 * Profile Types
 *
 * TypeScript types for user profiles and social features.
 * Matches Supabase database schema from migrations 001 and 002.
 *
 * @module types/profile
 */

import { User } from '@supabase/supabase-js';

// ============================================================================
// Database Types (match Supabase schema)
// ============================================================================

/**
 * Profile data from Supabase profiles table
 *
 * Matches the profiles table schema from migration 001.
 * One-to-one relationship with auth.users (id references auth.users.id).
 */
export interface Profile {
  /** User ID (references auth.users.id) */
  id: string;
  /** Display name (max 50 chars) */
  display_name: string;
  /** Bio text (max 500 chars, optional) */
  bio: string | null;
  /** Avatar URL from Supabase Storage (optional) */
  avatar_url: string | null;
  /** Profile creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string;
}

/**
 * Profile statistics
 *
 * Aggregated counts for profile display.
 */
export interface ProfileStats {
  /** Number of plants identified by user */
  plants_identified: number;
  /** Number of followers (people following this user) */
  followers_count: number;
  /** Number of following (people this user follows) */
  following_count: number;
}

/**
 * Profile with aggregated statistics
 *
 * Profile data merged with stats for profile screen display.
 * Used for showing user's own profile or viewing other profiles.
 */
export interface ProfileWithStats extends Profile {
  /** Aggregated statistics */
  stats: ProfileStats;
}

/**
 * Follow relationship
 *
 * Represents a follow relationship between two users.
 * Matches the follows table schema from migration 001.
 */
export interface Follow {
  /** User who is following (follower) */
  follower_id: string;
  /** User being followed (following) */
  following_id: string;
  /** When the follow relationship was created */
  created_at: string;
}

// ============================================================================
// Service Layer Types
// ============================================================================

/**
 * Standard service result pattern
 *
 * Used by profileService for consistent error handling.
 * All service functions return this structure.
 */
export interface ServiceResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Returned data on success (optional) */
  data?: T;
  /** User-friendly error message on failure (optional) */
  error?: string;
}

/**
 * Profile update data
 *
 * Fields that can be updated on a profile.
 * All fields are optional - only update what's provided.
 */
export interface ProfileUpdateData {
  /** Display name (max 50 chars) */
  display_name?: string;
  /** Bio text (max 500 chars) */
  bio?: string;
  /** Avatar URL from Supabase Storage */
  avatar_url?: string;
}

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Validation result
 *
 * Returned by validator functions to indicate validity.
 */
export interface ValidationResult {
  /** Whether the value is valid */
  valid: boolean;
  /** Error message if invalid (optional) */
  error?: string;
}

// ============================================================================
// Store Types (Zustand)
// ============================================================================

/**
 * Profile state management
 *
 * Zustand store state for profile data and UI state.
 * Follows the same pattern as authStore.
 */
export interface ProfileState {
  /** Current user's profile with stats */
  currentProfile: ProfileWithStats | null;
  /** Whether profile edit mode is active */
  isEditing: boolean;
  /** Loading state for async operations */
  isLoading: boolean;
  /** Error message for display in UI */
  error: string | null;

  /**
   * Set the current profile
   * @param profile - Profile data or null to clear
   */
  setCurrentProfile: (profile: ProfileWithStats | null) => void;

  /**
   * Set edit mode state
   * @param isEditing - Whether edit mode is active
   */
  setIsEditing: (isEditing: boolean) => void;

  /**
   * Set loading state
   * @param isLoading - Loading state
   */
  setLoading: (isLoading: boolean) => void;

  /**
   * Set error message
   * @param error - Error message or null to clear
   */
  setError: (error: string | null) => void;

  /**
   * Clear all profile state
   * Resets current profile and error to null
   */
  clearProfile: () => void;

  /**
   * Fetch current user's profile from Supabase
   * @param userId - User ID to fetch profile for
   */
  fetchCurrentProfile: (userId: string) => Promise<void>;

  /**
   * Update profile fields
   * @param updates - Fields to update (display_name, bio)
   */
  updateProfile: (updates: { display_name?: string; bio?: string }) => Promise<void>;

  /**
   * Upload avatar from gallery or camera
   * @param source - Avatar source ('gallery' or 'camera')
   */
  uploadAvatar: (source: 'gallery' | 'camera') => Promise<void>;

  /**
   * Refresh profile statistics
   * Re-fetches profile to update stats
   */
  refreshStats: () => Promise<void>;
}

// ============================================================================
// Avatar Upload Types (re-export from avatarService)
// ============================================================================

/**
 * Avatar upload result
 *
 * Returned after successful avatar upload to Supabase Storage.
 */
export interface AvatarUploadResult {
  /** Public URL of uploaded avatar with transformations */
  publicUrl: string;
  /** Storage file path (e.g., user-123/avatar_1234567890.jpg) */
  filePath: string;
}

/**
 * Avatar source type
 *
 * Determines whether to launch gallery picker or camera.
 */
export type AvatarSource = 'gallery' | 'camera';

/**
 * Avatar upload options
 *
 * Configuration for avatar upload behavior.
 */
export interface AvatarUploadOptions {
  /** Source for avatar image (gallery or camera) */
  source: AvatarSource;
  /** Maximum file size in bytes (default: 2MB) */
  maxSize?: number;
}
