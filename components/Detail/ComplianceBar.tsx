import React from 'react';
import { View, StyleSheet } from 'react-native';
import * as Progress from 'react-native-progress';
import { useTranslation } from 'react-i18next';
import { getComplianceRate } from '@/services/wateringService';
import { SavedPlant } from '@/types';
import { Text } from '@/components/Themed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ComplianceBarProps {
  plant: SavedPlant;
}

// ---------------------------------------------------------------------------
// ComplianceBar Component
// ---------------------------------------------------------------------------

export function ComplianceBar({ plant }: ComplianceBarProps) {
  const { t } = useTranslation();

  // Calculate compliance rate (7-day rolling window)
  const compliance = getComplianceRate(plant.id, 7);

  // If no care info available, don't show compliance
  if (compliance.expected === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Progress.Bar
        progress={compliance.rate / 100}
        width={null}
        height={12}
        color="#2e7d32"
        unfilledColor="#e0e0e0"
        borderWidth={0}
        borderRadius={6}
      />
      <Text style={styles.label}>
        {t('watering.complianceThisWeek', { rate: compliance.rate })}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});
