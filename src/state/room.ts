import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { AppError, toAppError } from '@/lib/errors';
import { SERVER_URL } from '@/lib/env';
import { GameConnection, type CreateOptions } from '@/lib/gameClient';
import { getIdentity } from '@/lib/session';
import type { RoomView } from '@/lib/types';

interface RoomState {
  view: RoomView | null;
  link: 'online' | 'reconnecting';
  busy: boolean;
  error: AppError | null;
  createRoom(o: CreateOptions): Promise<void>;
  joinRoom(code: string): Promise<void>;
  quickMatch(targetScore: number): Promise<void>;
  /** Silent: used at app start to get back into the room we were in. */
  resume(): Promise<void>;
  send(type: string, payload?: unknown): void;
  leaveRoom(): Promise<void>;
  clearError(): void;
}

export const useRoom = create<RoomState>((set) => {
  const conn = new GameConnection({
    url: SERVER_URL,
    storage: AsyncStorage,
    getIdentity,
    listeners: {
      onState: (view) => set({ view }),
      onError: (e) => set({ error: { code: e.code, message: e.message } }),
      onLink: (link) => set({ link }),
      onClosed: () => set({ view: null, link: 'online' }),
    },
  });

  const run = async (fn: () => Promise<void>) => {
    set({ busy: true, error: null });
    try {
      await fn();
    } catch (e) {
      set({ error: toAppError(e) });
    } finally {
      set({ busy: false });
    }
  };

  return {
    view: null,
    link: 'online',
    busy: false,
    error: null,
    createRoom: (o) => run(() => conn.create(o)),
    joinRoom: (code) => run(() => conn.join(code)),
    quickMatch: (target) => run(() => conn.quickMatch(target)),
    async resume() {
      try {
        await conn.resume();
      } catch {
        // nothing to resume
      }
    },
    send: (type, payload) => conn.send(type, payload),
    async leaveRoom() {
      await conn.leave();
      set({ view: null, link: 'online' });
    },
    clearError: () => set({ error: null }),
  };
});
