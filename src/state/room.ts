import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { waitForServer } from '@/lib/api';
import { AppError, toAppError } from '@/lib/errors';
import { SERVER_URL } from '@/lib/env';
import { GameConnection, type CreateOptions } from '@/lib/gameClient';
import { getIdentity } from '@/lib/session';
import type { RoomView } from '@/lib/types';

interface RoomState {
  view: RoomView | null;
  /** Seat -> photo data URI (null = none). Filled by the server's 'avatars' message. */
  avatars: (string | null)[];
  link: 'online' | 'reconnecting';
  busy: boolean;
  error: AppError | null;
  /** Free hosts sleep when idle: 'waking' while we wait for the game server to answer. */
  server: 'unknown' | 'waking' | 'ready' | 'down';
  /** One-off message for the home screen (e.g. the room we were in is gone). */
  notice: 'roomLost' | null;
  createRoom(o: CreateOptions): Promise<void>;
  joinRoom(code: string): Promise<void>;
  quickMatch(targetScore: number): Promise<void>;
  /** Wakes the server if needed, then silently gets back into the room we were in. */
  bootstrap(): Promise<void>;
  wake(): Promise<boolean>;
  /** The app returned to the foreground. */
  foreground(): Promise<void>;
  clearNotice(): void;
  send(type: string, payload?: unknown): void;
  leaveRoom(): Promise<void>;
  clearError(): void;
}

export const useRoom = create<RoomState>((set, get) => {
  let waking: Promise<boolean> | null = null;
  const conn = new GameConnection({
    url: SERVER_URL,
    storage: AsyncStorage,
    getIdentity,
    listeners: {
      onState: (view) => set({ view }),
      onAvatars: (avatars) => set({ avatars }),
      onError: (e) => set({ error: { code: e.code, message: e.message } }),
      onLink: (link) => set({ link }),
      onClosed: (reason) => set({ view: null, avatars: [], link: 'online', ...(reason === 'lost' ? { notice: 'roomLost' as const } : {}) }),
    },
  });

  const wake = (): Promise<boolean> => {
    if (get().server === 'ready') return Promise.resolve(true);
    if (waking) return waking;
    set({ server: 'waking' });
    waking = waitForServer()
      .then((ok) => {
        set({ server: ok ? 'ready' : 'down' });
        return ok;
      })
      .finally(() => {
        waking = null;
      });
    return waking;
  };

  const run = async (fn: () => Promise<void>) => {
    set({ busy: true, error: null });
    try {
      if (!(await wake())) throw new Error('network: server did not answer');
      await fn();
    } catch (e) {
      const err = toAppError(e);
      if (err.code === 'network') set({ server: 'unknown' }); // may have gone back to sleep
      set({ error: err });
    } finally {
      set({ busy: false });
    }
  };

  return {
    view: null,
    avatars: [],
    link: 'online',
    busy: false,
    error: null,
    server: 'unknown',
    notice: null,
    createRoom: (o) => run(() => conn.create(o)),
    joinRoom: (code) => run(() => conn.join(code)),
    quickMatch: (target) => run(() => conn.quickMatch(target)),
    wake,
    async bootstrap() {
      if (!(await wake())) return;
      try {
        await conn.resume();
      } catch {
        // nothing to resume
      }
    },
    async foreground() {
      try {
        if ((await conn.onForeground()) === 'none') {
          set({ server: 'unknown' }); // it may have slept while we were away
          void wake();
        }
      } catch {
        // best effort
      }
    },
    clearNotice: () => set({ notice: null }),
    send: (type, payload) => conn.send(type, payload),
    async leaveRoom() {
      await conn.leave();
      set({ view: null, link: 'online' });
    },
    clearError: () => set({ error: null }),
  };
});
