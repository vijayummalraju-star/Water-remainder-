/**
 * Date helpers. All app data is bucketed by *local* calendar day using a
 * `YYYY-MM-DD` key so "today" always means the user's today.
 */

export const MINUTES_PER_DAY = 1440;
export const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(d: Date | number): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Local calendar key, e.g. `2026-09-09`. */
export function dateKey(d: Date | number): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(d: Date | number, n: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  return dateKey(a) === dateKey(b);
}

/** Oldest -> newest list of day keys. */
export function lastNDayKeys(n: number, from: Date = new Date()): string[] {
  const out: string[] = [];
  const base = startOfDay(from);
  for (let i = n - 1; i >= 0; i--) {
    out.push(dateKey(addDays(base, -i)));
  }
  return out;
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Minutes-after-midnight -> `h:mm AM/PM`. */
export function formatClock(minutes: number): string {
  const m = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h24 = Math.floor(m / 60);
  const mm = `${m % 60}`.padStart(2, '0');
  const suffix = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${suffix}`;
}

export function timestampToClock(ts: number): string {
  const d = new Date(ts);
  return formatClock(d.getHours() * 60 + d.getMinutes());
}

export function minutesFromTime(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `Today`, `Yesterday` or `Mon, Sep 8`. */
export function formatDayLabel(key: string): string {
  const today = todayKey();
  if (key === today) return 'Today';
  if (key === dateKey(addDays(new Date(), -1))) return 'Yesterday';
  const d = keyToDate(key);
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatShortDay(key: string): string {
  return WEEKDAYS[keyToDate(key).getDay()];
}

export function formatFullDate(d: Date | number): string {
  const date = new Date(d);
  return `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function formatMonthYear(d: Date = new Date()): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `1h 20m` / `45m` style duration between two epoch millis. */
export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Pad a number to 2 digits. */
export function pad2(n: number): string {
  return `${n}`.padStart(2, '0');
}

export function hhmm(minutes: number): string {
  const m = ((Math.round(minutes) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

export function parseHhmm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}
