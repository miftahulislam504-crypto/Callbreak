import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CARD_RATIO, bigSuitSize, cardSize, cornerSizes, faceFrame, pipField, pipSpots } from '../src/lib/cardLayout';

test('card layout: every number card has as many pips as its rank, the others have none', () => {
  for (let r = 2; r <= 10; r++) assert.equal(pipSpots(r).length, r, `rank ${r}`);
  for (const r of [0, 1, 11, 12, 13, 14, 15]) assert.equal(pipSpots(r).length, 0, `rank ${r}`);
});

test('card layout: pips stay inside the pip field and no two pips share a spot', () => {
  for (let r = 2; r <= 10; r++) {
    const seen = new Set<string>();
    for (const p of pipSpots(r)) {
      assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1, `rank ${r} out of the field`);
      const k = `${p.x.toFixed(4)}:${p.y.toFixed(4)}`;
      assert.ok(!seen.has(k), `rank ${r} has two pips on ${k}`);
      seen.add(k);
    }
  }
});

test('card layout: the layout is mirrored left to right, and top to bottom (except the 7, as on a real card)', () => {
  for (let r = 2; r <= 10; r++) {
    const spots = pipSpots(r);
    const has = (x: number, y: number) => spots.some((p) => Math.abs(p.x - x) < 1e-9 && Math.abs(p.y - y) < 1e-9);
    for (const p of spots) {
      assert.ok(has(1 - p.x, p.y), `rank ${r}: ${p.x},${p.y} has no left-right twin`);
      // a real seven has one extra pip above the middle and none below it
      if (r !== 7) assert.ok(has(p.x, 1 - p.y), `rank ${r}: ${p.x},${p.y} has no top-bottom twin`);
    }
  }
});

test('card layout: a card is 1.4 times as tall as it is wide, with a sensible corner radius', () => {
  assert.equal(CARD_RATIO, 1.4);
  assert.deepEqual(cardSize(50), { width: 50, height: 70, radius: 5 });
  assert.equal(cardSize(20).radius, 3); // never sharper than 3
});

test('card layout: the pips fit between the corner indexes and do not touch each other', () => {
  for (const w of [34, 46, 60, 72]) {
    const { height } = cardSize(w);
    const f = pipField(w);
    // inside the card, clear of the edge line
    assert.ok(f.left - f.size / 2 > w * 0.2, `w${w}: left column too close to the edge`);
    assert.ok(f.left + f.width + f.size / 2 < w - w * 0.2, `w${w}: right column too close to the edge`);
    assert.ok(f.top - f.size / 2 > 0 && f.top + f.height + f.size / 2 < height, `w${w}: pips leave the card`);
    // the closest two pips of the busiest card (10) must not overlap
    const spots = pipSpots(10);
    let min = Infinity;
    for (let i = 0; i < spots.length; i++) {
      for (let j = i + 1; j < spots.length; j++) {
        const dx = (spots[i].x - spots[j].x) * f.width;
        const dy = (spots[i].y - spots[j].y) * f.height;
        min = Math.min(min, Math.hypot(dx, dy));
      }
    }
    assert.ok(min >= f.size * 0.95, `w${w}: pips of the 10 are ${min.toFixed(1)}px apart for a ${f.size.toFixed(1)}px symbol`);
  }
});

test('card layout: the face box and the big suit fit inside the card', () => {
  for (const w of [34, 46, 60, 72]) {
    const { height } = cardSize(w);
    for (const crest of [false, true]) {
      const f = faceFrame(w, crest);
      assert.ok(f.width < w * 0.6 && f.height < height * 0.7);
    }
    assert.ok(bigSuitSize(w, 14, false).line <= w * 0.8 + 1e-9);
    assert.ok(bigSuitSize(w, 5, true).size < w * 0.6);
  }
});

test('card layout: "full" designs use a smaller corner index than "single" ones', () => {
  for (const label of ['7', '10', 'K']) {
    assert.ok(cornerSizes(60, label, true).rank < cornerSizes(60, label, false).rank);
  }
  assert.ok(cornerSizes(60, '10', false).rank < cornerSizes(60, '7', false).rank); // two digits are set smaller
});
