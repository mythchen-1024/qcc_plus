import type { PrimitiveTokens, ColorScale } from './tokens';

const gray: ColorScale = {
  50: '#F8FAFC',
  100: '#F1F5F9',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
};

const primary: ColorScale = {
  50: '#EFF6FF',
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
};

const success: ColorScale = {
  50: '#ECFDF3',
  100: '#D1FADF',
  200: '#A6F4C5',
  300: '#6CE9A6',
  400: '#32D583',
  500: '#12B76A',
  600: '#039855',
  700: '#027A48',
  800: '#05603A',
  900: '#054F31',
};

const warning: ColorScale = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
};

const danger: ColorScale = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
};

// Info palette reuses the primary blue hue for consistency.
const info: ColorScale = { ...primary };

export const primitives: PrimitiveTokens = {
  colorPalette: {
    gray,
    primary,
    success,
    warning,
    danger,
    info,
  },
  typography: {
    fontFamily: {
      sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      mono: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
    },
    fontSize: {
      xs: '12px',
      sm: '13px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '20px',
      '3xl': '24px',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.6,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
    24: '96px',
    32: '128px',
    48: '192px',
  },
  radius: {
    none: '0px',
    sm: '2px',
    md: '4px',
    lg: '6px',
    xl: '8px',
    full: '9999px',
  },
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(15, 23, 42, 0.08), 0 1px 1px rgba(15, 23, 42, 0.04)',
    md: '0 4px 8px rgba(15, 23, 42, 0.12), 0 2px 4px rgba(15, 23, 42, 0.08)',
    lg: '0 12px 24px rgba(15, 23, 42, 0.16), 0 6px 12px rgba(15, 23, 42, 0.12)',
  },
  border: {
    width: {
      hairline: '1px',
      thin: '1.5px',
      thick: '2px',
    },
  },
  transition: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export type PrimitiveColorPalette = typeof primitives.colorPalette;
