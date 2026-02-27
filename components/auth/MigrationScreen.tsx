/**
 * Migration Screen Component
 *
 * Full-screen modal that shows plant migration progress after user signs up.
 * Displays plant preview, progress bar, current plant name, and sync/skip/cancel buttons.
 *
 * Features:
 * - Plant thumbnail grid preview (first 4 plants)
 * - Progress bar with percentage (iOS ProgressView or custom View for Android)
 * - Current plant name during migration
 * - Sync Now button (starts migration)
 * - Skip button (dismiss for now, can retry later from Settings)
 * - Cancel button (stops migration mid-process, keeps partial sync)
 * - Error message display
 *
 * Data synced:
 * - Plants (species, names, metadata)
 * - Photos (compressed before upload)
 * - Watering history
 *
 * Data NOT synced:
 * - Reminders (device-specific notification IDs)
 *
 * Usage:
 *   const [migrationVisible, setMigrationVisible] = useState(false);
 *   <MigrationScreen
 *     visible={migrationVisible}
 *     onComplete={() => setMigrationVisible(false)}
 *     onSkip={() => setMigrationVisible(false)}
 *   />
 *
 * @module components/auth/MigrationScreen
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { usePlantsStore } from '@/stores/plantsStore';
import {
  migratePlantsToSupabase,
  setMigrationFlag,
  MigrationProgress,
} from '@/services/migrationService';
import type { SavedPlant } from '@/types';

// ============================================================================
// Props
// ============================================================================

/**
 * Migration screen props
 */
export interface MigrationScreenProps {
  /** Modal visibility state */
  visible: boolean;
  /** Called when migration completes successfully */
  onComplete: () => void;
  /** Called when user skips or cancels migration */
  onSkip: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Full-screen migration progress modal
 *
 * Shows plant preview, syncs local plants to Supabase with progress tracking.
 * Modal covers full screen with centered content.
 */
export const MigrationScreen: React.FC<MigrationScreenProps> = ({
  visible,
  onComplete,
  onSkip,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get local plants from store
  const plants = usePlantsStore((state) => state.plants);

  // State
  const [progress, setProgress] = useState<MigrationProgress>({
    total: 0,
    completed: 0,
    currentPlantName: '',
    isCancelled: false,
    failed: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cancellation signal (ref to avoid closure issues)
  const signalRef = useRef({ cancelled: false });

  /**
   * Start migration process
   *
   * Gets plants from store, calls migration service, updates progress.
   * Sets migration flag on completion.
   */
  const handleMigrate = async () => {
    if (plants.length === 0) {
      setError('No plants to sync');
      return;
    }

    setIsRunning(true);
    setError(null);
    signalRef.current.cancelled = false;

    try {
      const result = await migratePlantsToSupabase(
        plants,
        (progressUpdate) => {
          setProgress(progressUpdate);
        },
        signalRef.current
      );

      if (result.cancelled) {
        // User cancelled - partial migration kept
        onSkip();
        return;
      }

      // Migration completed
      await setMigrationFlag(result.success);

      if (result.failed > 0) {
        setError(`${result.failed} of ${plants.length} plants failed to sync. You can retry from Settings.`);
      } else {
        // Success!
        onComplete();
      }
    } catch (err) {
      console.error('Migration failed:', err);
      setError('Unable to sync plants. Please check your connection and try again.');
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Cancel migration mid-process
   *
   * Sets cancellation flag to stop upload loop.
   * Partial migration is kept (not rolled back).
   */
  const handleCancel = () => {
    signalRef.current.cancelled = true;
    onSkip();
  };

  /**
   * Reset state when modal opens/closes
   */
  useEffect(() => {
    if (!visible) {
      // Reset state when modal closes
      setProgress({
        total: 0,
        completed: 0,
        currentPlantName: '',
        isCancelled: false,
        failed: 0,
      });
      setIsRunning(false);
      setError(null);
      signalRef.current.cancelled = false;
    }
  }, [visible]);

  // Plant preview (first 4 plants as thumbnails)
  const previewPlants = plants.slice(0, 4);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={isRunning ? handleCancel : onSkip}
    >
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={isRunning ? handleCancel : onSkip}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              disabled={isRunning}
            >
              <Ionicons
                name="close"
                size={28}
                color={isRunning ? colors.textMuted : colors.text}
              />
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Ionicons name="cloud-upload-outline" size={48} color={colors.tint} />
            <Text style={[styles.title, { color: colors.text }]}>
              Sync Your Plants
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We found {plants.length} plant{plants.length !== 1 ? 's' : ''} on your device. Sync them to your account?
            </Text>
          </View>

          {/* Plant preview grid */}
          {previewPlants.length > 0 && (
            <View style={styles.previewGrid}>
              {previewPlants.map((plant) => (
                <View
                  key={plant.id}
                  style={[styles.previewCard, { backgroundColor: colors.surface }]}
                >
                  {/* Plant photo thumbnail */}
                  <View style={[styles.previewThumbnail, { backgroundColor: colors.chipBg }]}>
                    {plant.photos && plant.photos.length > 0 ? (
                      <View style={styles.previewPhotoIcon}>
                        <Ionicons name="image" size={24} color={colors.textSecondary} />
                      </View>
                    ) : plant.photo ? (
                      <View style={styles.previewPhotoIcon}>
                        <Ionicons name="image" size={24} color={colors.textSecondary} />
                      </View>
                    ) : (
                      <Ionicons name="leaf" size={24} color={colors.textMuted} />
                    )}
                  </View>
                  {/* Plant name */}
                  <Text
                    style={[styles.previewName, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {plant.nickname || plant.commonName || plant.species}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Progress section */}
          {isRunning && (
            <View style={[styles.progressSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                Syncing {progress.completed} of {progress.total}...
              </Text>

              {/* Current plant name */}
              {progress.currentPlantName && (
                <Text style={[styles.currentPlantText, { color: colors.textSecondary }]}>
                  {progress.currentPlantName}
                </Text>
              )}

              {/* Progress bar */}
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: colors.tint,
                      width: `${(progress.completed / progress.total) * 100}%`,
                    },
                  ]}
                />
              </View>

              {/* Progress percentage */}
              <Text style={[styles.progressPercent, { color: colors.textMuted }]}>
                {Math.round((progress.completed / progress.total) * 100)}%
              </Text>
            </View>
          )}

          {/* Error message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="alert-circle" size={20} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          {/* Info note */}
          <View style={[styles.infoNote, { backgroundColor: colors.chipBg }]}>
            <Ionicons name="information-circle" size={18} color={colors.textMuted} />
            <Text style={[styles.infoNoteText, { color: colors.textSecondary }]}>
              Your plants and photos will be synced to the cloud. Watering reminders will remain on this device only.
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {!isRunning ? (
              <>
                {/* Sync Now button */}
                <TouchableOpacity
                  style={[styles.syncButton, { backgroundColor: colors.tint }]}
                  onPress={handleMigrate}
                  activeOpacity={0.8}
                >
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </TouchableOpacity>

                {/* Skip button */}
                <TouchableOpacity
                  style={[styles.skipButton, { backgroundColor: colors.chipBg }]}
                  onPress={onSkip}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
                    Skip for Now
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Cancel button (only show while running) */}
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.chipBg }]}
                  onPress={handleCancel}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle" size={20} color={colors.danger} />
                  <Text style={[styles.cancelButtonText, { color: colors.danger }]}>
                    Cancel Sync
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Footer note */}
          <Text style={[styles.footerNote, { color: colors.textMuted }]}>
            You can sync your plants later from Settings
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  previewCard: {
    width: 80,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  previewThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  previewPhotoIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  progressSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  currentPlantText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  syncButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  skipButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footerNote: {
    fontSize: 13,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
