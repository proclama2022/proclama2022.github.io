import { StyleSheet } from 'react-native';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';
import Onboarding from '@/components/Onboarding';
import { useOnboardingStore } from '@/stores/onboardingStore';

export default function HomeScreen() {
  const hasSeenOnboarding = useOnboardingStore(state => state.hasSeenOnboarding);

  if (!hasSeenOnboarding) {
    return <Onboarding />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Plants</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/(tabs)/index.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
