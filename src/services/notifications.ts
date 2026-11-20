/**
 * Local reminder notifications (Notifee).
 *
 * Each task's reminder uses the task id as its notification id, so scheduling
 * again replaces the old reminder and cancelling by task id always works.
 */
import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  TriggerType,
  type Notification,
  type TimestampTrigger,
} from '@notifee/react-native';
import {Linking, Platform} from 'react-native';

import type {Task} from '../types/task';
import {needsReminder} from '../features/tasks/taskLogic';
import {formatTime, getRescheduleDate} from '../utils/date';
import {colors} from '../theme';

export const CHANNEL_ID = 'task-reminders';
export const CATEGORY_ID = 'task-reminder';
export const ACTION_COMPLETE = 'complete';
export const ACTION_RESCHEDULE = 'reschedule';

let setupPromise: Promise<void> | null = null;

function logError(message: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[notifications] ${message}`, error);
  }
}

/** Creates the Android channel / iOS category once per app launch. */
export function setupNotifications(): Promise<void> {
  if (!setupPromise) {
    setupPromise = (async () => {
      if (Platform.OS === 'android') {
        await notifee.createChannel({
          id: CHANNEL_ID,
          name: 'Task reminders',
          description: 'Alerts when a task is due',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      } else {
        await notifee.setNotificationCategories([
          {
            id: CATEGORY_ID,
            actions: [
              {id: ACTION_COMPLETE, title: 'Mark as done'},
              {id: ACTION_RESCHEDULE, title: 'Reschedule to 9 PM'},
            ],
          },
        ]);
      }
    })().catch(error => {
      setupPromise = null;
      logError('Setup failed', error);
    });
  }
  return setupPromise;
}

/** Asks for permission (iOS + Android 13+). Resolves to whether we may notify. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch (error) {
    logError('Permission request failed', error);
    return false;
  }
}

/** Checks the current permission without prompting. */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
  } catch {
    return false;
  }
}

export async function openNotificationSettings(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.openNotificationSettings(CHANNEL_ID);
  } else {
    await Linking.openSettings();
  }
}

/** "9 PM" when it lands today, "tomorrow 9 PM" when 9 PM already passed. */
function rescheduleLabel(date: Date): string {
  const sameDay = date.toDateString() === new Date().toDateString();
  return `Reschedule to ${sameDay ? '' : 'tomorrow '}${formatTime(date).replace(
    ':00',
    '',
  )}`;
}

/** Tells the user where a rescheduled task landed. */
export async function confirmReschedule(task: Task, when: Date): Promise<void> {
  try {
    await setupNotifications();
    const sameDay = when.toDateString() === new Date().toDateString();
    await notifee.displayNotification({
      id: `${task.id}-rescheduled`,
      title: 'Rescheduled',
      body: `${task.title} · ${sameDay ? 'Tonight' : 'Tomorrow'}, ${formatTime(
        when,
      )}`,
      android: {
        channelId: CHANNEL_ID,
        smallIcon: 'ic_launcher',
        timeoutAfter: 6000,
      },
      ios: {sound: undefined},
    });
  } catch (error) {
    logError('Could not confirm reschedule', error);
  }
}

function buildNotification(task: Task): Notification {
  const due = task.dueDate ? new Date(task.dueDate) : new Date();
  return {
    id: task.id,
    title: task.title,
    body: task.notes ? task.notes : `Due now · ${formatTime(due)}`,
    data: {taskId: task.id},
    android: {
      channelId: CHANNEL_ID,
      smallIcon: 'ic_launcher',
      color: colors.accent,
      pressAction: {id: 'default'},
      actions: [
        {title: 'Mark as done', pressAction: {id: ACTION_COMPLETE}},
        {
          title: rescheduleLabel(getRescheduleDate(due)),
          pressAction: {id: ACTION_RESCHEDULE},
        },
      ],
    },
    ios: {
      categoryId: CATEGORY_ID,
      sound: 'default',
      foregroundPresentationOptions: {banner: true, list: true, sound: true},
    },
  };
}

/**
 * Schedules (or replaces) the reminder for a task. If the task no longer needs
 * one (completed, no date, or date in the past) any existing reminder is removed.
 */
export async function scheduleReminder(task: Task): Promise<void> {
  if (!needsReminder(task) || !task.dueDate) {
    await cancelReminder(task.id);
    return;
  }
  await setupNotifications();

  const exact = await canScheduleExactAlarms();
  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: new Date(task.dueDate).getTime(),
    // Exact alarms fire on the minute, even in Doze mode (Android only).
    // Notifee silently drops exact triggers when the permission is missing,
    // so only request one when we know it's allowed; otherwise Notifee uses
    // WorkManager, which still delivers the reminder (possibly a little late).
    ...(exact
      ? {alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE}}
      : {}),
  };

  try {
    await notifee.createTriggerNotification(buildNotification(task), trigger);
  } catch (error) {
    logError('Could not schedule reminder', error);
  }
}

/**
 * Whether Android lets us schedule exact alarms. Always true on Android 13+
 * (USE_EXACT_ALARM in the manifest) and below Android 12; on Android 12 the
 * user can switch it off under "Alarms & reminders".
 */
export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.android.alarm !== AndroidNotificationSetting.DISABLED;
  } catch {
    return false;
  }
}

export async function cancelReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelNotification(taskId);
  } catch (error) {
    logError('Could not cancel reminder', error);
  }
}

async function cancelScheduledReminder(taskId: string): Promise<void> {
  try {
    await notifee.cancelTriggerNotification(taskId);
  } catch (error) {
    logError('Could not cancel scheduled reminder', error);
  }
}

/**
 * Makes the scheduled reminders match the task list. Run on launch so that
 * reminders survive reinstalls/restores and stale ones get cleaned up.
 */
export async function syncReminders(tasks: Task[]): Promise<void> {
  try {
    const scheduled = new Set(await notifee.getTriggerNotificationIds());
    const wanted = tasks.filter(t => needsReminder(t));
    const wantedIds = new Set(wanted.map(t => t.id));

    await Promise.all([
      // Only drop reminders that haven't fired yet. cancelNotification would
      // also remove one that just fired and is still sitting in the tray.
      ...[...scheduled]
        .filter(id => !wantedIds.has(id))
        .map(id => cancelScheduledReminder(id)),
      ...wanted.filter(t => !scheduled.has(t.id)).map(t => scheduleReminder(t)),
    ]);
  } catch (error) {
    logError('Sync failed', error);
  }
}
