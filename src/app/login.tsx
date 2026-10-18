import { useState } from 'react';
import { View } from 'react-native';

import { Banner, Button, Card, Field, Screen } from '@/components/kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { LIMITS } from '@/lib/env';
import { useT } from '@/lib/i18n';
import { guestName } from '@/lib/profile';

export default function Login() {
  const t = useT();
  const { signInGuest, local } = useAuth();
  const [name, setName] = useState(guestName);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const go = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await signInGuest(name);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: Spacing.six, gap: Spacing.two }}>
        <ThemedText type="title">♠ {t('appName')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('tagline')}</ThemedText>
      </View>
      {failed ? <Banner text={t('err_network')} onClose={() => setFailed(false)} /> : null}
      <Card>
        <Field label={t('yourName')} value={name} onChangeText={setName} maxLength={LIMITS.maxName} autoCorrect={false} />
        <Button title={t('playAsGuest')} onPress={go} loading={busy} disabled={name.trim().length === 0} />
        {local ? <ThemedText type="small" themeColor="textSecondary">{t('localModeNote')}</ThemedText> : null}
      </Card>
    </Screen>
  );
}
