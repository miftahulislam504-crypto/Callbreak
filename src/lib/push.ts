// Phone notifications for room invites when the app is closed (Expo push + Firebase Cloud Messaging).
// Everything here is best effort: without FCM keys, in Expo Go, on web or with notifications switched off
// nothing happens, and the live in-app banner (state/social.ts + SocialOverlay) still works.
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';

import { getFirebase } from './firebase';
import { translate, useLang } from './i18n';

const CHANNEL = 'invites';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const TOKEN_RE = /^Expo(nent)?PushToken\[.+\]$/;

/** Needs a real build on a phone: Expo Go (Android) and the web have no remote push. */
const supported = (): boolean => Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

let setupDone = false;

/** Android channel + "stay quiet while the app is open" (the in-app banner is the notification then). */
export async function setupNotifications(): Promise<void> {
  if (setupDone || !supported()) return;
  setupDone = true;
  try {
    const N = await import('expo-notifications');
    N.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
    });
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CHANNEL, {
        name: 'Room invites',
        importance: N.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#F2C14E',
      });
    }
  } catch {
    // notifications are optional
  }
}

/** Asks for permission (once the OS allows) and files this phone's token where friends can find it. */
export async function registerPushToken(uid: string): Promise<void> {
  if (!supported() || !Device.isDevice) return;
  try {
    await setupNotifications();
    const N = await import('expo-notifications');
    let perm = await N.getPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await N.requestPermissionsAsync();
    if (!perm.granted) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    await setDoc(doc(getFirebase().db, 'pushTokens', uid), { token: data, updatedAt: serverTimestamp() });
  } catch {
    // no FCM credentials yet, offline, ...: the in-app notification still works
  }
}

/** Sign-out: stop friends from pushing to a phone that is no longer this player. */
export async function unregisterPushToken(uid: string): Promise<void> {
  try {
    await deleteDoc(doc(getFirebase().db, 'pushTokens', uid));
  } catch {
    // nothing to remove
  }
}

/** Tells a friend's phone about an invite. Silent when they have no token (app never opened, notifications off). */
export async function notifyInvitePush(toUid: string, fromName: string, roomName: string, roomCode: string): Promise<void> {
  try {
    const snap = await getDoc(doc(getFirebase().db, 'pushTokens', toUid));
    const token = snap.exists() ? snap.get('token') : null;
    if (typeof token !== 'string' || !TOKEN_RE.test(token)) return;
    const lang = useLang.getState().lang;
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        to: token,
        title: translate(lang, 'appName'),
        body: translate(lang, 'pushInviteBody', { name: fromName, room: roomName }),
        sound: 'default',
        channelId: CHANNEL,
        priority: 'high',
        ttl: 300,
        data: { type: 'invite', roomCode },
      }),
    });
  } catch {
    // best effort
  }
}
