
import {
    checkIsFollowing as checkIsFollowingApi,
    followUser as followUserApi,
    getFollowCounts as getFollowCountsApi,
    getFollowers as getFollowersApi,
    getFollowing as getFollowingApi,
    unfollowUser as unfollowUserApi,
} from '@/lib/supabase/follows';
import { awardFollowersGainedEvent } from './gamificationService';

export interface FollowServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Follow a user
 */
export const followUser = async (
  followerId: string,
  followingId: string
): Promise<FollowServiceResult<void>> => {
  return toggleFollow(followerId, followingId, false);
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (
  followerId: string,
  followingId: string
): Promise<FollowServiceResult<void>> => {
  return toggleFollow(followerId, followingId, true);
};

/**
 * Check if following
 */
export const checkIsFollowing = async (
  followerId: string,
  followingId: string
): Promise<boolean> => {
  const result = await getFollowStatus(followerId, followingId);
  return result.data || false;
};

/**
 * Toggle follow status for a user
 */
export const toggleFollow = async (
  followerId: string,
  followingId: string,
  isFollowing: boolean
): Promise<FollowServiceResult<void>> => {
  try {
    if (isFollowing) {
      await unfollowUserApi(followerId, followingId);
    } else {
      await followUserApi(followerId, followingId);

      // Trigger gamification event for the followed user (fire-and-forget)
      // Get their new follower count and award the followers_gained event
      try {
        const counts = await getFollowCountsApi(followingId);
        // Fire-and-forget - don't await
        awardFollowersGainedEvent(followingId, counts.followers).catch((err) => {
          console.warn('[follow] Failed to award followers gained event:', err);
        });
      } catch (gamificationErr) {
        // Don't block follow action on gamification failure
        console.warn('[follow] Failed to get follower counts for gamification:', gamificationErr);
      }
    }
    return { success: true };
  } catch (err) {
    console.error('Failed to toggle follow:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update follow status',
    };
  }
};

/**
 * Get follow status between two users
 */
export const getFollowStatus = async (
  followerId: string,
  followingId: string
): Promise<FollowServiceResult<boolean>> => {
  try {
    const isFollowing = await checkIsFollowingApi(followerId, followingId);
    return { success: true, data: isFollowing };
  } catch (err) {
    console.error('Failed to get follow status:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get follow status',
    };
  }
};

/**
 * Get user's followers
 */
export const getUserFollowers = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<FollowServiceResult<any[]>> => {
  try {
    const followers = await getFollowersApi(userId, limit, offset);
    return { success: true, data: followers };
  } catch (err) {
    console.error('Failed to get followers:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get followers',
    };
  }
};

/**
 * Get users a user is following
 */
export const getUserFollowing = async (
  userId: string,
  limit = 20,
  offset = 0
): Promise<FollowServiceResult<any[]>> => {
  try {
    const following = await getFollowingApi(userId, limit, offset);
    return { success: true, data: following };
  } catch (err) {
    console.error('Failed to get following:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get following',
    };
  }
};

/**
 * Get follow counts for a user
 */
export const getUserFollowCounts = async (
  userId: string
): Promise<FollowServiceResult<{ following: number; followers: number }>> => {
  try {
    const counts = await getFollowCountsApi(userId);
    return { success: true, data: counts };
  } catch (err) {
    console.error('Failed to get follow counts:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to get follow counts',
    };
  }
};
