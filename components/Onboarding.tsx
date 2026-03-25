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
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useOnboardingStore } from '@/stores/onboardingStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Onboarding() {
  const { t } = useTranslation();
  const { setOnboardingComplete } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [currentIndex]);

  const screens = [
    {
      icon: 'eco' as const,
      title: t('onboarding.screen1.title', { defaultValue: 'Discover Nature\'s Secrets' }),
      description: t('onboarding.screen1.description', {
        defaultValue: 'Instantly identify plants, diagnose diseases, and curate your personal digital garden with tailored care guides.',
      }),
    },
    {
      icon: 'photo-camera' as const,
      title: t('onboarding.screen2.title', { defaultValue: 'AI-Powered Identification' }),
      description: t('onboarding.screen2.description', {
        defaultValue: 'Point your camera at any plant and get instant, accurate identification powered by advanced AI technology.',
      }),
    },
    {
      icon: 'favorite' as const,
      title: t('onboarding.screen3.title', { defaultValue: 'Nurture Your Garden' }),
      description: t('onboarding.screen3.description', {
        defaultValue: 'Track watering schedules, monitor health, and receive personalized care tips for every plant in your collection.',
      }),
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
    <View style={styles.container}>
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
          <SafeAreaView key={index} style={styles.screen}>
            <View style={styles.iconContainer}>
              <View style={styles.iconGlow} />
              <View style={styles.iconCircle}>
                <MaterialIcons name={screen.icon} size={56} color="#13ec8e" />
              </View>
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
          </SafeAreaView>
        ))}
      </ScrollView>

      <View style={styles.bottomSection}>
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

        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextButtonText}>
            {isLastScreen ? t('onboarding.getStarted') : t('onboarding.next', { defaultValue: 'Continue' })}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  skipButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: '#8b949e',
    fontWeight: '500',
  },
  scrollView: { flex: 1 },
  screen: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(19, 236, 142, 0.08)',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(19, 236, 142, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(19, 236, 142, 0.2)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#f0f6fc',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: '#8b949e',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  bottomSection: {
    paddingBottom: 48,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#13ec8e',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#30363d',
    width: 6,
  },
  nextButton: {
    backgroundColor: '#13ec8e',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 56,
    shadowColor: '#13ec8e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  nextButtonText: {
    color: '#0d1117',
    fontSize: 17,
    fontWeight: '700',
  },
});
