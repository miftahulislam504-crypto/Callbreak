import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { txt } from '@/constants/fonts';
import { CardFan, GameButton, LogoMark } from '@/components/gameui';
import { Text } from '@/components/text';
import { Banner, Card, Field, MenuBackdrop } from '@/components/kit';
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
    if (busy || name.trim().length === 0) return;
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
        {/* Left: the title screen of the game, same sign and fanned hand as the home page */}
        <Animated.View entering={FadeInLeft.duration(560)} style={{ flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <LogoMark title={t('appName')} />
          <CardFan width={50} />
          <Text style={[txt(16, false), { color: MUTED, textAlign: 'center' }]}>{t('tagline')}</Text>
        </Animated.View>

        {/* Right: sign in */}
        <Animated.View entering={FadeInRight.duration(560).delay(160)} style={{ flex: 1, maxWidth: 420 }}>
          <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 12 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {failed ? <Banner text={t('err_network')} onClose={() => setFailed(false)} /> : null}
            <Card style={{ gap: 14 }}>
              <Field label={t('yourName')} value={name} onChangeText={setName} maxLength={LIMITS.maxName} autoCorrect={false} onSubmitEditing={() => void go()} />
              <GameButton
                big shine pulse tone="gold" icon="play" title={t('playAsGuest')}
                disabled={busy || name.trim().length === 0}
                style={{ height: 76 }}
                onPress={() => void go()}
              />
              {local ? <Text style={{ color: MUTED, fontSize: 12 }}>{t('localModeNote')}</Text> : null}
            </Card>
          </ScrollView>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
