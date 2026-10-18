import { type ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput,
  View, type StyleProp, type TextInputProps, type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { ACCENT, DANGER } from '@/constants/palette';
import { useTheme } from '@/hooks/use-theme';
import { avatarColor } from '@/lib/profile';

export function Screen({
  children, tabs = false, onRefresh, refreshing = false,
}: { children: ReactNode; tabs?: boolean; onRefresh?: () => void; refreshing?: boolean }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        contentContainerStyle={{
          padding: Spacing.three,
          gap: Spacing.three,
          paddingBottom: (tabs ? BottomTabInset : 0) + Spacing.five,
          maxWidth: MaxContentWidth,
          width: '100%',
          alignSelf: 'center',
        }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.card, style]}>
      {children}
    </ThemedView>
  );
}

export function Button({
  title, onPress, variant = 'primary', disabled, loading, style,
}: {
  title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const off = disabled || loading;
  const bg = variant === 'primary' ? ACCENT : variant === 'danger' ? DANGER : theme.backgroundSelected;
  const fg = variant === 'secondary' ? theme.text : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: bg, opacity: off ? 0.5 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <ThemedText type="smallBold" style={{ color: fg, fontSize: 16 }}>{title}</ThemedText>}
    </Pressable>
  );
}

export function Chip({
  label, selected, onPress, disabled,
}: { label: string; selected?: boolean; onPress: () => void; disabled?: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, { borderColor: selected ? ACCENT : theme.backgroundSelected, backgroundColor: selected ? ACCENT : 'transparent', opacity: disabled ? 0.4 : 1 }]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.text }}>{label}</ThemedText>
    </Pressable>
  );
}

export function Field({ label, ...props }: { label?: string } & TextInputProps) {
  const theme = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      {label ? <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText> : null}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        {...props}
        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.backgroundSelected }, props.style]}
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

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initial = (Array.from(name.trim())[0] ?? '?').toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name), alignItems: 'center', justifyContent: 'center' }}>
      <ThemedText type="smallBold" style={{ color: '#fff', fontSize: size * 0.42 }}>{initial}</ThemedText>
    </View>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  button: { minHeight: 48, borderRadius: 12, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  banner: { backgroundColor: DANGER, borderRadius: 12, padding: Spacing.three },
});
