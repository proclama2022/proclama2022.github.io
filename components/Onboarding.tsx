import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreen {
  icon: string;
  title: string;
  description: string;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const { setOnboardingComplete } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const screens: OnboardingScreen[] = [
    {
      icon: '🌱',
      title: t('onboarding.screen1.title'),
      description: t('onboarding.screen1.description'),
    },
    {
      icon: '📷',
      title: t('onboarding.screen2.title'),
      description: t('onboarding.screen2.description'),
    },
    {
      icon: '🌿',
      title: t('onboarding.screen3.title'),
      description: t('onboarding.screen3.description'),
    },
  ];

  const isLastScreen = currentIndex === screens.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (isLastScreen) {
      setOnboardingComplete();
    } else {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    setOnboardingComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button */}
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

      {/* Swipeable screens */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {screens.map((screen, index) => (
          <View key={index} style={styles.screen}>
            <Text style={styles.icon}>{screen.icon}</Text>
            <Text style={styles.title}>{screen.title}</Text>
            <Text style={styles.description}>{screen.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Page dots */}
      <View style={styles.dotsContainer}>
        {screens.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
        <Text style={styles.nextButtonText}>
          {isLastScreen ? t('onboarding.getStarted') : t('onboarding.next')}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF7',
    alignItems: 'center',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  icon: {
    fontSize: 96,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#16A34A',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
  },
  nextButton: {
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
