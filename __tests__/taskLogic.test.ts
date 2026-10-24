import {
  applyPatch,
  createTask,
  getStats,
  groupActiveTasks,
  isOverdue,
  matchesQuery,
  needsReminder,
  sectionFor,
  setCompleted,
  sortCompleted,
} from '../src/features/tasks/taskLogic';
import type {Task} from '../src/types/task';

// Saturday, Oct 24 2026, 2:00 PM local time
const NOW = new Date(2026, 9, 24, 14, 0);
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute).toISOString();

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    ...createTask({title: 'Task'}, NOW),
    ...overrides,
  };
}

describe('createTask', () => {
  it('trims input and fills defaults', () => {
    const task = createTask({title: '  Buy milk  ', notes: ' 2L '}, NOW);
    expect(task.title).toBe('Buy milk');
    expect(task.notes).toBe('2L');
    expect(task.priority).toBe('none');
    expect(task.completed).toBe(false);
    expect(task.dueDate).toBeNull();
    expect(task.createdAt).toBe(NOW.toISOString());
  });

  it('generates unique ids', () => {
    const ids = new Set(
      Array.from({length: 50}, () => createTask({title: 'x'}, NOW).id),
    );
    expect(ids.size).toBe(50);
  });
});

describe('applyPatch', () => {
  it('updates fields and the updatedAt timestamp', () => {
    const later = new Date(NOW.getTime() + 60_000);
    const task = applyPatch(makeTask(), {priority: 'high'}, later);
    expect(task.priority).toBe('high');
    expect(task.updatedAt).toBe(later.toISOString());
  });

  it('never allows an empty title', () => {
    const task = applyPatch(makeTask({title: 'Keep me'}), {title: '   '});
    expect(task.title).toBe('Keep me');
  });
});

describe('setCompleted', () => {
  it('stamps and clears completedAt', () => {
    const done = setCompleted(makeTask(), true, NOW);
    expect(done.completedAt).toBe(NOW.toISOString());
    expect(setCompleted(done, false, NOW).completedAt).toBeNull();
  });
});

describe('due dates', () => {
  it('detects overdue tasks', () => {
    expect(isOverdue(makeTask({dueDate: at(24, 9)}), NOW)).toBe(true);
    expect(isOverdue(makeTask({dueDate: at(24, 18)}), NOW)).toBe(false);
    expect(
      isOverdue(makeTask({dueDate: at(24, 9), completed: true}), NOW),
    ).toBe(false);
  });

  it('only needs reminders for future, open tasks', () => {
    expect(needsReminder(makeTask({dueDate: at(24, 18)}), NOW)).toBe(true);
    expect(needsReminder(makeTask({dueDate: at(24, 9)}), NOW)).toBe(false);
    expect(needsReminder(makeTask(), NOW)).toBe(false);
  });

  it('assigns sections', () => {
    expect(sectionFor(makeTask({dueDate: at(23, 9)}), NOW)).toBe('overdue');
    expect(sectionFor(makeTask({dueDate: at(24, 20)}), NOW)).toBe('today');
    expect(sectionFor(makeTask({dueDate: at(25, 9)}), NOW)).toBe('tomorrow');
    expect(sectionFor(makeTask({dueDate: at(30, 9)}), NOW)).toBe('upcoming');
    expect(sectionFor(makeTask(), NOW)).toBe('someday');
  });
});

describe('groupActiveTasks', () => {
  it('groups, orders and drops empty sections', () => {
    const tasks = [
      makeTask({id: 'someday', priority: 'low'}),
      makeTask({id: 'someday-high', priority: 'high'}),
      makeTask({id: 'late', dueDate: at(24, 20)}),
      makeTask({id: 'soon', dueDate: at(24, 16)}),
      makeTask({id: 'overdue', dueDate: at(22, 9)}),
      makeTask({id: 'done', dueDate: at(24, 16), completed: true}),
    ];
    const sections = groupActiveTasks(tasks, NOW);
    expect(sections.map(s => s.key)).toEqual(['overdue', 'today', 'someday']);
    expect(sections[1].data.map(t => t.id)).toEqual(['soon', 'late']);
    expect(sections[2].data.map(t => t.id)).toEqual([
      'someday-high',
      'someday',
    ]);
  });
});

describe('sortCompleted', () => {
  it('shows the most recently completed first', () => {
    const a = makeTask({id: 'a', completed: true, completedAt: at(20, 9)});
    const b = makeTask({id: 'b', completed: true, completedAt: at(23, 9)});
    expect(sortCompleted([a, b, makeTask()]).map(t => t.id)).toEqual([
      'b',
      'a',
    ]);
  });
});

describe('matchesQuery', () => {
  it('searches title and notes, case-insensitively', () => {
    const task = makeTask({title: 'Call Mom', notes: 'about the TRIP'});
    expect(matchesQuery(task, 'mom')).toBe(true);
    expect(matchesQuery(task, 'trip')).toBe(true);
    expect(matchesQuery(task, '  ')).toBe(true);
    expect(matchesQuery(task, 'dentist')).toBe(false);
  });
});

describe('getStats', () => {
  it('counts progress, overdue and due-today', () => {
    const stats = getStats(
      [
        makeTask({completed: true}),
        makeTask({dueDate: at(24, 9)}),
        makeTask({dueDate: at(24, 18)}),
        makeTask(),
      ],
      NOW,
    );
    expect(stats).toEqual({
      total: 4,
      active: 3,
      completed: 1,
      overdue: 1,
      dueToday: 1,
      progress: 0.25,
    });
  });

  it('handles an empty list', () => {
    expect(getStats([], NOW).progress).toBe(0);
  });
});
