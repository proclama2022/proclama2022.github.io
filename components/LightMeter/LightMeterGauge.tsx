/**
 * LightMeterGauge Component
 *
 * Main gauge for the light meter screen. Displays:
 * - Large lux value (48pt font)
 * - Accuracy badge (±15% for Android sensor, ±30% estimate for iOS camera)
 * - Current light category name
 * - LightCategoryBar for visual progress
 * - Plant recommendation chips
 * - Action buttons (Measure + Save)
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LightCategoryBar } from './LightCategoryBar';
import {
  formatLuxValue,
  type LightCategory,
} from '@/types/lightMeter';

// ============================================================================
// Plant recommendations map
// ============================================================================

const PLANT_RECOMMENDATIONS: Record<LightCategory, string[]> = {
  low: ['Snake Plant', 'ZZ Plant', 'Pothos'],
  medium: ['Monstera', 'Philodendron', 'Spider Plant'],
  bright_indirect: ['Fiddle Leaf Fig', 'Bird of Paradise'],
  direct_sun: ['Cacti', 'Succulents', 'Citrus'],
  unknown: [],
};

// ============================================================================
// Props
// ============================================================================

interface LightMeterGaugeProps {
  lux: number | null;
  category: LightCategory | null;
  accuracy: 'high' | 'estimate';
  isLoading?: boolean;
  isMeasuring?: boolean;
  onMeasure?: () => void;
  onStop?: () => void;
  onSave?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function LightMeterGauge({
  lux,
  category,
  accuracy,
  isLoading = false,
  isMeasuring = false,
  onMeasure,
  onStop,
  onSave,
}: LightMeterGaugeProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const hasReading = lux !== null && lux > 0;
  const resolvedCategory: LightCategory = category ?? 'unknown';

  // Recommendation plants
  const recommendations = PLANT_RECOMMENDATIONS[resolvedCategory];

  // Category label key
  const categoryLabelKey: Record<LightCategory, string> = {
    low: 'lightMeter.categories.low',
    medium: 'lightMeter.categories.medium',
    bright_indirect: 'lightMeter.categories.brightIndirect',
    direct_sun: 'lightMeter.categories.directSun',
    unknown: 'lightMeter.categories.low', // fallback
  };

  // Accuracy badge color
  const accuracyColor = accuracy === 'high' ? colors.success : colors.warning;
  const accuracyBg = accuracy === 'high'
    ? (colors.success + '22')
    : (colors.warning + '22');

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>

      {/* Accuracy badge */}
      <View style={[styles.accuracyBadge, { backgroundColor: accuracyBg }]}>
        <Ionicons
          name={accuracy === 'high' ? 'checkmark-circle' : 'information-circle'}
          size={13}
          color={accuracyColor}
        />
        <Text style={[styles.accuracyText, { color: accuracyColor }]}>
          {accuracy === 'high' ? t('lightMeter.accuracy.high') : t('lightMeter.accuracy.estimate')}
        </Text>
      </View>

      {/* Lux display */}
      <View style={styles.luxContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.tint} style={styles.loadingSpinner} />
        ) : (
          <>
            <Text style={[styles.luxLabel, { color: colors.textMuted }]}>LUX</Text>
            <Text style={[styles.luxValue, { color: hasReading ? colors.text : colors.textMuted }]}>
              {hasReading ? formatLuxValue(lux!) : '—'}
            </Text>
          </>
        )}
      </View>

      {/* Category name */}
      {hasReading && resolvedCategory !== 'unknown' && (
        <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
          {t(categoryLabelKey[resolvedCategory])}
        </Text>
      )}

      {/* Category bar */}
      <LightCategoryBar
        currentLux={lux}
        style={styles.categoryBar}
      />

      {/* Recommendations */}
      {hasReading && recommendations.length > 0 && (
        <View style={styles.recommendationsContainer}>
          <Text style={[styles.recommendationsTitle, { color: colors.textSecondary }]}>
            {t('lightMeter.recommendations.title')}
          </Text>
          <View style={styles.recommendationsChips}>
            {recommendations.map((plant) => (
              <View
                key={plant}
                style={[styles.chip, { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}
              >
                <Text style={[styles.chipText, { color: colors.text }]}>
                  {plant}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        {isMeasuring ? (
          <TouchableOpacity
            style={[styles.button, styles.stopButton, { backgroundColor: colors.danger + '22', borderColor: colors.danger }]}
            onPress={onStop}
            disabled={isLoading}
            accessibilityLabel={t('lightMeter.stop')}
          >
            <Ionicons name="stop-circle" size={18} color={colors.danger} />
            <Text style={[styles.buttonText, { color: colors.danger }]}>
              {t('lightMeter.stop')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.measureButton, { backgroundColor: colors.tint }]}
            onPress={onMeasure}
            disabled={isLoading}
            accessibilityLabel={t('lightMeter.start')}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="sunny" size={18} color="#fff" />
            )}
            <Text style={[styles.buttonText, { color: '#fff' }]}>
              {isMeasuring ? t('lightMeter.measuring') : t('lightMeter.start')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.button,
            styles.saveButton,
            {
              backgroundColor: hasReading ? colors.chipBg : colors.chipBg,
              borderColor: colors.border,
              opacity: hasReading ? 1 : 0.45,
            },
          ]}
          onPress={onSave}
          disabled={!hasReading || isLoading}
          accessibilityLabel={t('lightMeter.save')}
        >
          <Ionicons name="bookmark-outline" size={18} color={hasReading ? colors.tint : colors.textMuted} />
          <Text style={[styles.buttonText, { color: hasReading ? colors.tint : colors.textMuted }]}>
            {t('lightMeter.save')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  accuracyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginBottom: 4,
  },
  accuracyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  luxContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingSpinner: {
    marginVertical: 20,
  },
  luxLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 4,
  },
  luxValue: {
    fontSize: 64,
    fontWeight: '700',
    lineHeight: 72,
    letterSpacing: -1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  categoryBar: {
    marginBottom: 20,
  },
  recommendationsContainer: {
    marginBottom: 16,
  },
  recommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recommendationsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    gap: 6,
  },
  measureButton: {
    flex: 1.5,
  },
  stopButton: {
    flex: 1.5,
    borderWidth: 1.5,
  },
  saveButton: {
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
