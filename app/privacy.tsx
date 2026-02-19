import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Text, View } from '@/components/Themed';

export default function PrivacyScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('settings.privacy')}</Text>

      <Text style={styles.body}>
        Plantid respects your privacy. We do not collect or store any personal information.
        All plant identification data is processed locally on your device.
      </Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Pl@ntNet API</Text>
        <Text style={styles.body}>
          Plant identification is powered by the Pl@ntNet API. Images sent to Pl@ntNet
          are processed to identify the plant species. Pl@ntNet does not permanently store
          submitted images for personal profiling. For more information, visit{' '}
          <Text style={styles.link}>https://plantnet.org</Text>
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Local Storage</Text>
        <Text style={styles.body}>
          Your plant collection and settings are stored locally on your device using
          AsyncStorage. No personal data is transmitted to external servers except for
          plant identification image requests to Pl@ntNet.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Camera &amp; Photo Library</Text>
        <Text style={styles.body}>
          Plantid requests camera and photo library access solely for the purpose of
          capturing or selecting plant images for identification. Photos are not stored
          anywhere outside your device.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Contact</Text>
        <Text style={styles.body}>
          If you have any privacy-related questions, please contact us through the app store
          listing.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.85,
  },
  section: {
    marginTop: 24,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
