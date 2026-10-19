import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DECK, FLIGHT_MS, cardsReceived, dealProgress } from '../src/lib/dealing';
import { fmtPts } from '../src/lib/rules';

test('dealing: nothing has landed at the start, everything has when the animation is over', () => {
  assert.deepEqual(dealProgress(0, 3000), { launched: 1, landed: 0 });
  assert.equal(dealProgress(FLIGHT_MS - 1, 3000).landed, 0);
  assert.deepEqual(dealProgress(3000, 3000), { launched: DECK, landed: DECK });
  assert.deepEqual(dealProgress(9999, 3000), { launched: DECK, landed: DECK });
});

test('dealing: with no animation time (or a very short one) the hands are complete at once', () => {
  assert.deepEqual(dealProgress(0, 0), { launched: DECK, landed: DECK });
  assert.deepEqual(dealProgress(0, 200), { launched: DECK, landed: DECK });
});

test('dealing: progress only ever moves forward, and landed never runs ahead of launched', () => {
  let prev = { launched: 0, landed: 0 };
  for (let t = 0; t <= 3200; t += 25) {
    const p = dealProgress(t, 3000);
    assert.ok(p.launched >= prev.launched && p.landed >= prev.landed);
    assert.ok(p.landed <= p.launched);
    prev = p;
  }
});

test('dealing: cards go round the table one by one, 13 each at the end', () => {
  assert.deepEqual([0, 1, 2, 3].map((k) => cardsReceived(0, k)), [0, 0, 0, 0]);
  assert.deepEqual([0, 1, 2, 3].map((k) => cardsReceived(1, k)), [1, 0, 0, 0]);
  assert.deepEqual([0, 1, 2, 3].map((k) => cardsReceived(6, k)), [2, 2, 1, 1]);
  assert.deepEqual([0, 1, 2, 3].map((k) => cardsReceived(DECK, k)), [13, 13, 13, 13]);
  for (let landed = 0; landed <= DECK; landed++) {
    assert.equal([0, 1, 2, 3].reduce((a, k) => a + cardsReceived(landed, k), 0), landed);
  }
});

test('points are shown as whole numbers', () => {
  assert.equal(fmtPts(3), '3');
  assert.equal(fmtPts(-4), '-4');
  assert.equal(fmtPts(0), '0');
  assert.equal(fmtPts(3.2), '3.2'); // an older decimal total still reads correctly
});
