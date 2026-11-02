import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BOARDS, BOARD_LIST, CARD_BACKS, CARD_BACK_LIST, CARD_DESIGNS, CARD_DESIGN_LIST, DEFAULT_LOOK, parseLook, withAlpha,
} from '../src/constants/themes';

test('looks: the lists and the tables hold the same looks, each under its own id', () => {
  assert.equal(CARD_DESIGN_LIST.length, Object.keys(CARD_DESIGNS).length);
  assert.equal(CARD_BACK_LIST.length, Object.keys(CARD_BACKS).length);
  assert.equal(BOARD_LIST.length, Object.keys(BOARDS).length);
  for (const d of CARD_DESIGN_LIST) assert.equal(CARD_DESIGNS[d.id], d);
  for (const b of CARD_BACK_LIST) assert.equal(CARD_BACKS[b.id], b);
  for (const b of BOARD_LIST) assert.equal(BOARDS[b.id], b);
});

test('looks: every card design points at a back that exists, and names are unique', () => {
  for (const d of CARD_DESIGN_LIST) assert.ok(CARD_BACKS[d.back], `${d.id} -> ${d.back}`);
  for (const list of [CARD_DESIGN_LIST, CARD_BACK_LIST, BOARD_LIST] as { name: string }[][]) {
    assert.equal(new Set(list.map((x) => x.name)).size, list.length);
  }
});

test('looks: the default look is the original one and all of its parts exist', () => {
  assert.deepEqual(DEFAULT_LOOK, { card: 'classic', back: 'sapphire', board: 'walnut' });
  assert.equal(CARD_DESIGNS[DEFAULT_LOOK.card].back, DEFAULT_LOOK.back);
});

test('looks: suit colours are valid, and only the four-colour deck tells all four suits apart', () => {
  for (const d of CARD_DESIGN_LIST) {
    for (const s of ['S', 'H', 'D', 'C'] as const) assert.match(d.ink[s], /^#[0-9a-f]{6}$/i, `${d.id} ${s}`);
    const colours = new Set(Object.values(d.ink).map((c) => c.toLowerCase()));
    assert.equal(colours.size, d.id === 'fourColor' ? 4 : 2, d.id);
    // the two red suits and the two dark suits must differ from each other in every deck
    assert.notEqual(d.ink.H.toLowerCase(), d.ink.S.toLowerCase(), d.id);
  }
});

test('looks: a card face is readable on its paper (enough contrast between ink and paper)', () => {
  const lum = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  };
  const ratio = (a: string, b: string) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  for (const d of CARD_DESIGN_LIST) {
    for (const s of ['S', 'H', 'D', 'C'] as const) {
      assert.ok(ratio(d.ink[s], d.paper) >= 4, `${d.id} ${s}: contrast ${ratio(d.ink[s], d.paper).toFixed(2)}`);
    }
  }
});

test('looks: withAlpha turns a hex colour into rgba and leaves anything else alone', () => {
  assert.equal(withAlpha('#D9363E', 0.5), 'rgba(217,54,62,0.5)');
  assert.equal(withAlpha('#000000', 0), 'rgba(0,0,0,0)');
  assert.equal(withAlpha('rgba(1,2,3,0.4)', 0.5), 'rgba(1,2,3,0.4)');
  assert.equal(withAlpha('red', 0.5), 'red');
});

test('looks: a saved look is read back; anything broken or unknown falls back to the default', () => {
  assert.deepEqual(parseLook(JSON.stringify({ card: 'royal', back: 'jade', board: 'felt' })), { card: 'royal', back: 'jade', board: 'felt' });
  assert.deepEqual(parseLook(null), DEFAULT_LOOK);
  assert.deepEqual(parseLook(undefined), DEFAULT_LOOK);
  assert.deepEqual(parseLook(''), DEFAULT_LOOK);
  assert.deepEqual(parseLook('not json'), DEFAULT_LOOK);
  assert.deepEqual(parseLook('null'), DEFAULT_LOOK);
  assert.deepEqual(parseLook('42'), DEFAULT_LOOK);
  // one unknown part (a look that was removed later) does not throw the other parts away
  assert.deepEqual(parseLook(JSON.stringify({ card: 'gone', back: 'night', board: 'velvet' })), { card: 'classic', back: 'night', board: 'velvet' });
  // names from the prototype chain are not looks
  assert.deepEqual(parseLook(JSON.stringify({ card: 'toString', back: '__proto__', board: 'constructor' })), DEFAULT_LOOK);
});
