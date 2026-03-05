/**
 * Supabase Likes Queries for Plantid v2.0 Community
 *
 * Type-safe query functions for post likes operations.
 * All functions handle errors and return structured responses.
 *
 * Usage:
 *   import { getPostLikes, getUserLikedPosts, checkUserLikedPost } from '@/lib/supabase/likes';
 *
 *   const likes = await getPostLikes('post-123');
 *   const likedPosts = await getUserLikedPosts('user-123');
 *
 * @module lib/supabase/likes
 */

import { getSupabaseClient } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Like record with user profile data
 *
 * Used for displaying who liked a post.
 */
export interface LikeWithProfile {
  /** User ID who liked the post */
  user_id: string;
  /** When the like was created */
  created_at: string;
  /** Profile of the user who liked */
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

/**
 * Post with author data for liked posts view
 *
 * Used for displaying posts the user has liked.
 */
export interface LikedPostWithAuthor {
  /** Post ID */
  id: string;
  /** Post photo URL */
  photo_url: string;
  /** Plant name if identified */
  plant_name: string | null;
  /** User caption */
  caption: string | null;
  /** Like count on this post */
  like_count: number;
  /** Comment count on this post */
  comment_count: number;
  /** When post was created */
  created_at: string;
  /** When the user liked this post */
  liked_at: string;
  /** Author profile */
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Likes query error
 *
 * Thrown when likes operations fail.
 */
export class LikesError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'LikesError';
  }
}

/**
 * Get user-friendly error message from Supabase error
 */
const getErrorMessage = (error: any): string => {
  if (error?.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// ============================================================================
// Likes Queries
// ============================================================================

/**
 * Get users who liked a post
 *
 * Fetches all users who liked a specific post with their profile data.
 * Ordered by most recent likes first.
 *
 * @param postId - Post ID to fetch likes for
 * @param limit - Maximum number of likes to return (default 50)
 * @param offset - Offset for pagination (default 0)
 * @returns Promise<LikeWithProfile[]> with users who liked the post
 *
 * @throws LikesError if query fails
 *
 * Example:
 *   const likes = await getPostLikes('post-123', 20, 0);
 *   likes.forEach(like => {
 *     console.log(`${like.profiles.display_name} liked this post`);
 *   });
 */
export const getPostLikes = async (
  postId: string,
  limit: number = 50,
  offset: number = 0
): Promise<LikeWithProfile[]> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select(`
        user_id,
        created_at,
        profiles!post_likes_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform Supabase response to our type format
    return (data || []).map((item: any) => ({
      user_id: item.user_id,
      created_at: item.created_at,
      profiles: item.profiles,
    })) as LikeWithProfile[];
  } catch (err) {
    const message = getErrorMessage(err);
    throw new LikesError(`Failed to fetch post likes: ${message}`);
  }
};

/**
 * Get posts that a user has liked
 *
 * Fetches all posts the user has liked with author profile data.
 * Useful for displaying "Liked Posts" section in user profile.
 *
 * @param userId - User ID to fetch liked posts for
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Created_at cursor for pagination (optional)
 * @returns Promise<LikedPostWithAuthor[]> with liked posts
 *
 * @throws LikesError if query fails
 *
 * Example:
 *   const likedPosts = await getUserLikedPosts('user-123');
 *   likedPosts.forEach(post => {
 *     console.log(`${post.profiles.display_name}: ${post.plant_name}`);
 *   });
 */
export const getUserLikedPosts = async (
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<LikedPostWithAuthor[]> => {
  const supabase = getSupabaseClient();

  try {
    // First get the post_ids the user has liked
    let likesQuery = supabase
      .from('post_likes')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      likesQuery = likesQuery.lt('created_at', cursor);
    }

    const { data: likesData, error: likesError } = await likesQuery;

    if (likesError) {
      throw likesError;
    }

    if (!likesData || likesData.length === 0) {
      return [];
    }

    // Then fetch the posts with author data
    const postIds = likesData.map((like) => like.post_id);
    const likeDates = new Map(likesData.map((like) => [like.post_id, like.created_at]));

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        id,
        photo_url,
        plant_name,
        caption,
        like_count,
        comment_count,
        created_at,
        profiles!posts_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .in('id', postIds)
      .eq('is_public', true);

    if (postsError) {
      throw postsError;
    }

    // Map posts with their liked_at dates and preserve order
    const postsMap = new Map(postsData?.map((post: any) => [post.id, post]));
    return postIds
      .map((postId) => {
        const post = postsMap.get(postId);
        if (!post) return null;
        return {
          id: post.id,
          photo_url: post.photo_url,
          plant_name: post.plant_name,
          caption: post.caption,
          like_count: post.like_count,
          comment_count: post.comment_count,
          created_at: post.created_at,
          liked_at: likeDates.get(postId) || '',
          profiles: post.profiles,
        } as LikedPostWithAuthor;
      })
      .filter((post): post is LikedPostWithAuthor => post !== null);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new LikesError(`Failed to fetch liked posts: ${message}`);
  }
};

/**
 * Check if user has liked a post
 *
 * Useful for UI state (show filled vs outline heart icon).
 *
 * @param userId - User ID to check
 * @param postId - Post ID to check
 * @returns Promise<boolean> true if user liked the post
 *
 * @throws LikesError if query fails
 *
 * Example:
 *   const hasLiked = await checkUserLikedPost('user-123', 'post-456');
 *   console.log(hasLiked ? 'Already liked' : 'Not liked yet');
 */
export const checkUserLikedPost = async (
  userId: string,
  postId: string
): Promise<boolean> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('user_id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data !== null;
  } catch (err) {
    const message = getErrorMessage(err);
    throw new LikesError(`Failed to check like status: ${message}`);
  }
};
