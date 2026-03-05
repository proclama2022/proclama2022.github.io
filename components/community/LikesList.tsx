/**
 * LikesList Component
 *
 * Displays a list of users who liked a post.
 * Each user row shows avatar, display name, and is tappable for navigation.
 *
 * Features:
 * - Avatar + display name per user
 * - Loading state with ActivityIndicator
 * - Empty state when no likes
 * - onUserPress callback for navigation
 *
 * @module components/community/LikesList
 */

import React from 'react';
import { FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

import { ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { LikeWithProfile } from '@/services/likeService';

// ============================================================================
// Types
// ============================================================================

export interface LikesListProps {
  /** Array of like records with profile data */
  likes: LikeWithProfile[];
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Callback when user row is tapped */
  onUserPress: (userId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LikesList
 *
 * Renders a scrollable list of users who liked a post.
 * Each row shows avatar + display name, tappable for profile navigation.
 *
 * @param props.likes - Array of like records with profiles
 * @param props.isLoading - Show loading spinner when true
 * @param props.onUserPress - Called with userId when row tapped
 *
 * Example:
 *   <LikesList
 *     likes={likesData}
 *     isLoading={loading}
 *     onUserPress={(userId) => router.push(`/profile/${userId}`)}
 *   />
 */
export const LikesList: React.FC<LikesListProps> = ({
  likes,
  isLoading = false,
  onUserPress,
}) => {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  // Loading state
  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={colors.tint}
        style={styles.loader}
      />
    );
  }

  // Empty state
  if (likes.length === 0) {
    return (
      <ThemedText style={styles.emptyText}>No likes yet</ThemedText>
    );
  }

  // Render single user row
  const renderUser = ({ item }: { item: LikeWithProfile }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => onUserPress(item.profiles.id)}
      activeOpacity={0.7}
    >
      <Avatar uri={item.profiles.avatar_url} size={44} />
      <ThemedText style={styles.userName}>
        {item.profiles.display_name}
      </ThemedText>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={likes}
      keyExtractor={(item) => item.user_id}
      renderItem={renderUser}
      contentContainerStyle={styles.listContent}
    />
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  loader: {
    marginVertical: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 40,
    opacity: 0.6,
    fontSize: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  userName: {
    fontSize: 16,
    flex: 1,
  },
});

export default LikesList;
