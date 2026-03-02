// Theme configuration - colors, typography, spacing

export const COLORS = {
  // Primary palette - Teal/Mint accent
  primary: 'rgba(44, 232, 198, 1)',
  primaryLight: '#5DDDC3',
  primaryDark: '#2BA88E',

  // Mascot colors
  mascot: {
    body: '#3ECFB2',
    bodyDark: '#2E9E87',
    eyes: '#FFFFFF',
    pupils: '#1A1A2E',
  },

  // Background colors
  background: '#000000',
  backgroundDark: '#0A0A0A',
  backgroundCard: '#FFFFFF',
  backgroundOverlay: 'rgba(0, 0, 0, 0.6)',

  // Speech bubble
  speechBubble: '#1E3A3A',
  speechBubbleText: '#FFFFFF',

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textDark: '#1A1A2E',
  textMuted: '#6B7280',
  textTheme: '#2CE8C6',

  // Button colors
  buttonPrimary: '#3ECFB2',
  buttonOutline: '#1A1A2E',
  buttonText: '#FFFFFF',
  buttonTextDark: '#1A1A2E',

  // Neutral palette
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const TYPOGRAPHY = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 25,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
} as const;
