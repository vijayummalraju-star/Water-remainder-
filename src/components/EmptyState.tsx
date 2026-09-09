import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Friendly placeholder for any empty list / no-data state. */
export function EmptyState({ icon = 'water-outline', title, message, actionLabel, onAction }: Props) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing(8), paddingHorizontal: theme.spacing(6) }}>
      <View
        style={{
          width: 78,
          height: 78,
          borderRadius: 39,
          backgroundColor: theme.colors.aquaSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: theme.spacing(4),
        }}
      >
        <Ionicons name={icon} size={36} color={theme.colors.aqua} />
      </View>
      <Text
        style={{
          color: theme.colors.text,
          fontSize: theme.font.h3,
          fontWeight: '800',
          textAlign: 'center',
        }}
        maxFontSizeMultiplier={1.4}
      >
        {title}
      </Text>
      <Text
        style={{
          color: theme.colors.textSecondary,
          fontSize: theme.font.body,
          textAlign: 'center',
          marginTop: theme.spacing(2),
          lineHeight: 22,
        }}
        maxFontSizeMultiplier={1.4}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} style={{ marginTop: theme.spacing(5), alignSelf: 'stretch' }} />
      ) : null}
    </View>
  );
}
