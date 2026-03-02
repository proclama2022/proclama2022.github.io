import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';

export function useColorScheme(): 'light' | 'dark' {
  const storedScheme = useSettingsStore((state) => state.colorScheme);
  const systemScheme = useSystemColorScheme() ?? 'light';
  if (storedScheme === 'system') return systemScheme;
  return storedScheme;
}
