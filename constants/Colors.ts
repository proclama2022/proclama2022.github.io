const PRIMARY = '#13ec8e';
const PRIMARY_DARK = '#0fc87a';
const PRIMARY_LIGHT = '#4df0aa';
const PRIMARY_MINT = '#0a9e64';
const PRIMARY_GLASS = 'rgba(19, 236, 142, 0.12)';

const BG_DARK = '#0d1117';
const BG_CARD = '#161b22';
const BG_ELEVATED = '#1c2333';
const BG_SURFACE = '#21283b';

const Colors = {
  light: {
    text: '#f0f6fc',
    textSecondary: '#8b949e',
    textMuted: '#484f58',
    textTertiary: '#30363d',
    background: BG_DARK,
    backgroundLight: '#10151c',
    surface: BG_CARD,
    surfaceGlass: 'rgba(22, 27, 34, 0.85)',
    surfaceStrong: BG_ELEVATED,
    card: BG_CARD,
    cardBackground: BG_ELEVATED,
    tint: PRIMARY,
    tintDark: PRIMARY_DARK,
    tintLight: PRIMARY_LIGHT,
    tintMint: PRIMARY_MINT,
    tintGlass: PRIMARY_GLASS,
    tabIconDefault: '#484f58',
    tabIconSelected: PRIMARY,
    border: '#30363d',
    borderLight: '#21262d',
    chipBg: '#21262d',
    chipBorder: '#30363d',
    chipActiveBg: PRIMARY_GLASS,
    chipActiveText: PRIMARY,
    searchBg: '#0d1117',
    fab: PRIMARY,
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
    heroStart: '#0a9e64',
    heroEnd: PRIMARY,
    danger: '#f85149',
    success: PRIMARY,
    warning: '#d29922',
    error: '#f85149',
  },
  dark: {
    text: '#f0f6fc',
    textSecondary: '#8b949e',
    textMuted: '#484f58',
    textTertiary: '#30363d',
    background: BG_DARK,
    backgroundLight: '#10151c',
    surface: BG_CARD,
    surfaceGlass: 'rgba(22, 27, 34, 0.85)',
    surfaceStrong: BG_ELEVATED,
    card: BG_CARD,
    cardBackground: BG_ELEVATED,
    tint: PRIMARY,
    tintDark: PRIMARY_DARK,
    tintLight: PRIMARY_LIGHT,
    tintMint: PRIMARY_MINT,
    tintGlass: PRIMARY_GLASS,
    tabIconDefault: '#484f58',
    tabIconSelected: PRIMARY,
    border: '#30363d',
    borderLight: '#21262d',
    chipBg: '#21262d',
    chipBorder: '#30363d',
    chipActiveBg: PRIMARY_GLASS,
    chipActiveText: PRIMARY,
    searchBg: '#0d1117',
    fab: PRIMARY,
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
    heroStart: '#0a9e64',
    heroEnd: PRIMARY,
    danger: '#f85149',
    success: PRIMARY,
    warning: '#d29922',
    error: '#f85149',
  },
};

export type ThemeColors = typeof Colors.light;

export default Colors;
