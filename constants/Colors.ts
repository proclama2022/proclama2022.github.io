const tintColorLight = '#2e7d32';
const tintColorDark = '#66bb6a';

const Colors = {
  light: {
    text: '#1a1a1a',
    textSecondary: '#666',
    textMuted: '#999',
    background: '#f5f5f5',
    surface: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    border: '#eee',
    borderLight: '#f0f0f0',
    card: '#fff',
    chipBg: '#f0f0f0',
    chipBorder: '#e0e0e0',
    chipActiveBg: '#e8f5e9',
    chipActiveText: '#2e7d32',
    searchBg: '#f5f5f5',
    fab: '#2e7d32',
    danger: '#c62828',
    success: '#2e7d32',
    warning: '#f57c00',
  },
  dark: {
    text: '#f5f5f5',
    textSecondary: '#aaa',
    textMuted: '#777',
    background: '#121212',
    surface: '#1e1e1e',
    tint: tintColorDark,
    tabIconDefault: '#666',
    tabIconSelected: tintColorDark,
    border: '#333',
    borderLight: '#2a2a2a',
    card: '#1e1e1e',
    chipBg: '#2a2a2a',
    chipBorder: '#444',
    chipActiveBg: '#1b3a1b',
    chipActiveText: '#66bb6a',
    searchBg: '#2a2a2a',
    fab: '#2e7d32',
    danger: '#ef5350',
    success: '#66bb6a',
    warning: '#ffa726',
  },
};

export type ThemeColors = typeof Colors.light;

export default Colors;
