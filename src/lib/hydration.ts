import { ActivityLevel, DayStat, Settings, WaterEntry } from '../types';
import { ACTIVITY_LEVELS } from '../theme/theme';
import { dateKey, keyToDate, lastNDayKeys, todayKey } from './dates';

export const MIN_GOAL_ML = 500;
export const MAX_GOAL_ML = 8000;
export const MIN_ENTRY_ML = 1;
export const MAX_ENTRY_ML = 5000;

export function clampGoal(ml: number): number {
  if (!Number.isFinite(ml)) return 2000;
  return Math.min(MAX_GOAL_ML, Math.max(MIN_GOAL_ML, Math.round(ml)));
}

export function clampEntry(ml: number): number {
  if (!Number.isFinite(ml)) return 0;
  return Math.min(MAX_ENTRY_ML, Math.max(0, Math.round(ml)));
}

/**
 * Personalised goal recommendation.
 *
 * Base rule: ~35 ml per kg of body weight, scaled by activity level and
 * rounded to a friendly 50 ml step. It is intentionally conservative and is
 * only ever a *suggestion* — the user stays in full control.
 */
export function recommendGoalMl(weightKg: number, activityLevel: ActivityLevel): number {
  const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70;
  const factor = ACTIVITY_LEVELS.find((a) => a.key === activityLevel)?.factor ?? 1.1;
  const raw = weight * 35 * factor;
  return clampGoal(Math.round(raw / 50) * 50);
}

/** Millilitres remaining to hit the goal (never negative). */
export function remainingMl(totalMl: number, goalMl: number): number {
  return Math.max(0, goalMl - totalMl);
}

export function progressRatio(totalMl: number, goalMl: number): number {
  if (goalMl <= 0) return 0;
  return totalMl / goalMl;
}

/** Sum of all entries logged on the current calendar day. */
export function todayTotalMl(entries: WaterEntry[]): number {
  const key = todayKey();
  let sum = 0;
  for (const e of entries) {
    if (dateKey(e.timestamp) === key) sum += e.amountMl;
  }
  return sum;
}

/** Entries logged on the current calendar day, newest first. */
export function todayEntries(entries: WaterEntry[]): WaterEntry[] {
  const key = todayKey();
  return entries
    .filter((e) => dateKey(e.timestamp) === key)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function groupEntriesByDay(entries: WaterEntry[]): Map<string, WaterEntry[]> {
  const map = new Map<string, WaterEntry[]>();
  for (const entry of entries) {
    const k = dateKey(entry.timestamp);
    const list = map.get(k);
    if (list) list.push(entry);
    else map.set(k, [entry]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.timestamp - b.timestamp);
  }
  return map;
}

export function totalMl(entries: WaterEntry[]): number {
  return entries.reduce((sum, e) => sum + e.amountMl, 0);
}

/** Last `days` days, oldest first. */
export function buildDailySeries(entries: WaterEntry[], goalMl: number, days: number): DayStat[] {
  const grouped = groupEntriesByDay(entries);
  return lastNDayKeys(days).map((key) => {
    const list = grouped.get(key) ?? [];
    const total = totalMl(list);
    const goal = goalMl > 0 ? goalMl : 1;
    return {
      key,
      date: keyToDate(key),
      totalMl: total,
      goalMl,
      completed: goalMl > 0 && total >= goalMl,
      entries: list,
      ratio: goalMl > 0 ? total / goal : 0,
    };
  });
}

/**
 * Consecutive completed days ending today (or yesterday when today is still
 * in progress) — so a partially-hydrated today never breaks the streak.
 */
export function computeStreak(series: DayStat[]): number {
  if (series.length === 0) return 0;
  const ordered = [...series].sort((a, b) => (a.key < b.key ? -1 : 1));
  let index = ordered.length - 1;
  const today = todayKey();
  if (ordered[index]?.key === today && !ordered[index].completed) index -= 1;
  let streak = 0;
  while (index >= 0 && ordered[index].completed) {
    streak += 1;
    index -= 1;
  }
  return streak;
}

export interface SummaryStats {
  totalDays: number;
  activeDays: number;
  completedDays: number;
  avgMl: number;
  avgActiveMl: number;
  bestDayMl: number;
  bestDayKey: string | null;
  totalMl: number;
  completionRate: number;
}

export function summarize(series: DayStat[]): SummaryStats {
  let total = 0;
  let active = 0;
  let completed = 0;
  let best = 0;
  let bestKey: string | null = null;
  for (const day of series) {
    total += day.totalMl;
    if (day.totalMl > 0) active += 1;
    if (day.completed) completed += 1;
    if (day.totalMl > best) {
      best = day.totalMl;
      bestKey = day.key;
    }
  }
  const n = series.length;
  return {
    totalDays: n,
    activeDays: active,
    completedDays: completed,
    avgMl: n > 0 ? Math.round(total / n) : 0,
    avgActiveMl: active > 0 ? Math.round(total / active) : 0,
    bestDayMl: best,
    bestDayKey: bestKey,
    totalMl: total,
    completionRate: n > 0 ? completed / n : 0,
  };
}

/** All-time totals across the full entry list (not just the recent window). */
export function allTimeTotals(entries: WaterEntry[], goalMl: number) {
  const series = buildDailySeries(entries, goalMl, 3650);
  return summarize(series);
}

/** True once the goal has been met for the current calendar day. */
export function isGoalReachedToday(entries: WaterEntry[], settings: Settings): boolean {
  return settings.dailyGoalMl > 0 && todayTotalMl(entries) >= settings.dailyGoalMl;
}

/** Entries for a given `YYYY-MM-DD` key. */
export function entriesForDay(entries: WaterEntry[], key: string): WaterEntry[] {
  return entries
    .filter((e) => dateKey(e.timestamp) === key)
    .sort((a, b) => b.timestamp - a.timestamp);
}
