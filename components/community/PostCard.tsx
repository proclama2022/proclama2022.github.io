/**
 * PostCard Component
 *
 * Displays a community post with photo, author info, and engagement counts.
 * Instagram-style card layout for community feed.
 *
 * Features:
 * - Author avatar + name + league badge + relative timestamp
 * - Full-width plant photo (4:3 aspect ratio)
 * - Plant name and caption
 * - Like and comment counts with tappable icons
 * - Tap navigation to author profile and post detail
 *
 * @module components/community/PostCard
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/Avatar';
import { LeagueBadge } from '@/components/Gamification/LeagueBadge';
import { ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { PostWithAuthor } from '@/lib/supabase/posts';

// ============================================================================
// Types
// ============================================================================

export interface PostCardProps {
  /** Post data with author */
  post: PostWithAuthor;
  /** Called when like button is tapped */
  onLikePress?: () => void;
  /** Called when like count is tapped */
  onLikeCountPress?: () => void;
  /** Called when card is tapped */
  onPostPress?: () => void;
  /** Called when follow button is tapped */
  onFollowPress?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * PostCard
 *
 * Renders a community post card with Instagram-style layout.
 *
 * @param props.post - Post data with author info
 * @param props.onLikeCountPress - Called when like count is tapped
 * @param props.onPostPress - Called when card is tapped
 * @param props.onFollowPress - Called when follow button is tapped
 */
export const PostCard: React.FC<PostCardProps> = ({
  post,
  onLikePress,
  onLikeCountPress,
  onPostPress,
  onFollowPress,
}) => {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  /**
   * Navigate to author's profile
   */
  const handleAuthorPress = () => {
    router.push(`/profile/${post.profiles.id}`);
  };

  /**
   * Convert date string to relative time (e.g., "2h ago")
   */
  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header: Avatar + Name + Time + Follow */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerUser} onPress={handleAuthorPress}>
          <Avatar uri={post.profiles.avatar_url} size={40} />
          <View style={styles.headerText}>
            <View style={styles.authorRow}>
              <ThemedText style={[styles.authorName, { color: colors.text }]}>
                {post.profiles.display_name}
              </ThemedText>
              {post.profiles.league_tier && (
                <LeagueBadge
                  tier={post.profiles.league_tier as any}
                  size={16}
                  showBronze={false}
                />
              )}
            </View>
            <ThemedText style={[styles.timestamp, { color: colors.tabIconDefault }]}>
              {getRelativeTime(post.created_at)}
            </ThemedText>
          </View>
        </TouchableOpacity>

        {onFollowPress && (
          <TouchableOpacity
            onPress={onFollowPress}
            style={[
              styles.followButton,
              post.is_followed
                ? { borderColor: colors.border, backgroundColor: 'transparent' }
                : { borderColor: colors.tint, backgroundColor: colors.tint },
            ]}
          >
            <ThemedText
              style={[
                styles.followButtonText,
                { color: post.is_followed ? colors.text : '#fff' },
              ]}
            >
              {post.is_followed ? t('profile.following_button') : t('profile.follow')}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Photo - Tap for post detail */}
      <TouchableOpacity onPress={onPostPress} activeOpacity={0.9}>
        <Image
          source={{ uri: post.photo_url }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Info Section */}
      <View style={styles.info}>
        {post.plant_name && (
          <ThemedText style={[styles.plantName, { color: colors.text }]}>
            {post.plant_name}
          </ThemedText>
        )}
        {post.caption && (
          <ThemedText style={[styles.caption, { color: colors.tabIconDefault }]} numberOfLines={2}>
            {post.caption}
          </ThemedText>
        )}

        {/* Engagement Row */}
        <View style={styles.engagement}>
          <TouchableOpacity style={styles.engagementItem} onPress={onLikePress ?? onLikeCountPress}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={20}
              color={post.is_liked ? '#e53935' : colors.tabIconDefault}
            />
            <ThemedText style={[styles.count, { color: colors.tabIconDefault }]}>
              {post.like_count}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.engagementItem} onPress={onPostPress}>
            <Ionicons
              name="chatbubble-outline"
              size={19}
              color={colors.tabIconDefault}
            />
            <ThemedText style={[styles.count, { color: colors.tabIconDefault }]}>
              {post.comment_count}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    gap: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  followingButton: {
    backgroundColor: 'transparent',
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  info: {
    padding: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  engagement: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engagementIcon: {
    width: 20,
    height: 20,
  },
  count: {
    fontSize: 14,
  },
});

export default PostCard;
