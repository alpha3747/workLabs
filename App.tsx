import React, {useCallback, useEffect, useState} from 'react';
import {StatusBar, StyleSheet} from 'react-native';
import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type {RootStackParamList} from './src/navigation/types';
import {TasksProvider} from './src/features/tasks/TasksContext';
import {setupNotifications} from './src/services/notifications';
import {toastConfig} from './src/components/AppToast';
import {SplashScreen} from './src/screens/SplashScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {TaskDetailScreen} from './src/screens/TaskDetailScreen';
import {colors} from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    setupNotifications();
  }, []);

  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background}
        />
        {/* Tasks start loading from SQLite while the splash plays. */}
        <TasksProvider>
          {splashDone ? (
            <NavigationContainer theme={navigationTheme}>
              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  contentStyle: {backgroundColor: colors.background},
                  animation: 'slide_from_right',
                }}>
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{animation: 'fade'}}
                />
                <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          ) : (
            <SplashScreen onFinish={handleSplashFinish} />
          )}
        </TasksProvider>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: colors.background},
});
