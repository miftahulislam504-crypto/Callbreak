// Framework-free wrapper around the Colyseus client (no React Native imports, so it can be
// exercised from Node: see scripts/smoke.ts).
import { Client, type Room } from '@colyseus/sdk';
import type { RoomView, ServerError } from './types';

const ROOM_NAME = 'callbreak';
const TOKEN_KEY = 'cb.reconnect';

export interface Identity {
  uid: string;
  name: string;
  /** Firebase ID token; null in local-guest mode (server must be in dev mode). */
  idToken: string | null;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

export interface Listeners {
  onState(view: RoomView): void;
  onError(error: ServerError): void;
  onLink(link: 'online' | 'reconnecting'): void;
  /** The room is gone for us: we left on purpose, or the seat was lost. */
  onClosed(reason: 'left' | 'lost'): void;
}

export interface CreateOptions {
  roomName?: string;
  isPrivate: boolean;
  targetScore: number;
}

interface Options {
  url: string;
  storage: KeyValueStorage;
  getIdentity: () => Promise<Identity>;
  listeners: Listeners;
}

export class GameConnection {
  private client: Client;
  private room: Room | null = null;
  private leaving = false;

  constructor(private opts: Options) {
    this.client = new Client(opts.url);
  }

  get inRoom(): boolean {
    return this.room !== null;
  }

  private async joinOptions(extra: Record<string, unknown> = {}) {
    const id = await this.opts.getIdentity();
    return { name: id.name, uid: id.uid, ...(id.idToken ? { idToken: id.idToken } : {}), ...extra };
  }

  async create(o: CreateOptions): Promise<void> {
    await this.dropCurrent();
    await this.attach(await this.client.create(ROOM_NAME, await this.joinOptions({ ...o })));
  }

  async join(roomCode: string): Promise<void> {
    await this.dropCurrent();
    await this.attach(await this.client.joinById(roomCode.trim().toUpperCase(), await this.joinOptions()));
  }

  async quickMatch(targetScore: number): Promise<void> {
    await this.dropCurrent();
    await this.attach(await this.client.joinOrCreate(ROOM_NAME, await this.joinOptions({ targetScore })));
  }

  /** Try to get back into the room we were in (app restarted / connection lost). */
  async resume(): Promise<boolean> {
    if (this.room) return true;
    const raw = await this.opts.storage.getItem(TOKEN_KEY);
    if (!raw) return false;
    try {
      const { token } = JSON.parse(raw) as { token: string };
      await this.attach(await this.client.reconnect(token));
      return true;
    } catch {
      await this.opts.storage.removeItem(TOKEN_KEY);
      return false;
    }
  }

  send(type: string, payload?: unknown): void {
    this.room?.send(type, payload);
  }

  async leave(): Promise<void> {
    const room = this.room;
    if (!room) return;
    this.leaving = true;
    try {
      await room.leave(true);
    } catch {
      // already gone
    } finally {
      if (this.room === room) this.room = null;
      await this.opts.storage.removeItem(TOKEN_KEY);
    }
  }

  private async dropCurrent(): Promise<void> {
    if (this.room) await this.leave();
  }

  private async attach(room: Room): Promise<void> {
    this.room = room;
    this.leaving = false;
    const L = this.opts.listeners;
    room.onMessage('state', (v: RoomView) => L.onState(v));
    room.onMessage('error', (e: ServerError) => L.onError(e));
    room.onDrop(() => L.onLink('reconnecting'));
    room.onReconnect(() => {
      L.onLink('online');
      void this.saveToken(room);
      room.send('sync');
    });
    room.onLeave(() => {
      if (this.room !== room) return;
      this.room = null;
      void this.opts.storage.removeItem(TOKEN_KEY);
      L.onClosed(this.leaving ? 'left' : 'lost');
    });
    await this.saveToken(room);
    room.send('sync');
  }

  private async saveToken(room: Room): Promise<void> {
    await this.opts.storage.setItem(TOKEN_KEY, JSON.stringify({ token: room.reconnectionToken, savedAt: Date.now() }));
  }
}
