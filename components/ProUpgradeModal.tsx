import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useProStatus } from '@/hooks/useProStatus';
import { PurchaseError } from '@/types';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ProUpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  triggerReason?: 'scan_limit' | 'collection_limit' | 'manual';
}

export function ProUpgradeModal({
  visible,
  onClose,
  triggerReason = 'manual',
}: ProUpgradeModalProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { purchase, loading } = useProStatus();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePurchase = async () => {
    setErrorMessage(null);
    const result = await purchase();

    if (result.success) {
      onClose();
    } else if (result.error) {
      // Show appropriate error message based on error type
      if (result.error.type === 'user_cancelled') {
        // User cancelled — don't show error, just close modal
        return;
      } else if (result.error.type === 'network_error') {
        setErrorMessage(t('pro.restoreError'));
      } else if (result.error.type === 'product_not_available') {
        setErrorMessage(t('pro.purchaseError'));
      } else {
        // verification_failed or unknown
        setErrorMessage(t('pro.purchaseError'));
      }
    }
  };

  const benefits = [
    { icon: 'camera-outline', text: t('pro.benefit15Scans') },
    { icon: 'leaf-outline', text: t('pro.benefitUnlimited') },
    { icon: 'ban-outline', text: t('pro.benefitNoAds') },
    { icon: 'checkmark-circle-outline', text: t('pro.benefitOneTime') },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('pro.upgradeTitle')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text style={styles.subtitle}>{t('pro.upgradeSubtitle')}</Text>

          {/* Benefits list */}
          <View style={styles.benefitsContainer}>
            {benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name={benefit.icon as any} size={24} color="#2e7d32" />
                <Text style={styles.benefitText}>{benefit.text}</Text>
              </View>
            ))}
          </View>

          {/* No subscription message */}
          <View style={styles.noSubscriptionBanner}>
            <Ionicons name="checkmark-done-circle" size={20} color="#2e7d32" />
            <Text style={styles.noSubscriptionText}>
              {t('pro.noSubscription')}
            </Text>
          </View>

          {/* Price display */}
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>{t('pro.oneTimePayment')}</Text>
            <Text style={styles.priceAmount}>{t('pro.priceTag')}</Text>
          </View>

          {/* Error message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={20} color="#c62828" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Purchase button */}
          <TouchableOpacity
            style={[styles.purchaseButton, loading && styles.purchaseButtonDisabled]}
            onPress={handlePurchase}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={t('pro.ctaButton')}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="diamond-outline" size={20} color="#fff" />
                <Text style={styles.purchaseButtonText}>{t('pro.ctaButton')}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Terms note */}
          <Text style={styles.termsNote}>
            {t('pro.termsNote', {
              defaultValue: 'Payment charged to App Store account. Managed by Apple.',
            })}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  benefitsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  noSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#e8f5e9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  noSubscriptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2e7d32',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffebee',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#c62828',
    flex: 1,
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  purchaseButtonDisabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  termsNote: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 17,
  },
});
