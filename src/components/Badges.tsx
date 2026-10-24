import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {Priority, Task} from '../types/task';
import {PRIORITY_META, colors, radius, spacing} from '../theme';
import {formatDueDate} from '../utils/date';
import {isOverdue} from '../features/tasks/taskLogic';

export function PriorityBadge({priority}: {priority: Priority}) {
  if (priority === 'none') {
    return null;
  }
  const meta = PRIORITY_META[priority];
  return (
    <View style={[styles.badge, {backgroundColor: meta.soft}]}>
      <Icon name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.text, {color: meta.color}]}>{meta.label}</Text>
    </View>
  );
}

export function DueBadge({task, now}: {task: Task; now: Date}) {
  if (!task.dueDate) {
    return null;
  }
  const overdue = isOverdue(task, now);
  const color = task.completed
    ? colors.textMuted
    : overdue
    ? colors.danger
    : colors.textSecondary;
  return (
    <View style={[styles.badge, overdue ? styles.overdue : styles.neutral]}>
      <Icon
        name={overdue ? 'alarm-note' : 'bell-outline'}
        size={12}
        color={color}
      />
      <Text style={[styles.text, {color}]}>
        {formatDueDate(task.dueDate, now)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  overdue: {backgroundColor: colors.dangerSoft},
  neutral: {backgroundColor: 'rgba(255,255,255,0.05)'},
  text: {fontSize: 12, fontWeight: '600'},
});
