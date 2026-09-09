import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Settings } from '../types';
import { MINUTES_PER_DAY, formatClock } from './dates';

export const REMINDER_CHANNEL_ID = 'water-reminders';
export const MAX_SCHEDULED = 12;

/**
 * Human-friendly reminder copy. Kept short so it reads well on a lock screen.
 */
export const REMINDER_MESSAGES: { title: string; body: string }[] = [
  { title: 'Time to hydrate 💧', body: 'A quick glass of water keeps your energy up.' },
  { title: 'Hydration check', body: 'Your body is asking for water. Take a few sips.' },
  { title: 'Small sips, big difference', body: 'Drink a glass of water right now.' },
  { title: 'Stay on track 🌊', body: 'A short water break takes 20 seconds.' },
  { title: 'Water break', body: 'Refill your glass and keep the streak going.' },
];

let soundEnabled = true;
let vibrationEnabled = true;
let handlerConfigured = false;

/**
 * Called once at startup and again whenever the sound preference changes so
 * incoming notifications respect the user's choice.
 */
export function configureNotificationHandler(opts: { sound: boolean }) {
  soundEnabled = opts.sound;
  handlerConfigured = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: soundEnabled,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Notifications are unavailable (e.g. web preview) — degrade gracefully.
  }
}

export function updateHandlerSound(sound: boolean) {
  if (sound === soundEnabled && handlerConfigured) return;
  configureNotificationHandler({ sound });
}

export async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Water reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: vibrationEnabled ? [0, 240, 120, 240] : [0],
      lightColor: '#4FB0FF',
      sound: soundEnabled ? 'default' : null,
      bypassDnd: false,
    });
  } catch {
    // ignore
  }
}

/** Returns true when permission has already been granted. */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted || settings.status === 'granted';
  } catch {
    return false;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const result = await Notifications.requestPermissionsAsync();
    return result.granted;
  } catch {
    return false;
  }
}

/**
 * Pure planner: resolves the next `count` reminder instants strictly after
 * `from`, honouring either the interval window or the custom schedule.
 * Mirrors exactly what gets scheduled, so the UI can preview "next reminder".
 */
export function computeReminderTimes(settings: Settings, from: Date, count: number): Date[] {
  if (!settings.remindersEnabled || count <= 0) return [];

  const times = resolveTimesOfDay(settings);
  if (times.length === 0) return [];

  const base = new Date(from);
  base.setSeconds(0, 0);
  const out: Date[] = [];

  for (let dayOffset = 0; dayOffset <= 7 && out.length < count; dayOffset++) {
    const day = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, 0, 0, 0, 0);
    for (const minutes of times) {
      const when = new Date(day.getTime() + minutes * 60000);
      if (when.getTime() > from.getTime()) {
        out.push(when);
        if (out.length >= count) break;
      }
    }
  }

  out.sort((a, b) => a.getTime() - b.getTime());
  return out.slice(0, count);
}

/** Sorted, de-duplicated list of allowed minutes-after-midnight. */
export function resolveTimesOfDay(settings: Settings): number[] {
  if (settings.useCustomSchedule) {
    const custom = settings.customReminders
      .filter((r) => r.enabled)
      .map((r) => r.time)
      .sort((a, b) => a - b);
    if (custom.length > 0) return Array.from(new Set(custom));
  }

  const start = ((settings.reminderStart % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const interval = Math.max(5, Math.round(settings.reminderIntervalMin));
  let end = ((settings.reminderEnd % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  // A window that ends at or before its start is treated as crossing midnight.
  if (end <= start) end += MINUTES_PER_DAY;

  const times: number[] = [];
  for (let t = start; t <= end; t += interval) {
    times.push(t % MINUTES_PER_DAY);
  }
  return Array.from(new Set(times)).sort((a, b) => a - b);
}

export function nextReminderAt(settings: Settings, from: Date = new Date()): Date | null {
  const times = computeReminderTimes(settings, from, 1);
  return times[0] ?? null;
}

export function describeSchedule(settings: Settings): string {
  if (!settings.remindersEnabled) return 'Reminders are off';
  if (settings.useCustomSchedule && settings.customReminders.some((r) => r.enabled)) {
    const count = settings.customReminders.filter((r) => r.enabled).length;
    return `${count} custom reminder${count === 1 ? '' : 's'} per day`;
  }
  return `Every ${settings.reminderIntervalMin} min · ${formatClock(settings.reminderStart)} – ${formatClock(
    settings.reminderEnd,
  )}`;
}

export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // ignore
  }
}

/**
 * Syncs the pending notification queue with current settings.
 *
 * - Cancels everything first (idempotent, avoids duplicate alerts).
 * - Stops scheduling once today's goal is reached.
 * - Skips when notifications are disabled.
 */
export async function syncReminders(
  settings: Settings,
  goalReachedToday: boolean,
): Promise<Date[]> {
  vibrationEnabled = settings.vibrationEnabled;
  soundEnabled = settings.soundEnabled;

  try {
    await cancelAllReminders();
    if (!settings.remindersEnabled || goalReachedToday) return [];

    await ensureAndroidChannel();
    const now = new Date();
    const upcoming = computeReminderTimes(settings, now, MAX_SCHEDULED);

    for (let i = 0; i < upcoming.length; i++) {
      const when = upcoming[i];
      const message = REMINDER_MESSAGES[i % REMINDER_MESSAGES.length];
      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: settings.soundEnabled ? 'default' : false,
          vibrate: settings.vibrationEnabled ? [0, 240, 120, 240] : undefined,
          ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: when,
          ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
        },
      });
    }
    return upcoming;
  } catch {
    return [];
  }
}

export async function pendingReminderCount(): Promise<number> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.length;
  } catch {
    return 0;
  }
}
