/**
 * Light Meter Screen
 *
 * Full-featured light measurement screen with platform adaptation:
 * - Android: uses native ambient light sensor (useLightSensor)
 * - iOS: uses camera-based estimation (useCameraLightEstimator + CameraPreview)
 *
 * Features:
 * - Real-time lux display with LightMeterGauge
 * - Platform-appropriate accuracy labels
 * - Save measurement to a specific plant
 * - Instructions and educational content
 * - Full bilingual support (EN/IT)
 *
 * @module app/light-meter
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/Themed';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LightMeterGauge } from '@/components/LightMeter/LightMeterGauge';
import { CameraPreview } from '@/components/LightMeter/CameraPreview';
import { useLightSensor } from '@/hooks/useLightSensor';
import { useCameraLightEstimator } from '@/hooks/useCameraLightEstimator';
import { usePlantsStore } from '@/stores/plantsStore';
import { getLightCategory } from '@/types/lightMeter';
import type { LuxReading, LightCategory } from '@/types/lightMeter';
import AtmosphericBackdrop from '@/components/AtmosphericBackdrop';

// ============================================================================
// Types
// ============================================================================

interface SavedMeasurement {
  plantId: string;
  lux: number;
  category: LightCategory;
  timestamp: number;
}

// ============================================================================
// Platform detection
// ============================================================================

const IS_ANDROID = Platform.OS === 'android';

// ============================================================================
// Save Modal Component
// ============================================================================

function SaveModal({
  visible,
  lux,
  category,
  onSave,
  onClose,
}: {
  visible: boolean;
  lux: number;
  category: LightCategory | null;
  onSave: (measurement: SavedMeasurement) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const plants = usePlantsStore((state) => state.plants);

  // Only show managed plants (not sightings)
  const managedPlants = plants.filter((p) => (p.entryKind ?? 'managed') === 'managed');

  const handleSelectPlant = useCallback((plantId: string) => {
    onSave({
      plantId,
      lux,
      category: category ?? 'unknown',
      timestamp: Date.now(),
    });
  }, [lux, category, onSave]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalSafe, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {t('lightMeter.save')}
          </Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel={t('common.close')}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Measurement summary */}
        <View style={[styles.measurementSummary, { backgroundColor: colors.surfaceStrong, borderColor: colors.border }]}>
          <Ionicons name="sunny" size={20} color={colors.warning} />
          <Text style={[styles.summaryText, { color: colors.text }]}>
            {lux >= 1000
              ? `${(lux / 1000).toFixed(1)}K lux`
              : `${Math.round(lux)} lux`}
          </Text>
          {category && category !== 'unknown' && (
            <Text style={[styles.summaryCategory, { color: colors.textSecondary }]}>
              {' · '}{t(`lightMeter.categories.${
                category === 'bright_indirect' ? 'brightIndirect' :
                category === 'direct_sun' ? 'directSun' :
                category
              }`)}
            </Text>
          )}
        </View>

        {/* Plant list */}
        {managedPlants.length === 0 ? (
          <View style={styles.emptyPlants}>
            <Ionicons name="leaf-outline" size={40} color={colors.textMuted} />
            <Text style={[styles.emptyPlantsText, { color: colors.textMuted }]}>
              No plants in your collection yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={managedPlants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.plantList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.plantRow, { borderBottomColor: colors.borderLight }]}
                onPress={() => handleSelectPlant(item.id)}
              >
                <View style={[styles.plantIconBg, { backgroundColor: colors.chipBg }]}>
                  <Ionicons name="leaf" size={18} color={colors.tint} />
                </View>
                <View style={styles.plantInfo}>
                  <Text style={[styles.plantName, { color: colors.text }]}>
                    {item.nickname || item.speciesName}
                  </Text>
                  {item.nickname && (
                    <Text style={[styles.plantSpecies, { color: colors.textMuted }]}>
                      {item.speciesName}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ============================================================================
// Instructions Card Component
// ============================================================================

function InstructionsCard() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const tips = [
    t('lightMeter.instructions.point'),
    t('lightMeter.instructions.steady'),
    t('lightMeter.instructions.multiple'),
  ];

  return (
    <View style={[styles.instructionsCard, { backgroundColor: colors.surfaceGlass, borderColor: colors.border }]}>
      <View style={styles.instructionsHeader}>
        <Ionicons name="information-circle-outline" size={18} color={colors.tint} />
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>
          {t('lightMeter.instructions.title')}
        </Text>
      </View>
      {tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <View style={[styles.tipDot, { backgroundColor: colors.tint }]} />
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
        </View>
      ))}
      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        {t('lightMeter.disclaimer')}
      </Text>
    </View>
  );
}

// ============================================================================
// Main Screen
// ============================================================================

export default function LightMeterScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  // Platform-specific state
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Android: native sensor hook
  const androidSensor = useLightSensor();

  // iOS: camera estimator hook
  const cameraEstimator = useCameraLightEstimator();

  // Unified lux & category (from whichever platform hook is active)
  const lux = IS_ANDROID ? androidSensor.lux : cameraEstimator.lux;
  const category: LightCategory | null = IS_ANDROID
    ? (androidSensor.category !== 'unknown' ? androidSensor.category : null)
    : cameraEstimator.category;

  // Accuracy label
  const accuracy: 'high' | 'estimate' = IS_ANDROID ? 'high' : 'estimate';

  // Loading state
  const isLoading = IS_ANDROID
    ? androidSensor.status === 'checking'
    : cameraEstimator.status === 'initializing' || cameraEstimator.status === 'requesting_permission';

  // Local lux state for iOS (CameraPreview calls our handleFrame callback directly)
  const [iosLux, setIosLux] = useState<number | null>(null);
  const [iosCategory, setIosCategory] = useState<LightCategory | null>(null);

  const handleFrame = useCallback((reading: LuxReading) => {
    setIosLux(reading.value);
    setIosCategory(getLightCategory(reading.value));
  }, []);

  // Final lux/category: use local iOS state when on iOS
  const displayLux = IS_ANDROID ? lux : iosLux;
  const displayCategory: LightCategory | null = IS_ANDROID ? category : iosCategory;

  // ============================================================================
  // Controls
  // ============================================================================

  const handleMeasure = useCallback(async () => {
    if (IS_ANDROID) {
      if (!androidSensor.isAvailable) {
        Alert.alert(
          'Sensor Unavailable',
          'No ambient light sensor found on this device. Try using camera estimation instead.',
        );
        return;
      }
      setIsMeasuring(true);
      androidSensor.start();
    } else {
      setIsMeasuring(true);
      setIosLux(null);
      setIosCategory(null);
      await cameraEstimator.start();
    }
  }, [androidSensor, cameraEstimator]);

  const handleStop = useCallback(() => {
    if (IS_ANDROID) {
      androidSensor.stop();
    } else {
      cameraEstimator.stop();
      setIosLux(null);
      setIosCategory(null);
    }
    setIsMeasuring(false);
  }, [androidSensor, cameraEstimator]);

  const handleTimeout = useCallback(() => {
    setIsMeasuring(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!displayLux) return;
    setShowSaveModal(true);
  }, [displayLux]);

  const handleSaveMeasurement = useCallback((measurement: SavedMeasurement) => {
    // Save measurement to plant — use updatePlant to add to location data
    const { updatePlant } = usePlantsStore.getState();
    updatePlant(measurement.plantId, {
      // Store as a custom note in the location field for now
      location: `${measurement.lux} lux (${measurement.category}) — ${new Date(measurement.timestamp).toLocaleDateString()}`,
    });
    setShowSaveModal(false);
    Alert.alert('Saved', `Measurement saved to plant.`);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  // iOS camera is active during measurement
  const isCameraActive = !IS_ANDROID && isMeasuring && cameraEstimator.status === 'active';

  // Android sensor unavailable message
  const isAndroidSensorUnavailable = IS_ANDROID && androidSensor.status === 'unavailable';

  return (
    <>
      <Stack.Screen
        options={{
          title: t('lightMeter.title'),
          headerStyle: { backgroundColor: colors.surfaceGlass },
          headerTintColor: colors.text,
        }}
      />
      <View style={styles.screenShell}>
        <AtmosphericBackdrop />

        {/* iOS camera preview — shown when active */}
        {!IS_ANDROID && isCameraActive && (
          <View style={styles.cameraContainer}>
            <CameraPreview
              isActive={isCameraActive}
              onFrameProcessed={handleFrame}
              onTimeout={handleTimeout}
              style={styles.camera}
            />
            {/* Stop button overlay */}
            <TouchableOpacity
              style={[styles.cameraStopButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              onPress={handleStop}
            >
              <Ionicons name="stop-circle" size={20} color="#fff" />
              <Text style={styles.cameraStopText}>{t('lightMeter.stop')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Android unavailable notice */}
          {isAndroidSensorUnavailable && (
            <View style={[styles.unavailableCard, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <Ionicons name="warning-outline" size={20} color={colors.warning} />
              <Text style={[styles.unavailableText, { color: colors.textSecondary }]}>
                No ambient light sensor found on this device.
              </Text>
            </View>
          )}

          {/* Main gauge */}
          <LightMeterGauge
            lux={displayLux}
            category={displayCategory}
            accuracy={accuracy}
            isLoading={isLoading}
            isMeasuring={isMeasuring}
            onMeasure={handleMeasure}
            onStop={handleStop}
            onSave={handleSave}
          />

          {/* Android: sensor indicator when active */}
          {IS_ANDROID && isMeasuring && androidSensor.status === 'active' && (
            <View style={[styles.sensorActiveCard, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '44' }]}>
              <Ionicons name="radio-outline" size={16} color={colors.tint} />
              <Text style={[styles.sensorActiveText, { color: colors.tint }]}>
                {t('lightMeter.measuring')}
              </Text>
            </View>
          )}

          {/* Timed out notice (iOS) */}
          {!IS_ANDROID && cameraEstimator.status === 'timed_out' && (
            <View style={[styles.timedOutCard, { backgroundColor: colors.textMuted + '18', borderColor: colors.border }]}>
              <Ionicons name="timer-outline" size={16} color={colors.textMuted} />
              <Text style={[styles.timedOutText, { color: colors.textSecondary }]}>
                Auto-stopped after 30 seconds. Tap Start to measure again.
              </Text>
            </View>
          )}

          {/* Instructions */}
          <InstructionsCard />

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      {/* Save modal */}
      {showSaveModal && displayLux !== null && (
        <SaveModal
          visible={showSaveModal}
          lux={displayLux}
          category={displayCategory}
          onSave={handleSaveMeasurement}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  screenShell: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 12,
  },

  // Camera
  cameraContainer: {
    height: 240,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  cameraStopButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cameraStopText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Status cards
  unavailableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  unavailableText: {
    fontSize: 13,
    flex: 1,
  },
  sensorActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  sensorActiveText: {
    fontSize: 13,
    fontWeight: '500',
  },
  timedOutCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  timedOutText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },

  // Instructions
  instructionsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 6,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  disclaimer: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 15,
  },

  // Save modal
  modalSafe: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  measurementSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryCategory: {
    fontSize: 14,
  },
  emptyPlants: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyPlantsText: {
    fontSize: 15,
    textAlign: 'center',
  },
  plantList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  plantIconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plantInfo: {
    flex: 1,
  },
  plantName: {
    fontSize: 15,
    fontWeight: '600',
  },
  plantSpecies: {
    fontSize: 12,
    marginTop: 1,
  },

  bottomSpacer: {
    height: 40,
  },
});
