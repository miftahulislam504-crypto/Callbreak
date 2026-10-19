import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Banner, Card, CardTitle, MenuBackdrop, Row } from '@/components/kit';
import { MenuTile } from '@/components/menu';
import { BG_DEEP, CREAM, GOLD, LINE, MUTED } from '@/constants/palette';
import { fetchPublicRooms } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { errorText, useT } from '@/lib/i18n';
import type { PublicRoom } from '@/lib/types';
import { useRoom } from '@/state/room';

export default function Home() {
  const t = useT();
  const { profile } = useAuth();
  const { view, busy, error, server, notice, joinRoom, clearError, clearNotice } = useRoom();

  const [rooms, setRooms] = useState<PublicRoom[] | null>(null);
  const [roomsFailed, setRoomsFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setRooms(await fetchPublicRooms());
      setRoomsFailed(false);
    } catch {
      setRoomsFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

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

      {/* Header: who you are, and the way to the profile */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 }}>
        <Row style={{ gap: 12 }}>
          <Avatar name={name || '?'} uri={profile?.avatar} size={44} />
          <View>
            <Text style={{ color: CREAM, fontSize: 22, fontWeight: '800' }}>{t('hello', { name })}</Text>
            <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('welcomeBack')}</Text>
          </View>
        </Row>
        <Row style={{ gap: 10 }}>
          <Text style={{ color: GOLD, fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }}>♠ {t('appName')}</Text>
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={8}
            style={({ pressed }) => ({
              paddingHorizontal: 14, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: LINE, opacity: pressed ? 0.7 : 1,
            })}>
            <Text style={{ color: CREAM, fontWeight: '800', fontSize: 13.5 }}>⚙ {t('tabProfile')}</Text>
          </Pressable>
        </Row>
      </View>

      <View style={{ paddingHorizontal: 16, gap: 8 }}>
        {server === 'waking' ? <Banner tone="info" text={t('serverWaking')} /> : null}
        {notice === 'roomLost' ? <Banner text={t('roomLost')} onClose={clearNotice} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 }}>
        {/* Left: four rectangular cards; each opens its own page */}
        <View style={{ flex: 1.5, minWidth: 0, gap: 12 }}>
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
            <MenuTile icon="⚡" title={t('quickMatch')} hint={t('quickHint')} highlight onPress={() => router.push('/quick-match')} />
            <MenuTile icon="🔑" title={t('joinById')} hint={t('joinHint')} onPress={() => router.push('/join')} />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
            <MenuTile icon="♣" title={t('createRoom')} hint={t('createHint')} onPress={() => router.push('/new-room')} />
            <MenuTile icon="✦" title={t('moreTitle')} hint={t('moreHint')} muted onPress={() => router.push('/more')} />
          </View>
        </View>

        {/* Right: public rooms */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Card style={{ flex: 1 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <CardTitle icon="♥" title={t('publicRooms')} />
              <Pressable onPress={() => void load()} hitSlop={8} disabled={refreshing}>
                <Text style={{ color: GOLD, fontSize: 20, fontWeight: '800', opacity: refreshing ? 0.4 : 1 }}>↻</Text>
              </Pressable>
            </Row>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {roomsFailed ? <Text style={{ color: MUTED, fontSize: 13 }}>{t('roomsLoadFail')}</Text> : null}
              {!roomsFailed && rooms && rooms.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
                  <Text style={{ fontSize: 34, color: 'rgba(255,255,255,0.18)' }}>♠</Text>
                  <Text style={{ color: MUTED, fontSize: 13, textAlign: 'center' }}>{t('noPublicRooms')}</Text>
                </View>
              ) : null}
              {(rooms ?? []).map((r) => (
                <Pressable
                  key={r.roomCode}
                  onPress={() => void joinRoom(r.roomCode)}
                  disabled={busy}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                    backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.22)', borderWidth: 1, borderColor: LINE,
                  })}>
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: CREAM, fontWeight: '800', fontSize: 14 }}>{r.name}</Text>
                    <Text numberOfLines={1} style={{ color: MUTED, fontSize: 12 }}>{r.host} · {t('targetScore')} {r.targetScore}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(242,193,78,0.16)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                    <Text style={{ color: GOLD, fontWeight: '800', fontSize: 12.5 }}>{t('playersCount', { n: r.clients })}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}
