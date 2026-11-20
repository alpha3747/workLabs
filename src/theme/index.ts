import type {TextStyle} from 'react-native';
import type {Priority} from '../types/task';

/**
 * Design tokens for the whole app. Every color, spacing value and text style
 * used by a component should come from here so the look stays consistent.
 */
export const colors = {
  background: '#0B0B0C',
  surface: '#141415',
  surfaceRaised: '#1C1C1E',
  surfacePressed: '#242427',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  text: '#F4F4F5',
  textSecondary: '#A1A1A6',
  textMuted: '#6B6B70',

  // The one accent (teal) — used sparingly: FAB, checkmarks, selected state.
  accent: '#19C3B1',
  accentSoft: 'rgba(25,195,177,0.14)',
  accentGlow: 'rgba(255,255,255,0.04)',
  onAccent: '#04201C',

  // Red is reserved for overdue / destructive things.
  danger: '#F2555F',
  dangerSoft: 'rgba(242,85,95,0.14)',

  // Everything else stays neutral on purpose.
  warning: '#A1A1A6',
  warningSoft: 'rgba(255,255,255,0.06)',
  success: '#A1A1A6',
  successSoft: 'rgba(255,255,255,0.06)',
  info: '#A1A1A6',
  infoSoft: 'rgba(255,255,255,0.06)',

  backdrop: 'rgba(0,0,0,0.6)',
} as const;

export const fontFamily = 'Manrope';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
} as const;

export const typography = {
  display: {fontFamily, fontSize: 30, fontWeight: '400', letterSpacing: -0.6},
  title: {fontFamily, fontSize: 22, fontWeight: '400', letterSpacing: -0.3},
  heading: {fontFamily, fontSize: 17, fontWeight: '400'},
  body: {fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 21},
  bodyStrong: {fontFamily, fontSize: 15, fontWeight: '400'},
  caption: {fontFamily, fontSize: 13, fontWeight: '400'},
  overline: {
    fontFamily,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type IconName = string;

export const PRIORITY_META: Record<
  Priority,
  {label: string; color: string; soft: string; icon: IconName}
> = {
  none: {
    label: 'None',
    color: colors.textMuted,
    soft: 'rgba(255,255,255,0.06)',
    icon: 'flag-outline',
  },
  low: {
    label: 'Low',
    color: colors.textSecondary,
    soft: 'rgba(255,255,255,0.06)',
    icon: 'flag-outline',
  },
  medium: {
    label: 'Medium',
    color: colors.textSecondary,
    soft: 'rgba(255,255,255,0.08)',
    icon: 'flag',
  },
  high: {
    label: 'High',
    color: colors.text,
    soft: 'rgba(255,255,255,0.12)',
    icon: 'flag',
  },
};

export const PRIORITY_OPTIONS: Priority[] = ['none', 'low', 'medium', 'high'];
