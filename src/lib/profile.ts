import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteField, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

import { LIMITS, isFirebaseConfigured } from './env';
import { getFirebase } from './firebase';

export interface Profile {
  name: string;
  /** Small JPEG data URI of the player's photo. null/undefined = show the coloured initial. */
  avatar?: string | null;
}

/** Avatars are mini rectangles: width / height. The photo is cropped to this ratio. */
export const AVATAR_RATIO = 0.8;
export const avatarWidth = (height: number): number => Math.round(height * AVATAR_RATIO);

export const AVATAR_COLORS = ['#E5484D', '#F76B15', '#D6A100', '#30A46C', '#12A594', '#3E63DD', '#8E4EC6', '#D6409F'];

/** Same name -> same colour on every device (the server only sends names). */
export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export const guestName = (): string => `Guest${Math.floor(1000 + Math.random() * 9000)}`;

export function cleanName(raw: string, fallback = 'Player'): string {
  const n = raw.replace(/\s+/g, ' ').trim().slice(0, LIMITS.maxName);
  return n.length > 0 ? n : fallback;
}

const localKey = (uid: string) => `cb.profile.${uid}`;

/** Firestore when configured (cached locally so the app still works offline), else local only. */
export async function loadProfile(uid: string): Promise<Profile | null> {
  if (isFirebaseConfigured) {
    try {
      const snap = await getDoc(doc(getFirebase().db, 'users', uid));
      if (snap.exists()) {
        const name = snap.get('name');
        if (typeof name === 'string' && name) {
          const avatar = snap.get('avatar');
          const p: Profile = { name, avatar: typeof avatar === 'string' && avatar ? avatar : null };
          await AsyncStorage.setItem(localKey(uid), JSON.stringify(p));
          return p;
        }
      }
    } catch {
      // offline or rules not deployed yet: fall back to the local copy
    }
  }
  const raw = await AsyncStorage.getItem(localKey(uid));
  return raw ? (JSON.parse(raw) as Profile) : null;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  await AsyncStorage.setItem(localKey(uid), JSON.stringify(profile));
  if (isFirebaseConfigured) {
    try {
      const data: Record<string, unknown> = { name: profile.name, updatedAt: serverTimestamp() };
      // undefined = leave the stored photo alone (e.g. a rename); null = remove it.
      if (profile.avatar !== undefined) data.avatar = profile.avatar ? profile.avatar : deleteField();
      await setDoc(doc(getFirebase().db, 'users', uid), data, { merge: true });
    } catch {
      // kept locally; will sync the next time the profile is saved
    }
  }
}

export async function clearLocalProfile(uid: string): Promise<void> {
  await AsyncStorage.removeItem(localKey(uid));
}
