import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useRoom } from '@/state/room';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { status } = useAuth();
  const bootstrap = useRoom((s) => s.bootstrap);
  const foreground = useRoom((s) => s.foreground);

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

  if (status === 'loading') return null;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === 'in'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lobby" options={{ gestureEnabled: false }} />
        <Stack.Screen name="game" options={{ gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={status !== 'in'}>
        <Stack.Screen name="login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
