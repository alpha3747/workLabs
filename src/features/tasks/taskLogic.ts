/**
 * Pure task logic — no React, no storage, no native modules.
 * Everything here is deterministic (pass `now` in) and covered by unit tests.
 */
import type {NewTaskInput, Priority, Task, TaskPatch} from '../../types/task';
import {dayDiff} from '../../utils/date';

export const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high'];

export const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
  none: 3,
};

export function generateId(now: Date = new Date()): string {
  return `${now.getTime().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function createTask(input: NewTaskInput, now: Date = new Date()): Task {
  const timestamp = now.toISOString();
  return {
    id: generateId(now),
    title: input.title.trim(),
    notes: (input.notes ?? '').trim(),
    priority: input.priority ?? 'none',
    completed: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: null,
    dueDate: input.dueDate ?? null,
  };
}

export function applyPatch(
  task: Task,
  patch: TaskPatch,
  now: Date = new Date(),
): Task {
  const next: Task = {...task, ...patch, updatedAt: now.toISOString()};
  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    // An empty title is never valid; keep the old one.
    next.title = trimmed.length > 0 ? trimmed : task.title;
  }
  if (patch.notes !== undefined) {
    next.notes = patch.notes.trim();
  }
  return next;
}

export function setCompleted(
  task: Task,
  completed: boolean,
  now: Date = new Date(),
): Task {
  return {
    ...task,
    completed,
    completedAt: completed ? now.toISOString() : null,
    updatedAt: now.toISOString(),
  };
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  return (
    !task.completed &&
    task.dueDate !== null &&
    new Date(task.dueDate).getTime() < now.getTime()
  );
}

/** Whether a reminder should be scheduled for this task right now. */
export function needsReminder(task: Task, now: Date = new Date()): boolean {
  return (
    !task.completed &&
    task.dueDate !== null &&
    new Date(task.dueDate).getTime() > now.getTime()
  );
}

export function matchesQuery(task: Task, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return (
    task.title.toLowerCase().includes(q) || task.notes.toLowerCase().includes(q)
  );
}

function compareActive(a: Task, b: Task): number {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }
  if (a.dueDate && !b.dueDate) {
    return -1;
  }
  if (!a.dueDate && b.dueDate) {
    return 1;
  }
  const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (byPriority !== 0) {
    return byPriority;
  }
  return a.createdAt.localeCompare(b.createdAt);
}

export type SectionKey =
  | 'overdue'
  | 'today'
  | 'tomorrow'
  | 'upcoming'
  | 'someday';

export interface TaskSection {
  key: SectionKey;
  title: string;
  data: Task[];
}

const SECTION_TITLES: Record<SectionKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
  someday: 'No date',
};

export function sectionFor(task: Task, now: Date = new Date()): SectionKey {
  if (!task.dueDate) {
    return 'someday';
  }
  if (isOverdue(task, now)) {
    return 'overdue';
  }
  const diff = dayDiff(now, new Date(task.dueDate));
  if (diff <= 0) {
    return 'today';
  }
  if (diff === 1) {
    return 'tomorrow';
  }
  return 'upcoming';
}

/** Active tasks grouped into time-based sections; empty sections are dropped. */
export function groupActiveTasks(
  tasks: Task[],
  now: Date = new Date(),
): TaskSection[] {
  const buckets: Record<SectionKey, Task[]> = {
    overdue: [],
    today: [],
    tomorrow: [],
    upcoming: [],
    someday: [],
  };
  tasks
    .filter(t => !t.completed)
    .sort(compareActive)
    .forEach(t => buckets[sectionFor(t, now)].push(t));

  return (Object.keys(buckets) as SectionKey[])
    .filter(key => buckets[key].length > 0)
    .map(key => ({key, title: SECTION_TITLES[key], data: buckets[key]}));
}

export function sortCompleted(tasks: Task[]): Task[] {
  return tasks
    .filter(t => t.completed)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

export interface TaskStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  dueToday: number;
  /** 0..1 */
  progress: number;
}

export function getStats(tasks: Task[], now: Date = new Date()): TaskStats {
  const completed = tasks.filter(t => t.completed).length;
  const overdue = tasks.filter(t => isOverdue(t, now)).length;
  const dueToday = tasks.filter(
    t =>
      !t.completed &&
      t.dueDate !== null &&
      !isOverdue(t, now) &&
      dayDiff(now, new Date(t.dueDate)) === 0,
  ).length;
  return {
    total: tasks.length,
    active: tasks.length - completed,
    completed,
    overdue,
    dueToday,
    progress: tasks.length === 0 ? 0 : completed / tasks.length,
  };
}
