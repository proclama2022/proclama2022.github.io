/**
 * Supabase Posts Queries for Plantid v2.0 Community
 *
 * Type-safe query functions for community feed operations.
 * All functions handle errors and return structured responses.
 *
 * Usage:
 *   import { getFollowingFeed, getRecentFeed, getPopularFeed } from '@/lib/supabase/posts';
 *
 *   const feed = await getRecentFeed(20);
 *   const following = await getFollowingFeed(userId);
 *
 * @module lib/supabase/posts
 */

import { getSupabaseClient } from './client';

// ============================================================================
// Types
// ============================================================================

/**
 * Post with author profile data
 *
 * Used for displaying posts in the community feed.
 */
export interface PostWithAuthor {
  /** Post ID */
  id: string;
  /** Author user ID */
  user_id: string;
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
  /** Whether post is public */
  is_public: boolean;
  /** When post was created */
  created_at: string;
  /** When post was last updated */
  updated_at: string;
  /** Author profile */
  profiles: {
    id: string;
    display_name: string;
    avatar_url: string | null;
    /** League tier for badge display (optional - requires join with user_progress) */
    league_tier?: string;
  };
  /** Whether current user has liked this post */
  is_liked?: boolean;
  /** Whether current user follows the author */
  is_followed?: boolean;
}

/**
 * Feed filter type
 */
export type FeedFilter = 'recent' | 'popular' | 'following';

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Posts query error
 *
 * Thrown when posts operations fail.
 */
export class PostsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'PostsError';
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

/**
 * Enrich posts with like and follow status for current user
 */
const enrichPostInteractions = async (
  posts: PostWithAuthor[],
  currentUserId?: string
): Promise<PostWithAuthor[]> => {
  if (!currentUserId || posts.length === 0) {
    return posts.map((p) => ({ ...p, is_liked: false, is_followed: false }));
  }

  const supabase = getSupabaseClient();
  const postIds = posts.map((p) => p.id);
  // Get unique author IDs to check follow status
  const authorIds = [...new Set(posts.map((p) => p.user_id))];

  // Run both queries in parallel
  const [likesResponse, followsResponse] = await Promise.all([
    supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds),
    supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', currentUserId)
      .in('following_id', authorIds),
  ]);

  const likedPostIds = new Set((likesResponse.data || []).map((l: any) => l.post_id));
  const followedUserIds = new Set((followsResponse.data || []).map((f: any) => f.following_id));

  return posts.map((p) => ({
    ...p,
    is_liked: likedPostIds.has(p.id),
    is_followed: followedUserIds.has(p.user_id),
  }));
};

// ============================================================================
// Feed Queries
// ============================================================================

/**
 * Get posts from followed users (Following feed)
 *
 * Fetches posts from users that the current user follows,
 * plus the user's own posts.
 *
 * @param userId - Current user ID
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Created_at cursor for pagination (optional)
 * @returns Promise<PostWithAuthor[]> with posts from followed users
 *
 * @throws PostsError if query fails
 *
 * Example:
 *   const feed = await getFollowingFeed('user-123', 20);
 *   feed.forEach(post => {
 *     console.log(`${post.profiles.display_name}: ${post.plant_name}`);
 *   });
 */
export const getFollowingFeed = async (
  userId: string,
  limit: number = 20,
  cursor?: string
): Promise<PostWithAuthor[]> => {
  const supabase = getSupabaseClient();

  try {
    // Use the database function for following feed
    const { data, error } = await supabase
      .rpc('get_following_feed_posts', {
        p_user_id: userId,
        p_limit: limit,
        p_cursor: cursor || null,
      });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Now fetch profiles for each post
    const userIds = [...new Set(data.map((post: any) => post.user_id))];

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    const profilesMap = new Map(profilesData?.map((p) => [p.id, p]));

    // Combine posts with profiles
    const posts = data.map((post: any) => ({
      id: post.id,
      user_id: post.user_id,
      photo_url: post.photo_url,
      plant_name: post.plant_name,
      caption: post.caption,
      like_count: post.like_count,
      comment_count: post.comment_count,
      is_public: post.is_public,
      created_at: post.created_at,
      updated_at: post.updated_at,
      profiles: profilesMap.get(post.user_id) || {
        id: post.user_id,
        display_name: 'Unknown',
        avatar_url: null,
      },
    })) as PostWithAuthor[];

    return enrichPostInteractions(posts, userId);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new PostsError(`Failed to fetch following feed: ${message}`);
  }
};

/**
 * Get recent posts (Recent feed)
 *
 * Fetches all public posts ordered by creation date, newest first.
 *
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Created_at cursor for pagination (optional)
 * @returns Promise<PostWithAuthor[]> with recent posts
 *
 * @throws PostsError if query fails
 *
 * Example:
 *   const feed = await getRecentFeed(20);
 *   feed.forEach(post => {
 *     console.log(`${post.profiles.display_name}: ${post.caption}`);
 *   });
 */
export const getRecentFeed = async (
  limit: number = 20,
  cursor?: string,
  currentUserId?: string
): Promise<PostWithAuthor[]> => {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        photo_url,
        plant_name,
        caption,
        like_count,
        comment_count,
        is_public,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to our type format
    const posts = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      photo_url: item.photo_url,
      plant_name: item.plant_name,
      caption: item.caption,
      like_count: item.like_count,
      comment_count: item.comment_count,
      is_public: item.is_public,
      created_at: item.created_at,
      updated_at: item.updated_at,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    })) as PostWithAuthor[];

    return enrichPostInteractions(posts, currentUserId);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new PostsError(`Failed to fetch recent feed: ${message}`);
  }
};

/**
 * Get popular posts (Popular feed)
 *
 * Fetches public posts from the last 7 days ordered by like count.
 *
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Like_count + created_at cursor for pagination (optional, format: "count_timestamp")
 * @returns Promise<PostWithAuthor[]> with popular posts
 *
 * @throws PostsError if query fails
 *
 * Example:
 *   const feed = await getPopularFeed(20);
 *   feed.forEach(post => {
 *     console.log(`${post.plant_name}: ${post.like_count} likes`);
 *   });
 */
export const getPopularFeed = async (
  limit: number = 20,
  cursor?: string,
  currentUserId?: string
): Promise<PostWithAuthor[]> => {
  const supabase = getSupabaseClient();

  try {
    // Get date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        photo_url,
        plant_name,
        caption,
        like_count,
        comment_count,
        is_public,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('is_public', true)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // Cursor format: "likeCount_createdAt" for combined ordering
    if (cursor) {
      const [likeCountStr, createdAt] = cursor.split('_');
      const likeCount = parseInt(likeCountStr, 10);
      // Use composite cursor: posts with lower like_count OR same like_count but older
      query = query.or(`like_count.lt.${likeCount},and(like_count.eq.${likeCount},created_at.lt.${createdAt})`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform to our type format
    const posts = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      photo_url: item.photo_url,
      plant_name: item.plant_name,
      caption: item.caption,
      like_count: item.like_count,
      comment_count: item.comment_count,
      is_public: item.is_public,
      created_at: item.created_at,
      updated_at: item.updated_at,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    })) as PostWithAuthor[];

    return enrichPostInteractions(posts, currentUserId);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new PostsError(`Failed to fetch popular feed: ${message}`);
  }
};

/**
 * Get a single post by ID
 *
 * @param postId - Post ID to fetch
 * @returns Promise<PostWithAuthor | null> with post data or null if not found
 *
 * @throws PostsError if query fails
 */
export const getPostById = async (
  postId: string,
  currentUserId?: string
): Promise<PostWithAuthor | null> => {
  const supabase = getSupabaseClient();

  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        photo_url,
        plant_name,
        caption,
        like_count,
        comment_count,
        is_public,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    const post = {
      id: data.id,
      user_id: data.user_id,
      photo_url: data.photo_url,
      plant_name: data.plant_name,
      caption: data.caption,
      like_count: data.like_count,
      comment_count: data.comment_count,
      is_public: data.is_public,
      created_at: data.created_at,
      updated_at: data.updated_at,
      profiles: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
    } as PostWithAuthor;

    const enriched = await enrichPostInteractions([post], currentUserId);
    return enriched[0];
  } catch (err) {
    const message = getErrorMessage(err);
    throw new PostsError(`Failed to fetch post: ${message}`);
  }
};

/**
 * Get posts by user ID
 *
 * @param userId - User ID to fetch posts for
 * @param limit - Maximum number of posts to return (default 20)
 * @param cursor - Created_at cursor for pagination (optional)
 * @returns Promise<PostWithAuthor[]> with user's posts
 *
 * @throws PostsError if query fails
 */
export const getUserPosts = async (
  userId: string,
  limit: number = 20,
  cursor?: string,
  currentUserId?: string
): Promise<PostWithAuthor[]> => {
  const supabase = getSupabaseClient();

  try {
    let query = supabase
      .from('posts')
      .select(`
        id,
        user_id,
        photo_url,
        plant_name,
        caption,
        like_count,
        comment_count,
        is_public,
        created_at,
        updated_at,
        profiles!posts_user_id_fkey(
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const posts = (data || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      photo_url: item.photo_url,
      plant_name: item.plant_name,
      caption: item.caption,
      like_count: item.like_count,
      comment_count: item.comment_count,
      is_public: item.is_public,
      created_at: item.created_at,
      updated_at: item.updated_at,
      profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
    })) as PostWithAuthor[];

    return enrichPostInteractions(posts, currentUserId);
  } catch (err) {
    const message = getErrorMessage(err);
    throw new PostsError(`Failed to fetch user posts: ${message}`);
  }
};
