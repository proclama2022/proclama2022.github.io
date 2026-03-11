import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useGamificationStore } from '@/stores/gamificationStore';
import { CelebrationOverlay, CelebrationType } from '@/components/Gamification/CelebrationOverlay';

function getBadgeLabel(t: (key: string, options?: any) => string, badgeKey: string): string {
  return t(`gamification.badges.${badgeKey}.title`, { defaultValue: badgeKey });
}

export default function GamificationToastHost() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const currentToast = useGamificationStore((state) => state.currentToast);
  const dismissToast = useGamificationStore((state) => state.dismissToast);
  const canTriggerCelebration = useGamificationStore((state) => state.canTriggerCelebration);
  const recordCelebration = useGamificationStore((state) => state.recordCelebration);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationType, setCelebrationType] = useState<CelebrationType | null>(null);

  useEffect(() => {
    if (!currentToast) {
      setShowCelebration(false);
      setCelebrationType(null);
      return;
    }

    // Define which events deserve confetti (CELE-01, CELE-02, CELE-03)
    const celebrationWorthyKinds = ['badge', 'level', 'league_promotion'];
    const shouldCelebrate = celebrationWorthyKinds.includes(currentToast.kind);

    if (shouldCelebrate) {
      // Check cooldown before triggering (CELE-06)
      if (canTriggerCelebration()) {
        const type: CelebrationType = currentToast.kind === 'league_promotion' ? 'league_promotion' : currentToast.kind as CelebrationType;
        setCelebrationType(type);
        setShowCelebration(true);
        recordCelebration();
        // Haptic is handled by CelebrationOverlay component (CELE-04)
      } else {
        // Cooldown active - skip confetti but still show toast
        setShowCelebration(false);
        // Use standard haptic for suppressed celebrations
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    } else {
      // For non-celebration toasts (except relegation and title), use standard haptic
      if (currentToast.kind !== 'league_relegation' && currentToast.kind !== 'title') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }

    const timer = setTimeout(() => {
      dismissToast();
    }, 3000); // Extended to 3s for celebrations

    return () => clearTimeout(timer);
  }, [currentToast, dismissToast, canTriggerCelebration, recordCelebration]);

  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCelebrationType(null);
  };

  if (!currentToast) {
    return null;
  }

  // Determine icon and title based on toast kind
  let iconName: keyof typeof Ionicons.glyphMap = 'sparkles-outline';
  let title = t('gamification.toast.xpGained');
  let body = currentToast.message;

  switch (currentToast.kind) {
    case 'badge':
      iconName = 'ribbon-outline';
      title = t('gamification.toast.badgeUnlocked');
      // Include emoji in body if available
      const badgeLabel = getBadgeLabel(t, currentToast.message);
      body = currentToast.emoji ? `${currentToast.emoji} ${badgeLabel}` : badgeLabel;
      break;
    case 'level':
      iconName = 'trophy-outline';
      title = t('gamification.toast.levelUp');
      body = t('gamification.toast.levelLabel', { level: currentToast.message.replace(/^Level\s+/, '') });
      break;
    case 'league_promotion':
      iconName = 'trending-up-outline';
      title = t('gamification.toast.leaguePromotion', { defaultValue: 'Promoted!' });
      body = t('gamification.toast.promotedTo', {
        tier: currentToast.metadata?.newTier || 'Silver',
        defaultValue: `Welcome to ${currentToast.metadata?.newTier || 'Silver'} league!`
      });
      break;
    case 'league_relegation':
      iconName = 'trending-down-outline';
      title = t('gamification.toast.leagueRelegation', { defaultValue: 'League Update' });
      body = t('gamification.toast.movedTo', {
        tier: currentToast.metadata?.newTier || 'Bronze',
        defaultValue: `You're now in ${currentToast.metadata?.newTier || 'Bronze'} league`
      });
      // Per CONTEXT.md: subtle toast without celebration for relegation
      break;
    case 'title':
      iconName = 'star-outline';
      title = t('gamification.toast.titleChange', { defaultValue: 'Title Unlocked!' });
      body = t('gamification.titles.titleChangeToast', { title: currentToast.message });
      // Include emoji in body if available
      if (currentToast.emoji) {
        body = `${currentToast.emoji} ${body}`;
      }
      break;
    default:
      iconName = 'sparkles-outline';
      title = t('gamification.toast.xpGained');
      body = currentToast.message;
  }

  return (
    <>
      {/* Confetti celebration for badge/level/league_promotion (CELE-01, CELE-02, CELE-03) */}
      {showCelebration && celebrationType && (
        <CelebrationOverlay
          visible={showCelebration}
          type={celebrationType === 'level' ? 'level' : celebrationType === 'badge' ? 'badge' : 'league_promotion'}
          onComplete={handleCelebrationComplete}
        />
      )}

      <Modal visible transparent animationType="fade" onRequestClose={dismissToast}>
        <View style={styles.overlay} pointerEvents="box-none">
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={dismissToast} />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surfaceGlass,
                borderColor: colors.border,
                shadowColor: colors.shadowStrong,
              },
              // Subtle styling for relegation (less prominent)
              currentToast.kind === 'league_relegation' && styles.relegationCard,
            ]}
          >
            <View style={[
              styles.iconWrap,
              { backgroundColor: currentToast.kind === 'league_relegation' ? colors.textSecondary : colors.tint }
            ]}>
              <Ionicons name={iconName} size={18} color="#fff" />
            </View>
            <View style={styles.copy}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              <ThemedText style={[styles.body, { color: colors.textSecondary }]}>{body}</ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 36,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  relegationCard: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    fontWeight: '600',
  },
});
