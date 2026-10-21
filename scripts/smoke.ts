// Runs the app's GameConnection against a real, dev-mode server.
//   server:  cd callbreak-server && CB_FAST=1 PORT=2599 npx tsx src/server.ts   (CB_FAST: no 60 s look-at-cards wait)
//   this:    cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/smoke.ts
// Voice: without Agora keys the server answers `voiceToken` with "disabled", and that is checked too.
// To check the token path, start the server with AGORA_APP_ID and AGORA_APP_CERTIFICATE (any 32-hex pair
// gives a well-formed token; only real keys make Agora accept it) and add EXPECT_VOICE=on to this command.
// EXPECT_VOICE=off requires "disabled"; unset accepts either.
import assert from 'node:assert/strict';
import { GameConnection, type KeyValueStorage } from '../src/lib/gameClient';
import type { RoomView, VoiceInfo } from '../src/lib/types';

const URL = process.env.SERVER ?? 'ws://localhost:2599';
const EXPECT_VOICE = process.env.EXPECT_VOICE; // 'on' | 'off' | unset
/** The server's CB_VOICE_TOKEN_MIN_GAP_MS (default 5000): how long to wait before asking for a renewal. */
const VOICE_GAP_MS = Number(process.env.CB_VOICE_TOKEN_MIN_GAP_MS ?? 5000);

function memStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: async (k) => data.get(k) ?? null,
    setItem: async (k, v) => void data.set(k, v),
    removeItem: async (k) => void data.delete(k),
  };
}

function player(name: string, url: string = URL) {
  const storage = memStorage();
  const state: { view: RoomView | null; errors: string[]; closed: string[]; voice: VoiceInfo[] } = { view: null, errors: [], closed: [], voice: [] };
  const conn = new GameConnection({
    url,
    storage,
    getIdentity: async () => ({ uid: `uid-${name}`, name, idToken: null }),
    listeners: {
      onState: (v) => (state.view = v),
      onError: (e) => state.errors.push(e.code),
      onVoice: (v) => state.voice.push(v),
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

  // voice: every `voiceToken` gets exactly one `voice` answer, and it never disturbs the lobby
  assert.equal(a.conn.requestVoice(), true);
  await until(() => a.state.voice.length === 1, 'voice answer for the host');
  const va = a.state.voice[0];
  if (va.enabled) {
    assert.equal(va.channel, `cb-${code}`);
    assert.equal(va.uid, a.state.view!.mySeat + 1, 'uid = seat + 1');
    assert.ok(va.appId.length > 0 && va.token.length > 0, 'grant carries an app id and a token');
    assert.ok(va.expiresAt > Date.now(), 'token is not already expired');
    a.conn.requestVoice(); // asking again right away is rate-limited
    await until(() => a.state.voice.length === 2, 'second voice answer');
    assert.deepEqual(a.state.voice[1], { enabled: false, reason: 'rate_limited' });
    b.conn.requestVoice(); // the limit is per client, and the guest sits in another seat
    await until(() => b.state.voice.length === 1, 'voice answer for the guest');
    const vb = b.state.voice[0];
    if (!vb.enabled) throw new Error(`guest got no voice token: ${vb.reason}`);
    assert.equal(vb.uid, b.state.view!.mySeat + 1);
    assert.notEqual(vb.uid, va.uid);

    // renewal: once the server's gap has passed, the same seat gets a fresh grant for the same channel and uid
    // (the app asks about 5 minutes before the token expires and hands the new token to the SDK).
    await new Promise((r) => setTimeout(r, VOICE_GAP_MS + 300));
    assert.equal(a.conn.requestVoice(), true);
    await until(() => a.state.voice.length === 3, 'renewed voice token for the host');
    const vr = a.state.voice[2];
    if (!vr.enabled) throw new Error(`renewal refused: ${vr.reason}`);
    assert.equal(vr.channel, va.channel);
    assert.equal(vr.uid, va.uid);
    assert.ok(vr.expiresAt >= va.expiresAt, 'the renewed token does not expire earlier');
  } else {
    assert.equal(va.reason, 'disabled');
  }
  if (EXPECT_VOICE === 'on') assert.ok(va.enabled, 'EXPECT_VOICE=on, but the server has voice disabled');
  if (EXPECT_VOICE === 'off') assert.ok(!va.enabled, 'EXPECT_VOICE=off, but the server issued a token');
  console.log(`smoke: voice ${va.enabled ? 'enabled (token issued)' : `disabled (${va.reason})`}`);

  a.conn.send('start', { fillBots: true });
  // Round 1 has no bidding (CB_NO_BID_ROUNDS), so the first status after dealing is 'playing', not 'bidding'.
  await until(() => (b.state.view?.status === 'bidding' || b.state.view?.status === 'playing') && b.state.view.game !== null, 'game started');
  assert.equal(b.state.view!.game!.myHand.length, 13);
  assert.equal(b.state.view!.game!.targetScore, 49);

  // leaving clears the saved token and reports 'left'
  await b.conn.leave();
  assert.equal(b.storage.data.has('cb.reconnect'), false, 'token cleared on leave');
  await until(() => b.state.closed.includes('left') || b.state.view === null, 'closed after leave');

  // resume with a bogus token fails cleanly and clears it
  const c = player('Carol');
  await c.storage.setItem('cb.reconnect', JSON.stringify({ token: 'ZZZZZZ:bogus', savedAt: Date.now() }));
  assert.equal(await c.conn.resume(), false);
  assert.equal(c.storage.data.has('cb.reconnect'), false);

  // coming back to the foreground: a connected client refreshes; one with nothing to resume says so
  assert.equal(await a.conn.onForeground(), 'in-room');
  assert.equal(await player('Dave').conn.onForeground(), 'none');
  assert.equal(player('Frank').conn.requestVoice(), false, 'no room, nothing to ask');

  // an unreachable server (still asleep) keeps the token so a later resume can work
  const eve = player('Eve', 'ws://localhost:1');
  await eve.storage.setItem('cb.reconnect', JSON.stringify({ token: 'ZZZZZZ:tok', savedAt: Date.now() }));
  assert.equal(await eve.conn.resume(), false);
  assert.equal(eve.storage.data.has('cb.reconnect'), true, 'token kept when the server is unreachable');

  await a.conn.leave();
  console.log('smoke: OK');
  process.exit(0);
}

main().catch((e) => {
  console.error('smoke: FAILED', e);
  process.exit(1);
});
