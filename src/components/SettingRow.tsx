import React from 'react';
import { Switch, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

interface RowProps {
  label: string;
  description?: string;
  value?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  chevron?: boolean;
  danger?: boolean;
  right?: React.ReactNode;
}

/** Label / value row used for every settings list. */
export function SettingRow({
  label,
  description,
  value,
  icon,
  onPress,
  chevron,
  danger,
  right,
}: RowProps) {
  const { theme } = useTheme();
  const tint = danger ? theme.colors.danger : theme.colors.primary;

  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(4),
        gap: theme.spacing(3),
      }}
    >
      {icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: danger ? theme.colors.dangerSoft : theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={17} color={tint} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: danger ? theme.colors.danger : theme.colors.text,
            fontSize: theme.font.body,
            fontWeight: '600',
          }}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{
              color: theme.colors.textMuted,
              fontSize: theme.font.small,
              marginTop: 2,
              lineHeight: 18,
            }}
            maxFontSizeMultiplier={1.5}
          >
            {description}
          </Text>
        ) : null}
      </View>

      {value ? (
        <Text
          style={{
            color: theme.colors.textSecondary,
            fontSize: theme.font.body,
            fontWeight: '600',
          }}
          maxFontSizeMultiplier={1.5}
        >
          {value}
        </Text>
      ) : null}

      {right}

      {chevron && onPress ? <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} /> : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.99} accessibilityRole="button" accessibilityLabel={label}>
        {body}
      </PressableScale>
    );
  }
  return body;
}

interface ToggleProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

/** Switch row — a11y label is wired to the switch itself. */
export function ToggleRow({ label, description, value, onValueChange, icon, disabled }: ToggleProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing(3),
        paddingHorizontal: theme.spacing(4),
        gap: theme.spacing(3),
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon ? (
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: theme.colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={icon} size={17} color={theme.colors.primary} />
        </View>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '600' }}
          maxFontSizeMultiplier={1.5}
        >
          {label}
        </Text>
        {description ? (
          <Text
            style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2, lineHeight: 18 }}
            maxFontSizeMultiplier={1.5}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        trackColor={{ true: theme.colors.primary, false: theme.colors.track }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={theme.colors.track}
      />
    </View>
  );
}
