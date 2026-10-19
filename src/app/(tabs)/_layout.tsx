import { Stack } from 'expo-router';

// Landscape-only game: no bottom tabs. Home has a profile button in its header instead.
export default function MenuLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#06241A' } }} />;
}
