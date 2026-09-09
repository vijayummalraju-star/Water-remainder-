import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { ACTIVITY_LEVELS } from '../theme/theme';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { SegmentedControl } from '../components/SegmentedControl';
import { Slider } from '../components/Slider';
import { PressableScale } from '../components/PressableScale';
import { TimePickerModal } from '../components/TimePickerModal';
import { ActivityLevel, UnitSystem } from '../types';
import { recommendGoalMl, clampGoal, MIN_GOAL_ML, MAX_GOAL_ML } from '../lib/hydration';
import { fromKg, toKg, formatVolumeWithUnit, formatVolume, unitLabel } from '../lib/units';
import { formatClock } from '../lib/dates';

const TOTAL_STEPS = 4;

/**
 * Four-step first-run experience:
 * welcome -> about you -> personalised goal -> reminders.
 * Every step is skippable; nothing ever leaves the device.
 */
export function OnboardingScreen() {
  const { theme } = useTheme();
  const { settings, updateSettings, finishOnboarding, loadDemoData } = useApp();

  const [step, setStep] = useState(0);
  const [unit, setUnit] = useState<UnitSystem>(settings.unit);
  const [weightInput, setWeightInput] = useState(
    `${Math.round(fromKg(settings.weightKg, settings.unit))}`,
  );
  const [activity, setActivity] = useState<ActivityLevel>(settings.activityLevel);
  const [wake, setWake] = useState(settings.wakeTime);
  const [sleep, setSleep] = useState(settings.sleepTime);
  const [goal, setGoal] = useState(settings.dailyGoalMl);
  const [goalTouched, setGoalTouched] = useState(false);
  const [remindersOn, setRemindersOn] = useState(settings.remindersEnabled);
  const [intervalMin, setIntervalMin] = useState(settings.reminderIntervalMin);
  const [sound, setSound] = useState(settings.soundEnabled);
  const [vibration, setVibration] = useState(settings.vibrationEnabled);

  const [picker, setPicker] = useState<null | 'wake' | 'sleep'>(null);
  const inputRef = useRef<TextInput>(null);

  const weightNumber = useMemo(() => {
    const n = Number(weightInput.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 70;
  }, [weightInput]);

  const weightKg = useMemo(() => toKg(weightNumber, unit), [weightNumber, unit]);
  const recommended = useMemo(
    () => recommendGoalMl(weightKg, activity),
    [weightKg, activity],
  );

  useEffect(() => {
    if (!goalTouched) setGoal(recommended);
  }, [recommended, goalTouched]);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else complete();
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const persistDraft = () => {
    updateSettings({
      unit,
      weightKg,
      activityLevel: activity,
      wakeTime: wake,
      sleepTime: sleep,
      dailyGoalMl: clampGoal(goal),
      goalSource: goalTouched ? 'manual' : 'recommended',
      remindersEnabled: remindersOn,
      reminderIntervalMin: intervalMin,
      reminderStart: (wake + 60) % 1440,
      reminderEnd: (sleep - 30 + 1440) % 1440,
      soundEnabled: sound,
      vibrationEnabled: vibration,
    });
  };

  const complete = () => {
    persistDraft();
    finishOnboarding();
  };

  const exploreWithDemo = () => {
    persistDraft();
    loadDemoData();
    finishOnboarding();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <LinearGradient colors={theme.colors.bgGradient} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Progress dots */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing(1.5),
            paddingHorizontal: theme.spacing(6),
            paddingTop: theme.spacing(3),
          }}
        >
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                height: 5,
                borderRadius: 3,
                backgroundColor: i <= step ? theme.colors.primary : theme.colors.track,
              }}
            />
          ))}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing(6), paddingBottom: theme.spacing(4), flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View key={step} entering={FadeIn.duration(320)} exiting={FadeOut.duration(120)} style={{ flex: 1 }}>
            {step === 0 ? (
              <WelcomeStep />
            ) : step === 1 ? (
              <AboutYouStep
                unit={unit}
                onUnitChange={setUnit}
                weightInput={weightInput}
                onWeightChange={setWeightInput}
                activity={activity}
                onActivityChange={setActivity}
                wake={wake}
                sleep={sleep}
                onPickWake={() => setPicker('wake')}
                onPickSleep={() => setPicker('sleep')}
                inputRef={inputRef}
              />
            ) : step === 2 ? (
              <GoalStep
                goal={goal}
                recommended={recommended}
                unit={unit}
                activity={activity}
                weightKg={weightKg}
                onGoalChange={(v) => {
                  setGoalTouched(true);
                  setGoal(v);
                }}
              />
            ) : (
              <RemindersStep
                enabled={remindersOn}
                onEnabledChange={setRemindersOn}
                intervalMin={intervalMin}
                onIntervalChange={setIntervalMin}
                sound={sound}
                onSoundChange={setSound}
                vibration={vibration}
                onVibrationChange={setVibration}
                wake={wake}
                sleep={sleep}
                goal={goal}
                unit={unit}
              />
            )}
          </Animated.View>
        </ScrollView>

        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <View
            style={{
              paddingHorizontal: theme.spacing(6),
              paddingBottom: theme.spacing(4),
              gap: theme.spacing(3),
            }}
          >
            <PrimaryButton
              label={step === TOTAL_STEPS - 1 ? 'Start hydrating' : 'Continue'}
              size="lg"
              icon={step === TOTAL_STEPS - 1 ? 'water' : 'arrow-forward'}
              onPress={goNext}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {step > 0 ? (
                <PressableScale onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, fontWeight: '600' }}>
                    Back
                  </Text>
                </PressableScale>
              ) : (
                <View />
              )}

              {step < TOTAL_STEPS - 1 ? (
                <PressableScale onPress={complete} accessibilityRole="button" accessibilityLabel="Skip onboarding">
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.body, fontWeight: '600' }}>
                    Skip for now
                  </Text>
                </PressableScale>
              ) : (
                <PressableScale onPress={exploreWithDemo} accessibilityRole="button" accessibilityLabel="Load sample data">
                  <Text style={{ color: theme.colors.primary, fontSize: theme.font.body, fontWeight: '700' }}>
                    Explore with sample data
                  </Text>
                </PressableScale>
              )}
            </View>
          </View>
        </SafeAreaView>
      </SafeAreaView>

      <TimePickerModal
        visible={picker !== null}
        title={picker === 'wake' ? 'When do you wake up?' : 'When do you go to bed?'}
        value={picker === 'wake' ? wake : sleep}
        onCancel={() => setPicker(null)}
        onSave={(mins) => {
          if (picker === 'wake') setWake(mins);
          else setSleep(mins);
          setPicker(null);
        }}
      />
    </View>
  );
}

function WelcomeStep() {
  const { theme } = useTheme();
  const features = [
    { icon: 'flash-outline', title: 'One-tap logging', body: 'Open the app, tap a button, done.' },
    { icon: 'notifications-outline', title: 'Gentle reminders', body: 'Smart nudges that stop once you hit your goal.' },
    { icon: 'stats-chart-outline', title: 'Beautiful progress', body: 'Streaks, charts and badges that keep you going.' },
  ];

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={{ flex: 1, justifyContent: 'center' }}>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing(8) }}>
        <View
          style={{
            width: 116,
            height: 116,
            borderRadius: 58,
            overflow: 'hidden',
            ...(theme.shadow(10) as object),
          }}
        >
          <LinearGradient colors={[theme.colors.aqua, theme.colors.primary]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="water" size={56} color="#FFFFFF" />
          </LinearGradient>
        </View>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.font.h1,
            fontWeight: '800',
            marginTop: theme.spacing(6),
            textAlign: 'center',
          }}
          maxFontSizeMultiplier={1.3}
        >
          Welcome to Aqua
        </Text>
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.font.body,
            textAlign: 'center',
            marginTop: theme.spacing(3),
            lineHeight: 23,
          }}
          maxFontSizeMultiplier={1.3}
        >
          Build a simple daily habit of drinking enough water — calmly, privately, and entirely offline.
        </Text>
      </View>

      <View style={{ gap: theme.spacing(3) }}>
        {features.map((f, i) => (
          <Animated.View key={f.title} entering={FadeInDown.delay(120 + i * 90).duration(420)}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(4) }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: theme.colors.aquaSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={f.icon as any} size={22} color={theme.colors.aqua} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}>
                  {f.title}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }}>
                  {f.body}
                </Text>
              </View>
            </Card>
          </Animated.View>
        ))}
      </View>

      <Text
        style={{
          color: theme.colors.textMuted,
          fontSize: theme.font.small,
          textAlign: 'center',
          marginTop: theme.spacing(6),
        }}
      >
        🔒 Your data stays on your device. No account required.
      </Text>
    </Animated.View>
  );
}

interface AboutProps {
  unit: UnitSystem;
  onUnitChange: (u: UnitSystem) => void;
  weightInput: string;
  onWeightChange: (v: string) => void;
  activity: ActivityLevel;
  onActivityChange: (a: ActivityLevel) => void;
  wake: number;
  sleep: number;
  onPickWake: () => void;
  onPickSleep: () => void;
  inputRef: React.RefObject<TextInput | null>;
}

function AboutYouStep({
  unit,
  onUnitChange,
  weightInput,
  onWeightChange,
  activity,
  onActivityChange,
  wake,
  sleep,
  onPickWake,
  onPickSleep,
  inputRef,
}: AboutProps) {
  const { theme } = useTheme();

  const error = (() => {
    const n = Number(weightInput.replace(',', '.'));
    if (weightInput.trim() === '') return null;
    if (!Number.isFinite(n) || n <= 0) return 'Enter a valid number';
    const kg = toKg(n, unit);
    if (kg < 20 || kg > 300) return 'Please enter a realistic weight';
    return null;
  })();

  return (
    <View style={{ gap: theme.spacing(5) }}>
      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' }}>About you</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, marginTop: theme.spacing(2), lineHeight: 22 }}>
          Optional — but it helps us suggest a goal that actually fits your body and your day.
        </Text>
      </View>

      <Card>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700', marginBottom: theme.spacing(3) }}>
          Preferred units
        </Text>
        <SegmentedControl
          value={unit}
          onChange={onUnitChange}
          options={[
            { value: 'metric', label: 'Millilitres · kg' },
            { value: 'imperial', label: 'Fl oz · lb' },
          ]}
        />

        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.font.body,
            fontWeight: '700',
            marginTop: theme.spacing(5),
            marginBottom: theme.spacing(2),
          }}
        >
          Body weight
        </Text>
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
            ref={inputRef}
            value={weightInput}
            onChangeText={onWeightChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
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
        {error ? (
          <Text style={{ color: theme.colors.danger, fontSize: theme.font.small, marginTop: theme.spacing(2) }}>
            {error}
          </Text>
        ) : null}
      </Card>

      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800', marginBottom: theme.spacing(3) }}>
          Daily activity
        </Text>
        <View style={{ gap: theme.spacing(2.5) }}>
          {ACTIVITY_LEVELS.map((level) => {
            const active = level.key === activity;
            return (
              <PressableScale
                key={level.key}
                onPress={() => onActivityChange(level.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing(3),
                  padding: theme.spacing(3.5),
                  borderRadius: theme.radius.md,
                  backgroundColor: active ? theme.colors.primarySoft : theme.colors.card,
                  borderWidth: 1.5,
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                }}
              >
                <Ionicons
                  name={level.icon as any}
                  size={20}
                  color={active ? theme.colors.primary : theme.colors.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.text,
                      fontSize: theme.font.body,
                      fontWeight: '700',
                    }}
                  >
                    {level.label}
                  </Text>
                  <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 1 }}>
                    {level.hint}
                  </Text>
                </View>
                {active ? <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} /> : null}
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800', marginBottom: theme.spacing(3) }}>
          Your day
        </Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
          <PressableScale
            onPress={onPickWake}
            style={{
              flex: 1,
              padding: theme.spacing(3.5),
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              gap: 2,
            }}
            accessibilityLabel={`Wake time ${formatClock(wake)}`}
          >
            <Ionicons name="sunny-outline" size={20} color={theme.colors.warning} />
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, fontWeight: '700' }}>WAKE</Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
              {formatClock(wake)}
            </Text>
          </PressableScale>

          <PressableScale
            onPress={onPickSleep}
            style={{
              flex: 1,
              padding: theme.spacing(3.5),
              borderRadius: theme.radius.md,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              gap: 2,
            }}
            accessibilityLabel={`Bed time ${formatClock(sleep)}`}
          >
            <Ionicons name="moon-outline" size={20} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, fontWeight: '700' }}>BED</Text>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}>
              {formatClock(sleep)}
            </Text>
          </PressableScale>
        </View>
      </View>
    </View>
  );
}

interface GoalProps {
  goal: number;
  recommended: number;
  unit: UnitSystem;
  activity: ActivityLevel;
  weightKg: number;
  onGoalChange: (v: number) => void;
}

function GoalStep({ goal, recommended, unit, activity, weightKg, onGoalChange }: GoalProps) {
  const { theme } = useTheme();
  const activityLabel = ACTIVITY_LEVELS.find((a) => a.key === activity)?.label ?? '';

  return (
    <View style={{ gap: theme.spacing(5), flex: 1 }}>
      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' }}>Your daily goal</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, marginTop: theme.spacing(2), lineHeight: 22 }}>
          Here's a gentle recommendation based on your answers. Tweak it until it feels right.
        </Text>
      </View>

      <Card style={{ alignItems: 'center', paddingVertical: theme.spacing(6) }}>
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: theme.colors.aquaSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="water" size={40} color={theme.colors.aqua} />
        </View>

        <Text
          style={{
            color: theme.colors.text,
            fontSize: 44,
            fontWeight: '800',
            marginTop: theme.spacing(4),
            letterSpacing: -1,
          }}
          maxFontSizeMultiplier={1.2}
        >
          {formatVolume(goal, unit)}
        </Text>
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.body, fontWeight: '600' }}>
          {unitLabel(unit)} per day
        </Text>

        <Chip
          static
          tone="success"
          icon="sparkles-outline"
          label={`Recommended: ${formatVolumeWithUnit(recommended, unit)}`}
        />

        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.font.small,
            marginTop: theme.spacing(3),
            textAlign: 'center',
            lineHeight: 19,
          }}
        >
          ~35 ml per kg ({Math.round(weightKg)} kg) adjusted for {activityLabel.toLowerCase()} days.
        </Text>
      </Card>

      <Card>
        <Slider
          value={goal}
          min={MIN_GOAL_ML}
          max={MAX_GOAL_ML}
          step={50}
          onChange={onGoalChange}
          formatLabel={(v) => formatVolumeWithUnit(v, unit)}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing(1) }}>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny }}>
            {formatVolume(MIN_GOAL_ML, unit)} {unitLabel(unit)}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny }}>
            {formatVolume(MAX_GOAL_ML, unit)} {unitLabel(unit)}
          </Text>
        </View>
      </Card>
    </View>
  );
}

interface RemindersProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  intervalMin: number;
  onIntervalChange: (v: number) => void;
  sound: boolean;
  onSoundChange: (v: boolean) => void;
  vibration: boolean;
  onVibrationChange: (v: boolean) => void;
  wake: number;
  sleep: number;
  goal: number;
  unit: UnitSystem;
}

const INTERVALS = [15, 30, 45, 60, 90, 120];

function RemindersStep({
  enabled,
  onEnabledChange,
  intervalMin,
  onIntervalChange,
  sound,
  onSoundChange,
  vibration,
  onVibrationChange,
  wake,
  sleep,
  goal,
  unit,
}: RemindersProps) {
  const { theme } = useTheme();
  const start = (wake + 60) % 1440;
  const end = (sleep - 30 + 1440) % 1440;
  const perDay = Math.max(1, Math.floor(((end - start + 1440) % 1440) / intervalMin) + 1);

  return (
    <View style={{ gap: theme.spacing(5), flex: 1 }}>
      <View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h1, fontWeight: '800' }}>Stay on track</Text>
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.body, marginTop: theme.spacing(2), lineHeight: 22 }}>
          Reminders nudge you between {formatClock(start)} and {formatClock(end)}, and stop automatically once you reach
          {` ${formatVolumeWithUnit(goal, unit)}`}.
        </Text>
      </View>

      <Card padded={false}>
        <SettingToggleRow
          icon="notifications-outline"
          label="Enable reminders"
          description="Local notifications, no internet needed"
          value={enabled}
          onChange={onEnabledChange}
        />
      </Card>

      {enabled ? (
        <Animated.View entering={FadeIn.duration(260)} style={{ gap: theme.spacing(4) }}>
          <Card>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700', marginBottom: theme.spacing(3) }}>
              How often
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
              {INTERVALS.map((m) => (
                <Chip
                  key={m}
                  label={m < 60 ? `${m} min` : `${m / 60} h`}
                  selected={intervalMin === m}
                  onPress={() => onIntervalChange(m)}
                />
              ))}
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: theme.spacing(3) }}>
              About {perDay} reminders per day.
            </Text>
          </Card>

          <Card padded={false}>
            <SettingToggleRow
              icon="volume-high-outline"
              label="Notification sound"
              value={sound}
              onChange={onSoundChange}
            />
            <View style={{ height: 1, backgroundColor: theme.colors.border }} />
            <SettingToggleRow
              icon="phone-portrait-outline"
              label="Vibration"
              value={vibration}
              onChange={onVibrationChange}
            />
          </Card>
        </Animated.View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing(3),
          alignItems: 'center',
          padding: theme.spacing(4),
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.aquaSoft,
        }}
      >
        <Ionicons name="lock-closed-outline" size={18} color={theme.colors.aqua} />
        <Text style={{ color: theme.colors.textSecondary, fontSize: theme.font.small, flex: 1, lineHeight: 19 }}>
          Everything is stored locally. Aqua never uploads your hydration data.
        </Text>
      </View>
    </View>
  );
}

/** Small shared switch row used inside onboarding cards. */
function SettingToggleRow({
  icon,
  label,
  description,
  value,
  onChange,
}: {
  icon: any;
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing(4),
        gap: theme.spacing(3),
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 13,
          backgroundColor: theme.colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}>{label}</Text>
        {description ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 1 }}>
            {description}
          </Text>
        ) : null}
      </View>
      <PressableScale
        onPress={() => onChange(!value)}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        accessibilityLabel={label}
        style={{
          width: 54,
          height: 32,
          borderRadius: 16,
          padding: 3,
          justifyContent: 'center',
          backgroundColor: value ? theme.colors.primary : theme.colors.track,
        }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: '#FFFFFF',
            alignSelf: value ? 'flex-end' : 'flex-start',
          }}
        />
      </PressableScale>
    </View>
  );
}
