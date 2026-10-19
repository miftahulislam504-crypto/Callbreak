import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Avatar } from '@/components/kit';
import { CREAM, GOLD } from '@/constants/palette';
import type { T } from '@/lib/i18n';

import { PlayingCard } from './PlayingCard';
import { TimerBar, type TurnTimer } from './TimerBar';

export type SeatSide = 'top' | 'left' | 'right' | 'me';

export interface PlayerSeatProps {
  side: SeatSide;
  name: string;
  isMe: boolean;
  isBot: boolean;
  offline: boolean;
  auto: boolean;
  isDealer: boolean;
  isTurn: boolean;
  bid: number | null;
  /** Rounds without bidding show only the tricks won. */
  noBid: boolean;
  won: number;
  handCount: number;
  total: number;
  timer: TurnTimer | null;
  t: T;
}

const AV = 42;
const RING = 52;

function TurnGlow({ active }: { active: boolean }) {
  const o = useSharedValue(0);
  useEffect(() => {
    if (active) o.set(withRepeat(withTiming(1, { duration: 650, easing: Easing.inOut(Easing.quad) }), -1, true));
    else o.set(withTiming(0, { duration: 150 }));
  }, [active, o]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * o.get(), transform: [{ scale: 1 + 0.08 * o.get() }] }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 3, borderColor: GOLD }, style]}
    />
  );
}

/** The other players' hidden hands, as a small fan of card backs. */
function CardFan({ count, vertical }: { count: number; vertical: boolean }) {
  const w = 17;
  const h = Math.round(w * 1.4);
  const step = 5.5;
  const n = Math.min(count, 13);
  if (n === 0) return null;
  const len = h + (n - 1) * step;
  return (
    <View style={vertical ? { width: h + 2, height: len + 4 } : { width: len + 4, height: h + 2 }}>
      {Array.from({ length: n }, (_, i) => (
        <View
          key={i}
          style={
            vertical
              ? { position: 'absolute', left: 0, top: i * step, width: h, height: w, alignItems: 'center', justifyContent: 'center' }
              : { position: 'absolute', top: 0, left: i * step }
          }>
          {vertical ? (
            <View style={{ transform: [{ rotate: '90deg' }] }}>
              <PlayingCard faceDown width={w} />
            </View>
          ) : (
            <PlayingCard faceDown width={w} />
          )}
        </View>
      ))}
    </View>
  );
}

function Identity(p: PlayerSeatProps) {
  const tags = [p.isBot ? p.t('bot') : '', p.auto ? p.t('badgeAuto') : '', p.offline ? p.t('offline') : ''].filter(Boolean);
  const score = p.noBid ? `${p.won}` : `${p.won}/${p.bid ?? '–'}`;
  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center', opacity: p.offline ? 0.55 : 1 }}>
        <TurnGlow active={p.isTurn} />
        <Avatar name={p.name} size={AV} />
        {p.isDealer ? (
          <View style={{ position: 'absolute', right: -2, top: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#7B4A24' }}>
            <Text style={{ color: '#3A2400', fontSize: 10, fontWeight: '900' }}>D</Text>
          </View>
        ) : null}
      </View>
      <View style={{ backgroundColor: 'rgba(20,12,4,0.72)', borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3, alignItems: 'center', minWidth: 76, maxWidth: 104, borderWidth: p.isTurn ? 1.5 : 0, borderColor: GOLD }}>
        <Text numberOfLines={1} style={{ color: CREAM, fontSize: 12, fontWeight: '800' }}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 5 }}>
          <Text style={{ color: GOLD, fontSize: 13, fontWeight: '900' }}>{score}</Text>
          <Text style={{ color: 'rgba(246,241,227,0.7)', fontSize: 10.5, fontWeight: '700' }}>{p.total.toFixed(1)}</Text>
        </View>
      </View>
      {tags.length > 0 ? <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9.5, fontWeight: '700', textShadowColor: '#000', textShadowRadius: 2 }}>{tags.join(' · ')}</Text> : null}
      {p.timer ? <TimerBar timer={p.timer} width={70} /> : null}
    </View>
  );
}

export function PlayerSeat(p: PlayerSeatProps) {
  if (p.side === 'me') return <Identity {...p} />;
  const fan = <CardFan count={p.handCount} vertical={p.side !== 'top'} />;
  if (p.side === 'left') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Identity {...p} />
        {fan}
      </View>
    );
  }
  if (p.side === 'right') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {fan}
        <Identity {...p} />
      </View>
    );
  }
  // top: avatar in the middle, fan to its side
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <Identity {...p} />
      <View style={{ paddingTop: 8 }}>{fan}</View>
    </View>
  );
}
