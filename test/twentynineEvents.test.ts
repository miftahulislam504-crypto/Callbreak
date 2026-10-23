import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diffGame } from '../src/lib/tableEvents';
import { TrickPlayer } from '../src/lib/trickPlayer';
import type { Card, Suit, TNGameView } from '../src/lib/types';

const c = (suit: Suit, rank: number): Card => ({ suit, rank });
const play = (seat: number, card: Card, asTrump = false) => ({ seat, card, asTrump });
const base: TNGameView = {
  phase: 'playing', round: 1, dealer: 0, turn: 1, targetScore: 3, minBid: 16, maxBid: 28, maxRounds: 20,
  myHand: [], legal: [], canReveal: false, handCounts: [8, 8, 8, 8], bids: [0, 16, 0, 0], highBid: 16, highBidder: 1,
  forcedBid: false, declarer: 1, contract: 16, need: 16, trumpSuit: null, trumpRevealed: false, trumpHidden: true,
  revealedBy: -1, pair: null, tricksWon: [0, 0, 0, 0], teamPoints: [0, 0], trick: [], lastTrick: null, totals: [0, 0],
  history: [], winners: null, ranking: null,
};
const g = (p: Partial<TNGameView>): TNGameView => ({ ...base, ...p });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('29: cards played and a finished trick are animated like in Call Break', () => {
  const three = [play(1, c('H', 14)), play(2, c('H', 11)), play(3, c('H', 8))];
  assert.deepEqual(diffGame(g({ trick: three.slice(0, 2) }), g({ trick: three })), [{ type: 'played', seat: 3, card: c('H', 8) }]);

  const done = [...three, play(0, c('H', 9))];
  const ev = diffGame(
    g({ trick: three }),
    g({ trick: [], tricksWon: [0, 0, 1, 0], lastTrick: { cards: done, winner: 2, points: 6 } }),
  );
  assert.deepEqual(ev, [{ type: 'played', seat: 0, card: c('H', 9) }, { type: 'trickWon', seat: 2 }]);
});

test('29: a new round (new deal) resets the table; asking for trump changes nothing on the table', () => {
  assert.deepEqual(diffGame(g({ round: 1 }), g({ round: 2 })), [{ type: 'reset' }]);
  assert.deepEqual(diffGame(g({}), g({ trumpRevealed: true, trumpSuit: 'S', revealedBy: 2 })), []);
});

test('29: the trick player shows a 29 state as it is on first sight', async () => {
  const three = [play(1, c('H', 14)), play(2, c('H', 11)), play(3, c('H', 8))];
  const p = new TrickPlayer(g({ trick: three }), { playMs: 0, holdMs: 0, sweepMs: 0 });
  assert.equal(p.getSnapshot().shown.length, 3);
  p.update(g({ trick: [...three, play(0, c('H', 9))] }));
  await sleep(20);
  assert.equal(p.getSnapshot().shown.length, 4);
  p.dispose();
});
