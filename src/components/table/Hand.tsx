import { useEffect, useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { hapticTap, hapticWarn } from '@/lib/haptics';
import type { Card } from '@/lib/types';

import { CARD_RATIO, PlayingCard } from './PlayingCard';

const key = (c: Card) => `${c.suit}${c.rank}`;
const LIFT = 24;

function HandCard({
  card, index, x, rot, arc, selected, dimmed, cardW, onPress,
}: {
  card: Card; index: number; x: number; rot: number; arc: number; selected: boolean;
  dimmed: boolean; cardW: number; onPress: () => void;
}) {
  const px = useSharedValue(x);
  const pr = useSharedValue(rot);
  const pa = useSharedValue(arc);
  const lift = useSharedValue(0);
  const deal = useSharedValue(0);

  useEffect(() => {
    px.set(withTiming(x, { duration: 180 }));
    pr.set(withTiming(rot, { duration: 180 }));
    pa.set(withTiming(arc, { duration: 180 }));
  }, [x, rot, arc, px, pr, pa]);
  useEffect(() => {
    lift.set(withSpring(selected ? -LIFT : 0, { damping: 16, stiffness: 220 }));
  }, [selected, lift]);
  useEffect(() => {
    deal.set(withDelay(index * 35, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })));
  }, [index, deal]);

  const style = useAnimatedStyle(() => ({
    opacity: deal.get(),
    transform: [
      { translateX: px.get() },
      { translateY: pa.get() + lift.get() - (1 - deal.get()) * 50 },
      { rotate: `${pr.get()}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: LIFT + 6 }, style]}>
      <Pressable onPress={onPress} hitSlop={4}>
        <PlayingCard card={card} width={cardW} dimmed={dimmed} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Fanned hand. On your turn the playable cards are bright and the rest dimmed:
 * tap a card to raise it, tap it again to play it.
 */
export function Hand({
  cards, legal, canPlay, onPlay, onIllegal,
}: {
  cards: Card[]; legal: Card[]; canPlay: boolean;
  onPlay: (c: Card) => void; onIllegal: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(64, Math.max(48, (width - 24) / 5.2));
  const cardH = cardW * CARD_RATIO;
  const n = cards.length;
  const avail = width - 24 - cardW;
  const step = n > 1 ? Math.min(cardW * 0.7, avail / (n - 1)) : 0;
  const left0 = (width - (step * (n - 1) + cardW)) / 2;

  // The selection is tied to the hand size, so it goes stale by itself once a card has been played.
  const [sel, setSel] = useState<{ k: string; n: number } | null>(null);
  const active = canPlay && sel && sel.n === n && cards.some((c) => key(c) === sel.k) ? sel.k : null;
  const isLegal = (c: Card) => legal.some((l) => key(l) === key(c));

  const press = (c: Card) => {
    if (!canPlay) return;
    if (!isLegal(c)) {
      hapticWarn();
      onIllegal();
      return;
    }
    if (active === key(c)) {
      onPlay(c);
      return;
    }
    hapticTap();
    setSel({ k: key(c), n });
  };

  return (
    <View style={{ height: cardH + LIFT + 14, width }}>
      {cards.map((c, i) => {
        const mid = (n - 1) / 2;
        const off = i - mid;
        return (
          <HandCard
            key={key(c)}
            card={c}
            index={i}
            x={left0 + i * step}
            rot={off * 2.2}
            arc={off * off * 0.55}
            selected={active === key(c)}
            dimmed={canPlay && !isLegal(c)}
            cardW={cardW}
            onPress={() => press(c)}
          />
        );
      })}
    </View>
  );
}
