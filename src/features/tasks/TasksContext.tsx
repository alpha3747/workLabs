/**
 * App-wide task state.
 *
 * React state is the source of truth for the UI and is updated optimistically;
 * every change is then written to SQLite (one row at a time) and the matching
 * reminder is scheduled or cancelled.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {AppState, LayoutAnimation} from 'react-native';
import notifee from '@notifee/react-native';

import type {NewTaskInput, Task, TaskPatch} from '../../types/task';
import * as repo from '../../storage/taskRepository';
import {
  cancelReminder,
  requestNotificationPermission,
  scheduleReminder,
  syncReminders,
} from '../../services/notifications';
import {applyPatch, createTask, needsReminder, setCompleted} from './taskLogic';
import {handleNotificationEvent} from './notificationActions';

export type ReminderStatus = 'none' | 'scheduled' | 'blocked';

interface TasksContextValue {
  tasks: Task[];
  isLoaded: boolean;
  addTask: (
    input: NewTaskInput,
  ) => Promise<{task: Task; reminder: ReminderStatus}>;
  updateTask: (id: string, patch: TaskPatch) => Promise<ReminderStatus>;
  setTaskCompleted: (id: string, completed: boolean) => void;
  deleteTask: (id: string) => Task | undefined;
  restoreTask: (task: Task) => void;
  clearCompleted: () => Task[];
}

const TasksContext = createContext<TasksContextValue | null>(null);

function animateNextLayout() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'),
  );
}

/** Runs a database write without blocking the UI; logs failures in dev. */
function persist(action: string, write: Promise<void>) {
  write.catch(error => {
    if (__DEV__) {
      console.warn(`[tasks] Failed to ${action}`, error);
    }
  });
}

export function TasksProvider({children}: {children: React.ReactNode}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setLoaded] = useState(false);
  // Mirrors `tasks` so callbacks always read the latest list without
  // being re-created on every change.
  const tasksRef = useRef<Task[]>([]);

  const setList = useCallback((next: Task[], animate = true) => {
    if (animate) {
      animateNextLayout();
    }
    tasksRef.current = next;
    setTasks(next);
  }, []);

  const reload = useCallback(async () => {
    try {
      const stored = await repo.getAllTasks();
      setList(stored, false);
      return stored;
    } catch (error) {
      if (__DEV__) {
        console.warn('[tasks] Failed to load tasks', error);
      }
      return tasksRef.current;
    } finally {
      setLoaded(true);
    }
  }, [setList]);

  useEffect(() => {
    reload().then(syncReminders);

    // Pick up changes made while backgrounded (e.g. "Mark as done" on a reminder).
    const appStateSub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        reload();
      }
    });
    const unsubscribeNotifee = notifee.onForegroundEvent(async event => {
      if (await handleNotificationEvent(event)) {
        reload();
      }
    });

    return () => {
      appStateSub.remove();
      unsubscribeNotifee();
    };
  }, [reload]);

  /** Schedules a reminder, asking for permission the first time it matters. */
  const ensureReminder = useCallback(
    async (task: Task): Promise<ReminderStatus> => {
      if (!needsReminder(task)) {
        await cancelReminder(task.id);
        return 'none';
      }
      // Only prompts the first time; afterwards it just reports the status,
      // so it also notices if the user enabled notifications in Settings.
      const allowed = await requestNotificationPermission();
      if (!allowed) {
        return 'blocked';
      }
      await scheduleReminder(task);
      return 'scheduled';
    },
    [],
  );

  const replaceTask = useCallback(
    (updated: Task, animate: boolean) => {
      setList(
        tasksRef.current.map(t => (t.id === updated.id ? updated : t)),
        animate,
      );
      persist('save task', repo.saveTask(updated));
    },
    [setList],
  );

  const addTask = useCallback(
    async (input: NewTaskInput) => {
      const task = createTask(input);
      setList([task, ...tasksRef.current]);
      persist('add task', repo.saveTask(task));
      const reminder = await ensureReminder(task);
      return {task, reminder};
    },
    [setList, ensureReminder],
  );

  const updateTask = useCallback(
    async (id: string, patch: TaskPatch): Promise<ReminderStatus> => {
      const current = tasksRef.current.find(t => t.id === id);
      if (!current) {
        return 'none';
      }
      const updated = applyPatch(current, patch);
      replaceTask(updated, false);
      // Title shows in the notification, so reschedule when it changes too.
      if (patch.dueDate !== undefined || patch.title !== undefined) {
        return ensureReminder(updated);
      }
      return needsReminder(updated) ? 'scheduled' : 'none';
    },
    [replaceTask, ensureReminder],
  );

  const setTaskCompleted = useCallback(
    (id: string, completed: boolean) => {
      const current = tasksRef.current.find(t => t.id === id);
      if (!current || current.completed === completed) {
        return;
      }
      const updated = setCompleted(current, completed);
      replaceTask(updated, true);
      if (completed) {
        cancelReminder(id);
      } else {
        ensureReminder(updated);
      }
    },
    [replaceTask, ensureReminder],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const removed = tasksRef.current.find(t => t.id === id);
      if (removed) {
        setList(tasksRef.current.filter(t => t.id !== id));
        persist('delete task', repo.deleteTaskById(id));
        cancelReminder(id);
      }
      return removed;
    },
    [setList],
  );

  const restoreTask = useCallback(
    (task: Task) => {
      if (tasksRef.current.some(t => t.id === task.id)) {
        return;
      }
      setList([task, ...tasksRef.current]);
      persist('restore task', repo.saveTask(task));
      ensureReminder(task);
    },
    [setList, ensureReminder],
  );

  const clearCompleted = useCallback(() => {
    const removed = tasksRef.current.filter(t => t.completed);
    if (removed.length > 0) {
      setList(tasksRef.current.filter(t => !t.completed));
      persist('clear completed tasks', repo.deleteCompletedTasks());
    }
    return removed;
  }, [setList]);

  const value = useMemo(
    () => ({
      tasks,
      isLoaded,
      addTask,
      updateTask,
      setTaskCompleted,
      deleteTask,
      restoreTask,
      clearCompleted,
    }),
    [
      tasks,
      isLoaded,
      addTask,
      updateTask,
      setTaskCompleted,
      deleteTask,
      restoreTask,
      clearCompleted,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext);
  if (!ctx) {
    throw new Error('useTasks must be used inside <TasksProvider>');
  }
  return ctx;
}

/** Subscribes to a single task; re-renders when it changes. */
export function useTask(id: string): Task | undefined {
  const {tasks} = useTasks();
  return useMemo(() => tasks.find(t => t.id === id), [tasks, id]);
}
