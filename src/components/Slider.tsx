import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  onRelease?: (value: number) => void;
  formatLabel?: (value: number) => string;
  showValue?: boolean;
  unit?: string;
}

/**
 * Dependency-free slider (PanResponder based) so it behaves identically on
 * Android, iOS and web — including mouse drag in the browser preview.
 */
export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  onRelease,
  formatLabel,
  showValue = true,
  unit,
}: Props) {
  const { theme } = useTheme();
  const [width, setWidth] = useState(0);

  const refs = useRef({ width: 0, min, max, step, value, onChange, onRelease });
  refs.current = { width, min, max, step, value, onChange, onRelease };

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const valueFromX = (x: number) => {
    const { width: w, min: lo, max: hi, step: st } = refs.current;
    if (w <= 0) return refs.current.value;
    const ratio = Math.min(1, Math.max(0, x / w));
    const raw = lo + ratio * (hi - lo);
    return clamp(Math.round(raw / st) * st);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          refs.current.onChange(valueFromX(evt.nativeEvent.locationX));
        },
        onPanResponderMove: (evt) => {
          refs.current.onChange(valueFromX(evt.nativeEvent.locationX));
        },
        onPanResponderRelease: () => {
          refs.current.onRelease?.(refs.current.value);
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const ratio = max > min ? (value - min) / (max - min) : 0;
  const trackHeight = 8;
  const thumb = 26;

  return (
    <View style={{ paddingVertical: theme.spacing(2) }}>
      {showValue ? (
        <Text
          style={{
            color: theme.colors.text,
            fontSize: theme.font.small,
            fontWeight: '700',
            marginBottom: theme.spacing(1),
          }}
        >
          {formatLabel ? formatLabel(value) : `${value}`}
          {unit ? ` ${unit}` : ''}
        </Text>
      ) : null}

      <View
        {...pan.panHandlers}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        style={{
          height: thumb + 12,
          justifyContent: 'center',
          minWidth: 120,
        }}
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: value }}
      >
        <View
          style={{
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: theme.colors.track,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
              height: '100%',
              backgroundColor: theme.colors.primary,
              borderRadius: trackHeight / 2,
            }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: Math.max(0, Math.min(width - thumb, ratio * width - thumb / 2)),
            width: thumb,
            height: thumb,
            borderRadius: thumb / 2,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: theme.colors.primary,
            ...(theme.shadow(3) as object),
          }}
        />
      </View>
    </View>
  );
}
