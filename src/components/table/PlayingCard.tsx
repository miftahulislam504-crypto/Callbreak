import { StyleSheet, Text, View } from 'react-native';

import { CARD_BACK, CARD_BLACK, CARD_RED } from '@/constants/palette';
import { SUIT_SYMBOL, isRed, rankLabel } from '@/lib/cards';
import type { Card } from '@/lib/types';

export const CARD_RATIO = 1.4;

/** A card drawn with plain Views and text: no image assets. */
export function PlayingCard({
  card, faceDown = false, width, dimmed = false,
}: { card?: Card; faceDown?: boolean; width: number; dimmed?: boolean }) {
  const height = Math.round(width * CARD_RATIO);
  const radius = Math.round(width * 0.12);

  if (faceDown || !card) {
    return (
      <View style={{ width, height, borderRadius: radius, backgroundColor: CARD_BACK, borderWidth: 1, borderColor: '#0F2F66', padding: width * 0.07 }}>
        <View style={{ flex: 1, borderRadius: radius * 0.6, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: width * 0.45 }}>♠</Text>
        </View>
      </View>
    );
  }

  const color = isRed(card) ? CARD_RED : CARD_BLACK;
  return (
    <View style={{ width, height, borderRadius: radius, backgroundColor: '#fff', borderWidth: 1, borderColor: '#C9CCD2' }}>
      <View style={{ position: 'absolute', left: width * 0.1, top: height * 0.04, alignItems: 'center' }}>
        <Text style={{ color, fontSize: width * 0.3, fontWeight: '800', lineHeight: width * 0.34 }}>{rankLabel(card.rank)}</Text>
        <Text style={{ color, fontSize: width * 0.26, lineHeight: width * 0.28 }}>{SUIT_SYMBOL[card.suit]}</Text>
      </View>
      <Text style={{ position: 'absolute', right: width * 0.1, bottom: height * 0.04, color, fontSize: width * 0.52 }}>
        {SUIT_SYMBOL[card.suit]}
      </Text>
      {dimmed ? <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: 'rgba(0,0,0,0.45)' }]} /> : null}
    </View>
  );
}
