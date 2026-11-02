import { Platform, StyleSheet, View, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { GOLD } from '@/constants/palette';
import { CARD_BACKS, CARD_DESIGNS, withAlpha, type CardBackId, type CardDesign, type CardDesignId } from '@/constants/themes';
import {
  CARD_RATIO, CARD_SHADOW, bigSuitSize, cardSize, cornerSizes, faceFrame, pipField, pipSpots, ringSize,
} from '@/lib/cardLayout';
import { SUIT_SYMBOL, rankLabel } from '@/lib/cards';
import type { Card } from '@/lib/types';
import { useLook } from '@/state/look';

import { CardBackFace } from './CardBack';

export { CARD_RATIO };

const SERIF = Platform.select({ ios: 'Georgia', default: 'serif' });

/** The typeface of the corner numbers (serif designs pick a system serif on purpose; see components/text.tsx). */
const typeStyle = (t: CardDesign['type']): TextStyle =>
  t === 'serif' ? { fontFamily: SERIF, fontWeight: '700' } : t === 'sans' ? { fontWeight: '700' } : { fontWeight: '900' };

/** Rank over suit in a corner. The bottom-right one is the same thing turned upside down. */
function Corner({
  card, d, width, height, flipped,
}: { card: Card; d: CardDesign; width: number; height: number; flipped: boolean }) {
  const color = d.ink[card.suit];
  const label = rankLabel(card.rank);
  const sz = cornerSizes(width, label, d.pips === 'full');
  const place = flipped
    ? { right: width * 0.08, bottom: height * 0.03, transform: [{ rotate: '180deg' }] }
    : { left: width * 0.08, top: height * 0.03 };
  return (
    <View style={[{ position: 'absolute', alignItems: 'center' }, place]}>
      <Text style={[{ color, fontSize: sz.rank, lineHeight: sz.rank * 1.08 }, typeStyle(d.type)]}>{label}</Text>
      <Text style={{ color, fontSize: sz.suit, lineHeight: sz.suit * 1.08 }}>{SUIT_SYMBOL[card.suit]}</Text>
    </View>
  );
}

/** The mark above the letter on J, Q and K: a shield, a five-point crown, a three-point crown. */
function Emblem({ rank, w, color }: { rank: number; w: number; color: string }) {
  if (rank === 11) {
    const s = w * 0.62;
    return (
      <View
        style={{
          width: s, height: s, backgroundColor: color, borderTopLeftRadius: s * 0.12, borderTopRightRadius: s * 0.12,
          borderBottomLeftRadius: s * 0.5, borderBottomRightRadius: s * 0.5,
        }}
      />
    );
  }
  const points = rank === 12 ? 5 : 3;
  const h = w * 0.62;
  const baseH = h * 0.3;
  const pw = w / points;
  return (
    <View style={{ width: w, height: h }}>
      {Array.from({ length: points }, (_, i) => {
        const mid = (points - 1) / 2;
        const tall = 1 - (Math.abs(i - mid) / mid) * (points === 3 ? 0.28 : 0.36);
        return (
          <View
            key={i}
            style={{
              position: 'absolute', left: i * pw, bottom: baseH * 0.7, width: 0, height: 0,
              borderLeftWidth: pw / 2, borderRightWidth: pw / 2, borderBottomWidth: (h - baseH * 0.7) * tall,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: color,
            }}
          />
        );
      })}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: baseH, borderRadius: baseH * 0.4, backgroundColor: color }} />
    </View>
  );
}

/** J, Q, K: a framed box with the letter and the suit (and, on crest designs, the emblem above them). */
function FaceCard({
  card, d, width, radius,
}: { card: Card; d: CardDesign; width: number; radius: number }) {
  const color = d.ink[card.suit];
  const frame = faceFrame(width, d.crest);
  const emblem = d.crest && width >= 44;
  return (
    <View
      style={{
        width: frame.width, height: frame.height, borderRadius: radius * 0.6, borderWidth: 1.5, borderColor: color,
        backgroundColor: withAlpha(color, 0.07), alignItems: 'center', justifyContent: 'center',
      }}>
      {emblem ? <Emblem rank={card.rank} w={frame.width * 0.64} color={d.accent} /> : null}
      <Text style={[{ color, fontSize: width * (emblem ? 0.28 : 0.34), lineHeight: width * (emblem ? 0.31 : 0.38) }, typeStyle(d.type)]}>
        {rankLabel(card.rank)}
      </Text>
      <Text style={{ color, fontSize: width * (emblem ? 0.22 : 0.26), lineHeight: width * (emblem ? 0.25 : 0.3) }}>{SUIT_SYMBOL[card.suit]}</Text>
    </View>
  );
}

/** 2 to 10 on a "full" design: the pips in their traditional places (all upright, see pipSpots). */
function Pips({ card, color, width }: { card: Card; color: string; width: number }) {
  const f = pipField(width);
  const s = f.size;
  return (
    <>
      {pipSpots(card.rank).map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute', left: f.left + p.x * f.width - s * 0.6, top: f.top + p.y * f.height - s * 0.58,
            width: s * 1.2, height: s * 1.16, alignItems: 'center', justifyContent: 'center',
          }}>
          <Text style={{ color, fontSize: s, lineHeight: s * 1.16 }}>{SUIT_SYMBOL[card.suit]}</Text>
        </View>
      ))}
    </>
  );
}

function CardFace({
  card, d, width, dimmed, glow,
}: { card: Card; d: CardDesign; width: number; dimmed: boolean; glow: boolean }) {
  const { height, radius } = cardSize(width);
  const color = d.ink[card.suit];
  const full = d.pips === 'full';
  const isFace = card.rank >= 11 && card.rank <= 13;
  const big = bigSuitSize(width, card.rank, full);
  const fi = Math.max(2.5, width * 0.045);
  const ring = ringSize(width, card.rank);
  const showRing = d.ring && (!full || card.rank === 14);

  return (
    <View
      style={[
        { width, height, borderRadius: radius, backgroundColor: d.paper, borderWidth: glow ? 2.5 : d.edgeWidth, borderColor: glow ? GOLD : d.edge },
        CARD_SHADOW,
      ]}>
      {d.topBar ? (
        <View
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(2.5, height * 0.035), backgroundColor: color,
            borderTopLeftRadius: Math.max(1, radius - 1), borderTopRightRadius: Math.max(1, radius - 1),
          }}
        />
      ) : null}
      {d.frame && width >= 30 ? (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: fi, right: fi, top: fi, bottom: fi, borderRadius: Math.max(2, radius * 0.7), borderWidth: 1, borderColor: withAlpha(d.accent, 0.55) }}
        />
      ) : null}

      <Corner card={card} d={d} width={width} height={height} flipped={false} />
      <Corner card={card} d={d} width={width} height={height} flipped />

      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        {isFace ? (
          <FaceCard card={card} d={d} width={width} radius={radius} />
        ) : full && card.rank <= 10 ? (
          <Pips card={card} color={color} width={width} />
        ) : (
          <>
            {showRing ? (
              <View
                style={{
                  position: 'absolute', left: (width - ring) / 2 - 1, top: (height - ring) / 2 - 1, width: ring, height: ring,
                  borderRadius: ring / 2, borderWidth: 1, borderColor: withAlpha(d.accent, 0.8),
                }}
              />
            ) : null}
            <Text style={{ color, fontSize: big.size, lineHeight: big.line }}>{SUIT_SYMBOL[card.suit]}</Text>
          </>
        )}
      </View>

      {dimmed ? <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: d.dim }]} /> : null}
    </View>
  );
}

/**
 * A card drawn with plain Views and text: no image assets. It wears the look the player picked (see
 * state/look.ts); `design` and `back` draw it in a given look instead (the picker screen uses that).
 */
export function PlayingCard({
  card, faceDown = false, width, dimmed = false, glow = false, design, back,
}: {
  card?: Card; faceDown?: boolean; width: number; dimmed?: boolean; glow?: boolean;
  design?: CardDesignId; back?: CardBackId;
}) {
  const pickedFace = useLook((s) => s.card);
  const pickedBack = useLook((s) => s.back);
  if (faceDown || !card) return <CardBackFace back={CARD_BACKS[back ?? pickedBack]} width={width} />;
  return <CardFace card={card} d={CARD_DESIGNS[design ?? pickedFace]} width={width} dimmed={dimmed} glow={glow} />;
}
