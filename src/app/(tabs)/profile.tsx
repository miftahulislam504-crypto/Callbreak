import { useState } from 'react';

import { Avatar, Button, Card, Chip, Field, Row, Screen } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/lib/auth';
import { LIMITS, SERVER_URL } from '@/lib/env';
import { useLang, useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function ProfileScreen() {
  const t = useT();
  const { profile, uid, local, updateName, signOut } = useAuth();
  const leaveRoom = useRoom((s) => s.leaveRoom);
  const { lang, setLang } = useLang();
  const [name, setName] = useState(profile?.name ?? '');
  const [saved, setSaved] = useState(false);

  return (
    <Screen tabs>
      <Row>
        <Avatar name={profile?.name ?? '?'} size={56} />
        <ThemedText type="subtitle">{t('profileTitle')}</ThemedText>
      </Row>

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
        <ThemedText type="small" themeColor="textSecondary">{t('language')}</ThemedText>
        <Row>
          <Chip label="বাংলা" selected={lang === 'bn'} onPress={() => setLang('bn')} />
          <Chip label="English" selected={lang === 'en'} onPress={() => setLang('en')} />
        </Row>
      </Card>

      <Card>
        <ThemedText type="small">{t('mode')}: {local ? t('modeLocal') : t('modeFirebase')}</ThemedText>
        <ThemedText type="small">{t('playerId')}: {uid?.slice(0, 8)}</ThemedText>
        <ThemedText type="small">{t('server')}: {SERVER_URL}</ThemedText>
      </Card>

      <Button
        title={t('signOut')}
        variant="danger"
        onPress={async () => {
          await leaveRoom();
          await signOut();
        }}
      />
      <ThemedText type="small" themeColor="textSecondary">{t('signOutWarn')}</ThemedText>
    </Screen>
  );
}
