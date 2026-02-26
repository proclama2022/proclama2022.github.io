import { useColorScheme } from '@/components/useColorScheme';
import Colors, { ThemeColors } from '@/constants/Colors';

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme() ?? 'light';
  return Colors[colorScheme];
}
