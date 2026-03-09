/**
 * LeagueMiniWidget Component
 *
 * Compact widget for Home screen showing current league tier and rank.
 *
 * @module components/Gamification/LeagueMiniWidget
 */
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { LeagueBadge } from '@/components/Gamification/LeagueBadge';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getUserLeagueInfo, UserLeagueInfo } from '@/services/leagueService';
import { useAuthStore } from '@/stores/authStore';

export interface LeagueMiniWidgetProps {
  onPress?: () => void;
}

/**
 * Compact widget showing user's current league and rank.
 * Taps navigate to the gamification hub's league tab.
 */
export function LeagueMiniWidget({ onPress }: LeagueMiniWidgetProps) {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuthStore();

  const [leagueInfo, setLeagueInfo] = useState<UserLeagueInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setLoading(false);
      return;
    }

    loadLeagueInfo();
  }, [isAuthenticated, user?.id]);

  const loadLeagueInfo = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const info = await getUserLeagueInfo(user.id);
      setLeagueInfo(info);
    } catch (error) {
      console.warn('[LeagueMiniWidget] Failed to load league info:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to gamification hub with league tab active
      router.push('/gamification?tab=league');
    }
  }, [onPress, router]);

  // Don't show widget for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Loading state with skeleton
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.skeletonRow}>
          <View style={[styles.skeletonBadge, { backgroundColor: colors.textSecondary + '30' }]} />
          <View style={styles.skeletonText}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.textSecondary + '20' }]} />
          </View>
        </View>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  }

  // Empty state: user not in league yet
  if (!leagueInfo) {
    return (
      <Pressable
        style={[styles.container, styles.emptyContainer, { backgroundColor: colors.cardBackground }]}
        onPress={handlePress}
      >
        <Text style={styles.emptyIcon}>\u2694\uFE0F</Text>
        <View style={styles.emptyTextContainer}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('league.title')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('league.notAssigned')}
          </Text>
        </View>
        <Text style={[styles.arrow, { color: colors.textSecondary }]}>{'>'}</Text>
      </Pressable>
    );
  }

  const tierName = t(`league.${leagueInfo.tier}`);

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
      onPress={handlePress}
    >
      <View style={styles.leftContent}>
        <LeagueBadge tier={leagueInfo.tier} size={24} showBackground />
        <View style={styles.textContainer}>
          <Text style={[styles.tierName, { color: colors.text }]}>
            {tierName}
          </Text>
          {leagueInfo.current_rank !== null && (
            <Text style={[styles.rankText, { color: colors.textSecondary }]}>
              {t('league.yourRank', { rank: leagueInfo.current_rank })}
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.arrow, { color: colors.textSecondary }]}>{'>'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  emptyContainer: {
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  tierName: {
    fontSize: 16,
    fontWeight: '600',
  },
  rankText: {
    fontSize: 13,
    marginTop: 2,
  },
  arrow: {
    fontSize: 18,
    fontWeight: '500',
    marginLeft: 8,
  },
  // Empty state styles
  emptyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  emptyTextContainer: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  // Skeleton styles
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  skeletonBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  skeletonText: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 4,
    width: '60%',
  },
});

export default LeagueMiniWidget;
