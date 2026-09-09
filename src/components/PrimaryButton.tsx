import React from 'react';
import { ActivityIndicator, StyleProp, Text, View, ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md' | 'lg';
  accessibilityHint?: string;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
  size = 'md',
  accessibilityHint,
}: Props) {
  const { theme } = useTheme();

  const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
    primary: { bg: theme.colors.primary, fg: theme.colors.onPrimary, border: theme.colors.primary },
    secondary: {
      bg: theme.colors.primarySoft,
      fg: theme.colors.primaryDark,
      border: theme.colors.primarySoft,
    },
    ghost: { bg: 'transparent', fg: theme.colors.primary, border: theme.colors.border },
    danger: { bg: theme.colors.dangerSoft, fg: theme.colors.danger, border: theme.colors.dangerSoft },
    success: { bg: theme.colors.success, fg: '#FFFFFF', border: theme.colors.success },
  };
  const c = palette[variant];

  const height = size === 'lg' ? 58 : size === 'sm' ? 40 : 50;
  const fontSize = size === 'lg' ? theme.font.h3 : theme.font.body;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityHint={accessibilityHint}
      accessibilityLabel={label}
      style={[
        {
          height,
          borderRadius: theme.radius.pill,
          backgroundColor: c.bg,
          borderWidth: variant === 'ghost' ? 1.5 : 0,
          borderColor: c.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          paddingHorizontal: theme.spacing(5),
          gap: theme.spacing(2),
        },
        variant === 'primary' || variant === 'success' ? theme.shadow(5) : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={fontSize + 2} color={c.fg} /> : null}
          <Text
            style={{
              color: c.fg,
              fontSize,
              fontWeight: '700',
              letterSpacing: 0.2,
            }}
            maxFontSizeMultiplier={1.4}
          >
            {label}
          </Text>
        </>
      )}
    </PressableScale>
  );
}

export function ButtonRow({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: theme.spacing(3) }, style]}>{children}</View>
  );
}

