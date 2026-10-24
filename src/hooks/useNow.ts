import {useEffect, useState} from 'react';
import {AppState} from 'react-native';

/**
 * The current time, refreshed every `intervalMs` and whenever the app returns
 * to the foreground — keeps "Overdue" / "Today" labels correct.
 */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        setNow(new Date());
      }
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
