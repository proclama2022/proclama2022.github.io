import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import Onboarding from '@/components/Onboarding';
import PlantGrid from '@/components/PlantGrid';
import SearchFilterBar, { WateringFilter, DifficultyFilter } from '@/components/SearchFilterBar';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { usePlantsStore } from '@/stores/plantsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useSearchStore } from '@/stores/searchStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getCareInfo } from '@/services/careDB';
import { SavedPlant } from '@/types';

function fuzzyMatch(target: string, query: string): boolean {
  const t = target.toLowerCase();
  const q = query.toLowerCase();
  let ti = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const idx = t.indexOf(q[qi], ti);
    if (idx === -1) return false;
    ti = idx + 1;
  }
  return true;
}

function plantMatchesSearch(plant: SavedPlant, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim();
  const fields = [
    plant.nickname, plant.commonName, plant.scientificName, plant.species, plant.location,
  ].filter(Boolean) as string[];
  return fields.some(field => fuzzyMatch(field, q));
}

function plantMatchesWateringFilter(plant: SavedPlant, filter: WateringFilter): boolean {
  if (filter === 'all') return true;
  const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
  if (!care) return false;
  const now = new Date();
  const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
  if (!lastWatered) return filter === 'needsWater';
  const daysSinceWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24);
  return filter === 'needsWater' ? daysSinceWatered >= care.waterFrequencyDays : daysSinceWatered < care.waterFrequencyDays;
}

function plantMatchesDifficultyFilter(plant: SavedPlant, filter: DifficultyFilter): boolean {
  if (filter === 'all') return true;
  const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
  if (!care) return false;
  return care.difficulty === filter;
}

export default function HomeScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [searchQuery, setSearchQuery] = useState('');
  const { wateringFilter, difficultyFilter, setWateringFilter, setDifficultyFilter, clearFilters } = useSearchStore();

  // FAB entrance animation
  const fabScale = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleWateringChange = useCallback((f: WateringFilter) => setWateringFilter(f), []);
  const handleDifficultyChange = useCallback((f: DifficultyFilter) => setDifficultyFilter(f), []);
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    clearFilters();
  }, [clearFilters]);

  const filteredPlants = useMemo(() => {
    return plants.filter(plant =>
      plantMatchesSearch(plant, searchQuery) &&
      plantMatchesWateringFilter(plant, wateringFilter) &&
      plantMatchesDifficultyFilter(plant, difficultyFilter)
    );
  }, [plants, searchQuery, wateringFilter, difficultyFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || wateringFilter !== 'all' || difficultyFilter !== 'all';

  const emptyStateMessage = (() => {
    if (searchQuery.trim()) {
      return t('search.noResultsQuery', { query: searchQuery.trim() });
    }
    if (wateringFilter === 'needsWater') return t('search.noResultsNeedsWater');
    if (wateringFilter === 'waterOk') return t('search.noResultsWaterOk');
    if (difficultyFilter !== 'all') return t('search.noResultsDifficulty', { level: t(`search.${difficultyFilter}`) });
    return t('search.noResults');
  })();

  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  if (plants.length === 0) {
    return (
      <>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('common.welcome', { defaultValue: 'Welcome to' })}</Text>
            <Text style={[styles.screenTitle, { color: colors.text }]}>Plantid</Text>
          </View>
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="leaf" size={60} color={colors.tint} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('collection.empty')}</Text>
            <Text style={[styles.emptyCTA, { color: colors.textSecondary }]}>{t('collection.emptyCTA')}</Text>
            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: colors.fab }]}
              onPress={() => router.push('/camera' as const)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={t('camera.title')}
            >
              <Ionicons name="camera" size={22} color="#fff" />
              <Text style={styles.cameraButtonText}>{t('camera.title')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <BannerAdWrapper />
      </>
    );
  }

  return (
    <>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('collection.my', { defaultValue: 'My' })}</Text>
          <Text style={[styles.screenTitle, { color: colors.text }]}>{t('collection.title')}</Text>
        </View>

        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          wateringFilter={wateringFilter}
          onWateringFilterChange={handleWateringChange}
          difficultyFilter={difficultyFilter}
          onDifficultyFilterChange={handleDifficultyChange}
        />

        {hasActiveFilters && (
          <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
            {t('search.resultsCount', { count: filteredPlants.length, total: plants.length })}
          </Text>
        )}

        {filteredPlants.length === 0 && hasActiveFilters ? (
          <View style={styles.noResultsContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surface, borderColor: colors.border, width: 80, height: 80 }]}>
              <Ionicons name="leaf-outline" size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              {emptyStateMessage}
            </Text>
            <TouchableOpacity
              style={[styles.clearAllButton, { backgroundColor: colors.tint }]}
              onPress={handleClearFilters}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('search.clearAll')}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.clearAllButtonText}>{t('search.clearAll')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <PlantGrid plants={filteredPlants} />
        )}

        <Animated.View style={[styles.fab, { backgroundColor: colors.fab, transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity
            style={styles.fabTouch}
            onPress={() => router.push('/camera' as const)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('camera.title')}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
      <BannerAdWrapper />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
    marginTop: -40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyCTA: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    shadowColor: '#2d5a27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: -20,
  },
  noResultsText: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  clearAllButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  fabTouch: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
