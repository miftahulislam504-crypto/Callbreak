import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig } from './env';

let cached: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

/** Lazily creates the Firebase app. Only call when `isFirebaseConfigured` is true. */
export function getFirebase() {
  if (cached) return cached;
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  let auth: Auth;
  try {
    // Keeps the guest session across app restarts.
    auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    auth = getAuth(app); // already initialised (fast refresh)
  }
  let db: Firestore;
  try {
    // Live listeners (friends, invites) are steadier over long polling on some mobile networks.
    db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
  } catch {
    db = getFirestore(app); // already initialised (fast refresh)
  }
  cached = { app, auth, db };
  return cached;
}
