import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView, Animated } from 'react-native';
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
  if (!care) return filter === 'all';
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
  const [wateringFilter, setWateringFilter] = useState<WateringFilter>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');

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

  const filteredPlants = useMemo(() => {
    return plants.filter(plant =>
      plantMatchesSearch(plant, searchQuery) &&
      plantMatchesWateringFilter(plant, wateringFilter) &&
      plantMatchesDifficultyFilter(plant, difficultyFilter)
    );
  }, [plants, searchQuery, wateringFilter, difficultyFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || wateringFilter !== 'all' || difficultyFilter !== 'all';

  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  if (plants.length === 0) {
    return (
      <>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={72} color={colors.tint} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t('collection.empty')}</Text>
            <Text style={[styles.emptyCTA, { color: colors.textMuted }]}>{t('collection.emptyCTA')}</Text>
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
        <View style={[styles.titleBar, { backgroundColor: colors.surface }]}>
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

        {filteredPlants.length === 0 && hasActiveFilters ? (
          <View style={styles.noResultsContainer}>
            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.noResultsText, { color: colors.textMuted }]}>{t('search.noResults')}</Text>
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
            <Ionicons name="camera" size={26} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
      <BannerAdWrapper />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  titleBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    paddingBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCTA: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabTouch: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
