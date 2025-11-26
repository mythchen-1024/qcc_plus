// Token type definitions for the theme system.
// Organized into primitives, semantic, and component layers with TypeScript safety.

export type ColorStop = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
export type ColorScale = Record<ColorStop, string>;

export interface ColorPalette {
  gray: ColorScale;
  primary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
  info: ColorScale;
}

export interface FontFamilies {
  sans: string;
  mono: string;
}

export interface FontSizes {
  xs: string; // 12px
  sm: string; // 13px
  base: string; // 14px
  lg: string; // 16px
  xl: string; // 18px
  '2xl': string; // 20px
  '3xl': string; // 24px
}

export interface LineHeights {
  tight: number;
  normal: number;
  relaxed: number;
}

export interface FontWeights {
  regular: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface TypographyTokens {
  fontFamily: FontFamilies;
  fontSize: FontSizes;
  lineHeight: LineHeights;
  fontWeight: FontWeights;
}

export type SpacingKey = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24 | 32 | 48;
export type SpacingScale = Record<SpacingKey, string>;

export interface RadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
}

export interface BorderTokens {
  width: {
    hairline: string;
    thin: string;
    thick: string;
  };
}

export interface TransitionTokens {
  duration: {
    fast: string; // 150ms
    normal: string; // 200ms
    slow: string; // 300ms
  };
}

export interface EasingTokens {
  easeOut: string;
  easeInOut: string;
}

export interface PrimitiveTokens {
  colorPalette: ColorPalette;
  typography: TypographyTokens;
  spacing: SpacingScale;
  radius: RadiusScale;
  shadow: ShadowScale;
  border: BorderTokens;
  transition: TransitionTokens;
  easing: EasingTokens;
}

export interface SemanticTextTokens {
  primary: string;
  secondary: string;
  muted: string;
  disabled: string;
  inverse: string;
}

export interface BackgroundTokens {
  page: string;
  card: string;
  elevated: string;
  overlay: string;
}

export interface StateColorSet {
  bg: string;
  text: string;
  border: string;
}

export interface SemanticTokens {
  text: SemanticTextTokens;
  bg: BackgroundTokens;
  state: {
    success: StateColorSet;
    info: StateColorSet;
    warning: StateColorSet;
    danger: StateColorSet;
  };
  interaction: {
    hover: string;
    active: string;
    focus: string;
  };
  divider: string;
  border: {
    default: string;
    focus: string;
  };
}

export interface ButtonVariantTokens {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  activeBg: string;
  disabledBg: string;
  disabledText: string;
  focusRing: string;
}

export interface ButtonTokens {
  height: string;
  paddingX: string;
  paddingY: string;
  gap: string;
  radius: string;
  typography: {
    size: string;
    weight: number;
  };
  variants: {
    primary: ButtonVariantTokens;
    secondary: ButtonVariantTokens;
    ghost: ButtonVariantTokens;
  };
  transition: {
    duration: string;
    easing: string;
  };
}

export interface CardTokens {
  bg: string;
  text: string;
  border: string;
  shadow: string;
  radius: string;
  padding: string;
  elevated: {
    bg: string;
    shadow: string;
  };
}

export interface SidebarTokens {
  width: {
    collapsed: string;
    expanded: string;
  };
  bg: string;
  text: string;
  border: string;
  activeItemBg: string;
  activeItemText: string;
}

export interface TableTokens {
  headerBg: string;
  headerText: string;
  rowHoverBg: string;
  rowActiveBg: string;
  border: string;
  divider: string;
  radius: string;
  padding: string;
}

export interface InputTokens {
  bg: string;
  text: string;
  placeholder: string;
  border: string;
  hoverBorder: string;
  focusBorder: string;
  disabledBg: string;
  disabledText: string;
  radius: string;
  shadow: string;
}

export interface ComponentTokens {
  button: ButtonTokens;
  card: CardTokens;
  sidebar: SidebarTokens;
  table: TableTokens;
  input: InputTokens;
}

export type ThemeAppearance = 'light' | 'dark';

export interface ThemeTokens {
  mode: ThemeAppearance;
  primitives: PrimitiveTokens;
  semantic: SemanticTokens;
  components: ComponentTokens;
}
