/**
 * LightCategoryBar Component
 *
 * Color-coded horizontal progress bar that visualizes light categories.
 * Shows 4 segments (Low, Medium, Bright Indirect, Direct Sun) with
 * a position indicator for the current lux value.
 *
 * Uses React Native Animated for smooth transitions.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getLightCategory, type LightCategory } from '@/types/lightMeter';

// ============================================================================
// Constants
// ============================================================================

/** Category segment definitions */
const CATEGORIES: {
  key: LightCategory;
  color: string;
  activeColor: string;
  minLux: number;
  maxLux: number;
  flex: number;
  i18nKey: string;
}[] = [
  {
    key: 'low',
    color: '#78909C',
    activeColor: '#607D8B',
    minLux: 500,
    maxLux: 2500,
    flex: 10,
    i18nKey: 'lightMeter.categories.low',
  },
  {
    key: 'medium',
    color: '#AED581',
    activeColor: '#8BC34A',
    minLux: 2500,
    maxLux: 10000,
    flex: 37,
    i18nKey: 'lightMeter.categories.medium',
  },
  {
    key: 'bright_indirect',
    color: '#FFB74D',
    activeColor: '#FF9800',
    minLux: 10000,
    maxLux: 20000,
    flex: 33,
    i18nKey: 'lightMeter.categories.brightIndirect',
  },
  {
    key: 'direct_sun',
    color: '#EF9A9A',
    activeColor: '#F44336',
    minLux: 20000,
    maxLux: 100000,
    flex: 20,
    i18nKey: 'lightMeter.categories.directSun',
  },
];

// Total flex units for position calculation
const TOTAL_FLEX = CATEGORIES.reduce((sum, c) => sum + c.flex, 0);

// ============================================================================
// Props
// ============================================================================

interface LightCategoryBarProps {
  currentLux: number | null;
  style?: ViewStyle;
}

// ============================================================================
// Helper: compute indicator position (0–1) from lux
// ============================================================================

function getIndicatorPosition(lux: number): number {
  // Clamp to overall range
  const minLux = 500;
  const maxLux = 100000;
  const clampedLux = Math.max(minLux, Math.min(maxLux, lux));

  // Compute cumulative flex-based position
  let cumulativeFlex = 0;
  for (const cat of CATEGORIES) {
    const catRange = cat.maxLux - cat.minLux;
    if (clampedLux <= cat.maxLux) {
      // Lux is within this segment
      const posWithinSeg = (clampedLux - cat.minLux) / catRange;
      const flexPosition = cumulativeFlex + posWithinSeg * cat.flex;
      return flexPosition / TOTAL_FLEX;
    }
    cumulativeFlex += cat.flex;
  }
  return 1;
}

// ============================================================================
// Component
// ============================================================================

export function LightCategoryBar({ currentLux, style }: LightCategoryBarProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // Animated position (0–1)
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  // Track current category for highlighting
  const currentCategory = currentLux !== null && currentLux >= 500
    ? getLightCategory(currentLux)
    : null;

  // Animate indicator when lux changes
  useEffect(() => {
    if (currentLux === null || currentLux < 500) {
      // No valid reading — animate to start
      Animated.spring(indicatorAnim, {
        toValue: 0,
        useNativeDriver: false,
        tension: 40,
        friction: 8,
      }).start();
      return;
    }

    const targetPosition = getIndicatorPosition(currentLux);
    Animated.spring(indicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [currentLux, indicatorAnim]);

  const isActive = currentLux !== null && currentLux >= 500;

  return (
    <View style={[styles.container, style]}>
      {/* Bar segments */}
      <View style={styles.barWrapper}>
        {CATEGORIES.map((cat, index) => {
          const isCurrentCat = currentCategory === cat.key;
          const color = isCurrentCat ? cat.activeColor : (isActive ? cat.color + '80' : cat.color + '40');
          return (
            <View
              key={cat.key}
              style={[
                styles.segment,
                {
                  flex: cat.flex,
                  backgroundColor: color,
                  // Round left end of first segment, right end of last
                  borderTopLeftRadius: index === 0 ? 6 : 0,
                  borderBottomLeftRadius: index === 0 ? 6 : 0,
                  borderTopRightRadius: index === CATEGORIES.length - 1 ? 6 : 0,
                  borderBottomRightRadius: index === CATEGORIES.length - 1 ? 6 : 0,
                  borderRightWidth: index < CATEGORIES.length - 1 ? 1.5 : 0,
                  borderRightColor: colors.background,
                },
              ]}
            />
          );
        })}

        {/* Animated position indicator */}
        {isActive && (
          <Animated.View
            style={[
              styles.indicator,
              {
                left: indicatorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '97%'],
                }),
              },
            ]}
          />
        )}
      </View>

      {/* Category labels */}
      <View style={styles.labelsRow}>
        {CATEGORIES.map((cat) => {
          const isCurrentCat = currentCategory === cat.key;
          return (
            <View key={cat.key} style={[styles.labelContainer, { flex: cat.flex }]}>
              <Text
                style={[
                  styles.label,
                  {
                    color: isCurrentCat ? cat.activeColor : colors.textMuted,
                    fontWeight: isCurrentCat ? '700' : '400',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t(cat.i18nKey)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Empty state hint */}
      {!isActive && (
        <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
          {t('lightMeter.start')}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barWrapper: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'visible',
    position: 'relative',
  },
  segment: {
    height: 14,
  },
  indicator: {
    position: 'absolute',
    top: -4,
    width: 6,
    height: 22,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 3,
  },
  labelsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  labelContainer: {
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  label: {
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  emptyHint: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
