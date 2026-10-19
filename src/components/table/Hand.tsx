import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { hapticTap, hapticWarn } from '@/lib/haptics';
import type { Card } from '@/lib/types';

import { CARD_RATIO, PlayingCard } from './PlayingCard';

const key = (c: Card) => `${c.suit}${c.rank}`;
export const HAND_LIFT = 22;
/** Part of the card height that sinks below the screen edge. */
export const HAND_SINK = 0.26;

export const handCardWidth = (areaH: number) => Math.round(Math.min(72, Math.max(46, areaH * 0.19)));
/** Height of the hand strip that is actually visible above the screen bottom (lifted cards included). */
export const handVisibleHeight = (areaH: number) => handCardWidth(areaH) * CARD_RATIO * (1 - HAND_SINK) + HAND_LIFT;

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
    lift.set(withSpring(selected ? -HAND_LIFT : 0, { damping: 16, stiffness: 220 }));
  }, [selected, lift]);
  useEffect(() => {
    deal.set(withDelay(index * 35, withTiming(1, { duration: 260, easing: Easing.out(Easing.cubic) })));
  }, [index, deal]);

  const style = useAnimatedStyle(() => ({
    opacity: deal.get(),
    transform: [
      { translateX: px.get() },
      { translateY: pa.get() + lift.get() - (1 - deal.get()) * 60 },
      { rotate: `${pr.get()}deg` },
    ],
  }));

  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: HAND_LIFT + 4 }, style]}>
      <Pressable onPress={onPress} hitSlop={2}>
        <PlayingCard card={card} width={cardW} dimmed={dimmed} glow={selected} />
      </Pressable>
    </Animated.View>
  );
}

/**
 * Fanned hand along the bottom edge. On your turn the playable cards are bright and the rest
 * dimmed: tap a card to raise it, tap it again to play it.
 */
export function Hand({
  cards, legal, canPlay, onPlay, onIllegal, areaW, areaH, leftInset = 0, rightInset = 0,
}: {
  cards: Card[]; legal: Card[]; canPlay: boolean;
  onPlay: (c: Card) => void; onIllegal: () => void;
  areaW: number; areaH: number; leftInset?: number; rightInset?: number;
}) {
  const cardW = handCardWidth(areaH);
  const cardH = cardW * CARD_RATIO;
  const n = cards.length;
  const avail = Math.max(cardW, areaW - leftInset - rightInset - cardW);
  const step = n > 1 ? Math.min(cardW * 0.78, avail / (n - 1)) : 0;
  const total = step * (n - 1) + cardW;
  const left0 = leftInset + (areaW - leftInset - rightInset - total) / 2;

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
    <View style={{ position: 'absolute', left: 0, bottom: -cardH * HAND_SINK, width: areaW, height: cardH + HAND_LIFT + 8 }}>
      {cards.map((c, i) => {
        const mid = (n - 1) / 2;
        const off = i - mid;
        return (
          <HandCard
            key={key(c)}
            card={c}
            index={i}
            x={left0 + i * step}
            rot={off * 1.7}
            arc={off * off * 0.5}
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
