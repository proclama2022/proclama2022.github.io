/**
 * Public Profile Screen
 *
 * Displays another user's profile with avatar, display name, bio, stats, and follow button.
 * Redirects to own profile if viewing self.
 * Auth-gated - shows sign in prompt if not authenticated.
 *
 * Usage: Accessed via dynamic route /profile/[userId]
 * Navigation: router.push(`/profile/${userId}`)
 *
 * @module app/profile/[userId]
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { ThemedView } from '@/components/Themed';
import { ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { ProfileStats } from '@/components/ProfileStats';
import { FollowButton } from '@/components/FollowButton';
import { useAuthStore } from '@/stores/authStore';
import { profileService } from '@/services/profileService';
import { followService } from '@/services/followService';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { ProfileWithStats } from '@/types/profile';

/**
 * Public profile screen component
 *
 * Shows other user's profile with follow button.
 * Redirects to own profile if userId matches current user.
 */
export default function PublicProfileScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileWithStats | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch profile data on mount or when userId changes
   */
  useEffect(() => {
    if (!userId) {
      setError('User ID not provided');
      setIsLoading(false);
      return;
    }

    // Check if viewing own profile
    if (user && userId === user.id) {
      // Redirect to own profile tab
      router.replace('/(tabs)/profile');
      return;
    }

    fetchProfileData();
  }, [userId, user]);

  /**
   * Refresh profile and follow status when screen gains focus
   */
  useFocusEffect(
    useCallback(() => {
      if (userId && user && userId !== user.id) {
        fetchProfileData();
      }
    }, [userId, user])
  );

  /**
   * Fetch profile and follow status
   */
  const fetchProfileData = async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch profile data
      const profileResult = await profileService.fetchProfile(userId);
      if (!profileResult.success || !profileResult.data) {
        setError(profileResult.error || 'Profile not found');
        setIsLoading(false);
        return;
      }

      setProfile(profileResult.data);

      // Check if current user is following this user
      if (user) {
        const following = await followService.checkIsFollowing(user.id, userId);
        setIsFollowing(following);
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle follow button press
   */
  const handleFollow = async () => {
    if (!user || !userId) return;

    const result = await followService.followUser(user.id, userId);
    if (result.success) {
      setIsFollowing(true);
      // Refresh stats to update follower count
      const updatedProfile = await profileService.fetchProfile(userId);
      if (updatedProfile.success && updatedProfile.data) {
        setProfile(updatedProfile.data);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to follow user');
    }
  };

  /**
   * Handle unfollow button press
   */
  const handleUnfollow = async () => {
    if (!user || !userId) return;

    const result = await followService.unfollowUser(user.id, userId);
    if (result.success) {
      setIsFollowing(false);
      // Refresh stats
      const updatedProfile = await profileService.fetchProfile(userId);
      if (updatedProfile.success && updatedProfile.data) {
        setProfile(updatedProfile.data);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to unfollow user');
    }
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
  if (isLoading) {
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
  if (error || !profile) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={80} color={colors.tint} />
          <ThemedText style={styles.errorText}>{error || 'Profile not found'}</ThemedText>
        </ScrollView>
      </ThemedView>
    );
  }

  /**
   * Show profile data
   */
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: profile.display_name,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Avatar
            uri={profile.avatar_url}
            size={120}
            borderColor={colors.border}
            borderWidth={2}
          />
        </View>

        {/* Display Name */}
        <ThemedText style={styles.displayName}>
          {profile.display_name || t('profile.displayName')}
        </ThemedText>

        {/* Bio */}
        {profile.bio ? (
          <ThemedText style={styles.bio}>{profile.bio}</ThemedText>
        ) : null}

        {/* Follow Button */}
        <FollowButton
          isFollowing={isFollowing}
          onFollow={handleFollow}
          onUnfollow={handleUnfollow}
        />

        {/* Stats Grid */}
        {profile.stats && (
          <View style={styles.statsSection}>
            <ProfileStats
              stats={{
                plants_identified: profile.stats.plants_identified,
                followers_count: profile.stats.followers_count,
                following_count: profile.stats.following_count,
                joined_date: profile.created_at,
              }}
            />
          </View>
        )}
      </ScrollView>
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
  },
});
