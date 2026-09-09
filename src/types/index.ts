/**
 * Shared domain types for the Aqua / water reminder app.
 * Everything is stored as millilitres internally; imperial (fl oz) is a
 * presentation-layer conversion only.
 */

export type UnitSystem = 'metric' | 'imperial';
export type ThemePreference = 'system' | 'light' | 'dark';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';
export type BeverageType = 'water' | 'tea' | 'coffee' | 'juice' | 'other';
export type GoalSource = 'manual' | 'recommended';

/** A single logged drink. Millilitres are canonical. */
export interface WaterEntry {
  id: string;
  /** Volume in millilitres (canonical unit). */
  amountMl: number;
  /** Epoch millis of when the drink happened. */
  timestamp: number;
  type: BeverageType;
}

/** A user-defined reminder time expressed as minutes after midnight. */
export interface CustomReminder {
  id: string;
  /** Minutes after midnight, 0..1439 */
  time: number;
  enabled: boolean;
}

export interface Settings {
  onboarded: boolean;
  /** Daily goal in millilitres. */
  dailyGoalMl: number;
  unit: UnitSystem;
  /** Used only for the personalised goal recommendation. Never leaves device. */
  weightKg: number;
  activityLevel: ActivityLevel;
  /** Preferred wake time, minutes after midnight. */
  wakeTime: number;
  /** Preferred sleep time, minutes after midnight. */
  sleepTime: number;
  theme: ThemePreference;

  remindersEnabled: boolean;
  /** Active reminder window start, minutes after midnight. */
  reminderStart: number;
  /** Active reminder window end, minutes after midnight. */
  reminderEnd: number;
  reminderIntervalMin: number;
  useCustomSchedule: boolean;
  customReminders: CustomReminder[];
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  hapticsEnabled: boolean;

  /** Default vessel size used by the Add Water stepper. */
  glassSizeMl: number;
  goalSource: GoalSource;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  /** Renders as a locked silhouette until earned. */
}

/** Map of achievement id -> epoch millis it was unlocked. */
export type AchievementMap = Record<string, number>;

/** One day of aggregated hydration data. */
export interface DayStat {
  key: string;
  date: Date;
  totalMl: number;
  goalMl: number;
  completed: boolean;
  entries: WaterEntry[];
  /** 0..1 completion, uncapped so overshoot shows as >1 */
  ratio: number;
}

export interface AppSnapshot {
  settings: Settings;
  entries: WaterEntry[];
  achievements: AchievementMap;
  savedAt: number;
}

export interface Celebration {
  id: string;
  kind: 'goal' | 'achievement' | 'streak';
  title: string;
  message: string;
  icon: string;
}
