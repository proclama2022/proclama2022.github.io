import React, { useCallback } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

function CameraFab() {
  const router = useRouter();
  const colors = Colors[useColorScheme() ?? 'light'];
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(() => {
    router.push('/camera' as const);
  }, [router]);

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        {
          backgroundColor: colors.tint,
          bottom: insets.bottom + 28,
          shadowColor: colors.tint,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel="Scan plant"
    >
      <MaterialIcons name="photo-camera" size={28} color="#0d1117" />
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            elevation: 0,
            shadowOpacity: 0,
            height: Platform.OS === 'ios' ? 88 : 64,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShown: useClientOnlyValue(false, true),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="health-center"
          options={{
            title: 'Health',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="favorite" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Garden',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="grid-view" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="camera"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="two"
          options={{
            href: null,
          }}
        />
      </Tabs>
      <CameraFab />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
