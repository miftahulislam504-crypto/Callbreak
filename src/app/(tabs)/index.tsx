import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { CardFan, EmptyCards, GameButton, LogoMark, RoundIconButton, SeatDots } from '@/components/gameui';
import { GameSwitch } from '@/components/GameSwitch';
import { Banner, GoldAvatar, MenuBackdrop, Row, TablePanel } from '@/components/kit';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, GOLD, GOLD_LINE, GOLD_LINE_SOFT, GREEN_OK, MUTED } from '@/constants/palette';
import { fetchPublicRooms } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { uiTap } from '@/lib/feedback';
import { gameInfo } from '@/lib/games';
import { errorText, useT } from '@/lib/i18n';
import { useSound } from '@/lib/sound';
import type { PublicRoom } from '@/lib/types';
import { useGamePick } from '@/state/gamePick';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

/** Thin gold line (fading at both ends) with a diamond in the middle: separates the zones of the one table. */
function ZoneDivider() {
  return (
    <View pointerEvents="none" style={{ width: 20, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={['rgba(242,193,78,0)', GOLD_LINE, 'rgba(242,193,78,0)']}
        style={{ position: 'absolute', top: 8, bottom: 8, width: 1.5, borderRadius: 1 }}
      />
      <Text style={{ color: GOLD, opacity: 0.7, fontSize: 10, backgroundColor: 'transparent' }}>◆</Text>
    </View>
  );
}

export default function Home() {
  const t = useT();
  const { profile } = useAuth();
  const { view, busy, error, server, notice, joinRoom, clearError, clearNotice } = useRoom();
  const { height } = useWindowDimensions();
  const small = height < 400;
  const soundOn = useSound((s) => s.sfx || s.music);

  const pendingRequests = useSocial((s) => s.incoming.filter((r) => !s.friendUids.includes(r.from)).length);
  const pendingInvites = useSocial((s) => s.invites.length);
  const badge = pendingRequests + pendingInvites;

  const [rooms, setRooms] = useState<PublicRoom[] | null>(null);
  const [roomsFailed, setRoomsFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const game = useGamePick((s) => s.game);
  useEffect(() => {
    void useGamePick.getState().load();
  }, []);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setRooms(await fetchPublicRooms(game));
      setRoomsFailed(false);
    } catch {
      setRoomsFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, [game]);

  // Another game picked: show its rooms, not the previous game's.
  useEffect(() => {
    setRooms(null);
  }, [game]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // Created, joined or resumed a room: go to it.
  if (view) return <Redirect href={view.status === 'lobby' ? '/lobby' : '/game'} />;

  const name = profile?.name ?? '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />

      {/* Header: the player's badge, then sound, rules, friends and settings */}
      <Animated.View
        entering={FadeInDown.duration(260)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 4, gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0, flexDirection: 'row' }}>
          <View style={{ flexShrink: 1, borderRadius: 18, borderWidth: 1.5, borderColor: GOLD_LINE, overflow: 'hidden' }}>
            <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.2)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
            <Row style={{ gap: 10, padding: 6, paddingRight: 18 }}>
              <GoldAvatar name={name || '?'} uri={profile?.avatar} size={small ? 34 : 40} />
              <View style={{ flexShrink: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={[txt(20), { color: CREAM }]}>{t('hello', { name })}</Text>
                <Text numberOfLines={1} style={[txt(12.5, false), { color: MUTED }]}>{t('welcomeBack')}</Text>
              </View>
            </Row>
          </View>
        </View>
        <Row style={{ gap: 10 }}>
          <RoundIconButton icon={soundOn ? 'volume-high' : 'volume-mute'} label={t('soundTitle')} onPress={() => useSound.getState().toggleAll()} />
          <RoundIconButton icon="information-circle" label={t('rulesTitle')} onPress={() => router.push('/rules')} />
          <RoundIconButton icon="people" label={t('friends')} badge={badge} highlight={badge > 0} onPress={() => router.push('/friends')} />
          <RoundIconButton icon="settings-sharp" label={t('tabProfile')} onPress={() => router.push('/profile')} />
        </Row>
      </Animated.View>

      <View style={{ paddingHorizontal: 18, gap: 8 }}>
        {server === 'waking' ? <Banner tone="info" text={t('serverWaking')} /> : null}
        {notice === 'roomLost' ? <Banner text={t('roomLost')} onClose={clearNotice} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      {/* One table for the whole page: the sign, the ways to play and the public rooms all sit on the same felt. */}
      <Animated.View entering={FadeInUp.duration(320)} style={{ flex: 1, marginHorizontal: 18, marginTop: 2, marginBottom: small ? 10 : 14 }}>
        <TablePanel style={{ flex: 1, padding: 4 }} innerStyle={{ flexDirection: 'row', alignItems: 'stretch', padding: small ? 10 : 14 }}>
        {/* Left: the logo and name at the top, the fanned hand in the space under it */}
        <View style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
          <LogoMark title={t(gameInfo(game).titleKey)} compact={small} />
          <View style={{ flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }}>
            <CardFan width={small ? 40 : 42} />
          </View>
        </View>

        <ZoneDivider />

        {/* Middle: the ways to play. Quick match is the one to tap, so it shines and breathes. */}
        <View style={{ flex: 1.05, minWidth: 0, gap: small ? 8 : 10 }}>
          <GameSwitch compact={small} />
          <GameButton big shine pulse tone="gold" icon="flash" title={t('quickMatch')} hint={t('quickHint')} style={{ flex: 1.7 }} onPress={() => router.push('/quick-match')} />
          <View style={{ flex: 1, flexDirection: 'row', gap: small ? 8 : 10 }}>
            <GameButton tone="green" icon="key" title={t('joinById')} style={{ flex: 1 }} onPress={() => router.push('/join')} />
            <GameButton tone="green" icon="add-circle" title={t('createRoom')} style={{ flex: 1 }} onPress={() => router.push('/new-room')} />
          </View>
          <GameButton tone="dark" icon="sparkles" title={t('moreTitle')} style={{ height: small ? 40 : 46 }} onPress={() => router.push('/more')} />
        </View>

        <ZoneDivider />

        {/* Right: public rooms, on a small felt table */}
        <View
          style={{
            flex: 1.05, minWidth: 0, padding: 10, gap: 8, borderRadius: 16, overflow: 'hidden',
            backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1.5, borderColor: GOLD_LINE_SOFT,
          }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Row style={{ gap: 8, flexShrink: 1 }}>
                <Ionicons name="people" size={18} color={GOLD} />
                <Text numberOfLines={1} style={[txt(18), { color: CREAM, flexShrink: 1 }]}>{t('publicRooms')}</Text>
                {rooms && rooms.length > 0 ? (
                  <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: GOLD }}>
                    <Text style={[txt(12), { color: '#2A1B00', lineHeight: 15 }]}>{rooms.length}</Text>
                  </View>
                ) : null}
              </Row>
              <Pressable onPress={() => void load()} hitSlop={10} disabled={refreshing} accessibilityRole="button" accessibilityLabel="refresh">
                <Ionicons name="refresh" size={20} color={GOLD} style={{ opacity: refreshing ? 0.4 : 1 }} />
              </Pressable>
            </Row>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexGrow: 1 }}>
              {roomsFailed ? <Text style={[txt(13, false), { color: MUTED }]}>{t('roomsLoadFail')}</Text> : null}
              {!roomsFailed && rooms === null ? <ActivityIndicator color={GOLD} style={{ marginTop: 24 }} /> : null}
              {!roomsFailed && rooms && rooms.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 }}>
                  <EmptyCards />
                  <Text style={[txt(13.5, false), { color: MUTED, textAlign: 'center' }]}>{t('noPublicRooms')}</Text>
                </View>
              ) : null}
              {(rooms ?? []).map((r, i) => {
                const nearlyFull = r.clients >= r.maxClients - 1;
                return (
                  <Animated.View key={r.roomCode} entering={FadeInRight.duration(300).delay(Math.min(i, 6) * 60)}>
                    <Pressable
                      onPress={() => {
                        uiTap();
                        void joinRoom(r.roomCode);
                      }}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel={`${r.name} ${t('playersCount', { n: r.clients })}`}
                      style={({ pressed }) => ({
                        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingRight: 10, paddingLeft: 8, borderRadius: 14, overflow: 'hidden',
                        backgroundColor: pressed ? 'rgba(242,193,78,0.22)' : 'rgba(0,0,0,0.32)', borderWidth: 1.5,
                        borderColor: pressed ? GOLD : 'rgba(255,255,255,0.12)',
                      })}>
                      <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: nearlyFull ? GOLD : GREEN_OK }} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={[txt(15), { color: CREAM }]}>{r.name}</Text>
                        <Text numberOfLines={1} style={[txt(12, false), { color: MUTED }]}>{r.host} · {game === 'poker' ? `${t('startingChips')} ${r.startingChips ?? ''}` : game === 'twentynine' ? t('tnTargetChip', { n: r.targetScore ?? 0 }) : `${t('targetScore')} ${r.targetScore ?? ''}`}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 3 }}>
                        <SeatDots filled={r.clients} total={r.maxClients} />
                        <Ionicons name="chevron-forward" size={14} color={GOLD} />
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
        </View>
        </TablePanel>
      </Animated.View>
    </SafeAreaView>
  );
}
