import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { GameButton } from '@/components/gameui';
import { Avatar, Banner, Card, MenuBackdrop, PillButton, Row } from '@/components/kit';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { SeatFriendButton } from '@/components/SeatFriendButton';
import { SettingPicker } from '@/components/target-picker';
import { SeatMuteButton, VoiceButton } from '@/components/table/VoiceButton';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CARD_BLACK, CREAM, FELT, GOLD, GOLD_EDGE, GREEN_FACE, GREEN_OK, IVORY, MUTED, PANEL, ROSE } from '@/constants/palette';
import { gameInfo } from '@/lib/games';
import { errorText, useT } from '@/lib/i18n';
import { gameIdOf, isPoker } from '@/lib/types';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';
import { useVoice } from '@/state/voice';

export default function Lobby() {
  const t = useT();
  const { view, avatars, link, error, send, leaveRoom, clearError } = useRoom();
  const [copied, setCopied] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const socialActive = useSocial((s) => s.active);
  const speaking = useVoice((s) => s.speaking);
  const voiceOn = useVoice((s) => s.status === 'on');

  if (!view) return <Redirect href="/" />;
  if (view.status !== 'lobby') return <Redirect href="/game" />;

  const isHost = view.mySeat === view.hostSeat;
  const gid = gameIdOf(view);
  const info = gameInfo(gid);
  const full = view.seats.every((s) => s.occupied);
  const copy = async () => {
    await Clipboard.setStringAsync(view.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const filled = view.seats.filter((s) => s.occupied).length;
  // Enough players to start without filling the table with bots (Call Break and 29 need 4, poker needs 2).
  const enough = filled >= info.minPlayers;
  const setting = isPoker(view) ? view.startingChips : view.targetScore;
  const settingBadge = isPoker(view)
    ? `${t('startingChips')} ${view.startingChips}`
    : gid === 'twentynine'
      ? t('tnTargetChip', { n: view.targetScore })
      : `${t('targetScore')} ${view.targetScore}`;
  const seatRows = view.seats.length > 4 ? [view.seats.slice(0, 3), view.seats.slice(3)] : [view.seats];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />

      {/* Header: room name, badges, voice, leave */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8, gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={[txt(24), { color: CREAM }]}>{view.roomName}</Text>
          <Row style={{ gap: 8 }}>
            <Badge icon={view.isPrivate ? 'lock-closed' : 'globe-outline'} text={view.isPrivate ? t('privateBadge') : t('publicBadge')} />
            <Badge icon="flag" text={settingBadge} />
          </Row>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <VoiceButton variant="menu" />
          <PillButton label={t('leave')} tone="danger" onPress={() => void leaveRoom()} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 18, gap: 6 }}>
        {link === 'reconnecting' ? <Banner text={t('reconnecting')} /> : null}
        {error ? <Banner text={errorText(t, error)} onClose={clearError} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 14, paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16 }}>
        {/* Left: room code, host settings and (pinned) the start controls */}
        <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
            {/* Room code, printed like a card */}
            <Pressable
              onPress={() => void copy()}
              accessibilityRole="button"
              accessibilityLabel={t('tapToCopy')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 14, paddingRight: 10, borderRadius: 16,
                backgroundColor: IVORY, borderWidth: 2, borderColor: GOLD,
              }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[txt(12.5, false), { color: '#6B6A60' }]}>{t('roomId')}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={[txt(38), { color: CARD_BLACK, letterSpacing: 6 }]}>{view.roomCode}</Text>
                <Text style={[txt(12, false), { color: copied ? GREEN_FACE : '#6B6A60' }]}>{copied ? t('copied') : t('tapToCopy')}</Text>
              </View>
              <Pressable
                onPress={() => void Share.share({ message: t('shareMsg', { code: view.roomCode }) })}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('share')}
                style={({ pressed }) => ({
                  width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: GOLD, borderBottomWidth: pressed ? 2 : 4, borderBottomColor: GOLD_EDGE,
                })}>
                <Ionicons name="share-social" size={22} color="#2A1B00" />
              </Pressable>
            </Pressable>

            {socialActive ? (
              <GameButton tone="green" icon="person-add" title={t('inviteFriends')} style={{ height: 50 }} onPress={() => setInviteOpen(true)} />
            ) : null}

            {isHost ? (
              <Card>
                <SettingPicker
                  game={gid}
                  value={setting}
                  onChange={(n) => (gid === 'poker' ? send('setChips', { startingChips: n }) : send('setTarget', { targetScore: n }))}
                />
              </Card>
            ) : null}
          </ScrollView>

          {isHost ? (
            <View style={{ flexDirection: 'row', gap: 10, height: 58 }}>
              <GameButton tone="dark" icon="hardware-chip" title={t('addBot')} disabled={full} style={{ flex: 1 }} onPress={() => send('addBot')} />
              <GameButton
                tone="gold"
                icon="play"
                title={enough ? t('start') : t('startWithBots')}
                style={{ flex: 1.3 }}
                onPress={() => send('start', { fillBots: !enough })}
              />
            </View>
          ) : (
            <View style={{ height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 1.5, borderColor: 'rgba(242,193,78,0.3)' }}>
              <Text numberOfLines={2} style={[txt(14, false), { color: CREAM, textAlign: 'center', paddingHorizontal: 10 }]}>{t('waitHost')}</Text>
            </View>
          )}
        </View>

        {/* Right: the table, with the four players as cards */}
        <View
          style={{
            flex: 1.15, minWidth: 0, borderRadius: 28, borderWidth: 6, borderColor: '#9A6232', backgroundColor: FELT,
            padding: 10, gap: 8,
          }}>
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: 22, borderWidth: 2, borderColor: 'rgba(0,0,0,0.28)' }} />
          <View style={{ alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 2, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <Text style={[txt(14), { color: GOLD }]}>{t('playersOfMax', { n: filled, max: view.seats.length })}</Text>
          </View>
          {seatRows.map((row, ri) => (
          <View key={ri} style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            {row.map((s) => {
              const mine = s.seat === view.mySeat;
              const talking = voiceOn && speaking[s.seat];
              if (!s.occupied) {
                return (
                  <View
                    key={s.seat}
                    style={{
                      flex: 1, minWidth: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 6,
                      borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(0,0,0,0.16)',
                    }}>
                    <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 34 }}>♠</Text>
                    <Text numberOfLines={1} style={[txt(13, false), { color: MUTED }]}>{t('emptySeat')}</Text>
                    {socialActive ? <SeatIconButton icon="person-add" label={t('invite')} onPress={() => setInviteOpen(true)} /> : null}
                  </View>
                );
              }
              return (
                <View
                  key={s.seat}
                  style={{
                    flex: 1, minWidth: 0, borderRadius: 14, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 4, gap: 4,
                    backgroundColor: PANEL, borderWidth: 2, borderColor: mine ? GOLD : 'rgba(255,255,255,0.16)',
                  }}>
                  <View style={{ alignItems: 'center', gap: 2, alignSelf: 'stretch' }}>
                    <View style={{ padding: 2, borderRadius: 11, borderWidth: 3, borderColor: talking ? GREEN_OK : 'transparent' }}>
                      <Avatar name={s.name} uri={avatars[s.seat]} bot={s.isBot} size={54} />
                    </View>
                    <Text numberOfLines={1} style={[txt(14), { color: CREAM, textAlign: 'center' }]}>{s.name}</Text>
                    <Row style={{ gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {mine ? <Tag text={t('you')} color={GOLD} /> : null}
                      {s.seat === view.hostSeat ? <Tag text={t('host')} color={GOLD} icon="ribbon" /> : null}
                      {s.isBot ? <Tag text={t('bot')} color={MUTED} icon="hardware-chip" /> : null}
                      {!s.isBot && !s.connected ? <Tag text={t('offline')} color="#FF9A9E" /> : null}
                    </Row>
                  </View>
                  <View style={{ alignItems: 'center', gap: 4, alignSelf: 'stretch' }}>
                    <SeatMuteButton seat={s.seat} />
                    {!s.isBot && !mine ? <SeatFriendButton uid={s.uid} style={{ alignSelf: 'stretch', paddingHorizontal: 4 }} /> : null}
                    {isHost && s.isBot ? <SeatIconButton icon="close" label={t('removeBot')} danger onPress={() => send('removeBot', { seat: s.seat })} /> : null}
                  </View>
                </View>
              );
            })}
          </View>
          ))}
        </View>
      </View>

      <InviteFriendsModal visible={inviteOpen} onClose={() => setInviteOpen(false)} roomCode={view.roomCode} roomName={view.roomName} />
    </SafeAreaView>
  );
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Badge({ icon, text }: { icon: IconName; text: string }) {
  return (
    <Row style={{ gap: 4, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.28)' }}>
      <Ionicons name={icon} size={12} color={GOLD} />
      <Text style={[txt(12, false), { color: CREAM }]}>{text}</Text>
    </Row>
  );
}

function Tag({ text, color, icon }: { text: string; color: string; icon?: IconName }) {
  return (
    <Row style={{ gap: 2 }}>
      {icon ? <Ionicons name={icon} size={11} color={color} /> : null}
      <Text numberOfLines={1} style={[txt(11.5, false), { color }]}>{text}</Text>
    </Row>
  );
}

/** Small round action on a seat card (invite / remove bot). */
function SeatIconButton({ icon, label, onPress, danger = false }: { icon: IconName; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
        backgroundColor: danger ? 'rgba(229,72,77,0.22)' : 'rgba(255,255,255,0.12)',
        borderWidth: 1, borderColor: danger ? 'rgba(229,72,77,0.5)' : 'rgba(255,255,255,0.2)', opacity: pressed ? 0.7 : 1,
      })}>
      <Ionicons name={icon} size={18} color={danger ? ROSE : CREAM} />
    </Pressable>
  );
}
