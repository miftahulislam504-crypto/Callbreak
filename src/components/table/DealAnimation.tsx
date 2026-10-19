import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DECK, FLIGHT_MS, type DealProgress } from '@/lib/dealing';

import { CARD_RATIO, PlayingCard } from './PlayingCard';

const CARD_W = 24;

function Flyer({ dx, dy, rot }: { dx: number; dy: number; rot: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withTiming(1, { duration: FLIGHT_MS, easing: Easing.out(Easing.quad) }));
  }, [p]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.get(), [0, 0.82, 1], [1, 1, 0]),
    transform: [{ translateX: p.get() * dx }, { translateY: p.get() * dy }, { rotate: `${p.get() * rot}deg` }, { scale: 1 - 0.15 * p.get() }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: -CARD_W / 2, top: -(CARD_W * CARD_RATIO) / 2 }, style]}>
      <PlayingCard faceDown width={CARD_W} />
    </Animated.View>
  );
}

/**
 * The pack in the middle of the table and the cards flying out of it to the four players.
 * `targets[k]` is where the k-th player to receive cards sits, relative to the centre.
 */
export function DealAnimation({
  center, targets, progress,
}: {
  center: { x: number; y: number };
  targets: { x: number; y: number }[];
  progress: DealProgress;
}) {
  const { launched, landed } = progress;
  if (landed >= DECK) return null;
  const flying: number[] = [];
  for (let i = Math.max(0, landed); i < launched; i++) flying.push(i);
  const left = DECK - launched;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: center.x, top: center.y, width: 0, height: 0 }}>
      {/* the pack, shrinking as cards leave it */}
      {left > 0 ? (
        <View style={{ position: 'absolute', left: -CARD_W / 2, top: -(CARD_W * CARD_RATIO) / 2 }}>
          {[0, 1, 2].slice(0, Math.min(3, Math.ceil(left / 18))).map((n) => (
            <View key={n} style={{ position: n === 0 ? 'relative' : 'absolute', left: n * 1.5, top: -n * 1.5 }}>
              <PlayingCard faceDown width={CARD_W} />
            </View>
          ))}
        </View>
      ) : null}
      {flying.map((i) => {
        const t = targets[i % 4];
        return <Flyer key={i} dx={t.x - center.x} dy={t.y - center.y} rot={((i * 53) % 40) - 20} />;
      })}
    </View>
  );
}
