import React from 'react';
import { ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Sticky content pinned to the bottom, e.g. a primary CTA. */
  footer?: React.ReactNode;
  background?: 'gradient' | 'solid';
}

/** Safe-area aware screen shell with the app's signature gradient backdrop. */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  footer,
  background = 'gradient',
}: ScreenProps) {
  const { theme } = useTheme();

  const inner = (
    <View style={[{ padding: theme.spacing(5), paddingBottom: theme.spacing(10), gap: theme.spacing(4) }, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      {background === 'gradient' ? (
        <LinearGradient
          colors={theme.colors.bgGradient}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        />
      ) : null}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {inner}
          </ScrollView>
        ) : (
          inner
        )}
      </SafeAreaView>

      {footer ? (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'transparent' }}>
          <View
            style={{
              paddingHorizontal: theme.spacing(5),
              paddingTop: theme.spacing(3),
              paddingBottom: theme.spacing(2),
              backgroundColor: theme.colors.card,
              borderTopWidth: 1,
              borderTopColor: theme.colors.border,
              ...(theme.shadow(10) as object),
            }}
          >
            {footer}
          </View>
        </SafeAreaView>
      ) : null}
    </View>
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

/** Stack header with a large title and optional back affordance. */
export function ScreenHeader({ title, subtitle, onBack, right }: HeaderProps) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing(3),
        marginBottom: theme.spacing(1),
      }}
    >
      {onBack ? (
        <PressableScale
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </PressableScale>
      ) : null}

      <View style={{ flex: 1 }}>
        <Text
          style={{ color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', letterSpacing: 0.2 }}
          maxFontSizeMultiplier={1.4}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: theme.colors.textMuted, fontSize: theme.font.small, marginTop: 2 }} maxFontSizeMultiplier={1.4}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}
