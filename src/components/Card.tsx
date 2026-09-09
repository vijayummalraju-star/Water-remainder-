import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  elevation?: number;
  /** Removes the default border for edge-to-edge treatments. */
  bordered?: boolean;
}

/** Elevated surface used for every grouped block of content. */
export function Card({ children, style, padded = true, elevation = 5, bordered = true }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.card,
          borderRadius: theme.radius.lg,
          borderWidth: bordered ? 1 : 0,
          borderColor: theme.colors.border,
          padding: padded ? theme.spacing(4) : 0,
          overflow: 'hidden',
        },
        theme.shadow(elevation),
        style,
      ]}
    >
      {children}
    </View>
  );
}
