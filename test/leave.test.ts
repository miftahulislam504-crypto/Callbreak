import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GameConnection, type Listeners } from '../src/lib/gameClient';

type Handler = (...args: unknown[]) => void;

/** A room whose socket is dead: `leave()` never answers, like a dropped connection that is still "reconnecting". */
function deadRoom() {
  const handlers: Record<string, Handler> = {};
  const room = {
    reconnectionToken: 'room:token',
    reconnection: { enabled: true, maxRetries: 15 },
    closed: 0,
    sent: [] as string[],
    connection: { close: () => { room.closed++; } },
    onMessage: (type: string, cb: Handler) => { handlers[type] = cb; },
    onDrop: (cb: Handler) => { handlers.drop = cb; },
    onReconnect: (cb: Handler) => { handlers.reconnect = cb; },
    onLeave: (cb: Handler) => { handlers.leave = cb; },
    send: (type: string) => { room.sent.push(type); },
    leave: () => new Promise<number>(() => {}),
  };
  return { room, handlers };
}

function setup() {
  const store = new Map<string, string>();
  const events: string[] = [];
  const listeners: Listeners = {
    onState: () => events.push('state'),
    onError: () => events.push('error'),
    onLink: (l) => events.push(`link:${l}`),
    onClosed: (r) => events.push(`closed:${r}`),
  };
  const conn = new GameConnection({
    url: 'ws://test',
    storage: {
      getItem: async (k) => store.get(k) ?? null,
      setItem: async (k, v) => { store.set(k, v); },
      removeItem: async (k) => { store.delete(k); },
    },
    getIdentity: async () => ({ uid: 'u1', name: 'Me', idToken: null }),
    listeners,
  });
  const { room, handlers } = deadRoom();
  (conn as unknown as { client: unknown }).client = { create: async () => room };
  return { conn, room, handlers, store, events };
}

test('leave finishes quickly even when the socket never answers', async () => {
  const { conn, room, store } = setup();
  await conn.create({ isPrivate: false });
  assert.equal(conn.inRoom, true);
  assert.ok(store.has('cb.reconnect'));

  const started = Date.now();
  await conn.leave();

  assert.ok(Date.now() - started < 3000, 'must not wait for the server forever');
  assert.equal(conn.inRoom, false);
  assert.equal(store.has('cb.reconnect'), false, 'the saved token must be gone');
  assert.equal(room.closed, 1, 'the socket is closed by force');
  assert.equal(room.reconnection.enabled, false, 'no automatic reconnect after leaving');
});

test('a room we have left stays silent: no late state, no token coming back', async () => {
  const { conn, handlers, store, events } = setup();
  await conn.create({ isPrivate: false });
  await conn.leave();
  events.length = 0;

  handlers.state?.({});
  handlers.drop?.();
  handlers.reconnect?.();
  handlers.leave?.();
  await new Promise((r) => setTimeout(r, 20));

  assert.deepEqual(events, []);
  assert.equal(store.has('cb.reconnect'), false);
});

test('leaving when there is no room does nothing', async () => {
  const { conn } = setup();
  await conn.leave();
  assert.equal(conn.inRoom, false);
});
