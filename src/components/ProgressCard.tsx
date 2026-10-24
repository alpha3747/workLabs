import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {TaskStats} from '../features/tasks/taskLogic';
import {colors, radius, spacing, typography} from '../theme';

function Stat({
  icon,
  value,
  label,
  color,
  background,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
  background: string;
}) {
  return (
    <View style={[styles.stat, {backgroundColor: background}]}>
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.statValue, {color}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ProgressCard({stats}: {stats: TaskStats}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: stats.progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [stats.progress, progress]);

  const percent = Math.round(stats.progress * 100);
  const headline =
    stats.active === 0
      ? 'All clear — nice work!'
      : `${stats.active} task${stats.active === 1 ? '' : 's'} to go`;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${stats.completed} of ${stats.total} tasks done, ${percent} percent`}>
      {/* Decorative glows */}
      <View style={[styles.glow, styles.glowLarge]} />
      <View style={[styles.glow, styles.glowSmall]} />

      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <Text style={styles.overline}>Your progress</Text>
          <Text style={styles.headline}>{headline}</Text>
        </View>
        <View style={styles.percentPill}>
          <Text style={styles.percentText}>{percent}%</Text>
        </View>
      </View>

      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.caption}>
        {stats.completed} of {stats.total} completed
      </Text>

      <View style={styles.statsRow}>
        <Stat
          icon="alarm-note"
          value={stats.overdue}
          label="Overdue"
          color={stats.overdue > 0 ? colors.danger : colors.textMuted}
          background={
            stats.overdue > 0 ? colors.dangerSoft : 'rgba(255,255,255,0.04)'
          }
        />
        <Stat
          icon="calendar-today"
          value={stats.dueToday}
          label="Today"
          color={colors.warning}
          background={colors.warningSoft}
        />
        <Stat
          icon="check-circle-outline"
          value={stats.completed}
          label="Done"
          color={colors.success}
          background={colors.successSoft}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    overflow: 'hidden',
  },
  glow: {position: 'absolute', borderRadius: 999},
  glowLarge: {
    width: 220,
    height: 220,
    top: -120,
    right: -60,
    backgroundColor: colors.accentGlow,
  },
  glowSmall: {
    width: 120,
    height: 120,
    top: -50,
    right: -10,
    backgroundColor: colors.accentGlow,
  },
  headerRow: {flexDirection: 'row', alignItems: 'center'},
  flex: {flex: 1},
  overline: {...typography.overline, color: colors.accent, marginBottom: 4},
  headline: {...typography.title, color: colors.text},
  percentPill: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  percentText: {color: colors.accent, fontWeight: '800', fontSize: 15},
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginTop: spacing.lg,
    overflow: 'hidden',
  },
  fill: {height: '100%', borderRadius: 4, backgroundColor: colors.accent},
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  statsRow: {flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg},
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 2,
  },
  statValue: {fontSize: 15, fontWeight: '800'},
  statLabel: {fontSize: 12, color: colors.textSecondary, fontWeight: '600'},
});
