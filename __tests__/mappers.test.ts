import {rowToTask, taskToParams, TASK_COLUMNS} from '../src/storage/mappers';
import {createTask, setCompleted} from '../src/features/tasks/taskLogic';

const NOW = new Date(2026, 9, 24, 14, 0);

describe('task <-> row mapping', () => {
  it('round-trips a task through SQL params', () => {
    const task = setCompleted(
      createTask(
        {
          title: 'Ship v1',
          notes: 'Tag the release',
          priority: 'high',
          dueDate: NOW.toISOString(),
        },
        NOW,
      ),
      true,
      NOW,
    );
    const params = taskToParams(task);
    expect(params).toHaveLength(TASK_COLUMNS.length);

    const row = Object.fromEntries(
      TASK_COLUMNS.map((column, i) => [column, params[i]]),
    );
    expect(row.completed).toBe(1);
    expect(rowToTask(row)).toEqual(task);
  });

  it('rejects rows without required fields', () => {
    expect(rowToTask({id: 'a', title: ''})).toBeNull();
    expect(rowToTask({title: 'x', created_at: NOW.toISOString()})).toBeNull();
  });

  it('sanitises unknown values', () => {
    const task = rowToTask({
      id: 'a',
      title: 'Hi',
      created_at: NOW.toISOString(),
      priority: 'urgent',
      completed: 0,
      completed_at: NOW.toISOString(),
      notes: null,
    });
    expect(task).toMatchObject({
      priority: 'none',
      completed: false,
      completedAt: null,
      notes: '',
      dueDate: null,
    });
  });
});
