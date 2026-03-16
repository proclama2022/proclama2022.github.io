/**
 * Badge Grid Component
 *
 * Displays user's unlocked badges in a grid, with locked badges shown as locked.
 *
 * @module components/Gamification/BadgeGrid
 */
import React, { useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { BadgeProgress, UserBadge } from '@/types/gamification';

/**
 * All 10 badge keys in the system
 * Maps to badges_catalog entries + logic-based badges
 */
const ALL_BADGE_KEYS = [
  'first_plant',
  'green_thumb',       // maps to watering_streak_7
  'plant_parent',
  'community_star',
  'early_bird',
  'plant_doctor',
  'social_butterfly',
  'weekend_warrior',
  'watering_streak_30',
  'level_5',
  'level_10',
] as const;

/**
 * Badge key mapping for RPC compatibility
 * Maps display badge keys to database badge keys returned by get_badge_progress()
 */
const BADGE_KEY_ALIASES: Record<string, string> = {
  'green_thumb': 'watering_streak_7',
};

/**
 * Badge emoji mapping for display
 */
const BADGE_EMOJIS: Record<string, string> = {
  first_plant: '🌱',
  green_thumb: '🌿',
  watering_streak_7: '🌿',
  plant_parent: '👨‍🌾',
  community_star: '⭐',
  early_bird: '🌅',
  plant_doctor: '🩺',
  social_butterfly: '🦋',
  weekend_warrior: '🏆',
  watering_streak_30: '🌳',
  level_5: '⭐',
  level_10: '🌟',
};

interface BadgeGridProps {
  badges: UserBadge[];
  allBadgeKeys?: string[];
  badgeProgress?: BadgeProgress[];
  horizontal?: boolean; // Layout: horizontal scroll (default) or vertical grid
}

/**
 * Badge grid showing unlocked and locked badges
 */
export function BadgeGrid({ badges, allBadgeKeys = [], badgeProgress, horizontal = true }: BadgeGridProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [selectedLockedBadge, setSelectedLockedBadge] = useState<{ key: string; progress?: BadgeProgress } | null>(null);

  const unlockedKeys = new Set(badges.map((b) => b.badge_key));

  // Build progress lookup map
  const progressByKey = new Map<string, BadgeProgress>();
  (badgeProgress ?? []).forEach((bp) => {
    progressByKey.set(bp.badge_key, bp);
  });

  // Get all possible badges - use provided list or default full list
  const allBadges = allBadgeKeys.length > 0 ? allBadgeKeys : [...ALL_BADGE_KEYS];

  const screenWidth = Dimensions.get('window').width;
  // Horizontal: 16px padding * 2 + 12px gap * 3 / 4 items
  // Vertical: 16px padding * 2 + 12px gap * 3 / 4 items
  const badgeSize = horizontal
    ? (screenWidth - 48 - 24) / 4
    : (screenWidth - 32 - 36) / 4;

  const renderBadge = (badgeKey: string, index: number) => {
    const isUnlocked = unlockedKeys.has(badgeKey);
    const badge = badges.find((b) => b.badge_key === badgeKey);
    // Look up progress using both the original key and the mapped key
    const dbBadgeKey = BADGE_KEY_ALIASES[badgeKey] || badgeKey;
    const progress = progressByKey.get(badgeKey) || progressByKey.get(dbBadgeKey);
    const badgeEmoji = BADGE_EMOJIS[badgeKey] || '🏆';

    return (
      <TouchableOpacity
        key={badgeKey}
        style={[
          styles.badgeItem,
          {
            width: badgeSize,
            height: badgeSize,
            backgroundColor: isUnlocked ? colors.cardBackground : colors.backgroundLight,
          },
        ]}
        onPress={() => {
          if (isUnlocked && badge) {
            setSelectedBadge(badge);
          } else if (!isUnlocked && progress) {
            setSelectedLockedBadge({ key: badgeKey, progress });
          }
        }}
      >
        <View
          style={[
            styles.badgeIcon,
            {
              backgroundColor: isUnlocked ? colors.tint : colors.border,
            },
          ]}
        >
          <Text style={styles.badgeEmoji}>
            {isUnlocked ? badgeEmoji : '🔒'}
          </Text>
        </View>
        <Text
          style={[
            styles.badgeTitle,
            { color: isUnlocked ? colors.text : colors.textTertiary },
          ]}
          numberOfLines={2}
        >
          {t(`gamification.badges.${badgeKey}.title`, badgeKey)}
        </Text>
        {!isUnlocked && progress && (
          <Text style={[styles.progressText, { color: colors.textTertiary }]}>
            {progress.current}/{progress.target}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('profile.badges')}
      </Text>

      {/* Empty state for vertical layout when no badges */}
      {allBadges.length === 0 && !horizontal && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t('gamification.badges.emptyTitle')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {t('gamification.badges.emptySubtitle')}
          </Text>
        </View>
      )}

      {/* Horizontal scroll layout */}
      {horizontal && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {allBadges.map(renderBadge)}
        </ScrollView>
      )}

      {/* Vertical grid layout */}
      {!horizontal && allBadges.length > 0 && (
        <View style={styles.gridContainer}>
          {allBadges.map(renderBadge)}
        </View>
      )}

      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedBadge(null)}
        >
          {selectedBadge && (
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.modalBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.modalEmoji}>{BADGE_EMOJIS[selectedBadge.badge_key] || '🏆'}</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedBadge.title || t(`gamification.badges.${selectedBadge.badge_key}.title`)}
              </Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {selectedBadge.description || t(`gamification.badges.${selectedBadge.badge_key}.description`)}
              </Text>
              {selectedBadge.awarded_at && (
                <Text style={[styles.modalDate, { color: colors.textTertiary }]}>
                  {new Date(selectedBadge.awarded_at).toLocaleDateString()}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.tint }]}
                onPress={() => setSelectedBadge(null)}
              >
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Locked Badge Modal */}
      <Modal
        visible={selectedLockedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLockedBadge(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedLockedBadge(null)}
        >
          {selectedLockedBadge && (
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
              <View style={[styles.modalBadge, { backgroundColor: colors.border }]}>
                <Text style={styles.modalEmoji}>🔒</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t(`gamification.badges.${selectedLockedBadge.key}.title`)}
              </Text>
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                {t(`gamification.badges.${selectedLockedBadge.key}.description`)}
              </Text>
              {selectedLockedBadge.progress && (
                <Text style={[styles.modalProgress, { color: colors.tint }]}>
                  {t('gamification.badges.progress', {
                    current: selectedLockedBadge.progress.current,
                    target: selectedLockedBadge.progress.target,
                  })}
                </Text>
              )}
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: colors.tint }]}
                onPress={() => setSelectedLockedBadge(null)}
              >
                <Text style={styles.modalCloseText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  badgeItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 8,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeTitle: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
  },
  modalBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalEmoji: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  modalDate: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalProgress: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalClose: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default BadgeGrid;