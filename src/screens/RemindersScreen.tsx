import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Screen, ScreenHeader } from '../components/Screen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { SegmentedControl } from '../components/SegmentedControl';
import { ToggleRow } from '../components/SettingRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { TimePickerModal } from '../components/TimePickerModal';
import { formatClock, timestampToClock } from '../lib/dates';
import { computeReminderTimes, describeSchedule, nextReminderAt, requestNotificationPermission } from '../lib/notifications';
import { makeCustomReminder } from '../state/defaults';
import { isGoalReachedToday } from '../lib/hydration';
import { formatVolumeWithUnit } from '../lib/units';

const INTERVALS = [15, 20, 30, 45, 60, 90, 120, 180];

interface Props {
  navigation?: any;
}

/** Full reminder configuration: window, interval or a custom schedule. */
export function RemindersScreen(_props: Props) {
  const { theme } = useTheme();
  const { settings, updateSettings, entries } = useApp();

  const [editingTime, setEditingTime] = useState<null | { kind: 'start' | 'end'; id?: string }>(null);

  const goalReached = isGoalReachedToday(entries, settings);
  const next = useMemo(() => nextReminderAt(settings), [settings]);
  const upcoming = useMemo(() => computeReminderTimes(settings, new Date(), 5), [settings]);
  const customCount = settings.customReminders.filter((r) => r.enabled).length;

  const toggleEnabled = async (v: boolean) => {
    if (!v) {
      updateSettings({ remindersEnabled: false });
      return;
    }

    // Android 13+ requires explicit notification permission. Request it before
    // enabling the feature so the UI does not claim reminders are active when
    // the OS has blocked notifications.
    const granted = await requestNotificationPermission();
    if (granted) updateSettings({ remindersEnabled: true });
  };

  const addCustom = () => {
    const last = settings.customReminders[settings.customReminders.length - 1];
    const base = last ? (last.time + 120) % 1440 : 12 * 60;
    updateSettings({
      customReminders: [...settings.customReminders, makeCustomReminder(base)],
      useCustomSchedule: true,
    });
  };

  const removeCustom = (id: string) => {
    updateSettings({ customReminders: settings.customReminders.filter((r) => r.id !== id) });
  };

  const toggleCustom = (id: string) => {
    updateSettings({
      customReminders: settings.customReminders.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
    });
  };

  return (
    <Screen>
      <ScreenHeader title="Reminders" subtitle="Local notifications that respect your day" />

      {/* Status banner */}
      <Animated.View entering={FadeInDown.duration(360)}>
        <Card
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing(3.5),
            backgroundColor: goalReached ? theme.colors.successSoft : theme.colors.card,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 18,
              backgroundColor: goalReached ? theme.colors.success : theme.colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={goalReached ? 'checkmark-circle' : settings.remindersEnabled ? 'notifications' : 'notifications-off-outline'}
              size={24}
              color={goalReached ? '#FFFFFF' : settings.remindersEnabled ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800' }}>
              {goalReached
                ? 'Goal reached — reminders paused'
                : settings.remindersEnabled
                  ? next
                    ? `Next at ${timestampToClock(next.getTime())}`
                    : 'No reminders scheduled'
                  : 'Reminders are off'}
            </Text>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
              {goalReached
                ? `Start again tomorrow, or add ${formatVolumeWithUnit(
                    Math.max(0, settings.dailyGoalMl - entries.reduce((s, e) => s + (new Date(e.timestamp).toDateString() === new Date().toDateString() ? e.amountMl : 0), 0)),
                    settings.unit,
                  )} to resume.`
                : describeSchedule(settings)}
            </Text>
          </View>
        </Card>
      </Animated.View>

      <Card padded={false}>
        <ToggleRow
          icon="notifications-outline"
          label="Enable reminders"
          description="Notifications are scheduled on-device and work offline"
          value={settings.remindersEnabled}
          onValueChange={toggleEnabled}
        />
      </Card>

      {settings.remindersEnabled ? (
        <Animated.View entering={FadeIn.duration(280)} style={{ gap: theme.spacing(4) }}>
          <SegmentedControl
            value={settings.useCustomSchedule ? 'custom' : 'interval'}
            onChange={(v) => updateSettings({ useCustomSchedule: v === 'custom' })}
            options={[
              { value: 'interval', label: 'Every N minutes' },
              { value: 'custom', label: 'Custom times' },
            ]}
          />

          {!settings.useCustomSchedule ? (
            <Animated.View entering={FadeIn.duration(240)} style={{ gap: theme.spacing(4) }}>
              <Card>
                <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800', marginBottom: theme.spacing(3) }}>
                  Reminder window
                </Text>
                <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
                  <TimeButton
                    icon="sunny-outline"
                    label="Start"
                    value={formatClock(settings.reminderStart)}
                    onPress={() => setEditingTime({ kind: 'start' })}
                  />
                  <TimeButton
                    icon="moon-outline"
                    label="End"
                    value={formatClock(settings.reminderEnd)}
                    onPress={() => setEditingTime({ kind: 'end' })}
                  />
                </View>
              </Card>

              <Card>
                <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800', marginBottom: theme.spacing(3) }}>
                  Repeat every
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
                  {INTERVALS.map((m) => (
                    <Chip
                      key={m}
                      label={m < 60 ? `${m} min` : `${m / 60} h`}
                      selected={settings.reminderIntervalMin === m}
                      onPress={() => updateSettings({ reminderIntervalMin: m })}
                    />
                  ))}
                </View>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(240)} style={{ gap: theme.spacing(4) }}>
              <Card padded={false}>
                {settings.customReminders.length === 0 ? (
                  <View style={{ padding: theme.spacing(5), alignItems: 'center', gap: theme.spacing(2) }}>
                    <Ionicons name="time-outline" size={28} color={theme.colors.textMuted} />
                    <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, fontWeight: '700' }}>
                      No custom times yet
                    </Text>
                    <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, textAlign: 'center' }}>
                      Add the exact moments you'd like a nudge — around meetings, meals or workouts.
                    </Text>
                  </View>
                ) : (
                  settings.customReminders.map((r, i) => (
                    <View key={r.id}>
                      {i > 0 ? <View style={{ height: 1, backgroundColor: theme.colors.border }} /> : null}
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: theme.spacing(3.5),
                          paddingHorizontal: theme.spacing(4),
                          gap: theme.spacing(3),
                          opacity: r.enabled ? 1 : 0.55,
                        }}
                      >
                        <PressableScale
                          onPress={() => setEditingTime({ kind: 'start', id: r.id })}
                          style={{ flex: 1 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Edit reminder at ${formatClock(r.time)}`}
                        >
                          <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
                            {formatClock(r.time)}
                          </Text>
                        </PressableScale>

                        <PressableScale
                          onPress={() => toggleCustom(r.id)}
                          accessibilityRole="switch"
                          accessibilityState={{ checked: r.enabled }}
                          accessibilityLabel={`Toggle reminder at ${formatClock(r.time)}`}
                          style={{
                            width: 50,
                            height: 30,
                            borderRadius: 15,
                            padding: 3,
                            justifyContent: 'center',
                            backgroundColor: r.enabled ? theme.colors.primary : theme.colors.track,
                          }}
                        >
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: '#FFFFFF',
                              alignSelf: r.enabled ? 'flex-end' : 'flex-start',
                            }}
                          />
                        </PressableScale>

                        <PressableScale
                          onPress={() => removeCustom(r.id)}
                          haptic={false}
                          accessibilityRole="button"
                          accessibilityLabel="Remove reminder"
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 17,
                            backgroundColor: theme.colors.dangerSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
                        </PressableScale>
                      </View>
                    </View>
                  ))
                )}
              </Card>

              <PrimaryButton label="Add reminder time" icon="add" variant="secondary" onPress={addCustom} />
              {settings.useCustomSchedule && customCount === 0 ? (
                <Text style={{ color: theme.colors.danger, fontSize: theme.font.small, textAlign: 'center' }}>
                  No active custom times — reminders will not fire. Add a time or switch back to intervals.
                </Text>
              ) : null}
            </Animated.View>
          )}

          <Card padded={false}>
            <ToggleRow
              icon="volume-high-outline"
              label="Sound"
              description="Play a tone with each reminder"
              value={settings.soundEnabled}
              onValueChange={(v) => updateSettings({ soundEnabled: v })}
            />
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <ToggleRow
              icon="phone-portrait-outline"
              label="Vibration"
              description="Buzz silently when a reminder arrives"
              value={settings.vibrationEnabled}
              onValueChange={(v) => updateSettings({ vibrationEnabled: v })}
            />
          </Card>

          <Card>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800', marginBottom: theme.spacing(3) }}>
              Upcoming
            </Text>
            {upcoming.length === 0 ? (
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small }}>
                Nothing scheduled. Enable reminders or add a custom time.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
                {upcoming.map((d) => (
                  <Chip key={d.getTime()} static label={timestampToClock(d.getTime())} icon="alarm-outline" />
                ))}
              </View>
            )}
          </Card>
        </Animated.View>
      ) : null}

      <Card style={{ backgroundColor: theme.colors.aquaSoft, borderColor: 'transparent' }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing(3), alignItems: 'flex-start' }}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.aqua} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.small, flex: 1, lineHeight: 20 }}>
            Reminders pause automatically the moment you reach{' '}
            {formatVolumeWithUnit(settings.dailyGoalMl, settings.unit)} and resume the next day. Notifications are
            scheduled locally — no server is involved and nothing is shared.
          </Text>
        </View>
      </Card>

      <TimePickerModal
        visible={editingTime !== null}
        title={editingTime?.id ? 'Edit reminder' : editingTime?.kind === 'start' ? 'Window starts' : 'Window ends'}
        value={
          editingTime?.id
            ? (settings.customReminders.find((r) => r.id === editingTime.id)?.time ?? 0)
            : editingTime?.kind === 'start'
              ? settings.reminderStart
              : settings.reminderEnd
        }
        onCancel={() => setEditingTime(null)}
        onSave={(mins) => {
          if (editingTime?.id) {
            updateSettings({
              customReminders: settings.customReminders
                .map((r) => (r.id === editingTime.id ? { ...r, time: mins } : r))
                .sort((a, b) => a.time - b.time),
            });
          } else if (editingTime?.kind === 'start') {
            updateSettings({ reminderStart: mins });
          } else {
            updateSettings({ reminderEnd: mins });
          }
          setEditingTime(null);
        }}
      />
    </Screen>
  );
}

function TimeButton({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} time ${value}`}
      style={{
        flex: 1,
        padding: theme.spacing(3.5),
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.cardMuted,
        borderWidth: 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        gap: 2,
      }}
    >
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, fontWeight: '700' }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>{value}</Text>
    </PressableScale>
  );
}
