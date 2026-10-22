// Friend system data layer: Firestore reads/writes and live listeners. No React in here.
// Data model and security rules: see firestore.rules.
import {
  collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, where, writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';

import { getFirebase } from './firebase';
import { notifyInvitePush } from './push';
import {
  isValidFriendCode, makeFriendCode, normalizeFriendCode, pairId, type FriendRequest, type Invite,
} from './socialLogic';

export interface PublicProfile {
  uid: string;
  name: string;
  avatar: string | null;
  friendCode: string | null;
}

export interface Me {
  uid: string;
  name: string;
}

const db = () => getFirebase().db;

export const isPermissionDenied = (e: unknown): boolean => (e as { code?: unknown })?.code === 'permission-denied';

/** Firestore Timestamp -> epoch ms (null while a server timestamp is still pending). */
const ms = (v: unknown): number | null =>
  v && typeof (v as { toMillis?: unknown }).toMillis === 'function' ? (v as { toMillis(): number }).toMillis() : null;

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);

/* ---------- profiles and friend codes ---------- */

export async function fetchProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  if (!snap.exists()) return null;
  const name = snap.get('name');
  if (typeof name !== 'string' || !name) return null;
  const avatar = snap.get('avatar');
  const code = snap.get('friendCode');
  return {
    uid,
    name,
    avatar: typeof avatar === 'string' && avatar ? avatar : null,
    friendCode: typeof code === 'string' && isValidFriendCode(code) ? code : null,
  };
}

/**
 * My friend code: read it, or create it once (the code doc and my profile are written in one batch, and the
 * rules let a player own exactly one code). A taken code is refused by the rules, so we simply try another.
 * Returns null when my profile is not saved yet or the rules are not published.
 */
export async function ensureFriendCode(uid: string): Promise<string | null> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists() || typeof snap.get('name') !== 'string') return null;
  const existing = snap.get('friendCode');
  if (typeof existing === 'string' && isValidFriendCode(existing)) return existing;

  for (let i = 0; i < 6; i++) {
    const code = makeFriendCode();
    try {
      const batch = writeBatch(db());
      batch.set(doc(db(), 'friendCodes', code), { uid });
      batch.set(ref, { friendCode: code }, { merge: true });
      await batch.commit();
      return code;
    } catch (e) {
      if (!isPermissionDenied(e)) throw e; // a taken code is "permission denied" too: try the next one
    }
  }
  return null;
}

export async function findByCode(raw: string): Promise<PublicProfile | null> {
  const code = normalizeFriendCode(raw);
  if (!isValidFriendCode(code)) return null;
  const snap = await getDoc(doc(db(), 'friendCodes', code));
  const uid = snap.exists() ? snap.get('uid') : null;
  return typeof uid === 'string' ? fetchProfile(uid) : null;
}

/* ---------- friend requests ---------- */

export type SendResult = 'sent' | 'accepted' | 'already_sent' | 'already_friends' | 'self';

export async function sendFriendRequest(me: Me, targetUid: string): Promise<SendResult> {
  if (me.uid === targetUid) return 'self';
  const d = db();
  if ((await getDoc(doc(d, 'users', me.uid, 'friends', targetUid))).exists()) return 'already_friends';
  // They already asked me: asking back means yes.
  if ((await getDoc(doc(d, 'friendRequests', pairId(targetUid, me.uid)))).exists()) {
    await acceptFriendRequest(me.uid, targetUid);
    return 'accepted';
  }
  if ((await getDoc(doc(d, 'friendRequests', pairId(me.uid, targetUid)))).exists()) return 'already_sent';
  await setDoc(doc(d, 'friendRequests', pairId(me.uid, targetUid)), {
    from: me.uid,
    to: targetUid,
    fromName: me.name,
    createdAt: serverTimestamp(),
  });
  return 'sent';
}

/** Accepting writes both halves of the friendship and removes the request, all or nothing. */
export async function acceptFriendRequest(meUid: string, fromUid: string): Promise<void> {
  const d = db();
  const batch = writeBatch(d);
  batch.set(doc(d, 'users', meUid, 'friends', fromUid), { since: serverTimestamp() });
  batch.set(doc(d, 'users', fromUid, 'friends', meUid), { since: serverTimestamp() });
  batch.delete(doc(d, 'friendRequests', pairId(fromUid, meUid)));
  await batch.commit();
}

export const declineFriendRequest = (meUid: string, fromUid: string): Promise<void> =>
  deleteDoc(doc(db(), 'friendRequests', pairId(fromUid, meUid)));

export const cancelFriendRequest = (meUid: string, toUid: string): Promise<void> =>
  deleteDoc(doc(db(), 'friendRequests', pairId(meUid, toUid)));

export async function removeFriend(meUid: string, friendUid: string): Promise<void> {
  const d = db();
  const batch = writeBatch(d);
  batch.delete(doc(d, 'users', meUid, 'friends', friendUid));
  batch.delete(doc(d, 'users', friendUid, 'friends', meUid));
  await batch.commit();
}

/* ---------- room invites ---------- */

/** One pending invite per friend: inviting again replaces it (and pops up again on their side). */
export async function sendInvite(me: Me, friendUid: string, room: { roomCode: string; roomName: string }): Promise<void> {
  const roomName = room.roomName.slice(0, 40);
  await setDoc(doc(db(), 'invites', pairId(me.uid, friendUid)), {
    from: me.uid,
    to: friendUid,
    fromName: me.name,
    roomCode: room.roomCode,
    roomName,
    createdAt: serverTimestamp(),
  });
  void notifyInvitePush(friendUid, me.name, roomName, room.roomCode); // phone notification if their app is closed
}

export async function dismissInvite(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db(), 'invites', id));
  } catch {
    // already gone
  }
}

/* ---------- live listeners ---------- */

type OnError = (e: unknown) => void;

export function watchFriendUids(uid: string, onData: (uids: string[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(collection(db(), 'users', uid, 'friends'), (s) => onData(s.docs.map((x) => x.id)), onError);
}

export function watchIncomingRequests(uid: string, onData: (r: FriendRequest[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), 'friendRequests'), where('to', '==', uid)),
    (s) =>
      onData(
        s.docs.map((x) => {
          const v = x.data({ serverTimestamps: 'estimate' });
          return { id: x.id, from: str(v.from), fromName: str(v.fromName, 'Player'), createdAt: ms(v.createdAt) };
        }),
      ),
    onError,
  );
}

export function watchOutgoingRequests(uid: string, onData: (toUids: string[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), 'friendRequests'), where('from', '==', uid)),
    (s) => onData(s.docs.map((x) => str(x.get('to'))).filter(Boolean)),
    onError,
  );
}

export function watchInvites(uid: string, onData: (i: Invite[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db(), 'invites'), where('to', '==', uid)),
    (s) =>
      onData(
        s.docs.map((x) => {
          const v = x.data({ serverTimestamps: 'estimate' });
          return {
            id: x.id,
            from: str(v.from),
            fromName: str(v.fromName, 'Player'),
            roomCode: str(v.roomCode),
            roomName: str(v.roomName),
            createdAt: ms(v.createdAt),
          };
        }),
      ),
    onError,
  );
}
