import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';

import { Text } from '@/components/Themed';
import { PlantPhoto } from '@/types';
import { usePlantsStore } from '@/stores/plantsStore';

// ---------------------------------------------------------------------------
// PhotoLightbox
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface PhotoLightboxProps {
  visible: boolean;
  photos: PlantPhoto[];
  initialIndex: number;
  plantId: string;
  onClose: () => void;
}

export function PhotoLightbox({
  visible,
  photos,
  initialIndex,
  plantId,
  onClose,
}: PhotoLightboxProps) {
  const { t } = useTranslation();
  const updatePlant = usePlantsStore((s) => s.updatePlant);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const scrollViewRef = useRef<ScrollView>(null);

  // ------------------------------------------------------------------
  // Scroll to initial index on open
  // ------------------------------------------------------------------

  useEffect(() => {
    if (visible && scrollViewRef.current) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: initialIndex * SCREEN_WIDTH,
          animated: false,
        });
        setCurrentIndex(initialIndex);
      }, 50);
    }
  }, [visible, initialIndex]);

  // ------------------------------------------------------------------
  // Scroll handler for swipe navigation
  // ------------------------------------------------------------------

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  // ------------------------------------------------------------------
  // Action handlers
  // ------------------------------------------------------------------

  const handleSetPrimary = async (index: number) => {
    const updatedPhotos = photos.map((photo, i) => ({
      ...photo,
      isPrimary: i === index,
    }));

    updatePlant(plantId, { photos: updatedPhotos });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (index: number) => {
    if (photos.length === 1) {
      Alert.alert(
        t('detail.gallery.deleteTitle') || 'Delete Photo?',
        t('detail.gallery.deleteOnlyPhotoWarning') || 'This is the only photo. Deleting it will leave your plant without a photo.',
        [
          { text: t('common.cancel') || 'Cancel', style: 'cancel' },
          {
            text: t('common.delete') || 'Delete',
            style: 'destructive',
            onPress: async () => {
              const photoToDelete = photos[index];
              try {
                // Delete file from filesystem
                await FileSystem.deleteAsync(photoToDelete.uri, { idempotent: true });
              } catch (err) {
                console.warn('[PhotoLightbox] Failed to delete file:', err);
              }

              // Update plant with empty photos array
              updatePlant(plantId, { photos: [] });
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onClose();
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      t('detail.gallery.deleteTitle') || 'Delete Photo?',
      t('detail.gallery.deleteMessage') || 'Are you sure you want to delete this photo?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            const photoToDelete = photos[index];
            const wasPrimary = photoToDelete.isPrimary;

            try {
              // Delete file from filesystem
              await FileSystem.deleteAsync(photoToDelete.uri, { idempotent: true });
            } catch (err) {
              console.warn('[PhotoLightbox] Failed to delete file:', err);
            }

            // Filter out deleted photo
            let updatedPhotos = photos.filter((_, i) => i !== index);

            // If deleted was primary, set first remaining as primary
            if (wasPrimary && updatedPhotos.length > 0) {
              updatedPhotos = updatedPhotos.map((photo, i) => ({
                ...photo,
                isPrimary: i === 0,
              }));
            }

            updatePlant(plantId, { photos: updatedPhotos });
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

            // Close if no photos left
            if (updatedPhotos.length === 0) {
              onClose();
            }
          },
        },
      ]
    );
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const renderPhoto = (photo: PlantPhoto, index: number) => (
    <View key={`${photo.uri}-${index}`} style={styles.photoPage}>
      <Image
        source={{ uri: photo.uri }}
        style={styles.photo}
        resizeMode="contain"
      />
    </View>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (photos.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      accessibilityViewIsModal
    >
      {/* Black background overlay */}
      <View style={styles.overlay}>
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close lightbox"
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Scrollable photo viewer */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {photos.map((photo, index) => renderPhoto(photo, index))}
        </ScrollView>

        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          <Text style={styles.pageIndicatorText}>
            {currentIndex + 1} / {photos.length}
          </Text>
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetPrimary(currentIndex)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Set as primary photo"
          >
            <Ionicons name="star" size={20} color="#2e7d32" />
            <Text style={styles.actionButtonText}>
              {t('detail.gallery.setPrimary') || 'Set Primary'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(currentIndex)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Delete photo"
          >
            <Ionicons name="trash-outline" size={20} color="#c62828" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              {t('common.delete') || 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: SCREEN_WIDTH * 10, // Arbitrary large width to allow scrolling
  },
  photoPage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  pageIndicator: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2e7d32',
  },
  deleteButtonText: {
    color: '#c62828',
  },
});
