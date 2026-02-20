import React from 'react';
import { Alert, Modal, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText as Text } from '@/components/Themed';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProStore } from '@/stores/proStore';
import { usePlantsStore } from '@/stores/plantsStore';
import { useProStatus } from '@/hooks/useProStatus';
import { changeLanguage } from '@/i18n';
import { resetRateLimit } from '@/services/rateLimiter';
import * as NotificationService from '@/services/notificationService';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const { language, setLanguage, notificationEnabled, setNotificationEnabled, notificationTime, setNotificationTime } = useSettingsStore();
  const plants = usePlantsStore((state) => state.plants);
  const isPro = useProStore((state) => state.isPro);
  const { restore, loading: restoreLoading } = useProStatus();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const [permissionStatus, setPermissionStatus] = React.useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = React.useState(false);

  // Check notification permission on mount
  React.useEffect(() => {
    NotificationService.checkPermission().then(setPermissionStatus);
  }, []);

  const handleLanguageChange = async (lang: 'en' | 'it') => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  const handleResetLimit = async () => {
    await resetRateLimit();
    Alert.alert('Dev', 'Daily scan limit reset');
  };

  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setPermissionStatus(granted ? 'granted' : 'denied');
    if (granted) {
      setNotificationEnabled(true);
      // Schedule daily digest with current time
      await NotificationService.scheduleDailyDigest(plants, notificationTime);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Enable: request permission first
      if (permissionStatus === 'undetermined' || permissionStatus === 'denied') {
        const granted = await NotificationService.requestPermission();
        setPermissionStatus(granted ? 'granted' : 'denied');
        if (!granted) {
          Alert.alert(
            'Notifications Required',
            'Please enable notifications in system settings to receive watering reminders.'
          );
          return;
        }
      }
      setNotificationEnabled(true);
      await NotificationService.scheduleDailyDigest(plants, notificationTime);
    } else {
      // Disable: cancel all notifications
      setNotificationEnabled(false);
      const plantIds = plants.map(p => p.id);
      await NotificationService.cancelAllPlantNotifications(plantIds);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    setNotificationTime(newTime);
    if (notificationEnabled) {
      await NotificationService.scheduleDailyDigest(plants, newTime);
    }
  };

  const handleRestorePurchases = async () => {
    const success = await restore();
    if (success) {
      Alert.alert(t('pro.restoreSuccess'));
    } else {
      Alert.alert(t('pro.restoreFailed'));
    }
  };

  const tintColor = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  return (
    <>
      <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Language switcher */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.languageButtonLeft,
              language === 'en' && { backgroundColor: tintColor },
            ]}
            onPress={() => handleLanguageChange('en')}
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'en' }}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === 'en' && styles.languageButtonTextActive,
                language !== 'en' && { color: textColor },
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.languageButtonRight,
              language === 'it' && { backgroundColor: tintColor },
            ]}
            onPress={() => handleLanguageChange('it')}
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'it' }}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === 'it' && styles.languageButtonTextActive,
                language !== 'it' && { color: textColor },
              ]}
            >
              Italiano
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pro status section */}
      <View style={styles.section}>
        <View style={styles.proStatusRow}>
          <Text style={styles.sectionLabel}>{t('settings.upgrade', { defaultValue: 'Pro Status' })}</Text>
          <View style={[
            styles.proBadge,
            isPro && styles.proBadgePro,
            !isPro && styles.proBadgeFree,
          ]}>
            <Ionicons
              name={isPro ? 'diamond' : 'diamond-outline'}
              size={16}
              color={isPro ? '#fff' : '#666'}
            />
            <Text style={[
              styles.proBadgeText,
              isPro && styles.proBadgeTextPro,
            ]}>
              {isPro ? 'Pro' : 'Free'}
            </Text>
          </View>
        </View>

        {/* Thank you message for Pro users */}
        {isPro && (
          <View style={styles.proThankYou}>
            <Ionicons name="heart" size={16} color="#e91e63" />
            <Text style={styles.proThankYouText}>{t('pro.proThankYou')}</Text>
          </View>
        )}

        {/* Upgrade button for free users */}
        {!isPro && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowProUpgradeModal(true)}
            accessibilityRole="button"
          >
            <Ionicons name="diamond-outline" size={20} color="#fff" />
            <Text style={styles.upgradeButtonText}>{t('pro.upgradeForMore')}</Text>
          </TouchableOpacity>
        )}

        {/* Restore purchases button for all users */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestorePurchases}
          disabled={restoreLoading}
          accessibilityRole="button"
        >
          <Ionicons name="refresh-outline" size={18} color="#666" />
          <Text style={styles.restoreButtonText}>
            {restoreLoading ? t('common.loading', { defaultValue: 'Loading...' }) : t('pro.restorePurchases')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notification settings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('watering.notificationsEnabled')}</Text>

        {/* Permission status */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Status</Text>
          <Text style={[
            styles.statusText,
            permissionStatus === 'granted' && styles.statusGranted,
            permissionStatus === 'denied' && styles.statusDenied,
          ]}>
            {permissionStatus === 'granted' ? 'Enabled' :
             permissionStatus === 'denied' ? 'Disabled' :
             'Undetermined'}
          </Text>
        </View>

        {/* Enable/Disable switch */}
        {permissionStatus !== 'undetermined' && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enable Notifications</Text>
            <Switch
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#767577', true: '#2e7d32' }}
              thumbColor={notificationEnabled ? '#4caf50' : '#f4f3f4'}
            />
          </View>
        )}

        {/* Request permission button */}
        {permissionStatus === 'undetermined' && (
          <TouchableOpacity
            style={styles.enableButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.enableButtonText}>{t('watering.enableNotifications')}</Text>
          </TouchableOpacity>
        )}

        {/* Denied guidance */}
        {permissionStatus === 'denied' && (
          <Text style={styles.deniedText}>
            Enable in system settings to receive watering reminders.
          </Text>
        )}

        {/* Notification time picker */}
        {permissionStatus === 'granted' && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>{t('watering.notificationTime')}</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.timeText}>{notificationTime}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Simple time picker modal */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.timePickerModal}>
          <View style={styles.timePickerContent}>
            <Text style={styles.timePickerTitle}>Select Time</Text>
            <View style={styles.timeOptions}>
              {[
                '06:00', '07:00', '08:00', '09:00', '10:00',
                '18:00', '19:00', '20:00'
              ].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    notificationTime === time && styles.timeOptionSelected,
                  ]}
                  onPress={() => {
                    handleTimeChange(time);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={[
                    styles.timeOptionText,
                    notificationTime === time && styles.timeOptionTextSelected,
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.timePickerCancel}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.timePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Legal links */}
      <View style={styles.section}>
        <Link href="/privacy" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={[styles.link, { color: tintColor }]}>
              {t('settings.privacy')}
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* PlantNet attribution */}
      <View style={styles.attributionContainer}>
        <Text style={styles.attribution}>{t('settings.attribution')}</Text>
      </View>

      {/* Dev-only reset button */}
      {__DEV__ && (
        <TouchableOpacity style={styles.devButton} onPress={handleResetLimit}>
          <Text style={styles.devButtonText}>⚙ Reset daily scan limit (dev only)</Text>
        </TouchableOpacity>
      )}
      </View>

      <ProUpgradeModal
        visible={showProUpgradeModal}
        onClose={() => setShowProUpgradeModal(false)}
        triggerReason="manual"
      />

      <BannerAdWrapper />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageSwitcher: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  languageButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#ccc',
  },
  languageButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#ccc',
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    paddingVertical: 4,
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  attribution: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
  devButton: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff6b35',
    alignItems: 'center',
  },
  devButtonText: {
    color: '#ff6b35',
    fontSize: 14,
  },
  // Notification settings
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowLabel: {
    fontSize: 15,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusGranted: {
    color: '#2e7d32',
  },
  statusDenied: {
    color: '#c62828',
  },
  enableButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  enableButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  deniedText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  timeButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2e7d32',
  },
  // Time picker modal
  timePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    minWidth: 70,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  timeOptionTextSelected: {
    color: '#fff',
  },
  timePickerCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  timePickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  // Pro status section
  proStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  proBadgeFree: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  proBadgePro: {
    backgroundColor: '#ffd700',
    borderColor: '#ffb300',
  },
  proBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  proBadgeTextPro: {
    color: '#fff',
  },
  proThankYou: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fce4ec',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  proThankYouText: {
    fontSize: 14,
    color: '#c2185b',
    fontWeight: '600',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 10,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
