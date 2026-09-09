import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { Card } from '../components/Card';
import { Chip } from '../components/Chip';
import { PressableScale } from '../components/PressableScale';
import { TimePickerModal } from '../components/TimePickerModal';
import { BeverageType, WaterEntry } from '../types';
import { MAX_ENTRY_ML, clampEntry } from '../lib/hydration';
import { formatVolume, formatVolumeWithUnit, toMl, unitLabel } from '../lib/units';
import { formatFullDate, minutesFromTime, timestampToClock } from '../lib/dates';
import { VESSEL_PRESETS } from '../state/defaults';

const BEVERAGES: { key: BeverageType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'water', label: 'Water', icon: 'water' },
  { key: 'tea', label: 'Tea', icon: 'cafe-outline' },
  { key: 'coffee', label: 'Coffee', icon: 'cafe' },
  { key: 'juice', label: 'Juice', icon: 'wine-outline' },
  { key: 'other', label: 'Other', icon: 'flask-outline' },
];

interface Props {
  navigation: any;
  route?: { params?: { entryId?: string } };
}

/**
 * Add / edit a single drink. The amount is editable via vessel presets, quick
 * chips, steppers or direct numeric entry — whatever is fastest for the user.
 */
export function AddWaterScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { settings, entries, addEntry, updateEntry, deleteEntry } = useApp();

  const editingId = route?.params?.entryId;
  const editing: WaterEntry | undefined = useMemo(
    () => entries.find((e) => e.id === editingId),
    [entries, editingId],
  );

  const [amountMl, setAmountMl] = useState(editing?.amountMl ?? settings.glassSizeMl);
  const [type, setType] = useState<BeverageType>(editing?.type ?? 'water');
  const [timestamp, setTimestamp] = useState(editing?.timestamp ?? Date.now());
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [showTime, setShowTime] = useState(false);

  const unit = settings.unit;
  const stepMl = unit === 'metric' ? 50 : 30;

  const clamp = (ml: number) => Math.min(MAX_ENTRY_ML, Math.max(0, ml));

  const bump = (delta: number) => setAmountMl((v) => clamp(v + delta));

  const applyCustom = () => {
    const n = Number(customText.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    setAmountMl(clampEntry(toMl(n, unit)));
    setCustomOpen(false);
    setCustomText('');
  };

  const canSave = amountMl > 0;

  const onSave = () => {
    if (!canSave) return;
    const amount = clampEntry(amountMl);
    if (editing) updateEntry(editing.id, { amountMl: amount, timestamp, type });
    else addEntry({ amountMl: amount, timestamp, type });
    navigation.goBack();
  };

  const onDelete = () => {
    if (editing) deleteEntry(editing.id);
    navigation.goBack();
  };

  const remaining = Math.max(0, settings.dailyGoalMl - amountMl);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <LinearGradient colors={theme.colors.bgGradient} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing(5),
            paddingTop: theme.spacing(2),
            gap: theme.spacing(3),
          }}
        >
          <PressableScale
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={20} color={theme.colors.text} />
          </PressableScale>
          <Text style={{ color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', flex: 1 }}>
            {editing ? 'Edit drink' : 'Add water'}
          </Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: theme.spacing(5), paddingBottom: theme.spacing(6), gap: theme.spacing(4) }}
          showsVerticalScrollIndicator={false}
        >
          {/* Big amount */}
          <Card style={{ alignItems: 'center', paddingVertical: theme.spacing(6) }}>
            <Animated.View key={`${amountMl}`} entering={FadeIn.duration(180)}>
              <Text
                style={{
                  color: theme.colors.text,
                  fontSize: 52,
                  fontWeight: '800',
                  letterSpacing: -1.5,
                }}
                maxFontSizeMultiplier={1.2}
              >
                {formatVolume(amountMl, unit)}
              </Text>
            </Animated.View>
            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.body, fontWeight: '600' }}>
              {unitLabel(unit)}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(4), marginTop: theme.spacing(5) }}>
              <PressableScale
                onPress={() => bump(-stepMl)}
                accessibilityRole="button"
                accessibilityLabel="Decrease amount"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.colors.cardMuted,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="remove" size={26} color={theme.colors.text} />
              </PressableScale>

              <PressableScale
                onPress={() => setCustomOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Enter a custom amount"
                style={{
                  paddingHorizontal: theme.spacing(4),
                  paddingVertical: theme.spacing(2.5),
                  borderRadius: theme.radius.pill,
                  backgroundColor: customOpen ? theme.colors.primary : theme.colors.primarySoft,
                }}
              >
                <Text
                  style={{
                    color: customOpen ? theme.colors.onPrimary : theme.colors.primaryDark,
                    fontWeight: '700',
                    fontSize: theme.font.small,
                  }}
                >
                  Custom
                </Text>
              </PressableScale>

              <PressableScale
                onPress={() => bump(stepMl)}
                accessibilityRole="button"
                accessibilityLabel="Increase amount"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: theme.colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(theme.shadow(6) as object),
                }}
              >
                <Ionicons name="add" size={26} color={theme.colors.onPrimary} />
              </PressableScale>
            </View>

            {customOpen ? (
              <Animated.View entering={FadeIn.duration(220)} style={{ alignSelf: 'stretch', marginTop: theme.spacing(4) }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.cardMuted,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    paddingHorizontal: theme.spacing(4),
                    gap: theme.spacing(2),
                  }}
                >
                  <TextInput
                    value={customText}
                    onChangeText={setCustomText}
                    onSubmitEditing={applyCustom}
                    onBlur={applyCustom}
                    autoFocus
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    placeholder={`Amount in ${unitLabel(unit)}`}
                    placeholderTextColor={theme.colors.textMuted}
                    accessibilityLabel="Custom amount"
                    style={{
                      flex: 1,
                      paddingVertical: theme.spacing(3.5),
                      color: theme.colors.text,
                      fontSize: theme.font.h3,
                      fontWeight: '700',
                    }}
                  />
                  <Text style={{ color: theme.colors.textMuted, fontWeight: '700' }}>{unitLabel(unit)}</Text>
                  <PressableScale onPress={applyCustom} accessibilityLabel="Apply custom amount" style={{ padding: theme.spacing(1) }}>
                    <Ionicons name="checkmark-circle" size={26} color={theme.colors.primary} />
                  </PressableScale>
                </View>
              </Animated.View>
            ) : null}

            <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: theme.spacing(4) }}>
              {formatVolumeWithUnit(settings.dailyGoalMl, unit)} daily goal
            </Text>
          </Card>

          {/* Vessel presets */}
          <View>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800', marginBottom: theme.spacing(3) }}>
              Quick amounts
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: theme.spacing(2.5), paddingRight: theme.spacing(2) }}
            >
              {VESSEL_PRESETS.map((v) => {
                const active = amountMl === v.ml;
                return (
                  <PressableScale
                    key={v.label}
                    onPress={() => setAmountMl(clamp(v.ml))}
                    accessibilityRole="button"
                    accessibilityLabel={`${v.label}, ${formatVolume(v.ml, unit)} ${unitLabel(unit)}`}
                    style={{
                      minWidth: 92,
                      paddingVertical: theme.spacing(3.5),
                      borderRadius: theme.radius.md,
                      alignItems: 'center',
                      gap: theme.spacing(1.5),
                      backgroundColor: active ? theme.colors.primary : theme.colors.card,
                      borderWidth: 1.5,
                      borderColor: active ? theme.colors.primary : theme.colors.border,
                    }}
                  >
                    <Ionicons
                      name={v.icon as any}
                      size={22}
                      color={active ? theme.colors.onPrimary : theme.colors.aqua}
                    />
                    <Text
                      style={{
                        color: active ? theme.colors.onPrimary : theme.colors.text,
                        fontWeight: '700',
                        fontSize: theme.font.small,
                      }}
                    >
                      {v.label}
                    </Text>
                    <Text
                      style={{
                        color: active ? theme.colors.onPrimary : theme.colors.textMuted,
                        fontSize: theme.font.tiny,
                        fontWeight: '600',
                      }}
                    >
                      {formatVolume(v.ml, unit)} {unitLabel(unit)}
                    </Text>
                  </PressableScale>
                );
              })}
            </ScrollView>
          </View>

          {/* Beverage type */}
          <View>
            <Text style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800', marginBottom: theme.spacing(3) }}>
              Drink type
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) }}>
              {BEVERAGES.map((b) => (
                <Chip
                  key={b.key}
                  label={b.label}
                  icon={b.icon}
                  selected={type === b.key}
                  onPress={() => setType(b.key)}
                />
              ))}
            </View>
          </View>

          {/* Timestamp */}
          <Card padded={false}>
            <PressableScale
              onPress={() => setShowTime(true)}
              accessibilityRole="button"
              accessibilityLabel={`Time, currently ${timestampToClock(timestamp)}`}
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
                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}>
                  {timestampToClock(timestamp)}
                </Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 1 }}>
                  {formatFullDate(timestamp)}
                </Text>
              </View>
              <Text style={{ color: theme.colors.primary, fontSize: theme.font.small, fontWeight: '700' }}>Change</Text>
            </PressableScale>
          </Card>

          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.small,
              textAlign: 'center',
              lineHeight: 19,
            }}
          >
            {remaining > 0
              ? `Adding this leaves ${formatVolumeWithUnit(remaining, unit)} to reach today's goal.`
              : "You've already reached today's goal — nice work!"}
          </Text>
        </ScrollView>

        <SafeAreaView edges={['bottom', 'left', 'right']}>
          <View
            style={{
              paddingHorizontal: theme.spacing(5),
              paddingBottom: theme.spacing(3),
              paddingTop: theme.spacing(2),
              gap: theme.spacing(3),
              backgroundColor: theme.colors.card,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
            }}
          >
            <PrimaryButton
              label={editing ? 'Save changes' : `Add ${formatVolumeWithUnit(amountMl, unit)}`}
              size="lg"
              icon="checkmark"
              onPress={onSave}
              disabled={!canSave}
            />
            {editing ? (
              <PrimaryButton label="Delete entry" variant="danger" icon="trash-outline" onPress={onDelete} />
            ) : null}
          </View>
        </SafeAreaView>
      </SafeAreaView>

      <TimePickerModal
        visible={showTime}
        title="When did you drink this?"
        value={minutesFromTime(new Date(timestamp))}
        onCancel={() => setShowTime(false)}
        onSave={(mins) => {
          const d = new Date(timestamp);
          d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
          setTimestamp(d.getTime());
          setShowTime(false);
        }}
      />
    </View>
  );
}
