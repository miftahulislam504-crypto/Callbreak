// EXPO_PUBLIC_* values are inlined at build time, so each one must be read with a literal name.
// Android emulator reaches the host PC at 10.0.2.2; a real phone needs the PC's LAN IP.
export const SERVER_URL = (process.env.EXPO_PUBLIC_SERVER_URL ?? 'ws://10.0.2.2:2567').replace(/\/+$/, '');
export const SERVER_HTTP_URL = SERVER_URL.replace(/^ws/, 'http');

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** Without Firebase keys the app runs in local-guest mode (works against a dev-mode server). */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const LIMITS = { minTarget: 10, maxTarget: 500, defaultTarget: 49, maxName: 20 };
