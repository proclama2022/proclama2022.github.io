/**
 * Level Progress Card Component
 *
 * Displays user's current level, XP progress bar, and next level target.
 *
 * @module components/Gamification/LevelProgressCard
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { UserProgress } from '@/types/gamification';
import { getLevelTitle } from '@/types/gamification';

interface LevelProgressCardProps {
  progress: UserProgress;
}

/**
 * Level progress card showing XP bar and level info
 */
export function LevelProgressCard({ progress }: LevelProgressCardProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const progressPercent = Math.min(
    (progress.xp_in_level / progress.xp_for_next_level) * 100,
    100
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.header}>
        <Text style={[styles.levelBadge, { backgroundColor: colors.tint }]}>
          {t('gamification.toast.levelLabel', { level: progress.level })}
        </Text>
        <Text style={[styles.titleText, { color: colors.textSecondary }]}>
          {getLevelTitle(progress.level).emoji} {t(getLevelTitle(progress.level).i18nKey)}
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.tint,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {progress.xp_in_level} / {progress.xp_for_next_level} XP
        </Text>
      </View>

      <View style={styles.totalSection}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
          {t('profile.totalXp')}
        </Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          {progress.xp_total.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});

export default LevelProgressCard;