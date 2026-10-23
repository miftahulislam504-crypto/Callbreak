import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PANEL_FRAME, R } from '@/constants/ui';
import { PanelShine } from '@/components/frame';
import { Text } from '@/components/text';
import { Avatar, Button } from '@/components/kit';
import { CREAM, MUTED } from '@/constants/palette';
import { hapticTurn } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { bannerKey, pickBanner } from '@/lib/socialLogic';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

/**
 * The notification: a banner on top of whatever screen is open when a friend invites you to a room
 * or sends a friend request. (When the app is closed the same invite reaches the phone as a push, see lib/push.ts.)
 */
export function SocialOverlay() {
  const t = useT();
  const insets = useSafeAreaInsets();
  const invites = useSocial((s) => s.invites);
  const incoming = useSocial((s) => s.incoming);
  const friendUids = useSocial((s) => s.friendUids);
  const dismissed = useSocial((s) => s.dismissed);
  const profiles = useSocial((s) => s.profiles);
  const view = useRoom((s) => s.view);
  const busy = useRoom((s) => s.busy);

  // An invite goes stale after a few minutes: re-check now and then.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);

  const item = pickBanner({
    invites,
    requests: incoming,
    friends: friendUids,
    dismissed,
    now,
    currentRoomCode: view?.roomCode ?? null,
    gameRunning: !!view && view.status !== 'lobby',
  });

  const key = item ? bannerKey(item) : null;
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (key && key !== lastKey.current) hapticTurn();
    lastKey.current = key;
  }, [key]);

  if (!item) return null;

  const store = useSocial.getState();
  const from = item.kind === 'invite' ? item.invite.from : item.request.from;
  const name = item.kind === 'invite' ? item.invite.fromName : item.request.fromName;
  const avatar = profiles[from]?.avatar ?? null;

  const attempt = (fn: () => Promise<void>) => void fn().catch(() => undefined);
  const onAccept = () =>
    attempt(() => (item.kind === 'invite' ? store.acceptInvite(item.invite) : store.accept(item.request.from)));
  const onDecline = () =>
    attempt(() => (item.kind === 'invite' ? store.declineInvite(item.invite) : store.decline(item.request.from)));

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: Math.max(insets.top, 8) + 4, left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 20 }}>
      <View
        style={[PANEL_FRAME, { width: '92%', maxWidth: 580, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: R.md }]}>
        <PanelShine radius={R.md} />
        <Avatar name={name} uri={avatar} size={46} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={2} style={{ color: CREAM, fontWeight: '800', fontSize: 15 }}>
            {item.kind === 'invite' ? t('inviteFrom', { name }) : t('requestFrom', { name })}
          </Text>
          {item.kind === 'invite' ? (
            <Text numberOfLines={1} style={{ color: MUTED, fontSize: 12.5 }}>{t('inviteRoom', { room: item.invite.roomName })}</Text>
          ) : null}
        </View>
        <Button compact variant="gold" title={item.kind === 'invite' ? t('joinNow') : t('accept')} loading={busy && item.kind === 'invite'} onPress={onAccept} />
        <Button compact variant="secondary" title={t('decline')} onPress={onDecline} />
        <Pressable hitSlop={10} onPress={() => store.closeBanner(item)}>
          <Text style={{ color: MUTED, fontSize: 20, fontWeight: '800' }}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
