import {
  formatDay,
  formatDueDate,
  formatTime,
  getQuickDueOptions,
  greeting,
} from '../src/utils/date';

const d = (day: number, hour = 12, minute = 0, month = 9, year = 2026) =>
  new Date(year, month, day, hour, minute);

// Saturday, Oct 24 2026
const NOW = d(24, 14);

describe('formatTime', () => {
  it('uses a 12-hour clock', () => {
    expect(formatTime(d(24, 0, 5))).toBe('12:05 AM');
    expect(formatTime(d(24, 9, 0))).toBe('9:00 AM');
    expect(formatTime(d(24, 12, 30))).toBe('12:30 PM');
    expect(formatTime(d(24, 18, 45))).toBe('6:45 PM');
  });
});

describe('formatDay', () => {
  it('uses relative words near today', () => {
    expect(formatDay(d(24, 20), NOW)).toBe('Today');
    expect(formatDay(d(25, 8), NOW)).toBe('Tomorrow');
    expect(formatDay(d(23, 8), NOW)).toBe('Yesterday');
  });

  it('uses weekday names within the week', () => {
    expect(formatDay(d(27), NOW)).toBe('Tuesday');
  });

  it('falls back to a short date', () => {
    expect(formatDay(d(10), NOW)).toBe('Sat, Oct 10');
    expect(formatDay(d(3, 12, 0, 0, 2027), NOW)).toBe('Jan 3, 2027');
  });
});

describe('formatDueDate', () => {
  it('combines day and time', () => {
    expect(formatDueDate(d(25, 9).toISOString(), NOW)).toBe(
      'Tomorrow, 9:00 AM',
    );
  });
});

describe('greeting', () => {
  it('matches the time of day', () => {
    expect(greeting(d(24, 8))).toBe('Good morning');
    expect(greeting(d(24, 13))).toBe('Good afternoon');
    expect(greeting(d(24, 20))).toBe('Good evening');
    expect(greeting(d(24, 2))).toBe('Working late');
  });
});

describe('getQuickDueOptions', () => {
  it('offers Today at 6 PM before 5 PM', () => {
    const [first, tomorrow, nextWeek] = getQuickDueOptions(NOW);
    expect(first.key).toBe('today');
    expect(first.date).toEqual(d(24, 18));
    expect(tomorrow.date).toEqual(d(25, 9));
    // Oct 24 2026 is a Saturday → next Monday is Oct 26
    expect(nextWeek.date).toEqual(d(26, 9));
  });

  it('offers "Later" (about an hour out) in the evening', () => {
    const [first] = getQuickDueOptions(d(24, 19, 10));
    expect(first.key).toBe('later');
    expect(first.date).toEqual(d(24, 20, 15));
  });

  it('never suggests a time in the past', () => {
    for (let hour = 0; hour < 24; hour++) {
      const now = d(24, hour, 50);
      getQuickDueOptions(now).forEach(option =>
        expect(option.date.getTime()).toBeGreaterThan(now.getTime()),
      );
    }
  });
});
