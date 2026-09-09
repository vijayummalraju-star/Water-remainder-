import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  FadeOutUp,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { PressableScale } from './PressableScale';

/**
 * Transient top banner celebrating a goal hit or a new achievement.
 * Auto-dismisses; tapping it dismisses early.
 */
export function CelebrationBanner() {
  const { theme } = useTheme();
  const { celebration, dismissCelebration } = useApp();

  useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(dismissCelebration, 4200);
    return () => clearTimeout(timer);
  }, [celebration, dismissCelebration]);

  if (!celebration) return null;

  const tint = celebration.kind === 'goal' ? theme.colors.success : theme.colors.primary;
  const bg = celebration.kind === 'goal' ? theme.colors.successSoft : theme.colors.primarySoft;

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(16)}
      exiting={FadeOutUp.duration(220)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingHorizontal: theme.spacing(5),
        paddingTop: theme.spacing(2),
      }}
      pointerEvents="box-none"
    >
      <PressableScale onPress={dismissCelebration} accessibilityRole="button" accessibilityLabel="Dismiss message">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing(3),
            backgroundColor: bg,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: tint,
            padding: theme.spacing(3.5),
            ...(theme.shadow(8) as object),
          }}
        >
          <Text style={{ fontSize: 26 }}>{celebration.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text
              style={{ color: theme.colors.text, fontSize: theme.font.body, fontWeight: '800' }}
              maxFontSizeMultiplier={1.4}
            >
              {celebration.title}
            </Text>
            <Text
              style={{ color: theme.colors.textSecondary, fontSize: theme.font.small, marginTop: 1 }}
              maxFontSizeMultiplier={1.4}
            >
              {celebration.message}
            </Text>
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
