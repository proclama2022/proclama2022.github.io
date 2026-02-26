import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingScreen {
  icon: string;
  ionicon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgGradientStart: string;
  title: string;
  description: string;
}

export default function Onboarding() {
  const { t } = useTranslation();
  const { setOnboardingComplete } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const screens: OnboardingScreen[] = [
    {
      icon: '',
      ionicon: 'leaf',
      iconColor: '#16A34A',
      bgGradientStart: '#e8f5e9',
      title: t('onboarding.screen1.title'),
      description: t('onboarding.screen1.description'),
    },
    {
      icon: '',
      ionicon: 'camera',
      iconColor: '#2563EB',
      bgGradientStart: '#e3f2fd',
      title: t('onboarding.screen2.title'),
      description: t('onboarding.screen2.description'),
    },
    {
      icon: '',
      ionicon: 'heart',
      iconColor: '#DC2626',
      bgGradientStart: '#fce4ec',
      title: t('onboarding.screen3.title'),
      description: t('onboarding.screen3.description'),
    },
  ];

  const isLastScreen = currentIndex === screens.length - 1;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index !== currentIndex) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setCurrentIndex(index);
    }
  };

  const handleNext = () => {
    if (isLastScreen) {
      setOnboardingComplete();
    } else {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setCurrentIndex(nextIndex);
    }
  };

  const handleSkip = () => {
    setOnboardingComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      {!isLastScreen && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      )}

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
            <View style={[styles.iconCircle, { backgroundColor: screen.bgGradientStart }]}>
              <Ionicons name={screen.ionicon} size={64} color={screen.iconColor} />
            </View>
            {index === currentIndex ? (
              <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text style={styles.title}>{screen.title}</Text>
                <Text style={styles.description}>{screen.description}</Text>
              </Animated.View>
            ) : (
              <View>
                <Text style={styles.title}>{screen.title}</Text>
                <Text style={styles.description}>{screen.description}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

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

      <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
        <Text style={styles.nextButtonText}>
          {isLastScreen ? t('onboarding.getStarted') : t('onboarding.next')}
        </Text>
        {!isLastScreen && <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 6 }} />}
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
  scrollView: { flex: 1 },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
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
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#16A34A',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#D1D5DB',
    width: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 32,
    minWidth: 200,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
