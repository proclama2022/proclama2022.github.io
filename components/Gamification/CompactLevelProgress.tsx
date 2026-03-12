/**
 * Compact Level Progress Component
 *
 * Displays a compact XP progress bar with level badge, title, and XP progress.
 * Designed for profile header integration.
 *
 * Layout (horizontal, 48px height):
 * ┌────────────────────────────────────────┐
 * │ L5 🌱 Seedling                         │
 * │ ████████░░░░░░░░░░░░ 120/200 XP        │
 * └────────────────────────────────────────┘
 *
 * @module components/Gamification/CompactLevelProgress
 */
import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { UserProgress } from '@/types/gamification';
import { getLevelTitle } from '@/types/gamification';

interface CompactLevelProgressProps {
  progress: UserProgress;
  onPress?: () => void;
}

/**
 * Compact XP progress bar component
 *
 * Shows level badge, title, XP bar, and XP text in a horizontal layout.
 * Entire block is tappable via onPress callback.
 */
export function CompactLevelProgress({ progress, onPress }: CompactLevelProgressProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const progressPercent = Math.min(
    (progress.xp_in_level / progress.xp_for_next_level) * 100,
    100
  );

  const levelTitle = getLevelTitle(progress.level);

  return (
    <TouchableOpacity
      testID="compact-progress-touchable"
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Row 1: Level badge + Title */}
      <View style={styles.row1}>
        <Text style={[styles.levelBadge, { backgroundColor: colors.tint }]}>
          {t('gamification.toast.levelLabel', { level: progress.level })}
        </Text>
        <Text style={[styles.titleText, { color: colors.textSecondary }]}>
          {levelTitle.emoji} {t(levelTitle.i18nKey)}
        </Text>
      </View>

      {/* Row 2: Progress bar + XP text */}
      <View style={styles.row2}>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
          <View
            testID="xp-progress-bar"
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.tint,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.xpText, { color: colors.textSecondary }]}>
          {progress.xp_in_level}/{progress.xp_for_next_level} XP
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  xpText: {
    fontSize: 11,
    fontWeight: '600',
    minWidth: 70,
    textAlign: 'right',
  },
});

export default CompactLevelProgress;
