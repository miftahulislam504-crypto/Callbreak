// Plays full games over the real wire (1 human + 3 bots) and checks that the table display
// (TrickPlayer) always ends up showing exactly what the server says is on the table.
//   server:  cd callbreak-server && CB_FAST=1 PORT=2599 npx tsx src/server.ts
//   this:    cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/playthrough.ts
import assert from 'node:assert/strict';
import { GameConnection, type KeyValueStorage } from '../src/lib/gameClient';
import { TrickPlayer } from '../src/lib/trickPlayer';
import type { RoomView } from '../src/lib/types';

const URL = process.env.SERVER ?? 'ws://localhost:2599';
const GAMES = Number(process.env.GAMES ?? 3);
const storage: KeyValueStorage = { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sig = (cards: { seat: number; card: { suit: string; rank: number } }[]) => cards.map((p) => `${p.seat}${p.card.suit}${p.card.rank}`).join(',');

async function playOne(n: number) {
  let view: RoomView | null = null;
  const conn = new GameConnection({
    url: URL, storage, getIdentity: async () => ({ uid: `pt-${n}`, name: 'Human', idToken: null }),
    listeners: { onState: (v) => (view = v), onError: (e) => { throw new Error(`server error ${e.code}`); }, onLink: () => {}, onClosed: () => {} },
  });
  await conn.create({ isPrivate: true, targetScore: 29 });
  while (!view) await sleep(10);
  conn.send('start', { fillBots: true });

  const player = new TrickPlayer(null, { playMs: 0, holdMs: 0, sweepMs: 0 });
  let states = 0, moves = 0, lastSig = '', mismatches = 0, rounds = 0;
  const t0 = Date.now();
  for (;;) {
    const v = view as RoomView | null;
    if (v && v.game) {
      const sg = JSON.stringify([v.serverTime, v.game.round, v.game.turn, v.game.handCounts, v.game.trick]);
      if (sg !== lastSig) {
        lastSig = sg;
        states++;
        player.update(v.game);
        await sleep(2); // let the zero-length timers run
        const snap = player.getSnapshot();
        if (snap.idle && v.game.phase === 'playing' && sig(snap.shown) !== sig(v.game.trick)) mismatches++;
        rounds = v.game.round;
        if (v.game.phase === 'finished') break;
        const g = v.game;
        if (g.turn === v.mySeat) {
          if (g.phase === 'bidding') { conn.send('bid', { bid: 2 }); moves++; }
          else if (g.phase === 'playing' && g.legal.length) { conn.send('play', g.legal[0]); moves++; }
        }
      }
    }
    if (Date.now() - t0 > 90_000) throw new Error('timeout');
    await sleep(5);
  }
  await conn.leave();
  return { states, moves, mismatches, rounds };
}

(async () => {
  for (let i = 1; i <= GAMES; i++) {
    const r = await playOne(i);
    console.log(`game ${i}: ${r.rounds} rounds, ${r.moves} human moves, ${r.states} states, mismatches=${r.mismatches}`);
    assert.equal(r.mismatches, 0);
  }
  console.log('playthrough: OK');
  process.exit(0);
})().catch((e) => { console.error('playthrough: FAILED', e); process.exit(1); });
