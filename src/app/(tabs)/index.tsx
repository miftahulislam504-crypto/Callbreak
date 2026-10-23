import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { CardFan, EmptyCards, GameButton, LogoMark, RoundIconButton, SeatDots } from '@/components/gameui';
import { GameSwitch } from '@/components/GameSwitch';
import { Avatar, Banner, MenuBackdrop, Row } from '@/components/kit';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, DANGER, GOLD, MUTED } from '@/constants/palette';
import { fetchPublicRooms } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { gameInfo } from '@/lib/games';
import { errorText, useT } from '@/lib/i18n';
import type { PublicRoom } from '@/lib/types';
import { useGamePick } from '@/state/gamePick';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

export default function Home() {
  const t = useT();
  const { profile } = useAuth();
  const { view, busy, error, server, notice, joinRoom, clearError, clearNotice } = useRoom();

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

      {/* Header: who you are, friends and settings */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 6 }}>
        <Row style={{ gap: 12, flex: 1, minWidth: 0 }}>
          <View style={{ padding: 2, borderRadius: 11, borderWidth: 2, borderColor: GOLD, backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <Avatar name={name || '?'} uri={profile?.avatar} size={42} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={[txt(21), { color: CREAM }]}>{t('hello', { name })}</Text>
            <Text numberOfLines={1} style={[txt(12.5, false), { color: MUTED }]}>{t('welcomeBack')}</Text>
          </View>
        </Row>
        <Row style={{ gap: 10 }}>
          <RoundIconButton icon="people" label={t('friends')} badge={badge} highlight={badge > 0} onPress={() => router.push('/friends')} />
          <RoundIconButton icon="settings-sharp" label={t('tabProfile')} onPress={() => router.push('/profile')} />
        </Row>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 8 }}>
        {server === 'waking' ? <Banner tone="info" text={t('serverWaking')} /> : null}
        {notice === 'roomLost' ? <Banner text={t('roomLost')} onClose={clearNotice} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 }}>
        {/* Left: the game's face: logo and a fanned hand */}
        <View style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <LogoMark title={t(gameInfo(game).titleKey)} />
          <CardFan width={50} />
        </View>

        {/* Middle: the ways to play */}
        <View style={{ flex: 1.05, minWidth: 0, gap: 10 }}>
          <GameSwitch />
          <GameButton big tone="gold" icon="flash" title={t('quickMatch')} hint={t('quickHint')} style={{ flex: 1.7 }} onPress={() => router.push('/quick-match')} />
          <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
            <GameButton tone="green" icon="key" title={t('joinById')} style={{ flex: 1 }} onPress={() => router.push('/join')} />
            <GameButton tone="green" icon="add-circle" title={t('createRoom')} style={{ flex: 1 }} onPress={() => router.push('/new-room')} />
          </View>
          <GameButton tone="dark" icon="sparkles" title={t('moreTitle')} style={{ height: 46 }} onPress={() => router.push('/more')} />
        </View>

        {/* Right: public rooms, like a table list */}
        <View
          style={{
            flex: 1.05, minWidth: 0, borderRadius: 20, padding: 12, gap: 8,
            backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 2, borderColor: 'rgba(242,193,78,0.28)',
          }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 8 }}>
              <Ionicons name="heart" size={18} color={DANGER} />
              <Text numberOfLines={1} style={[txt(18), { color: CREAM }]}>{t('publicRooms')}</Text>
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
            {(rooms ?? []).map((r) => (
              <Pressable
                key={r.roomCode}
                onPress={() => void joinRoom(r.roomCode)}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={`${r.name} ${t('playersCount', { n: r.clients })}`}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14,
                  backgroundColor: pressed ? 'rgba(242,193,78,0.16)' : 'rgba(255,255,255,0.06)', borderWidth: 1.5,
                  borderColor: pressed ? GOLD : 'rgba(255,255,255,0.1)',
                })}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={[txt(15), { color: CREAM }]}>{r.name}</Text>
                  <Text numberOfLines={1} style={[txt(12, false), { color: MUTED }]}>{r.host} · {game === 'poker' ? `${t('startingChips')} ${r.startingChips ?? ''}` : game === 'twentynine' ? t('tnTargetChip', { n: r.targetScore ?? 0 }) : `${t('targetScore')} ${r.targetScore ?? ''}`}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 3 }}>
                  <SeatDots filled={r.clients} total={r.maxClients} />
                  <Ionicons name="chevron-forward" size={14} color={GOLD} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}
