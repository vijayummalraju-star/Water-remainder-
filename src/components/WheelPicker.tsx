import React, { useEffect, useRef } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PressableScale } from './PressableScale';

const ITEM_HEIGHT = 46;
const VISIBLE = 3;

interface Props {
  items: string[];
  index: number;
  onChange: (index: number) => void;
  width?: number;
  label?: string;
}

/**
 * Snap-scrolling wheel. Items can also be tapped directly, which keeps the
 * control usable with a mouse in the web preview where momentum events differ.
 */
export function WheelPicker({ items, index, onChange, width = 92, label }: Props) {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const internalIndex = useRef(index);

  useEffect(() => {
    // Only jump when the value changed from *outside* the wheel.
    if (internalIndex.current === index) return;
    internalIndex.current = index;
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
  }, [index]);

  const commit = (next: number) => {
    const clamped = Math.max(0, Math.min(items.length - 1, next));
    if (clamped === internalIndex.current) return;
    internalIndex.current = clamped;
    onChange(clamped);
  };

  const handleEnd = (y: number) => {
    commit(Math.round(y / ITEM_HEIGHT));
  };

  const pad = ((VISIBLE - 1) * ITEM_HEIGHT) / 2;

  return (
    <View style={{ width, alignItems: 'center' }}>
      {label ? (
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.font.tiny + 1,
            fontWeight: '700',
            marginBottom: theme.spacing(1.5),
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={{
          height: ITEM_HEIGHT * VISIBLE,
          width: '100%',
          borderRadius: theme.radius.md,
          backgroundColor: theme.colors.cardMuted,
          borderWidth: 1,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: pad,
            height: ITEM_HEIGHT,
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: theme.colors.border,
          }}
        />

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: index * ITEM_HEIGHT }}
          contentContainerStyle={{ paddingVertical: pad }}
          onScrollBeginDrag={() => {
            internalIndex.current = -1; // force commit on settle
          }}
          onMomentumScrollEnd={(e) => handleEnd(e.nativeEvent.contentOffset.y)}
          onScrollEndDrag={(e) => {
            if (e.nativeEvent.velocity?.y === 0) handleEnd(e.nativeEvent.contentOffset.y);
          }}
        >
          {items.map((item, i) => (
            <PressableScale
              key={`${item}-${i}`}
              haptic={false}
              scaleTo={0.98}
              onPress={() => {
                internalIndex.current = i;
                onChange(i);
                scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true });
              }}
              style={{
                height: ITEM_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: i === index ? theme.font.h3 : theme.font.body,
                  fontWeight: i === index ? '800' : '500',
                  color: i === index ? theme.colors.text : theme.colors.textMuted,
                }}
                maxFontSizeMultiplier={1.3}
              >
                {item}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
