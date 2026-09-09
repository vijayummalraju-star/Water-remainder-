import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useApp } from '../state/AppContext';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** How far to compress on press-in. */
  scaleTo?: number;
  /** Set false to opt out of haptic feedback. */
  haptic?: boolean;
  children?: React.ReactNode;
}

/**
 * Pressable with a springy press-down micro-interaction and optional haptics.
 * Everything is wrapped so a single tap feels tactile without any layout cost.
 */
export function PressableScale({
  style,
  scaleTo = 0.96,
  haptic = true,
  children,
  onPress,
  disabled,
  ...rest
}: Props) {
  const { settings } = useApp();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 340 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
        rest.onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic && settings.hapticsEnabled) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }
        onPress?.(e);
      }}
      style={[style, animatedStyle, disabled ? { opacity: 0.45 } : null]}
    >
      {children}
    </AnimatedPressable>
  );
}
