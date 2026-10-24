/**
 * Small key/value settings stored in the `settings` table.
 */
import {getDatabase} from './database';

const KEYS = {
  onboardingComplete: 'onboarding_complete',
} as const;

async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const {rows} = await db.execute(
    'SELECT value FROM settings WHERE key = ? LIMIT 1',
    [key],
  );
  const value = rows[0]?.value;
  return typeof value === 'string' ? value : null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    return (await getSetting(KEYS.onboardingComplete)) === 'true';
  } catch (error) {
    if (__DEV__) {
      console.warn('[settings] Failed to read onboarding flag', error);
    }
    return false;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await setSetting(KEYS.onboardingComplete, 'true');
  } catch (error) {
    if (__DEV__) {
      console.warn('[settings] Failed to save onboarding flag', error);
    }
  }
}
