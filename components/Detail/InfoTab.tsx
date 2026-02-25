import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { usePlantsStore } from '@/stores/plantsStore';
import { PhotoGallery } from './PhotoGallery';

// ---------------------------------------------------------------------------
// InfoTab
// ---------------------------------------------------------------------------

interface InfoTabProps {
  plantId?: string;
}

export function InfoTab({ plantId: plantIdProp }: InfoTabProps) {
  const { t } = useTranslation();

  // Try expo-router params first; fall back to prop
  const params = useLocalSearchParams<{ id: string }>();
  const resolvedId = params.id ?? plantIdProp ?? '';

  const plant = usePlantsStore((s) => s.getPlant(resolvedId));
  const updatePlant = usePlantsStore((s) => s.updatePlant);

  const [nickname, setNickname] = useState(plant?.nickname ?? '');
  const [location, setLocation] = useState(plant?.location ?? '');

  // ------------------------------------------------------------------
  // Persistence helpers — save on blur
  // ------------------------------------------------------------------

  const saveNickname = useCallback(() => {
    if (!plant) return;
    if (nickname !== (plant.nickname ?? '')) {
      updatePlant(plant.id, { nickname });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [nickname, plant, updatePlant]);

  const saveLocation = useCallback(() => {
    if (!plant) return;
    if (location !== (plant.location ?? '')) {
      updatePlant(plant.id, { location });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [location, plant, updatePlant]);

  // ------------------------------------------------------------------
  // Not found guard
  // ------------------------------------------------------------------

  if (!plant) {
    return (
      <View style={styles.centered}>
        <Ionicons name="leaf-outline" size={32} color="#aaa" />
        <Text style={styles.notFoundText}>Plant not found.</Text>
      </View>
    );
  }

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

        {/* Photo gallery */}
        <PhotoGallery plantId={resolvedId} />

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
          <View style={[styles.fieldBlock, styles.fieldBlockLast]}>
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
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  notFoundText: {
    fontSize: 14,
    color: '#888',
  },

  scroll: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 32,
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
  fieldBlockLast: {
    marginBottom: 0,
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

  bottomPad: {
    height: 16,
  },
});
