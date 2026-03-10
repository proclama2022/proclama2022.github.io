import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ThemedView , ThemedText } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { formatJoinedDate } from '@/lib/utils/dateFormatter';
import { LeagueBadge } from '@/components/Gamification/LeagueBadge';
import type { LeagueTierKey } from '@/types/gamification';
import { getLevelTitle } from '@/types/gamification';

interface ProfileStatsProps {
  stats: {
    plants_identified: number;
    followers_count: number;
    following_count: number;
    joined_date?: string; // ISO timestamp
    /** User's current league tier */
    league_tier?: LeagueTierKey;
    /** User's current level for title display */
    level?: number;
  };
  onStatPress?: (statType: 'plants' | 'followers' | 'following') => void;
  style?: ViewStyle;
}

// Format large numbers with K suffix
const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  stats,
  onStatPress,
  style,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const statItem = (
    icon: keyof typeof Ionicons.glyphMap,
    value: string,
    label: string,
    statType?: 'plants' | 'followers' | 'following'
  ) => {
    const content = (
      <ThemedView style={styles.statItem}>
        <Ionicons name={icon} size={24} color={colors.tint} />
        <ThemedText style={styles.statValue}>{value}</ThemedText>
        <ThemedText style={styles.statLabel}>{label}</ThemedText>
      </ThemedView>
    );

    if (onStatPress && statType) {
      return (
        <TouchableOpacity
          key={label}
          style={styles.statContainer}
          onPress={() => onStatPress(statType)}
          activeOpacity={0.7}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <View key={label} style={styles.statContainer}>
        {content}
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, style]}>
      {statItem(
        'leaf-outline',
        formatNumber(stats.plants_identified),
        t('profile.plants'),
        'plants'
      )}
      {statItem(
        'people-outline',
        formatNumber(stats.followers_count),
        t('profile.followers'),
        'followers'
      )}
      {statItem(
        'person-add-outline',
        formatNumber(stats.following_count),
        t('profile.following'),
        'following'
      )}
      <View style={styles.statContainer}>
        <ThemedView style={styles.statItem}>
          <Ionicons name="calendar-outline" size={24} color={colors.tint} />
          <ThemedText style={styles.statValue}>
            {stats.joined_date ? formatJoinedDate(stats.joined_date) : t('profile.joined')}
          </ThemedText>
        </ThemedView>
      </View>
      {/* League tier display */}
      {stats.league_tier && (
        <View style={styles.statContainer}>
          <ThemedView style={[styles.statItem, styles.leagueItem]}>
            <LeagueBadge
              tier={stats.league_tier}
              size={24}
              showBackground={true}
              showBronze={true}
            />
            <ThemedText style={styles.statValue}>
              {t(`league.${stats.league_tier}`)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>
              {t('league.title')}
            </ThemedText>
          </ThemedView>
        </View>
      )}
      {/* Level title display */}
      {stats.level && (
        <View style={styles.statContainer}>
          <ThemedView style={[styles.statItem, styles.levelTitleItem]}>
            <ThemedText style={styles.levelTitleEmoji}>
              {getLevelTitle(stats.level).emoji}
            </ThemedText>
            <ThemedText style={styles.statValue}>
              {t(getLevelTitle(stats.level).i18nKey)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>
              {t('profile.level')}
            </ThemedText>
          </ThemedView>
        </View>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statContainer: {
    width: '48%',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  leagueItem: {
    flexDirection: 'column',
    gap: 4,
  },
  levelTitleItem: {
    flexDirection: 'column',
    gap: 4,
  },
  levelTitleEmoji: {
    fontSize: 24,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default ProfileStats;
