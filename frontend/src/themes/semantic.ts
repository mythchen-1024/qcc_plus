import { primitives } from './primitives';
import type {
  ComponentTokens,
  SemanticTokens,
  StateColorSet,
  ThemeAppearance,
  ThemeTokens,
} from './tokens';

const buildFocusRing = (color: string) => `0 0 0 3px ${color}`;

const buildComponentTokens = (semantic: SemanticTokens, mode: ThemeAppearance): ComponentTokens => {
  const isLight = mode === 'light';

  const primaryVariant = {
    bg: primitives.colorPalette.primary[600],
    text: '#FFFFFF',
    border: primitives.colorPalette.primary[600],
    hoverBg: primitives.colorPalette.primary[700],
    activeBg: primitives.colorPalette.primary[800],
    disabledBg: isLight ? primitives.colorPalette.gray[200] : primitives.colorPalette.gray[800],
    disabledText: semantic.text.disabled,
    focusRing: buildFocusRing(semantic.interaction.focus),
  };

  const secondaryVariant = {
    bg: semantic.bg.card,
    text: semantic.text.primary,
    border: semantic.border.default,
    hoverBg: isLight ? primitives.colorPalette.gray[100] : 'rgba(255, 255, 255, 0.04)',
    activeBg: isLight ? primitives.colorPalette.gray[200] : 'rgba(255, 255, 255, 0.08)',
    disabledBg: isLight ? primitives.colorPalette.gray[100] : primitives.colorPalette.gray[800],
    disabledText: semantic.text.disabled,
    focusRing: buildFocusRing(semantic.interaction.focus),
  };

  const ghostVariant = {
    bg: 'transparent',
    text: primitives.colorPalette.primary[600],
    border: 'transparent',
    hoverBg: isLight ? primitives.colorPalette.primary[50] : 'rgba(59, 130, 246, 0.12)',
    activeBg: isLight ? primitives.colorPalette.primary[100] : 'rgba(59, 130, 246, 0.16)',
    disabledBg: 'transparent',
    disabledText: semantic.text.disabled,
    focusRing: buildFocusRing(semantic.interaction.focus),
  };

  return {
    button: {
      height: '40px',
      paddingX: primitives.spacing[3],
      paddingY: primitives.spacing[2],
      gap: primitives.spacing[2],
      radius: primitives.radius.md,
      typography: {
        size: primitives.typography.fontSize.base,
        weight: primitives.typography.fontWeight.semibold,
      },
      variants: {
        primary: primaryVariant,
        secondary: secondaryVariant,
        ghost: ghostVariant,
      },
      transition: {
        duration: primitives.transition.duration.normal,
        easing: primitives.easing.easeInOut,
      },
    },
    card: {
      bg: semantic.bg.card,
      text: semantic.text.primary,
      border: semantic.border.default,
      shadow: isLight ? primitives.shadow.sm : primitives.shadow.md,
      radius: primitives.radius.lg,
      padding: primitives.spacing[4],
      elevated: {
        bg: semantic.bg.elevated,
        shadow: isLight ? primitives.shadow.md : primitives.shadow.lg,
      },
    },
    sidebar: {
      width: {
        collapsed: '72px',
        expanded: '256px',
      },
      bg: isLight ? '#FFFFFF' : primitives.colorPalette.gray[900],
      text: semantic.text.primary,
      border: semantic.border.default,
      activeItemBg: isLight
        ? primitives.colorPalette.primary[50]
        : 'rgba(59, 130, 246, 0.16)',
      activeItemText: isLight ? primitives.colorPalette.primary[700] : '#FFFFFF',
    },
    table: {
      headerBg: semantic.bg.elevated,
      headerText: semantic.text.secondary,
      rowHoverBg: semantic.interaction.hover,
      rowActiveBg: semantic.interaction.active,
      border: semantic.border.default,
      divider: semantic.divider,
      radius: primitives.radius.md,
      padding: primitives.spacing[3],
    },
    input: {
      bg: semantic.bg.card,
      text: semantic.text.primary,
      placeholder: semantic.text.muted,
      border: semantic.border.default,
      hoverBorder: semantic.border.default,
      focusBorder: semantic.border.focus,
      disabledBg: isLight ? primitives.colorPalette.gray[100] : primitives.colorPalette.gray[800],
      disabledText: semantic.text.disabled,
      radius: primitives.radius.md,
      shadow: isLight ? primitives.shadow.sm : primitives.shadow.none,
    },
  };
};

const overlayLight = 'rgba(15, 23, 42, 0.48)';
const overlayDark = 'rgba(0, 0, 0, 0.55)';

const buildState = (tone: typeof primitives.colorPalette.success, mode: ThemeAppearance): StateColorSet =>
  mode === 'light'
    ? {
        bg: tone[50],
        text: tone[700],
        border: tone[200],
      }
    : {
        bg: tone[900],
        text: tone[100],
        border: tone[700],
      };

export const lightSemanticTokens: SemanticTokens = {
  text: {
    primary: primitives.colorPalette.gray[900],
    secondary: primitives.colorPalette.gray[700],
    muted: primitives.colorPalette.gray[500],
    disabled: primitives.colorPalette.gray[400],
    inverse: '#FFFFFF',
  },
  bg: {
    page: primitives.colorPalette.gray[50],
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: overlayLight,
  },
  state: {
    success: buildState(primitives.colorPalette.success, 'light'),
    info: buildState(primitives.colorPalette.info, 'light'),
    warning: buildState(primitives.colorPalette.warning, 'light'),
    danger: buildState(primitives.colorPalette.danger, 'light'),
  },
  interaction: {
    hover: primitives.colorPalette.primary[50],
    active: primitives.colorPalette.primary[100],
    focus: primitives.colorPalette.primary[300],
  },
  divider: primitives.colorPalette.gray[200],
  border: {
    default: primitives.colorPalette.gray[300],
    focus: primitives.colorPalette.primary[500],
  },
};

export const darkSemanticTokens: SemanticTokens = {
  text: {
    primary: primitives.colorPalette.gray[50],
    secondary: primitives.colorPalette.gray[300],
    muted: primitives.colorPalette.gray[500],
    disabled: primitives.colorPalette.gray[600],
    inverse: primitives.colorPalette.gray[900],
  },
  bg: {
    page: '#0B1220',
    card: '#0F172A',
    elevated: '#111827',
    overlay: overlayDark,
  },
  state: {
    success: buildState(primitives.colorPalette.success, 'dark'),
    info: buildState(primitives.colorPalette.info, 'dark'),
    warning: buildState(primitives.colorPalette.warning, 'dark'),
    danger: buildState(primitives.colorPalette.danger, 'dark'),
  },
  interaction: {
    hover: 'rgba(59, 130, 246, 0.12)',
    active: 'rgba(59, 130, 246, 0.18)',
    focus: primitives.colorPalette.primary[400],
  },
  divider: primitives.colorPalette.gray[700],
  border: {
    default: primitives.colorPalette.gray[700],
    focus: primitives.colorPalette.primary[400],
  },
};

export const lightComponentTokens = buildComponentTokens(lightSemanticTokens, 'light');
export const darkComponentTokens = buildComponentTokens(darkSemanticTokens, 'dark');

export const lightThemeTokens: ThemeTokens = {
  mode: 'light',
  primitives,
  semantic: lightSemanticTokens,
  components: lightComponentTokens,
};

export const darkThemeTokens: ThemeTokens = {
  mode: 'dark',
  primitives,
  semantic: darkSemanticTokens,
  components: darkComponentTokens,
};
