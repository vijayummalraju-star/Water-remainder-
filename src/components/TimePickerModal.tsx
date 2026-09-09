import React, { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { WheelPicker } from './WheelPicker';
import { formatClock, pad2 } from '../lib/dates';

interface Props {
  visible: boolean;
  /** Minutes after midnight. */
  value: number;
  title?: string;
  hint?: string;
  onCancel: () => void;
  onSave: (minutes: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i));
const MINUTES = Array.from({ length: 60 }, (_, i) => pad2(i));

/** Cross-platform clock picker built from two snap wheels. */
export function TimePickerModal({ visible, value, title = 'Pick a time', hint, onCancel, onSave }: Props) {
  const { theme } = useTheme();
  const [hour, setHour] = useState(Math.floor(value / 60));
  const [minute, setMinute] = useState(value % 60);

  useEffect(() => {
    if (visible) {
      setHour(Math.floor(((value % 1440) + 1440) % 1440 / 60));
      setMinute(((value % 60) + 60) % 60);
    }
  }, [visible, value]);

  const preview = formatClock(hour * 60 + minute);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.overlay,
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: theme.colors.card,
            borderTopLeftRadius: theme.radius.xl,
            borderTopRightRadius: theme.radius.xl,
            padding: theme.spacing(5),
            paddingBottom: theme.spacing(8),
            borderTopWidth: 1,
            borderColor: theme.colors.border,
            gap: theme.spacing(4),
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                width: 44,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.colors.border,
                marginBottom: theme.spacing(4),
              }}
            />
            <Text
              style={{ color: theme.colors.text, fontSize: theme.font.h3, fontWeight: '800' }}
              maxFontSizeMultiplier={1.4}
            >
              {title}
            </Text>
            {hint ? (
              <Text
                style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.font.small,
                  marginTop: theme.spacing(1),
                  textAlign: 'center',
                }}
                maxFontSizeMultiplier={1.4}
              >
                {hint}
              </Text>
            ) : null}
            <Text
              style={{
                color: theme.colors.primary,
                fontSize: theme.font.h1,
                fontWeight: '800',
                marginTop: theme.spacing(3),
              }}
            >
              {preview}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: theme.spacing(6) }}>
            <WheelPicker
              label="Hour"
              items={HOURS}
              index={hour}
              onChange={setHour}
              width={104}
            />
            <WheelPicker
              label="Minute"
              items={MINUTES}
              index={minute}
              onChange={setMinute}
              width={104}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
            <PrimaryButton label="Cancel" variant="ghost" onPress={onCancel} style={{ flex: 1 }} />
            <PrimaryButton label="Save" onPress={() => onSave(hour * 60 + minute)} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
