import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import type {ScreenProps} from '../navigation/types';
import type {NewTaskInput, Task} from '../types/task';
import {useTasks} from '../features/tasks/TasksContext';
import {
  getStats,
  groupActiveTasks,
  matchesQuery,
  sortCompleted,
} from '../features/tasks/taskLogic';
import {useNow} from '../hooks/useNow';
import {formatDueDate, formatLongDate, greeting} from '../utils/date';
import {colors, radius, spacing, typography} from '../theme';
import {TaskCard} from '../components/TaskCard';
import {ProgressCard} from '../components/ProgressCard';
import {SearchBar} from '../components/SearchBar';
import {SegmentedControl} from '../components/SegmentedControl';
import {EmptyState} from '../components/EmptyState';
import {QuickAddSheet} from '../components/QuickAddSheet';
import {PressableScale} from '../components/PressableScale';
import {showToast} from '../components/AppToast';

type Tab = 'active' | 'completed';

interface ListSection {
  key: string;
  title: string;
  data: Task[];
}

export function HomeScreen({navigation}: ScreenProps<'Home'>) {
  const insets = useSafeAreaInsets();
  const now = useNow();
  const {
    tasks,
    isLoaded,
    addTask,
    setTaskCompleted,
    deleteTask,
    restoreTask,
    clearCompleted,
  } = useTasks();
  const [tab, setTab] = useState<Tab>('active');
  const [query, setQuery] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);

  const stats = useMemo(() => getStats(tasks, now), [tasks, now]);
  const filtered = useMemo(
    () => tasks.filter(t => matchesQuery(t, query)),
    [tasks, query],
  );
  const activeCount = filtered.filter(t => !t.completed).length;
  const completedCount = filtered.length - activeCount;

  const sections: ListSection[] = useMemo(() => {
    if (tab === 'active') {
      return groupActiveTasks(filtered, now);
    }
    const done = sortCompleted(filtered);
    return done.length > 0
      ? [{key: 'completed', title: 'Completed', data: done}]
      : [];
  }, [tab, filtered, now]);

  // ---- actions -----------------------------------------------------------

  const handleAdd = useCallback(
    async (input: NewTaskInput) => {
      const {reminder} = await addTask(input);
      if (reminder === 'blocked') {
        showToast('Task added, but reminders are off', {
          variant: 'warning',
          text2: 'Allow notifications in Settings to get reminded.',
        });
      } else if (reminder === 'scheduled' && input.dueDate) {
        showToast('Task added', {
          text2: `We'll remind you ${formatDueDate(input.dueDate)}`,
        });
      } else {
        showToast('Task added');
      }
    },
    [addTask],
  );

  const handleToggle = useCallback(
    (task: Task) => {
      const completing = !task.completed;
      setTaskCompleted(task.id, completing);
      if (completing) {
        showToast('Nice! Task completed', {
          text2: task.title,
          actionLabel: 'Undo',
          onAction: () => setTaskCompleted(task.id, false),
        });
      }
    },
    [setTaskCompleted],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      const removed = deleteTask(task.id);
      if (removed) {
        showToast('Task deleted', {
          variant: 'danger',
          text2: removed.title,
          actionLabel: 'Undo',
          onAction: () => restoreTask(removed),
        });
      }
    },
    [deleteTask, restoreTask],
  );

  const handleOpen = useCallback(
    (task: Task) => navigation.navigate('TaskDetail', {taskId: task.id}),
    [navigation],
  );

  const handleClearCompleted = () => {
    Alert.alert(
      'Clear completed tasks?',
      `${stats.completed} completed task${
        stats.completed === 1 ? '' : 's'
      } will be deleted.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            const removed = clearCompleted();
            showToast(`Cleared ${removed.length} tasks`, {
              variant: 'danger',
              actionLabel: 'Undo',
              onAction: () => removed.forEach(restoreTask),
            });
          },
        },
      ],
    );
  };

  // ---- rendering ---------------------------------------------------------

  const header = (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.date}>{formatLongDate(now)}</Text>
          <Text style={styles.greeting}>{greeting(now)}</Text>
        </View>
        <View style={styles.logoBadge}>
          <Image
            source={require('../../assets/images/logo-mark.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>

      {tasks.length > 0 ? <ProgressCard stats={stats} /> : null}

      <SearchBar value={query} onChangeText={setQuery} />
      <SegmentedControl<Tab>
        segments={[
          {key: 'active', label: 'To do', count: activeCount},
          {key: 'completed', label: 'Completed', count: completedCount},
        ]}
        selected={tab}
        onChange={setTab}
      />
    </View>
  );

  const empty = !isLoaded ? null : query.trim() ? (
    <EmptyState
      icon="text-search"
      title="No matches"
      message={`Nothing found for “${query.trim()}”. Try another word.`}
    />
  ) : tab === 'completed' ? (
    <EmptyState
      icon="check-decagram-outline"
      title="Nothing completed yet"
      message="Finished tasks will show up here. Tap the circle on a task to complete it."
    />
  ) : tasks.length === 0 ? (
    <EmptyState
      icon="flask-outline"
      title="Your lab is empty"
      message="Tap the + button to capture your first task. Add a due date and we'll remind you."
    />
  ) : (
    <EmptyState
      icon="party-popper"
      title="All caught up"
      message="Every task is done. Enjoy the free time — or add something new."
    />
  );

  return (
    <View style={[styles.screen, {paddingTop: insets.top}]}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        stickySectionHeadersEnabled={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {paddingBottom: insets.bottom + 120},
        ]}
        renderSectionHeader={({section}) => (
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                section.key === 'overdue' && styles.sectionTitleDanger,
              ]}>
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>{section.data.length}</Text>
            <View style={styles.flex} />
            {section.key === 'completed' ? (
              <Pressable
                onPress={handleClearCompleted}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Clear all completed tasks">
                <Text style={styles.clear}>Clear all</Text>
              </Pressable>
            ) : null}
          </View>
        )}
        renderItem={({item}) => (
          <TaskCard
            task={item}
            now={now}
            onPress={handleOpen}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
        ListFooterComponent={
          sections.length > 0 ? (
            <Text style={styles.hint}>
              Swipe right to complete · swipe left to delete
            </Text>
          ) : null
        }
      />

      <PressableScale
        onPress={() => setSheetVisible(true)}
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel="Add a task"
        style={[styles.fab, {bottom: insets.bottom + spacing.xl}]}>
        <Icon name="plus" size={30} color={colors.onAccent} />
      </PressableScale>

      <QuickAddSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSubmit={handleAdd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: colors.background},
  flex: {flex: 1},
  listContent: {paddingHorizontal: spacing.xl},
  header: {gap: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.xs},
  topRow: {flexDirection: 'row', alignItems: 'center'},
  date: {...typography.overline, color: colors.textMuted, marginBottom: 4},
  greeting: {...typography.display, color: colors.text},
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {width: 30, height: 30},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  sectionTitle: {...typography.heading, color: colors.text},
  sectionTitleDanger: {color: colors.danger},
  sectionCount: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  clear: {color: colors.danger, fontWeight: '700', fontSize: 14},
  hint: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 6},
    elevation: 10,
  },
});
