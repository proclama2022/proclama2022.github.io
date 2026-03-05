/**
 * Like Service
 *
 * Business logic layer for like operations.
 * Wraps Supabase queries with validation and structured responses.
 *
 * Features:
 * - Get users who liked a post
 * - Get posts the user has liked
 * - Check like status
 * - Structured { success, data?, error? } responses
 *
 * @module services/likeService
 */

import {
  getPostLikes as getPostLikesQuery,
  getUserLikedPosts as getUserLikedPostsQuery,
  checkUserLikedPost as checkUserLikedPostQuery,
  LikeWithProfile,
  LikedPostWithAuthor,
} from '@/lib/supabase/likes';

// ============================================================================
// Types
// ============================================================================

/**
 * Like service result with data
 *
 * Standard result pattern for like operations that return data.
 */
export interface LikeServiceResult<T> {
  /** Whether the operation succeeded */
  success: boolean;
  /** Data on success (optional) */
  data?: T;
  /** User-friendly error message on failure (optional) */
  error?: string;
}

// Re-export types from lib/supabase/likes for convenience
export type { LikeWithProfile, LikedPostWithAuthor };

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES = {
  LIKES_FETCH_FAILED: 'Failed to load likes',
  LIKED_POSTS_FAILED: 'Failed to load liked posts',
  CHECK_FAILED: 'Failed to check like status',
} as const;

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Get users who liked a post
 *
 * Algorithm:
 * 1. Call getPostLikes(postId, limit, offset) from Supabase layer
 * 2. On success: Return { success: true, data: likes }
 * 3. On error: Return { success: false, error: error.message }
 *
 * @param postId - Post ID to fetch likes for
 * @param limit - Maximum number of likes to return (default 50)
 * @param offset - Offset for pagination (default 0)
 * @returns Promise<LikeServiceResult<LikeWithProfile[]>> with likes list
 *
 * Example:
 *   const result = await getPostLikesList('post-123');
 *   if (result.success && result.data) {
 *     result.data.forEach(like => {
 *       console.log(like.profiles.display_name);
 *     });
 *   }
 */
export const getPostLikesList = async (
  postId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LikeServiceResult<LikeWithProfile[]>> => {
  try {
    const likes = await getPostLikesQuery(postId, limit, offset);
    return {
      success: true,
      data: likes,
    };
  } catch (err) {
    console.error('Failed to fetch post likes:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.LIKES_FETCH_FAILED,
    };
  }
};

/**
 * Get posts the user has liked
 *
 * Algorithm:
 * 1. Call getUserLikedPosts(userId, limit, cursor) from Supabase layer
 * 2. On success: Return { success: true, data: posts }
 * 3. On error: Return { success: false, error: error.message }
 *
 * @param userId - User ID to fetch liked posts for
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Created_at cursor for pagination (optional)
 * @returns Promise<LikeServiceResult<LikedPostWithAuthor[]>> with liked posts
 *
 * Example:
 *   const result = await getLikedPosts('user-123');
 *   if (result.success && result.data) {
 *     console.log(`${result.data.length} liked posts`);
 *   }
 */
export const getLikedPosts = async (
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<LikeServiceResult<LikedPostWithAuthor[]>> => {
  try {
    const posts = await getUserLikedPostsQuery(userId, limit, cursor);
    return {
      success: true,
      data: posts,
    };
  } catch (err) {
    console.error('Failed to fetch liked posts:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : ERROR_MESSAGES.LIKED_POSTS_FAILED,
    };
  }
};

/**
 * Check if user has liked a post
 *
 * Algorithm:
 * 1. Call checkUserLikedPost(userId, postId) from Supabase layer
 * 2. Return boolean result
 *
 * @param userId - User ID to check
 * @param postId - Post ID to check
 * @returns Promise<boolean> true if user liked the post
 *
 * Example:
 *   const hasLiked = await checkLiked('user-123', 'post-456');
 *   if (hasLiked) {
 *     console.log('User already liked this post');
 *   }
 */
export const checkLiked = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  try {
    return await checkUserLikedPostQuery(userId, postId);
  } catch (err) {
    console.error('Failed to check like status:', err);
    return false;
  }
};
