import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { Breathe, Shine } from '@/components/fx';
import { PlayingCard, CARD_RATIO } from '@/components/table/PlayingCard';
import { Gloss } from '@/components/frame';
import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, DANGER, GOLD, GOLD_DEEP, GOLD_LINE, GOLD_RIM, LINE } from '@/constants/palette';
import { shadow, TONES } from '@/constants/ui';
import { uiTap } from '@/lib/feedback';
import type { Card } from '@/lib/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * A chunky "game" button: a face that fades from light to the tone colour, thick bottom edge, glossy
 * highlight, sinks when pressed. Give it a size through `style` (flex or height); the face fills it.
 * `shine` sends a band of light across it now and then and `pulse` makes it breathe: for the one button
 * you most want tapped on a screen.
 */
export function GameButton({
  title, hint, icon, tone = 'green', onPress, disabled, style, big = false, shine = false, pulse = false,
}: {
  title: string; hint?: string; icon?: IconName; tone?: keyof typeof TONES; onPress: () => void;
  disabled?: boolean; style?: StyleProp<ViewStyle>; big?: boolean; shine?: boolean; pulse?: boolean;
}) {
  const c = TONES[tone];
  const radius = big ? 20 : 15;
  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => {
        uiTap();
        onPress();
      }}
      style={[{ minWidth: 0, opacity: disabled ? 0.5 : 1 }, pulse ? { flex: 1 } : style]}>
      {({ pressed }) => (
        <View style={{ flex: 1, borderRadius: radius, backgroundColor: c.edge, paddingBottom: big ? 6 : 4, ...shadow(2) }}>
          <View
            style={{
              flex: 1, borderRadius: radius, backgroundColor: c.face, borderWidth: 1.5, borderColor: c.rim, overflow: 'hidden',
              justifyContent: 'center', paddingHorizontal: big ? 16 : 8, transform: [{ translateY: pressed ? (big ? 4 : 3) : 0 }],
            }}>
            <LinearGradient pointerEvents="none" colors={[c.top, c.face]} style={StyleSheet.absoluteFill} />
            <Gloss radius={radius} />
            {shine ? <Shine radius={radius} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: big ? 12 : 6 }}>
              {icon ? (
                <View
                  style={{
                    width: big ? 46 : 28, height: big ? 46 : 28, borderRadius: big ? 23 : 14, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: c.badge,
                  }}>
                  <Ionicons name={icon} size={big ? 28 : 17} color={c.icon} />
                </View>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={big ? 1 : 2} adjustsFontSizeToFit minimumFontScale={0.75} style={[txt(big ? 24 : 14), { color: c.text }]}>{title}</Text>
                {hint ? <Text numberOfLines={2} style={[txt(12, false), { color: c.text, opacity: 0.8 }]}>{hint}</Text> : null}
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
  // The wrapper carries the size, so the breathing scales the whole button.
  return pulse ? <Breathe style={style}>{button}</Breathe> : button;
}

/** Round header button (friends, settings...) with an optional red count badge. */
export function RoundIconButton({
  icon, onPress, label, badge = 0, highlight = false,
}: { icon: IconName; onPress: () => void; label: string; badge?: number; highlight?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        uiTap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'visible',
        backgroundColor: 'rgba(8,30,21,0.78)', borderWidth: 2, borderColor: highlight ? GOLD : GOLD_LINE,
        transform: [{ scale: pressed ? 0.92 : 1 }], ...shadow(1),
      })}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 8, right: 8, top: 2, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.1)' }} />
      <Ionicons name={icon} size={22} color={highlight ? GOLD : CREAM} />
      {badge > 0 ? (
        <View
          style={{
            position: 'absolute', top: -5, right: -5, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
            backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BG_DEEP,
          }}>
          <Text style={[txt(11), { color: '#fff', lineHeight: 14 }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Four small seats: filled gold for each player already in. */
export function SeatDots({ filled, total = 4 }: { filled: number; total?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: 11, height: 11, borderRadius: 6,
            backgroundColor: i < filled ? GOLD : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: i < filled ? GOLD_RIM : LINE,
          }}
        />
      ))}
    </View>
  );
}

/**
 * The game name as a chunky gold sign: a dark outline all round, a hard shadow underneath and a lighter
 * top half, so it looks pressed out of metal instead of printed.
 */
function SignTitle({ children, size }: { children: string; size: number }) {
  const base = [txt(size), { color: GOLD }] as const;
  const o = Math.max(1.5, size * 0.05);
  const outline: [number, number][] = [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, -o], [-o, o], [o, o]];
  const layer = (dx: number, dy: number, color: string, key: string) => (
    <Text key={key} numberOfLines={1} style={[...base, { position: 'absolute', left: dx, top: dy, color }]}>{children}</Text>
  );
  return (
    <View>
      {/* invisible copy: it gives the sign its size */}
      <Text numberOfLines={1} style={[...base, { opacity: 0 }]}>{children}</Text>
      {layer(0, size * 0.12, '#2B1B00', 'shadow-far')}
      {layer(0, size * 0.07, '#4A3000', 'shadow-near')}
      {outline.map(([dx, dy], i) => layer(dx, dy, '#6B4A00', `o${i}`))}
      {layer(0, 0, GOLD, 'face')}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: size * 0.58, overflow: 'hidden' }}>
        <Text numberOfLines={1} style={[...base, { position: 'absolute', left: 0, top: 0, color: '#FFF0B8' }]}>{children}</Text>
      </View>
    </View>
  );
}

/** Gold medallion with a spade, the game's name as a sign under it, and a row of suits. */
export function LogoMark({ title, compact = false }: { title: string; compact?: boolean }) {
  const emblem = compact ? 46 : 62;
  return (
    <View style={{ alignItems: 'center', gap: compact ? 0 : 2 }}>
      <View style={{ width: emblem, height: emblem, alignItems: 'center', justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ position: 'absolute', width: emblem * 2.1, height: emblem * 2.1, borderRadius: emblem * 1.05, backgroundColor: 'rgba(242,193,78,0.1)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', width: emblem * 1.5, height: emblem * 1.5, borderRadius: emblem * 0.75, backgroundColor: 'rgba(242,193,78,0.12)' }} />
        <View style={{ width: emblem, height: emblem, borderRadius: emblem / 2, overflow: 'hidden', ...shadow(2) }}>
          <LinearGradient colors={[GOLD_RIM, GOLD, GOLD_DEEP]} style={{ flex: 1, padding: 3.5 }}>
            <View style={{ flex: 1, borderRadius: emblem / 2, backgroundColor: '#0A2C1F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.45)' }}>
              <Text style={{ color: CREAM, fontSize: emblem * 0.5, lineHeight: emblem * 0.62 }}>♠</Text>
            </View>
          </LinearGradient>
          <Shine radius={emblem / 2} period={5200} delay={1600} />
        </View>
      </View>
      <SignTitle size={compact ? 32 : 44}>{title}</SignTitle>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: compact ? 0 : 2 }}>
        <Text style={{ color: CREAM, fontSize: 14 }}>♠</Text>
        <Text style={{ color: DANGER, fontSize: 14 }}>♥</Text>
        <Text style={{ color: CREAM, fontSize: 14 }}>♣</Text>
        <Text style={{ color: DANGER, fontSize: 14 }}>♦</Text>
      </View>
    </View>
  );
}

const FAN: Card[] = [
  { suit: 'S', rank: 10 },
  { suit: 'C', rank: 11 },
  { suit: 'D', rank: 12 },
  { suit: 'H', rank: 13 },
  { suit: 'S', rank: 14 },
];
const STEP_DEG = 14;

/** Five cards fanned out like a hand, floating gently over a soft light and a shadow. Size it with the card `width`. */
export function CardFan({ width = 52 }: { width?: number }) {
  const h = Math.round(width * CARD_RATIO);
  const R = h * 0.9;
  const W = Math.round(width * 2.9);
  const H = Math.round(h * 1.32);
  const pivotY = R + h / 2 + 4;

  const float = useSharedValue(0);
  useEffect(() => {
    float.set(
      withRepeat(
        withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })),
        -1,
      ),
    );
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * float.get() }, { rotate: `${(float.get() - 0.5) * 2}deg` }],
  }));
  // The shadow on the table shrinks a little while the hand floats up.
  const shadowStyle = useAnimatedStyle(() => ({ opacity: 0.38 - 0.14 * float.get(), transform: [{ scaleX: 1 - 0.1 * float.get() }] }));

  return (
    <View style={{ width: W, height: H + 12, alignItems: 'center' }} pointerEvents="none">
      <View style={{ position: 'absolute', top: H * 0.1, width: W * 0.95, height: W * 0.95, borderRadius: W * 0.475, backgroundColor: 'rgba(242,193,78,0.08)' }} />
      <Animated.View style={[{ position: 'absolute', bottom: 0, width: W * 0.62, height: 12, borderRadius: 6, backgroundColor: '#000' }, shadowStyle]} />
      <Animated.View style={[{ width: W, height: H }, floatStyle]}>
        {FAN.map((card, i) => {
          const deg = (i - (FAN.length - 1) / 2) * STEP_DEG;
          const rad = (deg * Math.PI) / 180;
          const cx = W / 2 + R * Math.sin(rad);
          const cy = pivotY - R * Math.cos(rad);
          return (
            <View key={i} style={{ position: 'absolute', left: cx - width / 2, top: cy - h / 2, transform: [{ rotate: `${deg}deg` }] }}>
              <PlayingCard card={card} width={width} glow={i === FAN.length - 1} />
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
}

/** Two face-down cards leaning on each other: the "nothing here yet" picture. */
export function EmptyCards({ width = 30 }: { width?: number }) {
  return (
    <View style={{ width: width * 2.1, height: Math.round(width * CARD_RATIO) + 6, opacity: 0.55 }} pointerEvents="none">
      <View style={{ position: 'absolute', left: 0, top: 4, transform: [{ rotate: '-12deg' }] }}>
        <PlayingCard faceDown width={width} />
      </View>
      <View style={{ position: 'absolute', right: 0, top: 2, transform: [{ rotate: '10deg' }] }}>
        <PlayingCard faceDown width={width} />
      </View>
    </View>
  );
}
