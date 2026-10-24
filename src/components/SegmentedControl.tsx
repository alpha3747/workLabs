import React, {useEffect, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../theme';

export interface Segment<K extends string> {
  key: K;
  label: string;
  count?: number;
}

interface Props<K extends string> {
  segments: Segment<K>[];
  selected: K;
  onChange: (key: K) => void;
}

/** Tabs with a sliding highlight behind the selected segment. */
export function SegmentedControl<K extends string>({
  segments,
  selected,
  onChange,
}: Props<K>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    segments.findIndex(s => s.key === selected),
  );
  const translate = useRef(new Animated.Value(0)).current;
  const segmentWidth = width / segments.length;

  useEffect(() => {
    Animated.spring(translate, {
      toValue: index * segmentWidth,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [index, segmentWidth, translate]);

  return (
    <View
      style={styles.container}
      accessibilityRole="tablist"
      onLayout={e => setWidth(e.nativeEvent.layout.width - 8)}>
      {width > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {width: segmentWidth, transform: [{translateX: translate}]},
          ]}
        />
      ) : null}
      {segments.map(segment => {
        const active = segment.key === selected;
        return (
          <Pressable
            key={segment.key}
            style={styles.segment}
            onPress={() => onChange(segment.key)}
            accessibilityRole="tab"
            accessibilityState={{selected: active}}>
            <Text style={[styles.label, active && styles.labelActive]}>
              {segment.label}
            </Text>
            {segment.count !== undefined ? (
              <View style={[styles.count, active && styles.countActive]}>
                <Text
                  style={[styles.countText, active && styles.countTextActive]}>
                  {segment.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
  },
  label: {color: colors.textSecondary, fontWeight: '600', fontSize: 14},
  labelActive: {color: colors.text},
  count: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  countActive: {backgroundColor: colors.accentSoft},
  countText: {color: colors.textMuted, fontSize: 12, fontWeight: '700'},
  countTextActive: {color: colors.accent},
});
