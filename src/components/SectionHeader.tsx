import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  subtitle?: string;
}

export function SectionHeader({ title, actionLabel, onAction, subtitle }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing(2.5),
        gap: theme.spacing(3),
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.font.h3,
            fontWeight: '800',
            letterSpacing: 0.2,
          }}
          maxFontSizeMultiplier={1.4}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.small,
              marginTop: 2,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: theme.font.small,
              fontWeight: '700',
            }}
            maxFontSizeMultiplier={1.4}
          >
            {actionLabel}
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}
