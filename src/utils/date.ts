/**
 * Small, dependency-free date helpers.
 *
 * Formatting is done by hand rather than with `toLocaleString` so output is
 * identical on iOS, Android and in Jest (Intl implementations differ subtly).
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function atTime(date: Date, hours: number, minutes = 0): Date {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Whole calendar days between two dates (b - a), ignoring time of day. */
export function dayDiff(a: Date, b: Date): number {
  return Math.round(
    (startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS,
  );
}

export function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "Today", "Tomorrow", "Yesterday", "Mon, Oct 27" or "Oct 27, 2027". */
export function formatDay(date: Date, now: Date = new Date()): string {
  const diff = dayDiff(now, date);
  if (diff === 0) {
    return 'Today';
  }
  if (diff === 1) {
    return 'Tomorrow';
  }
  if (diff === -1) {
    return 'Yesterday';
  }
  const base = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
  if (date.getFullYear() !== now.getFullYear()) {
    return `${base}, ${date.getFullYear()}`;
  }
  if (diff > 1 && diff < 7) {
    return WEEKDAYS_LONG[date.getDay()];
  }
  return `${WEEKDAYS[date.getDay()]}, ${base}`;
}

/** "Today, 6:00 PM" */
export function formatDueDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  return `${formatDay(date, now)}, ${formatTime(date)}`;
}

/** "Oct 24, 2026 at 10:41 PM" — used for created / completed timestamps. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${
    MONTHS[d.getMonth()]
  } ${d.getDate()}, ${d.getFullYear()} at ${formatTime(d)}`;
}

/** "Saturday, October 24" */
export function formatLongDate(date: Date): string {
  return `${WEEKDAYS_LONG[date.getDay()]}, ${
    MONTHS_LONG[date.getMonth()]
  } ${date.getDate()}`;
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) {
    return 'Working late';
  }
  if (h < 12) {
    return 'Good morning';
  }
  if (h < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export interface QuickDueOption {
  key: 'later' | 'today' | 'tomorrow' | 'nextWeek';
  label: string;
  detail: string;
  date: Date;
}

/** Rounds up to the next quarter hour. */
function roundUpToQuarter(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const remainder = d.getMinutes() % 15;
  if (remainder !== 0) {
    d.setMinutes(d.getMinutes() + (15 - remainder));
  }
  return d;
}

/**
 * One-tap due date suggestions shown in the quick-add sheet.
 * Before 5 PM "Today" means 6 PM tonight; after that it becomes "Later" (~1h).
 */
export function getQuickDueOptions(now: Date = new Date()): QuickDueOption[] {
  const options: QuickDueOption[] = [];

  if (now.getHours() < 17) {
    const tonight = atTime(now, 18);
    options.push({
      key: 'today',
      label: 'Today',
      detail: formatTime(tonight),
      date: tonight,
    });
  } else {
    const later = roundUpToQuarter(new Date(now.getTime() + 60 * 60 * 1000));
    options.push({
      key: 'later',
      label: dayDiff(now, later) === 0 ? 'Later' : 'Tonight',
      detail: formatTime(later),
      date: later,
    });
  }

  const tomorrow = atTime(addDays(now, 1), 9);
  options.push({
    key: 'tomorrow',
    label: 'Tomorrow',
    detail: formatTime(tomorrow),
    date: tomorrow,
  });

  // Next Monday (or the Monday after, if today is Monday).
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextWeek = atTime(addDays(now, daysUntilMonday), 9);
  options.push({
    key: 'nextWeek',
    label: 'Next week',
    detail: `${WEEKDAYS[nextWeek.getDay()]} ${formatTime(nextWeek)}`,
    date: nextWeek,
  });

  return options;
}
