/**
 * Handles the "Mark as done" and "Reschedule" buttons on a reminder. Runs both in the foreground
 * and in Notifee's headless background handler (see index.js), so it talks to
 * the database directly instead of going through React state.
 */
import notifee, {EventType, type Event} from '@notifee/react-native';

import {getTaskById, saveTask} from '../../storage/taskRepository';
import {
  ACTION_COMPLETE,
  ACTION_RESCHEDULE,
  confirmReschedule,
  scheduleReminder,
} from '../../services/notifications';
import {getRescheduleDate} from '../../utils/date';
import {applyPatch, setCompleted} from './taskLogic';

/** Returns true if the event changed a stored task. */
export async function handleNotificationEvent({
  type,
  detail,
}: Event): Promise<boolean> {
  const action = detail.pressAction?.id;
  if (
    type !== EventType.ACTION_PRESS ||
    (action !== ACTION_COMPLETE && action !== ACTION_RESCHEDULE)
  ) {
    return false;
  }

  const taskId = detail.notification?.data?.taskId;
  if (typeof taskId !== 'string') {
    return false;
  }

  let changed = false;
  try {
    const task = await getTaskById(taskId);
    if (task && !task.completed) {
      if (action === ACTION_COMPLETE) {
        await saveTask(setCompleted(task, true));
      } else {
        // Reschedule to 9 PM tonight (or tomorrow if that has passed).
        const when = getRescheduleDate();
        const updated = applyPatch(task, {dueDate: when.toISOString()});
        await saveTask(updated);
        await scheduleReminder(updated);
        await confirmReschedule(updated, when);
      }
      changed = true;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('[notifications] Could not complete task', error);
    }
  }

  if (detail.notification?.id) {
    await notifee.cancelNotification(detail.notification.id);
  }
  return changed;
}
