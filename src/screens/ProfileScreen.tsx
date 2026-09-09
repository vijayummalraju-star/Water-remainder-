import React, { useMemo, useState } from 'react';
import { Modal, Share, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { ACTIVITY_LEVELS } from '../theme/theme';
import { Screen, ScreenHeader } from '../components/Screen';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { Slider } from '../components/Slider';
import { SegmentedControl } from '../components/SegmentedControl';
import { PrimaryButton } from '../components/PrimaryButton';
import { PressableScale } from '../components/PressableScale';
import { SettingRow, ToggleRow } from '../components/SettingRow';
import { SectionHeader } from '../components/SectionHeader';
import { StatTile } from '../components/StatTile';
import {
  MAX_GOAL_ML,
  MIN_GOAL_ML,
  buildDailySeries,
  clampGoal,
  computeStreak,
  recommendGoalMl,
  summarize,
  todayTotalMl,
} from '../lib/hydration';
import { formatVolume, formatVolumeWithUnit, fromKg, toKg, unitLabel } from '../lib/units';
import { formatClock, formatFullDate } from '../lib/dates';
import { ActivityLevel, UnitSystem } from '../types';

interface Props {
  navigation: any;
}

/** Everything configurable, grouped and fully local. */
export function ProfileScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const {
    settings,
    entries,
    updateSettings,
    resetTodayData,
    deleteAllData,
    loadDemoData,
    exportData,
    unlockedCount,
  } = useApp();

  const [goalOpen, setGoalOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportText, setExportText] = useState('');
  const [confirm, setConfirm] = useState<null | 'today' | 'all' | 'demo'>(null);

  const unit = settings.unit;
  const series = useMemo(() => buildDailySeries(entries, settings.dailyGoalMl, 3650), [entries, settings.dailyGoalMl]);
  const stats = useMemo(() => summarize(series), [series]);
  const streak = useMemo(() => computeStreak(series), [series]);
  const todayTotal = todayTotalMl(entries);
  const recommendation = useMemo(
    () => recommendGoalMl(settings.weightKg, settings.activityLevel),
    [settings.weightKg, settings.activityLevel],
  );

  const openExport = async () => {
    const json = await exportData();
    setExportText(json);
    setExportOpen(true);
  };

  const shareExport = async () => {
    try {
      await Share.share({ title: 'Aqua hydration data', message: exportText });
    } catch {
      // Web preview / unsupported: the on-screen JSON remains copyable.
    }
  };

  const applyConfirm = () => {
    if (confirm === 'today') resetTodayData();
    else if (confirm === 'all') deleteAllData();
    else if (confirm === 'demo') loadDemoData();
    setConfirm(null);
  };

  return (
    <Screen>
      <ScreenHeader title="Profile" subtitle="Goals, units, appearance and data" />

      {/* Overview */}
      <Animated.View entering={FadeInDown.duration(380)}>
        <Card style={{ gap: theme.spacing(4) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(4) }}>
            <View
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                overflow: 'hidden',
                backgroundColor: theme.colors.aqua,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person" size={30} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
                {formatVolumeWithUnit(settings.dailyGoalMl, unit)} / day
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
                {settings.goalSource === 'recommended' ? 'Personalised goal' : 'Custom goal'} ·{' '}
                {formatVolume(todayTotal, unit)} {unitLabel(unit)} today
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
            <StatTile icon="flame-outline" label="Streak" value={`${streak}`} sub={streak === 1 ? 'day' : 'days'} color={theme.colors.danger} />
            <StatTile
              icon="trophy-outline"
              label="Badges"
              value={`${unlockedCount}`}
              sub="unlocked"
              color={theme.colors.warning}
            />
            <StatTile
              icon="checkmark-done-outline"
              label="Goals"
              value={`${stats.completedDays}`}
              sub="all-time"
              color={theme.colors.success}
            />
          </View>

          <PrimaryButton
            label="View achievements"
            variant="secondary"
            icon="ribbon-outline"
            onPress={() => navigation.navigate('Achievements')}
          />
        </Card>
      </Animated.View>

      {/* Goal */}
      <View>
        <SectionHeader title="Hydration goal" subtitle="Adjust any time — history is never recalculated" />
        <Card padded={false}>
          <SettingRow
            icon="flag-outline"
            label="Daily goal"
            value={formatVolumeWithUnit(settings.dailyGoalMl, unit)}
            chevron
            onPress={() => setGoalOpen(true)}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <SettingRow
            icon="sparkles-outline"
            label="Recalculate from my profile"
            description={`Suggests ${formatVolumeWithUnit(recommendation, unit)} for ${Math.round(
              fromKg(settings.weightKg, unit),
            )} ${unitLabel(unit) === 'kg' ? 'kg' : 'lb'} · ${settings.activityLevel}`}
            chevron
            onPress={() => {
              updateSettings({ dailyGoalMl: clampGoal(recommendation), goalSource: 'recommended' });
              setGoalOpen(true);
            }}
          />
        </Card>
      </View>

      {/* Profile inputs */}
      <View>
        <SectionHeader title="About you" subtitle="Used only to suggest a sensible goal" />
        <Card padded={false}>
          <SettingRow
            icon="body-outline"
            label="Body weight"
            value={`${Math.round(fromKg(settings.weightKg, unit))} ${unitLabel(unit) === 'kg' ? 'kg' : 'lb'}`}
            chevron
            onPress={() => setWeightOpen(true)}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <View style={{ padding: theme.spacing(4) }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700', marginBottom: theme.spacing(3) }}>
              Activity level
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
              {ACTIVITY_LEVELS.map((level) => (
                <Chip
                  key={level.key}
                  label={level.label}
                  icon={level.icon as any}
                  selected={settings.activityLevel === level.key}
                  onPress={() => updateSettings({ activityLevel: level.key as ActivityLevel })}
                />
              ))}
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <View style={{ padding: theme.spacing(4) }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700', marginBottom: theme.spacing(3) }}>
              Units
            </Text>
            <SegmentedControl
              value={unit}
              onChange={(u: UnitSystem) => updateSettings({ unit: u })}
              options={[
                { value: 'metric', label: 'ml · kg' },
                { value: 'imperial', label: 'fl oz · lb' },
              ]}
            />
          </View>
        </Card>
      </View>

      {/* Appearance */}
      <View>
        <SectionHeader title="Appearance" />
        <Card padded={false}>
          <View style={{ padding: theme.spacing(4) }}>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700', marginBottom: theme.spacing(3) }}>
              Theme
            </Text>
            <SegmentedControl
              value={settings.theme}
              onChange={(v: 'system' | 'light' | 'dark') => updateSettings({ theme: v })}
              options={[
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </View>
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <ToggleRow
            icon="pulse-outline"
            label="Haptic feedback"
            description="Subtle vibration when tapping buttons"
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSettings({ hapticsEnabled: v })}
          />
        </Card>
      </View>

      {/* Notifications */}
      <View>
        <SectionHeader title="Notifications" subtitle="Scheduled on-device, works offline" />
        <Card padded={false}>
          <ToggleRow
            icon="notifications-outline"
            label="Drink reminders"
            description={`Next ${settings.remindersEnabled ? 'reminder window ' + formatClock(settings.reminderStart) : '—'}`}
            value={settings.remindersEnabled}
            onValueChange={(v) => updateSettings({ remindersEnabled: v })}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <SettingRow
            icon="options-outline"
            label="Reminder schedule"
            value={settings.useCustomSchedule ? 'Custom' : `Every ${settings.reminderIntervalMin}m`}
            chevron
            onPress={() => navigation.navigate('Reminders')}
          />
        </Card>
      </View>

      {/* Data */}
      <View>
        <SectionHeader title="Your data" subtitle="Stored locally on this device only" />
        <Card padded={false}>
          <SettingRow
            icon="download-outline"
            label="Export my data"
            description="View or share a JSON copy of your log"
            chevron
            onPress={openExport}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <SettingRow
            icon="color-wand-outline"
            label="Load sample data"
            description="Populate charts with three weeks of demo history"
            chevron
            onPress={() => setConfirm('demo')}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <SettingRow
            icon="refresh-outline"
            label="Reset today"
            description="Clear every drink logged today"
            chevron
            danger
            onPress={() => setConfirm('today')}
          />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <SettingRow
            icon="trash-outline"
            label="Delete all data"
            description="Erase your full history and achievements"
            chevron
            danger
            onPress={() => setConfirm('all')}
          />
        </Card>
      </View>

      <Card style={{ backgroundColor: theme.colors.aquaSoft, borderColor: 'transparent' }}>
        <View style={{ flexDirection: 'row', gap: theme.spacing(3), alignItems: 'flex-start' }}>
          <Ionicons name="lock-closed-outline" size={20} color={theme.colors.aqua} />
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.small, flex: 1, lineHeight: 20 }}>
            <Text style={{ fontWeight: '800' }}>Privacy first.</Text> Aqua has no account, no analytics and no
            server. Your weight, activity and hydration log are written to this device only and can be erased at
            any time.
          </Text>
        </View>
      </Card>

      <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, textAlign: 'center' }}>
        Aqua · Water Reminder{'\n'}Last synced locally {formatFullDate(new Date())}
      </Text>

      {/* Goal editor */}
      <Sheet visible={goalOpen} title="Daily hydration goal" onClose={() => setGoalOpen(false)}>
        <GoalEditor
          value={settings.dailyGoalMl}
          unit={unit}
          onSave={(ml) => {
            updateSettings({ dailyGoalMl: clampGoal(ml), goalSource: 'manual' });
            setGoalOpen(false);
          }}
        />
      </Sheet>

      {/* Weight editor */}
      <Sheet visible={weightOpen} title="Body weight" onClose={() => setWeightOpen(false)}>
        <WeightEditor
          value={settings.weightKg}
          unit={unit}
          onSave={(kg) => {
            updateSettings({ weightKg: kg });
            setWeightOpen(false);
          }}
        />
      </Sheet>

      {/* Export viewer */}
      <Sheet visible={exportOpen} title="Export my data" onClose={() => setExportOpen(false)}>
        <View style={{ gap: theme.spacing(3) }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 20 }}>
            This is everything Aqua stores about you. Copy or share it however you like.
          </Text>
          <View
            style={{
              maxHeight: 260,
              backgroundColor: theme.colors.cardMuted,
              borderRadius: theme.radius.md,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: theme.spacing(3),
            }}
          >
            <Text selectable style={{ color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
              {exportText}
            </Text>
          </View>
          <PrimaryButton label="Share" icon="share-outline" onPress={shareExport} />
          <PrimaryButton label="Done" variant="ghost" onPress={() => setExportOpen(false)} />
        </View>
      </Sheet>

      {/* Confirm dialog */}
      <ConfirmDialog
        visible={confirm !== null}
        title={
          confirm === 'today'
            ? "Reset today's data?"
            : confirm === 'all'
              ? 'Delete all data?'
              : 'Load sample data?'
        }
        message={
          confirm === 'today'
            ? 'Every drink logged today will be removed. This cannot be undone.'
            : confirm === 'all'
              ? 'Your entire history, goal and achievements will be permanently erased from this device.'
              : 'This replaces your current log with three weeks of demo history so you can explore the charts.'
        }
        confirmLabel={confirm === 'demo' ? 'Load' : 'Delete'}
        destructive={confirm !== 'demo'}
        onCancel={() => setConfirm(null)}
        onConfirm={applyConfirm}
      />
    </Screen>
  );
}

function GoalEditor({ value, unit, onSave }: { value: number; unit: UnitSystem; onSave: (ml: number) => void }) {
  const { theme } = useTheme();
  const [goal, setGoal] = useState(value);
  const presets = [1500, 2000, 2500, 3000, 3500];

  return (
    <View style={{ gap: theme.spacing(4) }}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: theme.colors.text, fontSize: 42, fontWeight: '800', letterSpacing: -1 }}>
          {formatVolume(goal, unit)}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, fontWeight: '600' }}>
          {unitLabel(unit)} per day
        </Text>
      </View>

      <Slider
        value={goal}
        min={MIN_GOAL_ML}
        max={MAX_GOAL_ML}
        step={50}
        onChange={setGoal}
        showValue={false}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2), justifyContent: 'center' }}>
        {presets.map((ml) => (
          <Chip key={ml} label={formatVolumeWithUnit(ml, unit)} selected={goal === ml} onPress={() => setGoal(ml)} />
        ))}
      </View>

      <PrimaryButton label="Save goal" icon="checkmark" size="lg" onPress={() => onSave(goal)} />
    </View>
  );
}

function WeightEditor({ value, unit, onSave }: { value: number; unit: UnitSystem; onSave: (kg: number) => void }) {
  const { theme } = useTheme();
  const [text, setText] = useState(`${Math.round(fromKg(value, unit))}`);

  const error = (() => {
    if (text.trim() === '') return 'Weight is required';
    const n = Number(text.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return 'Enter a valid number';
    const kg = toKg(n, unit);
    if (kg < 20 || kg > 300) return 'Please enter a realistic weight';
    return null;
  })();

  return (
    <View style={{ gap: theme.spacing(4) }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing(2),
          backgroundColor: theme.colors.cardMuted,
          borderRadius: theme.radius.md,
          borderWidth: 1.5,
          borderColor: error ? theme.colors.danger : theme.colors.border,
          paddingHorizontal: theme.spacing(4),
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          keyboardType="decimal-pad"
          returnKeyType="done"
          autoFocus
          placeholder="70"
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel="Body weight"
          style={{
            flex: 1,
            paddingVertical: theme.spacing(3.5),
            color: theme.colors.text,
            fontSize: theme.font.h3,
            fontWeight: '700',
          }}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.body, fontWeight: '700' }}>
          {unit === 'metric' ? 'kg' : 'lb'}
        </Text>
      </View>

      {error ? <Text style={{ color: theme.colors.danger, fontSize: theme.font.small }}>{error}</Text> : null}

      <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, lineHeight: 20 }}>
        Weight is optional and only used to suggest a starting goal. It never leaves this device.
      </Text>

      <PrimaryButton
        label="Save weight"
        icon="checkmark"
        size="lg"
        disabled={error !== null}
        onPress={() => onSave(clampWeight(Number(text.replace(',', '.')), unit))}
      />
    </View>
  );
}

function clampWeight(value: number, unit: UnitSystem): number {
  const kg = toKg(value, unit);
  return Math.min(300, Math.max(20, Math.round(kg * 10) / 10));
}

function Sheet({
  visible,
  title,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'flex-end' }}>
        <Animated.View entering={FadeIn.duration(220)}>
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              padding: theme.spacing(5),
              paddingBottom: theme.spacing(8),
              borderTopWidth: 1,
              borderColor: theme.colors.border,
              gap: theme.spacing(4),
            }}
          >
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 44,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.border,
                  marginBottom: theme.spacing(4),
                }}
              />
              <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>{title}</Text>
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          alignItems: 'center',
          justifyContent: 'center',
          padding: theme.spacing(6),
        }}
      >
        <Animated.View entering={FadeIn.duration(200)} style={{ alignSelf: 'stretch' }}>
          <Card style={{ gap: theme.spacing(3) }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: destructive ? theme.colors.dangerSoft : theme.colors.primarySoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={destructive ? 'alert-circle-outline' : 'color-wand-outline'}
                size={26}
                color={destructive ? theme.colors.danger : theme.colors.primary}
              />
            </View>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>{title}</Text>
            <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, lineHeight: 21 }}>{message}</Text>
            <View style={{ flexDirection: 'row', gap: theme.spacing(3), marginTop: theme.spacing(2) }}>
              <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
              <PrimaryButton
                label={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                onPress={onConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </Animated.View>
      </View>
    </Modal>
  );
}
