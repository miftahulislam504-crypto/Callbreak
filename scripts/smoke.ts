// Runs the app's GameConnection against a real, dev-mode server.
//   server:  cd callbreak-server && PORT=2599 npx tsx src/server.ts
//   this:    cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/smoke.ts
import assert from 'node:assert/strict';
import { GameConnection, type KeyValueStorage } from '../src/lib/gameClient';
import type { RoomView } from '../src/lib/types';

const URL = process.env.SERVER ?? 'ws://localhost:2599';

function memStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
}

function player(name: string) {
  const storage = memStorage();
  const state: { view: RoomView | null; errors: string[]; closed: string[] } = { view: null, errors: [], closed: [] };
  const conn = new GameConnection({
    url: URL,
    storage,
    getIdentity: async () => ({ uid: `uid-${name}`, name, idToken: null }),
    listeners: {
      onState: (v) => (state.view = v),
      onError: (e) => state.errors.push(e.code),
      onLink: () => {},
      onClosed: (r) => state.closed.push(r),
    },
  });
  return { conn, storage, state };
}

async function until(cond: () => boolean, what: string, ms = 5000) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > ms) throw new Error(`timeout waiting for: ${what}`);
    await new Promise((r) => setTimeout(r, 25));
  }
}

async function main() {
  const a = player('Alice');
  const b = player('Bob');

  await a.conn.create({ roomName: 'Smoke', isPrivate: true, targetScore: 29 });
  await until(() => a.state.view !== null, 'host state');
  const code = a.state.view!.roomCode;
  assert.equal(code.length, 6);
  assert.equal(a.state.view!.isPrivate, true);
  assert.ok(a.storage.data.has('cb.reconnect'), 'reconnect token saved after create');

  await b.conn.join(code.toLowerCase()); // lower-case input must work
  await until(() => b.state.view !== null && b.state.view.seats.filter((s) => s.occupied).length === 2, 'two players');
  assert.equal(b.state.view!.mySeat === a.state.view!.hostSeat, false);

  // private rooms are not listed, public API answers
  const list = (await (await fetch(URL.replace(/^ws/, 'http') + '/rooms')).json()) as { roomCode: string }[];
  assert.ok(!list.some((r) => r.roomCode === code), 'private room hidden from /rooms');

  // only the host can change things; the client surfaces the server error code
  b.conn.send('setTarget', { targetScore: 49 });
  await until(() => b.state.errors.includes('not_host'), 'not_host error for guest');

  a.conn.send('setTarget', { targetScore: 49 });
  await until(() => b.state.view?.targetScore === 49, 'target synced to guest');

  a.conn.send('start', { fillBots: true });
  await until(() => b.state.view?.status === 'bidding' && b.state.view.game !== null, 'game started');
  assert.equal(b.state.view!.game!.myHand.length, 13);
  assert.equal(b.state.view!.game!.targetScore, 49);

  // leaving clears the saved token and reports 'left'
  await b.conn.leave();
  assert.equal(b.storage.data.has('cb.reconnect'), false, 'token cleared on leave');
  await until(() => b.state.closed.includes('left') || b.state.view === null, 'closed after leave');

  // resume with a bogus token fails cleanly and clears it
  const c = player('Carol');
  await c.storage.setItem('cb.reconnect', JSON.stringify({ token: 'bogus', savedAt: Date.now() }));
  assert.equal(await c.conn.resume(), false);
  assert.equal(c.storage.data.has('cb.reconnect'), false);

  await a.conn.leave();
  console.log('smoke: OK');
  process.exit(0);
}

main().catch((e) => {
  console.error('smoke: FAILED', e);
  process.exit(1);
});
