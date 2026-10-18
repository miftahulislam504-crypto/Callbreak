import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Avatar } from '@/components/kit';
import { GOLD } from '@/constants/palette';
import type { T } from '@/lib/i18n';

import { PlayingCard } from './PlayingCard';
import { TimerBar, type TurnTimer } from './TimerBar';

export const SEAT_WIDTH = 88;

export interface PlayerSeatProps {
  name: string;
  isMe: boolean;
  isBot: boolean;
  offline: boolean;
  auto: boolean;
  isDealer: boolean;
  isTurn: boolean;
  bid: number | null;
  won: number;
  handCount: number;
  total: number;
  timer: TurnTimer | null;
  showHandCount: boolean;
  t: T;
}

function TurnGlow({ active }: { active: boolean }) {
  const o = useSharedValue(0);
  useEffect(() => {
    if (active) o.set(withRepeat(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true));
    else o.set(withTiming(0, { duration: 150 }));
  }, [active, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.get() }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 3, borderColor: GOLD }, style]}
    />
  );
}

const badge = { color: '#fff', fontSize: 10, fontWeight: '700' as const };

export function PlayerSeat(p: PlayerSeatProps) {
  const tags = [
    p.isDealer ? '◆' : '',
    p.isBot ? p.t('bot') : '',
    p.auto ? p.t('badgeAuto') : '',
    p.offline ? p.t('offline') : '',
  ].filter(Boolean);

  return (
    <View style={{ width: SEAT_WIDTH, alignItems: 'center', gap: 3 }}>
      <View style={{ width: 54, height: 54, alignItems: 'center', justifyContent: 'center', opacity: p.offline ? 0.55 : 1 }}>
        <TurnGlow active={p.isTurn} />
        <Avatar name={p.name} size={44} />
      </View>
      <Text numberOfLines={1} style={{ color: '#fff', fontSize: 13, fontWeight: '700', maxWidth: SEAT_WIDTH }}>
        {p.name}
      </Text>
      <View style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>
          {p.won}/{p.bid ?? '–'}
        </Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>{p.total.toFixed(1)}</Text>
      {tags.length > 0 ? <Text style={badge}>{tags.join(' · ')}</Text> : null}
      {p.timer ? <TimerBar timer={p.timer} width={SEAT_WIDTH - 20} /> : null}
      {p.showHandCount ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <PlayingCard faceDown width={14} />
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>×{p.handCount}</Text>
        </View>
      ) : null}
    </View>
  );
}
