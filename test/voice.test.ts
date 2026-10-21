import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';

import { parseVoice } from '../src/lib/gameClient';
import type { VoiceGrant } from '../src/lib/types';
import { useVoice } from '../src/state/voice';

const grant: VoiceGrant = {
  enabled: true,
  appId: '0123456789abcdef0123456789abcdef',
  channel: 'cb-ABC234',
  uid: 2,
  token: '007token',
  expiresAt: 1_800_000_000_000,
};

describe('parseVoice', () => {
  test('a complete grant passes through (and extra fields are dropped)', () => {
    assert.deepEqual(parseVoice({ ...grant, surprise: 'x' }), grant);
  });

  test('a refusal keeps its known reason', () => {
    for (const reason of ['disabled', 'not_seated', 'rate_limited'] as const) {
      assert.deepEqual(parseVoice({ enabled: false, reason }), { enabled: false, reason });
    }
  });

  test('an unknown or missing reason becomes "disabled"', () => {
    assert.deepEqual(parseVoice({ enabled: false, reason: 'quota' }), { enabled: false, reason: 'disabled' });
    assert.deepEqual(parseVoice({ enabled: false }), { enabled: false, reason: 'disabled' });
  });

  test('garbage is "voice not available", never a crash', () => {
    for (const raw of [null, undefined, 'voice', 42, [], {}, { enabled: 'yes' }]) {
      assert.deepEqual(parseVoice(raw), { enabled: false, reason: 'disabled' }, String(raw));
    }
  });

  test('an incomplete or malformed grant is not a grant', () => {
    const bad: Record<string, unknown>[] = [
      { ...grant, token: '' },
      { ...grant, token: undefined },
      { ...grant, appId: '' },
      { ...grant, channel: 7 },
      { ...grant, uid: 0 }, // 0 would let Agora pick a uid and break seat mapping
      { ...grant, uid: 1.5 },
      { ...grant, uid: '2' },
      { ...grant, expiresAt: Number.NaN },
      { ...grant, expiresAt: '1800000000000' },
    ];
    for (const raw of bad) assert.equal(parseVoice(raw).enabled, false, JSON.stringify(raw));
  });
});

describe('useVoice', () => {
  beforeEach(() => useVoice.getState().reset());
  const s = () => useVoice.getState();

  test('starts off, mic muted, nobody speaking or muted', () => {
    assert.equal(s().status, 'off');
    assert.equal(s().micOn, false);
    assert.equal(s().grant, null);
    assert.equal(s().denied, null);
    assert.deepEqual(s().speaking, [false, false, false, false]);
    assert.deepEqual(s().mutedSeats, [false, false, false, false]);
  });

  test('a grant starts connecting; a renewal while on keeps the status', () => {
    s().receive(grant);
    assert.equal(s().status, 'connecting');
    assert.deepEqual(s().grant, grant);

    s().setStatus('on');
    s().receive({ ...grant, token: 'renewed' });
    assert.equal(s().status, 'on', 'no flicker on renewal');
    assert.equal(s().grant?.token, 'renewed');
  });

  test('a refusal turns voice off and records why; the next grant clears it', () => {
    s().receive({ enabled: false, reason: 'not_seated' });
    assert.equal(s().status, 'off');
    assert.equal(s().denied, 'not_seated');
    assert.equal(s().grant, null);

    s().receive(grant);
    assert.equal(s().denied, null);
    assert.equal(s().status, 'connecting');
  });

  test('a refusal while on does not cut the call', () => {
    s().receive(grant);
    s().setStatus('on');
    s().setMic(true);
    s().receive({ enabled: false, reason: 'rate_limited' });
    assert.equal(s().status, 'on');
    assert.equal(s().micOn, true);
    assert.deepEqual(s().grant, grant, 'the token we joined with is kept');
    assert.equal(s().denied, 'rate_limited');
  });

  test('the mic can only be on while connected, and leaving switches it off', () => {
    s().setMic(true);
    assert.equal(s().micOn, false, 'ignored while off');
    s().receive(grant);
    s().setMic(true);
    assert.equal(s().micOn, false, 'ignored while connecting');

    s().setStatus('on');
    s().setMic(true);
    assert.equal(s().micOn, true);
    s().setMic(false);
    assert.equal(s().micOn, false);

    s().setMic(true);
    s().setSpeaking([0, 2]);
    s().setStatus('error');
    assert.equal(s().micOn, false);
    assert.deepEqual(s().speaking, [false, false, false, false]);
    assert.notEqual(s().grant, null, 'a failed join keeps the grant for a retry');

    s().setStatus('off');
    assert.equal(s().grant, null, 'off drops the grant');
  });

  test('speaking is per seat, ignores bad seats, and is ignored while not on', () => {
    s().setSpeaking([1]);
    assert.deepEqual(s().speaking, [false, false, false, false], 'ignored while off');

    s().receive(grant);
    s().setStatus('on');
    s().setSpeaking([1, 3, 9, -1, 1.5]);
    assert.deepEqual(s().speaking, [false, true, false, true]);
    s().setSpeaking([]);
    assert.deepEqual(s().speaking, [false, false, false, false]);
  });

  test('speaking does not create a new array when nothing changed (no needless re-render)', () => {
    s().receive(grant);
    s().setStatus('on');
    s().setSpeaking([2]);
    const before = s().speaking;
    s().setSpeaking([2]);
    assert.equal(s().speaking, before);
  });

  test('muted seats are per seat, validated, kept across reconnects and cleared by reset', () => {
    s().setSeatMuted(2, true);
    s().setSeatMuted(7, true);
    s().setSeatMuted(-1, true);
    assert.deepEqual(s().mutedSeats, [false, false, true, false]);

    s().receive(grant);
    s().setStatus('on');
    s().setStatus('off'); // e.g. app went to the background and came back
    assert.deepEqual(s().mutedSeats, [false, false, true, false]);

    s().setSeatMuted(2, false);
    assert.deepEqual(s().mutedSeats, [false, false, false, false]);

    s().setSeatMuted(0, true);
    s().reset();
    assert.deepEqual(s().mutedSeats, [false, false, false, false]);
    assert.equal(s().status, 'off');
  });
});
