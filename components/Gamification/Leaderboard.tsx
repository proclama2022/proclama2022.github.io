/**
 * Leaderboard Component
 *
 * Displays a ranking of top users by XP, streak, badges, or league.
 * League mode includes zone highlighting (promotion/relegation).
 *
 * @module components/Gamification/Leaderboard
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import Avatar from '@/components/Avatar';
import { LeagueBadge } from '@/components/Gamification/LeagueBadge';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { getSupabaseClient } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { getLeagueLeaderboard } from '@/services/leagueService';
import type { LeaderboardEntry as LeagueLeaderboardEntry, LeagueTierKey } from '@/types/gamification';

export type LeaderboardType = 'xp' | 'streak' | 'badges' | 'league';

interface StandardLeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  type: LeaderboardType;
  onTypeChange?: (type: LeaderboardType) => void;
  limit?: number;
}

// Zone colors per CONTEXT.md
const PROMOTION_ZONE_COLOR = '#4CAF5020'; // Green tint for top 10
const RELEGATION_ZONE_COLOR = '#F4433620'; // Red tint for bottom 5

// Avatar size per CONTEXT.md (32px for compact layout)
const COMPACT_AVATAR_SIZE = 32;

/**
 * Leaderboard showing top users with segmented control for type
 */
export function Leaderboard({ type, onTypeChange, limit = 20 }: LeaderboardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [entries, setEntries] = useState<StandardLeaderboardEntry[]>([]);
  const [leagueEntries, setLeagueEntries] = useState<LeagueLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const leaderboardTypes: LeaderboardType[] = ['xp', 'streak', 'badges', 'league'];

  useEffect(() => {
    fetchLeaderboard();
  }, [type, limit]);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Handle league mode separately
      if (type === 'league') {
        await fetchLeagueLeaderboard();
        return;
      }

      const supabase = getSupabaseClient();

      // Get current user ID
      let currentUserId: string | null = null;
      if (user?.id) {
        currentUserId = user.id;
      } else {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id ?? null;
      }

      // Query for leaderboard based on type
      let orderColumn: string;

      switch (type) {
        case 'xp':
          orderColumn = 'xp_total';
          break;
        case 'streak':
          orderColumn = 'watering_streak';
          break;
        case 'badges':
          orderColumn = 'badge_count';
          break;
        default:
          orderColumn = 'xp_total';
      }

      // Build query
      let query = supabase
        .from('user_progress')
        .select(`
          user_id,
          xp_total,
          watering_streak,
          level,
          profiles:user_id(display_name, avatar_url)
        `)
        .order(orderColumn, { ascending: false })
        .limit(limit);

      const { data: progressData, error: progressError } = await query;

      if (progressError) {
        console.warn('[Leaderboard] Failed to fetch progress:', progressError.message);
        setError('Failed to load leaderboard');
        setLoading(false);
        return;
      }

      // If type is badges, we need to get badge counts
      let badgeCounts: Record<string, number> = {};

      if (type === 'badges') {
        const { data: badgeData } = await supabase
          .from('user_badges')
          .select('user_id');

        if (badgeData) {
          badgeData.forEach((badge) => {
            badgeCounts[badge.user_id] = (badgeCounts[badge.user_id] || 0) + 1;
          });
        }
      }

      // Build entries with ranks
      const processedEntries: StandardLeaderboardEntry[] = (progressData || [])
        .slice(0, limit)
        .map((item, index) => {
          let score: number;
          switch (type) {
            case 'xp':
              score = item.xp_total || 0;
              break;
            case 'streak':
              score = item.watering_streak || 0;
              break;
            case 'badges':
              score = badgeCounts[item.user_id] || 0;
              break;
            default:
              score = item.xp_total || 0;
          }

          return {
            rank: index + 1,
            user_id: item.user_id,
            display_name: item.profiles?.display_name || 'Unknown',
            avatar_url: item.profiles?.avatar_url || null,
            score,
            isCurrentUser: item.user_id === currentUserId,
          };
        });

      // Find current user position if not in top results
      if (currentUserId && !processedEntries.find(e => e.isCurrentUser)) {
        const { data: userRankData } = await supabase
          .from('user_progress')
          .select('user_id, xp_total, watering_streak')
          .eq('user_id', currentUserId)
          .single();

        if (userRankData) {
          let userScore: number;
          switch (type) {
            case 'xp':
              userScore = userRankData.xp_total || 0;
              break;
            case 'streak':
              userScore = userRankData.watering_streak || 0;
              break;
            case 'badges':
              userScore = badgeCounts[currentUserId] || 0;
              break;
            default:
              userScore = userRankData.xp_total || 0;
          }

          // Calculate rank
          const higherCount = (progressData || []).filter((item) => {
            let itemScore: number;
            switch (type) {
              case 'xp':
                itemScore = item.xp_total || 0;
                break;
              case 'streak':
                itemScore = item.watering_streak || 0;
                break;
              case 'badges':
                itemScore = badgeCounts[item.user_id] || 0;
                break;
              default:
                itemScore = item.xp_total || 0;
            }
            return itemScore > userScore;
          }).length;

          // Add current user to the list
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', currentUserId)
            .single();

          processedEntries.push({
            rank: higherCount + 1,
            user_id: currentUserId,
            display_name: userProfile?.display_name || 'You',
            avatar_url: userProfile?.avatar_url || null,
            score: userScore,
            isCurrentUser: true,
          });

          // Sort by rank
          processedEntries.sort((a, b) => a.rank - b.rank);
        }
      }

      setEntries(processedEntries);
      setLeagueEntries([]);
    } catch (err) {
      console.warn('[Leaderboard] Error:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [type, limit, user?.id]);

  const fetchLeagueLeaderboard = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();

      // Get current user ID
      let currentUserId: string | null = null;
      if (user?.id) {
        currentUserId = user.id;
      } else {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData.user?.id ?? null;
      }

      if (!currentUserId) {
        setLeagueEntries([]);
        setError(null);
        return;
      }

      const data = await getLeagueLeaderboard(currentUserId, limit);
      setLeagueEntries(data);
      setEntries([]);
    } catch (err) {
      console.warn('[Leaderboard] League fetch error:', err);
      setError('Failed to load league leaderboard');
    }
  }, [limit, user?.id]);

  const getZoneStyle = useCallback((entry: LeagueLeaderboardEntry) => {
    if (entry.is_promotion_zone) {
      return { backgroundColor: PROMOTION_ZONE_COLOR };
    }
    if (entry.is_relegation_zone) {
      return { backgroundColor: RELEGATION_ZONE_COLOR };
    }
    return {};
  }, []);

  const renderStandardEntry = useCallback(({ item }: { item: StandardLeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;
    const rankEmojis = ['\u{1F947}', '\u{1F948}', '\u{1F9C9}']; // Gold, Silver, Bronze

    return (
      <View
        style={[
          styles.entry,
          {
            backgroundColor: item.isCurrentUser ? colors.tint + '20' : colors.cardBackground,
            borderColor: item.isCurrentUser ? colors.tint : 'transparent',
            borderWidth: item.isCurrentUser ? 2 : 0,
          },
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.topRankEmoji}>{rankEmojis[item.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rank, { color: colors.textSecondary }]}>
              {item.rank}
            </Text>
          )}
        </View>

        <Avatar uri={item.avatar_url} size={44} />

        <View style={styles.nameContainer}>
          <Text
            style={[
              styles.displayName,
              { color: item.isCurrentUser ? colors.tint : colors.text },
            ]}
            numberOfLines={1}
          >
            {item.display_name}
          </Text>
          {item.isCurrentUser && (
            <Text style={[styles.youBadge, { color: colors.tint }]}>
              ({t('common.you') || 'You'})
            </Text>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.text }]}>
            {type === 'xp' ? item.score.toLocaleString() : item.score}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
            {type === 'xp' ? 'XP' : type === 'streak' ? t('stats.days') : t('profile.badges')}
          </Text>
        </View>
      </View>
    );
  }, [colors, t, type]);

  const renderLeagueEntry = useCallback(({ item }: { item: LeagueLeaderboardEntry }) => {
    const isTopThree = item.rank <= 3;
    const rankEmojis = ['\u{1F947}', '\u{1F948}', '\u{1F9C9}'];
    const zoneStyle = getZoneStyle(item);

    return (
      <View
        style={[
          styles.entry,
          styles.leagueEntry,
          {
            backgroundColor: item.is_current_user ? colors.tint + '20' : colors.cardBackground,
            borderColor: item.is_current_user ? colors.tint : 'transparent',
            borderWidth: item.is_current_user ? 2 : 0,
            ...zoneStyle,
          },
        ]}
      >
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.topRankEmoji}>{rankEmojis[item.rank - 1]}</Text>
          ) : (
            <Text style={[styles.rank, { color: colors.textSecondary }]}>
              {item.rank}
            </Text>
          )}
        </View>

        <Avatar uri={item.avatar_url} size={COMPACT_AVATAR_SIZE} />

        <View style={styles.nameContainer}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.displayName,
                { color: item.is_current_user ? colors.tint : colors.text },
              ]}
              numberOfLines={1}
            >
              {item.display_name}
            </Text>
            <LeagueBadge tier={item.league_tier} size={14} />
          </View>
          {item.is_current_user && (
            <Text style={[styles.youBadge, { color: colors.tint }]}>
              ({t('common.you') || 'You'})
            </Text>
          )}
        </View>

        <View style={styles.scoreContainer}>
          <Text style={[styles.score, { color: colors.text }]}>
            {item.xp_this_week.toLocaleString()}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
            XP
          </Text>
        </View>
      </View>
    );
  }, [colors, getZoneStyle, t]);

  const renderItem = type === 'league' ? renderLeagueEntry : renderStandardEntry;

  const data = type === 'league' ? leagueEntries : entries;

  return (
    <View style={styles.container}>
      {/* Segmented Control */}
      <View style={[styles.segmentedControl, { backgroundColor: colors.cardBackground }]}>
        {leaderboardTypes.map((lbType) => (
          <Pressable
            key={lbType}
            style={[
              styles.segment,
              type === lbType && { backgroundColor: colors.tint },
            ]}
            onPress={() => onTypeChange?.(lbType)}
          >
            <Text
              style={[
                styles.segmentText,
                { color: type === lbType ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              {lbType === 'xp' ? 'XP' :
               lbType === 'streak' ? t('profile.wateringStreak') :
               lbType === 'badges' ? t('profile.badges') :
               t('league.title')}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.tint} style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.user_id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
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
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  leagueEntry: {
    padding: 10,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: '700',
  },
  topRankEmoji: {
    fontSize: 24,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    fontSize: 15,
    fontWeight: '600',
  },
  youBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 11,
  },
});

export default Leaderboard;
