import { useEffect } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';

import { PANEL_FRAME } from '@/constants/ui';
import { PanelShine } from '@/components/frame';
import { Text } from '@/components/text';
import { CARD_BLACK, CARD_RED, CREAM, GOLD, IVORY, IVORY_EDGE, MUTED } from '@/constants/palette';
import { hapticTap } from '@/lib/haptics';
import type { T } from '@/lib/i18n';
import type { GameView } from '@/lib/types';

const SUITS = ['♠', '♥', '♣', '♦'];

/** One bid as a little playing card: big number, suit in the corners. */
function BidCard({ n, i, w, onPress, t }: { n: number; i: number; w: number; onPress: () => void; t: T }) {
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.set(withDelay(60 + i * 40, withSpring(1, { damping: 12, stiffness: 180 })));
  }, [i, pop]);
  const style = useAnimatedStyle(() => ({ opacity: pop.get(), transform: [{ translateY: (1 - pop.get()) * 18 }, { scale: 0.85 + 0.15 * pop.get() }] }));

  const h = Math.round(w * 1.32);
  const suit = SUITS[i % 4];
  const color = suit === '♥' || suit === '♦' ? CARD_RED : CARD_BLACK;
  return (
    <Animated.View style={style}>
      <Pressable
        onPress={() => {
          hapticTap();
          onPress();
        }}
        style={({ pressed }) => ({
          width: w, height: h, borderRadius: 12, backgroundColor: IVORY, borderWidth: 2,
          borderColor: pressed ? GOLD : IVORY_EDGE, alignItems: 'center', justifyContent: 'center',
          transform: [{ translateY: pressed ? -6 : 0 }, { scale: pressed ? 1.05 : 1 }],
          shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 0, height: 3 }, elevation: 4,
        })}>
        <Text style={{ position: 'absolute', left: 6, top: 3, color, fontSize: 13 }}>{suit}</Text>
        <Text style={{ position: 'absolute', right: 6, bottom: 3, color, fontSize: 13, transform: [{ rotate: '180deg' }] }}>{suit}</Text>
        <Text style={{ color, fontSize: w * 0.58, fontWeight: '900', lineHeight: w * 0.66 }}>{n}</Text>
        <Text style={{ color: '#7A7667', fontSize: 10.5, fontWeight: '800', marginTop: -2 }}>{t('trickWord')}</Text>
      </Pressable>
    </Animated.View>
  );
}

/** Shown over the middle of the table on your turn to bid. */
export function BidSheet({ game, onBid, t }: { game: GameView; onBid: (n: number) => void; t: T }) {
  const { width, height } = useWindowDimensions();
  const bids = Array.from({ length: game.maxBid - game.minBid + 1 }, (_, i) => game.minBid + i);
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.set(withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }));
  }, [enter]);
  const panel = useAnimatedStyle(() => ({ opacity: enter.get(), transform: [{ scale: 0.94 + 0.06 * enter.get() }] }));

  const gap = 8;
  const pad = 18;
  const maxPanel = Math.min(width - 120, 640);
  const cardW = Math.max(44, Math.min(64, Math.floor((maxPanel - pad * 2 - gap * (bids.length - 1)) / bids.length)));
  const panelW = cardW * bids.length + gap * (bids.length - 1) + pad * 2;

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.38)' }}>
      <Animated.View
        style={[
          PANEL_FRAME,
          {
            width: panelW, maxHeight: height - 40, paddingVertical: 14, paddingHorizontal: pad, gap: 12, alignItems: 'center',
          },
          panel,
        ]}>
        <PanelShine />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ color: GOLD, fontSize: 16 }}>♠ ♥</Text>
            <Text style={{ color: CREAM, fontSize: 20, fontWeight: '900' }}>{t('chooseBid')}</Text>
            <Text style={{ color: GOLD, fontSize: 16 }}>♣ ♦</Text>
          </View>
          <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('bidHint')}</Text>
          <Text style={{ color: MUTED, fontSize: 11.5, opacity: 0.85 }}>{t('bidRuleHint')}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap, justifyContent: 'center' }}>
          {bids.map((b, i) => (
            <BidCard key={b} n={b} i={i} w={cardW} onPress={() => onBid(b)} t={t} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}
