import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';

import {colors} from '../theme';

interface Props {
  /** Called once the intro animation has played. */
  onFinish: () => void;
}

/**
 * Animated brand intro shown while the database opens. The native launch
 * screens use the same background color, so the hand-off is seamless.
 */
export function SplashScreen({onFinish}: Props) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(120),
    ]).start(() => onFinish());
  }, [logoOpacity, logoScale, progress, onFinish]);

  return (
    <View style={styles.container} accessibilityLabel="WorkLabs is loading">
      <Animated.Image
        source={require('../../assets/images/logo.png')}
        style={[
          styles.logo,
          {opacity: logoOpacity, transform: [{scale: logoScale}]},
        ]}
        resizeMode="contain"
      />
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              transform: [
                {
                  translateX: progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-160, 0],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  logo: {width: 240, height: 150},
  track: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: {
    width: 160,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
