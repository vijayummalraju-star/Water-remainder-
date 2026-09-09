import React, { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Screen, ScreenHeader } from '../components/Screen';
import { Card } from '../components/Card';
import { BarChart, BarDatum } from '../components/BarChart';
import { SegmentedControl } from '../components/SegmentedControl';
import { StatTile } from '../components/StatTile';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { EntryRow } from '../components/EntryRow';
import { EmptyState } from '../components/EmptyState';
import {
  buildDailySeries,
  computeStreak,
  summarize,
} from '../lib/hydration';
import { DayStat } from '../types';
import { formatVolume, formatVolumeWithUnit, unitLabel } from '../lib/units';
import { formatDayLabel, formatShortDay, keyToDate, todayKey, formatMonthYear } from '../lib/dates';

type Period = 'week' | 'month';

interface Props {
  navigation: any;
}

/** Charts, statistics and a full day-by-day log. */
export function HistoryScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { settings, entries, deleteEntry } = useApp();

  const [period, setPeriod] = useState<Period>('week');
  const goal = settings.dailyGoalMl;
  const unit = settings.unit;

  const days = period === 'week' ? 7 : 30;
  const series = useMemo(() => buildDailySeries(entries, goal, days), [entries, goal, days]);
  const allSeries = useMemo(() => buildDailySeries(entries, goal, 3650), [entries, goal]);
  const summary = useMemo(() => summarize(series), [series]);
  const lifetime = useMemo(() => summarize(allSeries), [allSeries]);
  const streak = useMemo(() => computeStreak(allSeries), [allSeries]);

  const [selectedKey, setSelectedKey] = useState<string>(todayKey());
  const selected: DayStat | undefined = series.find((d) => d.key === selectedKey);

  const hasData = entries.length > 0;

  const chartData: BarDatum[] = series.map((d) => {
    const date = keyToDate(d.key);
    const showLabel = period === 'week' || date.getDate() % 5 === 0 || d.key === series[series.length - 1]?.key;
    return {
      key: d.key,
      valueMl: d.totalMl,
      label: showLabel
        ? period === 'week'
          ? formatShortDay(d.key)
          : `${date.getDate()}`
        : '',
      subLabel: period === 'week' ? `${formatVolume(d.totalMl, unit)}` : '',
    };
  });

  const listDays = useMemo(() => [...series].reverse(), [series]);

  const header = (
    <View style={{ gap: theme.spacing(4), paddingBottom: theme.spacing(2) }}>
      <ScreenHeader
        title="History"
        subtitle={`${formatMonthYear()} · ${formatVolumeWithUnit(lifetime.totalMl, unit)} tracked all-time`}
      />

      {!hasData ? (
        <Card>
          <EmptyState
            icon="stats-chart-outline"
            title="No history yet"
            message="Log a few drinks and your charts, streaks and statistics will appear here."
            actionLabel="Load sample data"
            onAction={() => navigation.navigate('Profile', { screen: 'Profile' })}
          />
        </Card>
      ) : null}

      <SegmentedControl
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'week', label: 'This week' },
          { value: 'month', label: 'Last 30 days' },
        ]}
      />

      <Card>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: theme.spacing(4),
          }}
        >
          <View>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
              {period === 'week' ? 'Weekly intake' : 'Monthly intake'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
              Goal {formatVolume(goal, unit)} {unitLabel(unit)} · green = goal reached
            </Text>
          </View>
          <Chip static icon="flame" tone={streak > 0 ? 'success' : 'default'} label={`${streak}🔥`} />
        </View>

        {hasData ? (
          <BarChart
            data={chartData}
            goalMl={goal}
            unit={unit}
            height={period === 'week' ? 172 : 140}
            barWidth={period === 'week' ? 18 : 7}
            selectedIndex={series.findIndex((d) => d.key === selectedKey)}
            onSelectIndex={(i) => series[i] && setSelectedKey(series[i].key)}
          />
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
        <StatTile
          icon="analytics-outline"
          label="Average / day"
          value={`${formatVolume(summary.avgMl, unit)}`}
          sub={unitLabel(unit)}
        />
        <StatTile
          icon="trophy-outline"
          label="Best day"
          value={summary.bestDayKey ? `${formatVolume(summary.bestDayMl, unit)}` : '—'}
          sub={summary.bestDayKey ? formatDayLabel(summary.bestDayKey) : 'No data yet'}
          color={theme.colors.warning}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
        <StatTile
          icon="checkmark-done-outline"
          label="Goals completed"
          value={`${summary.completedDays}/${summary.totalDays}`}
          sub={`${Math.round(summary.completionRate * 100)}% of days`}
          color={theme.colors.success}
        />
        <StatTile
          icon="flame-outline"
          label="Current streak"
          value={`${streak}`}
          sub={streak === 1 ? 'day' : 'days'}
          color={theme.colors.danger}
        />
      </View>

      {selected ? (
        <Animated.View key={selected.key} entering={FadeInDown.duration(280)}>
          <Card>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: theme.spacing(3),
              }}
            >
              <View>
                <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
                  {formatDayLabel(selected.key)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
                  {selected.entries.length} drink{selected.entries.length === 1 ? '' : 's'} ·{' '}
                  {formatVolumeWithUnit(selected.totalMl, unit)}
                </Text>
              </View>
              {selected.completed ? (
                <Chip static tone="success" icon="checkmark-circle" label="Goal met" />
              ) : (
                <Chip static icon="ellipse-outline" label={`${Math.round(selected.ratio * 100)}%`} />
              )}
            </View>

            {selected.entries.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small }}>
                No drinks logged on this day.
              </Text>
            ) : (
              <View style={{ gap: theme.spacing(2.5) }}>
                {selected.entries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    unit={unit}
                    onPress={() => navigation.navigate('AddWater', { entryId: entry.id })}
                    onDelete={() => deleteEntry(entry.id)}
                  />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      ) : null}

      <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>Daily log</Text>
    </View>
  );

  return (
    <Screen scroll={false}>
      <FlatList
        data={listDays}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingHorizontal: theme.spacing(5), paddingBottom: theme.spacing(10) }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.small,
              textAlign: 'center',
              marginTop: theme.spacing(5),
              lineHeight: 19,
            }}
          >
            Statistics are calculated locally from your own log.{'\n'}Nothing is uploaded anywhere.
          </Text>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(320)}>
            <PressableScale
              onPress={() => setSelectedKey(item.key)}
              accessibilityRole="button"
              accessibilityLabel={`${formatDayLabel(item.key)}, ${formatVolumeWithUnit(item.totalMl, unit)}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.spacing(3),
                padding: theme.spacing(3.5),
                marginBottom: theme.spacing(2.5),
                borderRadius: theme.radius.md,
                backgroundColor:
                  selectedKey === item.key ? theme.colors.primarySoft : theme.colors.card,
                borderWidth: 1,
                borderColor: selectedKey === item.key ? theme.colors.primary : theme.colors.border,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  backgroundColor: item.completed ? theme.colors.successSoft : theme.colors.cardMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={item.completed ? 'checkmark-circle' : 'water-outline'}
                  size={20}
                  color={item.completed ? theme.colors.success : theme.colors.textMuted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}>
                    {formatDayLabel(item.key)}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.small, fontWeight: '700' }}>
                    {formatVolume(item.totalMl, unit)} {unitLabel(unit)}
                  </Text>
                </View>
                <View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.colors.track,
                    marginTop: theme.spacing(2),
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(100, item.ratio * 100)}%`,
                      height: '100%',
                      borderRadius: 3,
                      backgroundColor: item.completed ? theme.colors.success : theme.colors.primary,
                    }}
                  />
                </View>
              </View>
            </PressableScale>
          </Animated.View>
        )}
      />
    </Screen>
  );
}
