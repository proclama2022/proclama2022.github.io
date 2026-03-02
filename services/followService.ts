/**
 * Follow Service
 *
 * Business logic layer for follow/unfollow operations.
 * Wraps Supabase queries with validation and structured responses.
 * Prevents self-follows and handles duplicate follows.
 *
 * Features:
 * - Follow/unfollow users
 * - Check follow status
 * - Structured { success, error? } responses
 * - User-friendly error messages
 *
 * @module services/followService
 */

import {
  followUser as followUserQuery,
  unfollowUser as unfollowUserQuery,
  isFollowing as isFollowingQuery,
} from '@/lib/supabase/profiles';

// ============================================================================
// Types
// ============================================================================

/**
 * Follow service result
 *
 * Standard result pattern for follow operations.
 */
export interface FollowServiceResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** User-friendly error message on failure (optional) */
  error?: string;
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  SELF_FOLLOW: 'You cannot follow yourself',
  FOLLOW_FAILED: 'Failed to follow user',
  UNFOLLOW_FAILED: 'Failed to unfollow user',
  CHECK_FAILED: 'Failed to check follow status',
} as const;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Follow a user
 *
 * Algorithm:
 * 1. Validate: followerId !== followingId (can't follow self)
 * 2. Call followUser(followerId, followingId) from Supabase layer
 * 3. On success: Return { success: true }
 * 4. On error: Return { success: false, error: error.message }
 *
 * @param followerId - User ID of the follower
 * @param followingId - User ID of the user to follow
 * @returns Promise<FollowServiceResult> with success status
 *
 * Example:
 *   const result = await followUser('user-123', 'user-456');
 *   if (result.success) {
 *     console.log('Now following user-456');
 *   } else {
 *     console.error(result.error);
 *   }
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<FollowServiceResult> => {
  // Prevent self-follow
  if (followerId === followingId) {
    return {
      success: false,
      error: ERROR_MESSAGES.SELF_FOLLOW,
    };
  }

  try {
    await followUserQuery(followerId, followingId);
    return {
      success: true,
    };
  } catch (err) {
    console.error('Failed to follow user:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.FOLLOW_FAILED,
    };
  }
};

/**
 * Unfollow a user
 *
 * Algorithm:
 * 1. Call unfollowUser(followerId, followingId) from Supabase layer
 * 2. On success: Return { success: true }
 * 3. On error: Return { success: false, error: error.message }
 *
 * @param followerId - User ID of the follower
 * @param followingId - User ID of the user to unfollow
 * @returns Promise<FollowServiceResult> with success status
 *
 * Example:
 *   const result = await unfollowUser('user-123', 'user-456');
 *   if (result.success) {
 *     console.log('Unfollowed user-456');
 *   }
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<FollowServiceResult> => {
  try {
    await unfollowUserQuery(followerId, followingId);
    return {
      success: true,
    };
  } catch (err) {
    console.error('Failed to unfollow user:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.UNFOLLOW_FAILED,
    };
  }
};

/**
 * Check if user is following another user
 *
 * Algorithm:
 * 1. Call isFollowing(followerId, followingId) from Supabase layer
 * 2. Return boolean result
 *
 * @param followerId - User ID of the follower
 * @param followingId - User ID of the user to check
 * @returns Promise<boolean> true if following, false otherwise
 *
 * Example:
 *   const isFollowing = await checkIsFollowing('user-123', 'user-456');
 *   if (isFollowing) {
 *     console.log('Already following');
 *   }
 */
export const checkIsFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  try {
    return await isFollowingQuery(followerId, followingId);
  } catch (err) {
    console.error('Failed to check follow status:', err);
    return false;
  }
};
