import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage } from '@/i18n';

type Language = 'en' | 'it';

interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => void;
  syncI18n: () => Promise<void>;
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
    }),
    {
      name: 'plantid-settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
