export const COLORS = {
  background: '#0D0F14',
  surface: '#161A23',
  surfaceElevated: '#1E2330',
  border: '#252A38',
  primary: '#6C63FF',
  primaryLight: '#8B84FF',
  primaryDark: '#4A43CC',
  secondary: '#FF6584',
  accent: '#00D4AA',
  accentOrange: '#FF8C42',
  accentBlue: '#4ECDC4',
  text: '#FFFFFF',
  textSecondary: '#9BA3B8',
  textMuted: '#5A6380',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  cardGradient1: ['#6C63FF', '#4A43CC'],
  cardGradient2: ['#FF6584', '#CC3A5A'],
  cardGradient3: ['#00D4AA', '#008F74'],
  cardGradient4: ['#FF8C42', '#CC5A1A'],
  cardGradient5: ['#4ECDC4', '#2A9B94'],
  overlayDark: 'rgba(0,0,0,0.7)',
  overlayLight: 'rgba(255,255,255,0.08)',
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  semiBold: { fontFamily: 'System', fontWeight: '600' },
  bold: { fontFamily: 'System', fontWeight: '700' },
  extraBold: { fontFamily: 'System', fontWeight: '800' },
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  radius: { sm: 8, md: 12, lg: 16, xl: 20, full: 99 },
  padding: { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 },
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color = '#6C63FF') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  }),
};
