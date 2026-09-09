import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';
import { BeverageType, UnitSystem, WaterEntry } from '../types';
import { formatVolume } from '../lib/units';
import { timestampToClock } from '../lib/dates';

const BEVERAGE: Record<BeverageType, { icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  water: { icon: 'water', label: 'Water' },
  tea: { icon: 'cafe-outline', label: 'Tea' },
  coffee: { icon: 'cafe', label: 'Coffee' },
  juice: { icon: 'wine-outline', label: 'Juice' },
  other: { icon: 'flask-outline', label: 'Other' },
};

interface Props {
  entry: WaterEntry;
  unit: UnitSystem;
  onPress?: () => void;
  onDelete?: () => void;
}

/** History / dashboard log row. Tap to edit, trash to remove. */
export function EntryRow({ entry, unit, onPress, onDelete }: Props) {
  const { theme } = useTheme();
  const meta = BEVERAGE[entry.type] ?? BEVERAGE.water;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing(2.5),
        paddingHorizontal: theme.spacing(3.5),
        backgroundColor: theme.colors.cardMuted,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing(3),
      }}
    >
      <PressableScale
        onPress={onPress}
        style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing(3), flex: 1 }}
        accessibilityRole="button"
        accessibilityLabel={`${meta.label}, ${formatVolume(entry.amountMl, unit)} at ${timestampToClock(
          entry.timestamp,
        )}. Tap to edit.`}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.colors.aquaSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={meta.icon} size={18} color={theme.colors.aqua} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '700' }}
            maxFontSizeMultiplier={1.5}
          >
            {formatVolume(entry.amountMl, unit)} {unit === 'metric' ? 'ml' : 'fl oz'}
          </Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small }} maxFontSizeMultiplier={1.5}>
            {meta.label} · {timestampToClock(entry.timestamp)}
          </Text>
        </View>
      </PressableScale>

      <PressableScale
        onPress={onDelete}
        haptic={false}
        accessibilityRole="button"
        accessibilityLabel="Delete entry"
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.dangerSoft,
        }}
      >
        <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
      </PressableScale>
    </View>
  );
}
