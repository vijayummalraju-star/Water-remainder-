import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Renders a non-interactive pill (used for stats). */
  static?: boolean;
  tone?: 'default' | 'success' | 'danger';
}

export function Chip({ label, selected, onPress, icon, static: isStatic, tone = 'default' }: Props) {
  const { theme } = useTheme();

  const bg = isStatic
    ? theme.colors.cardMuted
    : selected
      ? theme.colors.primary
      : theme.colors.cardMuted;
  const fg = isStatic
    ? theme.colors.textSecondary
    : selected
      ? theme.colors.onPrimary
      : theme.colors.textSecondary;

  const toneBg =
    tone === 'success' ? theme.colors.successSoft : tone === 'danger' ? theme.colors.dangerSoft : bg;
  const toneFg =
    tone === 'success' ? theme.colors.success : tone === 'danger' ? theme.colors.danger : fg;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing(1.5),
        paddingHorizontal: theme.spacing(3.5),
        paddingVertical: theme.spacing(2),
        borderRadius: theme.radius.pill,
        backgroundColor: isStatic ? toneBg : bg,
        borderWidth: 1,
        borderColor: selected && !isStatic ? theme.colors.primary : theme.colors.border,
      }}
    >
      {icon ? <Ionicons name={icon} size={15} color={isStatic ? toneFg : fg} /> : null}
      <Text
        style={{
          color: isStatic ? toneFg : fg,
          fontSize: theme.font.small,
          fontWeight: selected ? '700' : '600',
        }}
        maxFontSizeMultiplier={1.5}
      >
        {label}
      </Text>
    </View>
  );

  if (isStatic) return content;

  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} scaleTo={0.94}>
      {content}
    </PressableScale>
  );
}
