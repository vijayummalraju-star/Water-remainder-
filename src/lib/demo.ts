import { Settings, WaterEntry } from '../types';
import { addDays, startOfDay } from './dates';
import { clampGoal } from './hydration';

/** Deterministic pseudo-random so demo data is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function id(): string {
  return `demo_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

const PORTIONS = [150, 200, 250, 250, 300, 330, 400, 500, 750];

/**
 * Generates a believable 3-week history plus a partially-complete today.
 * Used by the onboarding "Explore with sample data" option and the
 * Profile "Load sample data" action so charts are never empty in dev.
 */
export function generateDemoEntries(settings: Settings, days = 21): WaterEntry[] {
  const goal = clampGoal(settings.dailyGoalMl || 2200);
  const rand = mulberry32(20260909);
  const entries: WaterEntry[] = [];
  const today = startOfDay(new Date());

  for (let d = days; d >= 1; d--) {
    const dayStart = startOfDay(addDays(today, -d));
    // ~72% of days end up hitting the goal — encouraging but not suspicious.
    const hitsGoal = rand() < 0.72;
    const target = hitsGoal ? goal * (1 + rand() * 0.18) : goal * (0.45 + rand() * 0.4);
    let total = 0;
    const wake = settings.wakeTime;
    const sleep = settings.sleepTime;
    const span = Math.max(360, sleep > wake ? sleep - wake : 1080);

    let guard = 0;
    while (total < target && guard < 14) {
      guard += 1;
      const portion = PORTIONS[Math.floor(rand() * PORTIONS.length)];
      const offset = Math.round((span / 13) * guard + rand() * 45);
      const minutes = wake + Math.min(offset, span - 15);
      const when = new Date(dayStart.getTime() + minutes * 60000);
      total += portion;
      entries.push({
        id: id(),
        amountMl: portion,
        timestamp: when.getTime(),
        type: rand() < 0.08 ? (rand() < 0.5 ? 'tea' : 'coffee') : 'water',
      });
    }
  }

  // Today: a couple of logged drinks so the dashboard opens part-way full.
  const now = new Date();
  const morning = new Date(today.getTime() + (settings.wakeTime + 20) * 60000);
  entries.push({
    id: id(),
    amountMl: 400,
    timestamp: Math.min(morning.getTime(), now.getTime() - 60 * 60000),
    type: 'water',
  });
  entries.push({
    id: id(),
    amountMl: 250,
    timestamp: Math.max(today.getTime() + (settings.wakeTime + 95) * 60000, now.getTime() - 25 * 60000),
    type: 'water',
  });

  return entries
    .filter((e) => e.timestamp <= now.getTime())
    .sort((a, b) => a.timestamp - b.timestamp);
}
