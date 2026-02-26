import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { initI18n } from '@/i18n';
import { initNotificationService, checkPermission, scheduleDailyDigest } from '@/services/notificationService';
import { useSettingsStore } from '@/stores/settingsStore';
import { usePlantsStore } from '@/stores/plantsStore';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [i18nReady, setI18nReady] = useState(false);
  const notificationEnabled = useSettingsStore((state) => state.notificationEnabled);
  const notificationTime = useSettingsStore((state) => state.notificationTime);
  const plants = usePlantsStore((state) => state.plants);

  // Initialize i18n
  useEffect(() => {
    initI18n()
      .then(() => setI18nReady(true))
      .catch((err) => {
        console.error('Failed to initialize i18n:', err);
        setI18nReady(true); // Continue even if i18n fails to avoid blocking app
      });
  }, []);

  // Initialize notification service on mount
  useEffect(() => {
    initNotificationService().catch((err) => {
      console.error('Failed to initialize notification service:', err);
    });
  }, []);

  // Migrate plants from photo to photos array on app startup
  useEffect(() => {
    try {
      usePlantsStore.getState().migrateToPhotos();
    } catch (err) {
      console.error('Failed to migrate plants to photos array:', err);
    }
  }, []);

  // Schedule daily digest at startup if notifications enabled
  useEffect(() => {
    if (!notificationEnabled || plants.length === 0) {
      return;
    }

    checkPermission().then((status) => {
      if (status === 'granted') {
        scheduleDailyDigest(plants, notificationTime).catch((err) => {
          console.error('Failed to schedule daily digest:', err);
        });
      }
    });
  }, [notificationEnabled, notificationTime, plants]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, i18nReady]);

  if (!loaded || !i18nReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy Policy' }} />
        <Stack.Screen name="results" options={{ headerShown: false }} />
        <Stack.Screen name="plant/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="statistics" options={{ headerShown: true }} />
        <Stack.Screen name="calendar" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
