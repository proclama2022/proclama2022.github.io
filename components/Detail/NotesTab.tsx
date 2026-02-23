import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/Themed';
import { usePlantsStore } from '@/stores/plantsStore';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const NOTES_MAX = 1000;
const COUNTER_THRESHOLD = 800;

// ---------------------------------------------------------------------------
// MetadataField — reusable inline label + text input
// ---------------------------------------------------------------------------

interface MetadataFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  placeholder?: string;
}

function MetadataField({ label, value, onChange, onBlur, placeholder }: MetadataFieldProps) {
  return (
    <View style={styles.metadataField}>
      <Text style={styles.metadataLabel}>{label}</Text>
      <TextInput
        style={styles.metadataInput}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor="#bbb"
        returnKeyType="done"
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// NotesTab
// ---------------------------------------------------------------------------

export function NotesTab() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const plant = usePlantsStore((s) => s.getPlant(id ?? ''));
  const updatePlant = usePlantsStore((s) => s.updatePlant);

  // Local state mirrors plant fields
  const [notes, setNotes] = useState(plant?.notes ?? '');
  const [purchaseDate, setPurchaseDate] = useState(plant?.purchaseDate ?? '');
  const [purchasePrice, setPurchasePrice] = useState(plant?.purchasePrice ?? '');
  const [purchaseOrigin, setPurchaseOrigin] = useState(plant?.purchaseOrigin ?? '');
  const [giftFrom, setGiftFrom] = useState(plant?.giftFrom ?? '');
  const [savedVisible, setSavedVisible] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timeout on unmount to prevent setState on unmounted component
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Show "Saved ✓" flash with haptic feedback for 1.5s
  const showSavedFlash = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSavedVisible(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSavedVisible(false), 1500);
  }, []);

  // Save handlers — only persist if value changed
  const handleNotesBlur = useCallback(() => {
    if (notes !== (plant?.notes ?? '')) {
      updatePlant(plant!.id, { notes });
      showSavedFlash();
    }
  }, [notes, plant, updatePlant, showSavedFlash]);

  const handlePurchaseDateBlur = useCallback(() => {
    if (purchaseDate !== (plant?.purchaseDate ?? '')) {
      updatePlant(plant!.id, { purchaseDate });
      showSavedFlash();
    }
  }, [purchaseDate, plant, updatePlant, showSavedFlash]);

  const handlePurchasePriceBlur = useCallback(() => {
    if (purchasePrice !== (plant?.purchasePrice ?? '')) {
      updatePlant(plant!.id, { purchasePrice });
      showSavedFlash();
    }
  }, [purchasePrice, plant, updatePlant, showSavedFlash]);

  const handlePurchaseOriginBlur = useCallback(() => {
    if (purchaseOrigin !== (plant?.purchaseOrigin ?? '')) {
      updatePlant(plant!.id, { purchaseOrigin });
      showSavedFlash();
    }
  }, [purchaseOrigin, plant, updatePlant, showSavedFlash]);

  const handleGiftFromBlur = useCallback(() => {
    if (giftFrom !== (plant?.giftFrom ?? '')) {
      updatePlant(plant!.id, { giftFrom });
      showSavedFlash();
    }
  }, [giftFrom, plant, updatePlant, showSavedFlash]);

  if (!plant) return null;

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Notes textarea */}
        <TextInput
          style={styles.notesTextarea}
          value={notes}
          onChangeText={setNotes}
          onBlur={handleNotesBlur}
          placeholder={t('detail.notes.placeholder')}
          placeholderTextColor="#bbb"
          multiline
          maxLength={NOTES_MAX}
          textAlignVertical="top"
        />

        {/* Character counter — only visible at 800+ chars */}
        {notes.length >= COUNTER_THRESHOLD ? (
          <Text style={styles.charCounter}>
            {t('detail.notes.charsRemaining', { count: NOTES_MAX - notes.length })}
          </Text>
        ) : null}

        {/* Saved flash confirmation */}
        {savedVisible ? (
          <Text style={styles.savedConfirm}>{t('detail.notes.saved')}</Text>
        ) : null}

        {/* Metadata section */}
        <Text style={styles.metadataSectionLabel}>
          {t('detail.notes.metadataSection').toUpperCase()}
        </Text>

        <MetadataField
          label={t('detail.notes.purchaseDate')}
          value={purchaseDate}
          onChange={setPurchaseDate}
          onBlur={handlePurchaseDateBlur}
          placeholder="e.g. 2024-03-15"
        />
        <MetadataField
          label={t('detail.notes.purchasePrice')}
          value={purchasePrice}
          onChange={setPurchasePrice}
          onBlur={handlePurchasePriceBlur}
          placeholder="e.g. €12.50"
        />
        <MetadataField
          label={t('detail.notes.purchaseOrigin')}
          value={purchaseOrigin}
          onChange={setPurchaseOrigin}
          onBlur={handlePurchaseOriginBlur}
          placeholder="e.g. IKEA"
        />
        <MetadataField
          label={t('detail.notes.giftFrom')}
          value={giftFrom}
          onChange={setGiftFrom}
          onBlur={handleGiftFromBlur}
          placeholder="e.g. Grandma"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },

  // Notes textarea
  notesTextarea: {
    minHeight: 120,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },

  // Character counter — shown only at 800+ chars
  charCounter: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'right',
    marginTop: 4,
  },

  // Saved flash
  savedConfirm: {
    fontSize: 13,
    color: '#2e7d32',
    fontWeight: '500',
    marginTop: 6,
  },

  // Metadata section header
  metadataSectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.4,
    marginTop: 24,
    marginBottom: 12,
  },

  // Metadata field row
  metadataField: {
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  metadataInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
});
