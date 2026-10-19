import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Banner, Button, Card, MenuBackdrop, PillButton, Row } from '@/components/kit';
import { TargetPicker } from '@/components/target-picker';
import { BG_DEEP, CREAM, GOLD, LINE, MUTED } from '@/constants/palette';
import { errorText, useT } from '@/lib/i18n';
import { avatarWidth } from '@/lib/profile';
import { useRoom } from '@/state/room';

export default function Lobby() {
  const t = useT();
  const { view, avatars, link, error, send, leaveRoom, clearError } = useRoom();
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
  const col = { flex: 1, minWidth: 0 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View>
          <Text style={{ color: CREAM, fontSize: 22, fontWeight: '800' }}>{view.roomName}</Text>
          <Text style={{ color: MUTED, fontSize: 12.5 }}>
            {view.isPrivate ? t('privateBadge') : t('publicBadge')} · {t('targetScore')} {view.targetScore}
          </Text>
        </View>
        <PillButton label={t('leave')} tone="danger" onPress={() => void leaveRoom()} />
      </View>

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 4 }}>
        {/* Left: room code + host controls */}
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
          <Card style={{ borderColor: 'rgba(242,193,78,0.35)' }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Pressable onPress={() => void copy()} style={{ flex: 1 }}>
                <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('roomId')}</Text>
                <Text style={{ color: GOLD, fontSize: 36, fontWeight: '900', letterSpacing: 6 }}>{view.roomCode}</Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>{copied ? t('copied') : t('tapToCopy')}</Text>
              </Pressable>
              <Button
                title={t('share')}
                variant="secondary"
                compact
                onPress={() => void Share.share({ message: t('shareMsg', { code: view.roomCode }) })}
              />
            </Row>
          </Card>

          {isHost ? (
            <Card>
              <TargetPicker value={view.targetScore} onChange={(n) => send('setTarget', { targetScore: n })} />
              <Row>
                <Button style={{ flex: 1 }} title={t('addBot')} variant="secondary" disabled={full} onPress={() => send('addBot')} />
                <Button
                  style={{ flex: 1 }}
                  title={full ? t('start') : t('startWithBots')}
                  variant="gold"
                  onPress={() => send('start', { fillBots: !full })}
                />
              </Row>
            </Card>
          ) : (
            <Text style={{ color: MUTED, textAlign: 'center', padding: 12 }}>{t('waitHost')}</Text>
          )}
        </ScrollView>

        {/* Right: the four seats */}
        <ScrollView style={col} contentContainerStyle={{ gap: 8, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
          {view.seats.map((s) => (
            <View
              key={s.seat}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 14,
                backgroundColor: s.occupied ? '#0F3F2C' : 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: LINE,
              }}>
              {s.occupied ? <Avatar name={s.name} uri={avatars[s.seat]} size={38} /> : <View style={{ width: avatarWidth(38), height: 38, borderRadius: 7, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.25)' }} />}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: s.occupied ? CREAM : MUTED, fontWeight: '800', fontSize: 14.5 }}>
                  {s.occupied ? s.name : t('emptySeat')}
                  {s.seat === view.mySeat ? ` (${t('you')})` : ''}
                </Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>
                  {[
                    s.seat === view.hostSeat ? t('host') : '',
                    s.isBot ? t('bot') : '',
                    s.occupied && !s.isBot && !s.connected ? t('offline') : '',
                  ].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {isHost && s.isBot ? <Button title={t('removeBot')} variant="secondary" compact onPress={() => send('removeBot', { seat: s.seat })} /> : null}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
