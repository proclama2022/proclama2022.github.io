import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/i18n';
import { Text } from '@/components/Themed';
import { PlantCareInfo } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CareInfoProps {
  care: PlantCareInfo | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SunlightValue = PlantCareInfo['sunlight'];
type DifficultyValue = PlantCareInfo['difficulty'];

const SUNLIGHT_ICONS: Record<SunlightValue, { name: React.ComponentProps<typeof Ionicons>['name']; color: string; label: string }> = {
  'full-sun': { name: 'sunny', color: '#F9A825', label: 'Full Sun' },
  'partial-sun': { name: 'partly-sunny', color: '#FFB300', label: 'Partial Sun' },
  shade: { name: 'cloud', color: '#78909C', label: 'Shade' },
  'low-light': { name: 'cloudy-night', color: '#90A4AE', label: 'Low Light' },
};

const SUNLIGHT_LABELS_IT: Record<SunlightValue, string> = {
  'full-sun': 'Pieno Sole',
  'partial-sun': 'Sole Parziale',
  shade: 'Ombra',
  'low-light': 'Poca Luce',
};

const DIFFICULTY_COLORS: Record<DifficultyValue, string> = {
  easy: '#2e7d32',
  medium: '#F57C00',
  hard: '#c62828',
};

const DIFFICULTY_LABELS_EN: Record<DifficultyValue, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_LABELS_IT: Record<DifficultyValue, string> = {
  easy: 'Facile',
  medium: 'Medio',
  hard: 'Difficile',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface CareRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  value: string;
}

function CareRow({ icon, iconColor, label, value }: CareRowProps) {
  return (
    <View style={rowStyles.container}>
      <View style={rowStyles.iconWrap}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={rowStyles.textWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        <Text style={rowStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#f0f4f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
});

// ---------------------------------------------------------------------------
// CareInfo
// ---------------------------------------------------------------------------

export function CareInfo({ care }: CareInfoProps) {
  const { t } = useTranslation();
  const lang = getCurrentLanguage();
  const isItalian = lang === 'it';

  // Empty state
  if (!care) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={32} color="#aaa" />
        <Text style={styles.emptyText}>{t('results.careComingSoon')}</Text>
      </View>
    );
  }

  // Sunlight
  const sunlightMeta = SUNLIGHT_ICONS[care.sunlight];
  const sunlightLabel = isItalian
    ? SUNLIGHT_LABELS_IT[care.sunlight]
    : sunlightMeta.label;

  // Difficulty
  const difficultyColor = DIFFICULTY_COLORS[care.difficulty];
  const difficultyLabel = isItalian
    ? DIFFICULTY_LABELS_IT[care.difficulty]
    : DIFFICULTY_LABELS_EN[care.difficulty];

  // Tip: localised
  const tip = isItalian ? care.tips.it : care.tips.en;

  return (
    <View style={styles.container}>
      {/* Watering */}
      <CareRow
        icon="water"
        iconColor="#1565C0"
        label={t('detail.watering')}
        value={
          isItalian
            ? `Ogni ${care.waterFrequencyDays} giorni`
            : `Every ${care.waterFrequencyDays} days`
        }
      />

      {/* Sunlight */}
      <CareRow
        icon={sunlightMeta.name}
        iconColor={sunlightMeta.color}
        label={t('detail.sunlight')}
        value={sunlightLabel}
      />

      {/* Temperature */}
      <CareRow
        icon="thermometer"
        iconColor="#E53935"
        label={t('detail.temperature')}
        value={`${care.tempMin}°C – ${care.tempMax}°C`}
      />

      {/* Soil (optional) */}
      {care.soil ? (
        <CareRow
          icon="layers"
          iconColor="#8D6E63"
          label={t('detail.soil')}
          value={care.soil}
        />
      ) : null}

      {/* Humidity (optional) */}
      {care.humidity ? (
        <CareRow
          icon="water-outline"
          iconColor="#0288D1"
          label={isItalian ? 'Umidità' : 'Humidity'}
          value={
            isItalian
              ? care.humidity === 'low'
                ? 'Bassa'
                : care.humidity === 'medium'
                ? 'Media'
                : 'Alta'
              : care.humidity.charAt(0).toUpperCase() + care.humidity.slice(1)
          }
        />
      ) : null}

      {/* Difficulty */}
      <View style={rowStyles.container}>
        <View style={[rowStyles.iconWrap, { backgroundColor: difficultyColor + '18' }]}>
          <Ionicons name="stats-chart" size={20} color={difficultyColor} />
        </View>
        <View style={rowStyles.textWrap}>
          <Text style={rowStyles.label}>{t('detail.difficulty')}</Text>
          <View style={styles.difficultyRow}>
            <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
            <Text style={[styles.difficultyText, { color: difficultyColor }]}>
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Toxic to pets */}
      {care.toxicPets ? (
        <View style={styles.toxicBanner}>
          <Ionicons name="warning" size={18} color="#B71C1C" />
          <Text style={styles.toxicText}>
            {isItalian ? 'Attenzione: tossica per animali domestici' : 'Warning: Toxic to pets'}
          </Text>
        </View>
      ) : null}

      {/* Tip */}
      {tip ? (
        <View style={styles.tipBox}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb-outline" size={16} color="#2e7d32" />
            <Text style={styles.tipTitle}>{isItalian ? 'Consiglio' : 'Tip'}</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Difficulty
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  difficultyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Toxic warning
  toxicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  toxicText: {
    fontSize: 13,
    color: '#B71C1C',
    fontWeight: '600',
    flex: 1,
  },

  // Tip
  tipBox: {
    backgroundColor: '#F1F8E9',
    borderRadius: 10,
    padding: 14,
    marginTop: 2,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2e7d32',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 19,
  },
});
