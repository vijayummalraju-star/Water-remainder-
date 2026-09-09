import { CustomReminder, Settings } from '../types';
import { clampGoal, clampEntry, MAX_ENTRY_ML, MIN_ENTRY_ML } from '../lib/hydration';
import { MINUTES_PER_DAY, parseHhmm } from '../lib/dates';

/** 7:00 AM */
export const DEFAULT_WAKE = 7 * 60;
/** 11:00 PM */
export const DEFAULT_SLEEP = 23 * 60;

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  dailyGoalMl: 2400,
  unit: 'metric',
  weightKg: 70,
  activityLevel: 'moderate',
  wakeTime: DEFAULT_WAKE,
  sleepTime: DEFAULT_SLEEP,
  theme: 'system',

  remindersEnabled: true,
  reminderStart: DEFAULT_WAKE + 60,
  reminderEnd: DEFAULT_SLEEP - 30,
  reminderIntervalMin: 60,
  useCustomSchedule: false,
  customReminders: [],
  soundEnabled: true,
  vibrationEnabled: true,
  hapticsEnabled: true,

  glassSizeMl: 250,
  goalSource: 'recommended',
};

export function newReminderId(): string {
  return `rem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function makeCustomReminder(time: number): CustomReminder {
  return {
    id: newReminderId(),
    time: normalizeMinutes(time),
    enabled: true,
  };
}

export function normalizeMinutes(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((Math.round(value) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/** Coerce anything coming from storage / forms into a valid Settings object. */
export function mergeSettings(input: Partial<Settings> | null | undefined): Settings {
  const raw = input ?? {};
  const merged: Settings = { ...DEFAULT_SETTINGS, ...raw };

  merged.dailyGoalMl = clampGoal(Number(merged.dailyGoalMl));
  merged.weightKg = clampWeight(Number(merged.weightKg));
  merged.wakeTime = normalizeMinutes(Number(merged.wakeTime));
  merged.sleepTime = normalizeMinutes(Number(merged.sleepTime));
  merged.reminderStart = normalizeMinutes(Number(merged.reminderStart));
  merged.reminderEnd = normalizeMinutes(Number(merged.reminderEnd));
  merged.reminderIntervalMin = clampInterval(Number(merged.reminderIntervalMin));
  merged.glassSizeMl = clampGlass(Number(merged.glassSizeMl));

  merged.unit = merged.unit === 'imperial' ? 'imperial' : 'metric';
  merged.activityLevel = (
    ['sedentary', 'light', 'moderate', 'active', 'athlete'] as const
  ).includes(merged.activityLevel)
    ? merged.activityLevel
    : 'moderate';
  merged.theme = (['system', 'light', 'dark'] as const).includes(merged.theme)
    ? merged.theme
    : 'system';
  merged.goalSource = merged.goalSource === 'manual' ? 'manual' : 'recommended';

  merged.remindersEnabled = !!merged.remindersEnabled;
  merged.useCustomSchedule = !!merged.useCustomSchedule;
  merged.soundEnabled = !!merged.soundEnabled;
  merged.vibrationEnabled = !!merged.vibrationEnabled;
  merged.hapticsEnabled = !!merged.hapticsEnabled;
  merged.onboarded = !!merged.onboarded;

  merged.customReminders = Array.isArray(merged.customReminders)
    ? merged.customReminders
        .filter((r): r is CustomReminder => !!r && Number.isFinite(r?.time))
        .map((r) => ({
          id: typeof r.id === 'string' ? r.id : newReminderId(),
          time: normalizeMinutes(r.time),
          enabled: r.enabled !== false,
        }))
        .sort((a, b) => a.time - b.time)
    : [];

  return merged;

  function clampWeight(kg: number): number {
    if (!Number.isFinite(kg) || kg <= 0) return DEFAULT_SETTINGS.weightKg;
    return Math.min(300, Math.max(20, Math.round(kg * 10) / 10));
  }

  function clampInterval(min: number): number {
    if (!Number.isFinite(min)) return DEFAULT_SETTINGS.reminderIntervalMin;
    return Math.min(240, Math.max(10, Math.round(min)));
  }

  function clampGlass(ml: number): number {
    if (!Number.isFinite(ml)) return DEFAULT_SETTINGS.glassSizeMl;
    return Math.min(2000, Math.max(50, Math.round(ml)));
  }
}

/** Validates a raw entry amount, returning 0 when unusable. */
export function validateEntryAmount(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(MAX_ENTRY_ML, Math.max(MIN_ENTRY_ML, Math.round(n)));
}

/** Suggested vessel presets used across the app. */
export const VESSEL_PRESETS: { label: string; ml: number; icon: string }[] = [
  { label: 'Sip', ml: 100, icon: 'cafe-outline' },
  { label: 'Glass', ml: 250, icon: 'glass-outline' },
  { label: 'Mug', ml: 350, icon: 'cafe' },
  { label: 'Bottle', ml: 500, icon: 'bottle-outline' },
  { label: 'Large', ml: 750, icon: 'water' },
];

/** Quick-add amounts shown on the dashboard. */
export const QUICK_ADDS = [250, 500, 750];

export function parseTimeInput(value: string): number | null {
  return parseHhmm(value);
}
