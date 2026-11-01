import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Switch,
  View, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DriftingSuits } from '@/components/fx';
import { Gloss } from '@/components/frame';
import { Text, TextInput } from '@/components/text';
import { ThemedText } from '@/components/themed-text';
import { txt } from '@/constants/fonts';
import {
  BG_DEEP, CREAM, DANGER, FELT, FELT_LIGHT, GOLD, GOLD_EDGE, GOLD_LINE, GOLD_LINE_SOFT, GOLD_RIM, LAMP_RGB, MUTED,
  ON_GOLD, PANEL, ROSE, WOOD_RIM, WOOD_RIM_DARK,
} from '@/constants/palette';
import { Spacing } from '@/constants/theme';
import { R, shadow, TITLE_SHADOW, TONES, type Tone } from '@/constants/ui';
import { uiTap } from '@/lib/feedback';

import { botAvatar } from '@/lib/botAvatars';
import { avatarColor, avatarWidth } from '@/lib/profile';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * The card-room backdrop behind every menu screen: felt lit by a warm lamp from above, big faint suits
 * drifting slowly, soft shadow at the edges and a thin gold "table rail" with a diamond in each corner.
 */
export function MenuBackdrop() {
  const disc = (d: number, color: string, a: number) => ({
    position: 'absolute' as const, left: '50%' as const, top: '46%' as const, width: d, height: d, borderRadius: d / 2,
    marginLeft: -d / 2, marginTop: -d / 2, backgroundColor: `rgba(${color},${a})`,
  });
  const corner = { position: 'absolute' as const, color: GOLD, opacity: 0.55, fontSize: 11 };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={disc(1200, LAMP_RGB, 0.03)} />
      <View style={disc(900, '31,160,106', 0.05)} />
      <View style={disc(640, '31,160,106', 0.06)} />
      <View style={disc(400, '31,160,106', 0.07)} />
      <View style={disc(210, LAMP_RGB, 0.05)} />
      <DriftingSuits />
      <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 120 }} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.62)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 }} />
      <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80 }} />
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80 }} />
      <View style={{ position: 'absolute', left: 6, right: 6, top: 6, bottom: 6, borderRadius: R.xl, borderWidth: 1.5, borderColor: GOLD_LINE_SOFT }} />
      <Text style={[corner, { left: 1, top: -3 }]}>◆</Text>
      <Text style={[corner, { right: 1, top: -3 }]}>◆</Text>
      <Text style={[corner, { left: 1, bottom: -3 }]}>◆</Text>
      <Text style={[corner, { right: 1, bottom: -3 }]}>◆</Text>
    </View>
  );
}

/** A landscape screen: safe area, backdrop, optional scrolling. */
export function Screen({
  children, scroll = true, onRefresh, refreshing = false, padded = true,
}: {
  children: ReactNode; scroll?: boolean; onRefresh?: () => void; refreshing?: boolean; padded?: boolean;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} /> : undefined}
          contentContainerStyle={{ padding: padded ? Spacing.three : 0, gap: Spacing.three }}>
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: padded ? Spacing.three : 0, gap: Spacing.three }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

/** A dark plate with a fine gold edge, a soft light from the top and a bright catch on the top line. */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
        style={[StyleSheet.absoluteFill, { borderRadius: R.lg }]}
      />
      <View pointerEvents="none" style={{ position: 'absolute', left: 18, right: 18, top: 0, height: 1.5, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.18)' }} />
      {children}
    </View>
  );
}

/** Small heading of a card: optional mark, the title, and a gold line that fades out under it. */
export function CardTitle({ icon, title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Text style={{ color: GOLD, fontSize: 18 }}>{icon}</Text> : null}
        <Text style={[txt(18), { color: CREAM }, TITLE_SHADOW]}>{title}</Text>
      </View>
      <LinearGradient colors={[GOLD, 'rgba(242,193,78,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 64, height: 3, borderRadius: 2, marginTop: 1 }} />
      {hint ? <Text style={[txt(12.5, false), { color: MUTED }]}>{hint}</Text> : null}
    </View>
  );
}

/**
 * The felt of the table in a wooden rim, like the real board. Lists of rooms and the lobby table sit on it.
 * Give it a size with `style` (flex, width); put padding and gaps for the content in `innerStyle`.
 */
export function TablePanel({ children, style, innerStyle }: { children: ReactNode; style?: StyleProp<ViewStyle>; innerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ borderRadius: 26, padding: 6, backgroundColor: WOOD_RIM, borderWidth: 2, borderColor: WOOD_RIM_DARK, ...shadow(3) }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, top: 0, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,231,163,0.5)' }} />
      <View style={[{ flex: 1, borderRadius: 20, overflow: 'hidden', backgroundColor: FELT, borderWidth: 2, borderColor: 'rgba(0,0,0,0.38)' }, innerStyle]}>
        <LinearGradient pointerEvents="none" colors={[FELT_LIGHT, FELT]} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 28 }} />
        {children}
      </View>
    </View>
  );
}

/**
 * The standard button: the same chunky "game" button as on the home page (a face fading from light to the
 * tone colour, a thick edge, rim, gloss; it sinks when pressed, taps buzz and click). Give it a size with
 * `style` (flex / width); the height follows `compact`.
 */
export function Button({
  title, onPress, variant = 'primary', disabled, loading, style, compact, icon,
}: {
  title: string; onPress: () => void; variant?: 'primary' | 'gold' | 'secondary' | 'danger';
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; compact?: boolean; icon?: IconName;
}) {
  const off = disabled || loading;
  const tone: Tone = variant === 'primary' ? 'green' : variant === 'gold' ? 'gold' : variant === 'danger' ? 'danger' : 'dark';
  const c = TONES[tone];
  const radius = compact ? R.sm : R.md;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={off}
      onPress={() => {
        uiTap();
        onPress();
      }}
      style={[{ opacity: off ? 0.5 : 1 }, style]}>
      {({ pressed }) => (
        <View style={{ borderRadius: radius, backgroundColor: c.edge, paddingBottom: compact ? 3 : 4, ...shadow(1) }}>
          <View
            style={{
              minHeight: compact ? 38 : 48, borderRadius: radius, backgroundColor: c.face, borderWidth: 1.5, borderColor: c.rim,
              overflow: 'hidden', alignItems: 'center', justifyContent: 'center', paddingHorizontal: compact ? 12 : Spacing.three,
              transform: [{ translateY: pressed ? (compact ? 2 : 3) : 0 }],
            }}>
            <LinearGradient pointerEvents="none" colors={[c.top, c.face]} style={StyleSheet.absoluteFill} />
            <Gloss radius={radius} />
            {loading ? (
              <ActivityIndicator color={c.text} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {icon ? <Ionicons name={icon} size={compact ? 16 : 20} color={c.icon} /> : null}
                <Text style={[txt(compact ? 14 : 17), { color: c.text, textAlign: 'center' }]}>{title}</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

/** A choice pill (target score, language...). The picked one turns into a gold game button. */
export function Chip({
  label, selected, onPress, disabled,
}: { label: string; selected?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        uiTap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.chip,
        selected
          ? { backgroundColor: GOLD, borderColor: GOLD_RIM, borderBottomColor: GOLD_EDGE, borderBottomWidth: pressed ? 1.5 : 3.5, shadowColor: GOLD, shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 }
          : { backgroundColor: 'rgba(0,0,0,0.28)', opacity: pressed ? 0.75 : 1 },
        { opacity: disabled ? 0.4 : 1 },
      ]}>
      <Text style={[txt(14.5), { color: selected ? ON_GOLD : CREAM }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor="rgba(157,196,177,0.55)"
        selectionColor={GOLD}
        {...props}
        onFocus={(e) => {
          setFocus(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocus(false);
          props.onBlur?.(e);
        }}
        style={[styles.input, focus && { borderColor: GOLD, backgroundColor: 'rgba(0,0,0,0.45)' }, props.style]}
      />
    </View>
  );
}

export function Banner({ text, onClose, tone = 'error' }: { text: string; onClose?: () => void; tone?: 'error' | 'info' }) {
  return (
    <Pressable onPress={onClose} style={[styles.banner, tone === 'info' && { backgroundColor: '#2F5FD0', borderColor: '#9DB8FF' }]}>
      <ThemedText type="small" style={{ color: '#fff' }}>{text}</ThemedText>
    </Pressable>
  );
}

/**
 * Mini rectangular avatar (portrait, rounded corners). Shows the player's photo when there is one,
 * otherwise their coloured initial. `size` is the height; the width follows AVATAR_RATIO.
 */
export function Avatar({ name, size = 40, uri, bot = false }: { name: string; size?: number; uri?: string | null; bot?: boolean }) {
  const initial = (Array.from(name.trim())[0] ?? '?').toUpperCase();
  const animal = bot ? botAvatar(name) : null;
  const w = avatarWidth(size);
  const border = Math.max(1.5, size * 0.05);
  return (
    <View
      style={{
        width: w, height: size, borderRadius: Math.round(size * 0.18), backgroundColor: animal ? animal.bg : avatarColor(name),
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        borderWidth: border, borderColor: 'rgba(255,255,255,0.55)',
      }}>
      {uri ? (
        <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={120} />
      ) : animal ? (
        <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{animal.emoji}</Text>
      ) : (
        <Text style={{ color: '#fff', fontSize: size * 0.44, fontWeight: '800' }}>{initial}</Text>
      )}
    </View>
  );
}

/** An avatar in a gold frame, like a player's badge: the way the player is shown on the home page and profile. */
export function GoldAvatar({ name, uri, size = 42 }: { name: string; uri?: string | null; size?: number }) {
  return (
    <View style={{ padding: 2.5, borderRadius: Math.round(size * 0.18) + 5, backgroundColor: GOLD, ...shadow(1) }}>
      <View style={{ padding: 1.5, borderRadius: Math.round(size * 0.18) + 3, backgroundColor: '#0A2C1F' }}>
        <Avatar name={name} uri={uri} size={size} />
      </View>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}>{children}</View>;
}

/** A settings line: round icon, a name with a hint under it, and a switch on the right. */
export function ToggleRow({
  icon, label, hint, value, onChange,
}: { icon: IconName; label: string; hint?: string; value: boolean; onChange: (on: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View
        style={{
          width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
          backgroundColor: value ? 'rgba(242,193,78,0.16)' : 'rgba(0,0,0,0.28)', borderWidth: 1.5, borderColor: value ? GOLD : GOLD_LINE_SOFT,
        }}>
        <Ionicons name={icon} size={20} color={value ? GOLD : MUTED} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={[txt(15), { color: CREAM }]}>{label}</Text>
        {hint ? <Text numberOfLines={2} style={[txt(12, false), { color: MUTED }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          uiTap();
          onChange(v);
        }}
        trackColor={{ false: 'rgba(255,255,255,0.18)', true: GOLD }}
        thumbColor="#fff"
      />
    </View>
  );
}

/** Small pill button for headers (back, leave, close...). */
export function PillButton({ label, onPress, tone = 'plain' }: { label: string; onPress: () => void; tone?: 'plain' | 'danger' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        uiTap();
        onPress();
      }}
      hitSlop={6}
      style={({ pressed }) => ({
        paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: tone === 'danger' ? 'rgba(229,72,77,0.24)' : 'rgba(0,0,0,0.34)',
        borderWidth: 1.5, borderColor: tone === 'danger' ? 'rgba(229,72,77,0.6)' : GOLD_LINE,
        transform: [{ scale: pressed ? 0.95 : 1 }],
      })}>
      <Text style={[txt(14), { color: tone === 'danger' ? ROSE : CREAM }]}>{label}</Text>
    </Pressable>
  );
}

/** A thin gold rule that fades out at both ends, with a diamond in the middle. */
export function OrnamentRule() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <LinearGradient colors={['rgba(242,193,78,0)', GOLD_LINE]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1.5 }} />
      <Text style={{ color: GOLD, fontSize: 9, lineHeight: 12 }}>◆</Text>
      <LinearGradient colors={[GOLD_LINE, 'rgba(242,193,78,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, height: 1.5 }} />
    </View>
  );
}

/** Top bar of every menu page: back button, big title with a hint under it, and an optional right side. */
export function PageHeader({
  title, hint, backLabel, onBack, right,
}: { title: string; hint?: string; backLabel: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 6, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <PillButton label={`‹ ${backLabel}`} onPress={onBack} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[txt(26), { color: CREAM }, TITLE_SHADOW]}>{title}</Text>
          {hint ? <Text numberOfLines={1} style={[txt(12.5, false), { color: MUTED }]}>{hint}</Text> : null}
        </View>
        {right}
      </View>
      <OrnamentRule />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: R.lg, padding: 14, gap: 12, backgroundColor: PANEL, borderWidth: 1.5, borderColor: GOLD_LINE_SOFT,
    ...shadow(2),
  },
  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, minWidth: 54, alignItems: 'center' },
  input: {
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.32)', color: CREAM,
    borderRadius: R.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16,
  },
  banner: { backgroundColor: DANGER, borderRadius: R.sm, padding: 10, borderWidth: 1.5, borderColor: ROSE },
});
