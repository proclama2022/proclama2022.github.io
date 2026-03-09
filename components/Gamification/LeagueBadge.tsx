/**
 * LeagueBadge Component
 *
 * Displays a tier badge icon for league system.
 *
 * @module components/Gamification/LeagueBadge
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LeagueTierKey } from '@/types/gamification';

export interface LeagueBadgeProps {
  tier: LeagueTierKey;
  size?: number;
  showBackground?: boolean;
  showBronze?: boolean;
}

/**
 * Tier configuration with symbols and colors
 */
const TIER_CONFIG: Record<LeagueTierKey, { symbol: string; color: string }> = {
  bronze: { symbol: '\u{1F9C9}', color: '#CD7F32' },
  silver: { symbol: '\u{1F948}', color: '#C0C0C0' },
  gold: { symbol: '\u{1F947}', color: '#FFD700' },
  platinum: { symbol: '\u{1F48E}', color: '#E5E4E2' },
  diamond: { symbol: '\u{1F4A0}', color: '#B9F2FF' },
};

/**
 * LeagueBadge displays a tier badge with configurable size.
 * By default, bronze badge is hidden (default tier) unless showBronze=true.
 */
export function LeagueBadge({
  tier,
  size = 16,
  showBackground = false,
  showBronze = false,
}: LeagueBadgeProps) {
  // Don't show bronze badge by default (it's the default tier)
  if (tier === 'bronze' && !showBronze) {
    return null;
  }

  const config = TIER_CONFIG[tier];
  if (!config) {
    return null;
  }

  const containerStyle = {
    width: size + 4,
    height: size + 4,
    borderRadius: (size + 4) / 2,
  };

  const textStyle = {
    fontSize: size,
  };

  if (showBackground) {
    return (
      <View
        style={[
          styles.containerWithBackground,
          containerStyle,
          { backgroundColor: config.color + '30' },
        ]}
      >
        <Text style={[styles.symbol, textStyle]}>{config.symbol}</Text>
      </View>
    );
  }

  return <Text style={[styles.symbol, textStyle]}>{config.symbol}</Text>;
}

const styles = StyleSheet.create({
  containerWithBackground: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    textAlign: 'center',
  },
});

export default LeagueBadge;
