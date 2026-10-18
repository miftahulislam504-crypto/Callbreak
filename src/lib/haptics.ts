import * as Haptics from 'expo-haptics';

// Haptics are a nicety: never let a missing motor or a web build throw.
const safe = (p: Promise<void>) => void p.catch(() => undefined);

export const hapticTap = () => safe(Haptics.selectionAsync());
export const hapticTurn = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticWarn = () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
