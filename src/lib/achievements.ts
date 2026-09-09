import { AchievementDef, AchievementMap, Settings, WaterEntry } from '../types';
import { buildDailySeries, groupEntriesByDay, totalMl } from './hydration';
import { dateKey } from './dates';

/**
 * Gamification layer. Pure functions only — unlocking is derived from data,
 * so deleting an entry can never leave a stale badge behind in the logic.
 */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-sip',
    title: 'First Sip',
    description: 'Log your very first drink',
    icon: 'water-outline',
    color: '#38C6D9',
  },
  {
    id: 'goal-once',
    title: 'Goal Getter',
    description: 'Reach your daily goal once',
    icon: 'checkmark-circle-outline',
    color: '#1FB57A',
  },
  {
    id: 'goal-seven',
    title: 'Consistent Sipper',
    description: 'Reach your goal on 7 different days',
    icon: 'sparkles-outline',
    color: '#4FB0FF',
  },
  {
    id: 'streak-3',
    title: 'On A Roll',
    description: 'Build a 3-day hydration streak',
    icon: 'flame-outline',
    color: '#F5A524',
  },
  {
    id: 'streak-7',
    title: 'Week of Water',
    description: 'Build a 7-day hydration streak',
    icon: 'flame',
    color: '#F0762B',
  },
  {
    id: 'entries-25',
    title: 'Regular Drinker',
    description: 'Log 25 drinks in total',
    icon: 'list-outline',
    color: '#8B7BF6',
  },
  {
    id: 'volume-50l',
    title: 'Half a Hectolitre',
    description: 'Track 50 litres of water',
    icon: 'boat-outline',
    color: '#2A8FE0',
  },
  {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Log a drink before 8:00 AM',
    icon: 'sunny-outline',
    color: '#F7B733',
  },
  {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Log a drink after 9:00 PM',
    icon: 'moon-outline',
    color: '#6C7CE0',
  },
  {
    id: 'perfect-week',
    title: 'Perfect Week',
    description: 'Hit your goal 7 days in a row',
    icon: 'ribbon-outline',
    color: '#E0568C',
  },
];

export function achievementById(id: string): AchievementDef | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function isUnlocked(id: string, map: AchievementMap): boolean {
  return typeof map[id] === 'number';
}

function longestConsecutiveCompleted(series: { completed: boolean }[]): number {
  let best = 0;
  let run = 0;
  for (const day of series) {
    if (day.completed) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 0;
    }
  }
  return best;
}

/**
 * Returns the ids that should newly unlock given the current data.
 * Deterministic and idempotent — safe to run after every mutation.
 */
export function evaluateAchievements(
  entries: WaterEntry[],
  settings: Settings,
  current: AchievementMap,
): string[] {
  const unlocked = new Set(Object.keys(current));
  const qualified: string[] = [];
  const add = (id: string) => {
    if (!unlocked.has(id)) qualified.push(id);
  };

  if (entries.length === 0) return [];

  const goal = settings.dailyGoalMl;
  const series = buildDailySeries(entries, goal, 3650);
  const completedDays = series.filter((d) => d.completed).length;
  const streakBest = longestConsecutiveCompleted(series);
  const sum = totalMl(entries);

  add('first-sip');
  if (completedDays >= 1) add('goal-once');
  if (completedDays >= 7) add('goal-seven');
  if (streakBest >= 3) add('streak-3');
  if (streakBest >= 7) add('perfect-week');
  if (series.length >= 7 && series.slice(-7).every((d) => d.completed)) add('streak-7');
  if (entries.length >= 25) add('entries-25');
  if (sum >= 50_000) add('volume-50l');

  const grouped = groupEntriesByDay(entries);
  for (const list of grouped.values()) {
    for (const entry of list) {
      const hour = new Date(entry.timestamp).getHours();
      if (hour < 8) add('early-bird');
      if (hour >= 21) add('night-owl');
    }
  }

  return qualified;
}

/** Best streak across all recorded history. */
export function bestStreak(entries: WaterEntry[], goalMl: number): number {
  const series = buildDailySeries(entries, goalMl, 3650);
  return longestConsecutiveCompleted(series);
}

/** Days (keys) that were completed, newest first. */
export function completedDayKeys(entries: WaterEntry[], goalMl: number): string[] {
  const series = buildDailySeries(entries, goalMl, 3650);
  return series
    .filter((d) => d.completed)
    .map((d) => d.key)
    .reverse()
    .filter((key) => key !== dateKey(new Date()));
}
