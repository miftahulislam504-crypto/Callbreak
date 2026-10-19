import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { onAuthStateChanged, signInAnonymously, signOut as fbSignOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { isFirebaseConfigured } from './env';
import { getFirebase } from './firebase';
import { loadLang } from './i18n';
import { Profile, cleanName, clearLocalProfile, guestName, loadProfile, saveProfile } from './profile';
import { setIdentityProvider } from './session';

type Status = 'loading' | 'out' | 'in';

interface AuthApi {
  status: Status;
  uid: string | null;
  profile: Profile | null;
  /** True when running without Firebase (local guest, dev-mode server only). */
  local: boolean;
  signInGuest(name: string): Promise<void>;
  updateName(name: string): Promise<void>;
  /** Set (data URI) or remove (null) the profile photo. */
  updateAvatar(avatar: string | null): Promise<void>;
  signOut(): Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);
const LOCAL_UID = 'cb.localUid';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const pending = useRef<Profile | null>(null);
  const me = useRef({ uid: null as string | null, name: 'Player', avatar: null as string | null });

  // The identity provider reads this ref when connecting; keep it current outside render.
  useEffect(() => {
    me.current = { uid, name: profile?.name ?? 'Player', avatar: profile?.avatar ?? null };
  }, [uid, profile]);

  useEffect(() => {
    void loadLang();
    setIdentityProvider(async () => {
      const { uid: id, name, avatar } = me.current;
      if (!id) throw Object.assign(new Error('not_signed_in'), { code: 'auth' });
      const user = isFirebaseConfigured ? getFirebase().auth.currentUser : null;
      return { uid: id, name, avatar, idToken: user ? await user.getIdToken() : null };
    });

    if (!isFirebaseConfigured) {
      void (async () => {
        const id = await AsyncStorage.getItem(LOCAL_UID);
        const p = id ? await loadProfile(id) : null;
        if (id && p) {
          setUid(id);
          setProfile(p);
          setStatus('in');
        } else {
          setStatus('out');
        }
      })();
      return () => setIdentityProvider(null);
    }

    const unsub = onAuthStateChanged(getFirebase().auth, (user) => {
      void (async () => {
        if (!user) {
          setUid(null);
          setProfile(null);
          setStatus('out');
          return;
        }
        let p = pending.current;
        pending.current = null;
        if (p) await saveProfile(user.uid, p);
        else p = (await loadProfile(user.uid)) ?? { name: guestName() };
        setUid(user.uid);
        setProfile(p);
        setStatus('in');
      })();
    });
    return () => {
      unsub();
      setIdentityProvider(null);
    };
  }, []);

  const api = useMemo<AuthApi>(
    () => ({
      status,
      uid,
      profile,
      local: !isFirebaseConfigured,
      async signInGuest(rawName) {
        const p: Profile = { name: cleanName(rawName, guestName()) };
        if (isFirebaseConfigured) {
          pending.current = p;
          await signInAnonymously(getFirebase().auth); // onAuthStateChanged finishes the job
          return;
        }
        const id = Crypto.randomUUID();
        await AsyncStorage.setItem(LOCAL_UID, id);
        await saveProfile(id, p);
        setUid(id);
        setProfile(p);
        setStatus('in');
      },
      async updateName(rawName) {
        if (!uid) return;
        const p: Profile = { ...profile, name: cleanName(rawName, profile?.name ?? 'Player') };
        await saveProfile(uid, p);
        setProfile(p);
      },
      async updateAvatar(avatar) {
        if (!uid) return;
        const p: Profile = { name: profile?.name ?? 'Player', avatar };
        await saveProfile(uid, p);
        setProfile(p);
      },
      async signOut() {
        if (isFirebaseConfigured) {
          await fbSignOut(getFirebase().auth);
          return;
        }
        if (uid) await clearLocalProfile(uid);
        await AsyncStorage.removeItem(LOCAL_UID);
        setUid(null);
        setProfile(null);
        setStatus('out');
      },
    }),
    [status, uid, profile],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
