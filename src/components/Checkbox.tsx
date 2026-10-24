import React, {useEffect, useRef} from 'react';
import {Animated, Pressable, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {colors} from '../theme';

interface Props {
  checked: boolean;
  onToggle: () => void;
  /** Ring color while unchecked (used to hint the task's priority). */
  ringColor?: string;
  size?: number;
  label: string;
}

export function Checkbox({
  checked,
  onToggle,
  ringColor = colors.textMuted,
  size = 26,
  label,
}: Props) {
  const progress = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 12,
    }).start();
  }, [checked, progress]);

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={12}
      accessibilityRole="checkbox"
      accessibilityState={{checked}}
      accessibilityLabel={label}>
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: checked ? colors.accent : ringColor,
          },
        ]}>
        <Animated.View
          style={[
            styles.fill,
            {
              borderRadius: size / 2,
              opacity: progress,
              transform: [{scale: progress}],
            },
          ]}>
          <Icon name="check-bold" size={size * 0.58} color={colors.onAccent} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    margin: -2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
