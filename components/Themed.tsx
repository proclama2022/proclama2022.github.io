/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

import { Text as DefaultText, View as DefaultView, TouchableOpacity as DefaultTouchableOpacity, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];
export type TouchableOpacityProps = ThemeProps & React.ComponentProps<typeof DefaultTouchableOpacity>;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}

// Re-export with custom names for convenience
export const ThemedText = Text;
export const ThemedView = View;

// ThemedCard component for profile cards
export interface ThemedCardProps extends ViewProps {
  children: React.ReactNode;
}

export function ThemedCard(props: ThemedCardProps) {
  const { style, lightColor, darkColor, children, ...otherProps } = props;
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <DefaultView
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 12,
          padding: 16,
        },
        style,
      ]}
      {...otherProps}
    >
      {children}
    </DefaultView>
  );
}

// ThemedStatCard component for individual stat cards
export interface ThemedStatCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export function ThemedStatCard(props: ThemedStatCardProps) {
  const { style, lightColor, darkColor, children, ...otherProps } = props;
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <DefaultTouchableOpacity
      style={[
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          alignItems: 'center',
        },
        style,
      ]}
      {...otherProps}
    >
      {children}
    </DefaultTouchableOpacity>
  );
}
