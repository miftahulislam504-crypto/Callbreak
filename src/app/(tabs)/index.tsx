import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { Banner, Button, Card, Field, Row, Screen } from '@/components/kit';
import { TargetPicker } from '@/components/target-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { fetchPublicRooms } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { LIMITS } from '@/lib/env';
import { errorText, useT } from '@/lib/i18n';
import type { PublicRoom } from '@/lib/types';
import { useRoom } from '@/state/room';

export default function Home() {
  const t = useT();
  const { profile } = useAuth();
  const { view, busy, error, createRoom, joinRoom, quickMatch, clearError } = useRoom();

  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [target, setTarget] = useState<number>(LIMITS.defaultTarget);
  const [quickTarget, setQuickTarget] = useState<number>(LIMITS.defaultTarget);
  const [code, setCode] = useState('');

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

  return (
    <Screen tabs onRefresh={load} refreshing={refreshing}>
      <ThemedText type="subtitle">{t('hello', { name: profile?.name ?? '' })}</ThemedText>
      {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}

      <Card>
        <ThemedText type="smallBold">{t('quickMatch')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{t('quickHint')}</ThemedText>
        <TargetPicker value={quickTarget} onChange={setQuickTarget} />
        <Button title={t('findMatch')} onPress={() => void quickMatch(quickTarget)} loading={busy} />
      </Card>

      <Card>
        <ThemedText type="smallBold">{t('createRoom')}</ThemedText>
        <Field label={t('roomNameOpt')} value={roomName} onChangeText={setRoomName} maxLength={LIMITS.maxName} />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <ThemedText type="smallBold">{t('privateRoom')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{t('privateHint')}</ThemedText>
          </View>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </Row>
        <TargetPicker value={target} onChange={setTarget} />
        <Button
          title={t('create')}
          onPress={() => void createRoom({ roomName: roomName.trim() || undefined, isPrivate, targetScore: target })}
          loading={busy}
        />
      </Card>

      <Card>
        <ThemedText type="smallBold">{t('joinById')}</ThemedText>
        <Field
          value={code}
          onChangeText={(s) => setCode(s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          placeholder={t('roomIdPh')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
        />
        <Button title={t('join')} onPress={() => void joinRoom(code)} disabled={code.length !== 6} loading={busy} />
      </Card>

      <Card>
        <ThemedText type="smallBold">{t('publicRooms')}</ThemedText>
        {roomsFailed ? <ThemedText type="small" themeColor="textSecondary">{t('roomsLoadFail')}</ThemedText> : null}
        {!roomsFailed && rooms && rooms.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">{t('noPublicRooms')}</ThemedText>
        ) : null}
        {(rooms ?? []).map((r) => (
          <Pressable key={r.roomCode} onPress={() => void joinRoom(r.roomCode)} disabled={busy}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{r.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {r.host} · {t('targetScore')} {r.targetScore}
                </ThemedText>
              </View>
              <ThemedText type="small">{t('playersCount', { n: r.clients })}</ThemedText>
            </Row>
          </Pressable>
        ))}
        <Button title="↻" variant="secondary" onPress={() => void load()} loading={refreshing} />
      </Card>
      <View style={{ height: Spacing.two }} />
    </Screen>
  );
}
