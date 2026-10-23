import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { CARD_BACK, CARD_BLACK, CARD_RED, GOLD, IVORY } from '@/constants/palette';
import { SUIT_SYMBOL, isRed, rankLabel } from '@/lib/cards';
import type { Card } from '@/lib/types';

export const CARD_RATIO = 1.4;

const shadow = { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 3 } as const;

/** A card drawn with plain Views and text: no image assets. */
export function PlayingCard({
  card, faceDown = false, width, dimmed = false, glow = false,
}: { card?: Card; faceDown?: boolean; width: number; dimmed?: boolean; glow?: boolean }) {
  const height = Math.round(width * CARD_RATIO);
  const radius = Math.max(3, Math.round(width * 0.1));

  if (faceDown || !card) {
    const inset = Math.max(2, width * 0.07);
    return (
      <View style={[{ width, height, borderRadius: radius, backgroundColor: '#F4F1E8', padding: inset }, shadow]}>
        <View style={{ flex: 1, borderRadius: radius * 0.7, backgroundColor: CARD_BACK, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', width: '70%', aspectRatio: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '45deg' }] }} />
          <View style={{ position: 'absolute', width: '42%', aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.18)', transform: [{ rotate: '45deg' }] }} />
          {width >= 28 ? <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: width * 0.3 }}>♠</Text> : null}
        </View>
      </View>
    );
  }

  const color = isRed(card) ? CARD_RED : CARD_BLACK;
  const label = rankLabel(card.rank);
  const suit = SUIT_SYMBOL[card.suit];
  const face = card.rank >= 11 && card.rank <= 13;
  const rankSize = width * (label.length > 1 ? 0.27 : 0.32);

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: IVORY, borderWidth: glow ? 2.5 : 1, borderColor: glow ? GOLD : '#CFCABD' },
        shadow,
      ]}>
      {/* top-left index */}
      <View style={{ position: 'absolute', left: width * 0.08, top: height * 0.03, alignItems: 'center' }}>
        <Text style={{ color, fontSize: rankSize, fontWeight: '900', lineHeight: rankSize * 1.08 }}>{label}</Text>
        <Text style={{ color, fontSize: width * 0.26, lineHeight: width * 0.28 }}>{suit}</Text>
      </View>
      {/* bottom-right index, upside down */}
      <View style={{ position: 'absolute', right: width * 0.08, bottom: height * 0.03, alignItems: 'center', transform: [{ rotate: '180deg' }] }}>
        <Text style={{ color, fontSize: rankSize, fontWeight: '900', lineHeight: rankSize * 1.08 }}>{label}</Text>
        <Text style={{ color, fontSize: width * 0.26, lineHeight: width * 0.28 }}>{suit}</Text>
      </View>
      {/* centre */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        {face ? (
          <View style={{ width: width * 0.5, height: height * 0.56, borderRadius: radius * 0.6, borderWidth: 1.5, borderColor: color, backgroundColor: isRed(card) ? 'rgba(217,54,62,0.07)' : 'rgba(27,27,31,0.06)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color, fontSize: width * 0.34, fontWeight: '900', lineHeight: width * 0.38 }}>{label}</Text>
            <Text style={{ color, fontSize: width * 0.26, lineHeight: width * 0.3 }}>{suit}</Text>
          </View>
        ) : (
          <Text style={{ color, fontSize: width * (card.rank === 14 ? 0.7 : 0.5), lineHeight: width * (card.rank === 14 ? 0.8 : 0.58) }}>{suit}</Text>
        )}
      </View>
      {dimmed ? <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: 'rgba(20,20,20,0.5)' }]} /> : null}
    </View>
  );
}
