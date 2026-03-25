import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { CompactLevelProgress } from '@/components/Gamification/CompactLevelProgress';
import { ProfileEditModal } from '@/components/ProfileEditModal';
import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getUserGamificationSummary } from '@/services/gamificationService';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { usePlantsStore } from '@/stores/plantsStore';
import type { GamificationSummary } from '@/types/gamification';

export default function GardenScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const { user } = useAuthStore();
  const {
    currentProfile,
    isLoading,
    fetchCurrentProfile,
    refreshStats,
  } = useProfileStore();
  const plants = usePlantsStore((s) => s.plants);

  const [showEditModal, setShowEditModal] = useState(false);
  const [gamificationSummary, setGamificationSummary] = useState<GamificationSummary | null>(null);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);

  const identifiedCount = plants.filter(p => p.entryKind !== 'sighting').length;
  const savedCount = plants.length;
  const sightingsCount = plants.filter(p => p.entryKind === 'sighting').length;

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

  useEffect(() => {
    if (user && !currentProfile) {
      fetchCurrentProfile(user.id);
    }
  }, [user, currentProfile, fetchCurrentProfile]);

  useEffect(() => {
    void loadGamificationSummary();
  }, [loadGamificationSummary]);

  useFocusEffect(
    useCallback(() => {
      if (user && currentProfile) {
        refreshStats();
      }
      void loadGamificationSummary();
    }, [user, currentProfile, refreshStats, loadGamificationSummary])
  );

  if (isLoading && !currentProfile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  const renderPlantCard = ({ item }: { item: typeof plants[0] }) => {
    const name = item.nickname || item.commonName || item.scientificName || item.species || 'Unknown';
    const subtitle = item.commonName && item.scientificName
      ? item.scientificName
      : item.species || '';

    return (
      <TouchableOpacity
        style={[styles.plantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/plant/${item.id}` as const)}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <View style={styles.plantImageContainer}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.plantImage} resizeMode="cover" />
          ) : (
            <View style={[styles.plantImagePlaceholder, { backgroundColor: colors.surfaceStrong }]}>
              <MaterialIcons name="local-florist" size={32} color={colors.tint} />
            </View>
          )}
          {item.entryKind === 'sighting' && (
            <View style={styles.sightingBadge}>
              <MaterialIcons name="visibility" size={10} color="#fff" />
            </View>
          )}
        </View>
        <View style={styles.plantCardContent}>
          <Text style={[styles.plantName, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          {subtitle ? (
            <Text style={[styles.plantSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.waterButton} accessibilityRole="button">
          <MaterialIcons name="water-drop" size={16} color={colors.tint} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.screenTitle, { color: colors.text }]}>My Garden</Text>
          <TouchableOpacity style={styles.cameraButton} accessibilityRole="button" onPress={() => router.push('/camera')}>
            <MaterialIcons name="photo-camera" size={22} color="#0d1117" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{identifiedCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Identified</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{savedCount - sightingsCount}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saved</Text>
          </View>
        </View>

        {/* User Profile Mini Card */}
        {user && currentProfile && (
          <TouchableOpacity
            style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Avatar uri={currentProfile.avatar_url} size={44} borderColor={colors.border} borderWidth={1} />
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {currentProfile.display_name || t('profile.displayName')}
              </Text>
              <Text style={[styles.userBio, { color: colors.textSecondary }]} numberOfLines={1}>
                {currentProfile.bio || t('profile.bioPlaceholder', { defaultValue: 'Create a small corner that tells your plant story.' })}
              </Text>
            </View>
            <MaterialIcons name="edit" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Gamification Level */}
        {gamificationSummary && (
          <TouchableOpacity
            style={[styles.levelCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/gamification')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={styles.levelHeader}>
              <MaterialIcons name="emoji-events" size={18} color={colors.tint} />
              <Text style={[styles.levelLabel, { color: colors.text }]}>
                {t('profile.level')} {gamificationSummary.progress.level}
              </Text>
              <Text style={[styles.levelXp, { color: colors.textSecondary }]}>
                {gamificationSummary.progress.xp_in_level}/{gamificationSummary.progress.xp_for_next_level} XP
              </Text>
            </View>
            <CompactLevelProgress progress={gamificationSummary.progress} />
            <View style={styles.levelStats}>
              <View style={styles.levelStat}>
                <Text style={[styles.levelStatValue, { color: colors.text }]}>{gamificationSummary.progress.xp_total}</Text>
                <Text style={[styles.levelStatLabel, { color: colors.textSecondary }]}>{t('profile.totalXp')}</Text>
              </View>
              <View style={styles.levelStat}>
                <Text style={[styles.levelStatValue, { color: colors.text }]}>{gamificationSummary.progress.watering_streak}</Text>
                <Text style={[styles.levelStatLabel, { color: colors.textSecondary }]}>{t('profile.wateringStreak')}</Text>
              </View>
              <View style={styles.levelStat}>
                <Text style={[styles.levelStatValue, { color: colors.text }]}>{gamificationSummary.badges.length}</Text>
                <Text style={[styles.levelStatLabel, { color: colors.textSecondary }]}>{t('profile.badges')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Plants Grid */}
        {plants.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t('home.todayCollectionTitle', { defaultValue: 'Your Plants' })}
            </Text>
            <View style={styles.plantsGrid}>
              {plants.slice(0, 8).map(plant => (
                <View key={plant.id}>
                  {renderPlantCard({ item: plant })}
                </View>
              ))}
            </View>
            {plants.length > 8 && (
              <TouchableOpacity
                style={[styles.seeAllButton, { backgroundColor: colors.surfaceStrong }]}
                onPress={() => {}}
                accessibilityRole="button"
              >
                <Text style={[styles.seeAllText, { color: colors.tint }]}>
                  View All ({plants.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {plants.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="local-florist" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {t('profile.noPlantsHint', { defaultValue: 'No plants yet' })}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Start identifying plants to build your garden
            </Text>
            <Button variant="primary" size="md" onPress={() => router.push('/camera')}>
              {t('camera.title', { defaultValue: 'Identify Plant' })}
            </Button>
          </View>
        )}

        {/* Badges Section */}
        {gamificationSummary && gamificationSummary.badges.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('profile.badges')}</Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {gamificationSummary.badges.length}
              </Text>
            </View>
            <View style={styles.badgesList}>
              {gamificationSummary.badges.map((badge) => (
                <View key={badge.badge_key} style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: colors.tintGlass }]}>
                    <MaterialIcons name="military-tech" size={16} color={colors.tint} />
                  </View>
                  <Text style={[styles.badgeTitle, { color: colors.text }]} numberOfLines={1}>
                    {t(`gamification.badges.${badge.badge_key}.title`, { defaultValue: badge.title ?? badge.badge_key })}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {currentProfile && (
        <ProfileEditModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentProfile={currentProfile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#13ec8e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#13ec8e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userBio: { fontSize: 13, marginTop: 2 },
  levelCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  levelLabel: { fontSize: 15, fontWeight: '700' },
  levelXp: { fontSize: 13, fontWeight: '600', marginLeft: 'auto' },
  levelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  levelStat: { alignItems: 'center' },
  levelStatValue: { fontSize: 18, fontWeight: '700' },
  levelStatLabel: { fontSize: 11, marginTop: 2 },
  section: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  plantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  plantCard: {
    width: '47%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  plantImageContainer: {
    height: 140,
    position: 'relative',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantCardContent: {
    padding: 10,
    paddingRight: 4,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  plantSubtitle: {
    fontSize: 12,
  },
  waterButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(19, 236, 142, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllButton: {
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    width: '47%',
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});
