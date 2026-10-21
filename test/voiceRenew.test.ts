import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { classifyFailure } from '../src/lib/voice/failure';
import { MIN_RENEW_GAP_MS, RENEW_LEAD_MS, renewDelayMs } from '../src/lib/voice/renew';
import { audioRouteKind, routeCausesEcho } from '../src/lib/voice/route';

const MIN = 60_000;

describe('renewDelayMs', () => {
  test('a one-hour token is renewed 5 minutes before it ends', () => {
    const now = 1_000_000;
    assert.equal(renewDelayMs(now + 60 * MIN, now), 60 * MIN - RENEW_LEAD_MS);
  });

  test('a later look at the same token gives the remaining wait', () => {
    const expiresAt = 10_000_000;
    assert.equal(renewDelayMs(expiresAt, expiresAt - 20 * MIN), 15 * MIN);
  });

  test('a short token is renewed halfway, not 5 minutes before it ends', () => {
    const now = 0;
    assert.equal(renewDelayMs(now + 10 * MIN, now), 5 * MIN);
    assert.equal(renewDelayMs(now + 4 * MIN, now), 2 * MIN);
  });

  test('never sooner than the minimum gap, even when the phone clock is far ahead of the server', () => {
    const now = 5_000_000;
    assert.equal(renewDelayMs(now - 3_600_000, now), MIN_RENEW_GAP_MS); // already "expired" by the phone clock
    assert.equal(renewDelayMs(now, now), MIN_RENEW_GAP_MS);
    assert.equal(renewDelayMs(now + 30_000, now), MIN_RENEW_GAP_MS);
  });

  test('a phone clock far behind the server gives a long wait (the SDK 30-second callback is the safety net)', () => {
    const now = 0;
    assert.equal(renewDelayMs(now + 3 * 60 * MIN, now), 3 * 60 * MIN - RENEW_LEAD_MS);
  });
});

describe('classifyFailure', () => {
  test('refused by the service', () => {
    for (const r of [3, 6, 10]) assert.equal(classifyFailure(r), 'service', String(r));
  });
  test('token problems', () => {
    for (const r of [8, 9]) assert.equal(classifyFailure(r), 'token', String(r));
  });
  test('lost connection', () => {
    for (const r of [2, 14, 16]) assert.equal(classifyFailure(r), 'network', String(r));
  });
  test('anything else is "other", never a crash', () => {
    for (const r of [0, 1, 4, 7, 99, -1, Number.NaN]) assert.equal(classifyFailure(r), 'other', String(r));
  });
});

describe('audioRouteKind', () => {
  test('wired, USB and Bluetooth headsets', () => {
    assert.equal(audioRouteKind(0), 'headset');
    assert.equal(audioRouteKind(2), 'headset');
    assert.equal(audioRouteKind(6), 'headset');
    assert.equal(audioRouteKind(5), 'bluetooth');
    assert.equal(audioRouteKind(10), 'bluetooth');
  });
  test('phone speaker and earpiece', () => {
    assert.equal(audioRouteKind(3), 'speaker');
    assert.equal(audioRouteKind(4), 'speaker');
    assert.equal(audioRouteKind(1), 'earpiece');
  });
  test('default and unknown codes', () => {
    for (const c of [-1, 7, 8, 9, 42]) assert.equal(audioRouteKind(c), 'unknown', String(c));
  });
  test('echo is a risk unless a headset or Bluetooth is in use', () => {
    assert.equal(routeCausesEcho('speaker'), true);
    assert.equal(routeCausesEcho('earpiece'), true);
    assert.equal(routeCausesEcho('unknown'), true);
    assert.equal(routeCausesEcho('headset'), false);
    assert.equal(routeCausesEcho('bluetooth'), false);
  });
});
