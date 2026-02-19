import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';

interface Props {
  /** Whether the modal is visible */
  visible: boolean;
  /** Daily identification limit (e.g. 5) */
  limit: number;
  /** Called when the user dismisses the modal */
  onClose: () => void;
}

/**
 * RateLimitModal — shown when the user has reached their daily scan limit.
 *
 * Displays a friendly, encouraging message explaining that the limit resets
 * at local midnight. The modal is non-dismissable by tapping the backdrop
 * so the user must tap "OK" to acknowledge it.
 */
export function RateLimitModal({ visible, limit, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name="time-outline" size={48} color="#2e7d32" />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              {t('rateLimit.title')}
            </Text>

            {/* Message */}
            <Text style={styles.message}>
              {t('rateLimit.message', { limit })}
            </Text>

            {/* OK button */}
            <TouchableOpacity
              style={styles.button}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.ok')}
            >
              <Text style={styles.buttonText}>{t('common.ok')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  safeArea: {
    width: '100%',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Elevation for Android
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    color: '#555',
    lineHeight: 22,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
