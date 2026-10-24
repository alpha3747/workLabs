import React, {useRef, useState} from 'react';
import {
  Animated,
  FlatList,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import type {ScreenProps} from '../navigation/types';
import {setOnboardingComplete} from '../storage/settingsRepository';
import {colors, radius, spacing, typography} from '../theme';
import {Button} from '../components/Button';

interface Slide {
  key: string;
  image: ImageSourcePropType;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'welcome',
    image: require('../../assets/onboarding/welcome.png'),
    eyebrow: 'Welcome',
    title: 'Your personal task lab',
    body: 'Plan your day, stay focused and get things done. Everything stays private on your device.',
  },
  {
    key: 'capture',
    image: require('../../assets/onboarding/capture.png'),
    eyebrow: 'Capture',
    title: 'Add a task in seconds',
    body: 'Tap +, type what you need to do and pick a time like “Tomorrow” with one tap. That’s it.',
  },
  {
    key: 'organize',
    image: require('../../assets/onboarding/organize.png'),
    eyebrow: 'Organize',
    title: 'Your day, sorted for you',
    body: 'Tasks group themselves into Overdue, Today and Upcoming. Open any task to add notes or set a priority.',
  },
  {
    key: 'remind',
    image: require('../../assets/onboarding/remind.png'),
    eyebrow: 'Remind',
    title: 'Never miss a deadline',
    body: 'Get a notification right when a task is due — and mark it done straight from the reminder.',
  },
  {
    key: 'swipe',
    image: require('../../assets/onboarding/swipe.png'),
    eyebrow: 'Gestures',
    title: 'Swipe to stay on top',
    body: 'Swipe right to complete a task, swipe left to delete it. Changed your mind? Just tap Undo.',
  },
];

export function OnboardingScreen({navigation}: ScreenProps<'Onboarding'>) {
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await setOnboardingComplete();
    navigation.replace('Home');
  };

  const next = () => {
    if (isLast) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({index: index + 1, animated: true});
  };

  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <View style={styles.topBar}>
        <Text style={styles.step}>
          {index + 1} / {SLIDES.length}
        </Text>
        {!isLast ? (
          <Pressable
            onPress={finish}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction">
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <Animated.FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {x: scrollX}}}],
          {useNativeDriver: false},
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={e =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        getItemLayout={(_, i) => ({length: width, offset: width * i, index: i})}
        renderItem={({item, index: i}) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const imageScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.85, 1, 0.85],
            extrapolate: 'clamp',
          });
          const textOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
            extrapolate: 'clamp',
          });
          return (
            <View style={[styles.slide, {width}]}>
              <View style={styles.imageWrap}>
                <View style={styles.glow} />
                <Animated.Image
                  source={item.image}
                  style={[
                    styles.image,
                    {width: width - spacing.xxl * 2},
                    {transform: [{scale: imageScale}]},
                  ]}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              </View>
              <Animated.View style={[styles.copy, {opacity: textOpacity}]}>
                <Text style={styles.eyebrow}>{item.eyebrow}</Text>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View
        style={[
          styles.footer,
          {paddingBottom: Math.max(insets.bottom, spacing.xl)},
        ]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            return (
              <Animated.View
                key={slide.key}
                style={[
                  styles.dot,
                  {
                    width: scrollX.interpolate({
                      inputRange,
                      outputRange: [8, 26, 8],
                      extrapolate: 'clamp',
                    }),
                    opacity: scrollX.interpolate({
                      inputRange,
                      outputRange: [0.3, 1, 0.3],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            );
          })}
        </View>
        <Button
          label={isLast ? 'Get started' : 'Next'}
          icon={isLast ? 'rocket-launch' : 'arrow-right'}
          onPress={next}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  step: {color: colors.textMuted, fontWeight: '700', fontSize: 13},
  skip: {color: colors.textSecondary, fontWeight: '700', fontSize: 15},
  slide: {flex: 1, paddingHorizontal: spacing.xxl},
  imageWrap: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.accentGlow,
  },
  image: {height: '90%', maxHeight: 360},
  copy: {paddingBottom: spacing.xl},
  eyebrow: {...typography.overline, color: colors.accent, marginBottom: 8},
  title: {...typography.display, fontSize: 28, color: colors.text},
  body: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  footer: {paddingHorizontal: spacing.xxl, gap: spacing.xl},
  dots: {flexDirection: 'row', gap: 6, alignItems: 'center'},
  dot: {height: 8, borderRadius: radius.pill, backgroundColor: colors.accent},
});
