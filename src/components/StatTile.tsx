import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sub?: string;
  color?: string;
  flex?: number;
}

/** Compact metric tile used across History and Profile. */
export function StatTile({ icon, label, value, sub, color, flex = 1 }: Props) {
  const { theme } = useTheme();
  const tint = color ?? theme.colors.primary;
  return (
    <View
      style={{
        flex,
        backgroundColor: theme.colors.cardMuted,
        borderRadius: theme.radius.md,
        padding: theme.spacing(3),
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: theme.spacing(1),
      }}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: `${tint}22`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.font.h3,
          fontWeight: '800',
          marginTop: theme.spacing(1),
        }}
        maxFontSizeMultiplier={1.5}
      >
        {value}
      </Text>
      <Text
        style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny + 1, fontWeight: '600' }}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
      {sub ? (
        <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.tiny }} maxFontSizeMultiplier={1.5}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}
