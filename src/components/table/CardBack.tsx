import { View } from 'react-native';

import { Text } from '@/components/text';
import { CARD_DESIGNS, type CardBack as CardBackDesign } from '@/constants/themes';
import { CARD_SHADOW, cardSize } from '@/lib/cardLayout';

/** A rotated / rounded box centred on (cx, cy). */
function Box({
  cx, cy, w, h = w, rotate = 0, color, border, radius = 0,
}: { cx: number; cy: number; w: number; h?: number; rotate?: number; color?: string; border?: string; radius?: number }) {
  return (
    <View
      style={{
        position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: radius,
        backgroundColor: color, borderWidth: border ? 1 : 0, borderColor: border,
        transform: rotate ? [{ rotate: `${rotate}deg` }] : undefined,
      }}
    />
  );
}

/** A circle centred on (cx, cy). */
const Dot = (p: { cx: number; cy: number; d: number; color?: string; border?: string }) => (
  <Box cx={p.cx} cy={p.cy} w={p.d} radius={p.d / 2} color={p.color} border={p.border} />
);

/** A text mark (suit symbol, star) centred on (cx, cy). */
function Mark({ cx, cy, size, color, children }: { cx: number; cy: number; size: number; color: string; children: string }) {
  return (
    <View style={{ position: 'absolute', left: cx - size, top: cy - size, width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color, fontSize: size, lineHeight: size * 1.2 }}>{children}</Text>
    </View>
  );
}

/** Fixed little stars for the night-sky back (fractions of the inner size). */
const DOTS: [number, number, number][] = [
  [0.14, 0.1, 0.05], [0.8, 0.08, 0.035], [0.5, 0.05, 0.03], [0.9, 0.3, 0.04], [0.1, 0.34, 0.03],
  [0.88, 0.62, 0.035], [0.12, 0.68, 0.045], [0.3, 0.92, 0.035], [0.74, 0.9, 0.05], [0.52, 0.96, 0.03],
];

/** The pattern of a back. `detail`: 2 = everything, 1 = a simpler centre only, 0 = a single shape (tiny cards). */
function Art({ back, cw, iw, ih, detail }: { back: CardBackDesign; cw: number; iw: number; ih: number; detail: 0 | 1 | 2 }) {
  const cx = iw / 2;
  const cy = ih / 2;
  const { line, fill, glyph, base } = back;

  switch (back.pattern) {
    case 'diamond': // the original: a diamond in a diamond with a spade
      return (
        <>
          <Box cx={cx} cy={cy} w={iw * 0.7} rotate={45} border={line} />
          <Box cx={cx} cy={cy} w={iw * 0.42} rotate={45} color={fill} />
          {cw >= 28 ? <Mark cx={cx} cy={cy} size={cw * 0.3} color={glyph}>♠</Mark> : null}
        </>
      );

    case 'lattice': {
      // diagonal lines both ways, and a round medallion on top
      const lines: React.ReactNode[] = [];
      if (detail === 2) {
        const gap = iw * 0.34;
        const len = Math.hypot(iw, ih);
        const k = Math.ceil((iw + ih) / 2 / gap);
        for (let i = -k; i <= k; i++) {
          for (const dir of [45, -45]) {
            lines.push(
              <View
                key={`${dir}:${i}`}
                style={{ position: 'absolute', left: cx - len / 2, top: cy + i * gap, width: len, height: 1, backgroundColor: fill, transform: [{ rotate: `${dir}deg` }] }}
              />,
            );
          }
        }
      }
      return (
        <>
          {lines}
          {detail >= 1 ? (
            <>
              <Dot cx={cx} cy={cy} d={iw * 0.56} color={base} border={line} />
              <Box cx={cx} cy={cy} w={iw * 0.3} rotate={45} color={fill} border={line} />
              {detail === 2 ? <Mark cx={cx} cy={cy} size={cw * 0.17} color={glyph}>♦</Mark> : null}
            </>
          ) : (
            <Box cx={cx} cy={cy} w={iw * 0.5} rotate={45} color={fill} border={line} />
          )}
        </>
      );
    }

    case 'stars':
      return (
        <>
          {detail === 2 ? DOTS.map(([x, y, s], i) => <Dot key={i} cx={x * iw} cy={y * ih} d={Math.max(1.5, iw * s)} color={glyph} />) : null}
          {detail >= 1 ? <Dot cx={cx} cy={cy} d={iw * 0.7} border={line} /> : null}
          <Dot cx={cx} cy={cy} d={iw * (detail >= 1 ? 0.46 : 0.5)} color={fill} border={detail >= 1 ? line : undefined} />
          {detail === 2 ? <Mark cx={cx} cy={cy} size={cw * 0.19} color={glyph}>★</Mark> : null}
        </>
      );

    case 'suits': {
      // a small tile with the four suits in their four colours: the back of the four-colour deck
      const ink = CARD_DESIGNS.fourColor.ink;
      const o = iw * 0.17;
      return (
        <>
          {detail >= 1 ? <Dot cx={cx} cy={cy} d={iw * 0.9} border={line} /> : null}
          {detail >= 1 ? (
            <>
              <Box cx={cx} cy={cy} w={iw * 0.68} radius={iw * 0.12} color={back.rim} />
              <Mark cx={cx - o} cy={cy - o} size={cw * 0.19} color={ink.S}>♠</Mark>
              <Mark cx={cx + o} cy={cy - o} size={cw * 0.19} color={ink.H}>♥</Mark>
              <Mark cx={cx - o} cy={cy + o} size={cw * 0.19} color={ink.C}>♣</Mark>
              <Mark cx={cx + o} cy={cy + o} size={cw * 0.19} color={ink.D}>♦</Mark>
            </>
          ) : (
            <Box cx={cx} cy={cy} w={iw * 0.55} rotate={45} color={back.rim} />
          )}
        </>
      );
    }

    case 'rosette': // eight petals around a centre
      return (
        <>
          {detail === 2 ? <Dot cx={cx} cy={cy} d={iw * 0.9} border={line} /> : null}
          {detail === 2
            ? [0, 45, 90, 135].map((a) => (
                <Box key={a} cx={cx} cy={cy} w={iw * 0.74} h={iw * 0.24} rotate={a} radius={iw * 0.12} color={fill} border={line} />
              ))
            : null}
          {detail === 1 ? <Dot cx={cx} cy={cy} d={iw * 0.6} border={line} /> : null}
          <Dot cx={cx} cy={cy} d={iw * (detail === 2 ? 0.22 : 0.3)} color={glyph} />
        </>
      );

    case 'star8': {
      // two squares make an eight-pointed star; small diamonds in the corners
      const corners: [number, number][] = [[0.16, 0.11], [0.84, 0.11], [0.16, 0.89], [0.84, 0.89]];
      return (
        <>
          {detail >= 1 ? (
            <>
              <Box cx={cx} cy={cy} w={iw * 0.6} border={line} />
              <Box cx={cx} cy={cy} w={iw * 0.6} rotate={45} border={line} />
              <Box cx={cx} cy={cy} w={iw * 0.3} rotate={45} color={fill} border={line} />
            </>
          ) : (
            <Box cx={cx} cy={cy} w={iw * 0.55} rotate={45} color={fill} border={line} />
          )}
          <Dot cx={cx} cy={cy} d={iw * 0.12} color={glyph} />
          {detail === 2 ? corners.map(([x, y], i) => <Box key={i} cx={x * iw} cy={y * ih} w={iw * 0.1} rotate={45} color={glyph} />) : null}
        </>
      );
    }
  }
}

/** The back of a card: a border (the "paper"), the coloured field, a fine inner line and the pattern. */
export function CardBackFace({ back, width }: { back: CardBackDesign; width: number }) {
  const { height, radius } = cardSize(width);
  const inset = Math.max(2, width * 0.07);
  const iw = width - 2 * inset;
  const ih = height - 2 * inset;
  // Opponents' fans and the deal pack are tiny and there are dozens of them: draw less on small cards.
  const detail = width >= 36 ? 2 : width >= 22 ? 1 : 0;
  const gap = Math.max(2, iw * 0.07);
  return (
    <View style={[{ width, height, borderRadius: radius, backgroundColor: back.rim, padding: inset }, CARD_SHADOW]}>
      <View style={{ flex: 1, borderRadius: radius * 0.7, backgroundColor: back.base, overflow: 'hidden' }}>
        {detail >= 1 ? <View style={{ position: 'absolute', left: gap, right: gap, top: gap, bottom: gap, borderRadius: radius * 0.45, borderWidth: 1, borderColor: back.line }} /> : null}
        <Art back={back} cw={width} iw={iw} ih={ih} detail={detail} />
      </View>
    </View>
  );
}
