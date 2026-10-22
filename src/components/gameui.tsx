import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { PlayingCard, CARD_RATIO } from '@/components/table/PlayingCard';
import { CREAM, DANGER, GOLD, LINE } from '@/constants/palette';
import { txt } from '@/constants/fonts';
import { hapticTap } from '@/lib/haptics';
import type { Card } from '@/lib/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TONES = {
  gold: { face: '#F2C14E', edge: '#A9791A', rim: '#FFE7A3', text: '#2A1B00', icon: '#2A1B00', badge: 'rgba(42,27,0,0.14)' },
  green: { face: '#1B8F5E', edge: '#0A4A30', rim: '#4CCB95', text: '#FFFFFF', icon: '#FFFFFF', badge: 'rgba(0,0,0,0.2)' },
  dark: { face: '#17563C', edge: '#082A1D', rim: 'rgba(255,255,255,0.14)', text: CREAM, icon: GOLD, badge: 'rgba(0,0,0,0.22)' },
} as const;

/**
 * A chunky "game" button: coloured face, thick bottom edge, glossy highlight, sinks when pressed.
 * Give it a size through `style` (flex or height); the face fills it.
 */
export function GameButton({
  title, hint, icon, tone = 'green', onPress, disabled, style, big = false,
}: {
  title: string; hint?: string; icon?: IconName; tone?: keyof typeof TONES; onPress: () => void;
  disabled?: boolean; style?: StyleProp<ViewStyle>; big?: boolean;
}) {
  const c = TONES[tone];
  const radius = big ? 20 : 15;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => {
        hapticTap();
        onPress();
      }}
      style={[{ minWidth: 0, opacity: disabled ? 0.5 : 1 }, style]}>
      {({ pressed }) => (
        <View style={{ flex: 1, borderRadius: radius, backgroundColor: c.edge, paddingBottom: big ? 6 : 4 }}>
          <View
            style={{
              flex: 1, borderRadius: radius, backgroundColor: c.face, borderWidth: 1.5, borderColor: c.rim, overflow: 'hidden',
              justifyContent: 'center', paddingHorizontal: big ? 16 : 10, transform: [{ translateY: pressed ? (big ? 4 : 3) : 0 }],
            }}>
            {/* gloss */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 6, right: 6, top: 3, height: '38%', borderRadius: radius, backgroundColor: 'rgba(255,255,255,0.18)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: big ? 12 : 8 }}>
              {icon ? (
                <View
                  style={{
                    width: big ? 46 : 32, height: big ? 46 : 32, borderRadius: big ? 23 : 16, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: c.badge,
                  }}>
                  <Ionicons name={icon} size={big ? 28 : 19} color={c.icon} />
                </View>
              ) : null}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={big ? 1 : 2} style={[txt(big ? 24 : 15), { color: c.text }]}>{title}</Text>
                {hint ? <Text numberOfLines={2} style={[txt(12, false), { color: c.text, opacity: 0.8 }]}>{hint}</Text> : null}
              </View>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
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
        hapticTap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1.5, borderColor: highlight ? GOLD : 'rgba(242,193,78,0.35)',
        transform: [{ scale: pressed ? 0.93 : 1 }],
      })}>
      <Ionicons name={icon} size={21} color={CREAM} />
      {badge > 0 ? (
        <View
          style={{
            position: 'absolute', top: -4, right: -4, minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
            backgroundColor: DANGER, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#06241A',
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
            backgroundColor: i < filled ? GOLD : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: i < filled ? '#FFE7A3' : LINE,
          }}
        />
      ))}
    </View>
  );
}

/** Round spade badge + the game name in gold with a hard drop shadow, and a row of suits underneath. */
export function LogoMark({ title, compact = false }: { title: string; compact?: boolean }) {
  const emblem = compact ? 40 : 54;
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View
          style={{
            width: emblem, height: emblem, borderRadius: emblem / 2, alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#0A2C1F', borderWidth: 3, borderColor: GOLD,
          }}>
          <Text style={{ color: CREAM, fontSize: emblem * 0.58, lineHeight: emblem * 0.72 }}>♠</Text>
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[
            txt(compact ? 28 : 36),
            { color: GOLD, textShadowColor: '#6B4A00', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 0, flexShrink: 1 },
          ]}>
          {title}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Text style={{ color: CREAM, fontSize: 14 }}>♠</Text>
        <Text style={{ color: '#E5484D', fontSize: 14 }}>♥</Text>
        <Text style={{ color: CREAM, fontSize: 14 }}>♣</Text>
        <Text style={{ color: '#E5484D', fontSize: 14 }}>♦</Text>
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

/** Five cards fanned out like a hand, floating gently. Size it with the card `width`. */
export function CardFan({ width = 52 }: { width?: number }) {
  const h = Math.round(width * CARD_RATIO);
  const R = h * 0.9;
  const W = Math.round(width * 2.9);
  const H = Math.round(h * 1.32);
  const pivotY = R + h / 2 + 4;

  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withSequence(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })),
      -1,
    );
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * float.value }, { rotate: `${(float.value - 0.5) * 2}deg` }],
  }));

  return (
    <Animated.View style={[{ width: W, height: H }, floatStyle]} pointerEvents="none">
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
