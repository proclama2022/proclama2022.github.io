import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from '@/services/careDB';
import { PlantCareInfo } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SunlightValue = PlantCareInfo['sunlight'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUNLIGHT_LABELS_EN: Record<SunlightValue, string> = {
  'full-sun': 'Full Sun',
  'partial-sun': 'Partial Sun',
  shade: 'Shade',
  'low-light': 'Low Light',
};

const SUNLIGHT_LABELS_IT: Record<SunlightValue, string> = {
  'full-sun': 'Pieno Sole',
  'partial-sun': 'Sole Parziale',
  shade: 'Ombra',
  'low-light': 'Poca Luce',
};

// ---------------------------------------------------------------------------
// CareSection — always renders the heading; shows fallback if no data
// ---------------------------------------------------------------------------

interface CareSectionProps {
  label: string;
  hasData: boolean;
  children: React.ReactNode;
  isLast?: boolean;
  notAvailableText: string;
}

function CareSection({ label, hasData, children, isLast, notAvailableText }: CareSectionProps) {
  return (
    <View style={[styles.section, isLast ? styles.sectionLast : null]}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hasData
        ? children
        : <Text style={styles.notAvailable}>{notAvailableText}</Text>
      }
    </View>
  );
}

// ---------------------------------------------------------------------------
// CareTab
// ---------------------------------------------------------------------------

export function CareTab() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));
  const [expandedPestIndex, setExpandedPestIndex] = useState<number | null>(null);

  const isItalian = i18n.language === 'it';

  const scientificName = plant?.scientificName ?? plant?.species ?? '';
  const care = getCareInfo(scientificName);

  const notAvailableText = t('detail.care.notAvailable');

  // Season key → label via i18n
  function seasonLabel(season: string): string {
    switch (season) {
      case 'spring': return t('detail.care.spring');
      case 'summer': return t('detail.care.summer');
      case 'autumn': return t('detail.care.autumn');
      case 'winter': return t('detail.care.winter');
      default: return season;
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

      {/* 1. Watering */}
      <CareSection
        label={t('detail.care.watering').toUpperCase()}
        hasData={!!care}
        notAvailableText={notAvailableText}
      >
        {care ? (
          <Text style={styles.valueText}>
            {isItalian
              ? `Ogni ${care.waterFrequencyDays} giorni`
              : `Every ${care.waterFrequencyDays} days`}
          </Text>
        ) : null}
      </CareSection>

      {/* 2. Light */}
      <CareSection
        label={t('detail.care.light').toUpperCase()}
        hasData={!!care}
        notAvailableText={notAvailableText}
      >
        {care ? (
          <Text style={styles.valueText}>
            {isItalian
              ? SUNLIGHT_LABELS_IT[care.sunlight]
              : SUNLIGHT_LABELS_EN[care.sunlight]}
          </Text>
        ) : null}
      </CareSection>

      {/* 3. Temperature */}
      <CareSection
        label={t('detail.care.temperature').toUpperCase()}
        hasData={!!care}
        notAvailableText={notAvailableText}
      >
        {care ? (
          <View>
            {/* Basic range row */}
            <Text style={styles.valueText}>
              {t('detail.care.tempRange', { min: care.tempMin, max: care.tempMax })}
            </Text>
            {/* Seasonal temps list */}
            {care.seasonalTemps && care.seasonalTemps.length > 0 ? (
              <View style={styles.seasonalTempsContainer}>
                <Text style={styles.subLabel}>
                  {t('detail.care.seasonalTemps').toUpperCase()}
                </Text>
                {care.seasonalTemps.map((st) => (
                  <View key={st.season} style={styles.seasonalRow}>
                    <Text style={styles.seasonName}>{seasonLabel(st.season)}:</Text>
                    <Text style={styles.seasonTemp}>
                      {t('detail.care.tempRange', { min: st.minTemp, max: st.maxTemp })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </CareSection>

      {/* 4. Fertilization */}
      <CareSection
        label={t('detail.care.fertilization').toUpperCase()}
        hasData={!!(care?.fertilization)}
        notAvailableText={notAvailableText}
      >
        {care?.fertilization ? (
          <View>
            <Text style={styles.valueText}>
              {isItalian
                ? care.fertilization.schedule.it
                : care.fertilization.schedule.en}
            </Text>
            <Text style={[styles.valueText, styles.valueTextSecondary]}>
              {isItalian
                ? care.fertilization.type.it
                : care.fertilization.type.en}
            </Text>
          </View>
        ) : null}
      </CareSection>

      {/* 5. Pruning */}
      <CareSection
        label={t('detail.care.pruning').toUpperCase()}
        hasData={!!(care?.pruning)}
        notAvailableText={notAvailableText}
      >
        {care?.pruning ? (
          <View>
            <Text style={styles.valueText}>
              {isItalian ? care.pruning.when.it : care.pruning.when.en}
            </Text>
            <Text style={[styles.valueText, styles.valueTextSecondary]}>
              {isItalian ? care.pruning.how.it : care.pruning.how.en}
            </Text>
          </View>
        ) : null}
      </CareSection>

      {/* 6. Pests (expandable) */}
      <CareSection
        label={t('detail.care.pests').toUpperCase()}
        hasData={!!(care?.pests && care.pests.length > 0)}
        notAvailableText={notAvailableText}
        isLast
      >
        {care?.pests && care.pests.length > 0 ? (
          <View>
            {care.pests.map((pest, index) => {
              const isExpanded = expandedPestIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.pestRow, index < (care.pests?.length ?? 0) - 1 ? styles.pestRowBorder : null]}
                  onPress={() =>
                    setExpandedPestIndex(isExpanded ? null : index)
                  }
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={isItalian ? pest.name.it : pest.name.en}
                >
                  <Text style={styles.pestName}>
                    {isItalian ? pest.name.it : pest.name.en}
                  </Text>
                  <Text style={styles.pestDescription}>
                    {isItalian ? pest.description.it : pest.description.en}
                  </Text>
                  {!isExpanded ? (
                    <Text style={styles.tapHint}>
                      {t('detail.care.tapToExpand')}
                    </Text>
                  ) : (
                    <View style={styles.remedyContainer}>
                      <Text style={styles.remedyLabel}>
                        {isItalian ? 'Rimedio:' : 'Remedy:'}
                      </Text>
                      <Text style={styles.remedyText}>
                        {isItalian ? pest.remedy.it : pest.remedy.en}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}
      </CareSection>

    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },

  // Section
  section: {
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionLast: {
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },

  // Values
  valueText: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  valueTextSecondary: {
    marginTop: 6,
    color: '#555',
  },
  notAvailable: {
    fontSize: 14,
    color: '#aaa',
    fontStyle: 'italic',
  },

  // Seasonal temps
  seasonalTempsContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#aaa',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  seasonalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  seasonName: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  seasonTemp: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },

  // Pests
  pestRow: {
    paddingVertical: 12,
  },
  pestRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pestName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  pestDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 4,
  },
  tapHint: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '600',
    marginTop: 2,
  },
  remedyContainer: {
    marginTop: 8,
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 10,
  },
  remedyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2e7d32',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  remedyText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },
});
