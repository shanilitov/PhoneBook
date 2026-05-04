// Color palette
export const COLORS = {
  // Primary
  primary: '#6C63FF',
  primaryDark: '#4B44CC',
  primaryLight: '#9D97FF',

  // Background
  background: '#1a1a2e',
  backgroundCard: '#16213e',
  backgroundLight: '#0f3460',

  // Surface
  surface: '#1e2a45',
  surfaceLight: '#253554',

  // Accent
  accent: '#e94560',
  accentGreen: '#43B89C',
  accentYellow: '#F7B731',
  accentPink: '#FF6584',

  // Text
  text: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#718096',
  textDark: '#1a1a2e',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  border: '#2D3748',
  overlay: 'rgba(0,0,0,0.6)',

  // Status
  success: '#48BB78',
  warning: '#ECC94B',
  error: '#FC8181',

  // Reader
  readerBg: '#F5F0E8',
  readerText: '#2D3748',
};

// Typography
export const FONTS = {
  regular: { fontWeight: '400' },
  medium: { fontWeight: '500' },
  semiBold: { fontWeight: '600' },
  bold: { fontWeight: '700' },
  extraBold: { fontWeight: '800' },
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// Border radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  colored: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }),
};

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  SPACING,
  RADIUS,
  SHADOWS,
};
