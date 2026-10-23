import { BalooDa2_600SemiBold, BalooDa2_700Bold, BalooDa2_800ExtraBold } from '@expo-google-fonts/baloo-da-2';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { BG_DEEP } from '@/constants/palette';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { SocialOverlay } from '@/components/SocialOverlay';
import { AuthProvider, useAuth } from '@/lib/auth';
import { isFirebaseConfigured } from '@/lib/env';
import { useVoiceSync } from '@/lib/voice/useVoiceSync';
import { useRoom } from '@/state/room';
import { useSocial } from '@/state/social';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { status, uid, profile } = useAuth();
  // The game's one typeface (see constants/fonts.ts). If it fails to load, carry on with the system font rather than blocking the app.
  const [fontsLoaded, fontError] = useFonts({ BalooDa2_600SemiBold, BalooDa2_700Bold, BalooDa2_800ExtraBold });
  const bootstrap = useRoom((s) => s.bootstrap);
  const foreground = useRoom((s) => s.foreground);

  // Voice chat lives here (not on a screen) so it keeps running from the lobby into the game.
  useVoiceSync();

  // Wake the server (free hosts sleep) and get back into the room we were in, then keep the
  // connection healthy whenever the app returns from the background.
  useEffect(() => {
    if (status !== 'in') return;
    void bootstrap();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void foreground();
    });
    return () => sub.remove();
  }, [status, bootstrap, foreground]);

  // Friends, friend requests and room invites: live listeners for as long as we are signed in.
  const myName = profile?.name ?? 'Player';
  const nameRef = useRef(myName);
  useEffect(() => {
    nameRef.current = myName;
    useSocial.getState().setName(myName);
  }, [myName]);
  useEffect(() => {
    if (status !== 'in' || !uid || !isFirebaseConfigured) return;
    useSocial.getState().start({ uid, name: nameRef.current });
    return () => useSocial.getState().stop();
  }, [status, uid]);

  if (status === 'loading' || !(fontsLoaded || fontError)) return null;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: BG_DEEP } }}>
        <Stack.Protected guard={status === 'in'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lobby" options={{ gestureEnabled: false }} />
          <Stack.Screen name="game" options={{ gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={status !== 'in'}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
      {status === 'in' ? <SocialOverlay /> : null}
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider value={DarkTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
