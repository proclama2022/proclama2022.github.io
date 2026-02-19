import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { ResultsCarousel } from '@/components/Results/ResultsCarousel';
import { identifyPlant } from '@/services/plantnet';
import { getCachedResult, setCachedResult } from '@/services/cache';
import { PlantNetResponse, PlantNetResult, SavedPlant } from '@/types';

// ---------------------------------------------------------------------------
// Params from camera screen
// All expo-router params are strings
// ---------------------------------------------------------------------------

type ResultsParams = {
  imageUri: string;
  organ: string;
  lang: string;
  success: string;
  error: string;
  data: string;
};

// ---------------------------------------------------------------------------
// Results Screen
// ---------------------------------------------------------------------------

export default function ResultsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<ResultsParams>();

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [results, setResults] = useState<PlantNetResult[]>([]);

  const imageUri = params.imageUri ?? '';
  const organ = (params.organ ?? 'auto') as Parameters<typeof identifyPlant>[0]['organ'];
  const lang = params.lang ?? 'en';

  // ------------------------------------------------------------------
  // Bootstrap: use serialised data from camera screen if available,
  // otherwise check cache then call API
  // ------------------------------------------------------------------

  useEffect(() => {
    const bootstrap = async () => {
      setLoading(true);
      setApiError(null);

      try {
        // Fast path: camera screen already ran identifyPlant and passed results
        if (params.success === '1' && params.data) {
          const parsed: PlantNetResponse = JSON.parse(params.data);
          setResults(parsed.results ?? []);
          setLoading(false);
          return;
        }

        // Error forwarded from camera screen
        if (params.success === '0' && params.error) {
          setApiError(params.error);
          setLoading(false);
          return;
        }

        // Fallback: check cache before hitting API
        if (imageUri) {
          const cached = await getCachedResult(imageUri);
          if (cached) {
            setResults(cached.results ?? []);
            setLoading(false);
            return;
          }

          // Cache miss: call API
          const result = await identifyPlant({ imageUri, organ, lang });
          if (result.success && result.data) {
            await setCachedResult(imageUri, result.data);
            setResults(result.data.results ?? []);
          } else {
            setApiError(result.error ?? t('errors.apiError'));
          }
        } else {
          setApiError(t('errors.invalidImage'));
        }
      } catch (err) {
        setApiError(err instanceof Error ? err.message : t('errors.apiError'));
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Handle plant added toast/feedback
  // ------------------------------------------------------------------

  const handleAddToCollection = (_plant: SavedPlant) => {
    // Could show a toast here; the button state in ResultCard handles UX
  };

  // ------------------------------------------------------------------
  // Render states
  // ------------------------------------------------------------------

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (apiError) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#c62828" />
        <Text style={styles.errorTitle}>{t('common.error')}</Text>
        <Text style={styles.errorBody}>{apiError}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="leaf-outline" size={64} color="#aaa" />
        <Text style={styles.errorTitle}>{t('common.error')}</Text>
        <Text style={styles.errorBody}>{t('errors.apiError')}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ------------------------------------------------------------------
  // Main results view
  // ------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('results.title')}</Text>
        {/* Spacer to centre title */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Carousel */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ResultsCarousel
          results={results}
          imageUri={imageUri}
          onAddToCollection={handleAddToCollection}
        />

        {/* PlantNet attribution — LEGAL-01 requirement */}
        <View style={styles.attribution}>
          <Text style={styles.attributionText}>
            {t('settings.attribution')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
    paddingBottom: 40,
  },

  // Loading / Error
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  errorBody: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 21,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Attribution
  attribution: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 8,
  },
  attributionText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },
});
