import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';

import { PANEL_FRAME, R } from '@/constants/ui';
import { PanelShine } from '@/components/frame';
import { Text } from '@/components/text';
import { Avatar, Button, PillButton, Row } from '@/components/kit';
import { CREAM, GOLD, LINE, MUTED, ROSE, SCRIM } from '@/constants/palette';
import { useT } from '@/lib/i18n';
import { REINVITE_COOLDOWN_MS } from '@/lib/socialLogic';
import { useSocial } from '@/state/social';

/** Lobby: pick friends to invite to this room. Each one gets a notification (in the app, or a push if it is closed). */
export function InviteFriendsModal({
  visible, onClose, roomCode, roomName,
}: { visible: boolean; onClose: () => void; roomCode: string; roomName: string }) {
  const t = useT();
  const friendUids = useSocial((s) => s.friendUids);
  const profiles = useSocial((s) => s.profiles);
  const [sentAt, setSentAt] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const friends = useMemo(
    () =>
      friendUids
        .map((uid) => ({ uid, name: profiles[uid]?.name ?? '…', avatar: profiles[uid]?.avatar ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [friendUids, profiles],
  );

  const send = async (uid: string) => {
    setFailed(false);
    setSentAt((s) => ({ ...s, [uid]: Date.now() }));
    try {
      await useSocial.getState().invite(uid, { roomCode, roomName });
    } catch {
      setSentAt((s) => {
        const { [uid]: _undone, ...rest } = s;
        return rest;
      });
      setFailed(true);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      supportedOrientations={['landscape', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: SCRIM, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <View
          style={[PANEL_FRAME, { width: '100%', maxWidth: 520, maxHeight: '92%', borderRadius: R.lg, padding: 14, gap: 10 }]}>
          <PanelShine radius={R.lg} />
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: CREAM, fontSize: 19, fontWeight: '800' }}>{t('inviteFriends')}</Text>
              <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('inviteHint')}</Text>
            </View>
            <PillButton label={t('close')} onPress={onClose} />
          </Row>

          {failed ? <Text style={{ color: ROSE, fontSize: 13 }}>{t('inviteFailed')}</Text> : null}

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {friends.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 13.5, textAlign: 'center', paddingVertical: 20 }}>{t('inviteNoFriends')}</Text>
            ) : null}
            {friends.map((f) => {
              const wait = sentAt[f.uid] !== undefined && now - sentAt[f.uid] < REINVITE_COOLDOWN_MS;
              return (
                <View
                  key={f.uid}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
                    backgroundColor: 'rgba(0,0,0,0.22)', borderWidth: 1, borderColor: LINE,
                  }}>
                  <Avatar name={f.name} uri={f.avatar} size={40} />
                  <Text numberOfLines={1} style={{ flex: 1, color: CREAM, fontWeight: '800', fontSize: 15 }}>{f.name}</Text>
                  <Button
                    compact
                    variant={wait ? 'secondary' : 'gold'}
                    title={wait ? t('invited') : t('invite')}
                    disabled={wait}
                    onPress={() => void send(f.uid)}
                  />
                </View>
              );
            })}
          </ScrollView>
          <Text style={{ color: GOLD, fontSize: 12, textAlign: 'center' }}>{t('roomId')}: {roomCode}</Text>
        </View>
      </View>
    </Modal>
  );
}
