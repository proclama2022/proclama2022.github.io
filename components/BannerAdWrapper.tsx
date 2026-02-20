import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProStore } from '@/stores/proStore';

// Ad unit IDs with Platform.select and __DEV__ check
const AD_UNIT_ID = Platform.select({
  ios: __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_IOS_BANNER_ID,
  android: __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_ANDROID_BANNER_ID,
});

/**
 * BannerAdWrapper component
 *
 * Displays Google AdMob banner ads at the bottom of screens for free users.
 * Pro users will not see any ads (component returns null when isPro is true).
 *
 * Features:
 * - Pro-user gating: Returns null for Pro users
 * - Safe area handling: Adds bottom padding for notched devices
 * - Clean error fallback: Hides completely on ad load failure (no placeholder)
 * - Test ads in development: Uses TestIds.BANNER in __DEV__ mode
 */
export function BannerAdWrapper() {
  const { isPro } = useProStore();
  const insets = useSafeAreaInsets();

  // Don't render ad if Pro user
  if (isPro) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BannerAd
        unitId={AD_UNIT_ID!}
        size={BannerAdSize.BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(error) => {
          // Clean fallback: hide on error, no placeholder
          console.log('Ad failed to load:', error.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    alignItems: 'center', // Center the ad horizontally
  },
});
