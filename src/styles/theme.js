/**
 * App Theme Configuration
 * Defines colors, spacing, typography, and other design constants
 */

const colors = {
  primary: '#4C6EF5',         // Main brand color
  primaryDark: '#364FC7',
  secondary: '#38D9A9',       // Accent color for actions
  background: '#FFFFFF',      // Main background
  surface: '#F8F9FA',         // Card backgrounds
  text: '#212529',            // Primary text
  textSecondary: '#495057',   // Secondary text
  border: '#DEE2E6',
  error: '#FA5252',
  success: '#40C057',
  warning: '#FD7E14',
  inactive: '#ADB5BD',
  recording: '#FF6B6B',       // Recording indicator
  waveform: '#4DABF7',        // Waveform color
  spectrogram: [              // Color gradient for spectrogram
    '#4a4e69',
    '#9a8c98',
    '#c9ada7',
    '#f2e9e4',
  ],
};

const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
};

const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    xs: 16,
    s: 20,
    m: 24,
    l: 28,
    xl: 32,
    xxl: 36,
  },
};

const borderRadius = {
  s: 4,
  m: 8,
  l: 16,
  xl: 24,
  round: 9999,
};

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
};
