import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { ShownCard } from '@/lib/trickPlayer';
import type { Card } from '@/lib/types';

import { CARD_RATIO, PlayingCard } from './PlayingCard';

/** Direction of each relative seat from the centre: 0 = me (bottom), 1 = left, 2 = top, 3 = right. */
const DIR = [
  { x: 0, y: 1 },
  { x: -1, y: 0 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
];

export const trickAreaSize = (cardW: number) => ({ w: cardW * 3.1, h: cardW * CARD_RATIO * 1.9 });

function TrickCard({
  card, rel, sweepRel, cardW,
}: { card: Card; rel: number; sweepRel: number | null; cardW: number }) {
  const { w, h } = trickAreaSize(cardW);
  const cardH = cardW * CARD_RATIO;
  const enter = useSharedValue(0);
  const out = useSharedValue(0);

  useEffect(() => {
    enter.set(withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }));
  }, [enter]);
  useEffect(() => {
    if (sweepRel !== null) out.set(withTiming(1, { duration: 340, easing: Easing.in(Easing.quad) }));
  }, [sweepRel, out]);

  const d = DIR[rel];
  const slotX = d.x * cardW * 0.72;
  const slotY = d.y * cardH * 0.5;
  const fromX = d.x * w * 0.9;
  const fromY = d.y * h * 1.2;
  const sd = sweepRel === null ? { x: 0, y: 0 } : DIR[sweepRel];
  const sweepX = sd.x * w * 1.1;
  const sweepY = sd.y * h * 1.4;
  const tilt = ((rel * 37 + card.rank * 11) % 9) - 4; // stable little rotation per card

  const style = useAnimatedStyle(() => {
    const e = enter.get();
    const o = out.get();
    return {
      opacity: (0.2 + 0.8 * e) * (1 - o),
      transform: [
        { translateX: slotX + (1 - e) * fromX + o * sweepX },
        { translateY: slotY + (1 - e) * fromY + o * sweepY },
        { rotate: `${tilt}deg` },
        { scale: 1.12 - 0.12 * e },
      ],
    };
  });

  return (
    <Animated.View style={[{ position: 'absolute', left: w / 2 - cardW / 2, top: h / 2 - cardH / 2 }, style]}>
      <PlayingCard card={card} width={cardW} />
    </Animated.View>
  );
}

export function TrickArea({
  shown, sweepTo, mySeat, cardW,
}: { shown: ShownCard[]; sweepTo: number | null; mySeat: number; cardW: number }) {
  const { w, h } = trickAreaSize(cardW);
  const relOf = (seat: number) => (seat - mySeat + 4) % 4;
  return (
    <View style={{ width: w, height: h }}>
      {shown.map((s) => (
        <TrickCard
          key={s.key}
          card={s.card}
          rel={relOf(s.seat)}
          sweepRel={sweepTo === null ? null : relOf(sweepTo)}
          cardW={cardW}
        />
      ))}
    </View>
  );
}
