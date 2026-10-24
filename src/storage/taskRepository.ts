/**
 * All SQL for tasks lives here. The rest of the app only sees Task objects.
 */
import type {Task} from '../types/task';
import {getDatabase} from './database';
import {TASK_COLUMNS, rowToTask, taskToParams} from './mappers';

const INSERT_SQL = `INSERT OR REPLACE INTO tasks (${TASK_COLUMNS.join(
  ', ',
)}) VALUES (${TASK_COLUMNS.map(() => '?').join(', ')})`;

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDatabase();
  const {rows} = await db.execute(
    'SELECT * FROM tasks ORDER BY created_at DESC',
  );
  return rows.map(rowToTask).filter((t): t is Task => t !== null);
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = await getDatabase();
  const {rows} = await db.execute('SELECT * FROM tasks WHERE id = ? LIMIT 1', [
    id,
  ]);
  return rows.length > 0 ? rowToTask(rows[0]) : null;
}

/** Inserts a new task or overwrites an existing one with the same id. */
export async function saveTask(task: Task): Promise<void> {
  const db = await getDatabase();
  await db.execute(INSERT_SQL, taskToParams(task));
}

export async function deleteTaskById(id: string): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function deleteCompletedTasks(): Promise<void> {
  const db = await getDatabase();
  await db.execute('DELETE FROM tasks WHERE completed = 1');
}
