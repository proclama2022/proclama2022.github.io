/**
 * Profile Edit Modal
 *
 * Modal for editing user profile display name, bio, and avatar.
 * Uses action sheet for avatar source selection (gallery/camera).
 * Validates character limits and shows loading states.
 *
 * Usage:
 *   <ProfileEditModal
 *     visible={showEditModal}
 *     onClose={() => setShowEditModal(false)}
 *     currentProfile={profile}
 *   />
 *
 * @module components/ProfileEditModal
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';

import { ThemedView } from '@/components/Themed';
import { ThemedText } from '@/components/Themed';
import { Avatar } from '@/components/Avatar';
import { useProfileStore } from '@/stores/profileStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import type { ProfileWithStats } from '@/types/profile';

export interface ProfileEditModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Current profile data */
  currentProfile: ProfileWithStats;
}

/**
 * Profile edit modal component
 *
 * Allows editing display name, bio, and avatar.
 * Shows character counts and validates inputs.
 */
export function ProfileEditModal({
  visible,
  onClose,
  currentProfile,
}: ProfileEditModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const { updateProfile, uploadAvatar, isLoading } = useProfileStore();

  // Form state
  const [displayName, setDisplayName] = useState(currentProfile.display_name);
  const [bio, setBio] = useState(currentProfile.bio || '');
  const [avatarUri, setAvatarUri] = useState(currentProfile.avatar_url);
  const [isUploading, setIsUploading] = useState(false);

  // Reset form when modal opens with current profile data
  useEffect(() => {
    if (visible) {
      setDisplayName(currentProfile.display_name);
      setBio(currentProfile.bio || '');
      setAvatarUri(currentProfile.avatar_url);
    }
  }, [visible, currentProfile]);

  /**
   * Handle avatar upload
   * Shows action sheet for gallery/camera selection
   */
  const handleAvatarPress = async () => {
    const options = [
      t('profile.chooseFromLibrary'),
      t('profile.takePhoto'),
      t('common.cancel'),
    ];

    if (Platform.OS === 'ios') {
      // Use ActionSheetIOS on iOS
      const { ActionSheetIOS } = require('react-native');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
        },
        (buttonIndex: number) => {
          if (buttonIndex === 0) handleImagePick('library');
          if (buttonIndex === 1) handleImagePick('camera');
        }
      );
    } else {
      // Use Alert on Android
      Alert.alert(
        t('profile.changeAvatar'),
        '',
        [
          {
            text: t('profile.chooseFromLibrary'),
            onPress: () => handleImagePick('library'),
          },
          {
            text: t('profile.takePhoto'),
            onPress: () => handleImagePick('camera'),
          },
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  /**
   * Handle image selection from gallery or camera
   */
  const handleImagePick = async (source: 'library' | 'camera') => {
    try {
      setIsUploading(true);

      // Request permissions
      if (source === 'library') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.cameraPermission'));
          setIsUploading(false);
          return;
        }
      } else {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('errors.cameraPermission'));
          setIsUploading(false);
          return;
        }
      }

      // Launch image picker
      const result =
        source === 'library'
          ? await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            })
          : await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.7,
            });

      if (result.canceled) {
        setIsUploading(false);
        return;
      }

      // Upload avatar
      await uploadAvatar(source);

      // Avatar URL is updated in store, but we need to refresh the local state
      // to show the new avatar immediately
      setIsUploading(false);
    } catch (err) {
      setIsUploading(false);
      Alert.alert(t('profile.errors.uploadFailed'));
    }
  };

  /**
   * Handle save button press
   */
  const handleSave = async () => {
    // Validate display name
    if (!displayName.trim()) {
      Alert.alert(t('profile.errors.displayNameRequired'));
      return;
    }

    if (displayName.length > 50) {
      Alert.alert(t('profile.errors.displayNameTooLong'));
      return;
    }

    if (bio.length > 500) {
      Alert.alert(t('profile.errors.bioTooLong'));
      return;
    }

    // Update profile
    await updateProfile({
      display_name: displayName.trim(),
      bio: bio.trim() || null,
    });

    // Close modal on success
    onClose();
  };

  /**
   * Handle cancel button press
   */
  const handleCancel = () => {
    // Discard changes and close
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <ThemedText style={styles.headerTitle}>{t('profile.editProfile')}</ThemedText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ThemedText style={styles.closeButtonText}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <Avatar uri={avatarUri} size={100} />
            {isUploading ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color={colors.tint} />
                <ThemedText style={styles.uploadingText}>
                  {t('common.loading')}
                </ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.changeAvatarButton, { borderColor: colors.border }]}
                onPress={handleAvatarPress}
              >
                <ThemedText style={styles.changeAvatarText}>
                  {t('profile.changeAvatar')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          {/* Display Name Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>{t('profile.displayName')}</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={50}
              placeholder={t('profile.displayName')}
              placeholderTextColor={colors.tabIconDefault}
            />
            <ThemedText style={styles.characterCount}>
              {displayName.length}/50
            </ThemedText>
          </View>

          {/* Bio Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>{t('profile.bio')}</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              maxLength={500}
              placeholder={t('profile.bio')}
              placeholderTextColor={colors.tabIconDefault}
            />
            <ThemedText style={styles.characterCount}>{bio.length}/500</ThemedText>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleCancel}
            disabled={isLoading || isUploading}
          >
            <ThemedText style={styles.cancelButtonText}>{t('common.cancel')}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: colors.tint }]}
            onPress={handleSave}
            disabled={isLoading || isUploading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.saveButtonText}>{t('common.save')}</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  changeAvatarButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeAvatarText: {
    fontSize: 14,
  },
  uploadingContainer: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
