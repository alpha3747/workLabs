import type {TextStyle} from 'react-native';
import type {Priority} from '../types/task';

/**
 * Design tokens for the whole app. Every color, spacing value and text style
 * used by a component should come from here so the look stays consistent.
 */
export const colors = {
  background: '#07090C',
  surface: '#0F1318',
  surfaceRaised: '#161B22',
  surfacePressed: '#1D232C',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',

  text: '#F2F5F8',
  textSecondary: '#A3ABB8',
  textMuted: '#69717F',

  accent: '#00E6CC',
  accentSoft: 'rgba(0,230,204,0.14)',
  accentGlow: 'rgba(0,230,204,0.07)',
  onAccent: '#022420',

  danger: '#FF5D6C',
  dangerSoft: 'rgba(255,93,108,0.14)',
  warning: '#FFB547',
  warningSoft: 'rgba(255,181,71,0.14)',
  success: '#34D399',
  successSoft: 'rgba(52,211,153,0.14)',
  info: '#60A5FA',
  infoSoft: 'rgba(96,165,250,0.14)',

  backdrop: 'rgba(0,0,0,0.62)',
} as const;

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
  display: {fontSize: 30, fontWeight: '800', letterSpacing: -0.6},
  title: {fontSize: 22, fontWeight: '700', letterSpacing: -0.3},
  heading: {fontSize: 17, fontWeight: '700'},
  body: {fontSize: 15, fontWeight: '400', lineHeight: 21},
  bodyStrong: {fontSize: 15, fontWeight: '600'},
  caption: {fontSize: 13, fontWeight: '500'},
  overline: {
    fontSize: 12,
    fontWeight: '700',
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
  low: {label: 'Low', color: colors.info, soft: colors.infoSoft, icon: 'flag'},
  medium: {
    label: 'Medium',
    color: colors.warning,
    soft: colors.warningSoft,
    icon: 'flag',
  },
  high: {
    label: 'High',
    color: colors.danger,
    soft: colors.dangerSoft,
    icon: 'flag',
  },
};

export const PRIORITY_OPTIONS: Priority[] = ['none', 'low', 'medium', 'high'];
