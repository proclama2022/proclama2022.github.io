/**
 * Gamification Profile Screen
 *
 * Main gamification UI showing level progress, badges, stats, and daily challenges.
 * Now includes a League tab for league leaderboard.
 *
 * @module app/gamification
 */
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import AtmosphericBackdrop from '@/components/AtmosphericBackdrop';
import {
  BadgeGrid,
  DailyChallenges,
  GamificationStats,
  LevelProgressCard,
} from '@/components/Gamification';
import { Leaderboard } from '@/components/Gamification/Leaderboard';
import { ThemedView } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUserGamificationSummary } from '@/services/gamificationService';
import { getUserLeagueInfo, UserLeagueInfo } from '@/services/leagueService';
import { useAuthStore } from '@/stores/authStore';
import type { GamificationSummary } from '@/types/gamification';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TabKey = 'badges' | 'league' | 'challenges';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: string;
}

export default function GamificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [leagueInfo, setLeagueInfo] = useState<UserLeagueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('badges');
  const [leaderboardType, setLeaderboardType] = useState<'xp' | 'streak' | 'badges' | 'league'>('league');

  const tabTranslateX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const tabs: TabConfig[] = [
    { key: 'badges', label: t('profile.badges'), icon: '\u{1F3C6}' },
    { key: 'league', label: t('league.title'), icon: '\u2694\uFE0F' },
    { key: 'challenges', label: t('profile.dailyChallenges'), icon: '\u{1F4CB}' },
  ];

  // Handle initial tab from URL params
  useEffect(() => {
    if (params.tab === 'league') {
      setActiveTab('league');
      setLeaderboardType('league');
    } else if (params.tab === 'challenges') {
      setActiveTab('challenges');
    } else if (params.tab === 'badges') {
      setActiveTab('badges');
    }
  }, [params.tab]);

  const loadSummary = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await getUserGamificationSummary();
      setSummary(data);

      // Also load league info if user is authenticated
      if (user?.id) {
        const leagueData = await getUserLeagueInfo(user.id);
        setLeagueInfo(leagueData);
      }
    } catch (error) {
      console.warn('[GamificationScreen] Failed to load summary:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary])
  );

  const handleRefresh = useCallback(() => {
    loadSummary(true);
  }, [loadSummary]);

  const handleTabPress = useCallback((tabKey: TabKey, index: number) => {
    setActiveTab(tabKey);
    if (tabKey === 'league') {
      setLeaderboardType('league');
    }

    // Animate tab indicator
    Animated.spring(tabTranslateX, {
      toValue: (SCREEN_WIDTH - 32) / 3 * index,
      useNativeDriver: false,
      tension: 300,
      friction: 30,
    }).start();
  }, [tabTranslateX]);

  const renderTabBar = () => (
    <View style={[styles.tabBar, { backgroundColor: colors.cardBackground }]}>
      {tabs.map((tab, index) => (
        <Pressable
          key={tab.key}
          style={styles.tabButton}
          onPress={() => handleTabPress(tab.key, index)}
        >
          <Text style={styles.tabIcon}>{tab.icon}</Text>
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === tab.key ? colors.tint : colors.textSecondary },
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            backgroundColor: colors.tint,
            transform: [{ translateX: tabTranslateX }],
          },
        ]}
      />
    </View>
  );

  const renderBadgesContent = () => (
    <>
      {/* Level Progress Card */}
      {summary && <LevelProgressCard progress={summary.progress} />}

      {/* Stats Section */}
      {summary && (
        <GamificationStats
          wateringStreak={summary.progress.watering_streak}
          plantsCount={0}
          postsCount={0}
        />
      )}

      {/* Badge Grid */}
      {summary && <BadgeGrid badges={summary.badges} />}

      {/* Recent Activity */}
      {summary && summary.recent_activity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('profile.recentActivity')}
          </Text>
          <View style={styles.activityList}>
            {summary.recent_activity.slice(0, 5).map((activity, index) => (
              <View
                key={index}
                style={[styles.activityItem, { backgroundColor: colors.cardBackground }]}
              >
                <Text style={styles.activityIcon}>
                  {activity.event_type === 'watering_completed' ? '\u{1F4A7}' :
                   activity.event_type === 'reminder_completed' ? '\u23F0' :
                   activity.event_type === 'plant_added' ? '\u{1F331}' :
                   activity.event_type === 'post_published' ? '\u{1F4F7}' :
                   activity.event_type === 'daily_checkin' ? '\u2705' : '\u2B50'}
                </Text>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
                    {t(`gamification.events.${activity.event_type}`, activity.event_type)}
                  </Text>
                  <Text style={[styles.activityXP, { color: colors.tint }]}>
                    +{activity.xp_awarded} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );

  const renderLeagueContent = () => (
    <>
      {/* Week countdown banner */}
      {leagueInfo && (
        <View style={[styles.weekBanner, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.weekBannerText, { color: colors.text }]}>
            {getWeekCountdownText()}
          </Text>
        </View>
      )}

      {/* League Leaderboard */}
      <View style={styles.leaderboardContainer}>
        <Leaderboard
          type={leaderboardType}
          onTypeChange={setLeaderboardType}
          limit={30}
        />
      </View>
    </>
  );

  const renderChallengesContent = () => (
    <>
      {summary && <DailyChallenges challenges={summary.daily_challenges} />}

      {/* Empty state for challenges */}
      {summary && summary.daily_challenges.length === 0 && (
        <View style={styles.emptySection}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('profile.noChallengesToday')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('profile.noRecentActivity')}
          </Text>
        </View>
      )}
    </>
  );

  const getWeekCountdownText = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    // Days until Sunday (0 = Sunday, so if today is Sunday, we show 7)
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;

    if (daysUntilSunday === 1) {
      return t('league.weekEndsIn', { days: 1 }).replace('giorni', 'giorno');
    }
    return t('league.weekEndsIn', { days: daysUntilSunday });
  }, [t]);

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <AtmosphericBackdrop />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile.gamificationTitle')}
          </Text>
        </View>
        <ActivityIndicator size="large" color={colors.tint} style={styles.loader} />
      </ThemedView>
    );
  }

  if (!summary) {
    return (
      <ThemedView style={styles.container}>
        <AtmosphericBackdrop />
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile.gamificationTitle')}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {t('common.error')}
          </Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <AtmosphericBackdrop />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('profile.gamificationTitle')}
          </Text>
        </View>

        {/* Tab Bar */}
        {renderTabBar()}

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'badges' && renderBadgesContent()}
          {activeTab === 'league' && renderLeagueContent()}
          {activeTab === 'challenges' && renderChallengesContent()}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
  },
  // Tab styles
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: (SCREEN_WIDTH - 40) / 3,
    height: '90%',
    borderRadius: 12,
  },
  tabContent: {
    flex: 1,
  },
  // Week banner
  weekBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  weekBannerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Leaderboard
  leaderboardContainer: {
    flex: 1,
    minHeight: 400,
  },
  // Activity section
  activitySection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  activityList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  activityIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  activityXP: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Empty state
  emptySection: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 100,
  },
});
