import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { txt } from '@/constants/fonts';
import { CardFan, LogoMark } from '@/components/gameui';
import { Text } from '@/components/text';
import { Banner, Button, Card, Field, MenuBackdrop } from '@/components/kit';
import { BG_DEEP, MUTED } from '@/constants/palette';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: BG_DEEP }}>
      <MenuBackdrop />
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 28 }}>
        {/* Left: the game's face, same logo and fanned hand as the home page */}
        <View style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <LogoMark title={t('appName')} />
          <CardFan width={50} />
          <Text style={[txt(16, false), { color: MUTED, textAlign: 'center' }]}>{t('tagline')}</Text>
        </View>

        {/* Right: sign in */}
        <ScrollView style={{ flex: 1, maxWidth: 420 }} contentContainerStyle={{ gap: 10, paddingVertical: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {failed ? <Banner text={t('err_network')} onClose={() => setFailed(false)} /> : null}
          <Card>
            <Field label={t('yourName')} value={name} onChangeText={setName} maxLength={LIMITS.maxName} autoCorrect={false} />
            <Button title={t('playAsGuest')} variant="gold" onPress={go} loading={busy} disabled={name.trim().length === 0} />
            {local ? <Text style={{ color: MUTED, fontSize: 12 }}>{t('localModeNote')}</Text> : null}
          </Card>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
