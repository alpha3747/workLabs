import React from 'react';
import {StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {PressableScale} from './PressableScale';
import {colors, radius} from '../theme';

interface Props {
  icon: string;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  background?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  color = colors.text,
  background = colors.surfaceRaised,
  size = 42,
  style,
}: Props) {
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={6}
      scaleTo={0.9}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {width: size, height: size, backgroundColor: background},
        style,
      ]}>
      <Icon name={icon} size={size * 0.52} color={color} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
