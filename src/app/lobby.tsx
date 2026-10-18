import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Avatar, Banner, Button, Card, Row, Screen } from '@/components/kit';
import { TargetPicker } from '@/components/target-picker';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { errorText, useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function Lobby() {
  const t = useT();
  const { view, link, error, send, leaveRoom, clearError } = useRoom();
  const [copied, setCopied] = useState(false);

  if (!view) return <Redirect href="/" />;
  if (view.status !== 'lobby') return <Redirect href="/game" />;

  const isHost = view.mySeat === view.hostSeat;
  const full = view.seats.every((s) => s.occupied);
  const copy = async () => {
    await Clipboard.setStringAsync(view.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Screen>
      <ThemedText type="subtitle">{view.roomName}</ThemedText>
      {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
      {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <Pressable onPress={() => void copy()}>
            <ThemedText type="small" themeColor="textSecondary">{t('roomId')}</ThemedText>
            <ThemedText type="title" style={{ letterSpacing: 4 }}>{view.roomCode}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{copied ? t('copied') : t('tapToCopy')}</ThemedText>
          </Pressable>
          <Button
            title={t('share')}
            variant="secondary"
            onPress={() => void Share.share({ message: t('shareMsg', { code: view.roomCode }) })}
          />
        </Row>
        <ThemedText type="small" themeColor="textSecondary">
          {view.isPrivate ? t('privateBadge') : t('publicBadge')} · {t('targetScore')} {view.targetScore}
        </ThemedText>
      </Card>

      <Card>
        {view.seats.map((s) => (
          <Row key={s.seat} style={{ justifyContent: 'space-between' }}>
            <Row style={{ flex: 1 }}>
              {s.occupied ? <Avatar name={s.name} /> : <View style={{ width: 40, height: 40 }} />}
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" themeColor={s.occupied ? 'text' : 'textSecondary'}>
                  {s.occupied ? s.name : t('emptySeat')}
                  {s.seat === view.mySeat ? ` (${t('you')})` : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {[
                    s.seat === view.hostSeat ? t('host') : '',
                    s.isBot ? t('bot') : '',
                    s.occupied && !s.isBot && !s.connected ? t('offline') : '',
                  ].filter(Boolean).join(' · ')}
                </ThemedText>
              </View>
            </Row>
            {isHost && s.isBot ? (
              <Button title={t('removeBot')} variant="secondary" onPress={() => send('removeBot', { seat: s.seat })} />
            ) : null}
          </Row>
        ))}
      </Card>

      {isHost ? (
        <Card>
          <TargetPicker value={view.targetScore} onChange={(n) => send('setTarget', { targetScore: n })} />
          <Button title={t('addBot')} variant="secondary" disabled={full} onPress={() => send('addBot')} />
          <Button
            title={full ? t('start') : t('startWithBots')}
            onPress={() => send('start', { fillBots: !full })}
          />
        </Card>
      ) : (
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', padding: Spacing.three }}>
          {t('waitHost')}
        </ThemedText>
      )}

      <Button title={t('leave')} variant="danger" onPress={() => void leaveRoom()} />
    </Screen>
  );
}
