import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { GOLD_LINE_SOFT, WOOD, WOOD_LINE } from '@/constants/palette';
import { BOARDS, withAlpha, type BoardDesign, type BoardId } from '@/constants/themes';
import { SUIT_SYMBOL } from '@/lib/cards';
import { useLook } from '@/state/look';

const fill = StyleSheet.absoluteFill;

/** A filled circle centred on (cx, cy). */
const Disc = ({ cx, cy, d, color }: { cx: number; cy: number; d: number; color: string }) => (
  <View style={{ position: 'absolute', left: cx - d / 2, top: cy - d / 2, width: d, height: d, borderRadius: d / 2, backgroundColor: color }} />
);

/** A rounded "racetrack" outline centred on (cx, cy): the line the trick is played inside. */
const Track = ({ cx, cy, w, h, color, line }: { cx: number; cy: number; w: number; h: number; color: string; line: number }) => (
  <View style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, borderRadius: Math.min(w, h) / 2, borderWidth: line, borderColor: color }} />
);

/** A big symbol, very faint, in the middle of the cloth. */
const Watermark = ({ cx, cy, size, color, children }: { cx: number; cy: number; size: number; color: string; children: string }) => (
  <View style={{ position: 'absolute', left: cx - size, top: cy - size, width: size * 2, height: size * 2, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color, fontSize: size, lineHeight: size * 1.2 }}>{children}</Text>
  </View>
);

/** Dark edges: they keep the seats, the status plate and the hand readable on any cloth. */
function Vignette() {
  const side = { position: 'absolute' as const, top: 0, bottom: 0, width: '9%' as const };
  return (
    <>
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '30%' }} />
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.4)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '42%' }} />
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.26)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[side, { left: 0 }]} />
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.26)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[side, { right: 0 }]} />
    </>
  );
}

/** A thin gold line a little inside the screen edge, like the rail of a card table. */
function Rim({ u }: { u: number }) {
  const inset = Math.max(2, 5 * u);
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: inset, right: inset, top: inset, bottom: inset, borderRadius: Math.max(6, 18 * u), borderWidth: Math.max(1, 1.5 * u), borderColor: GOLD_LINE_SOFT }}
    />
  );
}

// ---- walnut: the original wooden planks ----------------------------------------------------------------

/** Wooden planks, like the reference table, with a soft dark edge so the cards stand out. */
function Planks() {
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: WOOD[0] }}>
      {WOOD.map((c, i) => (
        <View key={i} style={{ flex: 1, backgroundColor: c, borderBottomWidth: 1.5, borderBottomColor: WOOD_LINE }}>
          <View style={{ position: 'absolute', left: `${(i * 23) % 60}%`, top: '38%', width: '22%', height: 1, backgroundColor: 'rgba(90,50,20,0.25)' }} />
          <View style={{ position: 'absolute', left: `${30 + ((i * 41) % 50)}%`, top: '66%', width: '14%', height: 1, backgroundColor: 'rgba(90,50,20,0.2)' }} />
        </View>
      ))}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '22%', backgroundColor: 'rgba(0,0,0,0.12)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', backgroundColor: 'rgba(0,0,0,0.16)' }} />
      <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8%', backgroundColor: 'rgba(0,0,0,0.08)' }} />
      <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '8%', backgroundColor: 'rgba(0,0,0,0.08)' }} />
    </View>
  );
}

// ---- cloths -------------------------------------------------------------------------------------------------

interface Geo {
  b: BoardDesign;
  w: number;
  h: number;
  /** Where the trick is played (the middle of the table, a little above the centre). */
  cx: number;
  cy: number;
  /** 1 on a full-size table, smaller on a thumbnail: line widths and insets follow it. */
  u: number;
}

/** Light in the middle, fading out: the lamp over the table. */
function Glow({ g }: { g: Geo }) {
  return (
    <>
      <Disc cx={g.cx} cy={g.cy} d={g.w * 0.95} color={`rgba(${g.b.glow},0.1)`} />
      <Disc cx={g.cx} cy={g.cy} d={g.w * 0.62} color={`rgba(${g.b.glow},0.12)`} />
      <Disc cx={g.cx} cy={g.cy} d={g.w * 0.34} color="rgba(255,214,138,0.06)" />
    </>
  );
}

/** Emerald Felt: green baize, a soft spade watermark and a gold line around the playing area. */
function Felt({ g }: { g: Geo }) {
  const line = Math.max(1, 2 * g.u);
  return (
    <>
      <LinearGradient pointerEvents="none" colors={g.b.cloth} style={fill} />
      <Glow g={g} />
      <Watermark cx={g.cx} cy={g.cy} size={g.h * 0.62} color="rgba(255,255,255,0.045)">{SUIT_SYMBOL.S}</Watermark>
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.56} h={g.h * 0.52} color={g.b.line} line={line} />
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.56 - 12 * g.u} h={g.h * 0.52 - 12 * g.u} color={withAlpha(g.b.accent, 0.12)} line={Math.max(1, g.u)} />
      <Rim u={g.u} />
      <Vignette />
    </>
  );
}

/** Royal Velvet: deep blue, a double gold line, a diamond in the middle and the four suits in the corners. */
function Velvet({ g }: { g: Geo }) {
  const line = Math.max(1, 2 * g.u);
  const faint = withAlpha(g.b.accent, 0.2);
  const spots: [number, number, string][] = [
    [-1, -1, SUIT_SYMBOL.S], [1, -1, SUIT_SYMBOL.H], [-1, 1, SUIT_SYMBOL.D], [1, 1, SUIT_SYMBOL.C],
  ];
  return (
    <>
      <LinearGradient pointerEvents="none" colors={g.b.cloth} style={fill} />
      <Glow g={g} />
      {[0.42, 0.3].map((s) => (
        <View
          key={s}
          style={{
            position: 'absolute', left: g.cx - g.h * s, top: g.cy - g.h * s, width: g.h * s * 2, height: g.h * s * 2,
            borderWidth: Math.max(1, g.u * (s > 0.35 ? 1.5 : 1)), borderColor: withAlpha(g.b.accent, s > 0.35 ? 0.16 : 0.12), transform: [{ rotate: '45deg' }],
          }}
        />
      ))}
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.58} h={g.h * 0.54} color={g.b.line} line={line} />
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.58 - 12 * g.u} h={g.h * 0.54 - 12 * g.u} color={withAlpha(g.b.accent, 0.16)} line={Math.max(1, g.u)} />
      {spots.map(([sx, sy, s]) => (
        <Watermark key={s} cx={g.cx + sx * g.w * 0.3} cy={g.cy + sy * g.h * 0.2} size={g.h * 0.09} color={faint}>{s}</Watermark>
      ))}
      <Rim u={g.u} />
      <Vignette />
    </>
  );
}

/** Crimson Lounge: burgundy with a fine gold diamond lattice and a gold line around the playing area. */
function Lounge({ g }: { g: Geo }) {
  const gap = Math.max(26, Math.min(g.w, g.h) * 0.18);
  const len = Math.hypot(g.w, g.h);
  const k = Math.ceil((g.w + g.h) / 2 / gap);
  const lines: React.ReactNode[] = [];
  for (let i = -k; i <= k; i++) {
    for (const dir of [45, -45]) {
      lines.push(
        <View
          key={`${dir}:${i}`}
          style={{ position: 'absolute', left: g.w / 2 - len / 2, top: g.h / 2 + i * gap, width: len, height: 1, backgroundColor: g.b.line, transform: [{ rotate: `${dir}deg` }] }}
        />,
      );
    }
  }
  return (
    <>
      <LinearGradient pointerEvents="none" colors={g.b.cloth} style={fill} />
      <Glow g={g} />
      {lines}
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.56} h={g.h * 0.52} color={withAlpha(g.b.accent, 0.4)} line={Math.max(1, 2 * g.u)} />
      <Rim u={g.u} />
      <Vignette />
    </>
  );
}

/** Fixed stars (fractions of the table), so they never move between renders. */
const STARS: [number, number, number, number][] = Array.from({ length: 34 }, (_, i) => {
  const f = (n: number) => n - Math.floor(n);
  return [f(Math.sin(i * 12.9898 + 1.3) * 43758.5453), f(Math.sin(i * 78.233 + 4.1) * 24634.6345), 1 + (i % 3) * 0.7, 0.35 + (i % 4) * 0.17];
});

/** Twilight: night violet, a pale moon with a halo and a scatter of stars. */
function Twilight({ g }: { g: Geo }) {
  const mx = g.w * 0.82;
  const my = g.h * 0.22;
  return (
    <>
      <LinearGradient pointerEvents="none" colors={g.b.cloth} style={fill} />
      <Disc cx={mx} cy={my} d={g.h * 1.0} color={`rgba(${g.b.glow},0.08)`} />
      <Disc cx={mx} cy={my} d={g.h * 0.6} color={`rgba(${g.b.glow},0.1)`} />
      <Glow g={g} />
      {STARS.map(([x, y, s, a], i) => (
        <Disc key={i} cx={x * g.w} cy={y * g.h * 0.85} d={Math.max(1.2, s * g.u * 1.6)} color={withAlpha('#FFFFFF', a)} />
      ))}
      <Disc cx={mx} cy={my} d={g.h * 0.2} color={withAlpha(g.b.accent, 0.22)} />
      <Disc cx={mx} cy={my} d={g.h * 0.13} color={g.b.accent} />
      <Track cx={g.cx} cy={g.cy} w={g.w * 0.56} h={g.h * 0.52} color="rgba(232,224,255,0.22)" line={Math.max(1, 1.5 * g.u)} />
      <Vignette />
    </>
  );
}

/** Green Sunrise: deep green with a red sun rising behind the trick, ringed in gold. */
function Sunrise({ g }: { g: Geo }) {
  return (
    <>
      <LinearGradient pointerEvents="none" colors={g.b.cloth} style={fill} />
      <Glow g={g} />
      {/* warm halo (orange, not red: red over green turns muddy brown) */}
      <Disc cx={g.cx} cy={g.cy} d={g.h * 0.96} color="rgba(255,176,96,0.06)" />
      <Disc cx={g.cx} cy={g.cy} d={g.h * 0.74} color="rgba(255,150,96,0.1)" />
      <Disc cx={g.cx} cy={g.cy} d={g.h * 0.5} color={withAlpha(g.b.accent, 0.94)} />
      <Disc cx={g.cx - g.h * 0.05} cy={g.cy - g.h * 0.06} d={g.h * 0.3} color="rgba(255,255,255,0.07)" />
      <Track cx={g.cx} cy={g.cy} w={g.h * 0.6} h={g.h * 0.6} color={g.b.line} line={Math.max(1, 1.5 * g.u)} />
      <Rim u={g.u} />
      <Vignette />
    </>
  );
}

/**
 * The table behind everything: seats, trick and hand sit on it. It wears the board the player picked (see
 * state/look.ts); `id` draws a given board instead (the picker screen uses that, also for its small thumbnails).
 * It measures itself, so it fits a full table and a thumbnail alike.
 */
export function Board({ id }: { id?: BoardId }) {
  const picked = useLook((s) => s.board);
  const b = BOARDS[id ?? picked];
  const [size, setSize] = useState({ w: 800, h: 360 });
  const g: Geo = { b, w: size.w, h: size.h, cx: size.w / 2, cy: size.h * 0.44, u: Math.min(size.w, size.h) / 360 };

  return (
    <View
      pointerEvents="none"
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setSize({ w: width, h: height });
      }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden', backgroundColor: b.edge }}>
      {b.id === 'walnut' ? <Planks /> : null}
      {b.id === 'felt' ? <Felt g={g} /> : null}
      {b.id === 'velvet' ? <Velvet g={g} /> : null}
      {b.id === 'lounge' ? <Lounge g={g} /> : null}
      {b.id === 'twilight' ? <Twilight g={g} /> : null}
      {b.id === 'sunrise' ? <Sunrise g={g} /> : null}
    </View>
  );
}
