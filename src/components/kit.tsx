import { type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput,
  View, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ACCENT, ACCENT_DARK, BG_DEEP, CREAM, DANGER, GOLD, GOLD_DEEP, LINE, MUTED, PANEL, PANEL_HI } from '@/constants/palette';
import { txt } from '@/constants/fonts';
import { Spacing } from '@/constants/theme';
import { Image } from 'expo-image';

import { botAvatar } from '@/lib/botAvatars';
import { avatarColor, avatarWidth } from '@/lib/profile';

/**
 * The card-room backdrop behind every menu screen: felt with a soft spotlight in the middle, a thin gold
 * "table rail" line near the edges and a few faint suit marks. Pure Views, no images.
 */
export function MenuBackdrop() {
  const disc = (d: number, a: number) => ({
    position: 'absolute' as const, left: '50%' as const, top: '50%' as const, width: d, height: d, borderRadius: d / 2,
    marginLeft: -d / 2, marginTop: -d / 2, backgroundColor: `rgba(31,160,106,${a})`,
  });
  const s = { position: 'absolute' as const, color: 'rgba(255,255,255,0.04)', fontWeight: '800' as const };
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={disc(980, 0.05)} />
      <View style={disc(720, 0.05)} />
      <View style={disc(480, 0.06)} />
      <View style={disc(260, 0.06)} />
      <Text style={[s, { fontSize: 190, left: -30, top: -50 }]}>♠</Text>
      <Text style={[s, { fontSize: 150, right: 30, top: -20, color: 'rgba(229,72,77,0.06)' }]}>♥</Text>
      <Text style={[s, { fontSize: 170, left: '38%', bottom: -70, color: 'rgba(229,72,77,0.05)' }]}>♦</Text>
      <Text style={[s, { fontSize: 140, right: -20, bottom: -30 }]}>♣</Text>
      <View style={{ position: 'absolute', left: 6, right: 6, top: 6, bottom: 6, borderRadius: 24, borderWidth: 1.5, borderColor: 'rgba(242,193,78,0.16)' }} />
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

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small gold heading with a suit mark, used on the home cards. */
export function CardTitle({ icon, title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon ? <Text style={{ color: GOLD, fontSize: 18 }}>{icon}</Text> : null}
        <Text style={[txt(18), { color: CREAM }]}>{title}</Text>
      </View>
      {hint ? <Text style={[txt(12.5, false), { color: MUTED }]}>{hint}</Text> : null}
    </View>
  );
}

export function Button({
  title, onPress, variant = 'primary', disabled, loading, style, compact,
}: {
  title: string; onPress: () => void; variant?: 'primary' | 'gold' | 'secondary' | 'danger';
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; compact?: boolean;
}) {
  const off = disabled || loading;
  const bg = variant === 'primary' ? ACCENT : variant === 'gold' ? GOLD : variant === 'danger' ? DANGER : PANEL_HI;
  const edge = variant === 'primary' ? ACCENT_DARK : variant === 'gold' ? GOLD_DEEP : variant === 'danger' ? '#B3282D' : '#0B2E21';
  const fg = variant === 'gold' ? '#2A1B00' : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && { minHeight: 38, borderRadius: 11 },
        { backgroundColor: bg, borderBottomColor: edge, opacity: off ? 0.5 : 1, transform: [{ translateY: pressed ? 2 : 0 }], borderBottomWidth: pressed ? 2 : 4 },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[txt(compact ? 14 : 17), { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

export function Chip({
  label, selected, onPress, disabled,
}: { label: string; selected?: boolean; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, selected ? { borderColor: GOLD, backgroundColor: 'rgba(242,193,78,0.16)' } : null, { opacity: disabled ? 0.4 : 1 }]}>
      <Text style={[txt(14.5), { color: selected ? GOLD : CREAM }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor="rgba(157,196,177,0.55)"
        selectionColor={GOLD}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

export function Banner({ text, onClose, tone = 'error' }: { text: string; onClose?: () => void; tone?: 'error' | 'info' }) {
  return (
    <Pressable onPress={onClose} style={[styles.banner, tone === 'info' && { backgroundColor: '#2F5FD0' }]}>
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

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}>{children}</View>;
}

/** Round icon-ish button for headers (back, settings...). */
export function PillButton({ label, onPress, tone = 'plain' }: { label: string; onPress: () => void; tone?: 'plain' | 'danger' }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        paddingHorizontal: 14, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: tone === 'danger' ? 'rgba(229,72,77,0.22)' : 'rgba(255,255,255,0.10)',
        borderWidth: 1, borderColor: tone === 'danger' ? 'rgba(229,72,77,0.5)' : LINE, opacity: pressed ? 0.7 : 1,
      })}>
      <Text style={[txt(14), { color: tone === 'danger' ? '#FF9A9E' : CREAM }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, padding: 14, gap: 12, backgroundColor: PANEL, borderWidth: 1, borderColor: LINE },
  button: { minHeight: 46, borderRadius: 13, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.16)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, minWidth: 54, alignItems: 'center' },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(0,0,0,0.28)', color: CREAM, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  banner: { backgroundColor: DANGER, borderRadius: 12, padding: 10 },
});
