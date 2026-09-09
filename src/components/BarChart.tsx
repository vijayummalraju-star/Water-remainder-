import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';
import { formatVolume } from '../lib/units';
import { UnitSystem } from '../types';

export interface BarDatum {
  key: string;
  valueMl: number;
  label: string;
  subLabel?: string;
}

interface Props {
  data: BarDatum[];
  goalMl: number;
  unit: UnitSystem;
  height?: number;
  barWidth?: number;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

function Bar({
  ratio,
  index,
  color,
  width,
}: {
  ratio: number;
  index: number;
  color: string;
  width: number;
}) {
  const { theme } = useTheme();
  const target = Math.max(0, Math.min(1, ratio));
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.value = withDelay(
      index * 55,
      withTiming(target, { duration: 620, easing: Easing.out(Easing.cubic) }),
    );
  }, [target, index, animated]);

  const style = useAnimatedStyle(() => ({
    height: `${animated.value * 100}%`,
  }));

  return (
    <View
      style={{
        flex: 1,
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 2,
      }}
    >
      <View
        style={{
          width,
          flex: 1,
          justifyContent: 'flex-end',
          borderRadius: width / 2,
          backgroundColor: theme.colors.track,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={[
            {
              width: '100%',
              backgroundColor: color,
              borderRadius: width / 2,
            },
            style,
          ]}
        />
      </View>
    </View>
  );
}

/**
 * Weekly hydration bar chart with a dashed goal line.
 * Built from plain views so it renders identically everywhere (no native-only
 * charting dependency) and stays fully accessible.
 */
export function BarChart({
  data,
  goalMl,
  unit,
  height = 168,
  barWidth = 18,
  selectedIndex,
  onSelectIndex,
}: Props) {
  const { theme } = useTheme();

  const maxValue = Math.max(goalMl, ...data.map((d) => d.valueMl), 1);
  const ceiling = maxValue * 1.15;
  const goalRatio = goalMl > 0 ? Math.min(1, goalMl / ceiling) : 0;

  return (
    <View>
      <View style={{ height, flexDirection: 'row', alignItems: 'flex-end' }}>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: goalRatio * height,
            borderBottomWidth: 1.5,
            borderBottomColor: theme.colors.primary,
            borderStyle: 'dashed',
            opacity: 0.7,
          }}
        />

        {data.map((datum, i) => {
          const selected = selectedIndex === i;
          const completed = goalMl > 0 && datum.valueMl >= goalMl;
          const color = completed ? theme.colors.success : theme.colors.primary;
          return (
            <PressableScale
              key={datum.key}
              scaleTo={0.94}
              haptic={false}
              onPress={() => onSelectIndex?.(i)}
              accessibilityRole="button"
              accessibilityLabel={`${datum.label}: ${formatVolume(datum.valueMl, unit)} ${
                unit === 'metric' ? 'ml' : 'fl oz'
              }`}
              style={{ flex: 1, height: '100%' }}
            >
              <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
                <Bar
                  ratio={datum.valueMl / ceiling}
                  index={i}
                  color={selected ? theme.colors.aqua : color}
                  width={barWidth}
                />
              </View>
            </PressableScale>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing(2) }}>
        {data.map((datum, i) => {
          const selected = selectedIndex === i;
          return (
            <View key={datum.key} style={{ flex: 1, alignItems: 'center' }}>
              <Text
                style={{
                  color: selected ? theme.colors.text : theme.colors.textMuted,
                  fontSize: theme.font.tiny + 1,
                  fontWeight: selected ? '800' : '600',
                }}
                maxFontSizeMultiplier={1.4}
              >
                {datum.label}
              </Text>
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.font.tiny,
                  marginTop: 1,
                }}
                maxFontSizeMultiplier={1.4}
              >
                {datum.subLabel ?? ''}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
