# Aqua — Water Reminder 💧

A modern, production-ready hydration tracker for **Android**, **iOS** and **web**, built with
**Expo SDK 57**, **React Native 0.86** and **TypeScript** (strict mode).

Aqua is offline-first and privacy-first: there is no account, no backend and no analytics. Your
weight, activity level and entire hydration log are written to the device only.

---

## Feature highlights

| Area | What you get |
| --- | --- |
| **Dashboard** | Animated circular wave progress, % complete, amount consumed vs. goal, remaining volume, streak, next reminder time and today's log |
| **One-tap logging** | Quick-add `+250 / +500 / +750`, a large *Add water* button, vessel presets, steppers and custom entry |
| **Add / edit water** | Predefined amounts, custom amount with validation, drink type, timestamp editing, delete |
| **History** | Weekly + 30-day bar chart with a goal line, tap-to-inspect days, average intake, best day, goals completed, current streak, full day-by-day log |
| **Reminders** | Enable/disable, start/end window, interval (15 min – 3 h), **custom schedule**, sound & vibration, upcoming preview, overnight windows supported |
| **Smart goal** | Optional personalised recommendation from weight + activity level (~35 ml/kg scaled by activity), fully overridable |
| **Gamification** | 10 achievement badges, hydration streaks, goal-completion celebration banner |
| **Settings** | ml / fl oz + kg / lb, light / dark / system theme, haptics, sample data, reset today, JSON export, delete all data |
| **Onboarding** | 4-step first run: welcome → about you → recommended goal → reminders, with a *Skip* path and a *Explore with sample data* path |

**The primary flow is exactly one tap:** open the app → tap **Add water** → done.

---

## Screens

```
Onboarding (4 steps, gated on first launch)
└── Main (bottom tabs)
    ├── Home        — progress hero, quick add, reminders, today's log
    ├── History     — charts, statistics, day log
    ├── Reminders   — full notification configuration
    └── Profile     — goal, units, theme, privacy, data management
Modal:  Add water (also used to edit an existing entry)
Stack:  Achievements
```

---

## Project structure

```
App.tsx                     Root: fonts → providers → navigator → celebration overlay
src/
├── components/
│   ├── WaterWave.tsx       Animated circular wave progress indicator
│   ├── BarChart.tsx        Weekly / monthly chart with dashed goal line
│   ├── Slider.tsx          PanResponder slider (works on Android, iOS & web)
│   ├── WheelPicker.tsx     Snap-scroll wheel used by the clock picker
│   ├── TimePickerModal.tsx Cross-platform time picker
│   ├── Screen.tsx          Safe-area shell + large stack header
│   ├── Card / Chip / PrimaryButton / SegmentedControl
│   ├── SettingRow.tsx      Label/value rows + switch rows
│   ├── EntryRow.tsx        Log row with edit + delete
│   ├── CelebrationBanner.tsx  Transient goal / badge announcement
│   └── StatTile / SectionHeader / EmptyState / PressableScale
├── lib/
│   ├── dates.ts            Local-day bucketing, clock formatting, HH:mm parsing
│   ├── units.ts            ml ⇄ fl oz, kg ⇄ lb, display formatting
│   ├── hydration.ts        Goal recommendation, series building, stats, streaks
│   ├── achievements.ts     Badge definitions + deterministic unlock evaluation
│   ├── notifications.ts    Pure reminder planner + OS scheduling
│   ├── demo.ts             Deterministic 3-week sample dataset
│   └── storage.ts          Versioned AsyncStorage snapshot read/write
├── navigation/RootNavigator.tsx
├── screens/                Onboarding, Home, AddWater, History, Reminders, Profile, Achievements
├── state/
│   ├── AppContext.tsx      Single mutation path, persistence, notification syncing
│   └── defaults.ts         Default settings, validation, vessel presets
└── theme/                  Light/dark palettes + ThemeProvider
```

### Architecture notes

- **Single source of truth.** Every mutation goes through `AppContext.commit()`, which recomputes
  achievements and goal celebrations in one place — the UI never has to keep them in sync.
- **Offline-first.** The whole state is one versioned snapshot persisted to `AsyncStorage` on change.
- **Derivation over storage.** Streaks, statistics and badges are derived from the entry list, so
  they can never drift out of sync with your data.
- **Pure reminder planner.** `computeReminderTimes()` is a pure function used for *both* the
  "next reminder" preview and the actual OS scheduling, so the preview always matches reality.
- **Zero-anim-frame-cost visuals.** The water wave is a pre-built SVG path that is only *moved*
  on the UI thread, so it holds 60fps on low-end devices.

---

## Getting started

```bash
npm install
npx expo start            # then press a (Android), i (iOS) or w (web)
```

> Requires Node 18+ and the Expo Go app (or a development build) on your device.

### Useful scripts

```bash
npx expo start            # dev server with hot reload
npx expo start --android  # launch on Android
npx expo start --ios      # launch on iOS
npx expo start --web      # launch in the browser
npx expo export --platform all   # produce a production bundle for all platforms
npx tsc --noEmit          # typecheck
```

### Building a standalone app

```bash
npm install -g eas-cli
eas build --platform android --profile production
eas build --platform ios     --profile production
eas submit --platform android
eas submit --platform ios
```

---

## Notifications

Reminders use **local notifications** (`expo-notifications`) — no server is involved.

- Scheduling is re-planned automatically whenever the schedule, preferences *or* today's progress
  change.
- Reminders **pause automatically the moment the daily goal is reached** and resume the next day.
- Overnight windows (e.g. 22:00 → 02:00) are handled correctly.
- On Android a dedicated `water-reminders` channel controls importance, sound and vibration.
- On **web** notifications are unavailable, so the app degrades gracefully — the planner still shows
  upcoming times in the UI.

The `expo-notifications` config plugin is registered in `app.json`, and the Android permission set
(`POST_NOTIFICATIONS`, `VIBRATE`, `SCHEDULE_EXACT_ALARM`, …) is declared there too.

---

## Demo / sample data

Sample data makes it easy to explore charts during development:

- Onboarding → **Explore with sample data**
- Profile → **Load sample data**

It generates a deterministic 21-day history (≈158 entries, ~70 % of days meeting the goal) plus a
partially complete today. **Load sample data replaces the current log.**

---

## Privacy

- No account, no sign-up, no server, no third-party analytics.
- Body weight and activity level are stored **only** to suggest a goal.
- **Profile → Export my data** produces a readable JSON copy you can copy or share.
- **Delete all data** erases everything stored on the device.

---

## Testing

The pure domain layer (dates, units, hydration maths, achievements, demo data, settings validation
and the reminder planner) is covered by an executable assertion suite — **89 assertions, all
passing**, covering goal recommendation, streak survival across a partial today, summary statistics,
deterministic/idempotent badge unlocks, reminder slot generation, custom schedules, overnight
windows and input validation.

Verified end-to-end:

- `npx tsc --noEmit` — clean under strict TypeScript.
- `npx expo export --platform all` — bundles for **Android, iOS and web** with no errors.

---

## Tech stack

Expo SDK 57 · React Native 0.86 · React 19 · TypeScript (strict) ·
@react-navigation (native-stack + bottom-tabs) · react-native-reanimated 4 · react-native-svg ·
expo-notifications · expo-haptics · expo-linear-gradient · expo-image ·
@react-native-async-storage/async-storage

## License

MIT — see [LICENSE](./LICENSE).
