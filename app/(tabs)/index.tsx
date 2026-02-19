import React from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import Onboarding from '@/components/Onboarding';
import PlantGrid from '@/components/PlantGrid';
import { usePlantsStore } from '@/stores/plantsStore';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function HomeScreen() {
  const plants = usePlantsStore((state) => state.plants);
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);
  const router = useRouter();
  const { t } = useTranslation();

  // Show onboarding until dismissed
  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  // Empty state
  if (plants.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={72} color="#c8e6c9" />
          <Text style={styles.emptyTitle}>{t('collection.empty')}</Text>
          <Text style={styles.emptyCTA}>{t('collection.emptyCTA')}</Text>
          <TouchableOpacity
            style={styles.cameraButton}
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
    );
  }

  // Collection view with FAB
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.titleBar}>
        <Text style={styles.screenTitle}>{t('collection.title')}</Text>
      </View>

      <PlantGrid plants={plants} />

      {/* Camera FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/camera' as const)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('camera.title')}
      >
        <Ionicons name="camera" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Title bar (collection has plants)
  titleBar: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingBottom: 10,
  },

  // Empty state
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
    color: '#555',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCTA: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: '#2e7d32',
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

  // Floating action button
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
