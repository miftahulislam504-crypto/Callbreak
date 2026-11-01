// Small animated touches that make the menus feel alive: a light that sweeps over a button, a gentle
// breathing, drifting suits behind the menus, and confetti for a win.
import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/text';
import { GOLD } from '@/constants/palette';

/**
 * A soft band of light that sweeps across its parent now and then. The parent decides the shape:
 * give it `overflow: 'hidden'` and the same corner radius (pass it as `radius`).
 */
export function Shine({ period = 4200, delay = 900, radius = 0 }: { period?: number; delay?: number; radius?: number }) {
  const [w, setW] = useState(0);
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
            withTiming(1, { duration: Math.max(0, period - 900) }),
            withTiming(0, { duration: 0 }),
          ),
          -1,
        ),
      ),
    );
    return () => cancelAnimation(p);
  }, [p, delay, period]);
  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -70 + p.get() * (w + 140) }, { skewX: '-20deg' }] }));
  return (
    <View
      pointerEvents="none"
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: radius }]}>
      <Animated.View style={[{ position: 'absolute', top: -12, bottom: -12, left: 0, width: 46, alignItems: 'center' }, band]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        <View style={{ width: 14, height: '100%', backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </Animated.View>
    </View>
  );
}

/** Slowly grows and shrinks its child, to say "tap me". */
export function Breathe({ children, scale = 1.025, duration = 1400, style }: {
  children: ReactNode; scale?: number; duration?: number; style?: StyleProp<ViewStyle>;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withSequence(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration, easing: Easing.inOut(Easing.quad) })), -1));
    return () => cancelAnimation(p);
  }, [p, duration]);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (scale - 1) * p.get() }] }));
  return <Animated.View style={[style, a]}>{children}</Animated.View>;
}

function Floater({ glyph, left, top, size, duration, color }: {
  glyph: string; left: `${number}%`; top: `${number}%`; size: number; duration: number; color: string;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(p);
  }, [p, duration]);
  const a = useAnimatedStyle(() => ({ transform: [{ translateY: (p.get() - 0.5) * 22 }, { rotate: `${(p.get() - 0.5) * 12}deg` }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left, top }, a]}>
      <Text style={{ fontSize: size, lineHeight: size * 1.2, color }}>{glyph}</Text>
    </Animated.View>
  );
}

const WHITE = 'rgba(255,255,255,0.055)';
const RED = 'rgba(229,72,77,0.07)';
const FLOATERS = [
  { glyph: '♠', left: '3%', top: '10%', size: 120, duration: 7600, color: WHITE },
  { glyph: '♥', left: '84%', top: '6%', size: 96, duration: 6400, color: RED },
  { glyph: '♦', left: '40%', top: '72%', size: 110, duration: 8200, color: RED },
  { glyph: '♣', left: '88%', top: '66%', size: 100, duration: 7000, color: WHITE },
  { glyph: '♥', left: '10%', top: '70%', size: 64, duration: 5600, color: RED },
  { glyph: '♠', left: '62%', top: '8%', size: 58, duration: 6000, color: WHITE },
] as const;

/** Big faint suits drifting behind the menus. */
export function DriftingSuits() {
  return (
    <>
      {FLOATERS.map((f, i) => (
        <Floater key={i} {...f} />
      ))}
    </>
  );
}

const CONFETTI = [GOLD, '#FF6B6B', '#4CCB95', '#7AA7FF', '#FFFDF7', '#FFB454'];

function Piece({ i, w, h }: { i: number; w: number; h: number }) {
  // Deterministic "random" numbers: the same shower every time, no Math.random in render.
  const r = (k: number) => {
    const x = Math.sin((i + 1) * 91.7 + k * 17.3) * 10000;
    return x - Math.floor(x);
  };
  const left = r(1) * w;
  const size = 6 + r(2) * 7;
  const duration = 2300 + r(3) * 1700;
  const delay = r(4) * 1000;
  const sway = (r(5) - 0.5) * 90;
  const spin = 360 + r(6) * 540;
  const p = useSharedValue(0);
  useEffect(() => {
    p.set(withDelay(delay, withRepeat(withTiming(1, { duration, easing: Easing.linear }), 2)));
    return () => cancelAnimation(p);
  }, [p, delay, duration]);
  const a = useAnimatedStyle(() => {
    const v = p.get();
    return {
      opacity: v < 0.04 ? v * 25 : v > 0.9 ? (1 - v) * 10 : 1,
      transform: [
        { translateX: left + Math.sin(v * Math.PI * 3 + i) * sway },
        { translateY: -24 + v * (h + 48) },
        { rotate: `${v * spin}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: 0, width: size, height: size * 1.6, borderRadius: 2, backgroundColor: CONFETTI[i % CONFETTI.length], opacity: 0 }, a]}
    />
  );
}

/** A shower of confetti over the whole screen. Does not catch touches. */
export function Confetti({ count = 28 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', zIndex: 50 }]}>
      {Array.from({ length: count }, (_, i) => (
        <Piece key={i} i={i} w={width} h={height} />
      ))}
    </View>
  );
}
