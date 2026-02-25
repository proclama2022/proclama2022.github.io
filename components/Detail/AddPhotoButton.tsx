import React, { useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

import { PlantPhoto } from '@/types';
import { usePlantsStore } from '@/stores/plantsStore';

// ---------------------------------------------------------------------------
// AddPhotoButton
// ---------------------------------------------------------------------------

interface AddPhotoButtonProps {
  plantId: string;
  onPhotoAdded?: () => void;
  size?: number;
}

export function AddPhotoButton({ plantId, onPhotoAdded, size = 110 }: AddPhotoButtonProps) {
  const { t } = useTranslation();
  const updatePlant = usePlantsStore((s) => s.updatePlant);
  const getPlant = usePlantsStore((s) => s.getPlant);

  const handleAddPhoto = useCallback(async () => {
    Alert.alert(
      t('detail.gallery.addPhotoTitle') || 'Add Photo',
      t('detail.gallery.addPhotoMessage') || 'Choose a photo source',
      [
        {
          text: t('common.cancel') || 'Cancel',
          style: 'cancel',
        },
        {
          text: t('detail.gallery.camera') || 'Camera',
          onPress: launchCamera,
        },
        {
          text: t('detail.gallery.gallery') || 'Gallery',
          onPress: launchGallery,
        },
      ]
    );
  }, [t]);

  const processAndSavePhoto = useCallback(async (sourceUri: string) => {
    try {
      // COMPRESS IMAGE (PHOTO-07 requirement)
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: 1024 } }], // Only specify width, height calculated automatically
        {
          compress: 0.7, // JPEG quality as per PHOTO-07
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Copy compressed result to document directory for persistence
      const filename = `plant_${plantId}_${Date.now()}.jpg`;
      const destUri = FileSystem.documentDirectory + filename;

      await FileSystem.copyAsync({
        from: manipulatedImage.uri,
        to: destUri,
      });

      // Create new PlantPhoto object
      const newPhoto: PlantPhoto = {
        uri: destUri,
        addedDate: new Date().toISOString(),
        isPrimary: true,
      };

      // Fetch current plant data
      const plant = getPlant(plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      // Mark all existing photos as non-primary
      const existingPhotos = plant.photos || [];
      const updatedPhotos = existingPhotos.map((photo) => ({
        ...photo,
        isPrimary: false,
      }));

      // Append new photo as primary
      updatedPhotos.push(newPhoto);

      // Update plant in store
      updatePlant(plantId, { photos: updatedPhotos });

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Callback
      onPhotoAdded?.();
    } catch (error) {
      console.error('[AddPhotoButton] Failed to process photo:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('detail.gallery.addPhotoError') || 'Failed to add photo. Please try again.'
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [plantId, getPlant, updatePlant, onPhotoAdded, t]);

  const launchCamera = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await processAndSavePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[AddPhotoButton] Camera error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('detail.gallery.cameraError') || 'Failed to access camera.'
      );
    }
  }, [processAndSavePhoto, t]);

  const launchGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await processAndSavePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('[AddPhotoButton] Gallery error:', error);
      Alert.alert(
        t('common.error') || 'Error',
        t('detail.gallery.galleryError') || 'Failed to access gallery.'
      );
    }
  }, [processAndSavePhoto, t]);

  return (
    <TouchableOpacity
      onPress={handleAddPhoto}
      style={[styles.button, { width: size, height: size }]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Add photo"
    >
      <Ionicons name="add" size={32} color="#999" />
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fafafa',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
  } as ViewStyle,
});
