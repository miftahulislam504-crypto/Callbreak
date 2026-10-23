import * as Clipboard from 'expo-clipboard';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Avatar, Banner, Button, Card, CardTitle, Field, MenuBackdrop, PageHeader, PillButton, Row } from '@/components/kit';
import { goHome } from '@/components/menu';
import { BG_DEEP, CREAM, GOLD, GOLD_LINE, GREEN_OK, MUTED, ROSE } from '@/constants/palette';
import { isFirebaseConfigured } from '@/lib/env';
import { useT, type Key } from '@/lib/i18n';
import { findByCode, type PublicProfile } from '@/lib/social';
import { FRIEND_CODE_LENGTH, MAX_FRIENDS, normalizeFriendCode, relationOf } from '@/lib/socialLogic';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

type Msg = { key: Key; ok: boolean; vars?: Record<string, string | number> };

function PersonRow({ name, avatar, children }: { name: string; avatar?: string | null; children?: ReactNode }) {
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)',
      }}>
      <Avatar name={name} uri={avatar} size={40} />
      <Text numberOfLines={1} style={{ flex: 1, color: CREAM, fontWeight: '800', fontSize: 15 }}>{name}</Text>
      {children}
    </View>
  );
}

export default function FriendsScreen() {
  const t = useT();
  const view = useRoom((s) => s.view);
  const active = useSocial((s) => s.active);
  const problem = useSocial((s) => s.problem);
  const me = useSocial((s) => s.me);
  const friendCode = useSocial((s) => s.friendCode);
  const friendUids = useSocial((s) => s.friendUids);
  const profiles = useSocial((s) => s.profiles);
  const incoming = useSocial((s) => s.incoming);
  const outgoingUids = useSocial((s) => s.outgoingUids);

  const [code, setCode] = useState('');
  const [found, setFound] = useState<PublicProfile | null>(null);
  const [msg, setMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (active && !friendCode) void useSocial.getState().reloadFriendCode();
  }, [active, friendCode]);

  const friends = useMemo(
    () =>
      friendUids
        .map((uid) => ({ uid, name: profiles[uid]?.name ?? '…', avatar: profiles[uid]?.avatar ?? null }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [friendUids, profiles],
  );
  const requests = incoming.filter((r) => !friendUids.includes(r.from));
  const nameOf = (uid: string) => profiles[uid]?.name ?? '…';

  // Accepted an invite from here: on to the room (same as the other menu pages).
  if (view) return <Redirect href={view.status === 'lobby' ? '/lobby' : '/game'} />;

  const store = useSocial.getState();
  const fail: Msg = { key: 'friendsActionFailed', ok: false };
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
    } catch {
      setMsg(fail);
    }
  };

  const copyCode = async () => {
    if (!friendCode) return;
    await Clipboard.setStringAsync(friendCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const find = async () => {
    setBusy(true);
    setMsg(null);
    setFound(null);
    try {
      const p = await findByCode(code);
      if (!p) setMsg({ key: 'friendNotFound', ok: false });
      else if (p.uid === me?.uid) setMsg({ key: 'ownCode', ok: false });
      else setFound(p);
    } catch {
      setMsg(fail);
    } finally {
      setBusy(false);
    }
  };

  const send = async (p: PublicProfile) => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await store.sendRequest(p.uid);
      const key: Record<string, Key> = {
        sent: 'requestSent', accepted: 'friendAdded', already_sent: 'requestPending',
        already_friends: 'alreadyFriends', limit: 'friendLimit', self: 'ownCode',
      };
      setMsg({ key: key[r], ok: r === 'sent' || r === 'accepted', vars: { n: MAX_FRIENDS } });
    } catch {
      setMsg(fail);
    } finally {
      setBusy(false);
    }
  };

  const askUnfriend = (uid: string) =>
    Alert.alert(t('unfriend'), t('unfriendAsk', { name: nameOf(uid) }), [
      { text: t('cancelRequest'), style: 'cancel' },
      { text: t('confirm'), style: 'destructive', onPress: () => void run(() => store.unfriend(uid)) },
    ]);

  const rel = found
    ? relationOf(me?.uid, found.uid, friendUids, incoming.map((r) => r.from), outgoingUids)
    : 'none';
  const col = { flex: 1, minWidth: 0 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <PageHeader title={`👥 ${t('friendsTitle')}`} backLabel={t('back')} onBack={goHome} />

      <View style={{ paddingHorizontal: 16, gap: 6 }}>
        {!isFirebaseConfigured ? <Banner tone="info" text={t('friendsNeedFirebase')} /> : null}
        {problem === 'rules' ? <Banner text={t('friendsRulesError')} /> : null}
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 4 }}>
        {/* Left: my code + add a friend */}
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card style={{ borderColor: GOLD_LINE }}>
            <CardTitle icon="♠" title={t('myFriendCode')} hint={t('friendCodeHint')} />
            <Row style={{ justifyContent: 'space-between' }}>
              <Pressable onPress={() => void copyCode()} style={{ flex: 1 }} disabled={!friendCode}>
                <Text style={{ color: GOLD, fontSize: 34, fontWeight: '900', letterSpacing: 6 }}>{friendCode ?? '······'}</Text>
                <Text style={{ color: MUTED, fontSize: 12 }}>{copied ? t('copied') : t('tapToCopy')}</Text>
              </Pressable>
              <Button
                title={t('share')}
                variant="secondary"
                compact
                disabled={!friendCode}
                onPress={() => friendCode && void Share.share({ message: t('shareFriendMsg', { code: friendCode }) })}
              />
            </Row>
          </Card>

          <Card>
            <CardTitle icon="＋" title={t('addFriend')} hint={t('addFriendHint')} />
            <Field
              value={code}
              onChangeText={(s) => { setCode(normalizeFriendCode(s)); setFound(null); setMsg(null); }}
              placeholder={t('friendCodePh')}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={FRIEND_CODE_LENGTH}
              style={{ letterSpacing: 4, fontWeight: '800', fontSize: 20, textAlign: 'center' }}
            />
            <Button title={t('findFriend')} variant="gold" onPress={() => void find()} disabled={!active || code.length !== FRIEND_CODE_LENGTH} loading={busy && !found} />
            {found ? (
              <PersonRow name={found.name} avatar={found.avatar}>
                {rel === 'friend' ? (
                  <Text style={{ color: GREEN_OK, fontWeight: '800', fontSize: 13 }}>{t('friendBadge')}</Text>
                ) : rel === 'outgoing' ? (
                  <Text style={{ color: MUTED, fontSize: 12.5 }}>{t('requestedBadge')}</Text>
                ) : (
                  <Button compact title={rel === 'incoming' ? t('accept') : t('sendRequest')} loading={busy} onPress={() => void send(found)} />
                )}
              </PersonRow>
            ) : null}
            {msg ? <Text style={{ color: msg.ok ? GREEN_OK : ROSE, fontSize: 13 }}>{t(msg.key, msg.vars)}</Text> : null}
          </Card>
          <Text style={{ color: MUTED, fontSize: 12 }}>{t('pushHint')}</Text>
        </ScrollView>

        {/* Right: requests, sent requests, friends */}
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
          {requests.length > 0 ? (
            <Card style={{ borderColor: GOLD_LINE }}>
              <CardTitle icon="✉" title={t('requestsTitle')} />
              {requests.map((r) => (
                <PersonRow key={r.id} name={profiles[r.from]?.name ?? r.fromName} avatar={profiles[r.from]?.avatar}>
                  <Button compact variant="gold" title={t('accept')} onPress={() => void run(() => store.accept(r.from))} />
                  <Button compact variant="secondary" title={t('decline')} onPress={() => void run(() => store.decline(r.from))} />
                </PersonRow>
              ))}
            </Card>
          ) : null}

          <Card>
            <CardTitle icon="♥" title={`${t('yourFriends')} (${friends.length})`} />
            {friends.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 13.5, paddingVertical: 8 }}>{t('noFriends')}</Text>
            ) : (
              friends.map((f) => (
                <PersonRow key={f.uid} name={f.name} avatar={f.avatar}>
                  <PillButton label={t('unfriend')} tone="danger" onPress={() => askUnfriend(f.uid)} />
                </PersonRow>
              ))
            )}
          </Card>

          {outgoingUids.length > 0 ? (
            <Card>
              <CardTitle title={t('sentRequests')} />
              {outgoingUids.map((uid) => (
                <PersonRow key={uid} name={nameOf(uid)} avatar={profiles[uid]?.avatar}>
                  <Button compact variant="secondary" title={t('cancelRequest')} onPress={() => void run(() => store.cancel(uid))} />
                </PersonRow>
              ))}
            </Card>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
