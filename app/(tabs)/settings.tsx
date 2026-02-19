import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Text } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/stores/settingsStore';
import { changeLanguage } from '@/i18n';
import Colors from '@/constants/Colors';

export default function SettingsScreen() {
  const { language, setLanguage } = useSettingsStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme() ?? 'light';

  const handleLanguageChange = async (lang: 'en' | 'it') => {
    setLanguage(lang);
    await changeLanguage(lang);
  };

  const tintColor = Colors[colorScheme].tint;
  const textColor = Colors[colorScheme].text;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>

      {/* Language switcher */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
        <View style={styles.languageSwitcher}>
          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.languageButtonLeft,
              language === 'en' && { backgroundColor: tintColor },
            ]}
            onPress={() => handleLanguageChange('en')}
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'en' }}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === 'en' && styles.languageButtonTextActive,
                language !== 'en' && { color: textColor },
              ]}
            >
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.languageButton,
              styles.languageButtonRight,
              language === 'it' && { backgroundColor: tintColor },
            ]}
            onPress={() => handleLanguageChange('it')}
            accessibilityRole="button"
            accessibilityState={{ selected: language === 'it' }}
          >
            <Text
              style={[
                styles.languageButtonText,
                language === 'it' && styles.languageButtonTextActive,
                language !== 'it' && { color: textColor },
              ]}
            >
              Italiano
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Legal links */}
      <View style={styles.section}>
        <Link href="/privacy" asChild>
          <TouchableOpacity accessibilityRole="link">
            <Text style={[styles.link, { color: tintColor }]}>
              {t('settings.privacy')}
            </Text>
          </TouchableOpacity>
        </Link>
      </View>

      {/* PlantNet attribution */}
      <View style={styles.attributionContainer}>
        <Text style={styles.attribution}>{t('settings.attribution')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  languageSwitcher: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  languageButtonLeft: {
    borderRightWidth: 0.5,
    borderRightColor: '#ccc',
  },
  languageButtonRight: {
    borderLeftWidth: 0.5,
    borderLeftColor: '#ccc',
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    fontSize: 16,
    paddingVertical: 4,
  },
  attributionContainer: {
    position: 'absolute',
    bottom: 32,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  attribution: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
});
