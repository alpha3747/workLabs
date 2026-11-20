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
  key: 'tonight' | 'tomorrow';
  label: string;
  detail: string;
  date: Date;
}

/** Hour (24h) used for "Tonight" and for rescheduling a reminder. */
export const TONIGHT_HOUR = 21;
/** Hour (24h) used for "Tomorrow". */
export const TOMORROW_HOUR = 7;

/**
 * The time a reminder is pushed to when rescheduled: 9 PM tonight, or 9 PM
 * tomorrow if it's already 9 PM or later.
 */
export function getRescheduleDate(now: Date = new Date()): Date {
  const tonight = atTime(now, TONIGHT_HOUR);
  return tonight.getTime() > now.getTime()
    ? tonight
    : atTime(addDays(now, 1), TONIGHT_HOUR);
}

/**
 * One-tap due date suggestions shown after "Pick date": Tonight at 9 PM
 * (hidden once 9 PM has passed) and Tomorrow at 7 AM.
 */
export function getQuickDueOptions(now: Date = new Date()): QuickDueOption[] {
  const options: QuickDueOption[] = [];

  const tonight = atTime(now, TONIGHT_HOUR);
  if (tonight.getTime() > now.getTime()) {
    options.push({
      key: 'tonight',
      label: 'Tonight',
      detail: formatTime(tonight),
      date: tonight,
    });
  }

  const tomorrow = atTime(addDays(now, 1), TOMORROW_HOUR);
  options.push({
    key: 'tomorrow',
    label: 'Tomorrow',
    detail: formatTime(tomorrow),
    date: tomorrow,
  });

  return options;
}
