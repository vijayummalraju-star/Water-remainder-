import React, { useEffect, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Builds a sine wave sampled into a closed polygon.
 *
 * The path is generated once and then only *moved* on the UI thread, which is
 * far cheaper than regenerating the string every frame and keeps 60fps even on
 * low-end devices.
 */
function buildWavePath(
  width: number,
  baseline: number,
  amplitude: number,
  wavelength: number,
  height: number,
): string {
  const steps = 128;
  let d = `M 0 ${(baseline + Math.sin(0) * amplitude).toFixed(2)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (width * i) / steps;
    const y = baseline + Math.sin((x / wavelength) * Math.PI * 2) * amplitude;
    d += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  d += ` L ${width.toFixed(2)} ${height} L 0 ${height} Z`;
  return d;
}

interface Props {
  /** 0..1 (values above 1 simply render as full). */
  progress: number;
  size: number;
  frontColor: string;
  backColor: string;
  trackColor: string;
  /** Unique suffix so multiple waves can coexist in one SVG document. */
  id: string;
  amplitude?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Circular, animated "filling glass" progress indicator.
 *
 * Implementation notes:
 * - Two layered waves move horizontally inside a clipped circle.
 * - Vertical position of the wave group encodes progress, so adding water
 *   simply slides the surface up with a spring.
 */
export function WaterWave({
  progress,
  size,
  frontColor,
  backColor,
  trackColor,
  id,
  amplitude,
  style,
  children,
}: Props) {
  const safe = Number.isFinite(progress) ? progress : 0;
  const clamped = Math.min(1, Math.max(0, safe));
  const amp = amplitude ?? Math.max(3, size * 0.03);

  // The inner canvas is twice as tall as the circle; the wave surface lives at
  // its midpoint so the fill can travel a full `size` in either direction.
  const waveHeight = size * 2;
  const baseline = size;

  const frontPath = useMemo(
    () => buildWavePath(size * 2, baseline, amp, size, waveHeight),
    [size, baseline, amp, waveHeight],
  );
  const backPath = useMemo(
    () => buildWavePath(size * 2, baseline + amp * 0.7, amp * 0.7, size, waveHeight),
    [size, baseline, amp, waveHeight],
  );

  const fill = useSharedValue(clamped);
  const flow = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(clamped, { duration: 750, easing: Easing.out(Easing.cubic) });
  }, [clamped, fill]);

  useEffect(() => {
    // A full `size` of travel is visually identical thanks to the wavelength,
    // so the loop is seamless.
    flow.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false);
  }, [flow]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -flow.value * size },
      { translateY: -fill.value * size },
    ],
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -flow.value * size * 0.55 },
      { translateY: -fill.value * size },
    ],
  }));

  const frontId = `${id}-front`;
  const backId = `${id}-back`;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: trackColor,
        },
        style,
      ]}
      accessibilityRole="progressbar"
    >
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, top: 0, width: size * 2, height: waveHeight },
          backStyle,
        ]}
      >
        <Svg width={size * 2} height={waveHeight}>
          <Defs>
            <LinearGradient id={backId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={backColor} stopOpacity={0.9} />
              <Stop offset="1" stopColor={backColor} stopOpacity={0.45} />
            </LinearGradient>
          </Defs>
          <Path d={backPath} fill={`url(#${backId})`} />
        </Svg>
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: 0, top: 0, width: size * 2, height: waveHeight },
          frontStyle,
        ]}
      >
        <Svg width={size * 2} height={waveHeight}>
          <Defs>
            <LinearGradient id={frontId} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={frontColor} stopOpacity={0.95} />
              <Stop offset="1" stopColor={backColor} stopOpacity={0.75} />
            </LinearGradient>
          </Defs>
          <Path d={frontPath} fill={`url(#${frontId})`} />
        </Svg>
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={{
          ...StyleSheetAbsolute,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {children}
      </View>
    </View>
  );
}

const StyleSheetAbsolute = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};
