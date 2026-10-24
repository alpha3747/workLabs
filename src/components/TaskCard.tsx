import React, {memo, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {Swipeable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {Task} from '../types/task';
import {PRIORITY_META, colors, radius, spacing, typography} from '../theme';
import {isOverdue} from '../features/tasks/taskLogic';
import {Checkbox} from './Checkbox';
import {DueBadge, PriorityBadge} from './Badges';
import {PressableScale} from './PressableScale';

interface Props {
  task: Task;
  now: Date;
  onPress: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (task: Task) => void;
}

type SwipeProgress = Animated.AnimatedInterpolation<number>;

function SwipeAction({
  side,
  dragX,
  icon,
  label,
  color,
}: {
  side: 'left' | 'right';
  dragX: SwipeProgress;
  icon: string;
  label: string;
  color: string;
}) {
  const scale = dragX.interpolate({
    inputRange: side === 'left' ? [0, 80] : [-80, 0],
    outputRange: side === 'left' ? [0.6, 1] : [1, 0.6],
    extrapolate: 'clamp',
  });
  return (
    <View
      style={[
        styles.action,
        {backgroundColor: color},
        side === 'left' ? styles.actionLeft : styles.actionRight,
      ]}>
      <Animated.View style={[styles.actionContent, {transform: [{scale}]}]}>
        <Icon name={icon} size={22} color="#fff" />
        <Text style={styles.actionLabel}>{label}</Text>
      </Animated.View>
    </View>
  );
}

function TaskCardComponent({task, now, onPress, onToggle, onDelete}: Props) {
  const swipeRef = useRef<Swipeable>(null);
  const overdue = isOverdue(task, now);
  const showMeta = task.dueDate !== null || task.priority !== 'none';

  return (
    <Swipeable
      ref={swipeRef}
      friction={1.8}
      leftThreshold={70}
      rightThreshold={70}
      overshootFriction={8}
      containerStyle={styles.swipeContainer}
      renderLeftActions={(_progress, dragX) => (
        <SwipeAction
          side="left"
          dragX={dragX}
          icon={task.completed ? 'restore' : 'check-bold'}
          label={task.completed ? 'Undo' : 'Done'}
          color={task.completed ? colors.info : '#12A37A'}
        />
      )}
      renderRightActions={(_progress, dragX) => (
        <SwipeAction
          side="right"
          dragX={dragX}
          icon="trash-can-outline"
          label="Delete"
          color="#D93A4A"
        />
      )}
      onSwipeableOpen={direction => {
        swipeRef.current?.close();
        if (direction === 'left') {
          onToggle(task);
        } else {
          onDelete(task);
        }
      }}>
      <PressableScale
        onPress={() => onPress(task)}
        scaleTo={0.985}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}${
          task.completed ? ', completed' : overdue ? ', overdue' : ''
        }`}
        accessibilityHint="Opens task details"
        style={[
          styles.card,
          overdue && styles.cardOverdue,
          task.completed && styles.cardCompleted,
        ]}>
        <View style={styles.checkbox}>
          <Checkbox
            checked={task.completed}
            onToggle={() => onToggle(task)}
            ringColor={
              task.priority === 'none'
                ? colors.textMuted
                : PRIORITY_META[task.priority].color
            }
            label={
              task.completed
                ? `Mark ${task.title} as not done`
                : `Mark ${task.title} as done`
            }
          />
        </View>
        <View style={styles.body}>
          <Text
            style={[styles.title, task.completed && styles.titleDone]}
            numberOfLines={2}>
            {task.title}
          </Text>
          {task.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {task.notes}
            </Text>
          ) : null}
          {showMeta ? (
            <View style={styles.meta}>
              <DueBadge task={task} now={now} />
              {!task.completed ? (
                <PriorityBadge priority={task.priority} />
              ) : null}
            </View>
          ) : null}
        </View>
        <Icon
          name="chevron-right"
          size={22}
          color={colors.textMuted}
          style={styles.chevron}
        />
      </PressableScale>
    </Swipeable>
  );
}

export const TaskCard = memo(TaskCardComponent);

const styles = StyleSheet.create({
  swipeContainer: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm + 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
  },
  cardOverdue: {borderColor: 'rgba(255,93,108,0.35)'},
  cardCompleted: {opacity: 0.6},
  checkbox: {paddingTop: 1, marginRight: spacing.md},
  body: {flex: 1, gap: 4},
  title: {...typography.bodyStrong, color: colors.text, fontSize: 16},
  titleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  notes: {fontSize: 14, color: colors.textSecondary},
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chevron: {alignSelf: 'center', marginLeft: spacing.xs},
  action: {
    flex: 1,
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  actionLeft: {alignItems: 'flex-start', paddingLeft: spacing.xxl},
  actionRight: {alignItems: 'flex-end', paddingRight: spacing.xxl},
  actionContent: {alignItems: 'center', gap: 2},
  actionLabel: {color: '#fff', fontSize: 12, fontWeight: '700'},
});
