import React from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';

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
  const { language, setLanguage, notificationEnabled, setNotificationEnabled, notificationTime, setNotificationTime, colorScheme, setColorScheme } = useSettingsStore();
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

  const handleColorSchemeToggle = () => {
    const next = colorScheme === 'dark' ? 'system' : 'dark';
    setColorScheme(next);
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
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.tintGlass, borderColor: colors.border }]}>
              <MaterialIcons name="eco" size={28} color={colors.tint} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: colors.text }]}>
                {isAuthenticated && user ? user.email?.split('@')[0] || 'Plant Lover' : 'Guest'}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                {isAuthenticated && user ? user.email : 'Sign in to unlock all features'}
              </Text>
            </View>
            {isAuthenticated && user && (
              <TouchableOpacity style={styles.editButton} accessibilityRole="button">
                <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Pro Badge */}
          <View style={[styles.proRow, { backgroundColor: isPro ? colors.tintGlass : colors.surfaceStrong }]}>
            <MaterialIcons name="workspace-premium" size={20} color={isPro ? colors.tint : colors.textSecondary} />
            <View style={styles.proInfo}>
              <Text style={[styles.proLabel, { color: isPro ? colors.tint : colors.text }]}>
                {isPro ? 'Botanico Pro' : 'Free Plan'}
              </Text>
              <Text style={[styles.proDesc, { color: colors.textSecondary }]}>
                {isPro ? 'Unlimited identifications' : 'Limited scans per day'}
              </Text>
            </View>
            {!isPro && (
              <TouchableOpacity style={[styles.upgradeChip, { backgroundColor: colors.tint }]} onPress={() => setShowProUpgradeModal(true)} accessibilityRole="button">
                <Text style={styles.upgradeChipText}>Upgrade Now</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

          {isAuthenticated && user ? (
            <>
              <TouchableOpacity style={styles.menuRow} accessibilityRole="button">
                <MaterialIcons name="person" size={22} color={colors.tint} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>Edit Profile</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuRow} accessibilityRole="button">
                <MaterialIcons name="lock" size={22} color={colors.tint} />
                <Text style={[styles.menuLabel, { color: colors.text }]}>Privacy & Security</Text>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>

              {!migrationFlag && plants.length > 0 && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={() => setMigrationVisible(true)}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="cloud-upload" size={22} color={colors.tint} />
                  <Text style={[styles.menuLabel, { color: colors.text }]}>Sync Your Plants</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {migrationFlag && (
                <View style={styles.menuRow}>
                  <MaterialIcons name="cloud-done" size={22} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.text }]}>Last synced</Text>
                    <Text style={[styles.syncDate, { color: colors.textSecondary }]}>
                      {new Date(migrationFlag.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity style={[styles.signOutRow]} onPress={handleSignOut} accessibilityRole="button">
                <MaterialIcons name="logout" size={22} color={colors.danger} />
                <Text style={[styles.menuLabel, { color: colors.danger }]}>Log Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.signInButton, { backgroundColor: colors.tint }]}
              onPress={() => setAuthModalVisible(true)}
              accessibilityRole="button"
            >
              <MaterialIcons name="login" size={20} color="#0d1117" />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>

          <View style={styles.menuRow}>
            <MaterialIcons name="notifications" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Push Notifications</Text>
            <Switch
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={notificationEnabled ? colors.tint : colors.textMuted}
            />
          </View>

          <TouchableOpacity style={styles.menuRow} accessibilityRole="button">
            <MaterialIcons name="straighten" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Units</Text>
            <Text style={[styles.menuValue, { color: colors.textSecondary }]}>Metric</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuRow}>
            <MaterialIcons name="dark-mode" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={handleColorSchemeToggle}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor={colorScheme === 'dark' ? colors.tint : colors.textMuted}
            />
          </View>

          <View style={[styles.langRow, { borderColor: colors.border }]}>
            <MaterialIcons name="language" size={22} color={colors.tint} />
            <TouchableOpacity
              style={[styles.langButton, language === 'en' && { backgroundColor: colors.tint }]}
              onPress={() => handleLanguageChange('en')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'en' }}
            >
              <Text style={[styles.langText, language === 'en' && { color: '#0d1117' }]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langButton, language === 'it' && { backgroundColor: colors.tint }]}
              onPress={() => handleLanguageChange('it')}
              accessibilityRole="button"
              accessibilityState={{ selected: language === 'it' }}
            >
              <Text style={[styles.langText, language === 'it' && { color: '#0d1117' }]}>IT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & About */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support & About</Text>

          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/statistics' as const)} accessibilityRole="button">
            <MaterialIcons name="bar-chart" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Statistics</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} onPress={() => router.push('/calendar' as const)} accessibilityRole="button">
            <MaterialIcons name="calendar-month" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Calendar</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuRow} accessibilityRole="button">
            <MaterialIcons name="help" size={22} color={colors.tint} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>Help Center</Text>
            <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Link href="/privacy" asChild>
            <TouchableOpacity style={styles.menuRow} accessibilityRole="link">
              <MaterialIcons name="description" size={22} color={colors.tint} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Terms of Service</Text>
              <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={[styles.version, { color: colors.textMuted }]}>Botanico v2.4.1</Text>

        {__DEV__ && (
          <TouchableOpacity style={[styles.devButton, { borderColor: colors.warning }]} onPress={handleResetLimit}>
            <Text style={[styles.devButtonText, { color: colors.warning }]}>Reset daily scan limit (dev only)</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showTimePicker} transparent animationType="slide" onRequestClose={() => setShowTimePicker(false)}>
        <View style={styles.timePickerModal}>
          <View style={[styles.timePickerContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.timePickerTitle, { color: colors.text }]}>Select Time</Text>
            <View style={styles.timeOptions}>
              {['06:00', '07:00', '08:00', '09:00', '10:00', '18:00', '19:00', '20:00'].map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[styles.timeOption, { borderColor: colors.border, backgroundColor: notificationTime === time ? colors.tint : colors.surface }]}
                  onPress={() => { handleTimeChange(time); setShowTimePicker(false); }}
                >
                  <Text style={[styles.timeOptionText, { color: notificationTime === time ? '#0d1117' : colors.textSecondary }]}>{time}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.timePickerCancel, { backgroundColor: colors.surfaceStrong }]} onPress={() => setShowTimePicker(false)}>
              <Text style={[styles.timePickerCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ProUpgradeModal visible={showProUpgradeModal} onClose={() => setShowProUpgradeModal(false)} triggerReason="manual" />
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        onSignedIn={async () => {
          const flag = await getMigrationFlag();
          setMigrationFlag(flag);
        }}
      />
      <MigrationScreen
        visible={migrationVisible}
        onComplete={async () => {
          setMigrationVisible(false);
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
  container: { flex: 1, padding: 20, paddingTop: 12 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 13,
  },
  editButton: {
    padding: 8,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  proInfo: {
    flex: 1,
  },
  proLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  proDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  upgradeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  upgradeChipText: {
    color: '#0d1117',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 14,
    marginRight: 4,
  },
  syncDate: {
    fontSize: 12,
    marginTop: 1,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    marginTop: 4,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  signInButtonText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '700',
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
  },
  langButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#21262d',
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8b949e',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 12,
  },
  devButton: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  devButtonText: { fontSize: 14 },
  timePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  timePickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 70,
    alignItems: 'center',
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  timePickerCancel: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  timePickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
