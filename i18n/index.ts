import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './resources/en.json';
import it from './resources/it.json';

const LANGUAGE_KEY = '@plantid_language';

export const initI18n = async () => {
  // Get saved language or detect device language
  let savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);

  if (!savedLang) {
    const deviceLang = getLocales()[0]?.languageCode || 'en';
    savedLang = ['en', 'it'].includes(deviceLang) ? deviceLang : 'en';
  }

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    lng: savedLang,
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false, // React Native already escapes
    },
  });

  return i18n;
};

export const changeLanguage = async (lang: string) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
};

export const getCurrentLanguage = (): string => {
  return i18n.language;
};

export default initI18n;
