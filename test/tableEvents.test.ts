import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diffGame } from '../src/lib/tableEvents';
import { TrickPlayer } from '../src/lib/trickPlayer';
import type { Card, GameView, Suit } from '../src/lib/types';

const c = (suit: Suit, rank: number): Card => ({ suit, rank });
const base: GameView = {
  phase: 'playing', round: 1, dealer: 0, turn: 1, targetScore: 29, minBid: 1, maxBid: 8, maxRounds: 30,
  myHand: [], legal: [], handCounts: [13, 13, 13, 13], bids: [2, 2, 2, 2], tricksWon: [0, 0, 0, 0],
  trick: [], lastTrick: null, totals: [0, 0, 0, 0], history: [], winners: null, ranking: null,
};
const g = (p: Partial<GameView>): GameView => ({ ...base, ...p });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const three = [
  { seat: 1, card: c('H', 5) },
  { seat: 2, card: c('H', 9) },
  { seat: 3, card: c('H', 2) },
];
const done = [...three, { seat: 0, card: c('H', 12) }];

test('no previous state, or no change: no events', () => {
  assert.deepEqual(diffGame(null, g({})), []);
  assert.deepEqual(diffGame(g({ trick: three }), g({ trick: three })), []);
});

test('a new card in the same trick', () => {
  const ev = diffGame(g({ trick: three.slice(0, 2) }), g({ trick: three }));
  assert.deepEqual(ev, [{ type: 'played', seat: 3, card: c('H', 2) }]);
});

test('4th card completes the trick: it only appears in lastTrick', () => {
  const ev = diffGame(
    g({ trick: three }),
    g({ trick: [], lastTrick: { cards: done, winner: 0 }, tricksWon: [1, 0, 0, 0], turn: 0 }),
  );
  assert.deepEqual(ev, [
    { type: 'played', seat: 0, card: c('H', 12) },
    { type: 'trickWon', seat: 0 },
  ]);
});

test('winner already led the next trick in the same state', () => {
  const lead = { seat: 0, card: c('S', 3) };
  const ev = diffGame(
    g({ trick: three }),
    g({ trick: [lead], lastTrick: { cards: done, winner: 0 }, tricksWon: [1, 0, 0, 0], turn: 1 }),
  );
  assert.deepEqual(ev.map((e) => e.type), ['played', 'trickWon', 'played']);
  assert.deepEqual(ev[2], { type: 'played', seat: 0, card: c('S', 3) });
});

test('new round or lobby resets; missing several tricks resets and shows the current trick', () => {
  assert.deepEqual(diffGame(g({ tricksWon: [3, 3, 3, 4] }), g({ round: 2 })), [{ type: 'reset' }]);
  assert.deepEqual(diffGame(g({}), g({ phase: 'lobby' })), [{ type: 'reset' }]);
  const ev = diffGame(g({ tricksWon: [1, 0, 0, 0] }), g({ tricksWon: [2, 1, 1, 0], trick: three.slice(0, 1) }));
  assert.deepEqual(ev.map((e) => e.type), ['reset', 'played']);
});

test('TrickPlayer: cards appear, the finished trick holds, then is swept away', async () => {
  const p = new TrickPlayer(g({ trick: three }), { playMs: 5, holdMs: 40, sweepMs: 40 });
  assert.equal(p.getSnapshot().shown.length, 3);
  p.update(g({ trick: [], lastTrick: { cards: done, winner: 0 }, tricksWon: [1, 0, 0, 0], turn: 0 }));
  assert.equal(p.getSnapshot().shown.length, 4);
  assert.equal(p.getSnapshot().idle, false);
  await sleep(60);
  assert.equal(p.getSnapshot().sweepTo, 0);
  assert.equal(p.getSnapshot().shown.length, 4);
  await sleep(60);
  assert.equal(p.getSnapshot().shown.length, 0);
  assert.equal(p.getSnapshot().sweepTo, null);
  assert.equal(p.getSnapshot().idle, true);
  p.dispose();
});

test('TrickPlayer: a burst of states is animated in order, and a reset cuts the queue', async () => {
  const p = new TrickPlayer(g({}), { playMs: 20, holdMs: 20, sweepMs: 20 });
  p.update(g({ trick: three.slice(0, 1) }));
  p.update(g({ trick: three.slice(0, 2) }));
  p.update(g({ trick: three }));
  assert.equal(p.getSnapshot().shown.length, 1); // only the first has landed
  await sleep(30);
  assert.equal(p.getSnapshot().shown.length, 2);
  p.update(g({ round: 2 })); // new round
  assert.equal(p.getSnapshot().shown.length, 0);
  assert.equal(p.getSnapshot().idle, true);
  await sleep(60);
  assert.equal(p.getSnapshot().shown.length, 0);
  p.dispose();
});

test('TrickPlayer: first state mid-trick (resume) is shown instantly', () => {
  const p = new TrickPlayer(null);
  p.update(g({ trick: three }));
  assert.equal(p.getSnapshot().shown.length, 3);
});
