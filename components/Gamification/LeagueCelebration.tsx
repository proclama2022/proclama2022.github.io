/**
 * LeagueCelebration Component
 *
 * Displays confetti animation and triggers haptic feedback on league promotion.
 * Non-blocking, auto-dismisses after 3 seconds.
 *
 * @module components/Gamification/LeagueCelebration
 */
import React, { useEffect, useRef } from 'react';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';

import type { LeagueTierKey } from '@/types/gamification';
import { getTierSymbol } from '@/services/leaguePromotionService';

export interface LeagueCelebrationProps {
  visible: boolean;
  tier: LeagueTierKey;
  onComplete?: () => void;
}

/**
 * LeagueCelebration shows confetti and haptic feedback on promotion.
 * Per CONTEXT.md: Non-blocking, auto-dismiss after 3 seconds.
 * Haptic only on promotion (not relegation).
 */
export function LeagueCelebration({ visible, tier, onComplete }: LeagueCelebrationProps) {
  const confettiRef = useRef<ConfettiCannon>(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (visible && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;

      // Fire confetti from center-top
      // Note: confetti-cannon requires explicit start() call
      setTimeout(() => {
        confettiRef.current?.start();
      }, 100);

      // Haptic feedback - success notification
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
        // Haptics may not be available on all devices
      });

      // Auto-dismiss after 3 seconds (per CONTEXT.md CELE-05)
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onComplete]);

  // Reset trigger flag when visibility changes
  useEffect(() => {
    if (!visible) {
      hasTriggeredRef.current = false;
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <ConfettiCannon
      ref={confettiRef}
      count={100}
      origin={{ x: -10, y: 0 }}
      fadeOut
      autoStart={false}
      colors={['#FFD700', '#C0C0C0', '#B9F2FF', '#E5E4E2', '#CD7F32']}
    />
  );
}

export default LeagueCelebration;
