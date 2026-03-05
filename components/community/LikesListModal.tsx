/**
 * LikesListModal Component
 *
 * Modal wrapper for the LikesList component.
 * Fetches likes on open and provides navigation to user profiles.
 *
 * Features:
 * - iOS-style pageSheet presentation
 * - Fetches likes on modal open
 * - Shows like count in header
 * - Navigates to profile on user tap
 * - Closes modal after navigation
 *
 * @module components/community/LikesListModal
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/Themed';
import { ThemedView } from '@/components/Themed';
import { LikesList } from './LikesList';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getPostLikesList, LikeWithProfile } from '@/services/likeService';

// ============================================================================
// Types
// ============================================================================

export interface LikesListModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Post ID to fetch likes for */
  postId: string;
  /** Total like count (displayed in header) */
  likeCount: number;
  /** Callback when modal should close */
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * LikesListModal
 *
 * Modal displaying users who liked a post.
 * Uses iOS-style pageSheet presentation for native feel.
 *
 * @param props.visible - Control modal visibility
 * @param props.postId - Post ID to load likes for
 * @param props.likeCount - Total likes (shown in header)
 * @param props.onClose - Called when modal should close
 *
 * Example:
 *   <LikesListModal
 *     visible={showModal}
 *     postId="post-123"
 *     likeCount={42}
 *     onClose={() => setShowModal(false)}
 *   />
 */
export const LikesListModal: React.FC<LikesListModalProps> = ({
  visible,
  postId,
  likeCount,
  onClose,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [likes, setLikes] = useState<LikeWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load likes when modal becomes visible
  const loadLikes = useCallback(async () => {
    if (!postId) return;

    setIsLoading(true);
    try {
      const result = await getPostLikesList(postId);
      if (result.success && result.data) {
        setLikes(result.data);
      } else {
        setLikes([]);
      }
    } catch (err) {
      console.error('Failed to load likes:', err);
      setLikes([]);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (visible && postId) {
      loadLikes();
    }
  }, [visible, postId, loadLikes]);

  // Navigate to user profile and close modal
  const handleUserPress = useCallback((userId: string) => {
    onClose();
    router.push(`/profile/${userId}`);
  }, [onClose, router]);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setLikes([]);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.title}>
            {t('community.likes')} · {likeCount}
          </ThemedText>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Likes List */}
        <LikesList
          likes={likes}
          isLoading={isLoading}
          onUserPress={handleUserPress}
        />
      </ThemedView>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default LikesListModal;
