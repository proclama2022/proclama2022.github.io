import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from '@/services/careDB';
import { PlantCareInfo } from '@/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type SunlightValue = PlantCareInfo['sunlight'];
type HumidityValue = NonNullable<PlantCareInfo['humidity']>;

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

const HUMIDITY_LABELS_EN: Record<HumidityValue, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const HUMIDITY_LABELS_IT: Record<HumidityValue, string> = {
  low: 'Bassa',
  medium: 'Media',
  high: 'Alta',
};

interface CareMetricProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
}

function CareMetric({ icon, label, value, tint }: CareMetricProps) {
  return (
    <View style={[styles.metricCard, { backgroundColor: `${tint}14` }]}>
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.metricLabel, { color: tint }]}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

interface SectionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}

function SectionCard({ icon, title, children, colors }: SectionCardProps) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: colors.surfaceStrong }]}>
          <Ionicons name={icon} size={16} color={colors.tint} />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

interface CareTabProps {
  plantId?: string;
}

export function CareTab({ plantId: plantIdProp }: CareTabProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const resolvedId = id ?? plantIdProp ?? '';
  const plant = usePlantsStore((s) => s.getPlant(resolvedId));
  const [expandedPestIndex, setExpandedPestIndex] = useState<number | null>(null);

  const isItalian = i18n.language === 'it';
  const scientificName = plant?.scientificName ?? plant?.species ?? '';
  const care = getCareInfo(scientificName);
  const isSighting = plant?.entryKind === 'sighting';

  const sunlightLabel = useMemo(() => {
    if (!care) return t('detail.care.notAvailable');
    return isItalian ? SUNLIGHT_LABELS_IT[care.sunlight] : SUNLIGHT_LABELS_EN[care.sunlight];
  }, [care, isItalian, t]);

  const humidityLabel = useMemo(() => {
    if (!care?.humidity) return t('detail.care.notAvailable');
    return isItalian ? HUMIDITY_LABELS_IT[care.humidity] : HUMIDITY_LABELS_EN[care.humidity];
  }, [care, isItalian, t]);

  const wateringLabel = care
    ? isItalian
      ? `Ogni ${care.waterFrequencyDays} giorni`
      : `Every ${care.waterFrequencyDays} days`
    : t('detail.care.notAvailable');

  const seasonLabel = (season: string): string => {
    switch (season) {
      case 'spring':
        return t('detail.care.spring');
      case 'summer':
        return t('detail.care.summer');
      case 'autumn':
        return t('detail.care.autumn');
      case 'winter':
        return t('detail.care.winter');
      default:
        return season;
    }
  };

  if (!plant) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="leaf-outline" size={32} color={colors.textMuted} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('detail.notFound')}</Text>
      </View>
    );
  }

  if (isSighting) {
    const observedLabel = new Date(plant.observedAt || plant.addedDate).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryEyebrow, { color: colors.textMuted }]}>{t('detail.tabs.observation')}</Text>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('detail.observation.summaryTitle')}</Text>
          <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>{t('detail.observation.summaryBody')}</Text>

          <View style={styles.metricsGrid}>
            <CareMetric
              icon="calendar-outline"
              label={t('entry.observedLabel')}
              value={observedLabel}
              tint={colors.tint}
            />
            <CareMetric
              icon="trail-sign-outline"
              label={t('entry.spaceLabel')}
              value={t(`entry.space.${plant.space}`)}
              tint={colors.warning}
            />
            <CareMetric
              icon="location-outline"
              label={t('detail.location')}
              value={plant.location || t('detail.summaryNoLocation')}
              tint={colors.success}
            />
          </View>
        </View>

        <SectionCard icon="compass-outline" title={t('detail.observation.contextTitle')} colors={colors}>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {plant.location || t(`entry.space.${plant.space}`)}
          </Text>
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
            {t('detail.observation.contextBody')}
          </Text>
          {plant.habitat ? (
            <View style={[styles.inlineChip, { backgroundColor: colors.surfaceStrong }]}>
              <Ionicons name="leaf-outline" size={14} color={colors.tint} />
              <Text style={[styles.inlineChipText, { color: colors.textSecondary }]}>
                {plant.habitat}
              </Text>
            </View>
          ) : null}
          {plant.observationConditions ? (
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
              {plant.observationConditions}
            </Text>
          ) : null}
        </SectionCard>

        <SectionCard icon="book-outline" title={t('detail.observation.referenceTitle')} colors={colors}>
          {care ? (
            <>
              <Text style={[styles.valueText, { color: colors.text }]}>
                {t('detail.observation.referenceBody')}
              </Text>
              <View style={styles.metricsGrid}>
                <CareMetric
                  icon="sunny-outline"
                  label={t('detail.care.light')}
                  value={sunlightLabel}
                  tint={colors.warning}
                />
                <CareMetric
                  icon="thermometer-outline"
                  label={t('detail.care.temperature')}
                  value={t('detail.care.tempRange', { min: care.tempMin, max: care.tempMax })}
                  tint={colors.tint}
                />
                <CareMetric
                  icon="bar-chart-outline"
                  label={t('detail.difficulty')}
                  value={t(`search.${care.difficulty}`)}
                  tint={colors.success}
                />
              </View>
            </>
          ) : (
            <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
              {t('detail.observation.referenceEmpty')}
            </Text>
          )}
        </SectionCard>

        <SectionCard icon="create-outline" title={t('detail.notes.metadataSection')} colors={colors}>
          <Text style={[styles.valueText, { color: colors.text }]}>{t('detail.observation.journalBody')}</Text>
        </SectionCard>
      </ScrollView>
    );
  }

  if (!care) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceStrong }]}>
          <Ionicons name="leaf-outline" size={28} color={colors.tint} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('detail.care.emptyTitle')}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('detail.care.notAvailable')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.summaryEyebrow, { color: colors.textMuted }]}>{t('detail.tabs.care')}</Text>
        <Text style={[styles.summaryTitle, { color: colors.text }]}>{t('detail.care.summaryTitle')}</Text>
        <Text style={[styles.summaryBody, { color: colors.textSecondary }]}>{t('detail.care.summaryBody')}</Text>

        <View style={styles.metricsGrid}>
          <CareMetric
            icon="water-outline"
            label={t('detail.care.watering')}
            value={wateringLabel}
            tint={colors.success}
          />
          <CareMetric
            icon="sunny-outline"
            label={t('detail.care.light')}
            value={sunlightLabel}
            tint={colors.warning}
          />
          <CareMetric
            icon="thermometer-outline"
            label={t('detail.care.temperature')}
            value={t('detail.care.tempRange', { min: care.tempMin, max: care.tempMax })}
            tint={colors.tint}
          />
        </View>
      </View>

      <SectionCard icon="water-outline" title={t('detail.care.watering')} colors={colors}>
        <Text style={[styles.valueText, { color: colors.text }]}>{wateringLabel}</Text>
        {care.humidity ? (
          <View style={[styles.inlineChip, { backgroundColor: colors.surfaceStrong }]}>
            <Ionicons name="water" size={14} color={colors.tint} />
            <Text style={[styles.inlineChipText, { color: colors.textSecondary }]}>
              {t('detail.care.humidity')}: {humidityLabel}
            </Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard icon="sunny-outline" title={t('detail.care.light')} colors={colors}>
        <Text style={[styles.valueText, { color: colors.text }]}>{sunlightLabel}</Text>
        <TouchableOpacity
          style={[styles.measureLightButton, { backgroundColor: `${colors.tint}14`, borderColor: `${colors.tint}30` }]}
          onPress={() => router.push('/light-meter')}
          activeOpacity={0.7}
        >
          <Ionicons name="sunny-outline" size={15} color={colors.tint} />
          <Text style={[styles.measureLightText, { color: colors.tint }]}>
            {t('lightMeter.measureLight')}
          </Text>
          <Ionicons name="chevron-forward-outline" size={14} color={colors.tint} />
        </TouchableOpacity>
      </SectionCard>

      <SectionCard icon="thermometer-outline" title={t('detail.care.temperature')} colors={colors}>
        <Text style={[styles.valueText, { color: colors.text }]}>
          {t('detail.care.tempRange', { min: care.tempMin, max: care.tempMax })}
        </Text>
        {care.seasonalTemps && care.seasonalTemps.length > 0 ? (
          <View style={styles.seasonalList}>
            {care.seasonalTemps.map((seasonalTemp) => (
              <View
                key={seasonalTemp.season}
                style={[styles.seasonalRow, { borderTopColor: colors.borderLight }]}
              >
                <Text style={[styles.seasonalName, { color: colors.textSecondary }]}>
                  {seasonLabel(seasonalTemp.season)}
                </Text>
                <Text style={[styles.seasonalValue, { color: colors.text }]}>
                  {t('detail.care.tempRange', { min: seasonalTemp.minTemp, max: seasonalTemp.maxTemp })}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </SectionCard>

      {care.soil ? (
        <SectionCard icon="layers-outline" title={t('detail.soil')} colors={colors}>
          <Text style={[styles.valueText, { color: colors.text }]}>{care.soil}</Text>
        </SectionCard>
      ) : null}

      {care.fertilization ? (
        <SectionCard icon="flask-outline" title={t('detail.care.fertilization')} colors={colors}>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {isItalian ? care.fertilization.schedule.it : care.fertilization.schedule.en}
          </Text>
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
            {isItalian ? care.fertilization.type.it : care.fertilization.type.en}
          </Text>
        </SectionCard>
      ) : null}

      {care.pruning ? (
        <SectionCard icon="cut-outline" title={t('detail.care.pruning')} colors={colors}>
          <Text style={[styles.valueText, { color: colors.text }]}>
            {isItalian ? care.pruning.when.it : care.pruning.when.en}
          </Text>
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
            {isItalian ? care.pruning.how.it : care.pruning.how.en}
          </Text>
        </SectionCard>
      ) : null}

      {care.toxicPets ? (
        <View style={[styles.warningCard, { backgroundColor: `${colors.danger}12`, borderColor: `${colors.danger}24` }]}>
          <Ionicons name="warning-outline" size={18} color={colors.danger} />
          <Text style={[styles.warningText, { color: colors.danger }]}>{t('detail.care.toxicWarning')}</Text>
        </View>
      ) : (
        <View style={[styles.safeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="paw-outline" size={18} color={colors.success} />
          <Text style={[styles.safeText, { color: colors.textSecondary }]}>{t('detail.care.safePets')}</Text>
        </View>
      )}

      <SectionCard icon="bug-outline" title={t('detail.care.pests')} colors={colors}>
        {care.pests && care.pests.length > 0 ? (
          <View style={styles.pestsList}>
            {care.pests.map((pest, index) => {
              const isExpanded = expandedPestIndex === index;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.pestCard,
                    {
                      backgroundColor: colors.surfaceStrong,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setExpandedPestIndex(isExpanded ? null : index)}
                  activeOpacity={0.8}
                >
                  <View style={styles.pestHeader}>
                    <Text style={[styles.pestName, { color: colors.text }]}>
                      {isItalian ? pest.name.it : pest.name.en}
                    </Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </View>
                  <Text style={[styles.pestDescription, { color: colors.textSecondary }]}>
                    {isItalian ? pest.description.it : pest.description.en}
                  </Text>
                  {isExpanded ? (
                    <View style={[styles.remedyBox, { backgroundColor: colors.surface }]}>
                      <Text style={[styles.remedyLabel, { color: colors.tint }]}>{t('detail.care.remedyLabel')}</Text>
                      <Text style={[styles.remedyText, { color: colors.textSecondary }]}>
                        {isItalian ? pest.remedy.it : pest.remedy.en}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[styles.tapHint, { color: colors.tint }]}>{t('detail.care.tapToExpand')}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>{t('detail.care.notAvailable')}</Text>
        )}
      </SectionCard>

      <SectionCard icon="bulb-outline" title={t('detail.care.tipTitle')} colors={colors}>
        <Text style={[styles.valueText, { color: colors.text }]}>{isItalian ? care.tips.it : care.tips.en}</Text>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 10,
  },
  summaryEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  metricCard: {
    flex: 1,
    minWidth: 96,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricValue: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  valueText: {
    fontSize: 15,
    lineHeight: 22,
  },
  secondaryText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: -4,
  },
  inlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  inlineChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  seasonalList: {
    marginTop: 4,
  },
  seasonalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  seasonalName: {
    fontSize: 14,
    fontWeight: '600',
  },
  seasonalValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  safeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  safeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  pestsList: {
    gap: 10,
  },
  pestCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  pestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  pestName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  pestDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  remedyBox: {
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  remedyLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  remedyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  measureLightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  measureLightText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
