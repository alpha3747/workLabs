/**
 * Converts between SQLite rows (snake_case, 0/1 booleans) and Task objects.
 * Pure functions — unit tested without a database.
 */
import type {Priority, Task} from '../types/task';
import {PRIORITIES} from '../features/tasks/taskLogic';

export type Row = Record<string, unknown>;

/** Column order used by INSERT statements. */
export const TASK_COLUMNS = [
  'id',
  'title',
  'notes',
  'priority',
  'completed',
  'created_at',
  'updated_at',
  'completed_at',
  'due_date',
] as const;

type SqlValue = string | number | null;

export function taskToParams(task: Task): SqlValue[] {
  return [
    task.id,
    task.title,
    task.notes,
    task.priority,
    task.completed ? 1 : 0,
    task.createdAt,
    task.updatedAt,
    task.completedAt,
    task.dueDate,
  ];
}

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

/** Returns null for rows that can't form a valid task. */
export function rowToTask(row: Row): Task | null {
  const id = asString(row.id);
  const title = asString(row.title);
  const createdAt = asString(row.created_at);
  if (!id || !title || !createdAt) {
    return null;
  }
  const completed = row.completed === 1 || row.completed === true;
  const priority = PRIORITIES.includes(row.priority as Priority)
    ? (row.priority as Priority)
    : 'none';

  return {
    id,
    title,
    notes: typeof row.notes === 'string' ? row.notes : '',
    priority,
    completed,
    createdAt,
    updatedAt: asString(row.updated_at) ?? createdAt,
    completedAt: completed ? asString(row.completed_at) : null,
    dueDate: asString(row.due_date),
  };
}
