import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {ScreenProps} from '../navigation/types';
import type {Priority, Task} from '../types/task';
import {useTask, useTasks} from '../features/tasks/TasksContext';
import {isOverdue, sectionFor} from '../features/tasks/taskLogic';
import {
  areNotificationsEnabled,
  openNotificationSettings,
} from '../services/notifications';
import {useNow} from '../hooks/useNow';
import {formatDueDate, formatTimestamp} from '../utils/date';
import {
  PRIORITY_META,
  PRIORITY_OPTIONS,
  colors,
  radius,
  spacing,
  typography,
} from '../theme';
import {Checkbox} from '../components/Checkbox';
import {IconButton} from '../components/IconButton';
import {Button} from '../components/Button';
import {DueDatePicker} from '../components/DueDatePicker';
import {PressableScale} from '../components/PressableScale';
import {showToast} from '../components/AppToast';

const SAVE_DELAY_MS = 500;

function StatusPill({task, now}: {task: Task; now: Date}) {
  let label: string;
  let color: string;
  let background: string;
  let icon: string;

  if (task.completed) {
    [label, color, background, icon] = [
      'Completed',
      colors.success,
      colors.successSoft,
      'check-circle',
    ];
  } else if (isOverdue(task, now)) {
    [label, color, background, icon] = [
      'Overdue',
      colors.danger,
      colors.dangerSoft,
      'alarm-note',
    ];
  } else {
    const section = sectionFor(task, now);
    const labels = {
      today: 'Due today',
      tomorrow: 'Due tomorrow',
      upcoming: 'Upcoming',
      someday: 'No due date',
      overdue: 'Overdue',
    } as const;
    [label, color, background, icon] = [
      labels[section],
      colors.accent,
      colors.accentSoft,
      'progress-clock',
    ];
  }

  return (
    <View style={[styles.pill, {backgroundColor: background}]}>
      <Icon name={icon} size={14} color={color} />
      <Text style={[styles.pillText, {color}]}>{label}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <View style={styles.priorityRow} accessibilityRole="radiogroup">
      {PRIORITY_OPTIONS.map(option => {
        const meta = PRIORITY_META[option];
        const selected = option === value;
        return (
          <PressableScale
            key={option}
            onPress={() => onChange(option)}
            scaleTo={0.94}
            accessibilityRole="radio"
            accessibilityState={{checked: selected}}
            accessibilityLabel={`${meta.label} priority`}
            style={[
              styles.priorityOption,
              selected && {
                backgroundColor: meta.soft,
                borderColor: meta.color,
              },
            ]}>
            <Icon
              name={meta.icon}
              size={18}
              color={selected ? meta.color : colors.textMuted}
            />
            <Text
              style={[styles.priorityLabel, selected && {color: meta.color}]}>
              {meta.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export function TaskDetailScreen({
  navigation,
  route,
}: ScreenProps<'TaskDetail'>) {
  const {taskId} = route.params;
  const task = useTask(taskId);
  const {updateTask, setTaskCompleted, deleteTask, restoreTask} = useTasks();
  const insets = useSafeAreaInsets();
  const now = useNow();

  const [title, setTitle] = useState(task?.title ?? '');
  const [notes, setNotes] = useState(task?.notes ?? '');
  const [notificationsOn, setNotificationsOn] = useState(true);

  // Latest edits, so the unmount flush below can save without stale closures.
  const draft = useRef({title, notes});
  draft.current = {title, notes};
  const saved = useRef({title: task?.title ?? '', notes: task?.notes ?? ''});

  const flush = useCallback(() => {
    const {title: t, notes: n} = draft.current;
    const patch: {title?: string; notes?: string} = {};
    if (t.trim() && t.trim() !== saved.current.title) {
      patch.title = t;
    }
    if (n.trim() !== saved.current.notes) {
      patch.notes = n;
    }
    if (patch.title !== undefined || patch.notes !== undefined) {
      saved.current = {
        title: patch.title?.trim() ?? saved.current.title,
        notes: patch.notes?.trim() ?? saved.current.notes,
      };
      updateTask(taskId, patch);
    }
  }, [taskId, updateTask]);

  // Autosave title/notes shortly after typing stops, and on leaving.
  useEffect(() => {
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [title, notes, flush]);
  useEffect(() => flush, [flush]);

  useEffect(() => {
    if (task?.dueDate) {
      areNotificationsEnabled().then(setNotificationsOn);
    }
  }, [task?.dueDate]);

  // The task was deleted (e.g. from another screen) — leave.
  useEffect(() => {
    if (!task && navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [task, navigation]);

  if (!task) {
    return <View style={styles.screen} />;
  }

  const changeDueDate = async (iso: string | null) => {
    const status = await updateTask(task.id, {dueDate: iso});
    setNotificationsOn(status !== 'blocked');
    if (status === 'scheduled' && iso) {
      showToast('Reminder set', {text2: formatDueDate(iso)});
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete this task?', `“${task.title}” will be removed.`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const removed = deleteTask(task.id);
          navigation.goBack();
          if (removed) {
            showToast('Task deleted', {
              variant: 'danger',
              text2: removed.title,
              actionLabel: 'Undo',
              onAction: () => restoreTask(removed),
            });
          }
        },
      },
    ]);
  };

  const toggleComplete = () => {
    const completing = !task.completed;
    setTaskCompleted(task.id, completing);
    if (completing) {
      navigation.goBack();
      showToast('Nice! Task completed', {
        text2: task.title,
        actionLabel: 'Undo',
        onAction: () => setTaskCompleted(task.id, false),
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.topBar, {paddingTop: insets.top + spacing.sm}]}>
        <IconButton
          icon="chevron-left"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Back"
        />
        <StatusPill task={task} now={now} />
        <IconButton
          icon="trash-can-outline"
          onPress={confirmDelete}
          accessibilityLabel="Delete task"
          color={colors.danger}
          background={colors.dangerSoft}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <View style={styles.titleCheckbox}>
            <Checkbox
              checked={task.completed}
              onToggle={toggleComplete}
              size={30}
              ringColor={
                task.priority === 'none'
                  ? colors.textMuted
                  : PRIORITY_META[task.priority].color
              }
              label={task.completed ? 'Mark as not done' : 'Mark as done'}
            />
          </View>
          <TextInput
            style={[styles.titleInput, task.completed && styles.titleDone]}
            value={title}
            onChangeText={setTitle}
            onBlur={() => {
              if (!title.trim()) {
                setTitle(task.title);
              }
            }}
            multiline
            scrollEnabled={false}
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
            placeholder="Task title"
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.accent}
            maxLength={200}
            accessibilityLabel="Task title"
          />
        </View>

        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="Add notes, links or details…"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.accent}
          maxLength={2000}
          accessibilityLabel="Notes"
        />

        <Section title="Reminder">
          <View style={styles.dueRow}>
            <View style={styles.dueIcon}>
              <Icon
                name={task.dueDate ? 'bell-ring' : 'bell-plus-outline'}
                size={20}
                color={colors.accent}
              />
            </View>
            <View style={styles.flex}>
              <Text style={styles.dueTitle}>
                {task.dueDate
                  ? formatDueDate(task.dueDate, now)
                  : 'No due date'}
              </Text>
              <Text style={styles.dueSubtitle}>
                {task.dueDate
                  ? task.completed
                    ? 'Reminder off — task is done'
                    : isOverdue(task, now)
                    ? 'This was due — pick a new time'
                    : "You'll get a notification at this time"
                  : 'Pick a time to get reminded'}
              </Text>
            </View>
          </View>
          <DueDatePicker value={task.dueDate} onChange={changeDueDate} />
          {task.dueDate && !notificationsOn ? (
            <Pressable
              onPress={openNotificationSettings}
              style={styles.warning}
              accessibilityRole="button">
              <Icon name="bell-off-outline" size={18} color={colors.warning} />
              <Text style={styles.warningText}>
                Notifications are turned off. Tap to open Settings.
              </Text>
            </Pressable>
          ) : null}
        </Section>

        <Section title="Priority">
          <PriorityPicker
            value={task.priority}
            onChange={priority => updateTask(task.id, {priority})}
          />
        </Section>

        <Section title="Activity">
          <InfoRow
            icon="plus-circle-outline"
            label="Created"
            value={formatTimestamp(task.createdAt)}
          />
          {task.updatedAt !== task.createdAt ? (
            <InfoRow
              icon="pencil-outline"
              label="Edited"
              value={formatTimestamp(task.updatedAt)}
            />
          ) : null}
          {task.completedAt ? (
            <InfoRow
              icon="check-circle-outline"
              label="Completed"
              value={formatTimestamp(task.completedAt)}
            />
          ) : null}
        </Section>
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {paddingBottom: Math.max(insets.bottom, spacing.lg)},
        ]}>
        <Button
          label={task.completed ? 'Mark as not done' : 'Mark as complete'}
          icon={task.completed ? 'restore' : 'check-bold'}
          variant={task.completed ? 'secondary' : 'primary'}
          onPress={toggleComplete}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillText: {fontWeight: '700', fontSize: 13},
  content: {padding: spacing.xl, paddingBottom: spacing.xxxl * 2},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start'},
  titleCheckbox: {paddingTop: 6, marginRight: spacing.md},
  titleInput: {
    flex: 1,
    ...typography.title,
    fontSize: 24,
    color: colors.text,
    paddingTop: 0,
    paddingBottom: 0,
  },
  titleDone: {color: colors.textMuted, textDecorationLine: 'line-through'},
  notesInput: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginLeft: 30 + spacing.md,
    minHeight: 48,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  section: {marginTop: spacing.xxl},
  sectionTitle: {
    ...typography.overline,
    color: colors.textMuted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  dueRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  dueIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueTitle: {...typography.bodyStrong, color: colors.text},
  dueSubtitle: {fontSize: 13, color: colors.textSecondary, marginTop: 2},
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: {
    flex: 1,
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  priorityRow: {flexDirection: 'row', gap: spacing.sm},
  priorityOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  priorityLabel: {fontSize: 13, fontWeight: '600', color: colors.textSecondary},
  infoRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm},
  infoLabel: {color: colors.textSecondary, fontSize: 14, width: 80},
  infoValue: {flex: 1, color: colors.text, fontSize: 14, textAlign: 'right'},
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
});
