/**
 * Handles the "Mark as done" button on a reminder. Runs both in the foreground
 * and in Notifee's headless background handler (see index.js), so it talks to
 * the database directly instead of going through React state.
 */
import notifee, {EventType, type Event} from '@notifee/react-native';

import {getTaskById, saveTask} from '../../storage/taskRepository';
import {ACTION_COMPLETE} from '../../services/notifications';
import {setCompleted} from './taskLogic';

/** Returns true if the event changed a stored task. */
export async function handleNotificationEvent({
  type,
  detail,
}: Event): Promise<boolean> {
  if (
    type !== EventType.ACTION_PRESS ||
    detail.pressAction?.id !== ACTION_COMPLETE
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
      await saveTask(setCompleted(task, true));
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
