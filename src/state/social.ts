import { create } from 'zustand';

import { isFirebaseConfigured } from '@/lib/env';
import { registerPushToken, setupNotifications, unregisterPushToken } from '@/lib/push';
import {
  acceptFriendRequest, cancelFriendRequest, declineFriendRequest, dismissInvite, ensureFriendCode, fetchProfile,
  isPermissionDenied, removeFriend, sendFriendRequest, sendInvite, watchFriendUids, watchIncomingRequests,
  watchInvites, watchOutgoingRequests, type Me, type PublicProfile, type SendResult,
} from '@/lib/social';
import { MAX_FRIENDS, bannerKey, type BannerItem, type FriendRequest, type Invite } from '@/lib/socialLogic';
import { useRoom } from '@/state/room';

interface SocialState {
  /** The live listeners are attached (Firebase mode, signed in). */
  active: boolean;
  /** 'rules' = Firestore refused us, i.e. firestore.rules was not published yet. */
  problem: 'rules' | null;
  me: Me | null;
  friendCode: string | null;
  friendUids: string[];
  /** uid -> profile (null = looked up, not found; undefined = not looked up yet). */
  profiles: Record<string, PublicProfile | null | undefined>;
  incoming: FriendRequest[];
  outgoingUids: string[];
  invites: Invite[];
  /** Banner keys the player closed. */
  dismissed: string[];

  start(me: Me): void;
  stop(): void;
  setName(name: string): void;
  loadProfiles(uids: string[]): Promise<void>;
  reloadFriendCode(): Promise<void>;
  sendRequest(targetUid: string): Promise<SendResult | 'limit'>;
  accept(fromUid: string): Promise<void>;
  decline(fromUid: string): Promise<void>;
  cancel(toUid: string): Promise<void>;
  unfriend(uid: string): Promise<void>;
  invite(friendUid: string, room: { roomCode: string; roomName: string }): Promise<void>;
  acceptInvite(invite: Invite): Promise<void>;
  declineInvite(invite: Invite): Promise<void>;
  closeBanner(item: BannerItem): void;
  /** Before signing out: forget this phone's push token while we still can. */
  prepareSignOut(): Promise<void>;
}

const EMPTY = {
  active: false,
  problem: null,
  friendCode: null,
  friendUids: [] as string[],
  incoming: [] as FriendRequest[],
  outgoingUids: [] as string[],
  invites: [] as Invite[],
  dismissed: [] as string[],
};

export const useSocial = create<SocialState>((set, get) => {
  let unsubs: (() => void)[] = [];
  let loading = new Set<string>();

  const need = (): Me => {
    const me = get().me;
    if (!me) throw new Error('not_signed_in');
    return me;
  };

  const detach = () => {
    for (const u of unsubs) u();
    unsubs = [];
  };

  return {
    ...EMPTY,
    me: null,
    profiles: {},

    start(me) {
      if (!isFirebaseConfigured) return;
      if (get().active && get().me?.uid === me.uid) {
        set({ me });
        return;
      }
      detach();
      loading = new Set();
      set({ ...EMPTY, me, profiles: {}, active: true });

      const fail = (e: unknown) => set({ problem: isPermissionDenied(e) ? 'rules' : null });
      unsubs = [
        watchFriendUids(
          me.uid,
          (uids) => {
            set({ friendUids: uids, problem: null });
            void get().loadProfiles(uids);
          },
          fail,
        ),
        watchIncomingRequests(
          me.uid,
          (incoming) => {
            set({ incoming });
            void get().loadProfiles(incoming.map((r) => r.from));
          },
          fail,
        ),
        watchOutgoingRequests(me.uid, (outgoingUids) => set({ outgoingUids }), fail),
        watchInvites(
          me.uid,
          (invites) => {
            set({ invites });
            void get().loadProfiles(invites.map((i) => i.from));
          },
          fail,
        ),
      ];

      void setupNotifications();
      void registerPushToken(me.uid);
      void get().reloadFriendCode();
    },

    stop() {
      detach();
      loading = new Set();
      set({ ...EMPTY, me: null, profiles: {} });
    },

    setName(name) {
      const me = get().me;
      if (me && me.name !== name) set({ me: { ...me, name } });
    },

    async loadProfiles(uids) {
      const todo = [...new Set(uids)].filter((u) => u && get().profiles[u] === undefined && !loading.has(u));
      if (todo.length === 0) return;
      todo.forEach((u) => loading.add(u));
      await Promise.all(
        todo.map(async (uid) => {
          try {
            const p = await fetchProfile(uid);
            set((s) => ({ profiles: { ...s.profiles, [uid]: p } }));
          } catch {
            // try again next time (left undefined)
          } finally {
            loading.delete(uid);
          }
        }),
      );
    },

    async reloadFriendCode() {
      const me = get().me;
      if (!me) return;
      try {
        const code = await ensureFriendCode(me.uid);
        if (code && get().me?.uid === me.uid) set({ friendCode: code });
      } catch (e) {
        if (isPermissionDenied(e)) set({ problem: 'rules' });
      }
    },

    async sendRequest(targetUid) {
      const me = need();
      if (get().friendUids.length >= MAX_FRIENDS) return 'limit';
      return sendFriendRequest(me, targetUid);
    },

    async accept(fromUid) {
      await acceptFriendRequest(need().uid, fromUid);
    },
    async decline(fromUid) {
      await declineFriendRequest(need().uid, fromUid);
    },
    async cancel(toUid) {
      await cancelFriendRequest(need().uid, toUid);
    },
    async unfriend(uid) {
      await removeFriend(need().uid, uid);
    },

    async invite(friendUid, room) {
      await sendInvite(need(), friendUid, room);
    },

    async acceptInvite(invite) {
      // Joining leaves the current lobby (if any); the room store reports a full / gone room as its usual error.
      await useRoom.getState().joinRoom(invite.roomCode);
      void dismissInvite(invite.id);
    },
    async declineInvite(invite) {
      await dismissInvite(invite.id);
    },

    closeBanner(item) {
      const key = bannerKey(item);
      set((s) => (s.dismissed.includes(key) ? s : { dismissed: [...s.dismissed, key] }));
    },

    async prepareSignOut() {
      const me = get().me;
      if (me) await unregisterPushToken(me.uid);
      get().stop();
    },
  };
});
