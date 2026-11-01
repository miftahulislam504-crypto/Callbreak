import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { CardFan } from '@/components/gameui';
import { Banner, MenuBackdrop, PageHeader } from '@/components/kit';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, GOLD, GOLD_DEEP, GOLD_RIM, LINE, MUTED, PANEL } from '@/constants/palette';
import { shadow, TITLE_SHADOW } from '@/constants/ui';
import { gameInfo } from '@/lib/games';
import { errorText, useLang, useT } from '@/lib/i18n';
import { GUIDES } from '@/lib/rulesContent';
import { useGamePick } from '@/state/gamePick';
import { useRoom } from '@/state/room';

export const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Round gold badge with the picked game's icon: the "crest" of a menu page. */
function GameCrest({ icon, size = 76 }: { icon: React.ComponentProps<typeof Ionicons>['name']; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', ...shadow(3) }}>
      <LinearGradient colors={[GOLD_RIM, GOLD, GOLD_DEEP]} style={{ flex: 1, padding: 4 }}>
        <View style={{ flex: 1, borderRadius: size / 2, backgroundColor: '#0A2C1F', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.45)' }}>
          <Ionicons name={icon} size={size * 0.46} color={GOLD} />
        </View>
      </LinearGradient>
    </View>
  );
}

/**
 * A separate menu page (Quick match, Join, New room, More): back button + title on top. In landscape the
 * left side shows the picked game (crest, name, one line about it, a fan of cards) and the options sit on
 * the right; on a narrow screen only the options are shown. Once a room has been created or joined it
 * moves on to the lobby / table.
 */
export function MenuPage({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  const t = useT();
  const lang = useLang((s) => s.lang);
  const game = useGamePick((s) => s.game);
  const { width } = useWindowDimensions();
  const { view, error, server, clearError } = useRoom();
  if (view) return <Redirect href={view.status === 'lobby' ? '/lobby' : '/game'} />;

  const info = gameInfo(game);
  const tagline = GUIDES[lang].find((g) => g.id === game)?.tagline ?? '';
  const wide = width >= 680;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <PageHeader title={title} hint={hint} backLabel={t('back')} onBack={goHome} />

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        {server === 'waking' ? <Banner tone="info" text={t('serverWaking')} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 16, paddingHorizontal: 16, paddingBottom: 12 }}>
        {wide ? (
          <Animated.View entering={FadeInLeft.duration(420)} style={{ flex: 0.8, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <GameCrest icon={info.icon} />
            <Text numberOfLines={1} style={[txt(28), { color: GOLD, textAlign: 'center' }, TITLE_SHADOW]}>{t(info.titleKey)}</Text>
            <Text numberOfLines={3} style={[txt(13.5, false), { color: MUTED, textAlign: 'center', maxWidth: 260 }]}>{tagline}</Text>
            <CardFan width={42} />
          </Animated.View>
        ) : null}
        <Animated.View entering={FadeInRight.duration(420).delay(60)} style={{ flex: 1.2, minWidth: 0 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}>
            <View style={{ width: '100%', maxWidth: 520, gap: 12 }}>{children}</View>
          </ScrollView>
        </Animated.View>
      </View>
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
        backgroundColor: highlight ? '#12573C' : PANEL,
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

