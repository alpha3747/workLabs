export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  notes: string;
  priority: Priority;
  completed: boolean;
  /** ISO timestamps */
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  /** When the task is due. A reminder fires at this moment. */
  dueDate: string | null;
}

export interface NewTaskInput {
  title: string;
  notes?: string;
  dueDate?: string | null;
  priority?: Priority;
}

export type TaskPatch = Partial<
  Pick<Task, 'title' | 'notes' | 'priority' | 'dueDate'>
>;
