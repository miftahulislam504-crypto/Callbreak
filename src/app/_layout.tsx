import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/lib/auth';
import { useRoom } from '@/state/room';

SplashScreen.preventAutoHideAsync();

function Gate() {
  const { status } = useAuth();
  const resume = useRoom((s) => s.resume);

  // Back into the room we were in if the app was closed or the connection dropped.
  useEffect(() => {
    if (status === 'in') void resume();
  }, [status, resume]);

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
