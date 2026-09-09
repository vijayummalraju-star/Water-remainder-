import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { useApp } from '../state/AppContext';
import { Screen, ScreenHeader } from '../components/Screen';
import { Card } from '../components/Card';
import { EmptyState } from '../components/EmptyState';
import { ACHIEVEMENTS } from '../lib/achievements';

interface Props {
  navigation: any;
}

/** Badge gallery — unlocked achievements keep their original unlock time. */
export function AchievementsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { achievements, unlockedCount } = useApp();

  return (
    <Screen>
      <ScreenHeader
        title="Achievements"
        subtitle={`${unlockedCount} of ${ACHIEVEMENTS.length} unlocked`}
        onBack={() => navigation.goBack()}
      />

      <Card style={{ alignItems: 'center', paddingVertical: theme.spacing(5) }}>
        <View
          style={{
            width: 74,
            height: 74,
            borderRadius: 37,
            backgroundColor: theme.colors.warning + '22',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="trophy" size={34} color={theme.colors.warning} />
        </View>
        <Text style={{ color: theme.colors.text, fontSize: theme.font.h2, fontWeight: '800', marginTop: theme.spacing(3) }}>
          {unlockedCount === ACHIEVEMENTS.length ? 'All unlocked!' : `${Math.round((unlockedCount / ACHIEVEMENTS.length) * 100)}% complete`}
        </Text>
        <Text
          style={{
            color: theme.colors.textMuted,
            fontSize: theme.font.small,
            textAlign: 'center',
            marginTop: theme.spacing(2),
            lineHeight: 20,
          }}
        >
          {unlockedCount === 0
            ? 'Log a drink to earn your first badge.'
            : 'Keep hydrating to unlock the rest of the collection.'}
        </Text>
      </Card>

      {unlockedCount === 0 ? (
        <Card>
          <EmptyState
            icon="ribbon-outline"
            title="No badges yet"
            message="Badges reward consistency — your first one is only a single sip away."
          />
        </Card>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing(3),
        }}
      >
        {ACHIEVEMENTS.map((a, i) => {
          const unlockedAt = achievements[a.id];
          const unlocked = unlockedAt != null;
          return (
            <Animated.View
              key={a.id}
              entering={FadeInDown.delay(Math.min(i, 9) * 45).duration(380)}
              style={{ width: '47%', flexGrow: 1 }}
            >
              <Card
                style={{
                  alignItems: 'center',
                  paddingVertical: theme.spacing(5),
                  gap: theme.spacing(2),
                  opacity: unlocked ? 1 : 0.62,
                  borderColor: unlocked ? `${a.color}55` : theme.colors.border,
                }}
              >
                <View
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 31,
                    backgroundColor: unlocked ? `${a.color}26` : theme.colors.cardMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={(unlocked ? a.icon : 'lock-closed') as any}
                    size={28}
                    color={unlocked ? a.color : theme.colors.textMuted}
                  />
                </View>
                <Text
                  style={{
                    color: theme.colors.text,
                    fontSize: theme.font.body,
                    fontWeight: '800',
                    textAlign: 'center',
                    marginTop: theme.spacing(1),
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {a.title}
                </Text>
                <Text
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: theme.font.tiny + 1,
                    textAlign: 'center',
                    lineHeight: 17,
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {a.description}
                </Text>
              </Card>
            </Animated.View>
          );
        })}
      </View>
    </Screen>
  );
}
