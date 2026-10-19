import { Redirect, router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, MenuBackdrop, PillButton } from '@/components/kit';
import { BG_DEEP, CREAM, GOLD, LINE, MUTED } from '@/constants/palette';
import { errorText, useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));

/**
 * A separate menu page (Quick match, Join, New room, More): back button + title on top, then the
 * options with room to breathe. Once a room has been created or joined it moves on to the lobby / table.
 */
export function MenuPage({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const t = useT();
  const { view, error, server, clearError } = useRoom();
  if (view) return <Redirect href={view.status === 'lobby' ? '/lobby' : '/game'} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <PillButton label={`‹ ${t('back')}`} onPress={goHome} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: CREAM, fontSize: 22, fontWeight: '800' }}>{title}</Text>
          {hint ? <Text numberOfLines={1} style={{ color: MUTED, fontSize: 12.5 }}>{hint}</Text> : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        {server === 'waking' ? <Banner tone="info" text={t('serverWaking')} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', padding: 16, paddingTop: 8 }}>
        <View style={{ width: '100%', maxWidth: 560, gap: 12 }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** One of the big rectangular cards on the home page. */
export function MenuTile({
  icon, title, hint, onPress, highlight = false, muted = false,
}: { icon: string; title: string; hint: string; onPress: () => void; highlight?: boolean; muted?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1, minWidth: 0, borderRadius: 18, padding: 14, justifyContent: 'center', gap: 4,
        backgroundColor: highlight ? '#12573C' : '#0F3F2C',
        borderWidth: 1.5, borderColor: highlight ? 'rgba(242,193,78,0.55)' : LINE,
        opacity: muted ? 0.8 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}>
      <Text style={{ color: highlight ? GOLD : CREAM, fontSize: 30, lineHeight: 36 }}>{icon}</Text>
      <Text numberOfLines={1} style={{ color: CREAM, fontSize: 17, fontWeight: '800' }}>{title}</Text>
      <Text numberOfLines={2} style={{ color: MUTED, fontSize: 12 }}>{hint}</Text>
    </Pressable>
  );
}
