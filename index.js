import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';

import App from './App';
import {name as appName} from './app.json';
import {handleNotificationEvent} from './src/features/tasks/notificationActions';

// Runs when a reminder is interacted with while the app is in the background
// or killed — e.g. tapping "Mark as done" right on the notification.
notifee.onBackgroundEvent(async event => {
  await handleNotificationEvent(event);
});

AppRegistry.registerComponent(appName, () => App);
