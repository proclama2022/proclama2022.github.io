/**
 * Profile Tab Screen
 *
 * Displays user's profile with avatar, display name, bio, and stats.
 * Provides edit functionality for own profile.
 * Refreshes stats when tab gains focus.
 *
 * Usage: Accessed via bottom navigation (4th tab)
 *
 * @module app/(tabs)/profile
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/Themed';
import { ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { ProfileStats } from '@/components/ProfileStats';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

/**
 * Profile tab screen component
 *
 * Shows current user's profile with stats and edit button.
 * Auth-gated - shows sign in prompt if not authenticated.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { user } = useAuthStore();
  const {
    currentProfile,
    isLoading,
    error,
    fetchCurrentProfile,
    refreshStats,
  } = useProfileStore();

  const [showEditModal, setShowEditModal] = useState(false);
  const [isOtherUser, setIsOtherUser] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);

  /**
   * Fetch profile on mount or when user changes
   */
  useEffect(() => {
    if (user && !currentProfile) {
      fetchCurrentProfile(user.id);
    }
  }, [user, currentProfile, fetchCurrentProfile]);

  /**
   * Refresh stats when tab gains focus
   * This ensures follower/following counts are up-to-date
   */
  useFocusEffect(
    useCallback(() => {
      if (user && currentProfile) {
        refreshStats();
      }
    }, [user, currentProfile, refreshStats])
  );

  /**
   * Handle edit button press
   */
  const handleEditPress = () => {
    setShowEditModal(true);
  };

  /**
   * Handle profile save
   */
  const handleProfileSave = () => {
    setShowEditModal(false);
    // Profile is automatically updated in store by ProfileEditModal
  };

  /**
   * Show sign in prompt
   */
  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Ionicons name="person-outline" size={80} color={colors.tabIconDefault} />
          <ThemedText style={styles.signInPrompt}>{t('profile.signInToView')}</ThemedText>
        </ScrollView>
      </ThemedView>
    );
  }

  /**
   * Show loading spinner
   */
  if (isLoading && !currentProfile) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  /**
   * Show error message
   */
  if (error && !currentProfile) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.tint} />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => user && fetchCurrentProfile(user.id)}
          >
            <ThemedText style={styles.retryButtonText}>{t('common.retry')}</ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  /**
   * Show profile data
   */
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={currentProfile?.avatar_url}
            size={120}
            borderColor={colors.border}
            borderWidth={2}
          />
        </View>

        {/* Display Name */}
        <ThemedText style={styles.displayName}>
          {currentProfile?.display_name || t('profile.displayName')}
        </ThemedText>

        {/* Bio */}
        {currentProfile?.bio ? (
          <ThemedText style={styles.bio}>{currentProfile.bio}</ThemedText>
        ) : null}

        {/* Edit Button (only for own profile) */}
        {!isOtherUser && (
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.tint }]}
            onPress={handleEditPress}
          >
            <ThemedText style={styles.editButtonText}>{t('profile.editProfile')}</ThemedText>
          </TouchableOpacity>
        )}

        {/* Stats Grid */}
        {currentProfile?.stats && (
          <View style={styles.statsSection}>
            <ProfileStats
              stats={{
                plants_identified: currentProfile.stats.plants_identified,
                followers_count: currentProfile.stats.followers_count,
                following_count: currentProfile.stats.following_count,
                joined_date: currentProfile.created_at,
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      {currentProfile && (
        <ProfileEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={currentProfile}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarSection: {
    marginBottom: 16,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  bio: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  editButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    width: '100%',
  },
  signInPrompt: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
