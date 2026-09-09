import React, { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { WaterWave } from '../components/WaterWave';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { EntryRow } from '../components/EntryRow';
import { EmptyState } from '../components/EmptyState';
import { Chip } from '../components/Chip';
import {
  buildDailySeries,
  computeStreak,
  progressRatio,
  remainingMl,
  todayEntries,
  todayTotalMl,
} from '../lib/hydration';
import { formatVolume, formatVolumeWithUnit, unitLabel } from '../lib/units';
import { formatFullDate, formatClock } from '../lib/dates';
import { nextReminderAt, describeSchedule } from '../lib/notifications';
import { QUICK_ADDS } from '../state/defaults';

interface Props {
  navigation: any;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Still up?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * The whole point of the app in one screen: see progress, tap a button,
 * done. Everything else is one tap away.
 */
export function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { settings, entries, addEntry, deleteEntry } = useApp();
  const { width } = useWindowDimensions();

  const unit = settings.unit;
  const goal = settings.dailyGoalMl;

  const total = todayTotalMl(entries);
  const ratio = progressRatio(total, goal);
  const percent = Math.min(100, Math.round(ratio * 100));
  const remaining = remainingMl(total, goal);
  const completed = goal > 0 && total >= goal;

  const today = useMemo(() => todayEntries(entries), [entries]);
  const streak = useMemo(
    () => computeStreak(buildDailySeries(entries, goal, 90)),
    [entries, goal],
  );
  const next = useMemo(() => nextReminderAt(settings), [settings]);

  const waveSize = Math.min(width - theme.spacing(10) - theme.spacing(8), 258);

  const quickAdd = (ml: number) => {
    addEntry({ amountMl: ml });
  };

  const positive = completed
    ? "You've hit your goal — amazing. Anything more is a bonus."
    : ratio >= 0.75
      ? 'So close! A couple more glasses to go.'
      : ratio > 0
        ? "Great start — keep the momentum going."
        : 'Every journey begins with a single sip.';

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3) }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, fontWeight: '600' }}
            maxFontSizeMultiplier={1.4}
          >
            {greeting()} 👋
          </Text>
          <Text
            style={{
              color: theme.colors.text,
              fontSize: theme.font.h1,
              fontWeight: '800',
              letterSpacing: 0.2,
              marginTop: 2,
            }}
            maxFontSizeMultiplier={1.3}
          >
            {completed ? 'Goal complete!' : 'Today'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
            {formatFullDate(new Date())}
          </Text>
        </View>

        {streak > 0 ? (
          <Chip static tone="success" icon="flame" label={`${streak} day${streak === 1 ? '' : 's'}`} />
        ) : null}

        <PressableScale
          onPress={() => navigation.navigate('Achievements')}
          accessibilityRole="button"
          accessibilityLabel="View achievements"
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trophy-outline" size={20} color={theme.colors.warning} />
        </PressableScale>
      </View>

      {/* Progress hero */}
      <Animated.View entering={FadeInDown.duration(420)}>
        <Card style={{ alignItems: 'center', paddingVertical: theme.spacing(6) }}>
          <WaterWave
            progress={ratio}
            size={waveSize}
            id="home"
            frontColor={theme.colors.primary}
            backColor={theme.colors.aqua}
            trackColor={theme.colors.track}
          >
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 46,
                  fontWeight: '800',
                  letterSpacing: -1.5,
                }}
                maxFontSizeMultiplier={1.2}
                accessibilityLabel={`${percent} percent of daily goal`}
              >
                {percent}%
              </Text>
              <Text
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.font.small,
                  fontWeight: '700',
                  marginTop: 2,
                }}
              >
                {formatVolume(total, unit)} / {formatVolume(goal, unit)} {unitLabel(unit)}
              </Text>
            </View>
          </WaterWave>

          <View
            style={{
              flexDirection: 'row',
              marginTop: theme.spacing(5),
              gap: theme.spacing(3),
              alignSelf: 'stretch',
            }}
          >
            <InfoBlock
              icon={completed ? 'checkmark-circle' : 'water-outline'}
              label={completed ? 'Completed' : 'Remaining'}
              value={completed ? 'Done 🎉' : formatVolumeWithUnit(remaining, unit)}
              color={completed ? theme.colors.success : theme.colors.primary}
            />
            <InfoBlock
              icon="flag-outline"
              label="Daily goal"
              value={formatVolumeWithUnit(goal, unit)}
              color={theme.colors.aqua}
            />
          </View>

          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.small,
              marginTop: theme.spacing(4),
              textAlign: 'center',
              fontStyle: 'italic',
            }}
            maxFontSizeMultiplier={1.4}
          >
            {positive}
          </Text>
        </Card>
      </Animated.View>

      {/* Quick add */}
      <Animated.View entering={FadeInDown.delay(90).duration(420)}>
        <View style={{ flexDirection: 'row', gap: theme.spacing(2.5) }}>
          {QUICK_ADDS.map((ml) => (
            <PressableScale
              key={ml}
              onPress={() => quickAdd(ml)}
              accessibilityRole="button"
              accessibilityLabel={`Add ${formatVolumeWithUnit(ml, unit)}`}
              style={{
                flex: 1,
                paddingVertical: theme.spacing(3.5),
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.card,
                borderWidth: 1.5,
                borderColor: theme.colors.border,
                alignItems: 'center',
                gap: 2,
                ...(theme.shadow(3) as object),
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.aqua} />
              <Text style={{ color: theme.colors.text, fontWeight: '800', fontSize: theme.font.body }}>
                {formatVolume(ml, unit)}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny, fontWeight: '600' }}>
                {unitLabel(unit)}
              </Text>
            </PressableScale>
          ))}
        </View>
      </Animated.View>

      <PrimaryButton
        label="Add water"
        size="lg"
        icon="water"
        onPress={() => navigation.navigate('AddWater')}
        accessibilityHint="Log a drink in one tap"
      />

      {/* Reminder */}
      <Animated.View entering={FadeInDown.delay(150).duration(420)}>
        <PressableScale onPress={() => navigation.navigate('Reminders')} accessibilityRole="button" accessibilityLabel="Reminder settings">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3.5) }}>
            <View
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                backgroundColor: theme.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={settings.remindersEnabled ? 'notifications' : 'notifications-off-outline'}
                size={22}
                color={settings.remindersEnabled ? theme.colors.primary : theme.colors.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}>
                {settings.remindersEnabled
                  ? next
                    ? `Next reminder ${formatClock(next.getHours() * 60 + next.getMinutes())}`
                    : 'No more reminders today'
                  : 'Reminders are off'}
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
                {completed ? 'Paused — daily goal reached' : describeSchedule(settings)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Card>
        </PressableScale>
      </Animated.View>

      {/* Today's log */}
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing(2.5),
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
            Today's drinks
          </Text>
          {today.length > 0 ? (
            <PressableScale onPress={() => navigation.navigate('History')} accessibilityRole="button" accessibilityLabel="See history">
              <Text style={{ color: theme.colors.primary, fontSize: theme.font.small, fontWeight: '700' }}>
                See history
              </Text>
            </PressableScale>
          ) : null}
        </View>

        {today.length === 0 ? (
          <Card>
            <EmptyState
              icon="water-outline"
              title="Nothing logged yet"
              message="Tap 'Add water' or one of the quick amounts above to get started."
            />
          </Card>
        ) : (
          <View style={{ gap: theme.spacing(2.5) }}>
            {today.slice(0, 6).map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                unit={unit}
                onPress={() => navigation.navigate('AddWater', { entryId: entry.id })}
                onDelete={() => deleteEntry(entry.id)}
              />
            ))}
            {today.length > 6 ? (
              <PressableScale onPress={() => navigation.navigate('History')} accessibilityRole="button" accessibilityLabel="Show all drinks">
                <Text
                  style={{
                    color: theme.colors.primary,
                    fontSize: theme.font.small,
                    fontWeight: '700',
                    textAlign: 'center',
                    paddingVertical: theme.spacing(2),
                  }}
                >
                  Show all {today.length} drinks
                </Text>
              </PressableScale>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

function InfoBlock({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.cardMuted,
        borderRadius: theme.radius.md,
        padding: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing(2.5),
      }}
    >
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800' }}
          maxFontSizeMultiplier={1.4}
        >
          {value}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    </View>
  );
}
