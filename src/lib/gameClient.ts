// Framework-free wrapper around the Colyseus client (no React Native imports, so it can be
// exercised from Node: see scripts/smoke.ts).
import { Client, type Room } from '@colyseus/sdk';
import type { AnyRoomView, GameId, ServerError, VoiceDeniedReason, VoiceInfo } from './types';

const TOKEN_KEY = 'cb.reconnect';
const VOICE_REASONS: readonly VoiceDeniedReason[] = ['disabled', 'not_seated', 'rate_limited'];

/**
 * Turns a raw `voice` message into a VoiceInfo. Anything that is not a complete grant
 * (a missing token, a wrong type, an unknown reason) counts as "voice is not available",
 * so a bad message can never start a half-configured voice session.
 */
export function parseVoice(raw: unknown): VoiceInfo {
  const m = (raw ?? {}) as Record<string, unknown>;
  const { appId, channel, token, uid, expiresAt } = m;
  if (
    m.enabled === true &&
    typeof appId === 'string' && appId &&
    typeof channel === 'string' && channel &&
    typeof token === 'string' && token &&
    typeof uid === 'number' && Number.isInteger(uid) && uid >= 1 && // 0 would mean "Agora picks a uid", which breaks seat mapping
    typeof expiresAt === 'number' && Number.isFinite(expiresAt)
  ) {
    return { enabled: true, appId, channel, uid, token, expiresAt };
  }
  return { enabled: false, reason: VOICE_REASONS.find((r) => r === m.reason) ?? 'disabled' };
}

export interface Identity {
  uid: string;
  name: string;
  /** Profile photo (small JPEG data URI) shown on the table and in the lobby. */
  avatar?: string | null;
  /** Firebase ID token; null in local-guest mode (server must be in dev mode). */
  idToken: string | null;
}

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<unknown>;
  removeItem(key: string): Promise<unknown>;
}

export interface Listeners {
  onState(view: AnyRoomView): void;
  /** Photos per seat (null = no photo), sent only when they change. */
  onAvatars?(avatars: (string | null)[]): void;
  onError(error: ServerError): void;
  /** The server's answer to `requestVoice()`: a token to join with, or why there is none. */
  onVoice?(info: VoiceInfo): void;
  onLink(link: 'online' | 'reconnecting'): void;
  /** The room is gone for us: we left on purpose, or the seat was lost. */
  onClosed(reason: 'left' | 'lost'): void;
}

export interface CreateOptions {
  /** Which game to create a room for (Call Break when left out). */
  game?: GameId;
  roomName?: string;
  isPrivate: boolean;
  /** Call Break / 29: the score to reach. */
  targetScore?: number;
  /** Poker: everyone's starting chips. */
  startingChips?: number;
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
    return {
      name: id.name,
      uid: id.uid,
      ...(id.avatar ? { avatar: id.avatar } : {}),
      ...(id.idToken ? { idToken: id.idToken } : {}),
      ...extra,
    };
  }

  async create(o: CreateOptions): Promise<void> {
    const { game = 'callbreak', ...rest } = o;
    await this.dropCurrent();
    await this.attach(await this.client.create(game, await this.joinOptions({ ...rest })));
  }

  async join(roomCode: string): Promise<void> {
    await this.dropCurrent();
    await this.attach(await this.client.joinById(roomCode.trim().toUpperCase(), await this.joinOptions()));
  }

  /** `setting` is the target score (Call Break, 29) or the starting chips (poker): quick match pairs equal settings. */
  async quickMatch(game: GameId, setting: number): Promise<void> {
    await this.dropCurrent();
    const extra = game === 'poker' ? { startingChips: setting } : { targetScore: setting };
    await this.attach(await this.client.joinOrCreate(game, await this.joinOptions(extra)));
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
    } catch (e) {
      // A server we could not reach keeps our token for the next try; a refused token is dead.
      const m = String(e instanceof Error ? e.message : e);
      const code = String((e as { code?: unknown })?.code ?? '');
      const unreachable =
        /^(ECONN|ENOTFOUND|EAI_AGAIN|ETIMEDOUT)/.test(code) || /fetch failed|network request failed|timed out|aborted/i.test(m);
      if (!unreachable) await this.opts.storage.removeItem(TOKEN_KEY);
      return false;
    }
  }

  /** The app came back to the foreground: refresh the table, or get back into the room. */
  async onForeground(): Promise<'in-room' | 'resumed' | 'none'> {
    if (this.room) {
      try {
        this.room.send('sync');
      } catch {
        // the socket is already gone; the SDK's own reconnect takes over
      }
      return 'in-room';
    }
    return (await this.resume()) ? 'resumed' : 'none';
  }

  send(type: string, payload?: unknown): void {
    this.room?.send(type, payload);
  }

  /**
   * Asks the server for a voice token; the answer arrives through `onVoice`.
   * Returns false when there is no room to ask in (or the socket is already gone).
   */
  requestVoice(): boolean {
    const room = this.room;
    if (!room) return false;
    try {
      room.send('voiceToken');
      return true;
    } catch {
      return false; // the SDK's own reconnect takes over
    }
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
    room.onMessage('state', (v: AnyRoomView) => L.onState(v));
    room.onMessage('avatars', (m: { avatars?: unknown }) => {
      if (Array.isArray(m?.avatars)) L.onAvatars?.(m.avatars.map((a) => (typeof a === 'string' && a ? a : null)));
    });
    room.onMessage('error', (e: ServerError) => L.onError(e));
    room.onMessage('voice', (m: unknown) => L.onVoice?.(parseVoice(m)));
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
