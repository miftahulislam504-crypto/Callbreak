import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { Button, Card, CardTitle, Field, GoldAvatar, MenuBackdrop, PageHeader, Row, ToggleRow } from '@/components/kit';
import { txt } from '@/constants/fonts';
import { BG_DEEP, CREAM, GOLD, MUTED, ROSE } from '@/constants/palette';
import { useAuth } from '@/lib/auth';
import { pickAvatar } from '@/lib/avatarImage';
import { LIMITS, SERVER_URL } from '@/lib/env';
import { useT } from '@/lib/i18n';
import { useSound } from '@/lib/sound';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

export default function ProfileScreen() {
  const t = useT();
  const { profile, uid, local, updateName, updateAvatar, signOut } = useAuth();
  const leaveRoom = useRoom((s) => s.leaveRoom);
  const send = useRoom((s) => s.send);
  const sfxOn = useSound((x) => x.sfx);
  const musicOn = useSound((x) => x.music);
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
      <PageHeader title={t('profileTitle')} backLabel={t('back')} onBack={() => router.back()} />

      <View style={{ flex: 1, flexDirection: 'row', gap: 12, paddingHorizontal: 16 }}>
        <Animated.View entering={FadeInLeft.duration(260)} style={col}>
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* The player's badge: big photo in a gold frame, the name, and the photo buttons */}
          <Card>
            <Row style={{ gap: 16, alignItems: 'center' }}>
              <GoldAvatar name={profile?.name ?? '?'} uri={profile?.avatar} size={92} />
              <View style={{ flex: 1, gap: 8, minWidth: 0 }}>
                <Text numberOfLines={1} style={[txt(24), { color: GOLD }]}>{profile?.name ?? ''}</Text>
                <Button
                  compact
                  icon="camera"
                  title={profile?.avatar ? t('changePhoto') : t('choosePhoto')}
                  disabled={photoBusy}
                  onPress={choosePhoto}
                />
                {profile?.avatar ? (
                  <Button compact title={t('removePhoto')} variant="secondary" disabled={photoBusy} onPress={() => setPhoto(null)} />
                ) : null}
              </View>
            </Row>
            <Text style={{ color: photoError ? ROSE : MUTED, fontSize: 12 }}>{photoError ? t('photoFailed') : t('photoHint')}</Text>
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
        </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInRight.duration(260).delay(40)} style={col}>
        <ScrollView style={col} contentContainerStyle={{ gap: 12, paddingBottom: 14 }} showsVerticalScrollIndicator={false}>
          <Card>
            <CardTitle title={t('soundTitle')} />
            <ToggleRow icon="musical-note" label={t('sfxLabel')} hint={t('sfxHint')} value={sfxOn} onChange={(on) => useSound.getState().setSfx(on)} />
            <ToggleRow icon="musical-notes" label={t('musicLabel')} hint={t('musicHint')} value={musicOn} onChange={(on) => useSound.getState().setMusic(on)} />
          </Card>
          <Card>
            <CardTitle title={t('appearanceTitle')} />
            <Button compact icon="color-palette" title={t('customizeTitle')} onPress={() => router.push('/customize')} />
          </Card>
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
              await useSocial.getState().prepareSignOut();
              await signOut();
            }}
          />
          <Text style={{ color: MUTED, fontSize: 12 }}>{t('signOutWarn')}</Text>
        </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
