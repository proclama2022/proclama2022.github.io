import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { CareInfo } from '@/components/Detail/CareInfo';
import { MarkWateredButton } from '@/components/Detail/MarkWateredButton';
import { WateringHistory } from '@/components/Detail/WateringHistory';
import { ComplianceBar } from '@/components/Detail/ComplianceBar';
import { usePlantsStore } from '@/stores/plantsStore';
import { getCareInfo } from '@/services/careDB';
import { scheduleDailyDigest } from '@/services/notificationService';

// ---------------------------------------------------------------------------
// Plant Detail Screen
// ---------------------------------------------------------------------------

export default function PlantDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));
  const removePlant = usePlantsStore((s) => s.removePlant);
  const updatePlant = usePlantsStore((s) => s.updatePlant);

  // Local editable state — sync on blur
  const [notes, setNotes] = useState(plant?.notes ?? '');
  const [nickname, setNickname] = useState(plant?.nickname ?? '');
  const [location, setLocation] = useState(plant?.location ?? '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ------------------------------------------------------------------
  // Not found guard
  // ------------------------------------------------------------------

  if (!plant) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Ionicons name="leaf-outline" size={64} color="#aaa" />
        <Text style={styles.errorTitle}>{t('common.error')}</Text>
        <Text style={styles.errorBody}>Plant not found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          accessibilityRole="button"
        >
          <Text style={styles.backButtonText}>{t('common.cancel')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------------------------
  // Care info
  // ------------------------------------------------------------------

  const scientificName = plant.scientificName ?? plant.species ?? '';
  const care = getCareInfo(scientificName);

  // ------------------------------------------------------------------
  // Persistence helpers — save on blur
  // ------------------------------------------------------------------

  const saveNotes = useCallback(() => {
    if (notes !== (plant.notes ?? '')) {
      updatePlant(plant.id, { notes });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [notes, plant.id, plant.notes, updatePlant]);

  const saveNickname = useCallback(() => {
    if (nickname !== (plant.nickname ?? '')) {
      updatePlant(plant.id, { nickname });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [nickname, plant.id, plant.nickname, updatePlant]);

  const saveLocation = useCallback(() => {
    if (location !== (plant.location ?? '')) {
      updatePlant(plant.id, { location });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [location, plant.id, plant.location, updatePlant]);

  // ------------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------------

  const handleDeleteConfirm = useCallback(async () => {
    setShowDeleteModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await removePlant(plant.id);
    router.back();
  }, [plant.id, removePlant, router]);

  // ------------------------------------------------------------------
  // Derived display data
  // ------------------------------------------------------------------

  const displayName = plant.nickname || plant.commonName || plant.species;
  const formattedDate = new Date(plant.addedDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName}
        </Text>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => setShowDeleteModal(true)}
          accessibilityRole="button"
          accessibilityLabel="Delete plant"
        >
          <Ionicons name="trash-outline" size={22} color="#c62828" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero photo */}
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: plant.photo }}
              style={styles.photo}
              resizeMode="cover"
              accessibilityLabel={`Photo of ${displayName}`}
            />
          </View>

          {/* Names block */}
          <View style={styles.card}>
            <Text style={styles.primaryName}>{displayName}</Text>
            {plant.scientificName ? (
              <Text style={styles.scientificName}>{plant.scientificName}</Text>
            ) : null}
            {plant.commonName && plant.commonName !== displayName ? (
              <Text style={styles.commonName}>{plant.commonName}</Text>
            ) : null}
            <Text style={styles.addedDate}>{t('detail.addedOn', { date: formattedDate })}</Text>
          </View>

          {/* Editable fields */}
          <View style={styles.card}>
            {/* Nickname */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldHeader}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.fieldLabel}>{t('detail.nickname')}</Text>
                <Ionicons name="pencil" size={12} color="#bbb" style={styles.editIcon} />
              </View>
              <TextInput
                style={styles.textInput}
                value={nickname}
                onChangeText={setNickname}
                onBlur={saveNickname}
                placeholder={t('detail.nickname')}
                placeholderTextColor="#bbb"
                returnKeyType="done"
                accessibilityLabel="Nickname"
              />
            </View>

            {/* Location */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldHeader}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.fieldLabel}>{t('detail.location')}</Text>
                <Ionicons name="pencil" size={12} color="#bbb" style={styles.editIcon} />
              </View>
              <TextInput
                style={styles.textInput}
                value={location}
                onChangeText={setLocation}
                onBlur={saveLocation}
                placeholder={t('detail.location')}
                placeholderTextColor="#bbb"
                returnKeyType="done"
                accessibilityLabel="Location"
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldBlock}>
              <View style={styles.fieldHeader}>
                <Ionicons name="document-text-outline" size={16} color="#666" />
                <Text style={styles.fieldLabel}>{t('detail.notes')}</Text>
                <Ionicons name="pencil" size={12} color="#bbb" style={styles.editIcon} />
              </View>
              <TextInput
                style={[styles.textInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                onBlur={saveNotes}
                placeholder={t('detail.notes')}
                placeholderTextColor="#bbb"
                multiline
                textAlignVertical="top"
                returnKeyType="default"
                accessibilityLabel="Notes"
              />
            </View>
          </View>

          {/* Mark Watered button */}
          <MarkWateredButton plant={plant} />

          {/* Care info section */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Ionicons name="leaf" size={18} color="#2e7d32" />
              <Text style={styles.sectionTitle}>
                {care ? 'Care Guide' : 'Care Info'}
              </Text>
            </View>
            <CareInfo care={care} />
          </View>

          {/* Watering compliance */}
          <ComplianceBar plant={plant} />

          {/* Watering history */}
          <View style={styles.card}>
            <WateringHistory plant={plant} />
          </View>

          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => setShowDeleteModal(true)}
            accessibilityRole="button"
            accessibilityLabel="Delete plant"
          >
            <Ionicons name="trash-outline" size={18} color="#c62828" />
            <Text style={styles.deleteButtonText}>{t('common.delete')} Plant</Text>
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Delete confirmation modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
        accessibilityViewIsModal
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons name="warning-outline" size={40} color="#c62828" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>
              {t('common.delete')} {displayName}?
            </Text>
            <Text style={styles.modalBody}>
              This will permanently remove the plant from your collection.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowDeleteModal(false)}
                accessibilityRole="button"
              >
                <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalDeleteButton}
                onPress={handleDeleteConfirm}
                accessibilityRole="button"
              >
                <Text style={styles.modalDeleteText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Error state
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  errorBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#2e7d32',
    borderRadius: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1a1a1a',
    paddingHorizontal: 4,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Photo
  photoContainer: {
    width: '100%',
    height: 280,
    backgroundColor: '#e0e0e0',
  },
  photo: {
    width: '100%',
    height: '100%',
  },

  // Cards
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // Names
  primaryName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#555',
    marginBottom: 2,
  },
  commonName: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 6,
  },

  // Editable fields
  fieldBlock: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  editIcon: {
    marginLeft: 'auto',
  },
  textInput: {
    fontSize: 14,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#fafafa',
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 10,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Delete button
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#c62828',
    gap: 8,
    backgroundColor: '#fff',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#c62828',
  },

  bottomPad: {
    height: 16,
  },

  // Delete modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  modalDeleteButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: '#c62828',
    alignItems: 'center',
  },
  modalDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
