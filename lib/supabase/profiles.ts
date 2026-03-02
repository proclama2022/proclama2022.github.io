/**
 * Supabase Profile Queries for Plantid v2.0 Community
 *
 * Type-safe query functions for user profiles and follow relationships.
 * All functions handle errors and return structured responses.
 *
 * Usage:
 *   import { getProfile, updateProfile, followUser } from '@/lib/supabase/profiles';
 *
 *   const profile = await getProfile('user-123');
 *   await updateProfile('user-123', { display_name: 'Plant Lover' });
 *   await followUser('user-123', 'user-456');
 *
 * @module lib/supabase/profiles
 */

import { getSupabaseClient } from './client';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

/**
 * Profile database record
 *
 * Matches the profiles table schema in Supabase.
 */
export interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Profile with aggregated statistics
 *
 * Extends Profile with follower/following/plant counts.
 * Used for profile display screens.
 */
export interface ProfileWithStats extends Profile {
  /** Number of plants identified by user */
  plants_identified: number;
  /** Number of users following this user */
  followers_count: number;
  /** Number of users this user is following */
  following_count: number;
}

/**
 * Follow relationship record
 *
 * Matches the follows table schema in Supabase.
 */
export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

/**
 * Profile update data
 *
 * Fields that can be updated on a user profile.
 */
export type ProfileUpdate = Partial<Pick<Profile, 'display_name' | 'bio' | 'avatar_url'>>;

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Profile query error
 *
 * Thrown when profile operations fail.
 */
export class ProfileError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ProfileError';
  }
}

/**
 * Get user-friendly error message from Supabase error
 *
 * Converts Supabase error codes to readable messages.
 *
 * @param error - Supabase error object
 * @returns User-friendly error message
 */
const getErrorMessage = (error: any): string => {
  if (error?.code === 'PGRST116') {
    return 'Profile not found';
  }

  if (error?.code === '23505') {
    return 'You are already following this user';
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
};

// ============================================================================
// Profile Queries
// ============================================================================

/**
 * Get profile by user ID
 *
 * Fetches a single profile from the database.
 * Returns null if profile not found (not an error).
 *
 * @param userId - User ID from auth.users
 * @returns Promise<Profile | null> with profile data or null
 *
 * @throws ProfileError if query fails
 *
 * Example:
 *   const profile = await getProfile('user-123');
 *   if (profile) {
 *     console.log(profile.display_name);
 *   }
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Return null for profile not found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to fetch profile: ${message}`);
  }
};

/**
 * Get profile with statistics
 *
 * Fetches profile with aggregated counts for plants, followers, and following.
 * Uses Supabase's join syntax for efficient counting.
 *
 * @param userId - User ID from auth.users
 * @returns Promise<ProfileWithStats | null> with profile and stats or null
 *
 * @throws ProfileError if query fails
 *
 * Example:
 *   const profile = await getProfileWithStats('user-123');
 *   if (profile) {
 *     console.log(`${profile.followers_count} followers`);
 *   }
 */
export const getProfileWithStats = async (userId: string): Promise<ProfileWithStats | null> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        plants_identified:plants(count),
        followers:follows!follows_following_id_fkey(count),
        following:follows!follows_follower_id_fkey(count)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      // Return null for profile not found
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    // Extract counts from Supabase's response format
    // Supabase returns counts as [{ count: number }] or 0
    const plantsIdentified = Array.isArray(data.plants_identified)
      ? data.plants_identified[0]?.count ?? 0
      : 0;

    const followersCount = Array.isArray(data.followers)
      ? data.followers[0]?.count ?? 0
      : 0;

    const followingCount = Array.isArray(data.following)
      ? data.following[0]?.count ?? 0
      : 0;

    return {
      id: data.id,
      display_name: data.display_name,
      bio: data.bio,
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at,
      plants_identified: plantsIdentified,
      followers_count: followersCount,
      following_count: followingCount,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to fetch profile with stats: ${message}`);
  }
};

/**
 * Update profile
 *
 * Updates allowed fields on a user's profile.
 * Only the profile owner can update their own profile (enforced by RLS).
 *
 * @param userId - User ID from auth.users (must match auth.uid())
 * @param updates - Profile fields to update
 * @returns Promise<void> when update completes
 *
 * @throws ProfileError if update fails or user doesn't have permission
 *
 * Example:
 *   await updateProfile('user-123', {
 *     display_name: 'Plant Parent',
 *     bio: 'Love collecting rare monstera varieties'
 *   });
 */
export const updateProfile = async (
  userId: string,
  updates: ProfileUpdate
): Promise<void> => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      throw error;
    }
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to update profile: ${message}`);
  }
};

// ============================================================================
// Follow Queries
// ============================================================================

/**
 * Follow a user
 *
 * Creates a follow relationship from follower to following.
 * Prevents duplicate follows (enforced by primary key constraint).
 * Prevents self-follows (enforced by check constraint).
 *
 * @param followerId - User ID of the follower (must match auth.uid())
 * @param followingId - User ID of the user to follow
 * @returns Promise<Follow> with created follow record
 *
 * @throws ProfileError if follow fails (already following, self-follow, etc.)
 *
 * Example:
 *   await followUser('user-123', 'user-456');
 *   // user-123 now follows user-456
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<Follow> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_id: followerId,
        following_id: followingId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      follower_id: data.follower_id,
      following_id: data.following_id,
      created_at: data.created_at,
    };
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to follow user: ${message}`, err?.code);
  }
};

/**
 * Unfollow a user
 *
 * Removes a follow relationship.
 * Only the follower can unfollow (enforced by RLS).
 *
 * @param followerId - User ID of the follower (must match auth.uid())
 * @param followingId - User ID of the user to unfollow
 * @returns Promise<void> when unfollow completes
 *
 * @throws ProfileError if unfollow fails
 *
 * Example:
 *   await unfollowUser('user-123', 'user-456');
 *   // user-123 no longer follows user-456
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<void> => {
  const supabase = getSupabaseClient();

  try {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);

    if (error) {
      throw error;
    }
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to unfollow user: ${message}`);
  }
};

/**
 * Check if user is following another user
 *
 * Checks for existence of follow relationship.
 * Useful for UI state (show "Follow" vs "Following" button).
 *
 * @param followerId - User ID of the follower
 * @param followingId - User ID of the user to check
 * @returns Promise<boolean> true if following, false otherwise
 *
 * @throws ProfileError if check fails
 *
 * Example:
 *   const isFollowing = await isFollowing('user-123', 'user-456');
 *   if (isFollowing) {
 *     console.log('Already following');
 *   }
 */
export const isFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle(); // Returns null if not found (not an error)

    if (error) {
      throw error;
    }

    return data !== null;
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to check follow status: ${message}`);
  }
};

/**
 * Get followers for a user
 *
 * Fetches all users following the specified user.
 * Useful for displaying followers list on profile.
 *
 * @param userId - User ID to fetch followers for
 * @returns Promise<Profile[]> with follower profiles
 *
 * @throws ProfileError if query fails
 *
 * Example:
 *   const followers = await getFollowers('user-123');
 *   console.log(`${followers.length} followers`);
 */
export const getFollowers = async (userId: string): Promise<Profile[]> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower_id,
        profiles!follows_follower_id_fkey(*)
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Extract profile from nested response
    return data.map((f: any) => f.profiles);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to fetch followers: ${message}`);
  }
};

/**
 * Get following for a user
 *
 * Fetches all users the specified user is following.
 * Useful for displaying following list on profile.
 *
 * @param userId - User ID to fetch following for
 * @returns Promise<Profile[]> with following profiles
 *
 * @throws ProfileError if query fails
 *
 * Example:
 *   const following = await getFollowing('user-123');
 *   console.log(`${following.length} following`);
 */
export const getFollowing = async (userId: string): Promise<Profile[]> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following_id,
        profiles!follows_following_id_fkey(*)
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Extract profile from nested response
    return data.map((f: any) => f.profiles);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new ProfileError(`Failed to fetch following: ${message}`);
  }
};
