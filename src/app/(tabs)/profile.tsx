import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, Card, CardTitle, Chip, Field, MenuBackdrop, PillButton, Row } from '@/components/kit';
import { BG_DEEP, CREAM, MUTED } from '@/constants/palette';
import { useAuth } from '@/lib/auth';
import { pickAvatar } from '@/lib/avatarImage';
import { LIMITS, SERVER_URL } from '@/lib/env';
import { useLang, useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function ProfileScreen() {
  const t = useT();
  const { profile, uid, local, updateName, updateAvatar, signOut } = useAuth();
  const leaveRoom = useRoom((s) => s.leaveRoom);
  const send = useRoom((s) => s.send);
  const { lang, setLang } = useLang();
  const [name, setName] = useState(profile?.name ?? '');
  const [saved, setSaved] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  /** Saves the photo to the profile and, if we are sitting at a table, tells the others right away. */
  const setPhoto = async (avatar: string | null) => {
    await updateAvatar(avatar);
    send('setAvatar', { avatar });
  };
  const choosePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError(false);
    try {
      const r = await pickAvatar();
      if (r.ok) await setPhoto(r.avatar);
      else if (r.reason === 'failed') setPhotoError(true);
    } finally {
      setPhotoBusy(false);
    }
  };

  const col = { flex: 1, minWidth: 0 } as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10 }}>
        <PillButton label={`‹ ${t('back')}`} onPress={() => router.back()} />
        <Avatar name={profile?.name ?? '?'} uri={profile?.avatar} size={42} />
        <Text style={{ color: CREAM, fontSize: 22, fontWeight: '800' }}>{t('profileTitle')}</Text>
      </View>

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Card>
            <CardTitle title={t('profilePhoto')} />
            <Row style={{ gap: 14, alignItems: 'center' }}>
              <Avatar name={profile?.name ?? '?'} uri={profile?.avatar} size={96} />
              <View style={{ flex: 1, gap: 8 }}>
                <Button
                  title={profile?.avatar ? t('changePhoto') : t('choosePhoto')}
                  disabled={photoBusy}
                  onPress={choosePhoto}
                />
                {profile?.avatar ? (
                  <Button title={t('removePhoto')} variant="secondary" disabled={photoBusy} onPress={() => setPhoto(null)} />
                ) : null}
              </View>
            </Row>
            <Text style={{ color: photoError ? '#FF8A8D' : MUTED, fontSize: 12 }}>{photoError ? t('photoFailed') : t('photoHint')}</Text>
          </Card>
          <Card>
            <Field label={t('yourName')} value={name} onChangeText={(s) => { setName(s); setSaved(false); }} maxLength={LIMITS.maxName} />
            <Button
              title={saved ? t('saved') : t('save')}
              disabled={name.trim().length === 0 || name.trim() === profile?.name}
              onPress={async () => {
                await updateName(name);
                setSaved(true);
              }}
            />
          </Card>
          <Card>
            <CardTitle title={t('language')} />
            <Row>
              <Chip label="বাংলা" selected={lang === 'bn'} onPress={() => setLang('bn')} />
              <Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} />
            </Row>
          </Card>
        </ScrollView>

        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={{ color: MUTED, fontSize: 13 }}>{t('mode')}: <Text style={{ color: CREAM }}>{local ? t('modeLocal') : t('modeFirebase')}</Text></Text>
            <Text style={{ color: MUTED, fontSize: 13 }}>{t('playerId')}: <Text style={{ color: CREAM }}>{uid?.slice(0, 8)}</Text></Text>
            <Text style={{ color: MUTED, fontSize: 13 }}>{t('server')}: <Text style={{ color: CREAM }}>{SERVER_URL}</Text></Text>
          </Card>
          <Button
            title={t('signOut')}
            variant="danger"
            onPress={async () => {
              await leaveRoom();
              await signOut();
            }}
          />
          <Text style={{ color: MUTED, fontSize: 12 }}>{t('signOutWarn')}</Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
