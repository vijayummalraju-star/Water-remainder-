import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';


interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
}

/** Sliding segmented switch used for unit / theme / schedule mode pickers. */
export function SegmentedControl<T extends string>({ options, value, onChange, compact }: Props<T>) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.cardMuted,
        borderRadius: theme.radius.pill,
        padding: 3,
        borderWidth: 1,
        borderColor: theme.colors.border,
      }}
      accessibilityRole="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <PressableScale
            key={opt.value}
            onPress={() => onChange(opt.value)}
            scaleTo={0.97}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={{
              flex: 1,
              paddingVertical: compact ? theme.spacing(1.5) : theme.spacing(2.25),
              borderRadius: theme.radius.pill,
              backgroundColor: active ? theme.colors.card : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              ...(active ? theme.shadow(2) : {}),
            }}
          >
            <Text
              style={{
                color: active ? theme.colors.text : theme.colors.textMuted,
                fontSize: compact ? theme.font.small : theme.font.body,
                fontWeight: active ? '700' : '600',
              }}
              maxFontSizeMultiplier={1.4}
            >
              {opt.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
