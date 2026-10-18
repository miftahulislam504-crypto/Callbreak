import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { CARD_RED, GOLD, GREEN_OK } from '@/constants/palette';

export interface TurnTimer {
  /** Changes when a new countdown starts. */
  key: string;
  remainingMs: number;
  totalMs: number;
}

/** Shrinks from full to empty over the remaining time; goes amber, then red. */
export function TimerBar({ timer, width }: { timer: TurnTimer | null; width: number }) {
  const p = useSharedValue(0);
  const key = timer?.key;
  const remaining = timer?.remainingMs ?? 0;
  const total = timer?.totalMs ?? 1;

  useEffect(() => {
    if (!key) {
      p.set(0);
      return;
    }
    p.set(Math.min(1, remaining / total));
    p.set(withTiming(0, { duration: Math.max(0, remaining), easing: Easing.linear }));
  }, [key, remaining, total, p]);

  const fill = useAnimatedStyle(() => ({
    width: p.get() * width,
    backgroundColor: interpolateColor(p.get(), [0, 0.3, 1], [CARD_RED, GOLD, GREEN_OK]),
  }));

  return (
    <View style={{ width, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: 5, borderRadius: 3 }, fill]} />
    </View>
  );
}
