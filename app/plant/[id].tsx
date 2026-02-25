import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { NavigationIndependentTree, NavigationContainer } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { Text } from '@/components/Themed';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { usePlantsStore } from '@/stores/plantsStore';
import { InfoTab } from '@/components/Detail/InfoTab';
import { HistoryTab } from '@/components/Detail/HistoryTab';
import { CareTab } from '@/components/Detail/CareTab';
import { NotesTab } from '@/components/Detail/NotesTab';

// ---------------------------------------------------------------------------
// Tab navigator
// ---------------------------------------------------------------------------

const Tab = createMaterialTopTabNavigator();

// ---------------------------------------------------------------------------
// Plant Detail Screen
// ---------------------------------------------------------------------------

export default function PlantDetailScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));
  const removePlant = usePlantsStore((s) => s.removePlant);

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

  // Get primary photo from photos array, or fall back to deprecated photo field
  const primaryPhotoUri = plant.photos?.find(p => p.isPrimary)?.uri || plant.photo;

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation header */}
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

        {/* Compact plant header — thumbnail + name + scientific name */}
        <View style={styles.compactHeader}>
          <Image
            source={{ uri: primaryPhotoUri }}
            style={styles.thumbnail}
            resizeMode="cover"
            accessibilityLabel={`Thumbnail of ${displayName}`}
          />
          <View style={styles.compactInfo}>
            <Text style={styles.compactName} numberOfLines={1}>{displayName}</Text>
            {plant.scientificName ? (
              <Text style={styles.compactScientific} numberOfLines={1}>
                {plant.scientificName}
              </Text>
            ) : null}
            {plant.species && plant.species !== plant.scientificName ? (
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {plant.species}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tab navigator */}
        <NavigationIndependentTree>
          <NavigationContainer>
            <Tab.Navigator
              initialRouteName="Info"
              screenOptions={{
                tabBarActiveTintColor: '#2e7d32',
                tabBarInactiveTintColor: '#888',
                tabBarIndicatorStyle: { backgroundColor: '#2e7d32', height: 2 },
                tabBarStyle: {
                  backgroundColor: '#fff',
                  shadowOpacity: 0,
                  elevation: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                },
                tabBarLabelStyle: {
                  fontSize: 13,
                  fontWeight: '600',
                  textTransform: 'none',
                },
                lazy: true,
                swipeEnabled: true,
              }}
            >
              <Tab.Screen
                name="Info"
                component={InfoTab}
                options={{ title: t('detail.tabs.info') }}
                initialParams={{ plantId: plant.id }}
              />
              <Tab.Screen
                name="Care"
                component={CareTab}
                options={{ title: t('detail.tabs.care') }}
                initialParams={{ plantId: plant.id }}
              />
              <Tab.Screen
                name="History"
                component={HistoryTab}
                options={{ title: t('detail.tabs.history') }}
              />
              <Tab.Screen
                name="Notes"
                component={NotesTab}
                options={{ title: t('detail.tabs.notes') }}
                initialParams={{ plantId: plant.id }}
              />
            </Tab.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>

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
      <BannerAdWrapper />
    </>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
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

  // Navigation header
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

  // Compact plant header
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    flexShrink: 0,
  },
  compactInfo: {
    flex: 1,
    gap: 2,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  compactScientific: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#666',
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  confidenceText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '600',
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
