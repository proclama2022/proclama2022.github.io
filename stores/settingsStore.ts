import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '@/i18n';

type Language = 'en' | 'it';
type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';
type ColorScheme = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => void;
  syncI18n: () => Promise<void>;
  notificationEnabled: boolean;
  setNotificationEnabled: (enabled: boolean) => void;
  notificationTime: string;
  setNotificationTime: (time: string) => void;
  notificationPermission: NotificationPermissionStatus;
  setNotificationPermission: (status: NotificationPermissionStatus) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      syncI18n: async () => {
        const { language } = get();
        await changeLanguage(language);
      },
      notificationEnabled: false,
      setNotificationEnabled: (enabled) => set({ notificationEnabled: enabled }),
      notificationTime: '08:00',
      setNotificationTime: (time) => set({ notificationTime: time }),
      notificationPermission: 'undetermined',
      setNotificationPermission: (status) => set({ notificationPermission: status }),
      colorScheme: 'system',
      setColorScheme: (scheme) => set({ colorScheme: scheme }),
    }),
    {
      name: 'plantid-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
