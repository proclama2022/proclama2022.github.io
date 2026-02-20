import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { SavedPlant } from '@/types';
import { usePlantsStore } from '@/stores/plantsStore';
import { markAsWatered, getNextWateringDate } from '@/services/wateringService';
import { schedulePlantNotification } from '@/services/notificationService';
import { cancelPlantNotification } from '@/services/notificationService';
import { Toast, ToastProps } from '@/components/Toast';
import { Text } from '@/components/Themed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkWateredButtonProps {
  plant: SavedPlant;
}

// ---------------------------------------------------------------------------
// MarkWateredButton Component
// ---------------------------------------------------------------------------

export function MarkWateredButton({ plant }: MarkWateredButtonProps) {
  const { t } = useTranslation();
  const updatePlant = usePlantsStore((state) => state.updatePlant);

  const [toast, setToast] = useState<Omit<ToastProps, 'onDismiss'>>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [lastWaterEvent, setLastWaterEvent] = useState<{ date: string; notes?: string } | null>(null);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  const handleMarkWatered = useCallback(async () => {
    try {
      // Trigger haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Mark as watered
      const waterEvent = await markAsWatered(plant.id);

      // Calculate next watering date
      const nextDate = getNextWateringDate(plant.id);

      let notificationId: string | undefined;
      if (nextDate) {
        // Get plant name for notification
        const plantName = plant.nickname || plant.commonName || plant.scientificName || plant.species;

        // Schedule notification
        notificationId = await schedulePlantNotification(plant.id, plantName, nextDate);

        // Update plant with next watering date and notification ID
        updatePlant(plant.id, {
          nextWateringDate: nextDate.toISOString(),
          scheduledNotificationId: notificationId,
        });
      }

      // Store water event and notification ID for undo
      setLastWaterEvent(waterEvent);
      setLastNotificationId(notificationId || null);

      // Show toast with undo option
      setToast({
        visible: true,
        message: t('watering.markedAsWatered'),
        type: 'success',
        undoAction: handleUndo,
      });
    } catch (error) {
      console.error('Error marking as watered:', error);
      Alert.alert(t('common.error'), t('errors.apiError'));
    }
  }, [plant.id, plant.nickname, plant.commonName, plant.scientificName, plant.species, updatePlant, t]);

  const handleUndo = useCallback(() => {
    if (!lastWaterEvent) return;

    // Remove last water event from history
    const updatedHistory = plant.waterHistory.filter((event) => event.date !== lastWaterEvent.date);

    // Cancel scheduled notification if exists
    if (lastNotificationId) {
      cancelPlantNotification(lastNotificationId).catch(() => {
        // Ignore cancellation errors
      });
    }

    // Update plant without the last water event
    updatePlant(plant.id, {
      waterHistory: updatedHistory,
      lastWatered: updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1].date : undefined,
      scheduledNotificationId: undefined,
    });

    setLastWaterEvent(null);
    setLastNotificationId(null);
  }, [lastWaterEvent, lastNotificationId, plant.waterHistory, plant.id, updatePlant]);

  const handleToastDismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false, undoAction: undefined }));
    setLastWaterEvent(null);
    setLastNotificationId(null);
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handleMarkWatered}
        activeOpacity={0.8}
      >
        <Ionicons name="water" size={20} color="white" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.buttonText}>{t('watering.markWatered')}</Text>
        </View>
      </TouchableOpacity>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        undoAction={toast.undoAction}
        onDismiss={handleToastDismiss}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  icon: {
    marginRight: 8,
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
