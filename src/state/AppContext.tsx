import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AchievementMap,
  AppSnapshot,
  BeverageType,
  Celebration,
  Settings,
  WaterEntry,
} from '../types';
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  validateEntryAmount,
} from './defaults';
import {
  clearSnapshot,
  loadSnapshot,
  saveSnapshot,
  serializeSnapshot,
} from '../lib/storage';
import {
  isGoalReachedToday,
  todayTotalMl,
} from '../lib/hydration';
import {
  ACHIEVEMENTS,
  achievementById,
  evaluateAchievements,
} from '../lib/achievements';
import {
  configureNotificationHandler,
  syncReminders,
  updateHandlerSound,
} from '../lib/notifications';
import { generateDemoEntries } from '../lib/demo';

interface AppState {
  settings: Settings;
  entries: WaterEntry[];
  achievements: AchievementMap;
}

export interface AppContextValue extends AppState {
  /** False until the persisted snapshot has been read from disk. */
  hydrated: boolean;
  celebration: Celebration | null;
  dismissCelebration: () => void;

  addEntry: (input: { amountMl: number; timestamp?: number; type?: BeverageType }) => void;
  updateEntry: (id: string, patch: Partial<Pick<WaterEntry, 'amountMl' | 'timestamp' | 'type'>>) => void;
  deleteEntry: (id: string) => void;
  clearToday: () => void;

  updateSettings: (patch: Partial<Settings>) => void;
  finishOnboarding: () => void;
  loadDemoData: () => void;
  resetTodayData: () => void;
  deleteAllData: () => void;
  exportData: () => Promise<string>;

  /** Number of unlocked achievements. */
  unlockedCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

function newId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievementMap>({});
  const [hydrated, setHydrated] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  const readyRef = useRef(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const achievementsRef = useRef(achievements);
  achievementsRef.current = achievements;

  /** Load persisted snapshot once on cold start. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = await loadSnapshot();
      if (cancelled) return;
      if (snapshot) {
        setSettings(mergeSettings(snapshot.settings));
        setEntries(Array.isArray(snapshot.entries) ? snapshot.entries : []);
        setAchievements(snapshot.achievements ?? {});
      }
      readyRef.current = true;
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Persist on every meaningful change (offline-first, single key). */
  useEffect(() => {
    if (!hydrated || !readyRef.current) return;
    const snapshot: AppSnapshot = {
      settings,
      entries,
      achievements,
      savedAt: Date.now(),
    };
    void saveSnapshot(snapshot);
  }, [hydrated, settings, entries, achievements]);

  /** Keep the notification behaviour in sync with the sound preference. */
  useEffect(() => {
    if (!hydrated) return;
    updateHandlerSound(settings.soundEnabled);
  }, [hydrated, settings.soundEnabled]);

  useEffect(() => {
    configureNotificationHandler({ sound: settings.soundEnabled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-plan reminders whenever schedule inputs or today's progress change. */
  const goalReached = useMemo(
    () => isGoalReachedToday(entries, settings),
    [entries, settings],
  );

  useEffect(() => {
    if (!hydrated) return;
    void syncReminders(settings, goalReached);
  }, [
    hydrated,
    goalReached,
    settings.remindersEnabled,
    settings.reminderStart,
    settings.reminderEnd,
    settings.reminderIntervalMin,
    settings.useCustomSchedule,
    settings.customReminders,
    settings.soundEnabled,
    settings.vibrationEnabled,
  ]);

  const dismissCelebration = useCallback(() => setCelebration(null), []);

  /**
   * Single mutation path: derives achievements + goal celebration so the UI
   * never has to keep them in sync manually.
   */
  const commit = useCallback(
    (nextEntries: WaterEntry[], nextSettings: Settings, previousTotal: number) => {
      setEntries(nextEntries);

      const newlyUnlocked = evaluateAchievements(nextEntries, nextSettings, achievementsRef.current);
      if (newlyUnlocked.length > 0) {
        const now = Date.now();
        setAchievements((prev) => {
          const map: AchievementMap = { ...prev };
          for (const id of newlyUnlocked) map[id] = now;
          return map;
        });
        const first = achievementById(newlyUnlocked[0]);
        if (first) {
          setCelebration({
            id: newId(),
            kind: 'achievement',
            icon: first.icon,
            title: `Achievement unlocked: ${first.title}`,
            message: first.description,
          });
        }
      }

      const nextTotal = todayTotalMl(nextEntries);
      const goal = nextSettings.dailyGoalMl;
      if (goal > 0 && previousTotal < goal && nextTotal >= goal) {
        setCelebration({
          id: newId(),
          kind: 'goal',
          icon: '🎉',
          title: 'Daily goal reached!',
          message: 'Beautifully done — your body thanks you.',
        });
      }
    },
    [],
  );

  const addEntry = useCallback<AppContextValue['addEntry']>(
    ({ amountMl, timestamp, type = 'water' }) => {
      const amount = validateEntryAmount(amountMl);
      if (amount <= 0) return;
      const previousTotal = todayTotalMl(entriesRef.current);
      const entry: WaterEntry = {
        id: newId(),
        amountMl: amount,
        timestamp: timestamp ?? Date.now(),
        type,
      };
      const next = [...entriesRef.current, entry].sort((a, b) => a.timestamp - b.timestamp);
      commit(next, settingsRef.current, previousTotal);
    },
    [commit],
  );

  const updateEntry = useCallback<AppContextValue['updateEntry']>(
    (id, patch) => {
      const previousTotal = todayTotalMl(entriesRef.current);
      const next = entriesRef.current
        .map((e) => {
          if (e.id !== id) return e;
          return {
            ...e,
            ...(patch.amountMl != null ? { amountMl: validateEntryAmount(patch.amountMl) || e.amountMl } : {}),
            ...(patch.timestamp != null ? { timestamp: patch.timestamp } : {}),
            ...(patch.type != null ? { type: patch.type } : {}),
          };
        })
        .sort((a, b) => a.timestamp - b.timestamp);
      commit(next, settingsRef.current, previousTotal);
    },
    [commit],
  );

  const deleteEntry = useCallback<AppContextValue['deleteEntry']>(
    (id) => {
      const previousTotal = todayTotalMl(entriesRef.current);
      const next = entriesRef.current.filter((e) => e.id !== id);
      commit(next, settingsRef.current, previousTotal);
    },
    [commit],
  );

  const updateSettings = useCallback<AppContextValue['updateSettings']>((patch) => {
    setSettings((prev) => mergeSettings({ ...prev, ...patch }));
  }, []);

  const resetTodayData = useCallback(() => {
    const today = new Date().toDateString();
    const next = entriesRef.current.filter((e) => new Date(e.timestamp).toDateString() !== today);
    setEntries(next);
  }, []);

  const clearToday = resetTodayData;

  const finishOnboarding = useCallback(() => {
    setSettings((prev) => mergeSettings({ ...prev, onboarded: true }));
  }, []);

  const loadDemoData = useCallback(() => {
    const current = settingsRef.current;
    const demo = generateDemoEntries(current);
    const now = Date.now();
    setEntries(demo);
    setAchievements({});
    // Evaluate immediately so badges populate right away.
    const unlocked = evaluateAchievements(demo, current, {});
    if (unlocked.length > 0) {
      const map: AchievementMap = {};
      for (const id of unlocked) map[id] = now;
      setAchievements(map);
    }
  }, []);

  const deleteAllData = useCallback(() => {
    setEntries([]);
    setAchievements({});
    void clearSnapshot();
  }, []);

  const exportData = useCallback(async () => {
    const snapshot: AppSnapshot = {
      settings: settingsRef.current,
      entries: entriesRef.current,
      achievements: achievementsRef.current,
      savedAt: Date.now(),
    };
    return serializeSnapshot(snapshot);
  }, []);

  const unlockedCount = useMemo(
    () => ACHIEVEMENTS.filter((a) => achievements[a.id] != null).length,
    [achievements],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      settings,
      entries,
      achievements,
      hydrated,
      celebration,
      dismissCelebration,
      addEntry,
      updateEntry,
      deleteEntry,
      clearToday,
      updateSettings,
      finishOnboarding,
      loadDemoData,
      resetTodayData,
      deleteAllData,
      exportData,
      unlockedCount,
    }),
    [
      settings,
      entries,
      achievements,
      hydrated,
      celebration,
      dismissCelebration,
      addEntry,
      updateEntry,
      deleteEntry,
      clearToday,
      updateSettings,
      finishOnboarding,
      loadDemoData,
      resetTodayData,
      deleteAllData,
      exportData,
      unlockedCount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
