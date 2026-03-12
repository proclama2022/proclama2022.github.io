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
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import AtmosphericBackdrop from '@/components/AtmosphericBackdrop';
import { ThemedView , ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { ProfileStats } from '@/components/ProfileStats';
import { LikedPostsTab } from '@/components/community/LikedPostsTab';
import { CompactLevelProgress } from '@/components/Gamification/CompactLevelProgress';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUserGamificationSummary } from '@/services/gamificationService';
import type { GamificationSummary } from '@/types/gamification';

function getBadgeCopy(
  t: ReturnType<typeof useTranslation>['t'],
  badgeKey: string,
  fallbackTitle?: string | null,
  fallbackDescription?: string | null
) {
  return {
    title: t(`gamification.badges.${badgeKey}.title`, { defaultValue: fallbackTitle ?? badgeKey }),
    description: t(`gamification.badges.${badgeKey}.description`, {
      defaultValue: fallbackDescription ?? badgeKey,
    }),
  };
}

function getChallengeCopy(t: ReturnType<typeof useTranslation>['t'], challengeKey: string) {
  return {
    title: t(`gamification.challenges.${challengeKey}.title`, { defaultValue: challengeKey }),
    description: t(`gamification.challenges.${challengeKey}.description`, { defaultValue: challengeKey }),
  };
}

function getEventCopy(t: ReturnType<typeof useTranslation>['t'], eventType: string) {
  return t(`gamification.events.${eventType}`, { defaultValue: eventType });
}

/**
 * Profile tab screen component
 *
 * Shows current user's profile with stats and edit button.
 * Auth-gated - shows sign in prompt if not authenticated.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
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
  const [activeTab, setActiveTab] = useState<'plants' | 'liked'>('plants');
  const [gamificationSummary, setGamificationSummary] = useState<GamificationSummary | null>(null);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);

  const loadGamificationSummary = useCallback(async () => {
    if (!user) {
      setGamificationSummary(null);
      return;
    }

    setIsGamificationLoading(true);
    const summary = await getUserGamificationSummary();
    setGamificationSummary(summary);
    setIsGamificationLoading(false);
  }, [user]);

  /**
   * Fetch profile on mount or when user changes
   */
  useEffect(() => {
    if (user && !currentProfile) {
      fetchCurrentProfile(user.id);
    }
  }, [user, currentProfile, fetchCurrentProfile]);

  useEffect(() => {
    void loadGamificationSummary();
  }, [loadGamificationSummary]);

  /**
   * Refresh stats when tab gains focus
   * This ensures follower/following counts are up-to-date
   */
  useFocusEffect(
    useCallback(() => {
      if (user && currentProfile) {
        refreshStats();
      }
      void loadGamificationSummary();
    }, [user, currentProfile, refreshStats, loadGamificationSummary])
  );

  /**
   * Handle edit button press
   */
  const handleEditPress = () => {
    setShowEditModal(true);
  };

  const shellBackground = { backgroundColor: colors.surfaceGlass, borderColor: colors.border };

  /**
   * Show sign in prompt
   */
  if (!user) {
    return (
      <View style={styles.screenShell}>
        <AtmosphericBackdrop />
        <ThemedView style={styles.container}>
          <ScrollView contentContainerStyle={styles.centerContent}>
            <View style={[styles.stateCard, shellBackground]}>
              <Ionicons name="person-outline" size={80} color={colors.tabIconDefault} />
              <ThemedText style={styles.signInPrompt}>{t('profile.signInToView')}</ThemedText>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    );
  }

  /**
   * Show loading spinner
   */
  if (isLoading && !currentProfile) {
    return (
      <View style={styles.screenShell}>
        <AtmosphericBackdrop />
        <ThemedView style={styles.container}>
          <View style={styles.centerContent}>
            <View style={[styles.stateCard, shellBackground]}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText style={styles.loadingText}>{t('common.loading')}</ThemedText>
            </View>
          </View>
        </ThemedView>
      </View>
    );
  }

  /**
   * Show error message
   */
  if (error && !currentProfile) {
    return (
      <View style={styles.screenShell}>
        <AtmosphericBackdrop />
        <ThemedView style={styles.container}>
          <ScrollView contentContainerStyle={styles.centerContent}>
            <View style={[styles.stateCard, shellBackground]}>
              <Ionicons name="alert-circle-outline" size={80} color={colors.tint} />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.tint }]}
                onPress={() => user && fetchCurrentProfile(user.id)}
              >
                <ThemedText style={styles.retryButtonText}>{t('common.retry')}</ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    );
  }

  /**
   * Show profile data
   */
  return (
    <View style={styles.screenShell}>
      <AtmosphericBackdrop />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerBlock}>
            <ThemedText style={[styles.eyebrow, { color: colors.textSecondary }]}>
              {t('common.appName')}
            </ThemedText>
            <ThemedText style={styles.screenTitle}>{t('tabs.profile')}</ThemedText>
          </View>

          <View style={[styles.profileCard, shellBackground]}>
            <View style={styles.avatarSection}>
              <Avatar
                uri={currentProfile?.avatar_url}
                size={120}
                borderColor={colors.border}
                borderWidth={2}
              />
            </View>

            <ThemedText style={styles.displayName}>
              {currentProfile?.display_name || t('profile.displayName')}
            </ThemedText>

            {gamificationSummary && (
              <TouchableOpacity
                style={styles.compactProgressWrapper}
                onPress={() => router.push('/gamification')}
                activeOpacity={0.7}
              >
                <CompactLevelProgress progress={gamificationSummary.progress} />
              </TouchableOpacity>
            )}

            {currentProfile?.bio ? (
              <ThemedText style={styles.bio}>{currentProfile.bio}</ThemedText>
            ) : (
              <ThemedText style={[styles.bio, { color: colors.textSecondary }]}>
                {t('profile.bioPlaceholder', { defaultValue: 'Create a small corner that tells your plant story.' })}
              </ThemedText>
            )}

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.tint }]}
              onPress={handleEditPress}
            >
              <ThemedText style={styles.editButtonText}>{t('profile.editProfile')}</ThemedText>
            </TouchableOpacity>
          </View>

          {currentProfile?.stats && (
            <View style={[styles.statsCard, shellBackground]}>
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

          {gamificationSummary && (
            <>
              <View style={[styles.gamificationCard, shellBackground]}>
                <View style={styles.gamificationHeader}>
                  <Ionicons name="trophy-outline" size={18} color={colors.tint} />
                  <ThemedText style={styles.gamificationTitle}>
                    {t('profile.gamificationTitle')}
                  </ThemedText>
                </View>

                <View style={styles.gamificationLevelRow}>
                  <ThemedText style={styles.levelLabel}>
                    {t('profile.level')} {gamificationSummary.progress.level}
                  </ThemedText>
                  <ThemedText style={[styles.levelXpText, { color: colors.textSecondary }]}>
                    {gamificationSummary.progress.xp_in_level}/{gamificationSummary.progress.xp_for_next_level} XP
                  </ThemedText>
                </View>

                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.tint,
                        width: `${Math.min(
                          100,
                          Math.round(
                            (gamificationSummary.progress.xp_in_level /
                              Math.max(gamificationSummary.progress.xp_for_next_level, 1)) *
                              100
                          )
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.gamificationStatsRow}>
                  <View style={styles.gamificationMetric}>
                    <ThemedText style={styles.metricValue}>{gamificationSummary.progress.xp_total}</ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      {t('profile.totalXp')}
                    </ThemedText>
                  </View>
                  <View style={styles.gamificationMetric}>
                    <ThemedText style={styles.metricValue}>{gamificationSummary.progress.watering_streak}</ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      {t('profile.wateringStreak')}
                    </ThemedText>
                  </View>
                  <View style={styles.gamificationMetric}>
                    <ThemedText style={styles.metricValue}>{gamificationSummary.badges.length}</ThemedText>
                    <ThemedText style={[styles.metricLabel, { color: colors.textSecondary }]}>
                      {t('profile.badges')}
                    </ThemedText>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.viewAllButton, { backgroundColor: colors.tint }]}
                  onPress={() => router.push('/gamification')}
                >
                  <ThemedText style={styles.viewAllButtonText}>
                    {t('profile.viewFullProfile')}
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={[styles.gamificationSectionCard, shellBackground]}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.badges')}</ThemedText>
                  <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {gamificationSummary.badges.length}
                  </ThemedText>
                </View>
                {gamificationSummary.badges.length > 0 ? (
                  <View style={styles.badgesList}>
                    {gamificationSummary.badges.map((badge) => {
                      const badgeCopy = getBadgeCopy(t, badge.badge_key, badge.title, badge.description);
                      return (
                        <View
                          key={badge.badge_key}
                          style={[
                            styles.badgeCard,
                            { backgroundColor: colors.surfaceGlass, borderColor: colors.border },
                          ]}
                        >
                          <View style={[styles.badgeIconWrap, { backgroundColor: colors.surfaceStrong }]}>
                            <Ionicons name="ribbon-outline" size={16} color={colors.tint} />
                          </View>
                          <View style={styles.badgeCopy}>
                            <ThemedText style={styles.badgeTitle}>{badgeCopy.title}</ThemedText>
                            <ThemedText style={[styles.badgeDescription, { color: colors.textSecondary }]}>
                              {badgeCopy.description}
                            </ThemedText>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <ThemedText style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                    {t('profile.noBadgesYet')}
                  </ThemedText>
                )}
              </View>

              <View style={[styles.gamificationSectionCard, shellBackground]}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.dailyChallenges')}</ThemedText>
                  <ThemedText style={[styles.sectionCount, { color: colors.textSecondary }]}>
                    {gamificationSummary.daily_challenges.filter((challenge) => challenge.completed).length}/
                    {gamificationSummary.daily_challenges.length}
                  </ThemedText>
                </View>
                {gamificationSummary.daily_challenges.length > 0 ? (
                  <View style={styles.challengeList}>
                    {gamificationSummary.daily_challenges.map((challenge) => {
                      const challengeCopy = getChallengeCopy(t, challenge.challenge_key);
                      const progress = Math.min(challenge.target_count, challenge.progress_count);
                      const progressPct = Math.round((progress / Math.max(challenge.target_count, 1)) * 100);

                      return (
                        <View
                          key={challenge.challenge_key}
                          style={[
                            styles.challengeCard,
                            { backgroundColor: colors.surfaceGlass, borderColor: colors.border },
                          ]}
                        >
                          <View style={styles.challengeHeader}>
                            <View style={styles.challengeCopy}>
                              <ThemedText style={styles.challengeTitle}>{challengeCopy.title}</ThemedText>
                              <ThemedText style={[styles.challengeDescription, { color: colors.textSecondary }]}>
                                {challengeCopy.description}
                              </ThemedText>
                            </View>
                            <View
                              style={[
                                styles.challengeRewardChip,
                                {
                                  backgroundColor: challenge.completed ? colors.tint : colors.surfaceStrong,
                                },
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.challengeRewardText,
                                  { color: challenge.completed ? '#fff' : colors.tint },
                                ]}
                              >
                                +{challenge.xp_reward} XP
                              </ThemedText>
                            </View>
                          </View>

                          <View style={styles.challengeProgressRow}>
                            <ThemedText style={[styles.challengeProgressText, { color: colors.textSecondary }]}>
                              {t('profile.challengeProgress', {
                                current: progress,
                                target: challenge.target_count,
                              })}
                            </ThemedText>
                            <ThemedText style={[styles.challengeProgressText, { color: colors.textSecondary }]}>
                              {progressPct}%
                            </ThemedText>
                          </View>
                          <View style={[styles.progressTrack, styles.challengeTrack, { backgroundColor: colors.border }]}>
                            <View
                              style={[
                                styles.progressFill,
                                {
                                  backgroundColor: challenge.completed ? colors.tint : colors.textSecondary,
                                  width: `${progressPct}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <ThemedText style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                    {t('profile.noChallengesToday')}
                  </ThemedText>
                )}
              </View>

              <View style={[styles.gamificationSectionCard, shellBackground]}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText style={styles.sectionTitle}>{t('profile.recentActivity')}</ThemedText>
                </View>
                {gamificationSummary.recent_activity.length > 0 ? (
                  <View style={styles.activityList}>
                    {gamificationSummary.recent_activity.map((activity, index) => (
                      <View
                        key={`${activity.created_at}:${activity.event_type}:${index}`}
                        style={[
                          styles.activityRow,
                          {
                            borderBottomColor: colors.border,
                            borderBottomWidth:
                              index === gamificationSummary.recent_activity.length - 1 ? 0 : StyleSheet.hairlineWidth,
                          },
                        ]}
                      >
                        <View style={[styles.activityIconWrap, { backgroundColor: colors.surfaceStrong }]}>
                          <Ionicons name="flash-outline" size={14} color={colors.tint} />
                        </View>
                        <View style={styles.activityCopy}>
                          <ThemedText style={styles.activityTitle}>
                            {getEventCopy(t, activity.event_type)}
                          </ThemedText>
                          <ThemedText style={[styles.activityMeta, { color: colors.textSecondary }]}>
                            {new Date(activity.created_at).toLocaleString()}
                          </ThemedText>
                        </View>
                        <ThemedText style={[styles.activityXp, { color: colors.tint }]}>
                          +{activity.xp_awarded}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : (
                  <ThemedText style={[styles.emptySectionText, { color: colors.textSecondary }]}>
                    {t('profile.noRecentActivity')}
                  </ThemedText>
                )}
              </View>
            </>
          )}

          {!gamificationSummary && isGamificationLoading && (
            <View style={[styles.gamificationCard, shellBackground]}>
              <View style={styles.gamificationLoadingRow}>
                <ActivityIndicator size="small" color={colors.tint} />
                <ThemedText style={[styles.gamificationLoadingText, { color: colors.textSecondary }]}>
                  {t('common.loading')}
                </ThemedText>
              </View>
            </View>
          )}

          {/* Tab Toggle */}
          <View style={[styles.tabContainer, { backgroundColor: colors.surfaceGlass }]}>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'plants' && { backgroundColor: colors.tint },
              ]}
              onPress={() => setActiveTab('plants')}
            >
              <Ionicons
                name="leaf-outline"
                size={18}
                color={activeTab === 'plants' ? '#fff' : colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'plants' && styles.activeTabText,
                ]}
              >
                {t('profile.plantsTab')}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'liked' && { backgroundColor: colors.tint },
              ]}
              onPress={() => setActiveTab('liked')}
            >
              <Ionicons
                name="heart-outline"
                size={18}
                color={activeTab === 'liked' ? '#fff' : colors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === 'liked' && styles.activeTabText,
                ]}
              >
                {t('profile.likedTab')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'plants' ? (
              <View style={[styles.plantsPlaceholder, shellBackground]}>
                <Ionicons name="leaf-outline" size={48} color={colors.tabIconDefault} />
                <ThemedText style={[styles.placeholderText, { color: colors.textSecondary }]}>
                  {t('profile.noPlantsHint')}
                </ThemedText>
              </View>
            ) : (
              currentProfile && <LikedPostsTab userId={currentProfile.id} />
            )}
          </View>
        </ScrollView>

        {currentProfile && (
          <ProfileEditModal
            visible={showEditModal}
            onClose={() => setShowEditModal(false)}
            currentProfile={currentProfile}
          />
        )}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 120,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  stateCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
  headerBlock: {
    width: '100%',
    marginBottom: 16,
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    width: '100%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
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
  compactProgressWrapper: {
    width: '100%',
    marginBottom: 16,
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
  statsCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  gamificationCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  gamificationSectionCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  gamificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  gamificationTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  gamificationLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  levelXpText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  gamificationStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  gamificationMetric: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  metricLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  gamificationLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  gamificationLoadingText: {
    fontSize: 13,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  badgesList: {
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  badgeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeCopy: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  badgeDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  challengeList: {
    gap: 12,
  },
  challengeCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  challengeDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  challengeRewardChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  challengeRewardText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  challengeProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengeProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  challengeTrack: {
    marginBottom: 0,
  },
  activityList: {
    gap: 0,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  activityCopy: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  activityMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  activityXp: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 12,
  },
  emptySectionText: {
    fontSize: 13,
    lineHeight: 20,
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    minHeight: 300,
  },
  plantsPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    borderRadius: 24,
    marginHorizontal: 16,
  },
  placeholderText: {
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
  },
});
