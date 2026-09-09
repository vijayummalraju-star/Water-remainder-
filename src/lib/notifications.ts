import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Settings } from '../types';
import { MINUTES_PER_DAY, formatClock } from './dates';

export const REMINDER_CHANNEL_ID = 'water-reminders';
export const MAX_SCHEDULED = 12;

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
 * Returns reminder instants strictly after `from`.
 *
 * The interval window may cross midnight. We keep the day offset while building
 * the schedule instead of sorting wrapped minutes (which previously caused an
 * overnight 00:00 slot to be scheduled before the evening slot on the same day).
 */
export function computeReminderTimes(settings: Settings, from: Date, count: number): Date[] {
  if (!settings.remindersEnabled || count <= 0) return [];

  const schedule = resolveSchedule(settings);
  if (schedule.length === 0) return [];

  const base = new Date(from);
  base.setSeconds(0, 0);
  const out: Date[] = [];

  for (let dayOffset = 0; dayOffset <= 8 && out.length < count; dayOffset++) {
    const dayStart = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate() + dayOffset,
      0,
      0,
      0,
      0,
    );

    for (const slot of schedule) {
      const when = new Date(dayStart.getTime() + slot.minutes * 60000);
      if (when.getTime() > from.getTime()) {
        out.push(when);
        if (out.length >= count) break;
      }
    }
  }

  return out.slice(0, count);
}

type ReminderSlot = { minutes: number };

/** Sorted, de-duplicated reminder minutes with their day offset preserved. */
function resolveSchedule(settings: Settings): ReminderSlot[] {
  if (settings.useCustomSchedule) {
    const custom = settings.customReminders
      .filter((r) => r.enabled)
      .map((r) => ({ minutes: r.time }))
      .sort((a, b) => a.minutes - b.minutes);
    if (custom.length > 0) return dedupeSlots(custom);
  }

  const start = normalizeDayMinutes(settings.reminderStart);
  const rawEnd = normalizeDayMinutes(settings.reminderEnd);
  const interval = Math.max(5, Math.round(settings.reminderIntervalMin));
  const end = rawEnd <= start ? rawEnd + MINUTES_PER_DAY : rawEnd;
  const slots: ReminderSlot[] = [];

  for (let t = start; t <= end; t += interval) {
    slots.push({ minutes: t });
  }
  return dedupeSlots(slots);
}

function dedupeSlots(slots: ReminderSlot[]): ReminderSlot[] {
  const seen = new Set<number>();
  return slots.filter((slot) => {
    if (seen.has(slot.minutes)) return false;
    seen.add(slot.minutes);
    return true;
  });
}

function normalizeDayMinutes(value: number): number {
  return ((value % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Kept as a public helper for UI/tests. Wrapped overnight minutes are returned
 * as normal clock minutes, preserving the existing API contract.
 */
export function resolveTimesOfDay(settings: Settings): number[] {
  return resolveSchedule(settings).map((slot) => slot.minutes % MINUTES_PER_DAY);
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
