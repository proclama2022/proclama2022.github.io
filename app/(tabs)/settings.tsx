import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import { BannerAdWrapper } from '@/components/BannerAdWrapper';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { AuthModal } from '@/components/auth';
import { MigrationScreen } from '@/components/auth/MigrationScreen';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSettingsStore } from '@/stores/settingsStore';
import { useProStore } from '@/stores/proStore';
import { usePlantsStore } from '@/stores/plantsStore';
import { useAuthStore } from '@/stores/authStore';
import { useProStatus } from '@/hooks/useProStatus';
import { changeLanguage } from '@/i18n';
import { resetRateLimit } from '@/services/rateLimiter';
import { signOut } from '@/services/authService';
import { getMigrationFlag, clearMigrationFlag } from '@/services/migrationService';
import * as NotificationService from '@/services/notificationService';

export default function SettingsScreen() {
  const { language, setLanguage, notificationEnabled, setNotificationEnabled, notificationTime, setNotificationTime } = useSettingsStore();
  const plants = usePlantsStore((state) => state.plants);
  const isPro = useProStore((state) => state.isPro);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = Boolean(user);
  const { restore, loading: restoreLoading } = useProStatus();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [permissionStatus, setPermissionStatus] = React.useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = React.useState(false);
  const [authModalVisible, setAuthModalVisible] = React.useState(false);
  const [migrationVisible, setMigrationVisible] = React.useState(false);
  const [migrationFlag, setMigrationFlag] = React.useState<{ timestamp: string; plantCount: number } | null>(null);

  React.useEffect(() => {
    NotificationService.checkPermission().then(setPermissionStatus);

    // Load migration flag if authenticated
    if (isAuthenticated) {
      getMigrationFlag().then(setMigrationFlag);
    }
  }, [isAuthenticated]);

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
      await NotificationService.scheduleDailyDigest(plants, notificationTime);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      if (permissionStatus === 'undetermined' || permissionStatus === 'denied') {
        const granted = await NotificationService.requestPermission();
        setPermissionStatus(granted ? 'granted' : 'denied');
        if (!granted) {
          Alert.alert('Notifications Required', 'Please enable notifications in system settings to receive watering reminders.');
          return;
        }
      }
      setNotificationEnabled(true);
      await NotificationService.scheduleDailyDigest(plants, notificationTime);
    } else {
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
    Alert.alert(success ? t('pro.restoreSuccess') : t('pro.restoreFailed'));
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (!result.success && result.error) {
              Alert.alert('Sign Out Failed', result.error);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>

        {/* Pro Status */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.upgrade', { defaultValue: 'Pro Status' })}</Text>
          <View style={styles.proStatusRow}>
            <View style={[styles.proBadge, isPro ? { backgroundColor: '#ffd700', borderColor: '#ffb300' } : { backgroundColor: colors.chipBg, borderColor: colors.chipBorder }]}>
              <Ionicons name={isPro ? 'diamond' : 'diamond-outline'} size={16} color={isPro ? '#fff' : colors.textSecondary} />
              <Text style={[styles.proBadgeText, { color: isPro ? '#fff' : colors.textSecondary }]}>
                {isPro ? 'Pro' : 'Free'}
              </Text>
            </View>
          </View>
          {isPro && (
            <View style={[styles.proThankYou, { backgroundColor: colors.chipActiveBg }]}>
              <Ionicons name="heart" size={16} color="#e91e63" />
              <Text style={[styles.proThankYouText, { color: colors.tint }]}>{t('pro.proThankYou')}</Text>
            </View>
          )}
          {!isPro && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.tint }]} onPress={() => setShowProUpgradeModal(true)} accessibilityRole="button">
              <Ionicons name="diamond-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>{t('pro.upgradeForMore')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.chipBg }]} onPress={handleRestorePurchases} disabled={restoreLoading} accessibilityRole="button">
            <Ionicons name="refresh-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.secondaryButtonText, { color: colors.textSecondary }]}>
              {restoreLoading ? t('common.loading') : t('pro.restorePurchases')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>Account</Text>

          {/* Loading indicator */}
          {isLoading && (
            <View style={[styles.row, { justifyContent: 'center' }]}>
              <Text style={[styles.statusText, { color: colors.textSecondary }]}>Signing in...</Text>
            </View>
          )}

          {/* Error display */}
          {error && !isLoading && (
            <View style={[styles.errorContainer, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger, flex: 1 }]}>{error}</Text>
              <TouchableOpacity onPress={() => setAuthModalVisible(true)}>
                <Text style={[styles.errorLink, { color: colors.danger }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {isAuthenticated && user ? (
            <>
              {/* User info */}
              <View style={[styles.row, { paddingVertical: 16 }]}>
                <Ionicons name="person" size={20} color={colors.tint} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: colors.text }]}>{user.email}</Text>
                  <Text style={[styles.statusText, { color: colors.textSecondary, fontSize: 13 }]}>Signed in</Text>
                </View>
              </View>

              {/* Migration section */}
              {!migrationFlag && plants.length > 0 && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.chipBg }]}
                  onPress={() => setMigrationVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Sync your plants to the cloud"
                >
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.tint} />
                  <Text style={[styles.secondaryButtonText, { color: colors.tint }]}>Sync Your Plants</Text>
                </TouchableOpacity>
              )}

              {migrationFlag && (
                <View style={[styles.row, { paddingVertical: 12 }]}>
                  <Ionicons name="cloud-checkmark" size={18} color={colors.success} />
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: colors.text }]}>Last synced</Text>
                    <Text style={[styles.statusText, { color: colors.textSecondary, fontSize: 13 }]}>
                      {new Date(migrationFlag.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Debug: Reset migration button (dev only) */}
              {__DEV__ && migrationFlag && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: colors.chipBg, marginTop: 8 }]}
                  onPress={async () => {
                    await clearMigrationFlag();
                    setMigrationFlag(null);
                    Alert.alert('Dev', 'Migration flag cleared. You can sync again.');
                  }}
                  accessibilityRole="button"
                >
                  <Ionicons name="refresh-outline" size={18} color={colors.warning} />
                  <Text style={[styles.secondaryButtonText, { color: colors.warning }]}>Reset Sync (Dev)</Text>
                </TouchableOpacity>
              )}

              {/* Sign out button */}
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.chipBg }]}
                onPress={handleSignOut}
                accessibilityRole="button"
                accessibilityLabel="Sign out"
              >
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={[styles.secondaryButtonText, { color: colors.danger }]}>Sign Out</Text>
              </TouchableOpacity>

              {/* Debug section (dev only) */}
              {__DEV__ && (
                <View style={[styles.debugSection, { backgroundColor: colors.chipBg, marginTop: 12 }]}>
                  <Text style={[styles.debugTitle, { color: colors.textMuted }]}>Auth State (Dev)</Text>
                  <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                    Signed in as: {user?.email}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Sign in button */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.tint }]}
                onPress={() => setAuthModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Sign in or create account"
              >
                <Ionicons name="log-in-outline" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Sign In / Create Account</Text>
              </TouchableOpacity>
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                Sign in to access community features
              </Text>
            </>
          )}
        </View>

        {/* General */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.general')}</Text>

          {/* Language */}
          <Text style={[styles.rowLabel, { color: colors.text }]}>{t('settings.language')}</Text>
          <View style={[styles.languageSwitcher, { borderColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.languageButton, styles.languageButtonLeft, { borderRightColor: colors.border }, language === 'en' && { backgroundColor: colors.tint }]}
              onPress={() => handleLanguageChange('en')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'en' }}
            >
              <Text style={[styles.languageButtonText, { color: language === 'en' ? '#fff' : colors.text }]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageButton, styles.languageButtonRight, { borderLeftColor: colors.border }, language === 'it' && { backgroundColor: colors.tint }]}
              onPress={() => handleLanguageChange('it')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'it' }}
            >
              <Text style={[styles.languageButtonText, { color: language === 'it' ? '#fff' : colors.text }]}>Italiano</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.notifications')}</Text>

          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text }]}>Status</Text>
            <Text style={[styles.statusText, permissionStatus === 'granted' ? { color: colors.success } : permissionStatus === 'denied' ? { color: colors.danger } : { color: colors.textMuted }]}>
              {permissionStatus === 'granted' ? 'Enabled' : permissionStatus === 'denied' ? 'Disabled' : 'Undetermined'}
            </Text>
          </View>

          {permissionStatus !== 'undetermined' && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Enable Notifications</Text>
              <Switch
                value={notificationEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: colors.chipBorder, true: colors.tint }}
                thumbColor={notificationEnabled ? colors.success : colors.chipBg}
              />
            </View>
          )}

          {permissionStatus === 'undetermined' && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.tint }]} onPress={handleRequestPermission}>
              <Text style={styles.actionButtonText}>{t('watering.enableNotifications')}</Text>
            </TouchableOpacity>
          )}

          {permissionStatus === 'denied' && (
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              Enable in system settings to receive watering reminders.
            </Text>
          )}

          {permissionStatus === 'granted' && (
            <View style={styles.row}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t('watering.notificationTime')}</Text>
              <TouchableOpacity style={[styles.timeButton, { backgroundColor: colors.chipBg }]} onPress={() => setShowTimePicker(true)}>
                <Text style={[styles.timeText, { color: colors.tint }]}>{notificationTime}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Statistics & Calendar links */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.statistics')}</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/statistics' as const)}
            accessibilityRole="button"
          >
            <View style={styles.linkRowInner}>
              <Ionicons name="bar-chart-outline" size={20} color={colors.tint} />
              <Text style={[styles.linkText, { color: colors.text }]}>{t('settings.viewStats')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/calendar' as const)}
            accessibilityRole="button"
          >
            <View style={styles.linkRowInner}>
              <Ionicons name="calendar-outline" size={20} color={colors.tint} />
              <Text style={[styles.linkText, { color: colors.text }]}>{t('calendar.title')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legal & Info */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>{t('settings.legalInfo')}</Text>
          <Link href="/privacy" asChild>
            <TouchableOpacity style={styles.linkRow} accessibilityRole="link">
              <View style={styles.linkRowInner}>
                <Ionicons name="shield-outline" size={20} color={colors.tint} />
                <Text style={[styles.linkText, { color: colors.text }]}>{t('settings.privacy')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Link>
        </View>

        {/* Attribution */}
        <View style={styles.attributionContainer}>
          <Text style={[styles.attribution, { color: colors.textMuted }]}>{t('settings.attribution')}</Text>
        </View>

        {__DEV__ && (
          <TouchableOpacity style={[styles.devButton, { borderColor: colors.warning }]} onPress={handleResetLimit}>
            <Text style={[styles.devButtonText, { color: colors.warning }]}>Reset daily scan limit (dev only)</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Time picker modal */}
      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.timePickerModal}>
          <View style={[styles.timePickerContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timePickerTitle, { color: colors.text }]}>Select Time</Text>
            <View style={styles.timeOptions}>
              {['06:00', '07:00', '08:00', '09:00', '10:00', '18:00', '19:00', '20:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, { borderColor: colors.chipBorder, backgroundColor: notificationTime === time ? colors.tint : colors.surface }]}
                  onPress={() => { handleTimeChange(time); setShowTimePicker(false); }}
                >
                  <Text style={[styles.timeOptionText, { color: notificationTime === time ? '#fff' : colors.textSecondary }]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.timePickerCancel, { backgroundColor: colors.chipBg }]} onPress={() => setShowTimePicker(false)}>
              <Text style={[styles.timePickerCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ProUpgradeModal visible={showProUpgradeModal} onClose={() => setShowProUpgradeModal(false)} triggerReason="manual" />

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSignedIn={async () => {
          // Refresh migration flag after sign-in
          const flag = await getMigrationFlag();
          setMigrationFlag(flag);
        }}
      />

      {/* Migration Screen */}
      <MigrationScreen
        visible={migrationVisible}
        onComplete={async () => {
          setMigrationVisible(false);
          // Refresh migration flag after completion
          const flag = await getMigrationFlag();
          setMigrationFlag(flag);
        }}
        onSkip={() => setMigrationVisible(false)}
      />

      <BannerAdWrapper />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 8,
  },
  sectionCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  languageSwitcher: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  languageButtonLeft: { borderRightWidth: 0.5 },
  languageButtonRight: { borderLeftWidth: 0.5 },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  proStatusRow: {
    flexDirection: 'row',
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
  proBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  proThankYou: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  proThankYouText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  attributionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  attribution: {
    fontSize: 13,
    textAlign: 'center',
  },
  devButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  devButtonText: { fontSize: 14 },
  // Time picker modal
  timePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    minWidth: 70,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePickerCancel: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  timePickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  errorLink: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  debugSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  debugTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
  },
});
