/**
 * Follow Button Component
 *
 * Displays follow/following state with toggle functionality.
 * Shows loading state during follow/unfollow operations.
 * Prevents interaction while loading.
 *
 * Usage:
 *   <FollowButton
 *     isFollowing={isFollowing}
 *     onFollow={handleFollow}
 *     onUnfollow={handleUnfollow}
 *   />
 *
 * @module components/FollowButton
 */
import React, { useState } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// ============================================================================
// Types
// ============================================================================

/**
 * Follow button props
 */
export interface FollowButtonProps {
  /** Whether the current user is following this user */
  isFollowing: boolean;
  /** Callback when follow button is pressed */
  onFollow: () => Promise<void>;
  /** Callback when unfollow button is pressed */
  onUnfollow: () => Promise<void>;
  /** Whether the button is disabled (external control) */
  disabled?: boolean;
  /** Additional style for the button container */
  style?: ViewStyle;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Follow button component
 *
 * Shows "Follow" or "Following" based on state.
 * Toggles between follow/unfollow on press.
 * Shows loading spinner during operation.
 */
export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onFollow,
  onUnfollow,
  disabled = false,
  style,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [isLoading, setIsLoading] = useState(false);
  const [currentIsFollowing, setCurrentIsFollowing] = useState(isFollowing);

  // Update local state when prop changes
  React.useEffect(() => {
    setCurrentIsFollowing(isFollowing);
  }, [isFollowing]);

  /**
   * Handle button press
   */
  const handlePress = async () => {
    if (isLoading || disabled) return;

    setIsLoading(true);

    try {
      if (currentIsFollowing) {
        await onUnfollow();
        setCurrentIsFollowing(false);
      } else {
        await onFollow();
        setCurrentIsFollowing(true);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Determine button style based on state
   */
  const buttonStyle = currentIsFollowing
    ? [styles.button, styles.followingButton, { borderColor: colors.tint }]
    : [styles.button, styles.followButton, { backgroundColor: colors.tint }];

  const textColor = currentIsFollowing ? colors.tint : '#fff';
  const iconName = currentIsFollowing ? 'checkmark-circle' : undefined;
  const buttonText = currentIsFollowing
    ? t('profile.following_button')
    : t('profile.follow');

  return (
    <TouchableOpacity
      style={[buttonStyle, style, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={isLoading || disabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {iconName && <Ionicons name={iconName} size={18} color={textColor} style={styles.icon} />}
          <ThemedText style={[styles.buttonText, { color: textColor }]}>
            {buttonText}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 40,
    borderRadius: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  followButton: {
    borderWidth: 0,
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  icon: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});
