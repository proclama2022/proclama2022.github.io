import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import AtmosphericBackdrop from '@/components/AtmosphericBackdrop';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { LeagueMiniWidget } from '@/components/Gamification/LeagueMiniWidget';
import Onboarding from '@/components/Onboarding';
import PlantCard from '@/components/PlantCard';
import SearchFilterBar, { DifficultyFilter, WateringFilter } from '@/components/SearchFilterBar';
import { Text } from '@/components/Themed';
import WeatherWidget from '@/components/WeatherWidget';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getCareInfo } from '@/services/careDB';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { usePlantsStore } from '@/stores/plantsStore';
import { useSearchStore } from '@/stores/searchStore';
import { PlantSpace, SavedPlant } from '@/types';

type UpcomingReminder = {
  id: string;
  plantId: string;
  plantName: string;
  type: string;
  label: string;
  date: Date;
};

type ViewMode = 'grid' | 'list';
type HomeMode = 'today' | 'collection';
type CollectionFilter = 'all' | 'home' | 'garden' | 'balcony' | 'sightings';
type SmartCollectionFilter = 'all' | 'needsCare' | 'recent' | 'withReminders';

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
    plant.nickname,
    plant.commonName,
    plant.scientificName,
    plant.species,
    plant.location,
  ].filter(Boolean) as string[];

  return fields.some((field) => fuzzyMatch(field, q));
}

function plantMatchesWateringFilter(plant: SavedPlant, filter: WateringFilter): boolean {
  if (filter === 'all') return true;
  const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
  if (!care) return false;

  const now = new Date();
  const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;
  if (!lastWatered) return filter === 'needsWater';

  const daysSinceWatered = (now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24);
  return filter === 'needsWater'
    ? daysSinceWatered >= care.waterFrequencyDays
    : daysSinceWatered < care.waterFrequencyDays;
}

function plantMatchesDifficultyFilter(plant: SavedPlant, filter: DifficultyFilter): boolean {
  if (filter === 'all') return true;
  const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
  if (!care) return false;
  return care.difficulty === filter;
}

function getDisplayName(plant: SavedPlant): string {
  return plant.nickname || plant.commonName || plant.scientificName || plant.species;
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function HomeScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [homeMode, setHomeMode] = useState<HomeMode>('today');
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [smartCollectionFilter, setSmartCollectionFilter] = useState<SmartCollectionFilter>('all');
  const {
    wateringFilter,
    difficultyFilter,
    setWateringFilter,
    setDifficultyFilter,
    clearFilters,
  } = useSearchStore();

  const [storeHydrated, setStoreHydrated] = useState(() => usePlantsStore.persist.hasHydrated());
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const fabScale = useRef(new Animated.Value(0)).current;
  const hasAutoOpenedLearningPopup = useRef(false);
  const todaySectionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const collectionSectionAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    if (!storeHydrated) {
      return usePlantsStore.persist.onFinishHydration(() => setStoreHydrated(true));
    }
  }, [storeHydrated]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.spring(fabScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [fabScale]);

  useEffect(() => {
    const targets = homeMode === 'today' ? todaySectionAnims : collectionSectionAnims;
    const idle = homeMode === 'today' ? collectionSectionAnims : todaySectionAnims;

    idle.forEach((value) => value.setValue(0));
    targets.forEach((value) => value.setValue(0));

    Animated.stagger(
      80,
      targets.map((value, index) => Animated.timing(value, {
        toValue: 1,
        duration: 280 + index * 30,
        useNativeDriver: true,
      }))
    ).start();
  }, [collectionSectionAnims, homeMode, todaySectionAnims]);

  const handleSearchChange = useCallback((q: string) => setSearchQuery(q), []);
  const handleWateringChange = useCallback((f: WateringFilter) => setWateringFilter(f), [setWateringFilter]);
  const handleDifficultyChange = useCallback((f: DifficultyFilter) => setDifficultyFilter(f), [setDifficultyFilter]);
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setCollectionFilter('all');
    setSmartCollectionFilter('all');
    clearFilters();
  }, [clearFilters]);
  const handleSetViewMode = useCallback((mode: ViewMode) => setViewMode(mode), []);
  const handleOpenPlant = useCallback((plantId: string) => {
    router.push(`/plant/${plantId}` as const);
  }, [router]);
  const handleOpenCollection = useCallback(() => setHomeMode('collection'), []);
  const handleCollectionFilterChange = useCallback((nextFilter: CollectionFilter) => {
    setCollectionFilter(nextFilter);
    setSmartCollectionFilter('all');
    if (nextFilter === 'sightings') {
      setWateringFilter('all');
      setDifficultyFilter('all');
    }
  }, [setDifficultyFilter, setWateringFilter]);
  const managedPlants = useMemo(
    () => plants.filter((plant) => plant.entryKind !== 'sighting'),
    [plants]
  );

  const filteredPlants = useMemo(() => {
    return plants.filter((plant) =>
      (collectionFilter === 'all'
        ? true
        : collectionFilter === 'sightings'
          ? plant.entryKind === 'sighting'
          : plant.space === collectionFilter && plant.entryKind !== 'sighting')
      && (
        plant.entryKind === 'sighting'
          ? wateringFilter === 'all' && difficultyFilter === 'all'
          : true
      )
      && plantMatchesSearch(plant, searchQuery)
      && (
        plant.entryKind === 'sighting'
          ? true
          : plantMatchesWateringFilter(plant, wateringFilter)
      )
      && (
        plant.entryKind === 'sighting'
          ? true
          : plantMatchesDifficultyFilter(plant, difficultyFilter)
      )
      && (
        smartCollectionFilter === 'all'
          ? true
          : smartCollectionFilter === 'needsCare'
            ? plant.entryKind !== 'sighting' && plantMatchesWateringFilter(plant, 'needsWater')
            : smartCollectionFilter === 'withReminders'
              ? plant.entryKind !== 'sighting' && (plant.reminders || []).some((reminder) => !reminder.completed)
              : (() => {
                  const referenceDate = plant.entryKind === 'sighting'
                    ? plant.observedAt || plant.addedDate
                    : plant.addedDate;
                  const timestamp = new Date(referenceDate).getTime();
                  if (Number.isNaN(timestamp)) return false;
                  const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
                  return daysSince <= 14;
                })()
      )
    );
  }, [collectionFilter, difficultyFilter, plants, searchQuery, smartCollectionFilter, wateringFilter]);

  const hasActiveFilters = searchQuery.trim() !== ''
    || wateringFilter !== 'all'
    || difficultyFilter !== 'all'
    || collectionFilter !== 'all'
    || smartCollectionFilter !== 'all';

  const dueTodayPlants = useMemo(() => {
    return managedPlants
      .filter((plant) => plantMatchesWateringFilter(plant, 'needsWater'))
      .sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  }, [managedPlants]);

  const upcomingReminders = useMemo<UpcomingReminder[]>(() => {
    const todayKey = toLocalDateKey(new Date());

    return managedPlants.flatMap((plant) =>
      (plant.reminders || [])
        .filter((reminder) => !reminder.completed)
        .map((reminder) => ({
          id: reminder.id,
          plantId: plant.id,
          plantName: getDisplayName(plant),
          type: reminder.type,
          label: reminder.customLabel || reminder.type,
          date: new Date(reminder.date),
        }))
        .filter((reminder) => !Number.isNaN(reminder.date.getTime()) && toLocalDateKey(reminder.date) >= todayKey)
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [managedPlants]);

  const nextReminder = upcomingReminders[0] ?? null;
  const dueTodayPreview = dueTodayPlants.slice(0, 3);
  const focusPlants = dueTodayPlants.slice(0, 4);
  const [showLearningPopup, setShowLearningPopup] = useState(false);
  const [learningPlantId, setLearningPlantId] = useState<string | null>(null);
  const recentPlants = useMemo(() => {
    return [...plants]
      .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
      .slice(0, 3);
  }, [plants]);

  const learningPlant = useMemo(
    () => managedPlants.find((plant) => plant.id === learningPlantId) || dueTodayPlants[0] || managedPlants[0] || null,
    [dueTodayPlants, learningPlantId, managedPlants]
  );
  const learningCare = learningPlant?.scientificName ? getCareInfo(learningPlant.scientificName) : null;
  const languageKey = i18n.language === 'it' ? 'it' : 'en';

  useEffect(() => {
    if (!storeHydrated || managedPlants.length === 0 || hasAutoOpenedLearningPopup.current) {
      return;
    }

    const nextPlant = dueTodayPlants[0] || managedPlants[0];
    if (!nextPlant) return;

    const timer = setTimeout(() => {
      setLearningPlantId(nextPlant.id);
      setShowLearningPopup(true);
      hasAutoOpenedLearningPopup.current = true;
    }, 700);

    return () => clearTimeout(timer);
  }, [dueTodayPlants, managedPlants, storeHydrated]);

  const sunlightLabel = useMemo(() => {
    if (!learningCare) return '';
    const mapIt: Record<NonNullable<typeof learningCare.sunlight>, string> = {
      'full-sun': 'pieno sole',
      'partial-sun': 'luce indiretta luminosa',
      shade: 'ombra',
      'low-light': 'poca luce',
    };
    const mapEn: Record<NonNullable<typeof learningCare.sunlight>, string> = {
      'full-sun': 'full sun',
      'partial-sun': 'bright indirect light',
      shade: 'shade',
      'low-light': 'low light',
    };
    return languageKey === 'it' ? mapIt[learningCare.sunlight] : mapEn[learningCare.sunlight];
  }, [languageKey, learningCare]);

  const humidityLabel = useMemo(() => {
    if (!learningCare?.humidity) return '';
    const mapIt: Record<NonNullable<typeof learningCare.humidity>, string> = {
      low: 'bassa',
      medium: 'media',
      high: 'alta',
    };
    const mapEn: Record<NonNullable<typeof learningCare.humidity>, string> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    };
    return languageKey === 'it' ? mapIt[learningCare.humidity] : mapEn[learningCare.humidity];
  }, [languageKey, learningCare]);

  const learningTip = useMemo(() => {
    if (!learningCare) return '';
    const sourceTips = learningCare.microlearningTips?.[languageKey] || [];
    const generatedTips = [
      t('learningPopup.waterTip', { days: learningCare.waterFrequencyDays }),
      t('learningPopup.sunlightTip', { sunlight: sunlightLabel }),
      t('learningPopup.humidityTip', { humidity: humidityLabel }),
    ].filter(Boolean);
    const allTips = sourceTips.length > 0 ? sourceTips : generatedTips;
    const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return allTips[dayIndex % allTips.length];
  }, [humidityLabel, languageKey, learningCare, sunlightLabel, t]);

  const learningFunFact = learningCare?.funFacts?.[languageKey] || t('learningPopup.noFunFact');

  const { goodCompanions, badCompanions } = useMemo(() => {
    if (!learningPlant || !learningCare) {
      return { goodCompanions: [] as string[], badCompanions: [] as string[] };
    }

    const goodSet = new Set<string>();
    const badSet = new Set<string>();
    const preferredGood = new Set((learningCare.companionPlants?.good || []).map((value) => normalizeName(value)));
    const preferredBad = new Set((learningCare.companionPlants?.bad || []).map((value) => normalizeName(value)));

    managedPlants
      .filter((candidate) => candidate.id !== learningPlant.id)
      .forEach((candidate) => {
        const candidateCare = candidate.scientificName ? getCareInfo(candidate.scientificName) : null;
        if (!candidateCare) return;

        const displayName = getDisplayName(candidate);
        const tokens = [
          candidate.scientificName,
          candidate.commonName,
          candidate.species,
          ...((candidateCare.aliases || []) as string[]),
        ]
          .filter(Boolean)
          .map((value) => normalizeName(value as string));

        if (tokens.some((token) => preferredBad.has(token))) {
          badSet.add(displayName);
          return;
        }
        if (tokens.some((token) => preferredGood.has(token))) {
          goodSet.add(displayName);
          return;
        }

        const wateringGap = Math.abs(candidateCare.waterFrequencyDays - learningCare.waterFrequencyDays);
        const humidityConflict = learningCare.humidity === 'high' && candidateCare.humidity === 'low';
        const humidityMismatch = learningCare.humidity === candidateCare.humidity;
        const sunlightConflict = (
          (learningCare.sunlight === 'full-sun' && (candidateCare.sunlight === 'shade' || candidateCare.sunlight === 'low-light'))
          || ((learningCare.sunlight === 'shade' || learningCare.sunlight === 'low-light') && candidateCare.sunlight === 'full-sun')
        );
        const sunlightMatch = learningCare.sunlight === candidateCare.sunlight
          || (learningCare.sunlight === 'partial-sun' && candidateCare.sunlight !== 'low-light')
          || (candidateCare.sunlight === 'partial-sun' && learningCare.sunlight !== 'low-light');

        if (sunlightConflict || humidityConflict || wateringGap >= 9) {
          badSet.add(displayName);
        } else if (sunlightMatch && wateringGap <= 4 && humidityMismatch) {
          goodSet.add(displayName);
        }
      });

    const fallbackGood = learningCare.companionPlants?.good || [];
    const fallbackBad = learningCare.companionPlants?.bad || [];
    const goodCompanions = [...goodSet].slice(0, 3);
    const badCompanions = [...badSet].slice(0, 3);

    if (goodCompanions.length === 0) {
      fallbackGood.slice(0, 3).forEach((value) => goodCompanions.push(value));
    }
    if (badCompanions.length === 0) {
      fallbackBad.slice(0, 3).forEach((value) => badCompanions.push(value));
    }

    return { goodCompanions, badCompanions };
  }, [learningCare, learningPlant, managedPlants]);

  const formatReminderDate = useCallback((date: Date) => {
    return date.toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }, [i18n.language]);

  const formatObservedDate = useCallback((value?: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [i18n.language]);

  const getWateringMeta = useCallback((plant: SavedPlant) => {
    const care = plant.scientificName ? getCareInfo(plant.scientificName) : null;
    const lastWatered = plant.lastWatered ? new Date(plant.lastWatered) : null;

    if (!care || !lastWatered) {
      return t('home.needsCareUnknown');
    }

    const daysSinceWatered = Math.floor((Date.now() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    const overdueBy = Math.max(0, daysSinceWatered - care.waterFrequencyDays);

    if (overdueBy <= 0) {
      return t('home.needsCareToday');
    }

    return t('home.needsCareOverdue', { count: overdueBy });
  }, [t]);

  const emptyStateMessage = (() => {
    if (searchQuery.trim()) {
      return t('search.noResultsQuery', { query: searchQuery.trim() });
    }
    if (wateringFilter === 'needsWater') return t('search.noResultsNeedsWater');
    if (wateringFilter === 'waterOk') return t('search.noResultsWaterOk');
    if (difficultyFilter !== 'all') return t('search.noResultsDifficulty', { level: t(`search.${difficultyFilter}`) });
    return t('search.noResults');
  })();

  const isSightingsCollection = collectionFilter === 'sightings';
  const collectionNumColumns = isSightingsCollection ? 1 : viewMode === 'grid' ? 2 : 1;
  const collectionListKey = isSightingsCollection ? 'sightings' : viewMode;
  const availableSmartCollectionFilters = isSightingsCollection
    ? (['all', 'recent'] as SmartCollectionFilter[])
    : (['all', 'needsCare', 'recent', 'withReminders'] as SmartCollectionFilter[]);

  const renderSightingCard = useCallback((plant: SavedPlant) => {
    const displayName = getDisplayName(plant);
    const observedDate = formatObservedDate(plant.observedAt || plant.addedDate);
    const contextLine = [
      observedDate ? t('entry.observedOn', { date: observedDate }) : null,
      plant.location || plant.habitat || null,
    ].filter(Boolean).join(' • ');
    const bodyLine = plant.observationConditions || plant.habitat || plant.notes || plant.species || '';

    return (
      <TouchableOpacity
        key={plant.id}
        style={[styles.sightingCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}
        onPress={() => handleOpenPlant(plant.id)}
        activeOpacity={0.92}
        accessibilityRole="button"
        accessibilityLabel={`${t('entry.kind.sighting')}: ${displayName}`}
      >
        <Image source={{ uri: plant.photo }} style={styles.sightingImage} resizeMode="cover" />
        <View style={styles.sightingImageShade} />

        <View style={styles.sightingTopRow}>
          <View style={[styles.sightingChip, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' }]}>
            <Ionicons name="flower-outline" size={13} color="#fff" />
            <Text style={styles.sightingChipText}>{t('entry.kind.sighting')}</Text>
          </View>
          <View style={[styles.sightingChip, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.22)' }]}>
            <Ionicons name="location-outline" size={13} color="#fff" />
            <Text style={styles.sightingChipText}>{t(`entry.space.${plant.space}`)}</Text>
          </View>
        </View>

        <View style={styles.sightingContent}>
          <Text style={styles.sightingTitle} numberOfLines={2}>
            {displayName}
          </Text>

          {contextLine ? (
            <Text style={styles.sightingMeta} numberOfLines={2}>
              {contextLine}
            </Text>
          ) : null}

          {bodyLine ? (
            <Text style={styles.sightingBody} numberOfLines={3}>
              {bodyLine}
            </Text>
          ) : null}

          <View style={styles.sightingFooter}>
            {plant.observedWith ? (
              <View style={[styles.sightingFooterTag, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <Ionicons name="people-outline" size={13} color="#fff" />
                <Text style={styles.sightingFooterTagText} numberOfLines={1}>
                  {plant.observedWith}
                </Text>
              </View>
            ) : (
              <View style={[styles.sightingFooterTag, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                <Ionicons name="book-outline" size={13} color="#fff" />
                <Text style={styles.sightingFooterTagText}>
                  {t('home.collectionSightingsJournal')}
                </Text>
              </View>
            )}

            <View style={styles.sightingChevron}>
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [colors.border, colors.surfaceGlass, formatObservedDate, handleOpenPlant, t]);

  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  if (plants.length === 0) {
    return (
      <>
        <View style={styles.screenShell}>
          <AtmosphericBackdrop variant="home" />
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              style={styles.scrollScreen}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              alwaysBounceVertical
              contentInsetAdjustmentBehavior="automatic"
            >
              <View style={styles.header}>
                <Text style={[styles.greeting, { color: colors.textSecondary }]}>
                  {t('common.welcome', { defaultValue: 'Welcome to' })}
                </Text>
                <Text style={[styles.screenTitle, { color: colors.text }]}>Plantid</Text>
              </View>

              <View style={styles.emptyDashboard}>
                <View style={[styles.heroCard, styles.emptyHeroCard, { backgroundColor: colors.heroStart }]}>
                  <View style={[styles.heroGlowLarge, { backgroundColor: colors.heroEnd }]} />
                  <View style={[styles.heroGlowSmall, { backgroundColor: colors.surfaceStrong }]} />
                  <View style={[styles.heroLeafBadge, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="leaf" size={18} color="#fff" />
                  </View>

                  <View style={styles.heroTopCopy}>
                    <Text style={styles.heroEyebrow}>{t('home.emptyEyebrow')}</Text>
                    <Text style={styles.heroKicker}>{t('common.appName')}</Text>
                  </View>

                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>{t('home.emptyTitle')}</Text>
                    <Text style={styles.heroBody}>{t('home.emptyBody')}</Text>
                  </View>

                  <View style={styles.heroPreviewRow}>
                    <View style={styles.heroPreviewChip}>
                      <Ionicons name="camera-outline" size={12} color="#fff" />
                      <Text style={styles.heroPreviewText}>{t('home.emptyGuideScan')}</Text>
                    </View>
                    <View style={styles.heroPreviewChip}>
                      <Ionicons name="albums-outline" size={12} color="#fff" />
                      <Text style={styles.heroPreviewText}>{t('home.emptyGuideTrack')}</Text>
                    </View>
                    <View style={styles.heroPreviewChip}>
                      <Ionicons name="water-outline" size={12} color="#fff" />
                      <Text style={styles.heroPreviewText}>{t('home.emptyGuideRoutine')}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.emptyHeroCta}
                    onPress={() => router.push('/camera' as const)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={t('camera.title')}
                  >
                    <Ionicons name="camera" size={20} color={colors.heroStart} />
                    <Text style={[styles.emptyHeroCtaText, { color: colors.heroStart }]}>{t('camera.title')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.emptyGuideCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
                  <View style={[styles.emptyGuideIcon, { backgroundColor: colors.surfaceStrong }]}>
                    <Ionicons name="sparkles-outline" size={22} color={colors.tint} />
                  </View>
                  <Text style={[styles.emptyGuideTitle, { color: colors.text }]}>{t('home.emptyGuideTitle')}</Text>
                  <Text style={[styles.emptyGuideBody, { color: colors.textSecondary }]}>{t('home.emptyGuideBody')}</Text>

                  <View style={styles.emptyGuideList}>
                    <View style={styles.emptyGuideItem}>
                      <View style={[styles.emptyGuideBullet, { backgroundColor: colors.surfaceStrong }]}>
                        <Ionicons name="scan-outline" size={15} color={colors.tint} />
                      </View>
                      <Text style={[styles.emptyGuideItemText, { color: colors.textSecondary }]}>{t('home.emptyGuideScan')}</Text>
                    </View>
                    <View style={styles.emptyGuideItem}>
                      <View style={[styles.emptyGuideBullet, { backgroundColor: colors.surfaceStrong }]}>
                        <Ionicons name="book-outline" size={15} color={colors.tint} />
                      </View>
                      <Text style={[styles.emptyGuideItemText, { color: colors.textSecondary }]}>{t('home.emptyGuideTrack')}</Text>
                    </View>
                    <View style={styles.emptyGuideItem}>
                      <View style={[styles.emptyGuideBullet, { backgroundColor: colors.surfaceStrong }]}>
                        <Ionicons name="notifications-outline" size={15} color={colors.tint} />
                      </View>
                      <Text style={[styles.emptyGuideItemText, { color: colors.textSecondary }]}>{t('home.emptyGuideRoutine')}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
        <BannerAdWrapper />
      </>
    );
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.greeting, { color: colors.textSecondary }]}>
        {homeMode === 'today' ? t('home.todayLabel') : t('collection.title')}
      </Text>
      <Text style={[styles.screenTitle, { color: colors.text }]}>
        {homeMode === 'today' ? t('home.segmentToday') : t('home.segmentCollection')}
      </Text>
      <WeatherWidget />
    </View>
  );

  const getRevealStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  });

  const renderModeSwitcher = () => (
    <View style={[styles.modeSwitcher, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      <TouchableOpacity
        style={[styles.modeButton, homeMode === 'today' && [styles.modeButtonActive, { backgroundColor: colors.surface }]]}
        onPress={() => setHomeMode('today')}
        accessibilityRole="button"
        accessibilityState={{ selected: homeMode === 'today' }}
      >
        <Text style={[styles.modeButtonText, { color: homeMode === 'today' ? colors.text : colors.textSecondary }]}>
          {t('home.segmentToday')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, homeMode === 'collection' && [styles.modeButtonActive, { backgroundColor: colors.surface }]]}
        onPress={() => setHomeMode('collection')}
        accessibilityRole="button"
        accessibilityState={{ selected: homeMode === 'collection' }}
      >
        <Text style={[styles.modeButtonText, { color: homeMode === 'collection' ? colors.text : colors.textSecondary }]}>
          {t('home.segmentCollection')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTodayScreen = () => (
    <ScrollView
      style={styles.scrollScreen}
      contentContainerStyle={styles.todayContent}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      <Animated.View style={getRevealStyle(todaySectionAnims[0])}>
        {renderHeader()}
        {renderModeSwitcher()}
      </Animated.View>

      <Animated.View style={getRevealStyle(todaySectionAnims[1])}>
        <View style={[styles.todayHero, { backgroundColor: colors.heroStart }]}>
        <View style={[styles.heroGlowLarge, { backgroundColor: colors.heroEnd }]} />
        <View style={[styles.heroGlowSmall, { backgroundColor: colors.surfaceStrong }]} />
        <View style={[styles.heroLeafBadge, { backgroundColor: 'rgba(255,255,255,0.14)', borderColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="leaf" size={18} color="#fff" />
        </View>

        <View style={styles.heroTopRow}>
          <View style={styles.heroTopCopy}>
            <Text style={styles.heroEyebrow}>{t('home.todayLabel')}</Text>
            <Text style={styles.heroKicker}>{t('common.appName')}</Text>
          </View>
          <View style={styles.heroCountPill}>
            <Text style={styles.heroCountValue}>{dueTodayPlants.length}</Text>
            <Text style={styles.heroCountLabel}>{t('home.metricWatering')}</Text>
          </View>
        </View>

        <View style={styles.heroCopy}>
          <Text style={styles.heroTitle}>
            {dueTodayPlants.length > 0
              ? t('home.focusTitleUrgent', { count: dueTodayPlants.length })
              : t('home.focusTitleCalm')}
          </Text>
          <Text style={styles.heroBody}>
            {nextReminder
              ? t('home.focusBodyReminder', {
                  task: nextReminder.label,
                  plant: nextReminder.plantName,
                  date: formatReminderDate(nextReminder.date),
                })
              : dueTodayPlants.length > 0
                ? t('home.focusBodyWatering', {
                    plants: dueTodayPreview.map((plant) => getDisplayName(plant)).join(', '),
                  })
                : t('home.focusBodyCalm', { count: managedPlants.length })}
          </Text>
        </View>

        <View style={styles.heroMetricsStrip}>
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{dueTodayPlants.length}</Text>
            <Text style={styles.heroMetricLabel}>{t('home.metricWatering')}</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{upcomingReminders.length}</Text>
            <Text style={styles.heroMetricLabel}>{t('home.metricReminders')}</Text>
          </View>
          <View style={styles.heroMetricDivider} />
          <View style={styles.heroMetric}>
            <Text style={styles.heroMetricValue}>{managedPlants.length}</Text>
            <Text style={styles.heroMetricLabel}>{t('home.metricCollection')}</Text>
          </View>
        </View>
        </View>
      </Animated.View>

      <Animated.View style={getRevealStyle(todaySectionAnims[2])}>
        <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.todayNeedsCareTitle')}</Text>
            <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>{t('home.todayNeedsCareBody')}</Text>
          </View>
          {dueTodayPlants.length > 0 && (
            <TouchableOpacity
              style={[styles.textAction, { backgroundColor: colors.surfaceStrong }]}
              onPress={handleOpenCollection}
              accessibilityRole="button"
            >
              <Text style={[styles.textActionLabel, { color: colors.tint }]}>{t('home.viewCollection')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {focusPlants.length > 0 ? (
          <View style={styles.stackList}>
            {focusPlants.map((plant) => (
              <TouchableOpacity
                key={plant.id}
                style={[styles.focusRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}
                onPress={() => handleOpenPlant(plant.id)}
                activeOpacity={0.9}
              >
                <Image source={{ uri: plant.photo }} style={styles.focusRowImage} />
                <View style={styles.focusRowCopy}>
                  <Text style={[styles.focusRowTitle, { color: colors.text }]} numberOfLines={1}>
                    {getDisplayName(plant)}
                  </Text>
                  <Text style={[styles.focusRowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                    {getWateringMeta(plant)}
                  </Text>
                </View>
                <View style={[styles.focusPill, { backgroundColor: colors.chipActiveBg }]}>
                  <Ionicons name="water-outline" size={14} color={colors.tint} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.calmCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
            <View style={[styles.calmIcon, { backgroundColor: colors.surfaceStrong }]}>
              <Ionicons name="checkmark-circle-outline" size={22} color={colors.tint} />
            </View>
            <Text style={[styles.calmTitle, { color: colors.text }]}>{t('home.allCalmTitle')}</Text>
            <Text style={[styles.calmBody, { color: colors.textSecondary }]}>{t('home.allCalmBody')}</Text>
            <TouchableOpacity
              style={[styles.secondaryOutlineButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={handleOpenCollection}
              accessibilityRole="button"
            >
              <Text style={[styles.secondaryOutlineButtonText, { color: colors.text }]}>{t('home.viewCollection')}</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </Animated.View>

      <Animated.View style={getRevealStyle(todaySectionAnims[3])}>
        <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.nextReminder')}</Text>
            <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>{t('home.todayUpcomingBody')}</Text>
          </View>
        </View>

        <View style={[styles.detailCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
          <View style={[styles.detailIcon, { backgroundColor: colors.surfaceStrong }]}>
            <Ionicons name={nextReminder ? 'alarm-outline' : 'moon-outline'} size={18} color={colors.tint} />
          </View>
          <View style={styles.detailCopy}>
            <Text style={[styles.detailTitle, { color: colors.text }]}>
              {nextReminder ? nextReminder.label : t('home.allCalmTitle')}
            </Text>
            <Text style={[styles.detailBody, { color: colors.textSecondary }]}>
              {nextReminder
                ? t('home.nextReminderBody', {
                    task: nextReminder.label,
                    plant: nextReminder.plantName,
                    date: formatReminderDate(nextReminder.date),
                  })
                : t('home.nextReminderEmpty')}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/calendar' as const)}
            accessibilityRole="button"
          >
            <Ionicons name="calendar-outline" size={18} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </View>

      {/* League Mini Widget - only for authenticated users */}
      <LeagueMiniWidget />

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.todayCollectionTitle')}</Text>
            <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>{t('home.todayCollectionBody')}</Text>
          </View>
          <TouchableOpacity
            style={[styles.textAction, { backgroundColor: colors.surfaceStrong }]}
            onPress={handleOpenCollection}
            accessibilityRole="button"
          >
            <Text style={[styles.textActionLabel, { color: colors.tint }]}>{t('home.viewCollection')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stackList}>
          {recentPlants.map((plant) => (
            <TouchableOpacity
              key={plant.id}
              style={[styles.focusRow, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}
              onPress={() => handleOpenPlant(plant.id)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: plant.photo }} style={styles.focusRowImage} />
              <View style={styles.focusRowCopy}>
                <Text style={[styles.focusRowTitle, { color: colors.text }]} numberOfLines={1}>
                  {getDisplayName(plant)}
                </Text>
                <Text style={[styles.focusRowMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                  {plant.location || plant.species || t('home.openPlant')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
        </View>
      </Animated.View>
    </ScrollView>
  );

  const renderCollectionScreen = () => (
    <FlatList
      data={storeHydrated ? filteredPlants : []}
      key={collectionListKey}
      numColumns={collectionNumColumns}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        isSightingsCollection
          ? renderSightingCard(item)
          : <PlantCard plant={item} isGrid={viewMode === 'grid'} />
      )}
      style={styles.scrollScreen}
      contentContainerStyle={[
        styles.collectionContent,
        !isSightingsCollection && viewMode === 'grid' ? styles.gridListContent : null,
        isSightingsCollection ? styles.sightingsListContent : null,
        !storeHydrated ? styles.collectionContentLoading : null,
      ]}
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={(
        <>
          <Animated.View style={getRevealStyle(collectionSectionAnims[0])}>
            {renderHeader()}
            {renderModeSwitcher()}
          </Animated.View>

          <Animated.View style={getRevealStyle(collectionSectionAnims[1])}>
            <View style={[styles.collectionIntroCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
              <View style={styles.sectionCopy}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {isSightingsCollection ? t('home.collectionSightingsTitle') : t('home.collectionSearchTitle')}
                </Text>
                <Text style={[styles.sectionCaption, { color: colors.textSecondary }]}>
                  {isSightingsCollection ? t('home.collectionSightingsBody') : t('home.collectionSearchBody')}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={getRevealStyle(collectionSectionAnims[2])}>
            <View style={styles.contextFilterBlock}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contextFilterRow}
              >
                {(['all', 'home', 'garden', 'balcony', 'sightings'] as CollectionFilter[]).map((filter) => {
                  const selected = collectionFilter === filter;
                  const label = filter === 'all'
                    ? t('collection.filterAll')
                    : filter === 'sightings'
                      ? t('entry.kind.sighting')
                      : t(`entry.space.${filter as PlantSpace}`);
                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.contextFilterChip,
                        {
                          backgroundColor: selected ? colors.tint : colors.surfaceGlass,
                          borderColor: selected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => handleCollectionFilterChange(filter)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.contextFilterText,
                          { color: selected ? '#fff' : colors.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.smartFilterBlock}>
              <Text style={[styles.smartFilterLabel, { color: colors.textMuted }]}>
                {t('home.smartCollections')}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.contextFilterRow}
              >
                {availableSmartCollectionFilters.map((filter) => {
                  const selected = smartCollectionFilter === filter;
                  const label = filter === 'all'
                    ? t('home.smartAll')
                    : filter === 'needsCare'
                      ? t('home.smartNeedsCare')
                      : filter === 'recent'
                        ? t('home.smartRecent')
                        : t('home.smartWithReminders');

                  return (
                    <TouchableOpacity
                      key={filter}
                      style={[
                        styles.contextFilterChip,
                        {
                          backgroundColor: selected ? colors.chipActiveBg : colors.surface,
                          borderColor: selected ? colors.tint : colors.border,
                        },
                      ]}
                      onPress={() => setSmartCollectionFilter(filter)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                    >
                      <Text
                        style={[
                          styles.contextFilterText,
                          { color: selected ? colors.chipActiveText : colors.textSecondary },
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <SearchFilterBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              wateringFilter={wateringFilter}
              onWateringFilterChange={handleWateringChange}
              difficultyFilter={difficultyFilter}
              onDifficultyFilterChange={handleDifficultyChange}
              disableCareFilters={collectionFilter === 'sightings'}
            />

            {hasActiveFilters && (
              <Text style={[styles.resultsCount, { color: colors.textMuted }]}>
                {t('search.resultsCount', { count: filteredPlants.length, total: plants.length })}
              </Text>
            )}
          </Animated.View>

          {storeHydrated && filteredPlants.length > 0 && (
            <Animated.View style={getRevealStyle(collectionSectionAnims[3])}>
              <View style={[styles.listHeaderBar, { backgroundColor: colors.surfaceGlass, borderBottomColor: colors.border }]}>
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {t('home.collectionCount', { count: filteredPlants.length })}
                </Text>
                {isSightingsCollection ? (
                  <View style={[styles.collectionModePill, { backgroundColor: colors.surfaceStrong }]}>
                    <Ionicons name="journal-outline" size={14} color={colors.tint} />
                    <Text style={[styles.collectionModePillText, { color: colors.tint }]}>
                      {t('home.collectionSightingsJournal')}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.toggleGroup, { backgroundColor: colors.chipBg }]}>
                    <TouchableOpacity
                      style={[styles.toggleButton, viewMode === 'grid' && [styles.toggleActive, { backgroundColor: colors.surface }]]}
                      onPress={() => handleSetViewMode('grid')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: viewMode === 'grid' }}
                    >
                      <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? colors.tint : colors.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, viewMode === 'list' && [styles.toggleActive, { backgroundColor: colors.surface }]]}
                      onPress={() => handleSetViewMode('list')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: viewMode === 'list' }}
                    >
                      <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? colors.tint : colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {!storeHydrated && (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Animated.View
                  key={index}
                  style={[styles.skeletonCard, { backgroundColor: colors.border, opacity: pulseAnim }]}
                >
                  <View style={styles.skeletonPhoto} />
                  <View style={styles.skeletonInfo} />
                </Animated.View>
              ))}
            </View>
          )}
        </>
      )}
      ListEmptyComponent={
        storeHydrated && hasActiveFilters ? (
          <View style={styles.noResultsContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: colors.surfaceGlass, borderColor: colors.border, width: 80, height: 80 }]}>
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
        ) : null
      }
    />
  );

  return (
    <>
      {learningPlant && (
        <Modal
          visible={showLearningPopup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowLearningPopup(false)}
        >
          <SafeAreaView style={[styles.learningSafeArea, { backgroundColor: colors.background }]}>
            <View style={[styles.learningHeader, { borderBottomColor: colors.border }]}>
              <View style={styles.learningHeaderCopy}>
                <Text style={[styles.learningTitle, { color: colors.text }]}>{t('learningPopup.title')}</Text>
                <Text style={[styles.learningSubtitle, { color: colors.textSecondary }]}>
                  {t('learningPopup.subtitle', { name: getDisplayName(learningPlant) })}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.learningCloseButton, { backgroundColor: colors.surfaceStrong }]}
                onPress={() => setShowLearningPopup(false)}
                accessibilityRole="button"
                accessibilityLabel={t('learningPopup.close')}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.learningScroll}
              contentContainerStyle={styles.learningScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.learningCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
                <View style={styles.learningCardHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.tint} />
                  <Text style={[styles.learningCardTitle, { color: colors.text }]}>{t('learningPopup.funFactTitle')}</Text>
                </View>
                <Text style={[styles.learningBody, { color: colors.textSecondary }]}>{learningFunFact}</Text>
              </View>

              <View style={[styles.learningCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
                <View style={styles.learningCardHeader}>
                  <Ionicons name="school-outline" size={18} color={colors.tint} />
                  <Text style={[styles.learningCardTitle, { color: colors.text }]}>{t('learningPopup.tipTitle')}</Text>
                </View>
                <Text style={[styles.learningBody, { color: colors.textSecondary }]}>{learningTip}</Text>
              </View>

              <View style={[styles.learningCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
                <View style={styles.learningCardHeader}>
                  <Ionicons name="leaf-outline" size={18} color={colors.tint} />
                  <Text style={[styles.learningCardTitle, { color: colors.text }]}>{t('learningPopup.pairsWellTitle')}</Text>
                </View>
                <View style={styles.companionList}>
                  {(goodCompanions.length > 0 ? goodCompanions : [t('learningPopup.noGoodPairs')]).map((name) => (
                    <View key={`good-${name}`} style={[styles.companionChip, { backgroundColor: colors.chipBg }]}>
                      <Text style={[styles.companionChipText, { color: colors.text }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.learningCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
                <View style={styles.learningCardHeader}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.tint} />
                  <Text style={[styles.learningCardTitle, { color: colors.text }]}>{t('learningPopup.avoidTitle')}</Text>
                </View>
                <View style={styles.companionList}>
                  {(badCompanions.length > 0 ? badCompanions : [t('learningPopup.noBadPairs')]).map((name) => (
                    <View key={`bad-${name}`} style={[styles.companionChip, { backgroundColor: colors.chipBg }]}>
                      <Text style={[styles.companionChipText, { color: colors.text }]}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.learningActionButton, { backgroundColor: colors.tint }]}
                onPress={() => {
                  setShowLearningPopup(false);
                  router.push(`/plant/${learningPlant.id}` as const);
                }}
                accessibilityRole="button"
                accessibilityLabel={t('learningPopup.openPlant')}
              >
                <Text style={styles.learningActionText}>{t('learningPopup.openPlant')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
      <View style={styles.screenShell}>
        <AtmosphericBackdrop variant="home" />
        <SafeAreaView style={styles.safeArea}>
          {homeMode === 'today' ? renderTodayScreen() : renderCollectionScreen()}

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
      </View>
      <BannerAdWrapper />
    </>
  );
}

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollScreen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  todayContent: {
    paddingBottom: 120,
  },
  collectionContent: {
    paddingBottom: 120,
  },
  sightingsListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 14,
  },
  collectionContentLoading: {
    flexGrow: 1,
  },
  gridListContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
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
  modeSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 22,
    borderWidth: 1,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDashboard: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 14,
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  emptyHeroCard: {
    paddingTop: 22,
    minHeight: 330,
    justifyContent: 'space-between',
  },
  todayHero: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 28,
    padding: 18,
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 6,
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -60,
    right: -40,
    opacity: 0.28,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -24,
    left: -10,
    opacity: 0.16,
  },
  heroLeafBadge: {
    position: 'absolute',
    right: 18,
    top: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroTopCopy: {
    gap: 4,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#fff',
  },
  heroKicker: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  heroCountPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 82,
    alignItems: 'center',
  },
  heroCountValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  heroCountLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    color: '#fff',
  },
  heroBody: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.82)',
    maxWidth: '88%',
  },
  heroPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroPreviewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 11,
    maxWidth: '100%',
  },
  heroPreviewText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  heroMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,18,12,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  heroMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  heroMetricValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMetricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionBlock: {
    paddingHorizontal: 16,
    marginBottom: 18,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionCopy: {
    flex: 1,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCaption: {
    fontSize: 13,
    lineHeight: 19,
  },
  textAction: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textActionLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  stackList: {
    gap: 10,
  },
  focusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  focusRowImage: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#d7ddd7',
  },
  focusRowCopy: {
    flex: 1,
    gap: 4,
  },
  focusRowTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  focusRowMeta: {
    fontSize: 13,
    lineHeight: 18,
  },
  focusPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    alignItems: 'flex-start',
    gap: 12,
  },
  calmIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calmTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  calmBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryOutlineButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryOutlineButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailCopy: {
    flex: 1,
    gap: 4,
  },
  detailTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  detailBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectionIntroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  contextFilterBlock: {
    marginBottom: 4,
  },
  smartFilterBlock: {
    marginBottom: 4,
  },
  smartFilterLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  contextFilterRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  contextFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  contextFilterText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  listHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  countText: {
    fontSize: 14,
    fontWeight: '500',
  },
  collectionModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  collectionModePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: 8,
    padding: 3,
  },
  toggleButton: {
    padding: 5,
    borderRadius: 6,
  },
  toggleActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 20,
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
  emptyHeroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f9f5',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  emptyHeroCtaText: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyGuideCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 12,
  },
  emptyGuideIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGuideTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  emptyGuideBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyGuideList: {
    gap: 12,
    marginTop: 4,
  },
  emptyGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emptyGuideBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGuideItemText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  sightingCard: {
    minHeight: 260,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  sightingImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  sightingImageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 24, 16, 0.34)',
  },
  sightingTopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sightingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  sightingChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  sightingContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 24,
    gap: 8,
  },
  sightingTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sightingMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  sightingBody: {
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    lineHeight: 20,
  },
  sightingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 6,
  },
  sightingFooterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexShrink: 1,
  },
  sightingFooterTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  sightingChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  learningSafeArea: {
    flex: 1,
  },
  learningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  learningHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  learningTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  learningSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  learningCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learningScroll: {
    flex: 1,
  },
  learningScrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  learningCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 10,
  },
  learningCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learningCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  learningBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  companionList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  companionChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  companionChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  learningActionButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  learningActionText: {
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
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  skeletonCard: {
    flex: 1,
    margin: 8,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: '40%',
  },
  skeletonPhoto: {
    width: '100%',
    aspectRatio: 1,
  },
  skeletonInfo: {
    height: 48,
  },
});
