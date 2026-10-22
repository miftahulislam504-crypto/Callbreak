import { useState } from 'react';
import { Text } from 'react-native';

import { Button } from '@/components/kit';
import { GREEN_OK, MUTED } from '@/constants/palette';
import { useT } from '@/lib/i18n';
import { relationOf } from '@/lib/socialLogic';
import { useSocial } from '@/state/social';

/** Next to a player's name in the lobby: add them as a friend (or accept their request / show the status). */
export function SeatFriendButton({ uid }: { uid?: string | null }) {
  const t = useT();
  const active = useSocial((s) => s.active);
  const me = useSocial((s) => s.me);
  const friendUids = useSocial((s) => s.friendUids);
  const incoming = useSocial((s) => s.incoming);
  const outgoingUids = useSocial((s) => s.outgoingUids);
  const [busy, setBusy] = useState(false);

  if (!active || !uid) return null;
  const rel = relationOf(me?.uid, uid, friendUids, incoming.map((r) => r.from), outgoingUids);
  if (rel === 'self') return null;
  if (rel === 'friend') return <Text style={{ color: GREEN_OK, fontWeight: '800', fontSize: 12.5 }}>{t('friendBadge')}</Text>;
  if (rel === 'outgoing') return <Text style={{ color: MUTED, fontSize: 12 }}>{t('requestedBadge')}</Text>;

  const press = async () => {
    setBusy(true);
    try {
      if (rel === 'incoming') await useSocial.getState().accept(uid);
      else await useSocial.getState().sendRequest(uid);
    } catch {
      // the button simply stays; the Friends page explains problems
    } finally {
      setBusy(false);
    }
  };
  return <Button compact variant="secondary" title={rel === 'incoming' ? t('accept') : t('addFriendShort')} loading={busy} onPress={() => void press()} />;
}
