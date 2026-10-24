import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {PressableScale} from './PressableScale';
import {colors, radius, spacing, typography} from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  icon?: string;
  variant?: Variant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const VARIANTS: Record<Variant, {bg: string; fg: string; border: string}> = {
  primary: {bg: colors.accent, fg: colors.onAccent, border: colors.accent},
  secondary: {
    bg: colors.surfaceRaised,
    fg: colors.text,
    border: colors.borderStrong,
  },
  danger: {bg: colors.dangerSoft, fg: colors.danger, border: 'transparent'},
  ghost: {bg: 'transparent', fg: colors.textSecondary, border: 'transparent'},
};

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  style,
  accessibilityHint,
}: Props) {
  const v = VARIANTS[variant];
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{disabled}}
      style={[
        styles.base,
        {backgroundColor: v.bg, borderColor: v.border},
        disabled && styles.disabled,
        style,
      ]}>
      <View style={styles.content}>
        {icon ? <Icon name={icon} size={20} color={v.fg} /> : null}
        <Text style={[styles.label, {color: v.fg}]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {...typography.bodyStrong, fontSize: 16},
  disabled: {opacity: 0.4},
});
