import React, { useState, useRef } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { PlantNetResult, SavedPlant } from '@/types';
import { getCareInfo } from '@/services/careDB';
import { usePlantsStore } from '@/stores/plantsStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResultCardProps {
  result: PlantNetResult;
  imageUri: string;
  onAddToCollection?: (plant: SavedPlant) => void;
  width: number;
}

// ---------------------------------------------------------------------------
// Confidence bar
// ---------------------------------------------------------------------------

function ConfidenceBar({ score }: { score: number }) {
  const { t } = useTranslation();
  const pct = Math.round(score * 100);

  let barColor = '#e53935'; // red <50%
  if (score >= 0.8) barColor = '#2e7d32';   // green >=80%
  else if (score >= 0.5) barColor = '#f9a825'; // yellow >=50%

  return (
    <View style={styles.confidenceContainer}>
      <Text style={styles.confidenceLabel}>
        {t('results.confidence')}: {pct}%
      </Text>
      <View style={styles.confidenceTrack}>
        <View
          style={[
            styles.confidenceFill,
            { width: `${pct}%` as unknown as number, backgroundColor: barColor },
          ]}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------

export function ResultCard({ result, imageUri, onAddToCollection, width }: ResultCardProps) {
  const { t, i18n } = useTranslation();
  const [careExpanded, setCareExpanded] = useState(false);
  const [added, setAdded] = useState(false);
  const addPlant = usePlantsStore((s) => s.addPlant);

  const { score, species, images } = result;
  const isLowConfidence = score < 0.5;

  // Use the result's reference image if available, else fall back to user photo
  const displayImageUri =
    images?.[0]?.url ?? imageUri;

  // Care info lookup
  const careInfo = getCareInfo(species.scientificName);
  const lang = i18n.language === 'it' ? 'it' : 'en';
  const careTip = careInfo?.tips?.[lang as 'it' | 'en'] ?? null;

  // Add to collection
  const handleAdd = () => {
    if (added) return;

    const plant: SavedPlant = {
      id: crypto.randomUUID(),
      species: species.scientificName,
      scientificName: species.scientificName,
      commonName: species.commonNames?.[0],
      photo: imageUri,
      addedDate: new Date().toISOString(),
      waterHistory: [],
    };

    addPlant(plant);
    setAdded(true);

    if (onAddToCollection) {
      onAddToCollection(plant);
    }
  };

  const cardWidth = width - 40; // 20px margin each side

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      {/* Plant photo */}
      <Image
        source={{ uri: displayImageUri }}
        style={styles.photo}
        resizeMode="cover"
      />

      {/* Low confidence warning */}
      {isLowConfidence && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning-outline" size={16} color="#7a4f00" />
          <Text style={styles.warningText}>
            {t('results.lowConfidenceWarning')}
          </Text>
        </View>
      )}

      {/* Card body */}
      <View style={styles.body}>
        {/* Scientific name */}
        <Text style={styles.scientificName}>{species.scientificName}</Text>

        {/* Common names */}
        {species.commonNames?.length > 0 && (
          <Text style={styles.commonNames} numberOfLines={2}>
            {species.commonNames.slice(0, 3).join(' / ')}
          </Text>
        )}

        {/* Family */}
        <Text style={styles.family}>{species.family}</Text>

        {/* Confidence bar */}
        <ConfidenceBar score={score} />

        {/* Care info toggle */}
        <TouchableOpacity
          style={styles.careToggle}
          onPress={() => setCareExpanded((v) => !v)}
          accessibilityRole="button"
        >
          <Text style={styles.careToggleText}>{t('results.viewCare')}</Text>
          <Ionicons
            name={careExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#2e7d32"
          />
        </TouchableOpacity>

        {/* Expanded care info */}
        {careExpanded && (
          <View style={styles.careSection}>
            {careInfo ? (
              <>
                {/* Quick stats row */}
                <View style={styles.careStats}>
                  <CareStatItem
                    icon="water-outline"
                    label={t('detail.watering')}
                    value={`${careInfo.waterFrequencyDays}d`}
                  />
                  <CareStatItem
                    icon="sunny-outline"
                    label={t('detail.sunlight')}
                    value={careInfo.sunlight.replace('-', ' ')}
                  />
                  <CareStatItem
                    icon="thermometer-outline"
                    label={t('detail.temperature')}
                    value={`${careInfo.tempMin}–${careInfo.tempMax}°C`}
                  />
                  {careInfo.difficulty && (
                    <CareStatItem
                      icon="bar-chart-outline"
                      label={t('detail.difficulty')}
                      value={careInfo.difficulty}
                    />
                  )}
                </View>

                {/* Toxic to pets */}
                {careInfo.toxicPets && (
                  <View style={styles.toxicWarning}>
                    <Ionicons name="paw-outline" size={14} color="#c62828" />
                    <Text style={styles.toxicText}>{t('detail.toxicPets')}</Text>
                  </View>
                )}

                {/* Care tip */}
                {careTip && (
                  <Text style={styles.careTip}>{careTip}</Text>
                )}
              </>
            ) : (
              <Text style={styles.careComingSoon}>
                {t('results.careComingSoon')}
              </Text>
            )}
          </View>
        )}

        {/* Add to collection button */}
        <TouchableOpacity
          style={[styles.addButton, added && styles.addButtonAdded]}
          onPress={handleAdd}
          disabled={added}
          accessibilityRole="button"
        >
          <Ionicons
            name={added ? 'checkmark-circle' : 'add-circle-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.addButtonText}>
            {added ? t('collection.plantAdded') : t('results.addToCollection')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CareStatItem helper
// ---------------------------------------------------------------------------

interface CareStatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

function CareStatItem({ icon, label, value }: CareStatItemProps) {
  return (
    <View style={styles.careStatItem}>
      <Ionicons name={icon} size={16} color="#555" />
      <Text style={styles.careStatLabel}>{label}</Text>
      <Text style={styles.careStatValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 20,
  },
  photo: {
    width: '100%',
    height: 220,
  },

  // Warning banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff8e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe082',
  },
  warningText: {
    fontSize: 12,
    color: '#7a4f00',
    flex: 1,
    lineHeight: 16,
  },

  // Body
  body: {
    padding: 16,
    gap: 8,
  },
  scientificName: {
    fontSize: 18,
    fontWeight: '700',
    fontStyle: 'italic',
    color: '#1a1a1a',
  },
  commonNames: {
    fontSize: 14,
    color: '#444',
  },
  family: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Confidence bar
  confidenceContainer: {
    gap: 4,
    marginTop: 4,
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
  },
  confidenceTrack: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Care toggle
  careToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  careToggleText: {
    fontSize: 14,
    color: '#2e7d32',
    fontWeight: '600',
  },

  // Care section
  careSection: {
    backgroundColor: '#f9fbe7',
    borderRadius: 8,
    padding: 12,
    gap: 10,
  },
  careStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  careStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  careStatLabel: {
    fontSize: 11,
    color: '#888',
  },
  careStatValue: {
    fontSize: 11,
    color: '#333',
    fontWeight: '600',
  },
  toxicWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  toxicText: {
    fontSize: 11,
    color: '#c62828',
    fontWeight: '600',
  },
  careTip: {
    fontSize: 13,
    color: '#4a4a4a',
    lineHeight: 19,
  },
  careComingSoon: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },

  // Add button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  addButtonAdded: {
    backgroundColor: '#1b5e20',
    opacity: 0.8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ResultCard;
