import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from './Themed';
import { ThemedText } from './Themed';
import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/Colors';
import { formatJoinedDate } from '@/lib/utils/dateFormatter';

interface ProfileStatsProps {
  stats: {
    plants_identified: number;
    followers_count: number;
    following_count: number;
    joined_date?: string; // ISO timestamp
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
        'Plants',
        'plants'
      )}
      {statItem(
        'people-outline',
        formatNumber(stats.followers_count),
        'Followers',
        'followers'
      )}
      {statItem(
        'person-add-outline',
        formatNumber(stats.following_count),
        'Following',
        'following'
      )}
      <View style={styles.statContainer}>
        <ThemedView style={styles.statItem}>
          <Ionicons name="calendar-outline" size={24} color={colors.tint} />
          <ThemedText style={styles.statValue}>
            {stats.joined_date ? formatJoinedDate(stats.joined_date) : 'Joined'}
          </ThemedText>
        </ThemedView>
      </View>
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
